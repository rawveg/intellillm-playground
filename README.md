<p align="center">
  <img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License: AGPL v3">
  <img src="https://img.shields.io/badge/Built%20With-Next.js-blue?logo=nextdotjs" alt="Built with Next.js">
  <img src="https://img.shields.io/badge/Docker-ready-blue?logo=docker" alt="Docker ready">
  <img src="https://img.shields.io/badge/Cloud%20Run-ready-brightgreen?logo=googlecloud" alt="Cloud Run ready"><br />
  <img src="https://img.shields.io/badge/Focus-Hobbyists-orange" alt="Focus: Hobbyists">
  <img src="https://img.shields.io/badge/Focus-Software%20Engineers-orange" alt="Focus: Software Engineers">
  <img src="https://img.shields.io/badge/Focus-Prompt%20Engineers-orange" alt="Focus: Prompt Engineers">
  <img src="https://img.shields.io/badge/Focus-Data%20Scientists-orange" alt="Focus: Data Scientists">
</p>

<h1 align="center">IntelliLLM Playground</h1>

<p align="center">
  <b>A modern, extensible playground for prompt engineering and testing against OpenRouter-hosted LLMs.</b><br>
  <i>Beautiful UI, real-time web search augmentation, and seamless containerized deployment.</i>
</p>

---

## 🚀 What is IntelliLLM Playground?

IntelliLLM Playground is a powerful, modern tool for prompt engineers, data scientists, and developers to create, test, and refine prompts for large language models. With a beautiful UI and rich feature set, it helps you get the most out of your LLM interactions.

<img width="1291" alt="IntelliLLM Playground UI" src="https://github.com/user-attachments/assets/fb96828c-fbb1-4628-ad63-998425290b35" />

## ✨ Key Features

- 🖥️ **Modern UI**: Multi-tab prompt editing, collapsible system prompt editor, and theme support
- 🤖 **LLM Integration**: Supports all OpenRouter models with dynamic per-prompt configuration
- 📂 **Prompt Management**: Import/export prompts, folder organization, and GitHub Gist integration
- 🔄 **Prompt Parametrization**: Create template prompts with `{{ParameterName}}` syntax
- 🧠 **Web Search Augmentation**: Real-time web search for **all** models via DuckDuckGo for up-to-date information
- 📎 **File Attachments**: Upload images and documents to include with your prompts
- 🐳 **Dockerized**: Easy to build, run, and deploy anywhere

[See all features →](./docs/features.md)

## ⚡ Quickstart (Docker Recommended)

> **The fastest and most reliable way to use IntelliLLM Playground is via Docker.**

```bash
# 1. Clone the repo
$ git clone https://github.com/rawveg/intellillm-playground.git
$ cd intellillm-playground

# 2. Build the Docker image
$ docker build -t intellillm-playground .

# 3. Run the container (serves on port 3000)
$ docker run -p 3000:3000 -v /path/to/your/prompts:/app/prompts intellillm-playground
```

> **Tip:** Mount your prompt directory (`-v /path/to/your/prompts:/app/prompts`) for persistent prompt storage.

Open [http://localhost:3000](http://localhost:3000) in your browser.

[Alternative setup options →](./docs/installation.md)

## 🏗️ Architecture Overview

| Layer         | Technology/Notes                                         |
|---------------|---------------------------------------------------------|
| **Frontend**  | Next.js, React, TailwindCSS, Radix UI, Monaco Editor    |
| **Backend**   | Next.js API routes (TypeScript)                         |
| **LLM Access**| OpenRouter API                                          |
| **Web Search**| DuckDuckGo search (`@pikisoft/duckduckgo-search`)       |
| **Prompts**   | Markdown files with YAML frontmatter (`/prompts`)       |
| **Container** | Docker (multi-stage build)                              |

## 📚 Documentation

- [Feature Details](./docs/features.md)
- [Installation & Deployment](./docs/installation.md)
- [Prompt Parameters](./docs/parameters.md)
- [File Attachments](./docs/file-attachments.md)
- [Web Search Integration](./docs/web-search.md)
- [API Reference](./docs/api-reference.md)
- [Contributing](./docs/contributing.md)

## 📜 License

This project is licensed under the **GNU Affero General Public License v3.0**. See the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgements

- [OpenRouter](https://openrouter.ai/) for LLM access
- [DuckDuckGo](https://duckduckgo.com/) for search integration
- [@pikisoft/duckduckgo-search](https://www.npmjs.com/package/@pikisoft/duckduckgo-search)
- [Next.js](https://nextjs.org/), [React](https://react.dev/), [TailwindCSS](https://tailwindcss.com/)

<p align="center">
  <em>Made with ❤️ for prompt engineers and LLM enthusiasts.</em>
</p>
