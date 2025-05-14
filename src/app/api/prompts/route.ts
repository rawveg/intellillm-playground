import { NextResponse } from 'next/server'
import { listPrompts, savePrompt } from '@/lib/promptUtils'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const prompts = await listPrompts()
    return NextResponse.json({ prompts })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list prompts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, content, systemPrompt, metadata } = await request.json()
    
    const promptsDir = '/app/prompts'
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
    
    await writeFile(fileName, fileContent, 'utf-8')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save prompt:', error)
    return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 })
  }
}
