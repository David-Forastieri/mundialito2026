import { createClient } from '@/lib/supabase/client'
import type { RankingEntry } from '@/types/ranking.types'

export async function getGroupRanking(groupId: string): Promise<RankingEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_group_ranking', { p_group_id: groupId })
  if (error) throw error
  return data || []
}

export async function getUserGroupStats(userId: string, groupId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('group_members')
    .select('total_points, template_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  if (error) return null
  return data
}
