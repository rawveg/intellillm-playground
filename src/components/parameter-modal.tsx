'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

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
  parameters: string[]
  tabId: string
  onSubmit: (values: Record<string, string>) => void
  onCancel: () => void
}

export function ParameterModal({ parameters, tabId, onSubmit, onCancel }: ParameterModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

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
            if (parameters.includes(key)) {
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

  const handleChange = (param: string, value: string) => {
    setValues(prev => ({ ...prev, [param]: value }));
  };

  const handleSubmit = () => {
    // Save values to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`param_values_${tabId}`, JSON.stringify(values));
    }
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Enter Parameter Values</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          {parameters.map(param => (
            <div key={param} className="space-y-2">
              <label className="block text-sm font-medium">
                {formatParameterName(param)}
              </label>
              <input
                type="text"
                value={values[param] || ''}
                onChange={(e) => handleChange(param, e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder={`Enter value for ${param}`}
              />
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Run &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
