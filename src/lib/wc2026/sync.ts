import {
  fetchAllMatches,
  fetchLiveMatches,
  fetchMatchById,
  fetchTodayMatches,
} from './client'
import { STATUS_MAP, ROUND_NAME_STAGE_MAP, TEAM_CODE_MAP } from '@/types/wc2026api.types'
import type { AllSportsEvent } from '@/types/wc2026api.types'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type MatchInsert = Database['public']['Tables']['matches']['Insert']

// ── Transform helpers ─────────────────────────────────────────────

function parseStage(e: AllSportsEvent): string {
  if (e.tournament.name.includes('Group')) return 'group'
  const roundName = e.roundInfo?.name ?? ''
  return ROUND_NAME_STAGE_MAP[roundName] ?? 'r32'
}

function parseGroup(e: AllSportsEvent): string | null {
  const m = e.tournament.name.match(/Group ([A-Z])/)
  return m ? m[1] : null
}

function teamCode(name: string): string {
  return TEAM_CODE_MAP[name] ?? name.slice(0, 3).toUpperCase()
}

function logoUrl(teamId: number): string {
  return `/api/team-logo/${teamId}`
}

function parseVenue(e: AllSportsEvent): string | null {
  if (!e.venue?.name) return null
  const city = e.venue.city?.name
  return city ? `${e.venue.name}, ${city}` : e.venue.name
}

export function transformEvent(e: AllSportsEvent): MatchInsert {
  return {
    allsports_event_id: e.id,
    home_team:          e.homeTeam.name,
    away_team:          e.awayTeam.name,
    home_team_code:     teamCode(e.homeTeam.name),
    away_team_code:     teamCode(e.awayTeam.name),
    home_team_logo:     logoUrl(e.homeTeam.id),
    away_team_logo:     logoUrl(e.awayTeam.id),
    scheduled_at:       new Date(e.startTimestamp * 1000).toISOString(),
    stage:              parseStage(e) as MatchInsert['stage'],
    status:             (STATUS_MAP[e.status.type] ?? 'scheduled') as MatchInsert['status'],
    home_score:         e.homeScore?.current ?? null,
    away_score:         e.awayScore?.current ?? null,
    group_label:        parseGroup(e),
    venue:              parseVenue(e),
  }
}

// ── Full fixture sync (initial seed — 39 API calls) ───────────────

export async function syncAllMatches(supabase: SupabaseClient<Database>, startDate?: Date) {
  const { events, resumeFrom } = await fetchAllMatches(startDate)
  const rows = events.map(transformEvent)

  // On full sync (no startDate) with complete data, delete legacy seed rows
  // that have no allsports_event_id so we don't end up with duplicates in Spanish
  if (!startDate && !resumeFrom) {
    await supabase.from('matches').delete().is('allsports_event_id', null)
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from('matches')
      .upsert(rows, {
        onConflict:       'allsports_event_id',
        ignoreDuplicates: false,
      })
    if (error) throw error
  }

  return {
    synced: rows.length,
    ...(resumeFrom ? { partial: true, resumeFrom: resumeFrom.toISOString().slice(0, 10) } : {}),
  }
}

// ── Today's matches sync ──────────────────────────────────────────

export async function syncTodayMatches(supabase: SupabaseClient<Database>) {
  const events = await fetchTodayMatches()
  const rows   = events.map(transformEvent)

  if (rows.length === 0) return { synced: 0 }

  const { error } = await supabase
    .from('matches')
    .upsert(rows, { onConflict: 'allsports_event_id' })

  if (error) throw error
  return { synced: rows.length }
}

// ── Live scores sync (cron every 5 min during matches) ────────────

export async function syncLiveMatches(supabase: SupabaseClient<Database>) {
  const liveEvents = await fetchLiveMatches()
  if (liveEvents.length === 0) return { updated: 0 }

  const now = new Date().toISOString()
  const eventIds = liveEvents.map((e) => e.id)

  // Mark all these event IDs as live in one query
  const { error: statusErr } = await supabase
    .from('matches')
    .update({ status: 'live', updated_at: now })
    .in('allsports_event_id', eventIds)

  if (statusErr) throw statusErr

  // Update individual scores
  for (const e of liveEvents) {
    await supabase
      .from('matches')
      .update({
        home_score: e.homeScore?.current ?? null,
        away_score: e.awayScore?.current ?? null,
        updated_at: now,
      })
      .eq('allsports_event_id', e.id)
  }

  return { updated: liveEvents.length }
}

// ── Mark finished matches ─────────────────────────────────────────
// Checks DB matches still marked 'live' that started 110+ min ago.
// Polls AllSports for their real status and updates accordingly.

export async function syncFinishedMatches(supabase: SupabaseClient<Database>) {
  const cutoff = new Date(Date.now() - 110 * 60 * 1000).toISOString()

  const { data: candidates } = await supabase
    .from('matches')
    .select('id, allsports_event_id')
    .eq('status', 'live')
    .lt('scheduled_at', cutoff)

  if (!candidates?.length) return { finished: 0 }

  // Re-check each candidate against the API
  const currentLive = await fetchLiveMatches()
  const liveIds = new Set(currentLive.map((e) => e.id))

  let finished = 0
  for (const match of candidates) {
    if (!match.allsports_event_id || liveIds.has(match.allsports_event_id)) continue

    // No longer in live feed — fetch final score and mark finished
    const event = await fetchMatchById(match.allsports_event_id)
    await supabase
      .from('matches')
      .update({
        status:     'finished',
        home_score: event?.homeScore?.current ?? null,
        away_score: event?.awayScore?.current ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match.id)

    finished++
  }

  return { finished }
}
