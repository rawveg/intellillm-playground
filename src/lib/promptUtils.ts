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
}

export interface FileEntry {
  name: string
  isDirectory: boolean
  path: string
}

export async function createFolder(folderPath: string): Promise<void> {
  const fullPath = path.join(PROMPTS_DIR, folderPath)
  await fs.promises.mkdir(fullPath, { recursive: true })
}

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
  const name = path.basename(filePath, '.prompt')
  
  return {
    name,
    metadata: frontmatter ? YAML.parse(frontmatter) : {},
    content: userPrompt,
    systemPrompt: systemPrompt || undefined
  }
}

export async function listContents(dirPath: string = ''): Promise<FileEntry[]> {
  const fullPath = path.join(PROMPTS_DIR, dirPath)
  const entries = await fs.promises.readdir(fullPath, { withFileTypes: true })
  
  return Promise.all(entries.map(async entry => {
    const entryPath = path.join(dirPath, entry.name)
    const isDirectory = entry.isDirectory()
    
    // Only include .prompt files, but show all directories
    if (!isDirectory && !entry.name.endsWith('.prompt')) {
      return null
    }
    
    return {
      name: isDirectory ? entry.name : entry.name.replace(/\.prompt$/, ''),
      isDirectory,
      path: entryPath
    }
  })).then(entries => entries.filter(Boolean) as FileEntry[])
}

export async function isDirectory(itemPath: string): Promise<boolean> {
  try {
    const fullPath = path.join(PROMPTS_DIR, itemPath)
    const stats = await fs.promises.stat(fullPath)
    return stats.isDirectory()
  } catch (err) {
    return false
  }
}

export async function deleteItem(itemPath: string): Promise<void> {
  const fullPath = path.join(PROMPTS_DIR, itemPath)
  
  if (await isDirectory(itemPath)) {
    await fs.promises.rm(fullPath, { recursive: true })
  } else {
    // For backward compatibility, try with .prompt extension if not already included
    const filePath = itemPath.endsWith('.prompt') ? fullPath : `${fullPath}.prompt`
    await fs.promises.unlink(filePath)
  }
}

// Backward compatibility for existing code
export async function listPrompts(): Promise<string[]> {
  const entries = await listContents()
  return entries
    .filter(entry => !entry.isDirectory)
    .map(entry => entry.isDirectory ? entry.path : `${entry.path}.prompt`)
}

export async function deletePrompt(name: string): Promise<void> {
  await deleteItem(name)
}
