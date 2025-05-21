import { NextResponse } from 'next/server'
import { savePrompt } from '@/lib/promptUtils'
import { extractGistIdFromUrl } from '@/lib/gistUtils'

/**
 * Import a prompt from GitHub Gist
 */
export async function POST(request: Request) {
  try {
    const { gistUrl } = await request.json()

    if (!gistUrl) {
      return NextResponse.json({ error: 'Gist URL is required' }, { status: 400 })
    }
    
    // Extract the Gist ID from URL
    const gistId = extractGistIdFromUrl(gistUrl)
    
    if (!gistId) {
      return NextResponse.json({ error: 'Invalid Gist URL' }, { status: 400 })
    }

    // Fetch the Gist content
    const gistResponse = await fetch(`https://api.github.com/gists/${gistId}`)
    
    if (!gistResponse.ok) {
      return NextResponse.json({ 
        error: gistResponse.status === 404 ? 
          'Gist not found or is private' : 
          `Failed to fetch Gist: ${gistResponse.statusText}` 
      }, { status: gistResponse.status })
    }
    
    const gistData = await gistResponse.json()
    
    // Find the first file with a .prompt extension, or just the first file if none have that extension
    const fileNames = Object.keys(gistData.files)
    const promptFileName = fileNames.find(name => name.endsWith('.prompt')) || fileNames[0]
    
    if (!promptFileName) {
      return NextResponse.json({ error: 'No files found in the Gist' }, { status: 400 })
    }
    
    const fileContent = gistData.files[promptFileName].content
    
    // Parse the prompt file content
    const [, frontmatter, promptContent] = fileContent.split('---')
    
    if (!frontmatter || !promptContent) {
      return NextResponse.json({ error: 'Invalid prompt file format' }, { status: 400 })
    }
    
    // Split content by system prompt marker if it exists
    const [userPrompt, systemPrompt] = promptContent.split('## System Prompt').map(s => s.trim())
    
    // Get metadata
    let metadata
    try {
      metadata = JSON.parse(frontmatter)
    } catch (e) {
      // If JSON parsing fails, set default metadata
      metadata = { 
        created: new Date().toISOString(),
        model: 'default',
        imported: true,
        importedFrom: 'github-gist',
        gistId,
        gistOwner: gistData.owner?.login || 'unknown'
      }
    }
    
    // Get name from filename or description
    const name = promptFileName.replace(/\.prompt$/, '') || 'Imported Prompt'
    
    // Save the prompt
    await savePrompt(name, userPrompt, metadata, systemPrompt)
    
    return NextResponse.json({ 
      success: true, 
      name,
      path: name
    })
  } catch (error) {
    console.error('Failed to import from Gist:', error)
    return NextResponse.json({ error: 'Failed to import from Gist' }, { status: 500 })
  }
}