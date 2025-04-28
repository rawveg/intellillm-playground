# IntelliLLM Playground

A lightweight, modern LLM playground for testing prompts against OpenRouter-hosted models.

## Features

- Modern, sleek interface with multi-tab prompt editing
- Support for all OpenRouter models with dynamic configuration
- Export and import prompts with metadata
- Markdown and JSON rendering for outputs
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

Prompts are stored as markdown files with YAML frontmatter:

```markdown
---
model: anthropic/claude-2
temperature: 0.7
top_p: 0.9
created: 2025-04-28
tags: [example]
---

# Prompt Title

Your prompt content here...
```
