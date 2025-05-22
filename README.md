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

## ✨ Features

- 🖥️ **Modern UI**: Multi-tab prompt editing, collapsible system prompt editor, and theme support (light/dark/system).
- 🤖 **LLM Integration**: Supports all OpenRouter models with dynamic per-prompt configuration.
- 📂 **Prompt Management**: Import/export prompts (with metadata), folder organization, drag-and-drop file management, filtering/sorting controls, persistent model settings, YAML frontmatter support, and GitHub Gist integration.
- ▶️ **Direct Execution**: Run prompts directly from the library with the Run button without opening them in tabs first.
- 📎 **File Attachments**: Upload images (PNG, JPEG, WebP) and documents (PDF) to include with your prompts.
- 🔄 **Prompt Parametrization**: Create template prompts with `{{ParameterName}}` syntax, which can be filled in at runtime via an intuitive modal interface.
- 🧠 **Web Search Augmentation**: 
  - Toggleable real-time web search via DuckDuckGo, with search terms auto-extracted by an LLM meta-prompt.
  - Injects up-to-date search snippets into LLM context for more relevant answers.
- 🐳 **Dockerized**: Easy to build, run, and deploy anywhere.
- ☁️ **Cloud Ready**: Single-container deployment to Google Cloud Run.
- 📝 **Markdown & JSON Rendering**: Tabbed result view with raw and rendered outputs.

---

## 🖥️ **Modern UI**: Multi-tab prompt editing, collapsible system prompt editor, and theme support (light/dark/system).

A user interface that is clear, simple, and optimized for developers. 

<img width="1291" alt="image" src="https://github.com/user-attachments/assets/fb96828c-fbb1-4628-ad63-998425290b35" />

## Prompt parameterisation 

The underlying prompt needs no modification to use:-

<img width="797" alt="image" src="https://github.com/user-attachments/assets/1bb730f5-1189-4eac-86b1-b479a992f686" />

With parameter values saved to local storage so that they can be re-used (or cleared) as required.

### Supported Parameter Field Types

The following parameter field types are fully implemented and available for use in prompt templates:

- **text**: Single-line text input (default)
- **multiline**: Multi-line textarea input
- **number**: Numeric input (supports min/max validation)
- **email**: Email address input (with validation)
- **url**: URL input (with validation)
- **date**: Date picker
- **time**: Time picker
- **month**: Month picker (supports formats: full, short, numeric, numeric-dd)
- **year**: Year picker (supports default, past-only, future-only, custom ranges)
- **checkbox**: Boolean toggle (or custom true/false options)
- **select**: Dropdown single selection (with custom options)
- **multiselect**: Checkbox group for multiple selections
- **radio**: Radio button group (single selection)

Each field type can be combined with validation rules and default values as described below. See examples for usage syntax.

## 📂 Prompt Library Organization

The Prompt Library offers comprehensive organization features to help you manage your growing collection of prompts:

### Folder Management

- **Create Folders**: Organize your prompts in a logical folder structure
- **Nested Folders**: Support for unlimited folder depth
- **Intuitive Navigation**: Browse folders with breadcrumb navigation (not tree-view based)
  - Root and current folder views
  - Click on breadcrumb segments to jump to specific folder levels

### Drag-and-Drop Organization

- **Intuitive File Movement**: Drag and drop prompts between folders
- **Visual Feedback**: Clear visual cues indicate valid drop targets
- **Folder-to-Folder**: Move prompts directly between folders
- **Bulk Operations**: Select and move multiple prompts simultaneously

### Advanced Filtering & Sorting

- **Text Filtering**: Quickly find prompts by typing in the filter box
- **Smart Sorting**: Sort your prompts by:
  - Name (A-Z or Z-A)
  - Creation date (newest or oldest first)
- **Directories First**: Folders always appear before files in the list for better organization

### GitHub Gist Integration

- **Export to GitHub Gists**: Share prompts as public or private Gists with a single click
- **Import from GitHub Gists**: Import prompts from public Gists by entering the URL
- **GitHub Authentication**: Use GitHub Personal Access Tokens for creating Gists

All organizational structures are mirrored in the filesystem, ensuring your prompt organization persists across sessions and deployments.

## Integrated Web Search (powered by DuckDuckGo)

A web search feature that works **without** function calling, allowing **any** model to use relevant results to enrich your prompt.

---

## 🏗️ Architecture Overview

| Layer         | Technology/Notes                                         |
|---------------|---------------------------------------------------------|
| **Frontend**  | Next.js, React, TailwindCSS, Radix UI, Monaco Editor    |
| **Backend**   | Next.js API routes (TypeScript)                         |
| **LLM Access**| OpenRouter API                                          |
| **Web Search**| DuckDuckGo search (`@pikisoft/duckduckgo-search`)       |
| **Prompts**   | Markdown files with YAML frontmatter (`/prompts`)       |
| **Container** | Docker (multi-stage build)                              |

---

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

---

## 🛠️ For Developers: Manual/Dev Server Setup

If you wish to contribute or run the app natively (not recommended for production):

```bash
# 1. Clone the repo
$ git clone https://github.com/rawveg/intellillm-playground.git
$ cd intellillm-playground

# 2. Install dependencies
$ npm install

# 3. Start the dev server
$ npm run dev

# 4. Open in your browser
$ open http://localhost:3000
```

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

## ▶️ Direct Prompt Execution

The Run button feature lets you execute prompts directly from the library:

1. **One-Click Execution**: Run prompts directly from the library view without opening them in tabs.
2. **Parameter Handling**: 
   - For prompts with parameters, a modal appears to collect parameter values.
   - Previously entered parameter values are remembered for convenience.
3. **Execution Feedback**: 
   - Visual loading indicator shows when a prompt is being executed.
   - Each prompt has its own execution state.
4. **Results Display**:
   - Results open in a modal with two tabs:
     - Text: Raw output with proper syntax highlighting
     - Markdown: Rendered markdown for better readability
   - Copy to clipboard button for easy sharing
   - Export as markdown file option

This feature streamlines the workflow for prompt engineers who frequently test and iterate on prompts.

## 📎 File Attachments

IntelliLLM Playground supports uploading files alongside your prompts:

### Supported File Types

- **Images**: PNG, JPEG, WebP
- **Documents**: PDF

### Usage

1. Click the image or document icon in the prompt editor toolbar
2. Select a file from your device
3. The file will be attached to your prompt and displayed below the editor
4. You can remove attached files by clicking the "X" button next to the file name
5. Files are included in API requests to the LLM

### Technical Implementation

- Images are sent as base64-encoded data in the `messages` array with type `image_url`
- Documents are included with type `file` in the appropriate format
- The UI clearly indicates which files are attached to each prompt

### Prompt Parameters

Prompt parameters transform your templates into interactive mini-applications. Use parameters in your prompts with the `{{ParameterName}}` syntax:

```markdown
---
{
  "model": "anthropic/claude-2",
  "temperature": 0.7
}
---
Tell me about the history of {{City}} in {{Country}}.
```

When you run a prompt containing parameters:
1. A modal appears for you to input values for each parameter
2. Previously used values are remembered for convenience
3. The original prompt template remains unchanged for future use

##### Year Selection

```markdown
{{Year|year}}                   # Default range (5 years back, 5 years forward)
{{Year|year-last-10}}           # Last 10 years including current year
{{Year|year-next-10}}           # Next 10 years including current year
{{Year|year:10-2}}              # Custom range (10 years back, 2 years forward)
```

##### File Parameter

```markdown
{{TextData|file}}               # File parameter that allows embedding text file contents in prompts
```

The `file` parameter type allows users to select and embed the contents of text files (.txt or .md) directly into the prompt. This is useful for including reference material, sample code, or other text-based content without manual copy/paste.

**Usage Example:**

```markdown
Analyze the following text and provide a summary:

{{Content|file}}

Focus on the main themes and key points.
```

**Security Restrictions:**
- Only text files (.txt) and markdown files (.md) are allowed
- File contents are read as plain text and embedded directly in the prompt
- Maximum file size is limited to 1MB
- Special characters are escaped to prevent prompt injection

##### Example with Multiple Parameter Types

```markdown
---
{
  "model": "anthropic/claude-2",
  "temperature": 0.7
}
---

Create a travel itinerary for {{Name}} visiting {{City|select:Paris,London,Tokyo,New York}} in {{Month|month}} {{Year|year}}.

Include the following activities: {{Activities|multiselect:Museums,Restaurants,Parks,Shopping,Nightlife}} <!-- Renders as a checkbox group for better usability -->

## System Prompt
You are a travel expert specializing in creating personalized itineraries. The traveler's name is {{Name}} and they are {{Age|number}} years old.
```

This optional parameter functionality allows you to create reusable prompt templates that can be customized at runtime without modifying the original template.

##### Parameter Validation

You can add validation rules to parameters using the syntax `{{ParameterName|fieldType|validationType:rules}}`. All validation is optional but provides better user experience.

```markdown
{{Name|text|string:min-3,max-100}}    # Text with length between 3 and 100 characters
{{Age|number|number:min-18,max-65}}   # Number between 18 and 65
{{Username|text|regexp:^[a-zA-Z0-9]+$}}  # Text matching a regular expression pattern
```

Validation types:
- `string`: Validates text length with `min-X` and `max-X` rules
- `number`: Validates numeric values with `min-X` and `max-X` rules
- `regexp`: Validates against a regular expression pattern

If validation fails, the user will see an error message and cannot submit the form until all validations pass.

##### Default Values for Parameters

You can specify default values for parameters using the `default:` syntax:

```markdown
{{Name|default:John}}                  # Text field with default value "John"
{{Age|number|default:30}}             # Number field with default value 30
{{Date|date|default:current}}         # Date field with current date as default
{{Time|time|default:current}}         # Time field with current time as default
{{Year|year|default:current}}         # Year field with current year as default
{{Month|month|default:current}}       # Month field with current month as default
{{Interests|multiselect:Sports,Music,Art|default:Sports,Art}}  # Multiselect with multiple default values
```

Special default values:
- `current`: For date, time, year, and month fields, sets the default to the current value

Default values can be combined with field types and validation rules in any order:

```markdown
{{Username|text|string:min-3,max-20|default:user123}}  # With validation
{{City|select:Paris,London,Tokyo|default:Paris}}       # With options
{{Name|default:Tim}}                                   # Simple default
{{Name|text|default:Tim}}                              # With field type
{{Name|text|string|default:Tim}}                       # With validation type
{{Name|text|string:min-3,max-100|default:Tim}}         # With validation rules
```

If a default value doesn't meet validation rules, it will be shown but marked as invalid when the parameter form opens.

##### Parameter System Capabilities

The parameter system offers over 200 possible combinations of field types, validation rules, and default values. This flexibility allows you to create sophisticated prompt templates that can handle a wide range of use cases while maintaining a clean, focused approach.

Some examples of what you can build:
- Form-like interfaces with validated inputs
- Date-aware templates that use the current date/time
- Multi-select options for complex preference gathering
- Templates with sensible defaults that can be overridden
- Text file inclusion for analyzing documents or code samples

##### 🚦 Parameter Guidelines & Limitations

> **Guidelines:**
> - *Recommended:* Max 12 parameters per prompt (UI switches to multi-column for >5)
> - All parameters are required and must have values before execution
> - Multiselect fields render as checkbox groups for usability (touch-friendly)

##### ⛔ Restrictions

> - **Nested parameters are not supported** and will result in an error

```markdown
# ✅ Good:
{{Param|select:Option1,Option2}}
# ❌ Not allowed:
{{Outer|{{Inner}}}}
```

---

## 🚀 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rawveg/intellillm-playground.git
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

## 🛠️ API Reference

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
