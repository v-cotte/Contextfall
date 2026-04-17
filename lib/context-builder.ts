import {
  Project,
  FileAttachment,
  Conversation,
  Message,
  ContextLayer,
  ResponseMode,
  RESPONSE_MODE_INSTRUCTIONS,
} from '@/types'

/**
 * Core assumptions:
 * - Projects form a tree via parentId (null = root).
 * - A conversation belongs to exactly one project.
 * - Context inherits from root → conversation's project (top-down).
 * - Each project contributes: its markdown context + its files.
 * - The final prompt is stable and deterministic for a given tree state.
 */

export interface BuildContextInput {
  conversation: Conversation
  projects: Project[]
  filesByProject: Record<string, FileAttachment[]>
  history: Message[]
  userMessage: string
}

export interface BuiltPrompt {
  system: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  layerCount: number
  fileCount: number
  estimatedTokens: number
}

const MAX_SAFE_DEPTH = 50
const APPROX_CHARS_PER_TOKEN = 4

/**
 * Walk up the tree from a project to its root, returning the chain
 * ordered root-first. Detects cycles and caps depth defensively.
 */
export function getAncestorChain(
  projectId: string,
  projects: Project[]
): Project[] {
  const byId = new Map(projects.map((p) => [p.id, p]))
  const chain: Project[] = []
  const visited = new Set<string>()

  let current = byId.get(projectId)
  let depth = 0

  while (current) {
    if (visited.has(current.id)) {
      console.warn(
        `[contextfall] cycle detected at project ${current.id}, breaking`
      )
      break
    }
    if (depth >= MAX_SAFE_DEPTH) {
      console.warn(
        `[contextfall] max depth ${MAX_SAFE_DEPTH} reached, truncating`
      )
      break
    }

    visited.add(current.id)
    chain.unshift(current)
    depth += 1

    if (current.parentId === null) break
    const parent = byId.get(current.parentId)
    if (!parent) {
      console.warn(
        `[contextfall] parent ${current.parentId} missing for ${current.id}`
      )
      break
    }
    current = parent
  }

  return chain
}

/**
 * Turn the ancestor chain into layers, each with its markdown + files.
 * Empty context AND no files = layer is dropped to avoid prompt noise.
 */
export function buildContextLayers(
  ancestorChain: Project[],
  filesByProject: Record<string, FileAttachment[]>
): ContextLayer[] {
  return ancestorChain
    .map<ContextLayer>((project) => ({
      projectId: project.id,
      projectName: project.name,
      contextMarkdown: project.contextMarkdown?.trim() ?? '',
      files: filesByProject[project.id] ?? [],
    }))
    .filter(
      (layer) => layer.contextMarkdown.length > 0 || layer.files.length > 0
    )
}

/**
 * Render layers into a single string block. Order matters: root first,
 * closest to the conversation last, so the most specific context is the
 * most recent thing the model reads before the conversation.
 */
export function renderContextBlock(layers: ContextLayer[]): string {
  if (layers.length === 0) return ''

  const parts: string[] = []

  layers.forEach((layer, index) => {
    const isLast = index === layers.length - 1
    const role = isLast ? 'active project' : 'inherited context'
    parts.push(`<layer name="${escapeXml(layer.projectName)}" role="${role}">`)

    if (layer.contextMarkdown) {
      parts.push(layer.contextMarkdown)
    }

    if (layer.files.length > 0) {
      parts.push('')
      layer.files.forEach((file) => {
        const text = (file.extractedText ?? '').trim()
        if (!text) return
        parts.push(`<file name="${escapeXml(file.name)}">`)
        parts.push(text)
        parts.push('</file>')
      })
    }

    parts.push('</layer>')
    parts.push('')
  })

  return parts.join('\n').trim()
}

/**
 * The base instruction. Intentionally short — context is the main signal.
 * Response mode appends to this, not replaces it.
 */
function baseSystemInstruction(responseMode: ResponseMode): string {
  return [
    'You are a proactive assistant helping the user with their work.',
    'Use the context layers below to understand who the user is, what they are working on, and how they work.',
    'Inner layers override outer layers when they conflict. The "active project" layer is the most specific.',
    'Never fabricate details that are not in the context. If something is unclear, say so plainly.',
    '',
    RESPONSE_MODE_INSTRUCTIONS[responseMode],
  ].join('\n')
}

/**
 * Main entry point. Produces the full prompt payload ready to send to an AI provider.
 */
export function buildPrompt(input: BuildContextInput): BuiltPrompt {
  const { conversation, projects, filesByProject, history, userMessage } =
    input

  const chain = getAncestorChain(conversation.projectId, projects)
  const layers = buildContextLayers(chain, filesByProject)
  const contextBlock = renderContextBlock(layers)
  const instruction = baseSystemInstruction(conversation.responseMode)

  const system = contextBlock
    ? `${instruction}\n\n<context>\n${contextBlock}\n</context>`
    : instruction

  const messages = [
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ]

  const fileCount = layers.reduce((sum, l) => sum + l.files.length, 0)
  const estimatedTokens = estimateTokenCount(system, messages)

  return {
    system,
    messages,
    layerCount: layers.length,
    fileCount,
    estimatedTokens,
  }
}

/**
 * Rough estimate. Real tokenization is provider-specific. This is purely
 * for UI warnings ("your context is getting large") — never for billing
 * or truncation decisions. Use the provider's count_tokens endpoint for
 * anything that matters.
 */
export function estimateTokenCount(
  system: string,
  messages: { role: string; content: string }[]
): number {
  const totalChars =
    system.length +
    messages.reduce((sum, m) => sum + m.content.length, 0)
  return Math.ceil(totalChars / APPROX_CHARS_PER_TOKEN)
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}