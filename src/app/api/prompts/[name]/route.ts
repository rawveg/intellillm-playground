import { NextResponse } from 'next/server'
import { loadPrompt, deletePrompt } from '@/lib/promptUtils'

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const prompt = await loadPrompt(params.name)
    return NextResponse.json(prompt)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load prompt' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    await deletePrompt(params.name)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 })
  }
}
