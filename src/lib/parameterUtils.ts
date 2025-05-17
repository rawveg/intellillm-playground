// Utility functions for handling prompt parameters

/**
 * Extract all unique parameters from a prompt string
 * @param promptText The prompt text to extract parameters from
 * @returns Array of unique parameter names
 */
export function extractParameters(promptText: string): string[] {
  if (!promptText) return [];
  
  const regex = /{{([^{}]+)}}/g;
  const matches = promptText.match(regex) || [];
  
  // Extract parameter names and remove duplicates
  const paramNames = matches.map(match => match.slice(2, -2));
  return Array.from(new Set(paramNames));
}

/**
 * Replace parameters in a prompt with their values
 * @param promptText The prompt text containing parameters
 * @param paramValues Object mapping parameter names to their values
 * @returns The prompt text with parameters replaced by their values
 */
export function replaceParameters(promptText: string, paramValues: Record<string, string>): string {
  if (!promptText) return '';
  
  let result = promptText;
  
  Object.entries(paramValues).forEach(([name, value]) => {
    const regex = new RegExp(`{{${name}}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}
