import { useState, useEffect, useCallback } from 'react'
import { X, Copy, ExternalLink, Mail, Github, Share2, Twitter, Facebook, Linkedin } from 'lucide-react'

interface ShareModalProps {
  promptPath: string
  promptName: string
  onClose: () => void
}

export function ShareModal({ promptPath, promptName, onClose }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'gist' | 'email' | 'social'>('gist')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [promptContent, setPromptContent] = useState<{
    markdownContent: string;
    plainTextContent: string;
  } | null>(null)
  const [socialLinks, setSocialLinks] = useState<{
    twitter: string;
    facebook: string;
    linkedin: string;
  } | null>(null)

  // Load prompt content for any share method
  useEffect(() => {
    const loadPromptContent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const encodedPath = encodeURIComponent(promptPath)
        const response = await fetch('/api/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            promptPath: encodedPath,
            shareMethod: 'content'
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load prompt content')
        }
        
        const data = await response.json()
        setPromptContent({
          markdownContent: data.markdownContent,
          plainTextContent: data.plainTextContent
        })
      } catch (err: any) {
        console.error('Error loading prompt content:', err)
        setError(err.message || 'Failed to load prompt content')
      } finally {
        setLoading(false)
      }
    }

    loadPromptContent()
  }, [promptPath])

  // Function to share via GitHub Gist
  const shareToGist = useCallback(async () => {
    if (shareUrl) return // Don't create a new gist if we already have one

    try {
      setLoading(true)
      setError(null)
      
      const encodedPath = encodeURIComponent(promptPath)
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          promptPath: encodedPath,
          shareMethod: 'gist'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create gist')
      }
      
      const data = await response.json()
      setShareUrl(data.shareUrl)

      // If we didn't have prompt content yet, set it now
      if (!promptContent && data.markdownContent && data.plainTextContent) {
        setPromptContent({
          markdownContent: data.markdownContent,
          plainTextContent: data.plainTextContent
        })
      }
    } catch (err: any) {
      console.error('Error sharing to gist:', err)
      setError(err.message || 'Failed to create GitHub Gist')
    } finally {
      setLoading(false)
    }
  }, [promptPath, shareUrl, promptContent])

  // Function to generate email share link
  const getEmailShareLink = useCallback(() => {
    const subject = encodeURIComponent(`IntelliLLM Playground Prompt: ${promptName}`)
    
    // Check if we have content to share, otherwise use a placeholder
    let body
    if (promptContent) {
      body = encodeURIComponent(`I'm sharing a prompt from IntelliLLM Playground:\n\n${promptContent.plainTextContent}`)
    } else {
      body = encodeURIComponent(`I'm sharing a prompt from IntelliLLM Playground: ${promptName}`)
    }
    
    return `mailto:?subject=${subject}&body=${body}`
  }, [promptName, promptContent])

  // Function to generate social media share links
  const updateSocialLinks = useCallback(async () => {
    // For social sharing, we need a Gist link for longer content
    if (!shareUrl && activeTab === 'social') {
      await shareToGist()
      return // The effect will call this function again once shareUrl is set
    }
    
    const shareText = encodeURIComponent(`Check out this prompt in IntelliLLM Playground: ${promptName}`)
    
    // Use the Gist URL if available, otherwise we'll just share the prompt name
    const shareLink = shareUrl ? encodeURIComponent(shareUrl) : ''
    
    setSocialLinks({
      twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareLink}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareLink}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareLink}`
    })
  }, [shareUrl, activeTab, promptName, shareToGist])

  // Effect to update social links when tab changes
  useEffect(() => {
    if (activeTab === 'social') {
      updateSocialLinks()
    }
  }, [activeTab, updateSocialLinks])

  // Function to copy URL or content to clipboard
  const copyToClipboard = async (textToCopy: string | null) => {
    try {
      if (!textToCopy) return
      
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      setError('Failed to copy to clipboard')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Share Prompt: {promptName}</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b dark:border-gray-700 mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'gist' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
              : 'text-gray-500'}`}
            onClick={() => setActiveTab('gist')}
          >
            <span className="flex items-center"><Github className="w-4 h-4 mr-1" /> Gist</span>
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'email' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
              : 'text-gray-500'}`}
            onClick={() => setActiveTab('email')}
          >
            <span className="flex items-center"><Mail className="w-4 h-4 mr-1" /> Email</span>
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'social' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
              : 'text-gray-500'}`}
            onClick={() => setActiveTab('social')}
          >
            <span className="flex items-center"><Share2 className="w-4 h-4 mr-1" /> Social</span>
          </button>
        </div>

        {/* Loading state for any tab */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error state for any tab */}
        {!loading && error && (
          <div className="text-red-500 py-4">{error}</div>
        )}

        {/* GitHub Gist Tab */}
        {!loading && activeTab === 'gist' && (
          <div>
            {shareUrl ? (
              <>
                <div className="mb-4">
                  <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Your prompt has been shared as a GitHub Gist. Copy the link or open it directly:
                  </p>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 p-2 border rounded-l dark:bg-gray-800 dark:border-gray-700 text-sm"
                    />
                    <button 
                      onClick={() => copyToClipboard(shareUrl)}
                      className="p-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
                  )}
                </div>
                <button
                  onClick={() => window.open(shareUrl, '_blank')}
                  className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in new tab
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <button
                  onClick={shareToGist}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create GitHub Gist
                </button>
              </div>
            )}
          </div>
        )}

        {/* Email Tab */}
        {!loading && activeTab === 'email' && promptContent && (
          <div className="py-4">
            <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">
              Share this prompt via email:
            </p>
            <div className="mb-4 border p-3 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-auto max-h-40">
              <pre className="text-xs whitespace-pre-wrap">{promptContent.plainTextContent}</pre>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(promptContent.plainTextContent)}
                className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy content
              </button>
              <a
                href={getEmailShareLink()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center flex-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="w-4 h-4 mr-2" />
                Compose Email
              </a>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {!loading && activeTab === 'social' && (
          <div className="py-4">
            <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">
              Share this prompt on social media:
            </p>
            {!shareUrl && !error ? (
              <div className="text-center py-4">
                <p className="text-sm mb-2">Creating a public link to share...</p>
                <button
                  onClick={shareToGist}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create shareable link
                </button>
              </div>
            ) : socialLinks ? (
              <div className="grid grid-cols-3 gap-3">
                <a
                  href={socialLinks.twitter}
                  className="px-4 py-2 bg-[#1DA1F2] text-white rounded hover:bg-opacity-90 flex items-center justify-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </a>
                <a
                  href={socialLinks.facebook}
                  className="px-4 py-2 bg-[#4267B2] text-white rounded hover:bg-opacity-90 flex items-center justify-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </a>
                <a
                  href={socialLinks.linkedin}
                  className="px-4 py-2 bg-[#0A66C2] text-white rounded hover:bg-opacity-90 flex items-center justify-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm">Failed to generate social media links.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Share Prompt: {promptName}</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b dark:border-gray-700 mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'gist' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
              : 'text-gray-500'}`}
            onClick={() => setActiveTab('gist')}
          >
            <span className="flex items-center"><Github className="w-4 h-4 mr-1" /> Gist</span>
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'email' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
              : 'text-gray-500'}`}
            onClick={() => setActiveTab('email')}
          >
            <span className="flex items-center"><Mail className="w-4 h-4 mr-1" /> Email</span>
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'social' 
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
              : 'text-gray-500'}`}
            onClick={() => setActiveTab('social')}
          >
            <span className="flex items-center"><Share2 className="w-4 h-4 mr-1" /> Social</span>
          </button>
        </div>

        {/* Loading state for any tab */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error state for any tab */}
        {!loading && error && (
          <div className="text-red-500 py-4">{error}</div>
        )}

        {/* GitHub Gist Tab */}
        {!loading && activeTab === 'gist' && (
          <div>
            {shareUrl ? (
              <>
                <div className="mb-4">
                  <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Your prompt has been shared as a GitHub Gist. Copy the link or open it directly:
                  </p>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 p-2 border rounded-l dark:bg-gray-800 dark:border-gray-700 text-sm"
                    />
                    <button 
                      onClick={() => copyToClipboard(shareUrl)}
                      className="p-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
                  )}
                </div>
                <button
                  onClick={() => window.open(shareUrl, '_blank')}
                  className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in new tab
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <button
                  onClick={shareToGist}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create GitHub Gist
                </button>
              </div>
            )}
          </div>
        )}

        {/* Email Tab */}
        {!loading && activeTab === 'email' && promptContent && (
          <div className="py-4">
            <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">
              Share this prompt via email:
            </p>
            <div className="mb-4 border p-3 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-auto max-h-40">
              <pre className="text-xs whitespace-pre-wrap">{promptContent.plainTextContent}</pre>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(promptContent.plainTextContent)}
                className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy content
              </button>
              <a
                href={getEmailShareLink()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center flex-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="w-4 h-4 mr-2" />
                Compose Email
              </a>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {!loading && activeTab === 'social' && (
          <div className="py-4">
            <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">
              Share this prompt on social media:
            </p>
            {!shareUrl && !error ? (
              <div className="text-center py-4">
                <p className="text-sm mb-2">Creating a public link to share...</p>
                <button
                  onClick={shareToGist}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create shareable link
                </button>
              </div>
            ) : socialLinks ? (
              <div className="grid grid-cols-3 gap-3">
                <a
                  href={socialLinks.twitter}
                  className="px-4 py-2 bg-[#1DA1F2] text-white rounded hover:bg-opacity-90 flex items-center justify-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </a>
                <a
                  href={socialLinks.facebook}
                  className="px-4 py-2 bg-[#4267B2] text-white rounded hover:bg-opacity-90 flex items-center justify-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </a>
                <a
                  href={socialLinks.linkedin}
                  className="px-4 py-2 bg-[#0A66C2] text-white rounded hover:bg-opacity-90 flex items-center justify-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm">Failed to generate social media links.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}