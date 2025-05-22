# Web Search Integration

[← Back to Main README](../README.md) | [Features](./features.md) | [Installation](./installation.md) | [Parameters](./parameters.md) | [File Attachments](./file-attachments.md) | [API Reference](./api-reference.md) | [Contributing](./contributing.md)

---

IntelliLLM Playground includes a powerful web search feature that works with any model, providing up-to-date information without requiring function calling capabilities.

## How It Works

The web search integration follows these steps:

1. **Query Extraction**: When enabled, an LLM meta-prompt automatically extracts search terms from your prompt
2. **Search Execution**: DuckDuckGo search is performed using the extracted terms
3. **Context Augmentation**: Search results are processed and injected into the LLM context
4. **Enhanced Response**: The LLM uses both your original prompt and the search results to generate a more informed response

This approach allows **any** model to leverage web search results, even those without function calling capabilities.

## Key Features

- **Toggleable**: Enable or disable web search from the sidebar
- **Automatic Query Extraction**: No need to manually specify search terms
- **Transparent Integration**: Search results are seamlessly incorporated into the context
- **Model Agnostic**: Works with any LLM, regardless of capabilities
- **Up-to-date Information**: Access to recent information beyond the model's training data

## Configuration Options

The web search feature has a simple configuration:

- **Enable/Disable**: Toggle web search on or off from the sidebar

## Usage Examples

### General Knowledge Queries

```markdown
What are the latest developments in quantum computing?
```
The system will extract search terms like "latest developments quantum computing" and include recent information in the response.

### Current Events

```markdown
Explain the impact of the most recent Federal Reserve interest rate decision.
```
The system will search for recent Federal Reserve decisions and provide up-to-date analysis.

### Technical Information

```markdown
What are the key features in the latest version of TensorFlow?
```
The system will search for the most recent TensorFlow release information and include it in the response.

## Implementation Details

The web search feature is powered by:

- **DuckDuckGo Search API**: Via the `@pikisoft/duckduckgo-search` package
- **Search Extraction**: A specialized meta-prompt analyzes your input to determine optimal search terms
- **Context Integration**: Search results are formatted and injected into the prompt in a way that encourages the LLM to use them naturally

## Best Practices

1. **Be Specific**: More specific prompts lead to better search term extraction
2. **Check Recency**: For time-sensitive queries, include words like "latest," "recent," or "current"
3. **Verify Information**: While the search feature provides recent information, always verify critical facts
4. **Combine with Parameters**: Use prompt parameters to create dynamic search-enabled templates
