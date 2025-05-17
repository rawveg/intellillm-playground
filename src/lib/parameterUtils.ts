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
  // Validation properties
  validationType?: string;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    // Other validation rules as needed
  };
  // Default value
  defaultValue?: string;
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
 * Parse validation rules based on validation type
 * @param validationType Type of validation (string, number, regexp)
 * @param rulesString String containing validation rules
 * @param fieldType The field type this validation applies to
 * @returns Parsed validation rules object
 */
function parseValidationRules(validationType: string, rulesString: string, fieldType: string): any {
  const rules: any = {};
  
  switch (validationType) {
    case 'string':
      // Parse min-X, max-X format
      rulesString.split(',').forEach(rule => {
        const trimmedRule = rule.trim();
        if (trimmedRule.startsWith('min-')) {
          const minValue = parseInt(trimmedRule.substring(4), 10);
          if (!isNaN(minValue)) rules.min = minValue;
        } else if (trimmedRule.startsWith('max-')) {
          const maxValue = parseInt(trimmedRule.substring(4), 10);
          if (!isNaN(maxValue)) rules.max = maxValue;
        }
      });
      break;
      
    case 'number':
      // Parse min-X, max-X format for numbers
      rulesString.split(',').forEach(rule => {
        const trimmedRule = rule.trim();
        if (trimmedRule.startsWith('min-')) {
          const minValue = parseFloat(trimmedRule.substring(4));
          if (!isNaN(minValue)) rules.min = minValue;
        } else if (trimmedRule.startsWith('max-')) {
          const maxValue = parseFloat(trimmedRule.substring(4));
          if (!isNaN(maxValue)) rules.max = maxValue;
        }
      });
      break;
      
    case 'regexp':
      // Store the regex pattern
      try {
        // Test if it's a valid regex by creating a RegExp object
        // Use a timeout or complexity check to prevent regex DoS
        const safeRegexCheck = new RegExp(rulesString);
        rules.pattern = rulesString;
      } catch (e) {
        console.warn(`Invalid regex pattern: ${rulesString}`);
      }
      break;
      
    default:
      // Unknown validation type, ignore
      console.warn(`Unknown validation type: ${validationType}`);
  }
  
  return rules;
}

/**
 * Extract default value from a parameter string
 * @param paramParts Array of parameter parts (type, options, validation, etc.)
 * @returns Default value if found, undefined otherwise
 */
function extractDefaultValue(paramParts: string[]): string | undefined {
  for (const part of paramParts) {
    if (part.trim().startsWith('default:')) {
      const defaultValue = part.trim().substring('default:'.length).trim();
      return defaultValue.length > 0 ? defaultValue : '';
    }
  }
  return undefined;
}

/**
 * Process default value based on parameter type
 * @param defaultValue The raw default value string
 * @param paramType The parameter type
 * @param options Optional parameter options (for validation against select/multiselect options)
 * @returns Processed default value
 */
export function processDefaultValue(defaultValue: string, paramType: string, options?: string[]): string {
  if (defaultValue === 'current') {
    try {
      const now = new Date();
      
      switch (paramType) {
        case 'date':
          return now.toISOString().split('T')[0]; // YYYY-MM-DD
        case 'time':
          return now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
        case 'year':
          return now.getFullYear().toString();
        case 'month':
          return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(now);
        default:
          return defaultValue;
      }
    } catch (e) {
      console.error('Error processing special default value:', e);
      return defaultValue; // Fall back to the original value
    }
  }
  
  // For multiselect, ensure the values are valid and properly formatted
  if (paramType === 'multiselect' && options && options.length > 0) {
    // Split the default values, trim them, and filter to only include valid options
    const defaultValues = defaultValue.split(',').map(v => v.trim());
    
    // Validate that each default value is in the options list
    const validDefaultValues = defaultValues.filter(value => 
      options.some(option => option.trim().toLowerCase() === value.toLowerCase())
    );
    
    return validDefaultValues.join(',');
  }
  
  return defaultValue;
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
  
  // Enhanced regex to match {{name}}, {{name|type}}, {{name|type:options}}, and {{name|type|validation:rules}}
  // We'll keep the original regex pattern to maintain backward compatibility
  const paramRegex = /{{([^|{}]+)(?:\|([^:|{}]+)(?::([^|{}]+))?)?(?:\|([^:|{}]+)(?::([^{}]+))?)?}}/g;
  const parameters: ParameterInfo[] = [];
  const paramNames = new Set<string>();
  
  let match;
  while ((match = paramRegex.exec(promptText)) !== null) {
    const [fullMatch, name, typeOrValidation, optionsOrRules, validationType, validationRules] = match;
    const trimmedName = name.trim();
    
    // Skip duplicates
    if (paramNames.has(trimmedName)) continue;
    paramNames.add(trimmedName);
    
    // Look for default value in the full match
    const defaultValueMatch = fullMatch.match(/\|default:([^|}]+)/i);
    let defaultValue: string | undefined;
    if (defaultValueMatch && defaultValueMatch[1]) {
      defaultValue = defaultValueMatch[1].trim();
    }
    
    // Determine if the second part is a type or validation
    let type = 'text';
    let options: string[] | undefined;
    let format: string | undefined;
    let vType: string | undefined;
    let vRules: string | undefined;
    
    if (typeOrValidation) {
      // If it's a known field type, it's a type
      const knownTypes = ['text', 'multiline', 'number', 'email', 'url', 'checkbox', 
                          'select', 'multiselect', 'radio', 'date', 'time', 'month', 'year'];
      
      if (knownTypes.includes(typeOrValidation.trim().toLowerCase()) || 
          typeOrValidation.trim().toLowerCase().startsWith('year-')) {
        type = typeOrValidation.trim().toLowerCase();
        
        // Parse options for the type if present
        if (optionsOrRules) {
          if (['select', 'multiselect', 'radio', 'checkbox'].includes(type)) {
            options = optionsOrRules.split(',').map(opt => opt.trim());
          } else if (['date', 'time', 'month'].includes(type)) {
            format = optionsOrRules.trim();
          } else if (type === 'year' || type.startsWith('year-')) {
            // Handle year format options
            if (type.startsWith('year-last-')) {
              // Format: year-last-N
              const yearsBack = parseInt(type.replace('year-last-', ''), 10);
              if (!isNaN(yearsBack)) {
                type = 'year';
                options = [`pastYears-${yearsBack}`, 'futureYears-0'];
              }
            } else if (type.startsWith('year-next-')) {
              // Format: year-next-N
              const yearsForward = parseInt(type.replace('year-next-', ''), 10);
              if (!isNaN(yearsForward)) {
                type = 'year';
                options = ['pastYears-0', `futureYears-${yearsForward}`];
              }
            } else if (optionsOrRules && optionsOrRules.includes('-')) {
              // Format: year:N-M
              const [pastStr, futureStr] = optionsOrRules.split('-');
              options = [`pastYears-${pastStr}`, `futureYears-${futureStr}`];
            }
          }
        }
        
        // Check for validation part
        vType = validationType;
        vRules = validationRules;
      } else {
        // If not a known type, assume it's a validation type with no field type specified
        type = 'text'; // Default to text
        vType = typeOrValidation;
        vRules = optionsOrRules;
      }
    }
    
    const paramInfo: ParameterInfo = {
      name: trimmedName,
      type
    };
    
    // Add default value if found
    if (defaultValue !== undefined) {
      paramInfo.defaultValue = defaultValue;
    }
    
    // Add type-specific options
    if (options) paramInfo.options = options;
    if (format) paramInfo.format = format;
    
    // Handle year ranges
    if (type === 'year') {
      if (options) {
        options.forEach(opt => {
          if (opt.startsWith('pastYears-')) {
            const pastYears = parseInt(opt.replace('pastYears-', ''), 10);
            if (!isNaN(pastYears)) paramInfo.pastYears = pastYears;
          } else if (opt.startsWith('futureYears-')) {
            const futureYears = parseInt(opt.replace('futureYears-', ''), 10);
            if (!isNaN(futureYears)) paramInfo.futureYears = futureYears;
          }
        });
      } else {
        // Default year range if not specified
        paramInfo.pastYears = 5;
        paramInfo.futureYears = 5;
      }
    }
    
    // Parse validation rules if present
    if (vType) {
      paramInfo.validationType = vType.trim().toLowerCase();
      
      if (vRules) {
        paramInfo.validationRules = parseValidationRules(
          vType.trim().toLowerCase(), 
          vRules, 
          paramInfo.type
        );
      }
    }
    
    // Process default value if it's a special value
    if (paramInfo.defaultValue) {
      paramInfo.defaultValue = processDefaultValue(paramInfo.defaultValue, paramInfo.type, paramInfo.options);
      
      // Validate default value if validation rules exist
      if (paramInfo.validationType && paramInfo.validationRules) {
        const validation = validateParameterValue(paramInfo, paramInfo.defaultValue);
        if (!validation.valid) {
          console.warn(`Default value "${paramInfo.defaultValue}" for parameter "${paramInfo.name}" fails validation: ${validation.error}`);
          // Keep the default but log a warning - don't throw an error to maintain backward compatibility
        }
      }
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
    // Match any parameter with this name, regardless of type or options or validation
    const regex = new RegExp(`{{${name}(?:\\|[^{}]+)?(?:\\|[^{}]+)?}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

/**
 * Validate a parameter value against its validation rules
 * @param param The parameter info with validation rules
 * @param value The value to validate
 * @returns Object with validation result and optional error message
 */
export function validateParameterValue(
  param: ParameterInfo, 
  value: string
): { valid: boolean; error?: string } {
  if (!param.validationType || !param.validationRules) {
    return { valid: true };
  }
  
  switch (param.validationType) {
    case 'string':
      return validateStringValue(value, param.validationRules);
    case 'number':
      return validateNumberValue(value, param.validationRules);
    case 'regexp':
      return validateRegexpValue(value, param.validationRules);
    default:
      return { valid: true };
  }
}

/**
 * Validate a string value against string validation rules
 */
function validateStringValue(value: string, rules: any): { valid: boolean; error?: string } {
  if (rules.min !== undefined && value.length < rules.min) {
    return { 
      valid: false, 
      error: `Must be at least ${rules.min} characters` 
    };
  }
  
  if (rules.max !== undefined && value.length > rules.max) {
    return { 
      valid: false, 
      error: `Must be at most ${rules.max} characters` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate a number value against number validation rules
 */
function validateNumberValue(value: string, rules: any): { valid: boolean; error?: string } {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a valid number' };
  }
  
  if (rules.min !== undefined && num < rules.min) {
    return { 
      valid: false, 
      error: `Must be at least ${rules.min}` 
    };
  }
  
  if (rules.max !== undefined && num > rules.max) {
    return { 
      valid: false, 
      error: `Must be at most ${rules.max}` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate a value against a regular expression pattern
 */
function validateRegexpValue(value: string, rules: any): { valid: boolean; error?: string } {
  if (!rules.pattern) {
    return { valid: true };
  }
  
  try {
    // Implement regex timeout protection to prevent regex DoS
    // This is a simplified version - in production, use a more robust solution
    const MAX_REGEX_EXECUTION_TIME = 100; // ms
    const startTime = Date.now();
    
    const regex = new RegExp(rules.pattern);
    
    // Simple check for potentially catastrophic backtracking patterns
    if (rules.pattern.match(/(\.\*){2,}|\(\.\*\){2,}/)) {
      console.warn('Potentially dangerous regex pattern detected:', rules.pattern);
      return { 
        valid: false, 
        error: 'Invalid regex pattern (potentially unsafe)' 
      };
    }
    
    const matches = regex.test(value);
    
    // Check if regex execution took too long
    if (Date.now() - startTime > MAX_REGEX_EXECUTION_TIME) {
      console.warn('Regex execution timeout:', rules.pattern);
      return { 
        valid: false, 
        error: 'Regex validation timed out (pattern too complex)' 
      };
    }
    
    if (!matches) {
      return { 
        valid: false, 
        error: 'Value does not match the required pattern' 
      };
    }
    
    return { valid: true };
  } catch (e) {
    console.error('Invalid regex pattern:', rules.pattern, e);
    return { 
      valid: false, 
      error: 'Invalid regex pattern' 
    }; // Fail closed if the regex is invalid
  }
}
