import { createClient } from './client'

export function subscribeToGroupRanking(
  groupId: string,
  onUpdate: (payload: unknown) => void
) {
  const supabase = createClient()
  const channel = supabase
    .channel(`ranking:${groupId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'group_members',
      filter: `group_id=eq.${groupId}`,
    }, onUpdate)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'match_scores',
      filter: `group_id=eq.${groupId}`,
    }, onUpdate)
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function subscribeToMatch(
  matchId: string,
  onUpdate: (payload: unknown) => void
) {
  const supabase = createClient()
  const channel = supabase
    .channel(`match:${matchId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'matches',
      filter: `id=eq.${matchId}`,
    }, onUpdate)
    .subscribe()

  return () => supabase.removeChannel(channel)
}
