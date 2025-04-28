'use client'

import MonacoEditor from '@monaco-editor/react'
import { useTheme } from 'next-themes'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  language?: 'markdown' | 'json'
  readOnly?: boolean
}

export function Editor({ content, onChange, language = 'markdown', readOnly = false }: EditorProps) {
  const { theme } = useTheme()

  return (
    <MonacoEditor
      height="100%"
      language={language}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      value={content}
      onChange={value => onChange(value || '')}
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
