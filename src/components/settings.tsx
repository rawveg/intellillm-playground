'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Laptop, RotateCcw, Search } from 'lucide-react'

interface ModelConfig {
  temperature: number
  top_p: number
  top_k?: number
  max_tokens: number
  presence_penalty: number
  frequency_penalty: number
  stop_sequences?: string[]
}

interface ModifiedFlags {
  temperature: boolean
  top_p: boolean
  presence_penalty: boolean
  frequency_penalty: boolean
}

interface ModelInfo {
  id: string
  context_length: number
}

interface SettingsProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
}

const defaultConfig: ModelConfig = {
  temperature: 1.0,  // OpenRouter default
  top_p: 1.0,       // OpenRouter default
  max_tokens: 2048,
  presence_penalty: 0.0,
  frequency_penalty: 0.0
}

const calculateDefaultMaxTokens = (contextLength: number) => {
  return Math.floor(contextLength * 0.75)
}

export function Settings({ 
  apiKey, 
  onApiKeyChange,
}: SettingsProps) {
  const { theme, setTheme } = useTheme()
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [modelFilter, setModelFilter] = useState('')
  const [modelConfig, setModelConfig] = useState<ModelConfig>(defaultConfig)
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);
  const [modifiedFlags, setModifiedFlags] = useState<ModifiedFlags>({
    temperature: false,
    top_p: false,
    presence_penalty: false,
    frequency_penalty: false
  })

  // Initialize range sliders
  const initializeRangeSliders = () => {
    Object.entries(modelConfig).forEach(([key, value]) => {
      const input = document.querySelector(`input[type="range"][name="${key}"]`) as HTMLInputElement;
      if (input) {
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        const percentage = ((value as number - min) / (max - min)) * 100;
        input.style.setProperty('--range-progress', `${percentage}%`);
      }
    });
  };

  // Initialize range sliders after component mounts
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      initializeRangeSliders();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load stored values on client side
  useEffect(() => {
    const storedModel = localStorage.getItem('selected_model')
    if (storedModel) {
      setSelectedModel(storedModel)
    }

    // Load web search enabled state
    const storedWebSearchEnabled = localStorage.getItem('web_search_enabled');
    if (storedWebSearchEnabled) {
      setWebSearchEnabled(storedWebSearchEnabled === 'true');
    }

    // Listen for model changes from other components
    const handleModelChange = (event: CustomEvent<{ model: string }>) => {
      setSelectedModel(event.detail.model)
    }

    const handleModelConfigChange = (event: CustomEvent<{ config: Partial<ModelConfig> }>) => {
      setModelConfig(config => ({
        ...config, // Keep existing settings instead of resetting to defaults
        ...event.detail.config
      }))
      // Update modified flags
      const newFlags = { ...modifiedFlags }
      Object.keys(event.detail.config).forEach(key => {
        if (key in newFlags) {
          newFlags[key as keyof ModifiedFlags] = true
        }
      })
      setModifiedFlags(newFlags)
    }

    const handleWebSearchConfigChange = (event: CustomEvent<{ enabled: boolean }>) => {
      setWebSearchEnabled(event.detail.enabled);
    };

    window.addEventListener('modelChange', handleModelChange as EventListener)
    window.addEventListener('modelConfigChange', handleModelConfigChange as EventListener)
    window.addEventListener('webSearchConfigChange', handleWebSearchConfigChange as EventListener);
    
    return () => {
      window.removeEventListener('modelChange', handleModelChange as EventListener)
      window.removeEventListener('modelConfigChange', handleModelConfigChange as EventListener)
      window.removeEventListener('webSearchConfigChange', handleWebSearchConfigChange as EventListener);
    }

    try {
      const storedConfig = localStorage.getItem('model_config')
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig as string) as Partial<ModelConfig>
        setModelConfig({
          ...defaultConfig,
          ...parsedConfig
        })
      }

      const storedFlags = localStorage.getItem('model_config_modified')
      if (storedFlags) {
        const parsedFlags = JSON.parse(storedFlags as string) as ModifiedFlags
        setModifiedFlags(parsedFlags)
      }
    } catch (e) {
      console.error('Failed to parse stored settings:', e)
    }
  }, [])

  // Fetch models when API key is available
  useEffect(() => {
    if (!apiKey) return

    fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const modelInfos = data.data.map((model: any) => ({
          id: model.id,
          context_length: model.context_length || 4096 // Default to 4096 if not specified
        }))
        setModels(modelInfos.sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id)))
      })
      .catch(console.error)
  }, [apiKey])

  // Update localStorage when model changes
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('selected_model', selectedModel)
      
      // Update max_tokens based on the selected model's context length
      const selectedModelInfo = models.find(m => m.id === selectedModel)
      if (selectedModelInfo) {
        const maxContextTokens = selectedModelInfo.context_length
        // Set max_tokens to 75% of the context length
        const recommendedTokens = calculateDefaultMaxTokens(maxContextTokens)
        setModelConfig(prev => ({
          ...prev,
          max_tokens: recommendedTokens
        }))
      }
    }
  }, [selectedModel, models])

  // Save webSearchEnabled to localStorage and dispatch event when it changes
  useEffect(() => {
    localStorage.setItem('web_search_enabled', String(webSearchEnabled));
    window.dispatchEvent(new CustomEvent('webSearchConfigChange', {
      detail: { enabled: webSearchEnabled }
    }));
  }, [webSearchEnabled]);

  // Update localStorage when config changes
  useEffect(() => {
    localStorage.setItem('model_config', JSON.stringify(modelConfig))
    
    // Update all range sliders' progress bars
    Object.entries(modelConfig).forEach(([key, value]) => {
      const input = document.querySelector(`input[type="range"][name="${key}"]`) as HTMLInputElement;
      if (input) {
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        const percentage = ((value as number - min) / (max - min)) * 100;
        input.style.setProperty('--range-progress', `${percentage}%`);
      }
    });
  }, [modelConfig])

  // Update localStorage when modified flags change
  useEffect(() => {
    localStorage.setItem('model_config_modified', JSON.stringify(modifiedFlags))
  }, [modifiedFlags])

  const filteredModels = models.filter(model => 
    model.id.toLowerCase().includes(modelFilter.toLowerCase())
  )

  const selectedModelInfo = models.find(m => m.id === selectedModel)
  const maxContextTokens = selectedModelInfo?.context_length || 4096

  const updateModelConfig = (updates: Partial<ModelConfig>) => {
    setModelConfig(prev => {
      const updated = { ...prev, ...updates }
      return updated
    })

    // Mark the updated fields as modified
    const updatedKeys = Object.keys(updates) as (keyof ModifiedFlags)[]
    setModifiedFlags(prev => {
      const newFlags = { ...prev }
      updatedKeys.forEach(key => {
        if (key in newFlags) {
          newFlags[key] = updates[key] !== defaultConfig[key]
        }
      })
      return newFlags
    })
  }

  // Update range slider progress bar
  const updateRangeProgress = (
    e: React.ChangeEvent<HTMLInputElement>,
    min: number,
    max: number
  ) => {
    const input = e.target;
    const val = parseFloat(input.value);
    const percentage = ((val - min) / (max - min)) * 100;
    input.style.setProperty('--range-progress', `${percentage}%`);
  }

  const handleNumberInput = (
    key: keyof ModelConfig,
    value: string,
    min: number,
    max: number,
    step: number
  ) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(Math.max(numValue, min), max)
      // Round to the nearest step
      const roundedValue = Math.round(clampedValue / step) * step
      updateModelConfig({ [key]: roundedValue })
      
      // Update range slider if it exists
      const rangeInput = document.querySelector(`input[type="range"][name="${key}"]`) as HTMLInputElement;
      if (rangeInput) {
        const percentage = ((roundedValue - min) / (max - min)) * 100;
        rangeInput.style.setProperty('--range-progress', `${percentage}%`);
      }
    }
  }

  const hasModifiedSettings = Object.values(modifiedFlags).some(flag => flag)

  const restoreDefaults = () => {
    const { max_tokens, ...defaultValues } = defaultConfig
    updateModelConfig(defaultValues)
    setModifiedFlags({
      temperature: false,
      top_p: false,
      presence_penalty: false,
      frequency_penalty: false
    })
  }

  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Settings</h2>
        
        {/* Theme Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTheme('light')}
            className={`p-2 rounded-lg ${theme === 'light' ? 'bg-secondary' : ''}`}
            title="Switch to Light Theme"
          >
            <Sun size={20} />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-secondary' : ''}`}
            title="Switch to Dark Theme"
          >
            <Moon size={20} />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-2 rounded-lg ${theme === 'system' ? 'bg-secondary' : ''}`}
            title="Use System Theme Preference"
          >
            <Laptop size={20} />
          </button>
        </div>

        {/* API Key Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium">OpenRouter API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
            placeholder="Enter your API key"
          />
        </div>

        {/* Model Selection */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Model</label>
          <input
            type="text"
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
            placeholder="Filter models..."
          />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="">Select a model</option>
            {filteredModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))}
          </select>
        </div>

        {/* Web Search Toggle */}
        <div className="pt-4 pb-2"> 
          <button
            type="button"
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${webSearchEnabled 
                ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                : 'bg-gray-300 text-gray-800 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
          >
            <Search size={16} className="mr-2" /> Web Search
          </button>
        </div>

        {/* Model Configuration */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Model Configuration</h3>
          
          {/* Temperature */}
          <div className="space-y-1">
            <label className="text-sm">
              Temperature
              {modifiedFlags.temperature && (
                <span className="text-xs text-gray-500 ml-2">(Modified)</span>
              )}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                name="temperature"
                min="0"
                max="2"
                step="0.1"
                value={modelConfig.temperature}
                onChange={(e) => {
                  updateModelConfig({
                    temperature: parseFloat(e.target.value)
                  });
                  updateRangeProgress(e, 0, 2);
                }}
                className="flex-1 range-progress"
              />
              <input
                type="number"
                value={modelConfig.temperature}
                onChange={(e) => handleNumberInput('temperature', e.target.value, 0, 2, 0.1)}
                className="w-20 p-1 border rounded"
                min="0"
                max="2"
                step="0.1"
              />
            </div>
          </div>

          {/* Top P */}
          <div className="space-y-1">
            <label className="text-sm">
              Top P
              {modifiedFlags.top_p && (
                <span className="text-xs text-gray-500 ml-2">(Modified)</span>
              )}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                name="top_p"
                min="0"
                max="1"
                step="0.05"
                value={modelConfig.top_p}
                onChange={(e) => {
                  updateModelConfig({
                    top_p: parseFloat(e.target.value)
                  });
                  updateRangeProgress(e, 0, 1);
                }}
                className="flex-1 range-progress"
              />
              <input
                type="number"
                value={modelConfig.top_p}
                onChange={(e) => handleNumberInput('top_p', e.target.value, 0, 1, 0.05)}
                className="w-20 p-1 border rounded"
                min="0"
                max="1"
                step="0.05"
              />
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-1">
            <label className="text-sm">Max Tokens</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                name="max_tokens"
                min="1"
                max={maxContextTokens}
                step="1"
                value={modelConfig.max_tokens}
                onChange={(e) => {
                  updateModelConfig({
                    max_tokens: parseInt(e.target.value)
                  });
                  updateRangeProgress(e, 1, maxContextTokens);
                }}
                className="flex-1 range-progress"
              />
              <input
                type="number"
                value={modelConfig.max_tokens}
                onChange={(e) => handleNumberInput('max_tokens', e.target.value, 1, maxContextTokens, 1)}
                className="w-24 p-1 border rounded"
                min="1"
                max={maxContextTokens}
              />
            </div>
            <div className="text-xs text-gray-500">
              Max context length: {maxContextTokens.toLocaleString()} tokens (Default: {calculateDefaultMaxTokens(maxContextTokens).toLocaleString()} tokens)
            </div>
          </div>

          {/* Presence Penalty */}
          <div className="space-y-1">
            <label className="text-sm">
              Presence Penalty
              {modifiedFlags.presence_penalty && (
                <span className="text-xs text-gray-500 ml-2">(Modified)</span>
              )}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                name="presence_penalty"
                min="-2"
                max="2"
                step="0.1"
                value={modelConfig.presence_penalty}
                onChange={(e) => {
                  updateModelConfig({
                    presence_penalty: parseFloat(e.target.value)
                  });
                  updateRangeProgress(e, -2, 2);
                }}
                className="flex-1 range-progress"
              />
              <input
                type="number"
                value={modelConfig.presence_penalty}
                onChange={(e) => handleNumberInput('presence_penalty', e.target.value, -2, 2, 0.1)}
                className="w-20 p-1 border rounded"
                min="-2"
                max="2"
                step="0.1"
              />
            </div>
          </div>

          {/* Frequency Penalty */}
          <div className="space-y-1">
            <label className="text-sm">
              Frequency Penalty
              {modifiedFlags.frequency_penalty && (
                <span className="text-xs text-gray-500 ml-2">(Modified)</span>
              )}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                name="frequency_penalty"
                min="-2"
                max="2"
                step="0.1"
                value={modelConfig.frequency_penalty}
                onChange={(e) => {
                  updateModelConfig({
                    frequency_penalty: parseFloat(e.target.value)
                  });
                  updateRangeProgress(e, -2, 2);
                }}
                className="flex-1 range-progress"
              />
              <input
                type="number"
                value={modelConfig.frequency_penalty}
                onChange={(e) => handleNumberInput('frequency_penalty', e.target.value, -2, 2, 0.1)}
                className="w-20 p-1 border rounded"
                min="-2"
                max="2"
                step="0.1"
              />
            </div>
          </div>

          {/* Restore Defaults Button */}
          {hasModifiedSettings && (
            <div className="pt-2">
              <button
                onClick={restoreDefaults}
                className="flex items-center space-x-2 px-3 py-2 w-full text-sm rounded border border-gray-200 dark:border-gray-800 hover:bg-secondary justify-center"
                title="Restore default values for Temperature, Top P, Presence Penalty, and Frequency Penalty"
              >
                <RotateCcw size={14} />
                <span>Restore Default Values</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
