import { useEffect, useState } from 'react'
import { FileText, Trash2, Folder, ChevronLeft, Plus, FolderPlus, Home, Search, ArrowUpDown, Check, X, PanelTop, Move, Github, Import, Play } from 'lucide-react'
import type { PromptFile } from '@/lib/promptUtils'
import { FolderBrowserModal } from './folder-browser-modal'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { ImportGistModal } from './import-gist-modal'
import { ExportGistModal } from './export-gist-modal'

interface PromptLibraryProps {
  onPromptSelect: (prompt: PromptFile | PromptFile[], options?: { runImmediately?: boolean }) => void
}

interface FileEntry {
  name: string
  isDirectory: boolean
  path: string
  created?: string // Optional created timestamp
}

export function PromptLibrary({ onPromptSelect }: PromptLibraryProps) {
  const [currentPath, setCurrentPath] = useState('')
  const [contents, setContents] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [filterText, setFilterText] = useState('')
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'created-asc' | 'created-desc'>('name-asc')
  const [draggedItem, setDraggedItem] = useState<FileEntry | null>(null)
  const [dropTargetPath, setDropTargetPath] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItemPath, setDeleteItemPath] = useState<string | null>(null)
  const [deleteIsDirectory, setDeleteIsDirectory] = useState(false)
  const [deleteModalTitle, setDeleteModalTitle] = useState('')
  const [deleteModalMessage, setDeleteModalMessage] = useState('')
  
  // GitHub Gist integration
  const [showImportGistModal, setShowImportGistModal] = useState(false)
  const [showExportGistModal, setShowExportGistModal] = useState(false)
  const [exportPromptPath, setExportPromptPath] = useState('')
  const [exportPromptName, setExportPromptName] = useState('')

  useEffect(() => {
    loadContents(currentPath)
  }, [currentPath])

  // Update showBulkActions based on selectedItems
  useEffect(() => {
    setShowBulkActions(selectedItems.length > 0)
  }, [selectedItems])

  const toggleItemSelection = (itemPath: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemPath)) {
        return prev.filter(path => path !== itemPath)
      } else {
        return [...prev, itemPath]
      }
    })
  }

  const selectAllItems = () => {
    const allSelectableItems = getFilteredAndSortedContents()
      .filter(item => !item.isDirectory)
      .map(item => item.path)
    setSelectedItems(allSelectableItems)
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  const openSelectedPrompts = async () => {
    try {
      const promptsToOpen = await Promise.all(
        selectedItems.map(async (itemPath) => {
          try {
            const encodedPath = encodeURIComponent(itemPath)
            const response = await fetch(`/api/prompts/${encodedPath}`)
            return await response.json()
          } catch (err) {
            console.error(`Failed to load prompt ${itemPath}:`, err)
            return null
          }
        })
      )
      
      const validPrompts = promptsToOpen.filter(Boolean)
      if (validPrompts.length > 0) {
        onPromptSelect(validPrompts)
        clearSelection()
      }
    } catch (err) {
      setError('Failed to open selected prompts')
    }
  }

  const moveSelectedPrompts = async (destinationPath: string) => {
    // Display different confirmation message based on whether it's the current path
    const isSamePath = destinationPath === currentPath
    const confirmMessage = isSamePath
      ? `Move ${selectedItems.length} selected prompt${selectedItems.length > 1 ? 's' : ''} to this folder?`
      : `Move ${selectedItems.length} selected prompt${selectedItems.length > 1 ? 's' : ''} to "${destinationPath || 'root'}"?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      await Promise.all(
        selectedItems.map(async (sourcePath) => {
          const encodedSourcePath = encodeURIComponent(sourcePath)
          await fetch(`/api/prompts/${encodedSourcePath}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinationPath: destinationPath })
          })
        })
      )
      
      // Refresh contents after move
      loadContents(currentPath)
      clearSelection()
    } catch (err) {
      setError('Failed to move selected prompts')
    }
  }

  const deleteSelectedPrompts = async () => {
    setDeleteItemPath('MULTIPLE')
    setDeleteModalTitle('Delete Selected Prompts')
    setDeleteModalMessage(`Delete ${selectedItems.length} selected prompt${selectedItems.length > 1 ? 's' : ''}?`)
    setShowDeleteModal(true)
  }
  
  const confirmDeleteSelected = async () => {
    try {
      await Promise.all(
        selectedItems.map(async (itemPath) => {
          const encodedPath = encodeURIComponent(itemPath)
          await fetch(`/api/prompts/${encodedPath}`, { method: 'DELETE' })
        })
      )
      
      // Refresh the list
      loadContents(currentPath)
      clearSelection()
    } catch (err) {
      setError('Failed to delete selected prompts')
    } finally {
      // Reset delete state
      setShowDeleteModal(false)
      setDeleteItemPath(null)
    }
  }

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

  const runPrompt = async (filePath: string) => {
    try {
      const encodedPath = encodeURIComponent(filePath)
      const response = await fetch(`/api/prompts/${encodedPath}`)
      const prompt = await response.json()
      onPromptSelect(prompt, { runImmediately: true })
    } catch (err) {
      setError('Failed to run prompt')
    }
  }

  const deleteItem = async (itemPath: string, isDirectory: boolean) => {
    setDeleteItemPath(itemPath)
    setDeleteIsDirectory(isDirectory)
    setDeleteModalTitle(isDirectory ? 'Delete Folder' : 'Delete Prompt')
    setDeleteModalMessage(isDirectory 
      ? 'Delete this folder and all its contents?' 
      : 'Delete this prompt?')
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteItemPath) return
    
    try {
      const encodedPath = encodeURIComponent(deleteItemPath)
      await fetch(`/api/prompts/${encodedPath}`, { method: 'DELETE' })
      loadContents(currentPath) // Refresh the list
    } catch (err) {
      setError(`Failed to delete ${deleteIsDirectory ? 'folder' : 'prompt'}`)
    } finally {
      // Reset delete state
      setShowDeleteModal(false)
      setDeleteItemPath(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeleteItemPath(null)
  }

  const handleImportGist = async (gistUrl: string) => {
    try {
      const response = await fetch('/api/gists/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gistUrl })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import Gist')
      }
      
      const data = await response.json()
      
      // Refresh the contents
      await loadContents(currentPath)
      
      setShowImportGistModal(false)
      return data
    } catch (error) {
      console.error('Failed to import Gist:', error)
      throw error
    }
  }

  const handleExportGist = async (promptPath: string, isPublic: boolean, token: string) => {
    try {
      const response = await fetch('/api/gists/export', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-GitHub-Token': token
        },
        body: JSON.stringify({ promptPath, isPublic })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export to Gist')
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to export to Gist:', error)
      throw error
    }
  }

  const openExportGistModal = (promptPath: string, promptName: string) => {
    setExportPromptPath(promptPath)
    setExportPromptName(promptName)
    setShowExportGistModal(true)
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
  
  const moveItem = async (sourcePath: string, destinationPath: string) => {
    try {
      const encodedSourcePath = encodeURIComponent(sourcePath)
      await fetch(`/api/prompts/${encodedSourcePath}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationPath })
      })
      
      // Refresh contents after move
      loadContents(currentPath)
    } catch (err) {
      setError('Failed to move item')
    }
  }
  
  // Drag and drop handlers
  const handleDragStart = (item: FileEntry) => (e: React.DragEvent) => {
    setDraggedItem(item)
    // Set the drag data for compatibility
    e.dataTransfer.setData('text/plain', item.path)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (targetPath: string | null) => (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDropTargetPath(targetPath)
    e.dataTransfer.dropEffect = 'move'
  }
  
  const handleDrop = (targetPath: string | null) => (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDropTargetPath(null)
    
    if (!draggedItem) return
    
    // Don't allow dropping onto itself
    if (draggedItem.path === targetPath) return
    
    // Handle the drop action
    let destPath = targetPath
    
    if (targetPath === null) {
      // Dropped directly in the current directory
      destPath = currentPath
    }
    
    if (destPath !== null) {
      // If dropping onto a non-directory item, we can't do that
      const targetItem = contents.find(item => item.path === destPath)
      if (targetItem && !targetItem.isDirectory) {
        return
      }
      
      // If dropping onto a directory, append the filename to the path
      if (targetItem?.isDirectory) {
        destPath = `${destPath}/${draggedItem.name}`
      } else {
        // If dropping in the current directory, compose the full path
        destPath = destPath ? `${destPath}/${draggedItem.name}` : draggedItem.name
      }
      
      // Execute the move operation
      moveItem(draggedItem.path, destPath)
    }
    
    setDraggedItem(null)
  }

  const getBreadcrumbs = () => {
    if (!currentPath) return []
    
    const parts = currentPath.split('/')
    return parts.map((part, index) => {
      const path = parts.slice(0, index + 1).join('/')
      return { name: part, path }
    })
  }
  
  // Filter and sort contents based on user preferences
  const getFilteredAndSortedContents = () => {
    return contents
      .filter(item => item.name.toLowerCase().includes(filterText.toLowerCase()))
      .sort((a, b) => {
        // First sort by directories (always show directories first)
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        
        // Then apply the user-selected sort order
        switch(sortOrder) {
          case 'name-asc':
            return a.name.localeCompare(b.name)
          case 'name-desc':
            return b.name.localeCompare(a.name)
          case 'created-asc':
            if (a.created && b.created) {
              return new Date(a.created).getTime() - new Date(b.created).getTime()
            }
            return 0
          case 'created-desc':
            if (a.created && b.created) {
              return new Date(b.created).getTime() - new Date(a.created).getTime()
            }
            return 0
          default:
            return a.name.localeCompare(b.name)
        }
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
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
              onClick={() => setShowImportGistModal(true)}
              title="Import from GitHub Gist"
            >
              <Github className="w-4 h-4 mr-1" />
              <span className="text-xs">Import</span>
            </button>
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
        
        {/* Bulk actions bar - shown only when items are selected */}
        {showBulkActions && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-gray-800 p-2 rounded mb-2">
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">
                {selectedItems.length} selected
              </span>
              <button
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mr-2"
                onClick={selectAllItems}
              >
                Select all
              </button>
              <button
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                onClick={clearSelection}
              >
                Clear
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                onClick={openSelectedPrompts}
                title="Open selected prompts in tabs"
              >
                <PanelTop className="w-3 h-3 mr-1" />
                Open in Tabs
              </button>
              <button
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                onClick={() => setShowMoveModal(true)}
                title="Move selected prompts"
              >
                <Move className="w-3 h-3 mr-1" />
                Move
              </button>
              <button
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                onClick={deleteSelectedPrompts}
                title="Delete selected prompts"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </button>
            </div>
          </div>
        )}
        
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
        
        {/* Filtering and sorting controls */}
        <div className="flex flex-wrap items-center mt-3 gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Filter prompts..."
              className="w-full pl-8 p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select 
              className="h-10 p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="created-asc">Oldest first</option>
              <option value="created-desc">Newest first</option>
            </select>
          </div>
        </div>
      </div>
      
      <div 
        className="flex-1 overflow-auto p-4"
        onDragOver={handleDragOver(null)} 
        onDrop={handleDrop(currentPath)}
      >
        {currentPath && (
          <div 
            className={`mb-4 rounded-lg p-1 ${
              dropTargetPath === 'PARENT_FOLDER' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-gray-700' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDropTargetPath('PARENT_FOLDER');
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDropTargetPath(null);
              
              if (!draggedItem) return;
              
              // Get the parent path
              const pathParts = currentPath.split('/');
              pathParts.pop();
              const parentPath = pathParts.join('/');
              
              // If dropping onto parent folder, compose the full path
              const destPath = parentPath ? `${parentPath}/${draggedItem.name}` : draggedItem.name;
              
              // Execute the move operation
              moveItem(draggedItem.path, destPath);
              setDraggedItem(null);
            }}
          >
            <button
              className="flex items-center p-2 text-blue-600 dark:text-blue-400 hover:underline"
              onClick={navigateUp}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Go up one level
            </button>
          </div>
        )}
        
        {getFilteredAndSortedContents().length === 0 ? (
          filterText ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              No items match your filter
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              This folder is empty
            </div>
          )
        ) : (
          <div className="grid gap-4">
            {getFilteredAndSortedContents().map((item) => (
              <div
                key={item.path}
                className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 ${
                  dropTargetPath === item.path && item.isDirectory 
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-gray-700' 
                    : selectedItems.includes(item.path)
                    ? 'bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-blue-800'
                    : ''
                }`}
                draggable
                onDragStart={handleDragStart(item)}
                onDragOver={item.isDirectory ? handleDragOver(item.path) : undefined}
                onDrop={item.isDirectory ? handleDrop(item.path) : undefined}
              >
                <div className="flex items-center flex-1">
                  {!item.isDirectory && (
                    <div 
                      className={`mr-2 flex-shrink-0 w-5 h-5 border-2 ${
                        selectedItems.includes(item.path) 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                          : 'border-gray-400 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-400'
                      } rounded cursor-pointer flex items-center justify-center transition-colors`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleItemSelection(item.path)
                      }}
                    >
                      {selectedItems.includes(item.path) && (
                        <Check className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      )}
                    </div>
                  )}
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
                </div>
                <div className="flex items-center">
                  {!item.isDirectory && (
                    <>
                      <button
                        className="p-1 hover:text-green-500 dark:hover:text-green-400 mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          runPrompt(item.path);
                        }}
                        title="Run prompt"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 hover:text-blue-500 dark:hover:text-blue-400 mr-1"
                        onClick={() => openExportGistModal(item.path, item.name)}
                        title="Export to GitHub Gist"
                      >
                        <Github className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    className="p-1 hover:text-red-500 dark:hover:text-red-400"
                    onClick={() => deleteItem(item.path, item.isDirectory)}
                    title={`Delete ${item.isDirectory ? 'folder' : 'prompt'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Folder Browser Modal for Bulk Move */}
      {showMoveModal && (
        <FolderBrowserModal
          initialPath={currentPath}
          onSelect={(destination) => {
            setShowMoveModal(false)
            moveSelectedPrompts(destination)
          }}
          onCancel={() => setShowMoveModal(false)}
          title={`Move ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}`}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          title={deleteModalTitle}
          message={deleteModalMessage}
          onConfirm={deleteItemPath === 'MULTIPLE' ? confirmDeleteSelected : confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {/* Import Gist Modal */}
      {showImportGistModal && (
        <ImportGistModal
          onImport={handleImportGist}
          onCancel={() => setShowImportGistModal(false)}
        />
      )}

      {/* Export Gist Modal */}
      {showExportGistModal && (
        <ExportGistModal
          promptName={exportPromptName}
          promptPath={exportPromptPath}
          onExport={handleExportGist}
          onCancel={() => setShowExportGistModal(false)}
        />
      )}
    </div>
  )
}
