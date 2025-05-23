'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'

interface PromptAugmentationModalProps {
  onCancel: () => void
  userPrompt?: string
  onAugmentUserPrompt?: (userPrompt: string) => Promise<void>
}

export function PromptAugmentationModal({ 
  onCancel,
  userPrompt,
  onAugmentUserPrompt
}: PromptAugmentationModalProps) {
  const [isAugmenting, setIsAugmenting] = useState(false)

  const handleUserPromptClick = async () => {
    if (!onAugmentUserPrompt || !userPrompt) return
    
    setIsAugmenting(true)
    try {
      await onAugmentUserPrompt(userPrompt)
    } catch (error) {
      console.error('Error augmenting user prompt:', error)
    } finally {
      setIsAugmenting(false)
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Prompt Augmentation</h2>
          <button 
            type="button" 
            onClick={onCancel} 
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            disabled={isAugmenting}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button 
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded text-left font-medium hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors flex justify-between items-center"
            onClick={handleUserPromptClick}
            disabled={isAugmenting || !userPrompt}
          >
            <span>User Prompt</span>
            {isAugmenting && <Loader2 className="w-4 h-4 animate-spin" />}
          </button>
          <button 
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded text-left font-medium hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
            disabled={isAugmenting}
          >
            System Prompt
          </button>
          <button 
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded text-left font-medium hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
            disabled={isAugmenting}
          >
            All Prompts
          </button>
        </div>
      </div>
    </div>
  )
}