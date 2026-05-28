import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ code?: string }>
}

/**
 * Smart invitation redirect.
 *
 * – Logged-in user      → /grupos/unirse?code=…      (join immediately)
 * – Unauthenticated     → /login?invitacion=…         (log in or register)
 * – No code             → /grupos/unirse              (fallback)
 *
 * We always send unauthenticated users to /login (not /register) because
 * we cannot tell from the invite code alone whether the recipient already
 * has an account. The login page lets them sign in and links to /register
 * (with the code preserved) for users who are genuinely new.
 */
export default async function InvitacionPage({ searchParams }: Props) {
  const { code } = await searchParams

  if (!code) redirect('/grupos/unirse')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(`/grupos/unirse?code=${code}`)
  } else {
    redirect(`/login?invitacion=${code}`)
  }
}
