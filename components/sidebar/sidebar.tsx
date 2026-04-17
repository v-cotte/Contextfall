'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useStore } from '@/store'
import { TreeNode } from '@/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: User
}

export default function Sidebar({ user }: SidebarProps) {
  const {
    getTreeNodes,
    createProject,
    selectProject,
    selectConversation,
    selectedProjectId,
    selectedConversationId,
    isSidebarOpen,
  } = useStore()

  const router = useRouter()
  const nodes = getTreeNodes()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleNewRootProject = () => {
    const project = createProject('New project', null)
    selectProject(project.id)
  }

  if (!isSidebarOpen) return null

  return (
    <aside className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#7F77DD]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            >
              <path d="M2 10L6 2l4 8" />
              <path d="M3.5 7h5" />
            </svg>
          </div>
          <span className="text-sm font-medium">Contextfall</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="currentColor"
              >
                <circle cx="7" cy="2" r="1.2" />
                <circle cx="7" cy="7" r="1.2" />
                <circle cx="7" cy="12" r="1.2" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>API keys</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {nodes.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No projects yet
          </p>
        ) : (
          nodes.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              depth={0}
              selectedProjectId={selectedProjectId}
              selectedConversationId={selectedConversationId}
              onSelectProject={selectProject}
              onSelectConversation={selectConversation}
            />
          ))
        )}
      </div>

      <div className="border-t border-border p-2">
        <button
          onClick={handleNewRootProject}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 2v8M2 6h8" />
          </svg>
          New project
        </button>
      </div>
    </aside>
  )
}

interface TreeItemProps {
  node: TreeNode
  depth: number
  selectedProjectId: string | null
  selectedConversationId: string | null
  onSelectProject: (id: string) => void
  onSelectConversation: (id: string) => void
}

function TreeItem({
  node,
  depth,
  selectedProjectId,
  selectedConversationId,
  onSelectProject,
  onSelectConversation,
}: TreeItemProps) {
  const [expanded, setExpanded] = useState(true)
  const isProject = node.type === 'project'
  const isSelected = isProject
    ? selectedProjectId === node.id
    : selectedConversationId === node.id
  const hasChildren = node.children.length > 0

  const handleClick = () => {
    if (isProject) {
      onSelectProject(node.id)
      setExpanded(true)
    } else {
      onSelectConversation(node.id)
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        className={cn(
          'group flex cursor-pointer items-center gap-1.5 rounded-sm py-1 pr-2 text-sm',
          isSelected
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          isSelected && !isProject && 'border-l-2 border-[#7F77DD]'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {isProject && hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="flex h-4 w-4 flex-shrink-0 items-center justify-center"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="currentColor"
              className={cn(
                'transition-transform',
                expanded ? 'rotate-90' : 'rotate-0'
              )}
            >
              <path d="M3 2l4 3-4 3V2z" />
            </svg>
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke={isProject ? '#7F77DD' : 'currentColor'}
          strokeWidth="1.4"
          className="flex-shrink-0"
        >
          {isProject ? (
            <rect x="2" y="3" width="12" height="10" rx="2" />
          ) : (
            <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H5l-3 2V4z" />
          )}
        </svg>

        <span className="flex-1 truncate text-xs">{node.name}</span>
      </div>

      {isProject && expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedProjectId={selectedProjectId}
              selectedConversationId={selectedConversationId}
              onSelectProject={onSelectProject}
              onSelectConversation={onSelectConversation}
            />
          ))}
        </div>
      )}
    </div>
  )
}