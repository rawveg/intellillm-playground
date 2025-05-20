import { NextResponse } from 'next/server'
import { listContents, createFolder } from '@/lib/promptUtils'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const dirPath = url.searchParams.get('path') || ''
    
    const contents = await listContents(decodeURIComponent(dirPath))
    return NextResponse.json({ contents })
  } catch (error) {
    console.error('Failed to list contents:', error)
    return NextResponse.json({ error: 'Failed to list contents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (data.type === 'folder') {
      // Create a new folder
      await createFolder(data.path)
      return NextResponse.json({ success: true, type: 'folder' })
    } else {
      // Save a prompt
      const { name, content, systemPrompt, metadata } = data
      
      const promptsDir = path.join(process.cwd(), 'prompts')
      const fileName = path.join(promptsDir, `${name}.prompt`)
      
      // Build file content with system prompt if present
      let fileContent = `---
${JSON.stringify(metadata, null, 2)}
---

${content}`
      
      if (systemPrompt) {
        fileContent += `

## System Prompt
${systemPrompt}`
      }
      
      // Ensure parent directories exist
      await createFolder(path.dirname(name))
      
      await writeFile(fileName, fileContent, 'utf-8')
      
      return NextResponse.json({ success: true, type: 'prompt' })
    }
  } catch (error) {
    console.error('Failed to save item:', error)
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 })
  }
}
