/**
 * Extracts the Gist ID from various types of GitHub Gist URLs
 */
export function extractGistIdFromUrl(url: string): string | null {
  // Skip if not a string or empty
  if (!url || typeof url !== 'string') return null
  
  // Handle different URL formats
  try {
    // Parse the URL
    const parsedUrl = new URL(url)
    
    // Check if it's a GitHub domain
    if (!parsedUrl.hostname.includes('github.com')) return null
    
    // Extract the Gist ID from the path
    const pathParts = parsedUrl.pathname.split('/')
    
    // For URLs like https://gist.github.com/{username}/{gist_id}
    if (parsedUrl.hostname === 'gist.github.com' && pathParts.length >= 3) {
      return pathParts[2]
    }
    
    // For URLs like https://github.com/{username}/{repo}/blob/{branch}/path/to/file
    if (pathParts.length >= 3 && pathParts[1] === 'gist' && pathParts[2] !== '') {
      return pathParts[2].split('#')[0].split('?')[0]
    }
    
    // For URLs like https://api.github.com/gists/{gist_id}
    if (parsedUrl.hostname === 'api.github.com' && pathParts.length >= 3 && pathParts[1] === 'gists') {
      return pathParts[2]
    }
    
    return null
  } catch (error) {
    console.error('Error parsing Gist URL:', error)
    return null
  }
}