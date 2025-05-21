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

    // Create shareable content based on the method
    switch (shareMethod) {
      case 'gist':
        // For GitHub Gist sharing, we create an anonymous gist
        const gistPayload = {
          description: `Shared prompt: ${prompt.name}`,
          public: false,
          files: {
            [`${prompt.name}.prompt.md`]: {
              content: generateMarkdownContent(prompt)
            }
          }
        }

        try {
          const gistResponse = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Note: Using anonymous gist (no authentication)
            },
            body: JSON.stringify(gistPayload)
          })

          if (!gistResponse.ok) {
            throw new Error(`Failed to create gist: ${gistResponse.statusText}`)
          }

          const gistData = await gistResponse.json()
          return NextResponse.json({ 
            success: true, 
            shareMethod: 'gist',
            shareUrl: gistData.html_url 
          })
        } catch (gistError) {
          console.error('Error creating gist:', gistError)
          return NextResponse.json({ 
            error: 'Failed to create GitHub Gist' 
          }, { status: 500 })
        }

      default:
        // For other sharing methods, we generate content but don't need backend processing
        return NextResponse.json({ 
          success: true, 
          shareMethod,
          promptContent: generateMarkdownContent(prompt),
          promptName: prompt.name
        })
    }
  } catch (error) {
    console.error('Failed to share prompt:', error)
    return NextResponse.json({ error: 'Failed to share prompt' }, { status: 500 })
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