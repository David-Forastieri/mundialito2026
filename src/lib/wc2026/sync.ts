import { fetchAllMatches, fetchLiveMatches, fetchTodayMatches } from './client'
import { WC2026_STAGE_MAP, WC2026_STATUS_MAP } from '@/types/wc2026api.types'
import type { WC2026Match } from '@/types/wc2026api.types'
import type { Database } from '@/types/database.types'

type MatchInsert = Database['public']['Tables']['matches']['Insert']

// ── Transform API match → DB row ──────────────────────────────────
export function transformMatch(m: WC2026Match): MatchInsert {
  return {
    home_team:      m.home_team.name,
    away_team:      m.away_team.name,
    home_team_code: m.home_team.code,
    away_team_code: m.away_team.code,
    scheduled_at:   m.date,
    stage:          (WC2026_STAGE_MAP[m.stage] || 'group') as MatchInsert['stage'],
    status:         (WC2026_STATUS_MAP[m.status] || 'scheduled') as MatchInsert['status'],
    home_score:     m.home_score,
    away_score:     m.away_score,
    group_label:    m.group,
    venue:          m.venue ? `${m.venue.name}, ${m.venue.city}` : null,
  }
}

// ── Sync all matches (full fixture) ──────────────────────────────
// Called once to seed or refresh the entire fixture
export async function syncAllMatches(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>
) {
  const matches = await fetchAllMatches()
  const rows = matches.map(transformMatch)

  const { error, count } = await supabase
    .from('matches')
    .upsert(rows, {
      onConflict: 'home_team,away_team,scheduled_at',
      ignoreDuplicates: false,
    })
    .select('id', { count: 'exact', head: true })

  if (error) throw error
  return { synced: count ?? rows.length }
}

// ── Sync live matches (called by cron every minute during games) ──
export async function syncLiveMatches(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>
) {
  const liveMatches = await fetchLiveMatches()

  if (liveMatches.length === 0) return { updated: 0 }

  const updates = liveMatches.map((m) => ({
    home_team:  m.home_team.name,
    away_team:  m.away_team.name,
    scheduled_at: m.date,
    status:     'live' as const,
    home_score: m.home_score,
    away_score: m.away_score,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('matches')
    .upsert(updates, { onConflict: 'home_team,away_team,scheduled_at' })

  if (error) throw error
  return { updated: updates.length }
}

// ── Sync today's matches ──────────────────────────────────────────
export async function syncTodayMatches(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>
) {
  const matches = await fetchTodayMatches()
  const rows = matches.map(transformMatch)

  const { error } = await supabase
    .from('matches')
    .upsert(rows, { onConflict: 'home_team,away_team,scheduled_at' })

  if (error) throw error
  return { synced: rows.length }
}

// ── Mark finished matches and trigger score calculation ──────────
export async function syncFinishedMatches(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>
) {
  // Find matches that were 'live' and should now be finished
  // (scheduled_at + 110 min < now)
  const cutoff = new Date(Date.now() - 110 * 60 * 1000).toISOString()

  const { data: liveMatches } = await supabase
    .from('matches')
    .select('id, home_team, away_team')
    .eq('status', 'live')
    .lt('scheduled_at', cutoff)

  if (!liveMatches?.length) return { finished: 0 }

  // For each potentially finished match, check the API
  const apiMatches = await fetchLiveMatches()
  const liveIds = new Set(apiMatches.map((m) => `${m.home_team.name}|${m.away_team.name}`))

  const finished = liveMatches.filter(
    (m) => !liveIds.has(`${m.home_team}|${m.away_team}`)
  )

  for (const match of finished) {
    await supabase
      .from('matches')
      .update({ status: 'finished', updated_at: new Date().toISOString() })
      .eq('id', match.id)
  }

  return { finished: finished.length }
}
