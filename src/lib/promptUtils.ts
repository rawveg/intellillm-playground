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
}

export async function savePrompt(name: string, content: string, metadata: PromptMetadata): Promise<void> {
  const fileContent = `---\n${YAML.stringify(metadata)}---\n\n${content}`
  const filePath = path.join(PROMPTS_DIR, `${name}.prompt`)
  await fs.promises.writeFile(filePath, fileContent, 'utf-8')
}

export async function loadPrompt(name: string): Promise<PromptFile> {
  const filePath = path.join(PROMPTS_DIR, name)
  const content = await fs.promises.readFile(filePath, 'utf-8')
  const [, frontmatter, promptContent] = content.split('---')
  
  return {
    name: path.basename(name, '.prompt'),
    metadata: frontmatter ? YAML.parse(frontmatter) : {},
    content: promptContent.trim()
  }
}

export async function listPrompts(): Promise<string[]> {
  const files = await fs.promises.readdir(PROMPTS_DIR)
  return files.filter(file => file.endsWith('.prompt'))
}

export async function deletePrompt(name: string): Promise<void> {
  const filePath = path.join(PROMPTS_DIR, name)
  await fs.promises.unlink(filePath)
}
