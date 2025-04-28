import { useEffect, useState } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import type { PromptFile } from '@/lib/promptUtils'

interface PromptLibraryProps {
  onPromptSelect: (prompt: PromptFile) => void
}

export function PromptLibrary({ onPromptSelect }: PromptLibraryProps) {
  const [prompts, setPrompts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/prompts')
      const data = await response.json()
      setPrompts(data.prompts)
      setError(null)
    } catch (err) {
      setError('Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }

  const loadPrompt = async (name: string) => {
    try {
      const response = await fetch(`/api/prompts/${name}`)
      const prompt = await response.json()
      onPromptSelect(prompt)
    } catch (err) {
      setError('Failed to load prompt')
    }
  }

  const deletePrompt = async (name: string) => {
    try {
      await fetch(`/api/prompts/${name}`, { method: 'DELETE' })
      loadPrompts() // Refresh the list
    } catch (err) {
      setError('Failed to delete prompt')
    }
  }

  if (loading) {
    return <div className="p-4">Loading prompts...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b dark:border-gray-800">
        <h2 className="text-lg font-semibold">Prompt Library</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a prompt to load or manage your saved prompts
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {prompts.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            No prompts saved yet
          </div>
        ) : (
          <div className="grid gap-4">
            {prompts.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
              >
                <button
                  className="flex items-center flex-1 text-left hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => loadPrompt(name)}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  <span>{name.replace('.prompt', '')}</span>
                </button>
                <button
                  className="p-1 hover:text-red-500 dark:hover:text-red-400"
                  onClick={() => deletePrompt(name)}
                  title="Delete prompt"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
