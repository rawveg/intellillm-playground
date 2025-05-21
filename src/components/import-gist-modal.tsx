import React, { useState } from 'react'
import { X } from 'lucide-react'

interface ImportGistModalProps {
  onImport: (url: string) => Promise<void>
  onCancel: () => void
}

export function ImportGistModal({ onImport, onCancel }: ImportGistModalProps) {
  const [gistUrl, setGistUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleImport = async () => {
    if (!gistUrl.trim()) {
      setError('Please enter a GitHub Gist URL')
      return
    }
    
    setIsImporting(true)
    setError(null)
    
    try {
      await onImport(gistUrl.trim())
    } catch (err) {
      setError('Failed to import Gist. Please check the URL and try again.')
      setIsImporting(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Import from GitHub Gist</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            GitHub Gist URL
          </label>
          <input
            type="url"
            placeholder="https://gist.github.com/username/gist_id"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            value={gistUrl}
            onChange={(e) => setGistUrl(e.target.value)}
            disabled={isImporting}
          />
          {error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
          )}
        </div>
        
        <div className="text-sm mb-4">
          <p>Enter the URL of a public GitHub Gist to import it as a prompt.</p>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            disabled={isImporting}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}