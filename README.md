# IntelliLLM Playground

A lightweight, modern LLM playground for testing prompts against OpenRouter-hosted models.

## Features

- Modern, sleek interface with multi-tab prompt editing
- Support for all OpenRouter models with dynamic configuration
- System prompts support with collapsible editor
- Persistent model settings per prompt
- Export and import prompts with metadata
- Tabbed result view with raw text (supporting JSON highlighting) and rendered Markdown outputs
- Theme support (light/dark/system)
- Docker containerized for easy deployment

## Getting Started

1. Build the container:
```bash
docker build -t intellillm-playground .
```

2. Run the container:
```bash
docker run -p 3000:3000 -v /path/to/your/prompts:/app/prompts intellillm-playground
```

3. Open http://localhost:3000 in your browser

## Prompt File Format

Prompts are stored as markdown files with YAML frontmatter. The frontmatter contains model selection and configuration settings, while the content can include both a system prompt and user prompt:

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
