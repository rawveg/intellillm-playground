'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ParameterInfo } from '@/lib/parameterUtils'

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

export function ParameterModal({ parameters, tabId, onSubmit, onCancel }: ParameterModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load previously used values from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedValues = localStorage.getItem(`param_values_${tabId}`);
      if (storedValues) {
        try {
          const parsedValues = JSON.parse(storedValues) as Record<string, string>;
          // Only use stored values for parameters that exist in the current prompt
          const filteredValues: Record<string, string> = {};
          
          // Filter only the parameters that exist in the current prompt
          for (const [key, value] of Object.entries(parsedValues)) {
            if (parameters.some(p => p.name === key)) {
              filteredValues[key] = value;
            }
          }
          
          setValues(filteredValues);
        } catch (e) {
          console.error('Failed to parse stored parameter values:', e);
        }
      }
    }
  }, [parameters, tabId]);

  const handleChange = (paramName: string, value: string) => {
    setValues(prev => ({ ...prev, [paramName]: value }));
  };

  const handleSubmit = () => {
    // Validate all parameters have values
    const newErrors: Record<string, string> = {};
    let hasErrors = false;
    
    parameters.forEach(param => {
      if (!values[param.name] || values[param.name].trim() === '') {
        newErrors[param.name] = 'This field is required';
        hasErrors = true;
      }
    });
    
    setErrors(newErrors);
    
    // Only proceed if there are no errors
    if (!hasErrors) {
      // Save values to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`param_values_${tabId}`, JSON.stringify(values));
      }
      onSubmit(values);
    }
  };
  
  // Render the appropriate input field based on parameter type
  const renderParameterField = (param: ParameterInfo) => {
    const value = values[param.name] || '';
    
    switch (param.type) {
      case 'multiline':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            rows={4}
            placeholder={`Enter value for ${param.name}`}
          />
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
        return (
          <select
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Select...</option>
            {param.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
        
      case 'month':
        // Generate month options based on format
        const monthOptions = generateMonthOptions(param.format);
        
        // Set default value to current month if not already set
        useEffect(() => {
          if (!values[param.name]) {
            const currentDate = new Date();
            let currentMonth;
            
            switch (param.format) {
              case 'short':
                currentMonth = monthOptions[currentDate.getMonth()].value;
                break;
              case 'numeric':
                currentMonth = String(currentDate.getMonth() + 1);
                break;
              case 'numeric-dd':
                const monthNum = currentDate.getMonth() + 1;
                currentMonth = monthNum < 10 ? `0${monthNum}` : String(monthNum);
                break;
              default: // Full month names
                currentMonth = monthOptions[currentDate.getMonth()].value;
            }
            
            handleChange(param.name, currentMonth);
          }
        }, [param.name, param.format]);
        
        return (
          <select
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Select month...</option>
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        );
        
      case 'year':
        // Generate year options based on specified range
        const yearOptions = generateYearOptions(
          param.pastYears || 5,
          param.futureYears || 5
        );
        
        // Set default value to current year if not already set
        useEffect(() => {
          if (!values[param.name]) {
            const currentYear = String(new Date().getFullYear());
            handleChange(param.name, currentYear);
          }
        }, [param.name]);
        
        return (
          <select
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Select year...</option>
            {yearOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        );
        
      case 'multiselect':
        const selectedValues = value ? value.split(',').map(v => v.trim()) : [];
        return (
          <div className="space-y-2">
            <select
              multiple
              value={selectedValues}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                handleChange(param.name, selected.join(', '));
              }}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              size={Math.min(4, param.options?.length || 4)}
            >
              {param.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Hold Ctrl/Cmd to select multiple options
            </div>
          </div>
        );
        
      case 'radio':
        return (
          <div className="space-y-2">
            {param.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`param-${param.name}-${option}`}
                  name={param.name}
                  value={option}
                  checked={value === option}
                  onChange={() => handleChange(param.name, option)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={`param-${param.name}-${option}`} className="text-sm">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
        
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder={`Enter value for ${param.name}`}
          />
        );
        
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        );
        
      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        );
        
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="example@domain.com"
          />
        );
        
      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="https://example.com"
          />
        );
        
      default: // text input (default)
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder={`Enter value for ${param.name}`}
          />
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Enter Parameter Values</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
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
        
        <div className="mt-5 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 border rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 bg-blue-600 text-sm text-white rounded hover:bg-blue-700"
          >
            Run &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
