import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UnirseClient from './UnirseClient'

export default async function UnirsePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invitationsRaw } = await supabase
    .from('group_invitations')
    .select(`
      id, status, created_at,
      groups ( id, name, scoring_mode )
    `)
    .eq('invited_email', user.email!)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const invitations = (invitationsRaw || []).map(i => ({
    ...i,
    groups: i.groups as { id: string; name: string; scoring_mode: string } | null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link href="/grupos" className="text-orange-500 text-sm font-medium">← Mis grupos</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Unirse a un grupo</h1>
        <p className="text-sm text-gray-500 mt-1">Aceptá una invitación o ingresá un código</p>
      </div>

      <UnirseClient
        initialInvitations={invitations}
        initialCode={code ?? ''}
      />
    </div>
  )
}
