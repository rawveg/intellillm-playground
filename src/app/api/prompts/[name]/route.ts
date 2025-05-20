import { NextResponse } from 'next/server'
import { loadPrompt, deleteItem, isDirectory } from '@/lib/promptUtils'

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    // Decode the name parameter which might contain slashes for paths
    const decodedName = decodeURIComponent(params.name)
    
    const prompt = await loadPrompt(decodedName)
    return NextResponse.json(prompt)
  } catch (error) {
    console.error('Failed to load prompt:', error)
    return NextResponse.json({ error: 'Failed to load prompt' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    // Decode the name parameter
    const decodedName = decodeURIComponent(params.name)
    
    await deleteItem(decodedName)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
