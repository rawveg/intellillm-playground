'use client'

import { useState } from 'react'
import { X, Copy, FileDown } from 'lucide-react'
import { Editor } from './editor'
import ReactMarkdown from 'react-markdown'
import * as RadixTabs from '@radix-ui/react-tabs'

interface ResultsModalProps {
  result: string
  onClose: () => void
}

export function ResultsModal({ result, onClose }: ResultsModalProps) {
  const [activeResultView, setActiveResultView] = useState<'text' | 'markdown'>('text')
  const [showCopyFeedback, setShowCopyFeedback] = useState(false)

  // Copy result to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setShowCopyFeedback(true)
        setTimeout(() => {
          setShowCopyFeedback(false)
        }, 2000)
      })
      .catch(err => {
        console.error('Failed to copy text: ', err)
      })
  }

  // Export as markdown file
  const exportAsMarkdown = () => {
    const blob = new Blob([result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `result-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">Prompt Results</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <RadixTabs.Root 
            value={activeResultView} 
            onValueChange={(value) => setActiveResultView(value as 'text' | 'markdown')}
            className="flex-1 flex flex-col overflow-hidden" 
          >
            <RadixTabs.List className="flex-shrink-0 border-b px-2 dark:border-gray-700">
              <RadixTabs.Trigger 
                value="text" 
                className="px-3 py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary -mb-px focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
              >
                Text
              </RadixTabs.Trigger>
              <RadixTabs.Trigger 
                value="markdown" 
                className="px-3 py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary -mb-px focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
              >
                Markdown
              </RadixTabs.Trigger>
            </RadixTabs.List>

            <RadixTabs.Content value="text" className="flex-1 overflow-auto h-full"> 
              <Editor
                value={result}
                onChange={() => {}} // Read-only
                readOnly
                language={result.startsWith('{') ? 'json' : 'markdown'}
              />
            </RadixTabs.Content>

            <RadixTabs.Content value="markdown" className="flex-1 overflow-auto p-4 bg-background h-full">
              <ReactMarkdown className="markdown-content">{result || ''}</ReactMarkdown>
            </RadixTabs.Content>
          </RadixTabs.Root>
        </div>

        {/* Footer with actions */}
        <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={() => copyToClipboard(result)}
            className="px-3 py-1.5 bg-gray-200 text-sm dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
            {showCopyFeedback && (
              <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
            )}
          </button>
          <button
            onClick={exportAsMarkdown}
            className="px-3 py-1.5 bg-blue-600 text-sm text-white rounded hover:bg-blue-700 flex items-center"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export as Markdown
          </button>
        </div>
      </div>
    </div>
  )
}