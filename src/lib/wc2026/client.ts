import type {
  WC2026Match,
  WC2026GroupStanding,
  WC2026ApiResponse,
  WC2026_STAGE_MAP,
  WC2026_STATUS_MAP,
} from '@/types/wc2026api.types'

const BASE_URL = process.env.WC2026_API_URL || 'https://api.wc2026api.com'
const API_KEY  = process.env.WC2026_API_KEY!

// Simple in-memory cache to avoid burning the 100 req/day limit
const cache = new Map<string, { data: unknown; expires: number }>()

async function wc2026Fetch<T>(
  path: string,
  ttlSeconds = 300  // default: cache 5 minutes
): Promise<T> {
  const key = path
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.data as T
  }

  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: ttlSeconds },
  })

  if (!res.ok) {
    throw new Error(`WC2026 API error: ${res.status} ${res.statusText} — ${url}`)
  }

  const json = await res.json() as WC2026ApiResponse<T>
  const data = json.data ?? json as T

  cache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 })
  return data
}

// ── Matches ───────────────────────────────────────────────────────

/** Todos los partidos del torneo */
export async function fetchAllMatches(): Promise<WC2026Match[]> {
  return wc2026Fetch<WC2026Match[]>('/matches', 3600) // cache 1h
}

/** Partidos de hoy */
export async function fetchTodayMatches(): Promise<WC2026Match[]> {
  const today = new Date().toISOString().split('T')[0]
  return wc2026Fetch<WC2026Match[]>(`/matches?date=${today}`, 120) // cache 2 min
}

/** Partidos en vivo */
export async function fetchLiveMatches(): Promise<WC2026Match[]> {
  return wc2026Fetch<WC2026Match[]>('/matches?status=live', 60) // cache 1 min
}

/** Partido por ID */
export async function fetchMatchById(id: number): Promise<WC2026Match> {
  return wc2026Fetch<WC2026Match>(`/matches/${id}`, 60)
}

/** Partidos por equipo */
export async function fetchMatchesByTeam(teamCode: string): Promise<WC2026Match[]> {
  return wc2026Fetch<WC2026Match[]>(`/matches?team=${teamCode}`, 3600)
}

/** Partidos por fecha */
export async function fetchMatchesByDate(date: string): Promise<WC2026Match[]> {
  return wc2026Fetch<WC2026Match[]>(`/matches?date=${date}`, 300)
}

/** Partidos por fase */
export async function fetchMatchesByStage(stage: string): Promise<WC2026Match[]> {
  return wc2026Fetch<WC2026Match[]>(`/matches?stage=${encodeURIComponent(stage)}`, 3600)
}

// ── Standings ─────────────────────────────────────────────────────

/** Tabla de posiciones de todos los grupos */
export async function fetchGroupStandings(): Promise<WC2026GroupStanding[]> {
  return wc2026Fetch<WC2026GroupStanding[]>('/standings', 600) // cache 10 min
}

/** Tabla de un grupo específico */
export async function fetchGroupStanding(group: string): Promise<WC2026GroupStanding> {
  return wc2026Fetch<WC2026GroupStanding>(`/standings/${group}`, 300)
}

// ── Teams ─────────────────────────────────────────────────────────

/** Todos los equipos */
export async function fetchTeams() {
  return wc2026Fetch('/teams', 86400) // cache 24h (no cambia)
}
