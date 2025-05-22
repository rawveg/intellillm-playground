# API Reference

[← Back to Main README](../README.md) | [Features](./features.md) | [Installation](./installation.md) | [Parameters](./parameters.md) | [File Attachments](./file-attachments.md) | [Web Search](./web-search.md) | [Contributing](./contributing.md)

---

IntelliLLM Playground exposes several API endpoints for programmatic interaction with prompts, folders, search functionality, and GitHub Gist integration.

## Endpoints

| Endpoint                  | Method | Description                           |
|--------------------------|--------|---------------------------------------|
| `/api/prompts`           | GET    | List all prompts or folder contents   |
| `/api/prompts`           | POST   | Save a new prompt or create folder    |
| `/api/prompts/[name]`    | GET    | Get a specific prompt by name         |
| `/api/prompts/[name]`    | DELETE | Delete a prompt/folder by name        |
| `/api/prompts/[name]`    | PATCH  | Move a prompt/folder to new location  |
| `/api/search`            | POST   | Search DuckDuckGo and return snippets |
| `/api/gists/import`      | POST   | Import a prompt from a GitHub Gist    |
| `/api/gists/export`      | POST   | Export a prompt to a GitHub Gist      |

## Detailed API Documentation

### Prompt Management

#### List Prompts

```
GET /api/prompts
```

Query Parameters:
- `path` (optional): Path to list contents of (defaults to root)

Response:
```json
{
  "files": [
    {
      "name": "example-prompt.md",
      "type": "file",
      "path": "/example-prompt.md",
      "created": "2025-05-14T14:50:22.532Z"
    }
  ],
  "folders": [
    {
      "name": "my-folder",
      "type": "directory",
      "path": "/my-folder",
      "childCount": 3
    }
  ],
  "currentPath": "/"
}
```

#### Create Prompt or Folder

```
POST /api/prompts
```

Request Body (for prompt):
```json
{
  "name": "new-prompt.md",
  "path": "/optional/folder/path/",
  "content": "---\n{\n  \"model\": \"anthropic/claude-2\",\n  \"temperature\": 0.7\n}\n---\n\nMy prompt content\n\n## System Prompt\nSystem prompt content"
}
```

Request Body (for folder):
```json
{
  "name": "new-folder",
  "path": "/optional/parent/folder/path/",
  "isDirectory": true
}
```

Response:
```json
{
  "success": true,
  "path": "/optional/folder/path/new-prompt.md"
}
```

#### Get Prompt

```
GET /api/prompts/[name]
```

Path Parameters:
- `name`: Name of the prompt file (URL encoded)

Query Parameters:
- `path` (optional): Path to the prompt file (defaults to root)

Response:
```json
{
  "content": "---\n{\n  \"model\": \"anthropic/claude-2\",\n  \"temperature\": 0.7\n}\n---\n\nMy prompt content\n\n## System Prompt\nSystem prompt content",
  "name": "example-prompt.md",
  "path": "/example-prompt.md"
}
```

#### Delete Prompt or Folder

```
DELETE /api/prompts/[name]
```

Path Parameters:
- `name`: Name of the prompt file or folder (URL encoded)

Query Parameters:
- `path` (optional): Path to the prompt file or folder (defaults to root)

Response:
```json
{
  "success": true
}
```

#### Move Prompt or Folder

```
PATCH /api/prompts/[name]
```

Path Parameters:
- `name`: Name of the prompt file or folder (URL encoded)

Query Parameters:
- `path` (optional): Current path to the prompt file or folder (defaults to root)

Request Body:
```json
{
  "newPath": "/target/folder/path/"
}
```

Response:
```json
{
  "success": true,
  "newPath": "/target/folder/path/example-prompt.md"
}
```

### Web Search

```
POST /api/search
```

Request Body:
```json
{
  "query": "latest developments in quantum computing"
}
```

Response:
```json
{
  "results": [
    {
      "title": "Recent Advances in Quantum Computing",
      "snippet": "Researchers have achieved a new milestone in quantum error correction...",
      "url": "https://example.com/quantum-computing-news"
    },
    // Additional results...
  ]
}
```

### GitHub Gist Integration

#### Import from Gist

```
POST /api/gists/import
```

Request Body:
```json
{
  "url": "https://gist.github.com/username/gistid",
  "targetPath": "/optional/folder/path/"
}
```

Response:
```json
{
  "success": true,
  "path": "/optional/folder/path/imported-prompt.md"
}
```

#### Export to Gist

```
POST /api/gists/export
```

Request Body:
```json
{
  "path": "/path/to/prompt.md",
  "description": "My awesome prompt",
  "public": false,
  "token": "github_pat_..." // Optional, for authenticated gist creation
}
```

Response:
```json
{
  "success": true,
  "url": "https://gist.github.com/username/newgistid"
}
```

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server-side error

Error responses include a JSON body with details:

```json
{
  "error": "Error message describing what went wrong"
}
```
