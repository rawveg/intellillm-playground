import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ExportGistModalProps {
  promptName: string
  promptPath: string
  onExport: (promptPath: string, isPublic: boolean, token: string) => Promise<{ gistUrl: string }>
  onCancel: () => void
}

export function ExportGistModal({ promptName, promptPath, onExport, onCancel }: ExportGistModalProps) {
  const [isPublic, setIsPublic] = useState(true)
  const [githubToken, setGithubToken] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gistUrl, setGistUrl] = useState<string | null>(null)
  
  // Try to load token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token')
    if (savedToken) {
      setGithubToken(savedToken)
    }
  }, [])
  
  const handleExport = async () => {
    if (!githubToken.trim()) {
      setError('GitHub token is required')
      return
    }
    
    setIsExporting(true)
    setError(null)
    
    try {
      // Save token to localStorage for future use
      localStorage.setItem('github_token', githubToken)
      
      // Export the prompt to a Gist
      const result = await onExport(promptPath, isPublic, githubToken)
      setGistUrl(result.gistUrl)
    } catch (err) {
      setError('Failed to export to GitHub Gist. Please check your token and try again.')
    } finally {
      setIsExporting(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Export to GitHub Gist</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {!gistUrl ? (
          <>
            <div className="mb-4">
              <p className="text-sm mb-2">
                Exporting prompt: <strong>{promptName}</strong>
              </p>
              
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                    className="h-4 w-4"
                  />
                  <span>Create as public Gist (anyone can see it)</span>
                </label>
              </div>
              
              <label className="block text-sm font-medium mb-1">
                GitHub Token
              </label>
              <input
                type="password"
                placeholder="ghp_..."
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                disabled={isExporting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Requires a GitHub token with the <code>gist</code> scope. 
                <a 
                  href="https://github.com/settings/tokens/new?scopes=gist&description=IntelliLLM%20Playground" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 ml-1 hover:underline"
                >
                  Create token
                </a>
              </p>
              
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 border rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded">
              <p className="text-green-700 dark:text-green-400 mb-2">
                Successfully exported to GitHub Gist!
              </p>
              <a 
                href={gistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
              >
                {gistUrl}
              </a>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}