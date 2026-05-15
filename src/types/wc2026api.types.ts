// ── WC2026 API Response Types ─────────────────────────────────────
// Docs: https://wc2026api.com/docs

export interface WC2026Match {
  id: number
  home_team: WC2026Team
  away_team: WC2026Team
  home_score: number | null
  away_score: number | null
  date: string           // ISO UTC e.g. "2026-06-11T23:00:00Z"
  stage: string          // "Group Stage", "Round of 16", "Quarter-finals", etc.
  group: string | null   // "A", "B", ... null for knockouts
  venue: WC2026Venue
  status: string         // "scheduled", "live", "finished", "postponed"
  minute: number | null  // live match minute
}

export interface WC2026Team {
  id: number
  name: string
  code: string           // "ARG", "BRA", etc.
  flag: string           // URL to flag image
}

export interface WC2026Venue {
  id: number
  name: string
  city: string
  country: string
  capacity: number
}

export interface WC2026GroupStanding {
  group: string
  standings: WC2026StandingEntry[]
}

export interface WC2026StandingEntry {
  position: number
  team: WC2026Team
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

export interface WC2026ApiResponse<T> {
  data: T
  meta?: {
    total: number
    page: number
    per_page: number
  }
}

// ── Stage mapping: WC2026 API → internal DB ───────────────────────
export const WC2026_STAGE_MAP: Record<string, string> = {
  'Group Stage':      'group',
  'Round of 16':      'r16',
  'Quarter-finals':   'qf',
  'Semi-finals':      'sf',
  'Third Place':      'third',
  'Final':            'final',
}

export const WC2026_STATUS_MAP: Record<string, string> = {
  'scheduled':  'scheduled',
  'live':       'live',
  'finished':   'finished',
  'postponed':  'postponed',
  'cancelled':  'postponed',
}
