'use client'

import { Editor as MonacoEditor } from '@monaco-editor/react'
import { useTheme } from 'next-themes'

interface EditorProps {
  value: string
  onChange: (value: string | undefined) => void
  language?: 'markdown' | 'json'
  readOnly?: boolean
}

export function Editor({ value, onChange, language = 'markdown', readOnly = false }: EditorProps) {
  const { theme, systemTheme } = useTheme()

  // If theme is system, use systemTheme, otherwise use the selected theme
  const currentTheme = theme === 'system' ? systemTheme : theme

  return (
    <MonacoEditor
      height="100%"
      language={language}
      theme={currentTheme === 'dark' ? 'vs-dark' : 'light'}
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        lineNumbers: 'on',
        readOnly,
        wordWrap: 'on',
        wrappingIndent: 'none',
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
    />
  )
}
