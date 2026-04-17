'use client'

interface ChatViewProps {
  conversationId: string
}

export default function ChatView({ conversationId }: ChatViewProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">Chat view — coming soon</p>
    </div>
  )
}