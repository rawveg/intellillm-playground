'use client'

import { X } from 'lucide-react'

interface PromptAugmentationModalProps {
  onCancel: () => void
}

export function PromptAugmentationModal({ onCancel }: PromptAugmentationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Prompt Augmentation</h2>
          <button 
            type="button" 
            onClick={onCancel} 
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button 
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded text-left font-medium hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
          >
            User Prompt
          </button>
          <button 
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded text-left font-medium hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
          >
            System Prompt
          </button>
          <button 
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded text-left font-medium hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
          >
            All Prompts
          </button>
        </div>
      </div>
    </div>
  )
}