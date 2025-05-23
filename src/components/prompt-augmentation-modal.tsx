'use client'

import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'

interface PromptAugmentationModalProps {
  userPrompt: string
  systemPrompt?: string
  onUserPromptAugmented: (augmentedPrompt: string) => void
  onSystemPromptAugmented: (augmentedPrompt: string) => void
  onCancel: () => void
  onAllPromptsAugmented: (augmentedUserPrompt: string, augmentedSystemPrompt: string) => void
}

export function PromptAugmentationModal({
  userPrompt,
  systemPrompt = '',
  onUserPromptAugmented,
  onSystemPromptAugmented,
  onAllPromptsAugmented,
  onCancel
}: PromptAugmentationModalProps) {
  const [isAugmentingUser, setIsAugmentingUser] = useState(false)
  const [isAugmentingSystem, setIsAugmentingSystem] = useState(false)
  const [isAugmentingAll, setIsAugmentingAll] = useState(false)

  // Function to augment the user prompt
  const augmentUserPrompt = async () => {
    if (isAugmentingUser || isAugmentingAll) return
    setIsAugmentingUser(true)
    
    try {
      // Get the OpenRouter API key
      const apiKey = localStorage.getItem('openrouter_api_key')
      if (!apiKey) {
        throw new Error('API key not found. Please add your OpenRouter API key in settings.')
      }

      const selectedModel = localStorage.getItem('selected_model') || 'anthropic/claude-2'
      const modelConfig = JSON.parse(localStorage.getItem('model_config') || '{}')

      // Create meta prompt
      const metaPrompt = `Please augment and elaborate this prompt. Your output should ONLY be the improved prompt text with no additional commentary, explanation, or formatting. Just return the enhanced prompt text:

"""
${userPrompt}
"""`

      const messages = [{ role: 'user', content: metaPrompt }]

      // Call the API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `******          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          ...modelConfig
        })
      })

      // Check response
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Extract the augmented prompt from the response
      let augmentedPrompt = ''
      if (data.choices && data.choices[0]?.message?.content) {
        augmentedPrompt = data.choices[0].message.content
      } else if (data.message?.content) {
        augmentedPrompt = data.message.content
      } else {
        throw new Error('Failed to extract augmented prompt from API response')
      }

      onUserPromptAugmented(augmentedPrompt)
    } catch (error) {
      console.error('Error augmenting user prompt:', error)
      alert(`Failed to augment user prompt: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsAugmentingUser(false)
    }
  }

  // Function to augment the system prompt
  const augmentSystemPrompt = async () => {
    if (!systemPrompt || isAugmentingSystem || isAugmentingAll) return
    setIsAugmentingSystem(true)
    
    try {
      // Get the OpenRouter API key
      const apiKey = localStorage.getItem('openrouter_api_key')
      if (!apiKey) {
        throw new Error('API key not found. Please add your OpenRouter API key in settings.')
      }

      const selectedModel = localStorage.getItem('selected_model') || 'anthropic/claude-2'
      const modelConfig = JSON.parse(localStorage.getItem('model_config') || '{}')

      // Create meta prompt
      const metaPrompt = `Please augment and elaborate this system prompt. Your output should ONLY be the improved system prompt text with no additional commentary, explanation, or formatting. Just return the enhanced system prompt text:

"""
${systemPrompt}
"""`

      const messages = [{ role: 'user', content: metaPrompt }]

      // Call the API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `******          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          ...modelConfig
        })
      })

      // Check response
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Extract the augmented prompt from the response
      let augmentedPrompt = ''
      if (data.choices && data.choices[0]?.message?.content) {
        augmentedPrompt = data.choices[0].message.content
      } else if (data.message?.content) {
        augmentedPrompt = data.message.content
      } else {
        throw new Error('Failed to extract augmented prompt from API response')
      }

      onSystemPromptAugmented(augmentedPrompt)
    } catch (error) {
      console.error('Error augmenting system prompt:', error)
      alert(`Failed to augment system prompt: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsAugmentingSystem(false)
    }
  }

  // Function to augment both prompts
  const augmentBothPrompts = async () => {
    if (isAugmentingUser || isAugmentingSystem || isAugmentingAll) return
    setIsAugmentingAll(true)
    
    try {
      // Get the OpenRouter API key
      const apiKey = localStorage.getItem('openrouter_api_key')
      if (!apiKey) {
        throw new Error('API key not found. Please add your OpenRouter API key in settings.')
      }

      const selectedModel = localStorage.getItem('selected_model') || 'anthropic/claude-2'
      const modelConfig = JSON.parse(localStorage.getItem('model_config') || '{}')

      // Augment user prompt
      const userMetaPrompt = `Please augment and elaborate this prompt. Your output should ONLY be the improved prompt text with no additional commentary, explanation, or formatting. Just return the enhanced prompt text:

"""
${userPrompt}
"""`

      const userMessages = [{ role: 'user', content: userMetaPrompt }]

      const userResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `******          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: userMessages,
          ...modelConfig
        })
      })

      if (!userResponse.ok) {
        throw new Error(`API error: ${userResponse.status}`)
      }

      const userData = await userResponse.json()
      
      let augmentedUserPrompt = ''
      if (userData.choices && userData.choices[0]?.message?.content) {
        augmentedUserPrompt = userData.choices[0].message.content
      } else if (userData.message?.content) {
        augmentedUserPrompt = userData.message.content
      } else {
        throw new Error('Failed to extract augmented user prompt from API response')
      }

      // Augment system prompt if it exists
      let augmentedSystemPrompt = systemPrompt
      
      if (systemPrompt) {
        const systemMetaPrompt = `Please augment and elaborate this system prompt. Your output should ONLY be the improved system prompt text with no additional commentary, explanation, or formatting. Just return the enhanced system prompt text:

"""
${systemPrompt}
"""`

        const systemMessages = [{ role: 'user', content: systemMetaPrompt }]

        const systemResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `******            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: systemMessages,
            ...modelConfig
          })
        })

        if (!systemResponse.ok) {
          throw new Error(`API error: ${systemResponse.status}`)
        }

        const systemData = await systemResponse.json()
        
        if (systemData.choices && systemData.choices[0]?.message?.content) {
          augmentedSystemPrompt = systemData.choices[0].message.content
        } else if (systemData.message?.content) {
          augmentedSystemPrompt = systemData.message.content
        } else {
          throw new Error('Failed to extract augmented system prompt from API response')
        }
      }

      onAllPromptsAugmented(augmentedUserPrompt, augmentedSystemPrompt)
    } catch (error) {
      console.error('Error augmenting prompts:', error)
      alert(`Failed to augment prompts: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsAugmentingAll(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
            Prompt Augmentation
          </h2>
          <button 
            type="button" 
            onClick={onCancel} 
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select what you want to augment below. The AI will enhance your prompts by elaborating them.
          </p>

          <button
            onClick={augmentUserPrompt}
            disabled={isAugmentingUser || isAugmentingAll}
            className="w-full py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center"
          >
            {isAugmentingUser ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
            )}
            <span>User Prompt</span>
          </button>

          <button
            onClick={augmentSystemPrompt}
            disabled={!systemPrompt || isAugmentingSystem || isAugmentingAll}
            className={`w-full py-3 ${
              !systemPrompt 
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700/30 dark:text-gray-500 cursor-not-allowed' 
                : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-current'
            } rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center`}
          >
            {isAugmentingSystem ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
            )}
            <span>System Prompt</span>
          </button>

          <button
            onClick={augmentBothPrompts}
            disabled={isAugmentingUser || isAugmentingSystem || isAugmentingAll}
            className="w-full py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center"
          >
            {isAugmentingAll ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
            )}
            <span>All Prompts</span>
          </button>
        </div>
      </div>
    </div>
  )
}