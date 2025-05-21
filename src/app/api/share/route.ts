import { NextResponse } from 'next/server'
import { loadPrompt } from '@/lib/promptUtils'

export async function POST(request: Request) {
  try {
    const { promptPath, shareMethod } = await request.json()
    
    if (!promptPath) {
      return NextResponse.json({ error: 'Prompt path is required' }, { status: 400 })
    }

    // Decode the prompt path which might contain slashes
    const decodedPath = decodeURIComponent(promptPath)
    
    // Load the prompt content
    const prompt = await loadPrompt(decodedPath)
    
    // Generate shareable content
    const markdownContent = generateMarkdownContent(prompt)
    const plainTextContent = generatePlainTextContent(prompt)

    // Create shareable content based on the method
    switch (shareMethod) {
      case 'gist':
        try {
          // For GitHub Gist sharing, we create an anonymous gist
          const gistPayload = {
            description: `Shared prompt: ${prompt.name}`,
            public: true, // Make it public so others can view it
            files: {
              [`${prompt.name}.prompt.md`]: {
                content: markdownContent
              }
            }
          }

          const gistResponse = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Using anonymous gist (no authentication)
            },
            body: JSON.stringify(gistPayload),
            // Add a short timeout since this is likely to fail in local environments
            signal: AbortSignal.timeout(5000)
          })

          if (!gistResponse.ok) {
            throw new Error(`Failed to create gist: ${gistResponse.statusText}`)
          }

          const gistData = await gistResponse.json()
          return NextResponse.json({ 
            success: true, 
            shareMethod: 'gist',
            shareUrl: gistData.html_url,
            markdownContent,
            plainTextContent,
            promptName: prompt.name
          })
        } catch (gistError: any) {
          console.error('Error creating gist:', gistError)
          
          // Return content even if gist creation fails
          return NextResponse.json({ 
            error: gistError.message || 'Failed to create GitHub Gist',
            markdownContent,
            plainTextContent,
            promptName: prompt.name
          }, { status: 500 })
        }

      default:
        // For other sharing methods, we generate content but don't need backend processing
        return NextResponse.json({ 
          success: true, 
          shareMethod,
          markdownContent,
          plainTextContent,
          promptName: prompt.name
        })
    }
  } catch (error: any) {
    console.error('Failed to share prompt:', error)
    return NextResponse.json({ error: error.message || 'Failed to share prompt' }, { status: 500 })
  }
}

// Helper function to generate markdown content for the prompt
function generateMarkdownContent(prompt: any): string {
  let content = `# ${prompt.name}\n\n`;
  
  // Add metadata as frontmatter
  content += '```yaml\n---\n';
  for (const [key, value] of Object.entries(prompt.metadata)) {
    content += `${key}: ${JSON.stringify(value)}\n`;
  }
  content += '---\n```\n\n';
  
  // Add user prompt
  content += `## User Prompt\n\n${prompt.content}\n\n`;
  
  // Add system prompt if present
  if (prompt.systemPrompt) {
    content += `## System Prompt\n\n${prompt.systemPrompt}\n`;
  }
  
  // Add source information
  content += '\n---\n*Shared from IntelliLLM Playground*';
  
  return content;
}

// Helper function to generate plain text content for the prompt
function generatePlainTextContent(prompt: any): string {
  let content = `Prompt: ${prompt.name}\n\n`;
  
  // Add user prompt
  content += `USER PROMPT:\n${prompt.content}\n\n`;
  
  // Add system prompt if present
  if (prompt.systemPrompt) {
    content += `SYSTEM PROMPT:\n${prompt.systemPrompt}\n\n`;
  }
  
  return content;
}