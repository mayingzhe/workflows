# DifyHub Workflows

[A community-driven library of ready-to-use workflows for Dify.](https://dify.ai)
<br />
Find, share, and submit your Dify DSL workflows here.
<br />
<br />
Powered by [**DifyHub.com**](https://difyhub.com) — The best place to browse and deploy Dify workflows.
<br />
<br />
[**中文文档 (Chinese README)**](https://github.com/difyhub/workflows/blob/main/README_CN.md)

---

## What is DifyHub?

DifyHub is an open-source community and platform for Dify workflows. This repository stores all the DSL files and metadata for the workflows showcased on [DifyHub.com](https://difyhub.com) (coming soon!).

Our goal is to create a central hub where anyone can find high-quality, battle-tested workflows to supercharge their Dify applications, saving you hours of building from scratch.

## 📚 Workflow Catalog

Click any title below to jump straight into that workflow's README for setup instructions, diagrams, and screenshots.

### Data Analysis

| Workflow | Description |
| --- | --- |
| [Smart Chart Generator (EN)](data-analysis/smart-chart-generator-en/README.md) | Upload Excel/CSV datasets and automatically turn them into interactive ECharts dashboards via DeepSeek Coder. |
| [智能图表生成助手 (Smart Chart Generator, CN)](data-analysis/smart-chart-generator-cn/README.md) | 中文版图表生成专家，上传表格即可产出可交互的 ECharts HTML 页面。 |
| [Text-to-SQL Data Analyst (EN)](data-analysis/text-to-sql-en/README.md) | Converts natural-language questions into SQL, hits your database through an HTTP API, and returns ECharts-backed insights. |
| [Text-to-SQL 数据分析师 (CN)](data-analysis/text-to-sql-cn/README.md) | 中文版 Text-to-SQL 模板，自动生成 SQL、调用自建 API，并输出图表化分析。 |

### Text Processing

| Workflow | Description |
| --- | --- |
| [Basic Text Summarizer (EN)](text-processing/basic-text-summarizer-en/README.md) | Beginner-friendly workflow that condenses any long passage into a concise English summary. |
| [基础文本摘要器 (CN)](text-processing/basic-text-summarizer-cn/README.md) | 中文摘要工作流，输入段落即可生成精炼摘要结果。 |

### Image Generation

| Workflow | Description |
| --- | --- |
| [FLUX Painting Robot (EN)](image-generation/flux-painter-en/README.md) | Turns English prompts into polished Flux.1 instructions, runs a Python tool, and generates images via SiliconFlow. |
| [FLUX 绘画机器人 (CN)](image-generation/flux-painter-cn/README.md) | 中文输入 + Qwen 提示词优化 + SiliconFlow FLUX.1-schnell 出图的完整链路。 |

### Vision

| Workflow | Description |
| --- | --- |
| [Image Recognition (EN)](vision/image-recognition-en/README.md) | Send in an image and let Qwen2.5-VL-32B describe it in English via SiliconFlow. |
| [图片识别 (CN)](vision/image-recognition-cn/README.md) | 使用中文提示词和 Qwen2.5-VL-32B，对上传图片生成准确的中文描述。 |

## 🚀 How to Use

1.  **Browse** the `/workflows` directory to find a workflow you need.
2.  **Open** the `workflow.dsl` file.
3.  **Copy** the raw JSON/YAML content and import it into your Dify application.
4.  **(Coming Soon)** Browse, search, and preview all workflows visually on [DifyHub.com](https://difyhub.com)!

## 💡 How to Contribute (We Need You!)

We welcome all contributions! If you have built a useful Dify workflow, please share it with the community.

**Please read our contribution guidelines before submitting a PR:**

* **[CONTRIBUTING.md (English Guide)](CONTRIBUTING.md)**
* **[CONTRIBUTING_CN.md (中文指南)](CONTRIBUTING_CN.md)**

## License

All workflows in this repository are licensed under the **[MIT License](LICENSE)**.
