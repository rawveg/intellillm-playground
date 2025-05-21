import { useState } from 'react'
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

  // Function to share via GitHub Gist
  const shareToGist = async () => {
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
    } catch (err: any) {
      console.error('Error sharing to gist:', err)
      setError(err.message || 'Failed to create GitHub Gist')
    } finally {
      setLoading(false)
    }
  }

  // Function to generate email share link
  const getEmailShareLink = () => {
    const subject = encodeURIComponent(`IntelliLLM Playground Prompt: ${promptName}`)
    const body = encodeURIComponent(`I'm sharing a prompt from IntelliLLM Playground: ${promptName}\n\nView it online: ${window.location.origin}`)
    return `mailto:?subject=${subject}&body=${body}`
  }

  // Function to generate social media share links
  const getSocialShareLinks = () => {
    const shareText = encodeURIComponent(`Check out this prompt in IntelliLLM Playground: ${promptName}`)
    const shareUrl = encodeURIComponent(window.location.origin)
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
    }
  }

  // Function to copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      if (!shareUrl) return
      
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      setError('Failed to copy to clipboard')
    }
  }

  // Initial load of gist if needed
  if (activeTab === 'gist' && !shareUrl && !loading && !error) {
    shareToGist()
  }

  const socialLinks = getSocialShareLinks()

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

        {/* GitHub Gist Tab */}
        {activeTab === 'gist' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 py-4">{error}</div>
            ) : shareUrl ? (
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
                      onClick={copyToClipboard}
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
        {activeTab === 'email' && (
          <div className="py-4">
            <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">
              Share this prompt via email:
            </p>
            <a
              href={getEmailShareLink()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail className="w-4 h-4 mr-2" />
              Compose Email
            </a>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="py-4">
            <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">
              Share this prompt on social media:
            </p>
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
          </div>
        )}
      </div>
    </div>
  )
}