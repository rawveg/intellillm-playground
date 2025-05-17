<p align="center">
  <img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License: AGPL v3">
  <img src="https://img.shields.io/badge/Built%20With-Next.js-blue?logo=nextdotjs" alt="Built with Next.js">
  <img src="https://img.shields.io/badge/Docker-ready-blue?logo=docker" alt="Docker ready">
  <img src="https://img.shields.io/badge/Cloud%20Run-ready-brightgreen?logo=googlecloud" alt="Cloud Run ready">
</p>

<h1 align="center">IntelliLLM Playground</h1>

<p align="center">
  <b>A modern, extensible playground for prompt engineering and testing against OpenRouter-hosted LLMs.</b><br>
  <i>Beautiful UI, real-time web search augmentation, and seamless containerized deployment.</i>
</p>

---

## ✨ Features

- 🖥️ **Modern UI**: Multi-tab prompt editing, collapsible system prompt editor, and theme support (light/dark/system).
- 🤖 **LLM Integration**: Supports all OpenRouter models with dynamic per-prompt configuration.
- 📂 **Prompt Management**: Import/export prompts (with metadata), persistent model settings, and YAML frontmatter support.
- 🔄 **Prompt Parametrization**: Create template prompts with `{{ParameterName}}` syntax, which can be filled in at runtime via an intuitive modal interface.
- 🧠 **Web Search Augmentation**: 
  - Toggleable real-time web search via DuckDuckGo, with search terms auto-extracted by an LLM meta-prompt.
  - Injects up-to-date search snippets into LLM context for more relevant answers.
- 🐳 **Dockerized**: Easy to build, run, and deploy anywhere.
- ☁️ **Cloud Ready**: Single-container deployment to Google Cloud Run.
- 📝 **Markdown & JSON Rendering**: Tabbed result view with raw and rendered outputs.

---

## 🏗️ Architecture Overview

| Layer       | Technology/Notes                                        |
|-------------|--------------------------------------------------------|
| Frontend    | Next.js, React, TailwindCSS, Radix UI, Monaco Editor   |
| Backend API | Next.js API routes (TypeScript)                        |
| LLM Access  | OpenRouter API                                         |
| Web Search  | DuckDuckGo search via `@pikisoft/duckduckgo-search`    |
| Prompts     | Markdown files with YAML frontmatter (`/prompts`)      |
| Container   | Docker (multi-stage build)                             |

---

## 📦 Prompt File Format

Prompts are stored as Markdown files with YAML frontmatter for model/config metadata, followed by the user and system prompts.

```markdown
---
{
  "model": "anthropic/claude-2",
  "temperature": 0.7,
  "top_p": 0.9,
  "max_tokens": 4096,
  "presence_penalty": 0,
  "frequency_penalty": 0,
  "created": "2025-05-14T14:50:22.532Z"
}
---

Why is the sky blue?

## System Prompt
You are a scientific expert specializing in atmospheric physics. Explain concepts clearly and precisely, using technical language where appropriate.
```

### Prompt Parameters

You can use parameters in your prompts with the `{{ParameterName}}` syntax:

```markdown
---
{
  "model": "anthropic/claude-2",
  "temperature": 0.7
}
---

Tell me about the history of {{City}} in {{Country}}.
```

When you run a prompt with parameters:
1. A modal will appear for you to input values for each parameter
2. Previously used values are remembered for convenience
3. The original prompt template remains unchanged for future use

---

## 🚀 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/intellillm-playground.git
   cd intellillm-playground
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Access the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Usage

1. **Build the Docker image:**
   ```bash
   docker build -t intellillm-playground .
   ```
2. **Run the container:**
   ```bash
   docker run -p 3000:3000 -v /path/to/your/prompts:/app/prompts intellillm-playground
   ```
3. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deploy to Google Cloud Run

1. **Build and tag the Docker image:**
   ```bash
   docker build -t gcr.io/PROJECT_ID/intellillm-playground:latest .
   ```
2. **Push the image to Google Container Registry:**
   ```bash
   docker push gcr.io/PROJECT_ID/intellillm-playground:latest
   ```
3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy intellillm-playground \
     --image gcr.io/PROJECT_ID/intellillm-playground:latest \
     --platform managed \
     --region REGION \
     --allow-unauthenticated \
     --port 3000
   ```
   - Replace `PROJECT_ID` and `REGION` with your GCP project and region.
   - You can mount a Cloud Storage bucket as `/app/prompts` for persistent prompt storage if desired.

---

## 🛠️ API Reference (Key Endpoints)

| Endpoint                        | Method | Description                                      |
|---------------------------------|--------|--------------------------------------------------|
| `/api/prompts`                  | GET    | List all prompts                                 |
| `/api/prompts`                  | POST   | Save a new prompt                                |
| `/api/prompts/[name]`           | GET    | Get a specific prompt by name                    |
| `/api/prompts/[name]`           | DELETE | Delete a prompt by name                          |
| `/api/search`                   | POST   | Search DuckDuckGo and return snippets            |

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome! Please open an issue or submit a pull request.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## 📜 License

This project is licensed under the **GNU Affero General Public License v3.0**. See the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgements

- [OpenRouter](https://openrouter.ai/) for LLM access
- [DuckDuckGo](https://duckduckgo.com/) for search integration
- [@pikisoft/duckduckgo-search](https://www.npmjs.com/package/@pikisoft/duckduckgo-search)
- [Next.js](https://nextjs.org/), [React](https://react.dev/), [TailwindCSS](https://tailwindcss.com/)

<p align="center">
  <em>Made with ❤️ for prompt engineers and LLM enthusiasts.</em>
</p>
