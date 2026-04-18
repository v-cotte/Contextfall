import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Project,
  Conversation,
  Message,
  FileAttachment,
  ResponseMode,
  TreeNode,
} from '@/types'

interface AppState {
  // data
  projects: Project[]
  conversations: Conversation[]
  messages: Record<string, Message[]>
  files: Record<string, FileAttachment[]>

  // ui state
  selectedProjectId: string | null
  selectedConversationId: string | null
  isSidebarOpen: boolean

  // project actions
  createProject: (name: string, parentId: string | null) => Project
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // conversation actions
  createConversation: (name: string, projectId: string) => Conversation
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  deleteConversation: (id: string) => void

  // message actions
  addMessage: (conversationId: string, message: Message) => void
  clearMessages: (conversationId: string) => void

  // file actions
  addFile: (projectId: string, file: FileAttachment) => void
  removeFile: (projectId: string, fileId: string) => void

  // ui actions
  selectProject: (id: string | null) => void
  selectConversation: (id: string | null) => void
  toggleSidebar: () => void

  // tree helper
  getTreeNodes: () => TreeNode[]
  getProjectAncestors: (projectId: string) => Project[]
}

const generateId = () => crypto.randomUUID()

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      conversations: [],
      messages: {},
      files: {},
      selectedProjectId: null,
      selectedConversationId: null,
      isSidebarOpen: true,

      createProject: (name, parentId) => {
        const project: Project = {
          id: generateId(),
          name,
          parentId,
          contextMarkdown: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'local',
        }
        set((state) => ({ projects: [...state.projects, project] }))
        return project
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }))
      },

      deleteProject: (id) => {
        const state = get()
        // collect all descendant project ids
        const getDescendantIds = (projectId: string): string[] => {
          const children = state.projects.filter(
            (p) => p.parentId === projectId
          )
          return [
            projectId,
            ...children.flatMap((c) => getDescendantIds(c.id)),
          ]
        }
        const idsToDelete = getDescendantIds(id)
        // collect conversation ids to delete
        const convIdsToDelete = state.conversations
          .filter((c) => idsToDelete.includes(c.projectId))
          .map((c) => c.id)

        set((state) => {
          const newMessages = { ...state.messages }
          const newFiles = { ...state.files }
          convIdsToDelete.forEach((cid) => delete newMessages[cid])
          idsToDelete.forEach((pid) => delete newFiles[pid])
          return {
            projects: state.projects.filter(
              (p) => !idsToDelete.includes(p.id)
            ),
            conversations: state.conversations.filter(
              (c) => !convIdsToDelete.includes(c.id)
            ),
            messages: newMessages,
            files: newFiles,
            selectedProjectId:
              idsToDelete.includes(state.selectedProjectId ?? '')
                ? null
                : state.selectedProjectId,
            selectedConversationId:
              convIdsToDelete.includes(state.selectedConversationId ?? '')
                ? null
                : state.selectedConversationId,
          }
        })
      },

      createConversation: (name, projectId) => {
        const conversation: Conversation = {
          id: generateId(),
          name,
          projectId,
          model: 'claude-sonnet-4-6',
          responseMode: 'concise',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'local',
        }
        set((state) => ({
          conversations: [...state.conversations, conversation],
          messages: { ...state.messages, [conversation.id]: [] },
        }))
        return conversation
      },

      updateConversation: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id
              ? { ...c, ...updates, updatedAt: new Date().toISOString() }
              : c
          ),
        }))
      },

      deleteConversation: (id) => {
        set((state) => {
          const newMessages = { ...state.messages }
          delete newMessages[id]
          return {
            conversations: state.conversations.filter((c) => c.id !== id),
            messages: newMessages,
            selectedConversationId:
              state.selectedConversationId === id
                ? null
                : state.selectedConversationId,
          }
        })
      },

      addMessage: (conversationId, message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [
              ...(state.messages[conversationId] ?? []),
              message,
            ],
          },
        }))
      },

      clearMessages: (conversationId) => {
        set((state) => ({
          messages: { ...state.messages, [conversationId]: [] },
        }))
      },

      addFile: (projectId, file) => {
        set((state) => ({
          files: {
            ...state.files,
            [projectId]: [...(state.files[projectId] ?? []), file],
          },
        }))
      },

      removeFile: (projectId, fileId) => {
        set((state) => ({
          files: {
            ...state.files,
            [projectId]: (state.files[projectId] ?? []).filter(
              (f) => f.id !== fileId
            ),
          },
        }))
      },

      selectProject: (id) => {
        set({ selectedProjectId: id, selectedConversationId: null })
      },

      selectConversation: (id) => {
        set({ selectedConversationId: id })
      },

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
      },

      getTreeNodes: () => {
        const { projects, conversations } = get()

        const buildNode = (project: Project): TreeNode => {
          const childProjects = projects.filter(
            (p) => p.parentId === project.id
          )
          const childConversations = conversations.filter(
            (c) => c.projectId === project.id
          )
          return {
            id: project.id,
            name: project.name,
            type: 'project',
            parentId: project.parentId,
            children: [
              ...childProjects.map(buildNode),
              ...childConversations.map((c) => ({
                id: c.id,
                name: c.name,
                type: 'conversation' as const,
                parentId: project.id,
                children: [],
                conversationId: c.id,
              })),
            ],
          }
        }

        return projects
          .filter((p) => p.parentId === null)
          .map(buildNode)
      },

      getProjectAncestors: (projectId) => {
        const { projects } = get()
        const ancestors: Project[] = []
        let current = projects.find((p) => p.id === projectId)
        while (current) {
          ancestors.unshift(current)
          current = current.parentId
            ? projects.find((p) => p.id === current!.parentId)
            : undefined
        }
        return ancestors
      },
    }),
    {
      name: 'contextree-storage',
    }
  )
)