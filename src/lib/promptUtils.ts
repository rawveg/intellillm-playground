import fs from 'fs'
import path from 'path'
import YAML from 'yaml'

const PROMPTS_DIR = '/app/prompts'

// Ensure prompts directory exists
if (!fs.existsSync(PROMPTS_DIR)) {
  fs.mkdirSync(PROMPTS_DIR, { recursive: true })
}

export interface PromptMetadata {
  created: string
  model: string
  [key: string]: any
}

export interface PromptFile {
  name: string
  metadata: PromptMetadata
  content: string
  systemPrompt?: string
  path?: string // Full path relative to the prompts directory
}

export interface FileEntry {
  name: string
  isDirectory: boolean
  path: string // Path relative to the prompts directory
  created?: string // Optional timestamp for when the file was created
}

/**
 * Create a folder in the prompts directory
 */
export async function createFolder(folderPath: string): Promise<void> {
  const fullPath = path.join(PROMPTS_DIR, folderPath)
  await fs.promises.mkdir(fullPath, { recursive: true })
}

/**
 * Save a prompt file to a specific path
 */
export async function savePrompt(name: string, content: string, metadata: PromptMetadata, systemPrompt?: string): Promise<void> {
  let fileContent = `---
${YAML.stringify(metadata)}---

${content}`
  if (systemPrompt) {
    fileContent += `

## System Prompt
${systemPrompt}`
  }
  
  // Ensure the directory exists (for nested folders)
  const dirPath = path.dirname(path.join(PROMPTS_DIR, name))
  await fs.promises.mkdir(dirPath, { recursive: true })
  
  // Save the file with .prompt extension if it doesn't have one already
  const filePath = path.join(PROMPTS_DIR, name.endsWith('.prompt') ? name : `${name}.prompt`)
  await fs.promises.writeFile(filePath, fileContent, 'utf-8')
}

/**
 * Load a prompt file from a given path
 */
export async function loadPrompt(filePath: string): Promise<PromptFile> {
  // Add .prompt extension if it's not already present
  if (!filePath.endsWith('.prompt')) {
    filePath = `${filePath}.prompt`
  }
  
  const fullPath = path.join(PROMPTS_DIR, filePath)
  const content = await fs.promises.readFile(fullPath, 'utf-8')
  const [, frontmatter, promptContent] = content.split('---')
  
  // Split content by system prompt marker if it exists
  const [userPrompt, systemPrompt] = promptContent.split('## System Prompt').map(s => s.trim())
  
  // Get just the filename without extension for display
  const displayName = path.basename(filePath, '.prompt')
  
  return {
    name: displayName,
    path: filePath.replace(/\.prompt$/, ''), // Store the full path without extension
    metadata: frontmatter ? YAML.parse(frontmatter) : {},
    content: userPrompt,
    systemPrompt: systemPrompt || undefined
  }
}

/**
 * List contents of a directory in the prompts folder
 */
export async function listContents(dirPath: string = ''): Promise<FileEntry[]> {
  const fullPath = path.join(PROMPTS_DIR, dirPath)
  
  try {
    const entries = await fs.promises.readdir(fullPath, { withFileTypes: true })
    
    return Promise.all(entries.map(async entry => {
      const entryPath = path.join(dirPath, entry.name)
      const isDirectory = entry.isDirectory()
      
      // Skip hidden directories (starting with a dot) and non-.prompt files
      if ((isDirectory && entry.name.startsWith('.')) || (!isDirectory && !entry.name.endsWith('.prompt'))) {
        return null
      }
      
      // Get the creation date if available
      let created: string | undefined = undefined
      try {
        const fullEntryPath = path.join(PROMPTS_DIR, entryPath)
        const stats = await fs.promises.stat(fullEntryPath)
        created = stats.birthtime.toISOString()
      } catch (error) {
        // Silently fail and just don't include the created date
      }
      
      return {
        name: isDirectory ? entry.name : entry.name.replace(/\.prompt$/, ''),
        isDirectory,
        path: entryPath,
        created
      }
    })).then(entries => entries.filter(Boolean) as FileEntry[])
  } catch (error) {
    console.error(`Error listing directory ${fullPath}:`, error)
    return []
  }
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(itemPath: string): Promise<boolean> {
  try {
    const fullPath = path.join(PROMPTS_DIR, itemPath)
    const stats = await fs.promises.stat(fullPath)
    return stats.isDirectory()
  } catch (err) {
    return false
  }
}

/**
 * Delete an item (file or directory) from the prompts folder
 */
export async function deleteItem(itemPath: string): Promise<void> {
  const fullPath = path.join(PROMPTS_DIR, itemPath)
  
  try {
    const isDir = await isDirectory(itemPath)
    
    if (isDir) {
      await fs.promises.rm(fullPath, { recursive: true })
    } else {
      // For backward compatibility, try with .prompt extension if not already included
      const filePath = itemPath.endsWith('.prompt') ? fullPath : `${fullPath}.prompt`
      await fs.promises.unlink(filePath)
    }
  } catch (error) {
    console.error(`Error deleting ${fullPath}:`, error)
    throw error
  }
}

// Backward compatibility for existing code
export async function listPrompts(): Promise<string[]> {
  const entries = await listContents()
  return entries
    .filter(entry => !entry.isDirectory)
    .map(entry => entry.isDirectory ? entry.path : `${entry.path}.prompt`)
}

/**
 * Move an item (file or directory) from one location to another
 */
export async function moveItem(sourcePath: string, destinationPath: string): Promise<void> {
  const fullSourcePath = path.join(PROMPTS_DIR, sourcePath)
  let fullDestPath = path.join(PROMPTS_DIR, destinationPath)
  
  try {
    // Check if source is a directory
    const isSourceDir = await isDirectory(sourcePath)
    
    // If source is a file, ensure proper extension handling
    if (!isSourceDir) {
      // Source is a file, add .prompt extension if not present
      if (!sourcePath.endsWith('.prompt')) {
        sourcePath = `${sourcePath}.prompt`
      }
      const fullSourcePath = path.join(PROMPTS_DIR, sourcePath)

      // For destination, ensure path has proper extension
      if (await isDirectory(destinationPath)) {
        // If destination is a directory, use the original filename
        const fileName = path.basename(sourcePath)
        fullDestPath = path.join(fullDestPath, fileName)
      } else if (!destinationPath.endsWith('.prompt')) {
        // If destination is a file path, ensure it has .prompt extension
        fullDestPath = `${fullDestPath}.prompt`
      }
      
      // Ensure destination directory exists
      const destDir = path.dirname(fullDestPath)
      await fs.promises.mkdir(destDir, { recursive: true })
      
      // Move the file
      await fs.promises.rename(fullSourcePath, fullDestPath)
    } else {
      // Source is a directory, ensure destination parent directory exists
      const destDir = path.dirname(fullDestPath)
      await fs.promises.mkdir(destDir, { recursive: true })
      
      // Move the directory
      await fs.promises.rename(fullSourcePath, fullDestPath)
    }
  } catch (error) {
    console.error(`Error moving ${sourcePath} to ${destinationPath}:`, error)
    throw error
  }
}

export async function deletePrompt(name: string): Promise<void> {
  await deleteItem(name)
}
