'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface PromptAugmentationModalProps {
  onClose: () => void
  onAugmentUserPrompt: () => void
  onAugmentSystemPrompt: () => void
  onAugmentAllPrompts: () => void
  isLoading: boolean
}

export function PromptAugmentationModal({ 
  onClose, 
  onAugmentUserPrompt, 
  onAugmentSystemPrompt, 
  onAugmentAllPrompts,
  isLoading
}: PromptAugmentationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Augment Prompts</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={onAugmentUserPrompt}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Augmenting...' : 'User Prompt'}
          </button>
          
          <button 
            onClick={onAugmentSystemPrompt}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Augmenting...' : 'System Prompt'}
          </button>
          
          <button 
            onClick={onAugmentAllPrompts}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Augmenting...' : 'All Prompts'}
          </button>
        </div>
        
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-1.5 border rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}