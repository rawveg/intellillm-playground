'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, Folder, Home, Save, FolderPlus, AlertCircle } from 'lucide-react'

interface SaveAsModalProps {
  initialPath: string
  initialName: string
  onSave: (path: string) => void
  onCancel: () => void
}

interface FileEntry {
  name: string
  isDirectory: boolean
  path: string
  created?: string // Optional created timestamp
}

export function SaveAsModal({ initialPath, initialName, onSave, onCancel }: SaveAsModalProps) {
  const [currentPath, setCurrentPath] = useState('')
  const [promptName, setPromptName] = useState(initialName || '')
  const [contents, setContents] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderError, setFolderError] = useState<string | null>(null)

  // Extract initial directory path and filename from initialPath
  useEffect(() => {
    if (initialPath) {
      const pathParts = initialPath.split('/')
      const name = pathParts.pop() || ''
      const dirPath = pathParts.join('/')
      
      setCurrentPath(dirPath)
      setPromptName(name)
    } else {
      setPromptName(initialName || '')
    }
  }, [initialPath, initialName])

  // Load contents when currentPath changes
  useEffect(() => {
    loadContents(currentPath)
  }, [currentPath])

  const loadContents = async (dirPath: string) => {
    try {
      setLoading(true)
      const encodedPath = encodeURIComponent(dirPath)
      const response = await fetch(`/api/prompts?path=${encodedPath}`)
      
      if (!response.ok) {
        throw new Error('Failed to load contents')
      }
      
      const data = await response.json()
      
      setContents(data.contents || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load contents:', err)
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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setFolderError('Folder name cannot be empty')
      return
    }

    // Basic validation for folder name
    if (/[<>:"\/\\|?*]/.test(newFolderName)) {
      setFolderError('Folder name contains invalid characters')
      return
    }

    try {
      const folderPath = currentPath 
        ? `${currentPath}/${newFolderName.trim()}`
        : newFolderName.trim()

      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'folder', 
          path: folderPath
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create folder')
      }

      // Reset and reload
      setNewFolderName('')
      setShowNewFolderInput(false)
      setFolderError(null)
      loadContents(currentPath)
    } catch (err: any) {
      console.error('Failed to create folder:', err)
      setFolderError(err.message || 'Failed to create folder')
    }
  }

  const handleSave = async () => {
    if (!promptName.trim()) return
    
    // Validate filename
    if (/[<>:"\\|?*]/.test(promptName)) {
      setError('File name contains invalid characters')
      return
    }

    setSaving(true)
    
    const fullPath = currentPath 
      ? `${currentPath}/${promptName.trim()}`
      : promptName.trim()
      
    // Check if file already exists
    const fileExists = contents.some(item => 
      !item.isDirectory && 
      item.name.toLowerCase() === promptName.trim().toLowerCase()
    )
    
    if (fileExists) {
      const confirmOverwrite = window.confirm('A prompt with this name already exists. Do you want to overwrite it?')
      if (!confirmOverwrite) {
        setSaving(false)
        return
      }
    }
    
    onSave(fullPath)
  }

  const getBreadcrumbs = () => {
    if (!currentPath) return []
    
    const parts = currentPath.split('/')
    return parts.map((part, index) => {
      const path = parts.slice(0, index + 1).join('/')
      return { name: part, path }
    })
  }

  const breadcrumbs = getBreadcrumbs()
  
  // Filter contents to show only directories
  const directories = contents.filter(item => item.isDirectory)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Save Prompt As</h2>
          <button 
            type="button" 
            onClick={onCancel} 
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Path navigation */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <button
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 mr-2"
              onClick={navigateHome}
              title="Go to root folder"
            >
              <Home className="w-5 h-5" />
            </button>
            
            <div className="flex items-center flex-wrap overflow-x-auto whitespace-nowrap text-sm">
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
          
          <button
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setShowNewFolderInput(!showNewFolderInput)}
            title="Create new folder"
          >
            <FolderPlus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Folder creation input */}
        {showNewFolderInput && (
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="text"
                className="flex-1 p-2 border rounded-l dark:bg-gray-700 dark:border-gray-600"
                placeholder="New folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <button
                className="px-3 py-2 border-t border-r border-b rounded-r bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                onClick={handleCreateFolder}
              >
                Create
              </button>
            </div>
            {folderError && (
              <div className="mt-1 text-red-500 text-xs">
                {folderError}
              </div>
            )}
          </div>
        )}

        {/* Directory listing */}
        <div className="border rounded-lg overflow-hidden mb-4 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          ) : directories.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No folders in this directory
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {currentPath && (
                <div 
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={navigateUp}
                >
                  <div className="flex items-center">
                    <ChevronLeft className="w-5 h-5 mr-2 text-gray-500" />
                    <span>Go up one level</span>
                  </div>
                </div>
              )}
              
              {directories.map((dir) => (
                <div 
                  key={dir.path}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => navigateToFolder(dir.path)}
                >
                  <div className="flex items-center">
                    <Folder className="w-5 h-5 mr-2 text-yellow-500" />
                    <span>{dir.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filename input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Prompt Name
          </label>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">
              {currentPath ? `${currentPath}/` : ''}
            </span>
            <input
              type="text"
              className={`flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 ${
                error && !error.includes('load contents') ? 'border-red-500' : ''
              }`}
              placeholder="Enter prompt name"
              value={promptName}
              onChange={(e) => {
                setPromptName(e.target.value)
                setError(null)
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
          {error && !error.includes('load contents') && (
            <div className="mt-1 text-red-500 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 border rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!promptName.trim() || saving}
            className="px-3 py-1.5 bg-blue-600 text-sm text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}