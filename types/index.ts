export type NodeType = 'project' | 'conversation'

export interface Project {
  id: string
  name: string
  parentId: string | null
  contextMarkdown: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface FileAttachment {
  id: string
  projectId: string
  name: string
  type: string
  extractedText: string
  createdAt: string
}

export interface Conversation {
  id: string
  name: string
  projectId: string
  model: string
  responseMode: ResponseMode
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  responseMode?: ResponseMode
  createdAt: string
}

export type ResponseMode = 'concise' | 'detailed' | 'step-by-step'

export type AIProvider = 'anthropic' | 'openai' | 'google'

export interface ApiKey {
  id: string
  provider: AIProvider
  encryptedKey: string
  label: string
  createdAt: string
  userId: string
}

export interface ContextLayer {
  projectId: string
  projectName: string
  contextMarkdown: string
  files: FileAttachment[]
}

export interface TreeNode {
  id: string
  name: string
  type: NodeType
  parentId: string | null
  children: TreeNode[]
  conversationId?: string
}

export const MODELS = {
  anthropic: [
    { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
    { id: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
  ],
  google: [
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
} as const

export const RESPONSE_MODE_INSTRUCTIONS: Record<ResponseMode, string> = {
  concise: 'Be direct and concise. No unnecessary explanation. Short answers unless the question genuinely requires depth.',
  detailed: 'Be thorough and comprehensive. Explain your reasoning. Cover edge cases and alternatives.',
  'step-by-step': 'Break everything down into clear numbered steps. Explain each step before moving to the next.',
}