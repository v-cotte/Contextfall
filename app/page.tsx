import { createServerSideClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'

export default async function Home() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <AppShell user={user} />
}