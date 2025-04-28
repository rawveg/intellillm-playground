import { NextResponse } from 'next/server'
import { listPrompts, savePrompt } from '@/lib/promptUtils'

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
    const { name, content, metadata } = await request.json()
    await savePrompt(name, content, metadata)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 })
  }
}
