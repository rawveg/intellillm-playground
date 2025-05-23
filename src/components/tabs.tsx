'use client'

import { useState, useEffect } from 'react'
import { Editor } from './editor'
import { Plus, X, Save, FileDown, Upload, Play, Loader2, Image, FileText, Copy, Sparkles } from 'lucide-react'
import * as YAML from 'yaml'
import { PromptLibrary } from './prompt-library'
import * as RadixTabs from '@radix-ui/react-tabs';
import ReactMarkdown from 'react-markdown';
import { estimateTokens, getModelContextLimit } from '@/lib/tokenUtils';
import { extractParameters, replaceParameters, ParameterInfo, extractParameterNames } from '@/lib/parameterUtils';
import { ParameterModal } from './parameter-modal';
import { SaveAsModal } from './save-as-modal';
import { PromptAugmentationModal } from './prompt-augmentation-modal';
import type { PromptFile } from '@/lib/promptUtils'

interface Tab {
  id: string
  name: string
  content: string
  systemPrompt?: string
  processedSystemPrompt?: string // For parameter substitution at runtime
  result?: string
  isLoading?: boolean
  isLibrary?: boolean
  path?: string // Added path property to support folder structure
  metadata?: {
    model?: string
    [key: string]: any
  }
  // File attachments
  imageFiles?: Array<{
    name: string
    dataUrl: string
    type: string
  }>
  documentFiles?: Array<{
    name: string
    dataUrl: string
    type: string
  }>
}

interface RunPromptResponse {
  choices?: Array<{
    message: {
      content: string
    }
  }>
  message?: {
    content: string
  }
  content?: string
  error?: {
    message: string
    code: number
    metadata?: any
  }
}

export function Tabs() {
  const [systemPromptExpanded, setSystemPromptExpanded] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'library', name: 'Library', content: '', isLibrary: true },
    { id: '1', name: 'New Prompt', content: '' }
  ])
  const [activeTab, setActiveTab] = useState('1')
  // Keep track of the next tab ID to ensure uniqueness
  const [nextTabId, setNextTabId] = useState(2)
  
  // Parameter modal state
  const [showParamModal, setShowParamModal] = useState(false);
  const [activeParameters, setActiveParameters] = useState<ParameterInfo[]>([]);
  const [parameterizedContent, setParameterizedContent] = useState<string>('');
  
  // Save As modal state
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);

  // Copy feedback state
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  
  // Prompt augmentation modal state
  const [showAugmentModal, setShowAugmentModal] = useState(false);
  const [isAugmenting, setIsAugmenting] = useState(false);

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


  
  // Update settings only when active tab changes, not when content or loading state changes
  // This ensures max_tokens and other settings don't reset when receiving API responses
  useEffect(() => {
    const activePrompt = tabs.find(tab => tab.id === activeTab);
    if (activePrompt && !activePrompt.isLibrary) {
      updateModelSettings(activeTab);
    }
  }, [activeTab]); // Only depend on activeTab, not tabs

  const addTab = () => {
    const newId = String(nextTabId)
    setTabs([...tabs, { id: newId, name: 'New Prompt', content: '' }])
    setActiveTab(newId)
    setNextTabId(nextTabId + 1)
  }

  const removeTab = (id: string) => {
    if (tabs.length === 1) return
    const newTabs = tabs.filter(tab => tab.id !== id)
    setTabs(newTabs)
    if (activeTab === id) {
      setActiveTab(newTabs[0].id)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Show feedback
        setShowCopyFeedback(true)
        // Hide feedback after 2 seconds
        setTimeout(() => {
          setShowCopyFeedback(false)
        }, 2000)
      })
      .catch(err => {
        console.error('Failed to copy text: ', err)
      })
  }

  const updateTabContent = (id: string, content: string) => {
    setTabs(tabs.map(tab => 
      tab.id === id ? { ...tab, content } : tab
    ))
  }

  const runPrompt = async () => {
    const activePrompt = tabs.find(tab => tab.id === activeTab);
    if (!activePrompt) return;
    
    try {
      // Check for parameters in both the main prompt and system prompt
      const mainPromptParameters = extractParameters(activePrompt.content);
      const systemPromptParameters = activePrompt.systemPrompt 
        ? extractParameters(activePrompt.systemPrompt) 
        : [];
      
      // Combine parameters from both prompts, removing duplicates by name
      const allParameters = [...mainPromptParameters];
      
      // Add system prompt parameters if they don't already exist in main prompt
      systemPromptParameters.forEach(sysParam => {
        if (!allParameters.some(param => param.name === sysParam.name)) {
          allParameters.push(sysParam);
        }
      });
      
      if (allParameters.length > 0) {
        // If parameters exist, show the modal
        setActiveParameters(allParameters);
        setShowParamModal(true);
        return;
      }
      
      // If no parameters, proceed with the normal flow
      await executePrompt(activePrompt.content);
    } catch (error: unknown) {
      // Handle parameter validation errors
      if (error instanceof Error) {
        if (error.name === 'ParameterValidationError') {
          // Show error message to the user
          setTabs(tabs.map(tab =>
            tab.id === activeTab ? { 
              ...tab, 
              result: `Error in prompt parameters: ${error.message}\n\nPlease fix the parameter syntax in your prompt.`,
              isLoading: false 
            } : tab
          ));
        } else {
          // Handle other errors
          console.error('Error processing prompt parameters:', error);
          setTabs(tabs.map(tab =>
            tab.id === activeTab ? { 
              ...tab, 
              result: `An error occurred while processing your prompt: ${error.message}`,
              isLoading: false 
            } : tab
          ));
        }
      } else {
        // Handle non-Error objects
        console.error('Unknown error processing prompt parameters:', error);
        setTabs(tabs.map(tab =>
          tab.id === activeTab ? { 
            ...tab, 
            result: 'An unknown error occurred while processing your prompt.',
            isLoading: false 
          } : tab
        ));
      }
    }
  };

  // Execute the prompt with parameter values
  const executePromptWithParams = async (paramValues: Record<string, string>) => {
    const activePrompt = tabs.find(tab => tab.id === activeTab);
    if (!activePrompt) return;
    
    // Replace parameters with their values in the main prompt
    const processedContent = replaceParameters(activePrompt.content, paramValues);
    
    // Also replace parameters in the system prompt if it exists
    let processedSystemPrompt = activePrompt.systemPrompt;
    if (processedSystemPrompt) {
      processedSystemPrompt = replaceParameters(processedSystemPrompt, paramValues);
    }
    
    // Update the tab with the processed system prompt (but don't change the original template)
    const updatedTabs = tabs.map(tab => 
      tab.id === activeTab 
        ? { ...tab, processedSystemPrompt } 
        : tab
    );
    setTabs(updatedTabs);
    
    // Hide the modal
    setShowParamModal(false);
    
    // Execute the prompt with the processed content
    console.log('[executePromptWithParams] Executing prompt with processed content:', processedContent);
    await executePrompt(processedContent);
  };

  // Extract the existing prompt execution logic to a separate function
  const executePrompt = async (promptContent: string) => {
    console.log('[executePrompt] Starting execution with content:', promptContent);
    const activePrompt = tabs.find(tab => tab.id === activeTab);
    if (!activePrompt) {
      console.error('[executePrompt] No active prompt found');
      return;
    }

    setTabs(tabs.map(tab =>
      tab.id === activeTab ? { ...tab, isLoading: true, result: undefined } : tab
    ));

    let searchResultsContext = '';
    const isWebSearchEnabled = localStorage.getItem('web_search_enabled') === 'true';

    if (isWebSearchEnabled && promptContent.trim() !== '') {
      try {
        const selectedModel = localStorage.getItem('selected_model') || 'default_model_name'; 
        const modelMaxContextTokens = getModelContextLimit({ context_length: 16000 });
        
        // Use the processed content with parameters replaced for token estimation
        const userPromptTokens = estimateTokens(promptContent);
        const existingSystemPromptTokens = estimateTokens(activePrompt.systemPrompt || '');
        const basePromptTokens = userPromptTokens + existingSystemPromptTokens;

        const RESPONSE_AND_OVERHEAD_BUFFER = Math.floor(modelMaxContextTokens * 0.25); 
        const SEARCH_CONTEXT_TOKEN_BUDGET = modelMaxContextTokens - basePromptTokens - RESPONSE_AND_OVERHEAD_BUFFER;

        if (SEARCH_CONTEXT_TOKEN_BUDGET > 100) { // Only search if there's a reasonable budget
          let searchQueryForDDG = promptContent; // Use processed content with parameters replaced

          try {
            const apiKey = localStorage.getItem('openrouter_api_key');
            const selectedModelForAncillaryCall = localStorage.getItem('selected_model') || 'openai/gpt-3.5-turbo'; // Or a preferred fast model
            const modelConfigString = localStorage.getItem('model_config');
            const modelConfigForAncillaryCall = modelConfigString ? JSON.parse(modelConfigString) : {};
            
            if (!apiKey) {
              console.warn('[WebSearch] OpenRouter API key not found. Falling back to full prompt for search.');
            } else {
              const metaPromptForSearchQuery = `Based on the following user prompt, extract a concise set of search terms that would be effective for finding relevant information on the web. Focus on the core subject or topic the user wants to address. Return only the search terms, ideally 3-7 words. Do not add any commentary or explanation. Just return the search terms.

User Prompt:
"""
${promptContent}
"""

Search Terms:`;

              const ancillaryMessages = [{ role: 'user', content: metaPromptForSearchQuery }];
              
              console.log(`[WebSearch] Ancillary LLM call to ${selectedModelForAncillaryCall} for search query generation.`);
              const ancillaryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': typeof window !== 'undefined' ? window.location.host : 'localhost',
                  'X-Title': typeof window !== 'undefined' ? document.title.slice(0,30) : 'Intellillm Playground',
                },
                body: JSON.stringify({
                  model: selectedModelForAncillaryCall,
                  messages: ancillaryMessages,
                  ...modelConfigForAncillaryCall,
                  max_tokens: 20, // Limit tokens for search query generation
                  temperature: 0.2, // Lower temperature for more factual search terms
                }),
              });

              if (ancillaryResponse.ok) {
                const ancillaryData = await ancillaryResponse.json();
                const llmGeneratedQuery = ancillaryData.choices?.[0]?.message?.content?.trim();
                if (llmGeneratedQuery) {
                  searchQueryForDDG = llmGeneratedQuery;
                  console.log('[WebSearch] LLM generated search query:', searchQueryForDDG);
                } else {
                  console.warn('[WebSearch] LLM did not return a valid search query. Falling back to full prompt.');
                }
              } else {
                console.warn(`[WebSearch] Ancillary LLM call failed (${ancillaryResponse.status}). Falling back to full prompt. Error:`, await ancillaryResponse.text());
              }
            }
          } catch (e) {
            console.error('[WebSearch] Error during ancillary LLM call for search query:', e);
            // Fallback to activePrompt.content is already default
          }

          console.log(`[WebSearch] Final Budget: ${SEARCH_CONTEXT_TOKEN_BUDGET} tokens. Query for DDG: "${searchQueryForDDG}"`);
          const searchApiResponse = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQueryForDDG, limit: 5, backend: 'api' }), 
          });

          if (searchApiResponse.ok) {
            const searchData = await searchApiResponse.json();
            console.log('[WebSearch] Raw searchData from API:', searchData); // DEBUG

            const fetchedSnippets: Array<{text: string, url: string}> | undefined = searchData?.searchResultsArray;

            if (Array.isArray(fetchedSnippets) && fetchedSnippets.length > 0) {
              console.log('[WebSearch] Fetched snippets:', fetchedSnippets); // DEBUG
              let collectedSnippetsForPrompt = "";
              let tokensUsedByAddedSearchSnippets = 0;
              let resultsAddedCount = 0;
              const MIN_RESULTS_TO_INCLUDE = 3;
              const MAX_RESULTS_TO_INCLUDE = 10;

              for (const snippet of fetchedSnippets) {
                if (resultsAddedCount >= MAX_RESULTS_TO_INCLUDE) break;

                if (snippet && typeof snippet.text === 'string' && typeof snippet.url === 'string') {
                  const formattedSnippetText = `[Result ${resultsAddedCount + 1}]
Source: ${snippet.url}
Content: ${snippet.text}

`;
                  const snippetTokens = estimateTokens(formattedSnippetText);

                  if ((tokensUsedByAddedSearchSnippets + snippetTokens) <= SEARCH_CONTEXT_TOKEN_BUDGET) {
                    collectedSnippetsForPrompt += formattedSnippetText;
                    tokensUsedByAddedSearchSnippets += snippetTokens;
                    resultsAddedCount++;
                  } else {
                    if (resultsAddedCount < MIN_RESULTS_TO_INCLUDE) {
                      // If we haven't met the minimum, and this one *could* fit (even if pushing budget slightly),
                      // and we haven't added any yet, this could be an edge case.
                      // For simplicity, strict budget adherence is preferred due to the 20% global buffer.
                      // If it doesn't fit, it doesn't fit.
                    } else {
                       break; // Already have min results, and this one exceeds budget.
                    }
                  }
                } else {
                  console.warn('[WebSearch] Encountered malformed or incomplete snippet:', snippet);
                }
              }
              if (resultsAddedCount > 0) {
                const preamble = "The following information is directly relevant to the user's query. Use these facts to inform your response.\n\n<CONTEXT_START>\n";
                const postamble = "<CONTEXT_END>\n\nProvide a comprehensive and accurate response based on the above information.";
                searchResultsContext = preamble + collectedSnippetsForPrompt.trim() + "\n" + postamble;
                console.log('[WebSearch] Constructed searchResultsContext:', searchResultsContext); // DEBUG
              }
            }
          } else {
            console.error('[WebSearch] API call failed:', searchApiResponse.status, await searchApiResponse.text());
            // Optionally inform user via a toast or by adding a note to the result, but for now, fail silently for search.
          }
        } else {
          console.log('[WebSearch] Token budget too small or prompt empty. Budget:', SEARCH_CONTEXT_TOKEN_BUDGET, 'Prompt:', activePrompt.content.trim());
        }
      } catch (error) {
        console.error('[WebSearch] Error during web search execution in tabs.tsx:', error);
        // Proceed without search results
      }
    }

    try {
      const apiKey = localStorage.getItem('openrouter_api_key');
      if (!apiKey) {
        throw new Error('API key not found. Please add your OpenRouter API key in settings.');
      }

      const selectedModel = localStorage.getItem('selected_model') || 'anthropic/claude-2';
      const modelConfig = JSON.parse(localStorage.getItem('model_config') || '{}');

      // Use processedSystemPrompt if available (for parameter substitution), otherwise use the original systemPrompt
      let finalSystemPrompt = activePrompt.processedSystemPrompt || activePrompt.systemPrompt || '';
      if (searchResultsContext) {
        if (finalSystemPrompt.trim() !== '') {
          // Prepend search results, then a separator, then the original system prompt
          finalSystemPrompt = `${searchResultsContext.trim()}\n\n---\n\n${finalSystemPrompt}`;
        } else {
          // Search results become the entire system prompt
          finalSystemPrompt = searchResultsContext.trim();
        }
      }

      const messages = [];
      if (finalSystemPrompt.trim() !== '') {
        messages.push({ role: 'system', content: finalSystemPrompt });
      }

      // Create the user message with content and any files
      const userMessage: any = { role: 'user', content: [] };
      
      // Add text content
      userMessage.content.push({
        type: 'text',
        text: promptContent || " "
      });
      
      // Add image files if any
      if (activePrompt.imageFiles && activePrompt.imageFiles.length > 0) {
        activePrompt.imageFiles.forEach(file => {
          userMessage.content.push({
            type: 'image_url',
            image_url: {
              url: file.dataUrl
            }
          });
        });
      }
      
      // Add document files if any
      if (activePrompt.documentFiles && activePrompt.documentFiles.length > 0) {
        activePrompt.documentFiles.forEach(file => {
          userMessage.content.push({
            type: 'file',
            file: {
              filename: file.name,
              file_data: file.dataUrl
            }
          });
        });
      }
      
      messages.push(userMessage);

      console.log('[executePrompt] Preparing API call with:', {
        model: selectedModel,
        messagesCount: messages.length,
        firstMessage: messages[0]?.role,
        configKeys: Object.keys(modelConfig),
        hasAttachments: userMessage.content.length > 1
      });
      
      // Use the model config as provided by the user
      const requestBody = {
        model: selectedModel,
        messages,
        ...modelConfig
      };
      
      console.log('[executePrompt] Request body:', JSON.stringify(requestBody));
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify(requestBody)
      })

      console.log('[executePrompt] Response status:', response.status);
      
      // Even if response.ok is true, we need to check for error in the response body
      const responseText = await response.text();
      console.log('[executePrompt] Raw response:', responseText);
      
      // Parse the response text to JSON
      let data: RunPromptResponse;
      try {
        data = JSON.parse(responseText);
        console.log('[executePrompt] Parsed response data:', data);
        
        // Check if the response contains an error object
        if (data.error) {
          console.error('[executePrompt] API returned error in response body:', data.error);
          // Don't throw an error, instead return the error message as the result
          return setTabs(tabs.map(tab =>
            tab.id === activeTab ? { 
              ...tab, 
              result: `API Error: ${data.error?.message || JSON.stringify(data.error)}`,
              isLoading: false 
            } : tab
          ));
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.error('[executePrompt] Failed to parse response JSON:', e);
          throw new Error(`Failed to parse API response: ${e instanceof Error ? e.message : String(e)}`);
        }
        // Re-throw if it's our own error
        throw e;
      }

      // This section is now handled above
      
      // Handle different response formats from OpenRouter API
      let result = 'No response received';
      console.log('[executePrompt] Checking response format...');
      
      if (data.choices && Array.isArray(data.choices) && data.choices.length > 0 && data.choices[0]?.message?.content) {
        console.log('[executePrompt] Found standard OpenAI format response');
        result = data.choices[0].message.content;
      } else if (data.message?.content) {
        console.log('[executePrompt] Found alternative format response');
        result = data.message.content;
      } else if (data.content) {
        console.log('[executePrompt] Found simple format response');
        result = data.content;
      } else {
        console.warn('[executePrompt] No recognized response format found in:', data);
      }
      
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

    // Show the SaveAsModal instead of using window.prompt
    setShowSaveAsModal(true)
  }
  
  // Helper function for prompt augmentation
  const getPromptAugmentationHeaders = (apiKey: string) => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `******      'HTTP-Referer': typeof window !== 'undefined' ? window.location.host : 'localhost',
      'X-Title': 'IntelliLLM Playground - Prompt Augmentation'
    };
  };
  
  // Augment the user prompt only
  const augmentUserPrompt = async () => {
    const activePrompt = tabs.find(tab => tab.id === activeTab);
    if (!activePrompt) return;

    try {
      setIsAugmenting(true);
      
      const openrouterApiKey = localStorage.getItem('openrouter_api_key');
      if (!openrouterApiKey) {
        throw new Error('API key not found. Please add your OpenRouter API key in settings.');
      }

      const selectedModel = localStorage.getItem('selected_model') || 'anthropic/claude-2';
      const modelConfig = JSON.parse(localStorage.getItem('model_config') || '{}');

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `******          'HTTP-Referer': typeof window !== 'undefined' ? window.location.host : 'localhost',
          'X-Title': 'IntelliLLM Playground - Prompt Augmentation'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert at improving and refining prompts. When given a prompt, augment and elaborate it to make it more effective, clearer, and more likely to produce the desired results. Do not include any commentary, explanations, or anything else other than the improved prompt itself. Only return the augmented prompt, nothing more.' 
            },
            { 
              role: 'user', 
              content: `Please augment and elaborate this prompt:\n\n${activePrompt.content}` 
            }
          ],
          ...modelConfig
        })
      });

      const data = await response.json();
      
      // Extract the augmented prompt from the response
      let augmentedPrompt = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        augmentedPrompt = data.choices[0].message.content;
      } else if (data.message) {
        augmentedPrompt = data.message.content;
      } else if (data.content) {
        augmentedPrompt = data.content;
      } else {
        throw new Error('Failed to augment prompt. Unexpected API response format.');
      }
      
      // Update the tab with the augmented prompt
      setTabs(tabs.map(tab =>
        tab.id === activeTab ? { ...tab, content: augmentedPrompt } : tab
      ));
      
      setShowAugmentModal(false);
    } catch (error) {
      console.error('Failed to augment user prompt:', error);
      alert(`Failed to augment user prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAugmenting(false);
    }
  };

  // Augment the system prompt only
  const augmentSystemPrompt = async () => {
    const activePrompt = tabs.find(tab => tab.id === activeTab);
    if (!activePrompt || !activePrompt.systemPrompt) {
      alert('No system prompt available to augment.');
      return;
    }

    try {
      setIsAugmenting(true);
      
      const openrouterApiKey = localStorage.getItem('openrouter_api_key');
      if (!openrouterApiKey) {
        throw new Error('API key not found. Please add your OpenRouter API key in settings.');
      }

      const selectedModel = localStorage.getItem('selected_model') || 'anthropic/claude-2';
      const modelConfig = JSON.parse(localStorage.getItem('model_config') || '{}');

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `******          'HTTP-Referer': typeof window !== 'undefined' ? window.location.host : 'localhost',
          'X-Title': 'IntelliLLM Playground - Prompt Augmentation'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert at improving and refining system prompts. When given a system prompt, augment and elaborate it to make it more effective, clearer, and more likely to produce the desired results. Do not include any commentary, explanations, or anything else other than the improved prompt itself. Only return the augmented prompt, nothing more.' 
            },
            { 
              role: 'user', 
              content: `Please augment and elaborate this system prompt:\n\n${activePrompt.systemPrompt}` 
            }
          ],
          ...modelConfig
        })
      });

      const data = await response.json();
      
      // Extract the augmented prompt from the response
      let augmentedSystemPrompt = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        augmentedSystemPrompt = data.choices[0].message.content;
      } else if (data.message) {
        augmentedSystemPrompt = data.message.content;
      } else if (data.content) {
        augmentedSystemPrompt = data.content;
      } else {
        throw new Error('Failed to augment system prompt. Unexpected API response format.');
      }
      
      // Update the tab with the augmented system prompt
      setTabs(tabs.map(tab =>
        tab.id === activeTab ? { ...tab, systemPrompt: augmentedSystemPrompt } : tab
      ));
      
      setShowAugmentModal(false);
    } catch (error) {
      console.error('Failed to augment system prompt:', error);
      alert(`Failed to augment system prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAugmenting(false);
    }
  };

  // Augment both user and system prompts
  const augmentAllPrompts = async () => {
    const activePrompt = tabs.find(tab => tab.id === activeTab);
    if (!activePrompt) return;

    try {
      setIsAugmenting(true);
      
      const openrouterApiKey = localStorage.getItem('openrouter_api_key');
      if (!openrouterApiKey) {
        throw new Error('API key not found. Please add your OpenRouter API key in settings.');
      }

      const selectedModel = localStorage.getItem('selected_model') || 'anthropic/claude-2';
      const modelConfig = JSON.parse(localStorage.getItem('model_config') || '{}');

      // Augment user prompt
      const userPromptResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `******          'HTTP-Referer': typeof window !== 'undefined' ? window.location.host : 'localhost',
          'X-Title': 'IntelliLLM Playground - Prompt Augmentation'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert at improving and refining prompts. When given a prompt, augment and elaborate it to make it more effective, clearer, and more likely to produce the desired results. Do not include any commentary, explanations, or anything else other than the improved prompt itself. Only return the augmented prompt, nothing more.' 
            },
            { 
              role: 'user', 
              content: `Please augment and elaborate this prompt:\n\n${activePrompt.content}` 
            }
          ],
          ...modelConfig
        })
      });

      const userPromptData = await userPromptResponse.json();
      
      // Extract the augmented user prompt from the response
      let augmentedUserPrompt = '';
      if (userPromptData.choices && userPromptData.choices[0] && userPromptData.choices[0].message) {
        augmentedUserPrompt = userPromptData.choices[0].message.content;
      } else if (userPromptData.message) {
        augmentedUserPrompt = userPromptData.message.content;
      } else if (userPromptData.content) {
        augmentedUserPrompt = userPromptData.content;
      } else {
        throw new Error('Failed to augment user prompt. Unexpected API response format.');
      }
      
      // Augment system prompt if it exists
      let augmentedSystemPrompt = activePrompt.systemPrompt;
      if (activePrompt.systemPrompt) {
        const systemPromptResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `******            'HTTP-Referer': typeof window !== 'undefined' ? window.location.host : 'localhost',
            'X-Title': 'IntelliLLM Playground - Prompt Augmentation'
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { 
                role: 'system', 
                content: 'You are an expert at improving and refining system prompts. When given a system prompt, augment and elaborate it to make it more effective, clearer, and more likely to produce the desired results. Do not include any commentary, explanations, or anything else other than the improved prompt itself. Only return the augmented prompt, nothing more.' 
              },
              { 
                role: 'user', 
                content: `Please augment and elaborate this system prompt:\n\n${activePrompt.systemPrompt}` 
              }
            ],
            ...modelConfig
          })
        });

        const systemPromptData = await systemPromptResponse.json();
        
        // Extract the augmented system prompt from the response
        if (systemPromptData.choices && systemPromptData.choices[0] && systemPromptData.choices[0].message) {
          augmentedSystemPrompt = systemPromptData.choices[0].message.content;
        } else if (systemPromptData.message) {
          augmentedSystemPrompt = systemPromptData.message.content;
        } else if (systemPromptData.content) {
          augmentedSystemPrompt = systemPromptData.content;
        } else {
          throw new Error('Failed to augment system prompt. Unexpected API response format.');
        }
      }
      
      // Update the tab with both augmented prompts
      setTabs(tabs.map(tab =>
        tab.id === activeTab ? { 
          ...tab, 
          content: augmentedUserPrompt,
          systemPrompt: augmentedSystemPrompt 
        } : tab
      ));
      
      setShowAugmentModal(false);
    } catch (error) {
      console.error('Failed to augment prompts:', error);
      alert(`Failed to augment prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAugmenting(false);
    }
  }

  // Handle the actual save operation after path selection in modal
  const handleSaveAs = async (promptPath: string) => {
    const activePrompt = tabs.find(tab => tab.id === activeTab)
    if (!activePrompt) return
    
    // Hide the modal
    setShowSaveAsModal(false)

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
        name: promptPath,
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

      // Extract display name (without path) for the tab
      const displayName = promptPath.split('/').pop() || promptPath
      
      // Update the tab with new name, path, and metadata
      setTabs(tabs.map(tab =>
        tab.id === activeTab ? {
          ...tab,
          name: displayName,
          path: promptPath, // Store full path
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

      const newId = String(nextTabId)
      setTabs([...tabs, { 
        id: newId, 
        name: file.name.replace(/\.prompt$/, ''),
        content: promptContent
      }])
      setActiveTab(newId)
      setNextTabId(nextTabId + 1)
    }
    input.click()
  }

  // Upload image file
  const uploadImageFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Validate file type
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        alert('Please select a valid image file (PNG, JPEG, or WebP).')
        return
      }

      // Read and encode the file
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        
        setTabs(tabs.map(tab => {
          if (tab.id === activeTab) {
            return { 
              ...tab, 
              imageFiles: [...(tab.imageFiles || []), {
                name: file.name,
                dataUrl: dataUrl,
                type: file.type
              }]
            }
          }
          return tab
        }))
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  // Upload document file (PDF)
  const uploadDocumentFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file.')
        return
      }

      // Read and encode the file
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        
        setTabs(tabs.map(tab => {
          if (tab.id === activeTab) {
            return { 
              ...tab, 
              documentFiles: [...(tab.documentFiles || []), {
                name: file.name,
                dataUrl: dataUrl,
                type: file.type
              }]
            }
          }
          return tab
        }))
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  // Remove attached file
  const removeFile = (fileType: 'image' | 'document', index: number) => {
    setTabs(tabs.map(tab => {
      if (tab.id === activeTab) {
        if (fileType === 'image' && tab.imageFiles) {
          const newFiles = [...tab.imageFiles]
          newFiles.splice(index, 1)
          return { ...tab, imageFiles: newFiles.length > 0 ? newFiles : undefined }
        } else if (fileType === 'document' && tab.documentFiles) {
          const newFiles = [...tab.documentFiles]
          newFiles.splice(index, 1)
          return { ...tab, documentFiles: newFiles.length > 0 ? newFiles : undefined }
        }
      }
      return tab
    }))
  }

  const handlePromptSelect = (prompt: PromptFile | PromptFile[]) => {
    // Handle array of prompts for bulk operations
    if (Array.isArray(prompt)) {
      if (prompt.length === 0) return;
      
      // Process each prompt in the array
      const newTabs: Tab[] = [];
      const tabIds: string[] = [];
      
      prompt.forEach((p) => {
        // Expand system prompt section if the prompt has a system prompt
        setSystemPromptExpanded(!!p.systemPrompt)
        
        // Extract display name (without path) for the tab
        const displayName = p.name.split('/').pop() || p.name
        
        // Check if we already have this prompt open
        const existingTab = tabs.find(tab => 
          (tab.name === displayName || tab.name === p.name) && 
          tab.content === p.content
        )

        if (existingTab) {
          // Update metadata of existing tab
          setTabs(prev => prev.map(tab =>
            tab.id === existingTab.id ? { 
              ...tab, 
              metadata: p.metadata,
              path: p.path // Store full path
            } : tab
          ))
          tabIds.push(existingTab.id);
        } else {
          // Create new tab object
          const newId = String(nextTabId + newTabs.length)
          newTabs.push({ 
            id: newId, 
            name: displayName,
            content: p.content,
            systemPrompt: p.systemPrompt,
            metadata: p.metadata,
            path: p.path, // Store full path
          });
          tabIds.push(newId);
        }
      });
      
      // Add all new tabs at once
      if (newTabs.length > 0) {
        setTabs(prev => [...prev, ...newTabs]);
        setNextTabId(nextTabId + newTabs.length);
      }
      
      // Set active tab to the first of the newly opened tabs
      if (tabIds.length > 0) {
        setActiveTab(tabIds[0]);
      }
      
      // Update model settings based on the first prompt
      const firstPrompt = prompt[0];
      if (firstPrompt.metadata?.model) {
        localStorage.setItem('selected_model', firstPrompt.metadata.model);
        window.dispatchEvent(new CustomEvent('modelChange', { 
          detail: { model: firstPrompt.metadata.model } 
        }));
      }
      
      // Update model config settings
      const modelConfig: Record<string, any> = { ...firstPrompt.metadata };
      if (modelConfig.model !== undefined) delete modelConfig.model;
      if (modelConfig.created !== undefined) delete modelConfig.created;
      
      if (Object.keys(modelConfig).length > 0) {
        localStorage.setItem('model_config', JSON.stringify(modelConfig));
        window.dispatchEvent(new CustomEvent('modelConfigChange', { 
          detail: { config: modelConfig } 
        }));
      }
      
      return;
    }
    
    // Original logic for handling a single prompt
    // Expand system prompt section if the prompt has a system prompt
    setSystemPromptExpanded(!!prompt.systemPrompt)
    
    // Extract display name (without path) for the tab
    const displayName = prompt.name.split('/').pop() || prompt.name
    
    // Check if we already have this prompt open
    const existingTab = tabs.find(tab => 
      (tab.name === displayName || tab.name === prompt.name) && 
      tab.content === prompt.content
    )

    if (existingTab) {
      // Update metadata of existing tab
      setTabs(tabs.map(tab =>
        tab.id === existingTab.id ? { 
          ...tab, 
          metadata: prompt.metadata,
          path: prompt.path // Store full path
        } : tab
      ))
      setActiveTab(existingTab.id)
    } else {
      // Create new tab
      const newId = String(nextTabId)
      setTabs([...tabs, { 
        id: newId, 
        name: displayName,
        content: prompt.content,
        systemPrompt: prompt.systemPrompt,
        metadata: prompt.metadata,
        path: prompt.path, // Store full path
      }])
      setActiveTab(newId)
      setNextTabId(nextTabId + 1)
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
    const modelConfig: Record<string, any> = { ...prompt.metadata }
    if (modelConfig.model !== undefined) delete modelConfig.model
    if (modelConfig.created !== undefined) delete modelConfig.created

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
            onClick={uploadImageFile}
            title="Upload Image"
            disabled={activePrompt?.isLibrary}
          >
            <Image className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={uploadDocumentFile}
            title="Upload PDF Document"
            disabled={activePrompt?.isLibrary}
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => setShowAugmentModal(true)}
            title="Augment Prompts"
            disabled={activePrompt?.isLoading || activePrompt?.isLibrary}
          >
            <Sparkles className="w-5 h-5" />
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
              
              {/* Attached Files Display */}
              {((activePrompt?.imageFiles && activePrompt.imageFiles.length > 0) || 
                (activePrompt?.documentFiles && activePrompt.documentFiles.length > 0)) && (
                <div className="border-t p-2">
                  <div className="text-sm font-medium mb-1">Attached Files:</div>
                  <div className="flex flex-wrap gap-2">
                    {activePrompt?.imageFiles?.map((file, index) => (
                      <div 
                        key={`img-${index}`} 
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                      >
                        <Image className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <button 
                          onClick={() => removeFile('image', index)}
                          className="hover:text-red-500 ml-1"
                          title="Remove file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {activePrompt?.documentFiles?.map((file, index) => (
                      <div 
                        key={`doc-${index}`} 
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                      >
                        <FileText className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <button 
                          onClick={() => removeFile('document', index)}
                          className="hover:text-red-500 ml-1"
                          title="Remove file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
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
              <div className="h-1/2 border-t flex flex-col relative"> 
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
                
                {/* Copy to clipboard button */}
                <div className="absolute bottom-4 right-4 opacity-60 hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyToClipboard(activePrompt.result || '')}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full shadow-sm"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {showCopyFeedback && (
                    <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded shadow-md whitespace-nowrap">
                      Copied to clipboard
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Parameter Modal */}
      {showParamModal && (
        <ParameterModal
          parameters={activeParameters}
          tabId={activeTab}
          tabName={tabs.find(tab => tab.id === activeTab)?.name || 'Prompt'}
          onSubmit={executePromptWithParams}
          onCancel={() => setShowParamModal(false)}
        />
      )}

      {/* Save As Modal */}
      {showSaveAsModal && (
        <SaveAsModal
          initialPath={tabs.find(tab => tab.id === activeTab)?.path || ''}
          initialName={tabs.find(tab => tab.id === activeTab)?.name || ''}
          onSave={handleSaveAs}
          onCancel={() => setShowSaveAsModal(false)}
        />
      )}

      {/* Prompt Augmentation Modal */}
      {showAugmentModal && (
        <PromptAugmentationModal
          onClose={() => setShowAugmentModal(false)}
          onAugmentUserPrompt={augmentUserPrompt}
          onAugmentSystemPrompt={augmentSystemPrompt}
          onAugmentAllPrompts={augmentAllPrompts}
          isLoading={isAugmenting}
        />
      )}
    </div>
  )
}
