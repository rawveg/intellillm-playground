import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Folder, FolderPlus, Home, X, Plus } from 'lucide-react'

interface FolderBrowserModalProps {
  initialPath?: string
  onSelect: (path: string) => void
  onCancel: () => void
  title?: string
}

interface FolderEntry {
  name: string
  path: string
}

export function FolderBrowserModal({ 
  initialPath = '', 
  onSelect, 
  onCancel, 
  title = 'Select Folder'
}: FolderBrowserModalProps) {
  const [currentPath, setCurrentPath] = useState(initialPath || '')
  const [folders, setFolders] = useState<FolderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    loadFolders(currentPath)
  }, [currentPath])

  const loadFolders = async (dirPath: string) => {
    try {
      setLoading(true)
      const encodedPath = encodeURIComponent(dirPath)
      const response = await fetch(`/api/prompts?path=${encodedPath}&foldersOnly=true`)
      const data = await response.json()
      
      // Filter to only include directories
      const folderEntries = data.contents
        ? data.contents.filter((item: any) => item.isDirectory)
        : []
      
      setFolders(folderEntries)
      setError(null)
    } catch (err) {
      setError('Failed to load folders')
      console.error('Failed to load folders:', err)
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
      loadFolders(currentPath)
    } catch (err) {
      setError('Failed to create folder')
      console.error('Failed to create folder:', err)
    }
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button 
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onCancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-2">
              <button
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={navigateUp}
                disabled={currentPath === ''}
                title="Go up one level"
              >
                <ChevronLeft className={`w-5 h-5 ${currentPath === '' ? 'text-gray-400 dark:text-gray-600' : ''}`} />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={navigateHome}
                title="Go to root folder"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
            <button
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              title="Create new folder"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Breadcrumb navigation */}
          <div className="flex items-center mt-2 overflow-x-auto whitespace-nowrap text-sm">
            <button 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={navigateHome}
            >
              root
            </button>
            
            {breadcrumbs.map((crumb) => (
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

          {showNewFolderInput && (
            <div className="flex items-center mt-2 mb-1">
              <input
                type="text"
                className="flex-1 p-1 border rounded-l dark:bg-gray-800 dark:border-gray-700"
                placeholder="New folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <button
                className="p-1 border-t border-r border-b rounded-r bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                onClick={handleCreateFolder}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="text-center py-4">Loading folders...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : folders.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {currentPath === '' ? 'No folders found' : 'This folder is empty'}
            </div>
          ) : (
            <div className="grid gap-2">
              {folders.map((folder) => (
                <button
                  key={folder.path}
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                  onClick={() => navigateToFolder(folder.path)}
                >
                  <Folder className="w-5 h-5 mr-2 text-yellow-500" />
                  {folder.name}
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-800 flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(currentPath)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  )
}