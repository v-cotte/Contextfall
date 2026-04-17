'use client'

import { useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useStore } from '@/store'
import Sidebar from '@/components/sidebar/sidebar'
import ProjectView from '@/components/project-view/project-view'
import ChatView from '@/components/chat-view/chat-view'

interface AppShellProps {
  user: User
}

export default function AppShell({ user }: AppShellProps) {
  const {
    selectedConversationId,
    selectedProjectId,
    isSidebarOpen,
  } = useStore()

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 overflow-hidden">
        {selectedConversationId ? (
          <ChatView conversationId={selectedConversationId} />
        ) : selectedProjectId ? (
          <ProjectView projectId={selectedProjectId} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-muted-foreground"
        >
          <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 10l8 5 8-5" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">Welcome to Contextfall</p>
        <p className="text-sm text-muted-foreground">
          Create a project to get started
        </p>
      </div>
    </div>
  )
}