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
 * Retrieves the maximum context token limit for a given model.
 * @param modelInfo The model information object containing the context_length field.
 * @returns The maximum token limit, or a default if the model is not found.
 */
export const getModelContextLimit = (modelInfo: { context_length?: number }): number => {
  // Look up context window from our mapping or use default
  return getContextWindowFromModelInfo(modelInfo);
};
