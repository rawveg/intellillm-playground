import { useEffect, useState } from 'react'
import { FileText, Trash2, Folder, ChevronLeft, Plus, FolderPlus, Home } from 'lucide-react'
import type { PromptFile } from '@/lib/promptUtils'

interface PromptLibraryProps {
  onPromptSelect: (prompt: PromptFile) => void
}

interface FileEntry {
  name: string
  isDirectory: boolean
  path: string
}

export function PromptLibrary({ onPromptSelect }: PromptLibraryProps) {
  const [currentPath, setCurrentPath] = useState('')
  const [contents, setContents] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    loadContents(currentPath)
  }, [currentPath])

  const loadContents = async (dirPath: string) => {
    try {
      setLoading(true)
      const encodedPath = encodeURIComponent(dirPath)
      const response = await fetch(`/api/prompts?path=${encodedPath}`)
      const data = await response.json()
      
      setContents(data.contents || [])
      setError(null)
    } catch (err) {
      setError('Failed to load contents')
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath)
  }

  const navigateUp = () => {
    if (currentPath === '') return
    
    const pathParts = currentPath.split('/')
    pathParts.pop() // Remove the last part
    
    setCurrentPath(pathParts.join('/'))
  }

  const navigateHome = () => {
    setCurrentPath('')
  }

  const loadPrompt = async (filePath: string) => {
    try {
      const encodedPath = encodeURIComponent(filePath)
      const response = await fetch(`/api/prompts/${encodedPath}`)
      const prompt = await response.json()
      onPromptSelect(prompt)
    } catch (err) {
      setError('Failed to load prompt')
    }
  }

  const deleteItem = async (itemPath: string, isDirectory: boolean) => {
    if (isDirectory && !confirm('Delete this folder and all its contents?')) {
      return
    }

    try {
      const encodedPath = encodeURIComponent(itemPath)
      await fetch(`/api/prompts/${encodedPath}`, { method: 'DELETE' })
      loadContents(currentPath) // Refresh the list
    } catch (err) {
      setError(`Failed to delete ${isDirectory ? 'folder' : 'prompt'}`)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const folderPath = currentPath 
        ? `${currentPath}/${newFolderName.trim()}`
        : newFolderName.trim()

      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'folder', 
          path: folderPath
        })
      })

      // Reset and reload
      setNewFolderName('')
      setShowNewFolderInput(false)
      loadContents(currentPath)
    } catch (err) {
      setError('Failed to create folder')
    }
  }

  // Get the breadcrumb parts for navigation
  const getBreadcrumbs = () => {
    if (!currentPath) return []
    
    const parts = currentPath.split('/')
    return parts.map((part, index) => {
      const path = parts.slice(0, index + 1).join('/')
      return { name: part, path }
    })
  }

  if (loading) {
    return <div className="p-4">Loading contents...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Prompt Library</h2>
          <div className="flex space-x-2">
            <button
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={navigateHome}
              title="Go to root folder"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              title="Create new folder"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {showNewFolderInput && (
          <div className="flex items-center mt-2 mb-1">
            <input
              type="text"
              className="flex-1 p-1 border rounded-l dark:bg-gray-800 dark:border-gray-700"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <button
              className="p-1 border-t border-r border-b rounded-r bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={handleCreateFolder}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Breadcrumb navigation */}
        <div className="flex items-center mt-2 overflow-x-auto whitespace-nowrap text-sm">
          <button 
            className="text-blue-600 dark:text-blue-400 hover:underline"
            onClick={navigateHome}
          >
            root
          </button>
          
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center">
              <span className="mx-1">/</span>
              <button 
                className="text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => navigateToFolder(crumb.path)}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {currentPath && (
          <div className="mb-4">
            <button
              className="flex items-center p-2 text-blue-600 dark:text-blue-400 hover:underline"
              onClick={navigateUp}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Go up one level
            </button>
          </div>
        )}
        
        {contents.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            This folder is empty
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Display folders first */}
            {contents
              .sort((a, b) => {
                // Sort directories first, then alphabetically
                if (a.isDirectory && !b.isDirectory) return -1
                if (!a.isDirectory && b.isDirectory) return 1
                return a.name.localeCompare(b.name)
              })
              .map((item) => (
                <div
                  key={item.path}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
                >
                  <button
                    className="flex items-center flex-1 text-left hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => item.isDirectory ? navigateToFolder(item.path) : loadPrompt(item.path)}
                  >
                    {item.isDirectory ? (
                      <Folder className="w-5 h-5 mr-2 text-yellow-500" />
                    ) : (
                      <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    )}
                    <span>{item.name}</span>
                  </button>
                  <button
                    className="p-1 hover:text-red-500 dark:hover:text-red-400"
                    onClick={() => deleteItem(item.path, item.isDirectory)}
                    title={`Delete ${item.isDirectory ? 'folder' : 'prompt'}`}
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
