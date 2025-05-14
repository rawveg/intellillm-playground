'use client'

import { useState, useEffect } from 'react'
import { Editor } from './editor'
import { Plus, X, Save, FileDown, Upload, Play, Loader2 } from 'lucide-react'
import * as YAML from 'yaml'
import { PromptLibrary } from './prompt-library'
import * as RadixTabs from '@radix-ui/react-tabs';
import ReactMarkdown from 'react-markdown';

interface Tab {
  id: string
  name: string
  content: string
  systemPrompt?: string
  result?: string
  isLoading?: boolean
  isLibrary?: boolean
  metadata?: {
    model?: string
    [key: string]: any
  }
}

interface RunPromptResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export function Tabs() {
  const [systemPromptExpanded, setSystemPromptExpanded] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'library', name: 'Library', content: '', isLibrary: true },
    { id: '1', name: 'New Prompt', content: '' }
  ])
  const [activeTab, setActiveTab] = useState('1')

  // Update model and settings when active tab changes
  const updateModelSettings = (tabId: string) => {
    const activePrompt = tabs.find(tab => tab.id === tabId)
    if (!activePrompt) return

    // Get stored settings from localStorage
    const storedSettings = localStorage.getItem('model_config')
    const currentSettings = storedSettings ? JSON.parse(storedSettings) : {}

    // Get current model
    const storedModel = localStorage.getItem('selected_model')

    // Only update if the settings are different
    if (activePrompt.metadata?.model && activePrompt.metadata.model !== storedModel) {
      localStorage.setItem('selected_model', activePrompt.metadata.model)
      window.dispatchEvent(new CustomEvent('modelChange', { 
        detail: { model: activePrompt.metadata.model } 
      }))
    }

    // Update other model settings
    const newSettings = { ...activePrompt.metadata }
    delete newSettings.model
    delete newSettings.created

    // Only update if settings have changed
    if (JSON.stringify(newSettings) !== JSON.stringify(currentSettings)) {
      localStorage.setItem('model_config', JSON.stringify(newSettings))
      window.dispatchEvent(new CustomEvent('modelConfigChange', { 
        detail: { config: newSettings } 
      }))
    }
  }
  const [activeResultView, setActiveResultView] = useState<'text' | 'markdown'>('text');

  // Update settings whenever active tab changes
  useEffect(() => {
    updateModelSettings(activeTab)
  }, [activeTab, tabs]);

  const addTab = () => {
    const newId = String(tabs.length + 1)
    setTabs([...tabs, { id: newId, name: 'New Prompt', content: '' }])
    setActiveTab(newId)
  }

  const removeTab = (id: string) => {
    if (tabs.length === 1) return
    const newTabs = tabs.filter(tab => tab.id !== id)
    setTabs(newTabs)
    if (activeTab === id) {
      setActiveTab(newTabs[0].id)
    }
  }

  const updateTabContent = (id: string, content: string) => {
    setTabs(tabs.map(tab => 
      tab.id === id ? { ...tab, content } : tab
    ))
  }

  const runPrompt = async () => {
    const activePrompt = tabs.find(tab => tab.id === activeTab)
    if (!activePrompt) return

    // Set loading state
    setTabs(tabs.map(tab =>
      tab.id === activeTab ? { ...tab, isLoading: true } : tab
    ))

    try {
      const apiKey = localStorage.getItem('openrouter_api_key')
      if (!apiKey) {
        throw new Error('API key not found. Please add your OpenRouter API key in settings.')
      }

      const selectedModel = localStorage.getItem('selected_model') || 'anthropic/claude-2'
      const modelConfig = JSON.parse(localStorage.getItem('model_config') || '{}')

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...(activePrompt.systemPrompt ? [{
              role: 'system',
              content: activePrompt.systemPrompt
            }] : []),
            {
              role: 'user',
              content: activePrompt.content
            }
          ],
          ...modelConfig
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API request failed: ${error}`)
      }

      const data: RunPromptResponse = await response.json()
      const result = data.choices[0]?.message?.content || 'No response received'
      
      // Update the tab with the result
      setTabs(tabs.map(tab =>
        tab.id === activeTab ? { ...tab, result, isLoading: false } : tab
      ))
    } catch (error) {
      // Update the tab with the error
      setTabs(tabs.map(tab =>
        tab.id === activeTab ? { 
          ...tab, 
          result: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          isLoading: false 
        } : tab
      ))
    }
  }

  const savePrompt = async () => {
    const activePrompt = tabs.find(tab => tab.id === activeTab)
    if (!activePrompt || activePrompt.isLibrary) return

    // Prompt for name
    const promptName = window.prompt('Enter a name for your prompt:', activePrompt.name)
    if (!promptName) return // User cancelled

    // Get current model and settings
    const currentModel = localStorage.getItem('selected_model')
    const currentConfig = JSON.parse(localStorage.getItem('model_config') || '{}')

    // Combine with existing metadata or create new
    const metadata = {
      created: new Date().toISOString(),
      model: currentModel || 'default-model',
      ...currentConfig
    }

    try {
      const promptData = {
        name: promptName,
        content: activePrompt.content,
        systemPrompt: activePrompt.systemPrompt,
        metadata
      }

      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData)
      })

      if (!response.ok) {
        throw new Error('Failed to save prompt')
      }

      // Update the tab with new name and metadata
      setTabs(tabs.map(tab =>
        tab.id === activeTab ? {
          ...tab,
          name: promptName,
          metadata,
          systemPrompt: activePrompt.systemPrompt // Preserve system prompt
        } : tab
      ))

      // Update localStorage to match the saved state
      localStorage.setItem('selected_model', metadata.model)
      const modelConfig = { ...metadata }
      delete modelConfig.model
      delete modelConfig.created
      localStorage.setItem('model_config', JSON.stringify(modelConfig))
    } catch (error) {
      console.error('Failed to save prompt:', error)
      alert('Failed to save prompt. Please try again.')
    }
  }

  const exportResult = () => {
    const activePrompt = tabs.find(tab => tab.id === activeTab)
    if (!activePrompt?.result) return

    const blob = new Blob([activePrompt.result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'result.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadPrompt = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.prompt'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const content = await file.text()
      const [_, frontmatter, ...contentParts] = content.split('---\n')
      const metadata = frontmatter ? YAML.parse(frontmatter) : {}
      const promptContent = contentParts.join('---\n').trim()

      // Check if we already have this prompt open
      const existingTab = tabs.find(tab => 
        tab.name === file.name.replace(/\.prompt$/, '') && 
        tab.content === promptContent
      )

      if (existingTab) {
        setActiveTab(existingTab.id)
        return
      }

      // Restore model settings if present
      if (metadata.model) {
        localStorage.setItem('selected_model', metadata.model)
      }
      const modelConfig = { ...metadata }
      delete modelConfig.model
      delete modelConfig.created
      localStorage.setItem('model_config', JSON.stringify(modelConfig))

      const newId = String(tabs.length + 1)
      setTabs([...tabs, { 
        id: newId, 
        name: file.name.replace(/\.prompt$/, ''),
        content: promptContent
      }])
      setActiveTab(newId)
    }
    input.click()
  }

  const handlePromptSelect = (prompt: { name: string; content: string; systemPrompt?: string; metadata: any }) => {
    // Expand system prompt section if the prompt has a system prompt
    setSystemPromptExpanded(!!prompt.systemPrompt)
    
    // Check if we already have this prompt open
    const existingTab = tabs.find(tab => 
      tab.name === prompt.name && 
      tab.content === prompt.content
    )

    if (existingTab) {
      // Update metadata of existing tab
      setTabs(tabs.map(tab =>
        tab.id === existingTab.id ? { ...tab, metadata: prompt.metadata } : tab
      ))
      setActiveTab(existingTab.id)
    } else {
      // Create new tab
      const newId = String(tabs.length)
      setTabs([...tabs, { 
        id: newId, 
        name: prompt.name,
        content: prompt.content,
        systemPrompt: prompt.systemPrompt,
        metadata: prompt.metadata
      }])
      setActiveTab(newId)
    }

    // Restore model settings if present
    if (prompt.metadata?.model) {
      localStorage.setItem('selected_model', prompt.metadata.model)
      // Trigger model update in Settings component
      window.dispatchEvent(new CustomEvent('modelChange', { 
        detail: { model: prompt.metadata.model } 
      }))
    }

    // Update model config settings
    const modelConfig = { ...prompt.metadata }
    delete modelConfig.model
    delete modelConfig.created

    // Only update if there are actual config settings
    if (Object.keys(modelConfig).length > 0) {
      localStorage.setItem('model_config', JSON.stringify(modelConfig))
      window.dispatchEvent(new CustomEvent('modelConfigChange', { 
        detail: { config: modelConfig } 
      }))
    }
  }

  const activePrompt = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b px-2 bg-background relative z-10">
        <div className="flex-1 flex items-center">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-primary'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
              {!tab.isLibrary && tabs.length > 2 && (
                <span
                  className="ml-2 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTab(tab.id)
                  }}
                >
                  ×
                </span>
              )}
            </button>
          ))}
          <button
            className="p-2 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={addTab}
            title="New Prompt"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={runPrompt}
            className="p-2 hover:text-blue-600 dark:hover:text-blue-400"
            disabled={activePrompt?.isLoading}
            title="Run Prompt"
          >
            {activePrompt?.isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <button
            className="p-2 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={savePrompt}
            title="Save Prompt"
          >
            <Save className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={exportResult}
            title="Export Result"
          >
            <FileDown className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={loadPrompt}
            title="Load Prompt"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {activePrompt?.isLibrary ? (
          <div className="absolute inset-0">
            <PromptLibrary onPromptSelect={handlePromptSelect} />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col">
            <div className={`flex-1 ${activePrompt?.result ? 'h-1/2' : 'h-full'} flex flex-col`}>
              <div className="flex-1 min-h-0">
                <Editor
                  value={activePrompt?.content || ''}
                  onChange={(value) => updateTabContent(activeTab, value || '')}
                />
              </div>
              
              {/* System Prompt Section */}
              <div className="border-t flex flex-col">
                <button
                  onClick={() => {
                    console.log('Current state:', {
                      systemPromptExpanded,
                      hasSystemPrompt: !!activePrompt?.systemPrompt,
                      systemPromptContent: activePrompt?.systemPrompt
                    })
                    
                    // Always toggle the expanded state
                    const newExpandedState = !systemPromptExpanded
                    setSystemPromptExpanded(newExpandedState)
                    
                    // Handle system prompt content
                    if (!activePrompt?.systemPrompt && newExpandedState) {
                      // Create empty system prompt when expanding
                      setTabs(tabs.map(tab =>
                        tab.id === activeTab ? { ...tab, systemPrompt: '' } : tab
                      ))
                    } else if (activePrompt?.systemPrompt?.trim() === '' && !newExpandedState) {
                      // Remove empty system prompt when collapsing
                      setTabs(tabs.map(tab =>
                        tab.id === activeTab ? { ...tab, systemPrompt: undefined } : tab
                      ))
                    }
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <span className="mr-2">{systemPromptExpanded ? '▼' : '▶'}</span>
                  System Prompt
                </button>
                {systemPromptExpanded && (
                  <div className="flex-1 min-h-[200px]">
                    <Editor
                      value={activePrompt?.systemPrompt || ''}
                      onChange={(value) => {
                        console.log('Editor onChange:', { value })
                        setTabs(tabs.map(tab =>
                          tab.id === activeTab ? { ...tab, systemPrompt: value || undefined } : tab
                        ))
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            {activePrompt?.result && (
              <div className="h-1/2 border-t flex flex-col"> 
                <RadixTabs.Root 
                  value={activeResultView} 
                  onValueChange={(value) => setActiveResultView(value as 'text' | 'markdown')}
                  className="flex-1 flex flex-col overflow-hidden" 
                >
                  <RadixTabs.List className="flex-shrink-0 border-b px-2">
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
                  <RadixTabs.Content value="text" className="flex-1 overflow-auto"> 
                    <Editor
                      value={activePrompt.result}
                      onChange={() => {}} // Read-only, so no-op
                      readOnly
                      language={activePrompt.result.startsWith('{') ? 'json' : 'markdown'}
                    />
                  </RadixTabs.Content>
                  <RadixTabs.Content value="markdown" className="flex-1 overflow-auto p-4 bg-background">
                    <ReactMarkdown className="markdown-content">{activePrompt.result || ''}</ReactMarkdown>
                  </RadixTabs.Content>
                </RadixTabs.Root>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
