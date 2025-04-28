'use client'

import { useState } from 'react'
import { Editor } from './editor'
import { Plus, X, Save, FileDown, Upload, Play, Loader2 } from 'lucide-react'
import * as YAML from 'yaml'

interface Tab {
  id: string
  name: string
  content: string
  result?: string
  isLoading?: boolean
}

interface RunPromptResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export function Tabs() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', name: 'New Prompt', content: '' }
  ])
  const [activeTab, setActiveTab] = useState('1')

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
    if (!activePrompt) return

    const promptContent = activePrompt.content
    const metadata = {
      created: new Date().toISOString(),
      model: localStorage.getItem('selected_model') || 'default-model',
      ...JSON.parse(localStorage.getItem('model_config') || '{}')
    }

    const fileContent = `---\n${YAML.stringify(metadata)}---\n\n${promptContent}`
    
    const blob = new Blob([fileContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activePrompt.name}.prompt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
    input.accept = '.prompt,.md'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const text = await file.text()
      const [, frontmatter, content] = text.split('---')
      
      if (frontmatter) {
        const metadata = YAML.parse(frontmatter)
        if (metadata.model) {
          localStorage.setItem('selected_model', metadata.model)
        }
        // Store model configuration
        const modelConfig = { ...metadata }
        delete modelConfig.model
        delete modelConfig.created
        localStorage.setItem('model_config', JSON.stringify(modelConfig))
      }

      const newId = String(tabs.length + 1)
      setTabs([...tabs, { 
        id: newId, 
        name: file.name.replace(/\.[^/.]+$/, ''),
        content: content.trim()
      }])
      setActiveTab(newId)
    }
    input.click()
  }

  const activePrompt = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b px-2">
        <div className="flex-1 flex items-center space-x-2 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`group flex items-center space-x-2 px-3 py-2 cursor-pointer ${
                activeTab === tab.id ? 'border-b-2 border-primary' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTab(tab.id)
                  }}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2 p-2">
          <button 
            onClick={runPrompt} 
            className="p-1 hover:bg-secondary rounded"
            disabled={activePrompt?.isLoading}
            title="Run Prompt (Execute)"
          >
            {activePrompt?.isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Play size={20} />
            )}
          </button>
          <button 
            onClick={addTab} 
            className="p-1 hover:bg-secondary rounded"
            title="New Prompt Tab"
          >
            <Plus size={20} />
          </button>
          <button 
            onClick={savePrompt} 
            className="p-1 hover:bg-secondary rounded"
            title="Save Prompt to File"
          >
            <Save size={20} />
          </button>
          <button 
            onClick={loadPrompt} 
            className="p-1 hover:bg-secondary rounded"
            title="Load Prompt from File"
          >
            <Upload size={20} />
          </button>
          <button 
            onClick={exportResult}
            className="p-1 hover:bg-secondary rounded"
            disabled={!activePrompt?.result}
            title="Export Result to File"
          >
            <FileDown size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className={`flex-1 ${activePrompt?.result ? 'h-1/2' : 'h-full'}`}>
          <Editor
            value={activePrompt?.content || ''}
            onChange={(value) => updateTabContent(activeTab, value || '')}
          />
        </div>
        {activePrompt?.result && (
          <div className="h-1/2 border-t">
            <Editor
              value={activePrompt.result}
              onChange={() => {}}
              readOnly
              language={activePrompt.result.startsWith('{') ? 'json' : 'markdown'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
