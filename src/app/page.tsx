'use client'

import { Editor } from '@/components/editor'
import { Settings } from '@/components/settings'
import { Tabs } from '@/components/tabs'
import { useState, useEffect } from 'react'

export default function Home() {
  const [apiKey, setApiKey] = useState<string>('')

  useEffect(() => {
    // Load API key from localStorage on client side
    const storedKey = localStorage.getItem('openrouter_api_key')
    if (storedKey) {
      setApiKey(storedKey)
    }
  }, [])

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <Tabs />
        </div>
        <div className="w-80 border-l border-gray-200 dark:border-gray-800">
          <Settings 
            apiKey={apiKey}
            onApiKeyChange={(key) => {
              setApiKey(key)
              localStorage.setItem('openrouter_api_key', key)
            }}
          />
        </div>
      </div>
    </main>
  )
}
