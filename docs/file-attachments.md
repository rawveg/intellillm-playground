# File Attachments

[← Back to Main README](../README.md) | [Features](./features.md) | [Installation](./installation.md) | [Parameters](./parameters.md) | [Web Search](./web-search.md) | [API Reference](./api-reference.md) | [Contributing](./contributing.md)

---

IntelliLLM Playground supports uploading files alongside your prompts to enhance your interactions with LLMs that have multimodal capabilities.

## Supported File Types

- **Images**: 
  - PNG
  - JPEG
  - WebP
- **Documents**: 
  - PDF

## Usage

1. **Attaching Files**:
   - Click the image or document icon in the prompt editor toolbar
   - Select a file from your device
   - The file will be attached to your prompt and displayed below the editor

2. **Managing Attachments**:
   - You can remove attached files by clicking the "X" button next to the file name
   - Files are included in API requests to the LLM
   - The UI clearly indicates which files are attached to each prompt

3. **Using Attachments in Prompts**:
   - Reference attached images or documents in your prompt text
   - For example: "Analyze the image I've attached and describe what you see."
   - The LLM will receive both your text prompt and the attached files

## Technical Implementation

- **Images**: Sent as base64-encoded data in the `messages` array with type `image_url`
- **Documents**: Included with type `file` in the appropriate format
- **Size Limits**: 
  - Images: Maximum size of 10MB
  - Documents: Maximum size of 25MB

## Best Practices

1. **Image Quality**:
   - Use clear, high-quality images for best results
   - Crop images to focus on relevant content
   - Consider image resolution and file size

2. **Document Handling**:
   - PDFs work best when they contain searchable text rather than scanned images
   - For multi-page documents, consider referencing specific pages in your prompt

3. **Prompt Design**:
   - Be specific about what you want the LLM to focus on in attached files
   - For images, specify if you want detailed descriptions, analysis of specific elements, or other outputs
   - For documents, clarify if you want summaries, specific information extraction, or analysis

## Limitations

- File attachments do not persist between sessions
- Some models may have limitations on how they process certain file types
- Very large or complex files may not be processed effectively by all models
