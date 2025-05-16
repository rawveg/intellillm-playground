export const MODEL_CONTEXT_WINDOWS: { [key: string]: number } = {
  // Common models - this list should be expanded and kept up-to-date
  'openai/gpt-4': 8192,
  'openai/gpt-4-32k': 32768,
  'openai/gpt-4-turbo': 128000,
  'openai/gpt-3.5-turbo': 16385, // gpt-3.5-turbo-1106, common one
  'anthropic/claude-2': 200000, // Claude 2.1 has 200k
  'anthropic/claude-instant-1': 100000,
  'google/gemini-pro': 32768, // approximation, includes input and output
  'mistralai/mistral-7b-instruct': 8000, // Approximation, common context length
  'default_model_name': 8000 // A sensible default if model not found
};

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
 * @param modelName The name of the model.
 * @returns The maximum token limit, or a default if the model is not found.
 */
export const getModelContextLimit = (modelName: string): number => {
  return MODEL_CONTEXT_WINDOWS[modelName] || MODEL_CONTEXT_WINDOWS['default_model_name'];
};
