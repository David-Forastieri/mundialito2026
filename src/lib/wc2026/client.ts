import type {
  AllSportsEvent,
  AllSportsMatchesResponse,
  AllSportsStandingGroup,
  AllSportsStandingsResponse,
} from '@/types/wc2026api.types'

const BASE_URL = `https://${process.env.ALLSPORTS_API_HOST}`
const API_HOST = process.env.ALLSPORTS_API_HOST!

// All configured API keys — rotates automatically on 429
const API_KEYS = [
  process.env.ALLSPORTS_API_KEY,
  process.env.ALLSPORTS_API_KEY_2,
].filter(Boolean) as string[]

// Tracks which key to try first (advances on 429, persists in memory within a process)
let activeKeyIndex = 0

const WC_TOURNAMENT_ID = 16
const WC_SEASON_ID     = 58210

// WC 2026 full date range: June 11 → July 19
const WC_START = new Date('2026-06-11T00:00:00Z')
const WC_END   = new Date('2026-07-19T00:00:00Z')

// Server-side in-memory cache — reduces burn rate on the 100 req/day limit per key
const cache = new Map<string, { data: unknown; expires: number }>()

async function allSportsFetch<T>(path: string, ttlSeconds = 300): Promise<T> {
  const cached = cache.get(path)
  if (cached && cached.expires > Date.now()) return cached.data as T

  // Try each key starting from the active one; rotate on 429.
  // Capture startIndex before the loop so mutations during iteration don't corrupt keyIndex.
  const startIndex = activeKeyIndex
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const keyIndex = (startIndex + attempt) % API_KEYS.length
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'X-RapidAPI-Key':  API_KEYS[keyIndex],
        'X-RapidAPI-Host': API_HOST,
      },
      // Responses can exceed 2MB — skip Next.js data cache, rely on in-memory cache above
      cache: 'no-store',
    })

    if (res.status === 429) continue

    if (!res.ok) {
      throw new Error(`AllSportsAPI ${res.status} — ${BASE_URL}${path}`)
    }

    // Success — remember this key for the next request
    activeKeyIndex = keyIndex
    const json = await res.json() as T
    cache.set(path, { data: json, expires: Date.now() + ttlSeconds * 1000 })
    return json
  }

  // All keys exhausted — advance past current so next request starts fresh on next key
  activeKeyIndex = (startIndex + 1) % API_KEYS.length
  throw new Error(`AllSportsAPI 429 — ${BASE_URL}${path}`)
}

// ── Helpers ───────────────────────────────────────────────────────

function isWCMatch(e: AllSportsEvent): boolean {
  return e.tournament?.name?.includes('World Cup') ?? false
}

function padded(n: number): string {
  return String(n).padStart(2, '0')
}

// ── Fixtures ──────────────────────────────────────────────────────

/** All WC matches on a single calendar date (UTC) */
export async function fetchMatchesByDate(date: Date): Promise<AllSportsEvent[]> {
  const d = padded(date.getUTCDate())
  const m = padded(date.getUTCMonth() + 1)
  const y = date.getUTCFullYear()
  const json = await allSportsFetch<AllSportsMatchesResponse>(`/api/matches/${d}/${m}/${y}`, 300)
  return (json.events ?? []).filter(isWCMatch)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface FetchAllMatchesResult {
  events: AllSportsEvent[]
  /** null = complete; otherwise the date that hit a quota/error so sync can resume from here */
  resumeFrom: Date | null
}

/**
 * Full WC fixture — iterates every day from startDate (default June 11) to July 19.
 * Costs 39 API requests for the full range; 300ms delay between calls to respect
 * the 5 req/sec rate limit. Call only for the initial seed sync.
 * On quota (429) errors returns partial results + resumeFrom so the caller can still
 * upsert what was collected and resume the rest later via ?start=.
 */
export async function fetchAllMatches(startDate?: Date): Promise<FetchAllMatchesResult> {
  const results: AllSportsEvent[] = []
  const seenIds = new Set<number>()

  const current = new Date(startDate ?? WC_START)
  while (current <= WC_END) {
    try {
      const dayMatches = await fetchMatchesByDate(current)
      for (const e of dayMatches) {
        if (!seenIds.has(e.id)) {
          seenIds.add(e.id)
          results.push(e)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('429')) {
        // Quota exhausted — return what we have + the date to resume from
        return { events: results, resumeFrom: new Date(current) }
      }
      throw err
    }
    current.setUTCDate(current.getUTCDate() + 1)
    await sleep(300) // stay under 5 req/sec limit
  }

  return { events: results, resumeFrom: null }
}

/** Today's WC matches */
export async function fetchTodayMatches(): Promise<AllSportsEvent[]> {
  return fetchMatchesByDate(new Date())
}

/** All currently live WC matches (filters from cross-sport live feed) */
export async function fetchLiveMatches(): Promise<AllSportsEvent[]> {
  const json = await allSportsFetch<AllSportsMatchesResponse>('/api/matches/live', 60)
  return (json.events ?? []).filter(isWCMatch)
}

/** Single match by AllSports event ID */
export async function fetchMatchById(eventId: number): Promise<AllSportsEvent | null> {
  try {
    const json = await allSportsFetch<{ event: AllSportsEvent }>(`/api/match/${eventId}`, 60)
    return json.event ?? null
  } catch {
    return null
  }
}

// ── Standings ─────────────────────────────────────────────────────

/** All 12 group standings for WC 2026 */
export async function fetchGroupStandings(): Promise<AllSportsStandingGroup[]> {
  const json = await allSportsFetch<AllSportsStandingsResponse>(
    `/api/tournament/${WC_TOURNAMENT_ID}/season/${WC_SEASON_ID}/standings/total`,
    600,
  )
  return json.standings ?? []
}
