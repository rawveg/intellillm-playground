import { NextResponse } from 'next/server'
import { loadPrompt } from '@/lib/promptUtils'

/**
 * Export a prompt to GitHub Gist
 */
export async function POST(request: Request) {
  try {
    const { promptPath, isPublic = true } = await request.json()
    
    if (!promptPath) {
      return NextResponse.json({ error: 'Prompt path is required' }, { status: 400 })
    }

    // Get GitHub token from request headers
    const githubToken = request.headers.get('X-GitHub-Token')
    
    if (!githubToken) {
      return NextResponse.json({ error: 'GitHub token is required' }, { status: 401 })
    }

    // Load the prompt
    const prompt = await loadPrompt(promptPath)
    
    // Create file content similar to how it's stored locally
    let fileContent = `---
${JSON.stringify(prompt.metadata, null, 2)}
---

${prompt.content}`
    
    if (prompt.systemPrompt) {
      fileContent += `

## System Prompt
${prompt.systemPrompt}`
    }
    
    // Prepare the Gist creation payload
    const filename = `${prompt.name}.prompt`
    const payload = {
      description: `Prompt: ${prompt.name}`,
      public: isPublic,
      files: {
        [filename]: {
          content: fileContent
        }
      }
    }
    
    // Create the Gist using GitHub API
    const gistResponse = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!gistResponse.ok) {
      const errorText = await gistResponse.text()
      return NextResponse.json({ 
        error: `Failed to create Gist: ${gistResponse.status} ${gistResponse.statusText}`,
        details: errorText
      }, { status: gistResponse.status })
    }
    
    const gistData = await gistResponse.json()
    
    return NextResponse.json({
      success: true,
      gistId: gistData.id,
      gistUrl: gistData.html_url
    })
  } catch (error) {
    console.error('Failed to export to Gist:', error)
    return NextResponse.json({ error: 'Failed to export to Gist' }, { status: 500 })
  }
}