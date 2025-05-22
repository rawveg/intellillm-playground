# Feature Details

[← Back to Main README](../README.md) | [Installation](./installation.md) | [Parameters](./parameters.md) | [File Attachments](./file-attachments.md) | [Web Search](./web-search.md) | [API Reference](./api-reference.md) | [Contributing](./contributing.md)

---

A comprehensive overview of all features available in IntelliLLM Playground.

## 🖥️ Modern UI

IntelliLLM Playground offers a clean, intuitive interface optimized for prompt engineering:

- **Multi-tab Editing**: Work on multiple prompts simultaneously
- **Theme Support**: Light, dark, and system theme options
- **Collapsible System Prompt**: Toggle visibility of system prompts
- **Monaco Editor**: Powerful code editor with syntax highlighting

<img width="1291" alt="IntelliLLM Playground UI" src="https://github.com/user-attachments/assets/fb96828c-fbb1-4628-ad63-998425290b35" />

## 🤖 LLM Integration

- **OpenRouter Support**: Access to all models available through OpenRouter
- **Per-prompt Configuration**: Set different parameters for each prompt
- **Model Settings**: Control temperature, top_p, max_tokens, and more
- **Persistent Settings**: Model preferences are saved with each prompt

## 📂 Prompt Management

The Prompt Library offers comprehensive organization features to help you manage your growing collection of prompts:

### Folder Management

- **Create Folders**: Organize your prompts in a logical folder structure
- **Nested Folders**: Support for unlimited folder depth
- **Intuitive Navigation**: Browse folders with breadcrumb navigation
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

## ▶️ Direct Execution

The Run button feature lets you execute prompts directly from the library:

1. **One-Click Execution**: Run prompts directly from the library view without opening them in tabs
2. **Parameter Handling**: 
   - For prompts with parameters, a modal appears to collect parameter values
   - Previously entered parameter values are remembered for convenience
3. **Execution Feedback**: 
   - Visual loading indicator appears during prompt execution
   - Clear feedback on execution status
4. **Results Display**:
   - Results open in a modal with two tabs:
     - Text: Raw output with proper syntax highlighting
     - Markdown: Rendered markdown for better readability
   - Copy to clipboard button for easy sharing
   - Export as markdown file option
5. **Web Search Integration**:
   - When web search is enabled in the sidebar, the Run button uses the integrated web search capability
   - Makes prompts more powerful with up-to-date information from the web
   - Works with any model, no function calling required

## 🔄 Prompt Parametrization

Prompt parameters transform your templates into interactive mini-applications. Use parameters in your prompts with the `{{ParameterName}}` syntax.

<img width="797" alt="Parameter Example" src="https://github.com/user-attachments/assets/1bb730f5-1189-4eac-86b1-b479a992f686" />

See [Prompt Parameters](./parameters.md) for detailed information.

## 🧠 Web Search Augmentation

A web search feature that works **without** function calling, allowing **any** model to use relevant results to enrich your prompt.

- **Toggleable real-time web search** via DuckDuckGo
- **Search terms auto-extracted** by an LLM meta-prompt
- **Injects up-to-date search snippets** into LLM context for more relevant answers

See [Web Search Integration](./web-search.md) for detailed information.

## 📎 File Attachments

IntelliLLM Playground supports uploading files alongside your prompts:

- **Images**: PNG, JPEG, WebP
- **Documents**: PDF

See [File Attachments](./file-attachments.md) for detailed information.
