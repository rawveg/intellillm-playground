'use client'

import { useState, useEffect } from 'react'
import { X, RotateCcw } from 'lucide-react'
import { ParameterInfo, validateParameterValue, processDefaultValue } from '@/lib/parameterUtils'

/**
 * Format parameter name for better readability
 * - Converts camelCase to space-separated words (e.g., "numWords" -> "num Words")
 * - Converts snake_case to space-separated words (e.g., "num_words" -> "num words")
 * - Capitalizes the first letter of each word
 */
const formatParameterName = (paramName: string): string => {
  // First replace underscores with spaces
  let formatted = paramName.replace(/_/g, ' ');
  
  // Then insert spaces before capital letters (for camelCase)
  formatted = formatted.replace(/([A-Z])/g, ' $1');
  
  // Trim any extra spaces and ensure first letter of each word is capitalized
  return formatted
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface ParameterModalProps {
  parameters: ParameterInfo[]
  tabId: string
  tabName: string
  onSubmit: (values: Record<string, string>) => void
  onCancel: () => void
}

// Helper function to generate month options based on format
const generateMonthOptions = (format?: string): { value: string, label: string }[] => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  switch (format) {
    case 'short':
      return months.map((month, index) => ({
        value: shortMonths[index],
        label: shortMonths[index]
      }));
    case 'numeric':
      return months.map((month, index) => ({
        value: String(index + 1),
        label: String(index + 1)
      }));
    case 'numeric-dd':
      return months.map((month, index) => {
        const num = index + 1;
        const paddedNum = num < 10 ? `0${num}` : String(num);
        return {
          value: paddedNum,
          label: paddedNum
        };
      });
    default: // Full month names
      return months.map(month => ({
        value: month,
        label: month
      }));
  }
};

// Helper function to generate year options based on range
const generateYearOptions = (pastYears: number = 5, futureYears: number = 5): { value: string, label: string }[] => {
  const currentYear = new Date().getFullYear();
  const years: { value: string, label: string }[] = [];
  
  // Add past years
  for (let i = pastYears; i > 0; i--) {
    const year = currentYear - i;
    years.push({
      value: String(year),
      label: String(year)
    });
  }
  
  // Add current year
  years.push({
    value: String(currentYear),
    label: String(currentYear)
  });
  
  // Add future years
  for (let i = 1; i <= futureYears; i++) {
    const year = currentYear + i;
    years.push({
      value: String(year),
      label: String(year)
    });
  }
  
  return years;
};

/**
 * Sanitize file content to prevent prompt injection
 * @param content Raw file content
 * @returns Sanitized content
 */
const sanitizeFileContent = (content: string): string => {
  // Basic sanitization to prevent prompt injection
  // Remove potentially dangerous elements like {{, }}, etc.
  // that could interfere with parameter processing
  let sanitized = content;
  
  // Remove characters that could be used for parameter injection
  // This is a simple approach - more sophisticated approaches may be needed
  // depending on the specific security requirements
  sanitized = sanitized.replace(/[{}\\]/g, (match) => {
    switch (match) {
      case '{': return '\\{';
      case '}': return '\\}';
      case '\\': return '\\\\';
      default: return match;
    }
  });
  
  return sanitized;
};

export function ParameterModal({ parameters, tabId, tabName, onSubmit, onCancel }: ParameterModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasStoredValues, setHasStoredValues] = useState(false);

  // Load previously used values from localStorage and apply defaults
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize with default values first
      const initialValues: Record<string, string> = {};
      let usingStoredValues = false;
      
      // Apply default values
      parameters.forEach(param => {
        if (param.defaultValue) {
          // For multiselect fields, the default value can be comma-separated
          // and we need to ensure it's properly formatted
          if (param.type === 'multiselect') {
            // Ensure the default values are properly formatted for multiselect
            // The default value string might contain spaces after commas
            initialValues[param.name] = param.defaultValue.split(',').map(v => v.trim()).join(',');
          } else {
            // For all other fields, use the default value as is
            initialValues[param.name] = param.defaultValue;
          }
        }
      });
      
      // Then override with stored values if they exist
      const storedValues = localStorage.getItem(`param_values_${tabId}`);
      if (storedValues) {
        try {
          const parsedValues = JSON.parse(storedValues) as Record<string, string>;
          
          // Only use stored values for parameters that exist in the current prompt
          for (const [key, value] of Object.entries(parsedValues)) {
            if (parameters.some(p => p.name === key)) {
              initialValues[key] = value;
              usingStoredValues = true;
            }
          }
        } catch (e) {
          console.error('Failed to parse stored parameter values:', e);
        }
      }
      
      setValues(initialValues);
      setHasStoredValues(usingStoredValues);
    }
  }, [parameters, tabId]);

  const handleChange = (paramName: string, value: string) => {
    setValues(prev => ({ ...prev, [paramName]: value }));
    
    // Find the parameter definition
    const param = parameters.find(p => p.name === paramName);
    if (!param) return;
    
    // Validate the value
    const validation = validateParameterValue(param, value);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, [paramName]: validation.error || 'Invalid value' }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[paramName];
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    // Check if all required parameters have values
    const newErrors: Record<string, string> = {};
    let hasErrors = false;
    
    parameters.forEach(param => {
      const value = values[param.name] || '';
      
      // Check if value is empty
      if (value.trim() === '') {
        newErrors[param.name] = 'This field is required';
        hasErrors = true;
      } else {
        // Validate the value
        const validation = validateParameterValue(param, value);
        if (!validation.valid) {
          newErrors[param.name] = validation.error || 'Invalid value';
          hasErrors = true;
        }
      }
    });
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    // Save values to localStorage for future use
    localStorage.setItem(`param_values_${tabId}`, JSON.stringify(values));
    setHasStoredValues(true);
    
    // Submit the values
    onSubmit(values);
  };
  
  // Restore default values by clearing localStorage and resetting to defaults
  const handleRestoreDefaults = () => {
    // Remove stored values from localStorage
    localStorage.removeItem(`param_values_${tabId}`);
    
    // Reset to default values
    const defaultValues: Record<string, string> = {};
    parameters.forEach(param => {
      if (param.defaultValue) {
        defaultValues[param.name] = param.defaultValue;
      }
    });
    
    setValues(defaultValues);
    setErrors({});
    setHasStoredValues(false);
  };

  // Get validation hint text for a parameter
  const getValidationHint = (param: ParameterInfo): string => {
    if (!param.validationType || !param.validationRules) return '';
    
    switch (param.validationType) {
      case 'string':
        const minChars = param.validationRules.min !== undefined ? `min ${param.validationRules.min} chars` : '';
        const maxChars = param.validationRules.max !== undefined ? `max ${param.validationRules.max} chars` : '';
        return [minChars, maxChars].filter(Boolean).join(', ');
        
      case 'number':
        const minVal = param.validationRules.min !== undefined ? `min ${param.validationRules.min}` : '';
        const maxVal = param.validationRules.max !== undefined ? `max ${param.validationRules.max}` : '';
        return [minVal, maxVal].filter(Boolean).join(', ');
        
      case 'regexp':
        return 'must match pattern';
        
      default:
        return '';
    }
  };

  // Render the appropriate input field based on parameter type
  const renderParameterField = (param: ParameterInfo) => {
    const value = values[param.name] || '';
    
    // Add validation indicator if the parameter has validation rules
    const hasValidation = param.validationType && param.validationRules;
    const validationHint = hasValidation ? getValidationHint(param) : '';
    
    switch (param.type) {
      case 'file':
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input 
                type="file"
                id={`param-${param.name}-file`}
                accept=".txt,.md"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  // Validate file type
                  const validTypes = ['.txt', '.md', 'text/plain', 'text/markdown'];
                  const isValidType = validTypes.some(type => 
                    file.name.endsWith(type) || file.type === type
                  );
                  
                  if (!isValidType) {
                    setErrors(prev => ({ 
                      ...prev, 
                      [param.name]: 'Only .txt and .md files are allowed' 
                    }));
                    return;
                  }
                  
                  // Check file size (limit to 1MB)
                  const MAX_FILE_SIZE = 1024 * 1024; // 1MB
                  if (file.size > MAX_FILE_SIZE) {
                    setErrors(prev => ({ 
                      ...prev, 
                      [param.name]: 'File size must be less than 1MB' 
                    }));
                    return;
                  }
                  
                  // Read the file content
                  const reader = new FileReader();
                  reader.onload = () => {
                    const content = reader.result as string;
                    // Sanitize the content to prevent prompt injection
                    const sanitizedContent = sanitizeFileContent(content);
                    handleChange(param.name, sanitizedContent);
                  };
                  reader.onerror = () => {
                    setErrors(prev => ({ 
                      ...prev, 
                      [param.name]: 'Error reading file' 
                    }));
                  };
                  reader.readAsText(file);
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById(`param-${param.name}-file`)?.click()}
                className="px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Browse...
              </button>
              <div className="text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                {value ? `${value.length} characters loaded` : 'No file selected'}
              </div>
              {value && (
                <button
                  type="button"
                  onClick={() => handleChange(param.name, '')}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                  title="Clear file"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        );
        
      case 'multiline':
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <textarea
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              rows={4}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
            />
          </div>
        );
        
      case 'checkbox':
        const options = param.options || ['true', 'false'];
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`param-${param.name}`}
              checked={value === options[0]}
              onChange={(e) => handleChange(param.name, e.target.checked ? options[0] : options[1])}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`param-${param.name}`} className="text-sm">
              {options[0]}
            </label>
          </div>
        );
        
      case 'select':
        if (!param.options || param.options.length === 0) {
          return (
            <div className="text-red-500 text-xs">
              Error: No options provided for select field
            </div>
          );
        }
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <select
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className="w-full h-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              autoComplete="new-password"
              data-form-type="other"
            >
              <option value="" disabled>Select an option</option>
              {param.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
        
      case 'month':
        const monthOptions = generateMonthOptions(param.format);
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <select
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className="w-full h-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              autoComplete="new-password"
              data-form-type="other"
            >
              <option value="" disabled>Select a month</option>
              {monthOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
        
      case 'year':
        const yearOptions = generateYearOptions(
          param.pastYears !== undefined ? param.pastYears : 5,
          param.futureYears !== undefined ? param.futureYears : 5
        );
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <select
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className="w-full h-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              autoComplete="new-password"
              data-form-type="other"
            >
              <option value="" disabled>Select a year</option>
              {yearOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
        
      case 'multiselect':
        if (!param.options || param.options.length === 0) {
          return (
            <div className="text-red-500 text-xs">
              Error: No options provided for multiselect field
            </div>
          );
        }
        
        const selectedValues = value ? value.split(',').map(v => v.trim()) : [];
        
        // Handle checkbox change for multiselect
        const handleCheckboxChange = (option: string) => {
          let newSelectedValues = [...selectedValues];
          
          if (selectedValues.includes(option)) {
            // Remove the option if already selected
            newSelectedValues = newSelectedValues.filter(val => val !== option);
          } else {
            // Add the option if not already selected
            newSelectedValues.push(option);
          }
          
          handleChange(param.name, newSelectedValues.join(','));
        };
        
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <div className="border rounded dark:bg-gray-700 dark:border-gray-600 p-2 max-h-40 overflow-y-auto">
              {param.options.map((option, index) => (
                <div key={option} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    id={`param-${param.name}-${option}`}
                    checked={selectedValues.includes(option)}
                    onChange={() => handleCheckboxChange(option)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`param-${param.name}-${option}`} className="text-sm cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'number':
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <input
              type="number"
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className="w-full h-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
            />
          </div>
        );
        
      case 'date':
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <input
              type="date"
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className="w-full h-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
            />
          </div>
        );
        
      case 'time':
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <input
              type="time"
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className="w-full h-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
            />
          </div>
        );
        
      case 'email':
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <input
              type="email"
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className="w-full h-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="example@domain.com"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
        );
        
      case 'url':
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <input
              type="url"
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className="w-full h-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://example.com"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
            />
          </div>
        );
        
      default: // text input (default)
        return (
          <div>
            {validationHint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {validationHint}
              </div>
            )}
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              className="w-full h-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder={`Enter value for ${param.name}`}
              autoComplete="off" 
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
        );
    }
  };

  // Determine if we should use multi-column layout based on parameter count
  // Using 5 as the threshold for switching to multi-column layout
  const useMultiColumn = parameters.length > 5;
  
  // Maximum recommended parameters (for documentation purposes)
  const MAX_RECOMMENDED_PARAMETERS = 12;
  
  // Show a warning if there are too many parameters
  const tooManyParameters = parameters.length > MAX_RECOMMENDED_PARAMETERS;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${useMultiColumn ? 'w-full max-w-3xl' : 'w-full max-w-md'} max-h-[90vh] overflow-auto`}>
        <form 
          autoComplete="off" 
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          spellCheck="false"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{tabName} Parameters</h2>
            <button 
              type="button" 
              onClick={onCancel} 
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          </div>
        
        {tooManyParameters && (
          <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded">
            <strong>Note:</strong> This prompt has many parameters. Consider simplifying it for better usability.
          </div>
        )}
        
          <div className={`${useMultiColumn ? 'grid grid-cols-2 gap-4' : 'space-y-3'} text-sm`}>
            {parameters.map(param => (
              <div key={param.name} className="space-y-1">
                <label className="block text-xs font-medium">
                  {formatParameterName(param.name)}
                </label>
                {renderParameterField(param)}
                {errors[param.name] && (
                  <div className="text-red-500 text-xs mt-1">{errors[param.name]}</div>
                )}
              </div>
            ))}
          </div>
        
          <div className="mt-5 flex justify-between">
            {/* Restore Defaults button - only visible when stored values exist */}
            <div>
              {hasStoredValues && (
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="px-3 py-1.5 border rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  title="Restore to default values"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Restore Defaults
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 border rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 text-sm text-white rounded hover:bg-blue-700"
              >
                Run &gt;
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
