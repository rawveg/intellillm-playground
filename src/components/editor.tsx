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
  const { theme } = useTheme()

  return (
    <MonacoEditor
      height="100%"
      language={language}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        lineNumbers: 'on',
        readOnly,
        wordWrap: 'on',
        wrappingIndent: 'indent',
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
    />
  )
}
