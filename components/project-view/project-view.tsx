'use client'

interface ProjectViewProps {
  projectId: string
}

export default function ProjectView({ projectId }: ProjectViewProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">Project view — coming soon</p>
    </div>
  )
}