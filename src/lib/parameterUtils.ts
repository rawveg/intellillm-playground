// Utility functions for handling prompt parameters

/**
 * Interface representing a parameter with its type and options
 */
export interface ParameterInfo {
  name: string;
  type: string;
  options?: string[];
  format?: string;
  // For year ranges
  pastYears?: number;
  futureYears?: number;
}

/**
 * Error type for parameter validation issues
 */
export class ParameterValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParameterValidationError';
  }
}

/**
 * Check if a prompt contains nested parameters (parameters within parameters)
 * @param promptText The prompt text to check
 * @throws ParameterValidationError if nested parameters are found
 */
export function validateNoNestedParameters(promptText: string): void {
  if (!promptText) return;
  
  // First find all parameter matches
  const allMatches: { start: number, end: number, text: string }[] = [];
  const paramRegex = /{{([^{}]*)}}/g;
  let match;
  
  while ((match = paramRegex.exec(promptText)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0]
    });
  }
  
  // Check for overlapping parameters
  for (let i = 0; i < allMatches.length; i++) {
    for (let j = 0; j < allMatches.length; j++) {
      if (i !== j) {
        const a = allMatches[i];
        const b = allMatches[j];
        
        // Check if one parameter is inside another
        if (a.start < b.start && b.end < a.end) {
          throw new ParameterValidationError(
            `Nested parameters detected: ${a.text} contains ${b.text}. ` +
            `Nested or embedded parameters are not supported.`
          );
        }
      }
    }
  }
  
  // Also check for {{ inside parameter content
  const contentRegex = /{{([^{}]*{{[^{}]*}}[^{}]*)}}/g;
  if (contentRegex.test(promptText)) {
    throw new ParameterValidationError(
      'Nested parameters detected. Parameters cannot contain other parameters.'
    );
  }
}

/**
 * Extract all unique parameters from a prompt string with their types and options
 * @param promptText The prompt text to extract parameters from
 * @returns Array of parameter info objects
 * @throws ParameterValidationError if invalid parameter syntax is detected
 */
export function extractParameters(promptText: string): ParameterInfo[] {
  if (!promptText) return [];
  
  // First validate that there are no nested parameters
  validateNoNestedParameters(promptText);
  
  // Enhanced regex to match {{name}}, {{name|type}}, and {{name|type:options}}
  const paramRegex = /{{([^|{}]+)(?:\|([^:{}]+)(?::([^{}]+))?)?}}/g;
  const parameters: ParameterInfo[] = [];
  const paramNames = new Set<string>();
  
  let match;
  while ((match = paramRegex.exec(promptText)) !== null) {
    const [_, name, type = 'text', optionsString] = match;
    const trimmedName = name.trim();
    
    // Skip duplicates
    if (paramNames.has(trimmedName)) continue;
    paramNames.add(trimmedName);
    
    const paramInfo: ParameterInfo = {
      name: trimmedName,
      type: type ? type.trim().toLowerCase() : 'text'
    };
    
    // Parse options for applicable field types
    if (optionsString) {
      if (['select', 'multiselect', 'radio', 'checkbox'].includes(paramInfo.type)) {
        paramInfo.options = optionsString.split(',').map(opt => opt.trim());
      } else if (['date', 'time'].includes(paramInfo.type)) {
        paramInfo.format = optionsString.trim();
      } else if (paramInfo.type === 'month') {
        paramInfo.format = optionsString.trim();
      } else if (paramInfo.type.startsWith('year')) {
        // Handle year format options
        if (paramInfo.type.startsWith('year-last-')) {
          // Format: year-last-N
          const yearsBack = parseInt(paramInfo.type.replace('year-last-', ''), 10);
          if (!isNaN(yearsBack)) {
            paramInfo.type = 'year';
            paramInfo.pastYears = yearsBack;
            paramInfo.futureYears = 0;
          }
        } else if (paramInfo.type.startsWith('year-next-')) {
          // Format: year-next-N
          const yearsForward = parseInt(paramInfo.type.replace('year-next-', ''), 10);
          if (!isNaN(yearsForward)) {
            paramInfo.type = 'year';
            paramInfo.pastYears = 0;
            paramInfo.futureYears = yearsForward;
          }
        } else if (optionsString && optionsString.includes('-')) {
          // Format: year:N-M
          const [pastStr, futureStr] = optionsString.split('-');
          const pastYears = parseInt(pastStr, 10);
          const futureYears = parseInt(futureStr, 10);
          
          if (!isNaN(pastYears) && !isNaN(futureYears)) {
            paramInfo.pastYears = pastYears;
            paramInfo.futureYears = futureYears;
          }
        } else {
          // Default: 5 years back, 5 years forward
          paramInfo.pastYears = 5;
          paramInfo.futureYears = 5;
        }
      }
    } else if (paramInfo.type === 'year') {
      // Default year range if not specified
      paramInfo.pastYears = 5;
      paramInfo.futureYears = 5;
    }
    
    parameters.push(paramInfo);
  }
  
  return parameters;
}

/**
 * Get only the parameter names from a prompt string
 * @param promptText The prompt text to extract parameter names from
 * @returns Array of unique parameter names
 */
export function extractParameterNames(promptText: string): string[] {
  return extractParameters(promptText).map(param => param.name);
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
    // Match any parameter with this name, regardless of type or options
    const regex = new RegExp(`{{${name}(?:\\|[^{}]+)?}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}
