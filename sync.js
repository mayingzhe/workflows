'use strict'

const fs = require('node:fs/promises')
const path = require('node:path')
const yaml = require('js-yaml')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EVENT_PATH = process.env.GITHUB_EVENT_PATH

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

async function loadEventFiles() {
  if (!EVENT_PATH) {
    console.warn('GITHUB_EVENT_PATH is not defined. Falling back to empty change set.')
    return []
  }

  try {
    const raw = await fs.readFile(EVENT_PATH, 'utf8')
    const event = JSON.parse(raw)

    const files = new Set()

    const commits = Array.isArray(event.commits) ? event.commits : []
    for (const commit of commits) {
      for (const filePath of [...(commit.added || []), ...(commit.modified || [])]) {
        files.add(filePath)
      }
    }

    // Also include head_commit just in case commits array is empty (e.g., squash merge)
    if (event.head_commit) {
      for (const filePath of [
        ...(event.head_commit.added || []),
        ...(event.head_commit.modified || []),
      ]) {
        files.add(filePath)
      }
    }

    if (files.size > 0) {
      console.log(`Detected changed files from event payload (${files.size}):`, Array.from(files))
    }

    return Array.from(files)
  } catch (error) {
    console.error('Failed to parse event payload:', error)
    return []
  }
}

async function readWorkflowDirectory(githubPath) {
  const directory = path.join(process.cwd(), githubPath)

  const workflowYmlPath = path.join(directory, 'workflow.yml')
  const readmePath = path.join(directory, 'README.md')

  const exists = async (fp) =>
    fs
      .access(fp)
      .then(() => true)
      .catch(() => false)

  if (!(await exists(workflowYmlPath)) || !(await exists(readmePath))) {
    console.log(`Skipping ${githubPath} because workflow.yml or README.md is missing.`)
    return null
  }

  const ymlContent = await fs.readFile(workflowYmlPath, 'utf8')
  const dslContent = yaml.load(ymlContent)

  const readmeContent = await fs.readFile(readmePath, 'utf8')

  const nameMatch = readmeContent.match(/^#\s+(.+)$/m)
  const authorMatch = readmeContent.match(/\*\*Author:\*\*\s*`?([A-Za-z0-9-_]+)`?/i)
  const tagsLineMatch = readmeContent.match(/^\*\*Tags:\*\*\s*(.+)$/im)
  let tags = []
  if (tagsLineMatch) {
    const tagsLine = tagsLineMatch[1]
    const inlineMatches = Array.from(tagsLine.matchAll(/`([^`]+)`/g)).map((match) => match[1])
    if (inlineMatches.length > 0) {
      tags = inlineMatches
    } else {
      tags = tagsLine
        .split(',')
        .map((tag) => tag.replace(/\*\*/g, '').trim())
        .filter(Boolean)
    }
  }

  if (tags.length === 0) {
    console.warn(`No tags found in README.md for ${githubPath}`)
  }

  const language = tags.find((tag) => tag.toLowerCase().startsWith('language:')) || null

  const description = (() => {
    const lines = readmeContent.split(/\r?\n/)
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue
      if (line.startsWith('#')) continue
      if (line.startsWith('**')) continue
      if (line.startsWith('![')) continue
      if (line.startsWith('- ')) continue
      if (line.startsWith('* ')) continue
      return line
    }
    return null
  })()

  const graphNodes =
    (dslContent &&
      dslContent.workflow &&
      dslContent.workflow.graph &&
      Array.isArray(dslContent.workflow.graph.nodes)
        ? dslContent.workflow.graph.nodes
        : []) || []

  const llmModels = Array.from(
    new Set(
      graphNodes
        .filter((node) => node?.data?.type === 'llm' && node.data.model && node.data.model.name)
        .map((node) => node.data.model.name.trim())
        .filter(Boolean),
    ),
  )

  const toolNodeTypes = new Set(['http-request', 'code', 'rag-retrieval', 'database-query', 'dataset-query'])
  const toolsUsed = Array.from(
    new Set(
      graphNodes
        .filter((node) => node?.data?.type && toolNodeTypes.has(node.data.type))
        .map((node) => node.data.type)
        .filter(Boolean),
    ),
  )

  const data = {
    name: nameMatch ? nameMatch[1].trim() : githubPath.split('/').pop(),
    github_path: githubPath,
    author_github: authorMatch ? authorMatch[1].trim() : null,
    tags,
    language,
    dify_version: dslContent?.version ?? null,
    llm_models: llmModels.length > 0 ? llmModels : null,
    tools_used: toolsUsed.length > 0 ? toolsUsed : null,
    published_at: new Date().toISOString(),
    description,
    readme_content: readmeContent,
    yml_content: ymlContent,
    dsl_content: dslContent,
    image_workflow_url: `https://raw.githubusercontent.com/difyhub/workflows/main/${githubPath}/screenshot-workflow.png`,
    image_run_url: `https://raw.githubusercontent.com/difyhub/workflows/main/${githubPath}/screenshot-run.png`,
    status: 'published',
  }

  return data
}

async function main() {
  const changedFiles = await loadEventFiles()

  let filesToProcess = changedFiles

  if (filesToProcess.length === 0) {
    try {
      const { execSync } = require('node:child_process')
      const diff = execSync('git diff --name-only HEAD^ HEAD', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      })
      filesToProcess = diff
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      if (filesToProcess.length > 0) {
        console.log(`Fallback diff detected changed files (${filesToProcess.length}):`, filesToProcess)
      }
    } catch (error) {
      console.error('Failed to compute git diff against HEAD^:', error)
    }
  }

  if (filesToProcess.length === 0) {
    console.log('No workflow changes detected. Skipping sync.')
    return
  }

  const directories = Array.from(
    new Set(
      filesToProcess
        .map((file) => {
          const parts = file.split('/')
          if (parts.length < 2) return null
          return parts.slice(0, parts.length - 1).join('/')
        })
        .filter(Boolean),
    ),
  )

  if (directories.length === 0) {
    console.log('No workflow directories detected after filtering. Skipping sync.')
    return
  }

  console.log('Detected workflow directories:', directories)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  for (const directory of directories) {
    const githubPath = directory
    try {
      const dataToUpsert = await readWorkflowDirectory(githubPath)
      if (!dataToUpsert) {
        continue
      }
      console.log(`Upserting workflow: ${githubPath}`)

      const { error } = await supabase.from('workflows').upsert(dataToUpsert, {
        onConflict: 'github_path',
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error(`Failed to process ${githubPath}:`, error)
      process.exitCode = 1
    }
  }
}

main().catch((error) => {
  console.error('Unexpected error during sync:', error)
  process.exit(1)
})
