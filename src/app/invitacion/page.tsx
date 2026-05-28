import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ code?: string }>
}

/**
 * Smart invitation redirect.
 *
 * – Logged-in user  → /grupos/unirse?code=…  (join immediately)
 * – Unknown user    → /register?invitacion=…  (register first, then join)
 * – No code         → /grupos/unirse           (fallback)
 */
export default async function InvitacionPage({ searchParams }: Props) {
  const { code } = await searchParams

  if (!code) redirect('/grupos/unirse')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(`/grupos/unirse?code=${code}`)
  } else {
    redirect(`/register?invitacion=${code}`)
  }
}
