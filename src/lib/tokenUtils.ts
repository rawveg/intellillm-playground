/**
 * Retrieves the context window size from the model info dynamically.
 * This approach relies on the context_length field from the model information
 * provided by OpenRouter, eliminating the need for static mappings.
 */
export const getContextWindowFromModelInfo = (modelInfo: { context_length?: number }): number => {
  if (!modelInfo || typeof modelInfo.context_length !== 'number') {
    return DEFAULT_CONTEXT_WINDOW;
  }
  return modelInfo.context_length;
};

// Default context window size - average value that works reasonably for most models
export const DEFAULT_CONTEXT_WINDOW = 16000;

/**
 * Estimates the number of tokens in a string.
 * A common rough heuristic is 1 token ~ 4 characters for English text.
 * This is a simplification and may not be accurate for all models or languages.
 * For more precise token counting, model-specific tokenizers are needed.
 * @param text The text to estimate tokens for.
 * @returns An estimated token count.
 */
export const estimateTokens = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

/**
 * Estimates tokens for a file parameter value
 * @param fileJson JSON string representation of a file parameter
 * @returns Estimated token count
 */
export const estimateFileTokens = (fileJson: string): number => {
  if (!fileJson) return 0;
  
  try {
    const fileData = JSON.parse(fileJson);
    
    // For image files, use a more accurate estimation for data URLs
    if (fileData.type?.startsWith('image/') && fileData.content?.startsWith('data:')) {
      // Base64-encoded images consume many more tokens than regular text
      // Typical ratio is around 3 tokens per 4 Base64 characters
      const base64Data = fileData.content.split(',')[1] || '';
      return Math.ceil(base64Data.length * 0.75); // 3/4 ratio for Base64 encoding
    }
    
    // For text files, use the standard estimation on the content
    if (fileData.content) {
      return estimateTokens(fileData.content);
    }
    
    // For other files or those without content, provide a minimal estimate
    return 20; // Minimal overhead for file metadata
  } catch (e) {
    console.warn('Failed to parse file data for token estimation:', e);
    return 100; // Default fallback
  }
};

/**
 * Estimates total token count for a prompt with parameter values
 * @param promptText The prompt text
 * @param systemPrompt Optional system prompt text
 * @param paramValues Parameter values
 * @returns Estimated token count and breakdown
 */
export const estimatePromptTokens = (
  promptText: string, 
  systemPrompt: string = '', 
  paramValues: Record<string, string> = {}
): {
  total: number,
  breakdown: {
    prompt: number,
    system: number,
    parameters: Record<string, number>
  }
} => {
  // Initialize token count
  let promptTokens = estimateTokens(promptText);
  let systemTokens = estimateTokens(systemPrompt);
  const paramTokens: Record<string, number> = {};
  
  // Calculate tokens for each parameter
  Object.entries(paramValues).forEach(([name, value]) => {
    let tokenCount = 0;
    
    // For file parameters, use the file token estimation function
    if (value && (value.startsWith('{"name":"') || value.startsWith('{"type":"'))) {
      tokenCount = estimateFileTokens(value);
      
      // For file parameters, we're replacing the parameter placeholder with the file content
      // So we need to subtract the token count of the parameter placeholder
      // The pattern is {{name|file:options}}
      // We'll estimate this as approximately 20 tokens as a reasonable default
      const placeholderTokens = 20;
      promptTokens = Math.max(0, promptTokens - placeholderTokens);
    } else {
      tokenCount = estimateTokens(value);
      
      // For regular parameters, we're replacing a short placeholder with the value
      // So we need to subtract the token count of the parameter placeholder
      // The pattern is {{name|type:options}}
      // We'll estimate this as approximately 10 tokens
      const placeholderTokens = 10;
      promptTokens = Math.max(0, promptTokens - placeholderTokens);
    }
    
    paramTokens[name] = tokenCount;
    promptTokens += tokenCount;
  });
  
  // Calculate total
  const totalTokens = promptTokens + systemTokens;
  
  return {
    total: totalTokens,
    breakdown: {
      prompt: promptTokens,
      system: systemTokens,
      parameters: paramTokens
    }
  };
};

/**
 * Retrieves the maximum context token limit for a given model.
 * @param modelInfo The model information object containing the context_length field.
 * @returns The maximum token limit, or a default if the model is not found.
 */
export const getModelContextLimit = (modelInfo: { context_length?: number }): number => {
  // Look up context window from our mapping or use default
  return getContextWindowFromModelInfo(modelInfo);
};

/**
 * Get the current model's token limit from localStorage
 * @returns The model's token limit or default limit
 */
export const getCurrentModelTokenLimit = (): number => {
  if (typeof window === 'undefined') {
    return DEFAULT_CONTEXT_WINDOW;
  }
  
  try {
    // Get selected model name
    const selectedModel = localStorage.getItem('selected_model');
    
    // Models known to have specific token limits
    const knownModelLimits: Record<string, number> = {
      'anthropic/claude-3-sonnet': 200000,
      'anthropic/claude-3-opus': 200000,
      'anthropic/claude-3-5-sonnet': 200000,
      'anthropic/claude-3-7-sonnet': 200000,
      'anthropic/claude-2': 100000,
      'anthropic/claude-2.1': 200000,
      'anthropic/claude-instant': 100000,
      'openai/gpt-4': 8192,
      'openai/gpt-4-turbo': 128000,
      'openai/gpt-4-vision': 128000,
      'openai/gpt-3.5-turbo': 4096
    };
    
    // If we have a known limit for the model, use that
    if (selectedModel && knownModelLimits[selectedModel]) {
      return knownModelLimits[selectedModel];
    }
    
    // Otherwise, get context length from model config if available
    const modelConfigString = localStorage.getItem('model_config');
    if (modelConfigString) {
      const modelConfig = JSON.parse(modelConfigString);
      if (modelConfig.context_length && typeof modelConfig.context_length === 'number') {
        return modelConfig.context_length;
      }
    }
    
    // Default fallback
    return DEFAULT_CONTEXT_WINDOW;
  } catch (e) {
    console.warn('Error getting model token limit:', e);
    return DEFAULT_CONTEXT_WINDOW;
  }
};
