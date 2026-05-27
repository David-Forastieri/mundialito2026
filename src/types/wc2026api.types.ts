// AllSportsAPI v2 — Response Types
// Via RapidAPI: allsportsapi2.p.rapidapi.com
// WC 2026: tournament_id=16, season_id=58210

export interface AllSportsEvent {
  id: number
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  startTimestamp: number                  // Unix seconds → new Date(ts * 1000)
  status: {
    type: string                          // "notstarted" | "inprogress" | "finished" | "postponed" | "canceled"
    code: number
    description: string
  }
  homeScore: { current?: number }
  awayScore: { current?: number }
  tournament: { id: number; name: string } // "FIFA World Cup, Group A" | "FIFA World Cup, Knockout"
  roundInfo: { round: number; name?: string; cupRoundType?: number }
  venue?: { name?: string; city?: { name?: string } }
}

export interface AllSportsMatchResponse {
  event: AllSportsEvent
}

export interface AllSportsMatchesResponse {
  events: AllSportsEvent[]
}

export interface AllSportsStandingRow {
  position: number
  team: { id: number; name: string }
  points: number
  wins: number
  draws: number
  losses: number
  scoresFor: number
  scoresAgainst: number
  scoreDiffFormatted: string
  matches: number
}

export interface AllSportsStandingGroup {
  name: string          // "Group A", "Group B", ...
  rows: AllSportsStandingRow[]
}

export interface AllSportsStandingsResponse {
  standings: AllSportsStandingGroup[]
}

// AllSports status.type → internal status
export const STATUS_MAP: Record<string, string> = {
  notstarted:  'scheduled',
  inprogress:  'live',
  finished:    'finished',
  postponed:   'postponed',
  canceled:    'postponed',
  cancelled:   'postponed',
}

// roundInfo.name → internal stage (knockout only)
export const ROUND_NAME_STAGE_MAP: Record<string, string> = {
  'Round of 32':   'r32',
  'Round of 16':   'r16',
  'Quarterfinals': 'qf',
  'Quarter-finals':'qf',
  'Semifinals':    'sf',
  'Semi-finals':   'sf',
  '3rd Place':     'third',
  'Third place':   'third',
  'Final':         'final',
}

// Team name (AllSports English) → FIFA 3-letter code
export const TEAM_CODE_MAP: Record<string, string> = {
  // CONMEBOL
  'Argentina': 'ARG', 'Brazil': 'BRA', 'Colombia': 'COL',
  'Uruguay': 'URU', 'Ecuador': 'ECU', 'Venezuela': 'VEN',
  'Paraguay': 'PAR', 'Bolivia': 'BOL', 'Chile': 'CHI', 'Peru': 'PER',
  // CONCACAF
  'United States': 'USA', 'USA': 'USA', 'Mexico': 'MEX', 'Canada': 'CAN',
  'Panama': 'PAN', 'Costa Rica': 'CRC', 'Honduras': 'HON',
  'Jamaica': 'JAM', 'Guatemala': 'GUA', 'Cuba': 'CUB',
  'El Salvador': 'SLV', 'Trinidad and Tobago': 'TTO', 'Trinidad & Tobago': 'TTO',
  // UEFA
  'Germany': 'GER', 'Spain': 'ESP', 'France': 'FRA', 'England': 'ENG',
  'Portugal': 'POR', 'Netherlands': 'NED', 'Belgium': 'BEL', 'Italy': 'ITA',
  'Poland': 'POL', 'Austria': 'AUT', 'Switzerland': 'SUI', 'Croatia': 'CRO',
  'Serbia': 'SRB', 'Slovakia': 'SVK', 'Czech Republic': 'CZE', 'Czechia': 'CZE',
  'Hungary': 'HUN', 'Denmark': 'DEN', 'Turkey': 'TUR', 'Romania': 'ROU',
  'Ukraine': 'UKR', 'Georgia': 'GEO', 'Albania': 'ALB', 'Norway': 'NOR',
  'Sweden': 'SWE', 'Wales': 'WAL', 'Scotland': 'SCO', 'Greece': 'GRE',
  'Iceland': 'ISL', 'Finland': 'FIN',
  'Bosnia & Herzegovina': 'BIH', 'Bosnia and Herzegovina': 'BIH',
  'North Macedonia': 'MKD', 'Montenegro': 'MNE', 'Kosovo': 'KOS',
  // AFC
  'Japan': 'JPN', 'South Korea': 'KOR', 'Korea Republic': 'KOR',
  'Australia': 'AUS', 'Iran': 'IRN', 'Saudi Arabia': 'KSA',
  'Qatar': 'QAT', 'Iraq': 'IRQ', 'United Arab Emirates': 'UAE', 'UAE': 'UAE',
  'Jordan': 'JOR', 'Uzbekistan': 'UZB', 'Kyrgyzstan': 'KGZ',
  'Bahrain': 'BHR', 'Oman': 'OMA', 'China': 'CHN', 'Indonesia': 'IDN',
  // CAF
  'Morocco': 'MAR', 'Senegal': 'SEN', 'Cameroon': 'CMR', 'Egypt': 'EGY',
  "Cote d'Ivoire": 'CIV', 'Ivory Coast': 'CIV', 'Algeria': 'ALG',
  'Nigeria': 'NGA', 'Tunisia': 'TUN', 'DR Congo': 'COD', 'Congo DR': 'COD',
  'Mali': 'MLI', 'South Africa': 'RSA', 'Burkina Faso': 'BFA',
  'Ghana': 'GHA', 'Cape Verde': 'CPV', 'Tanzania': 'TAN', 'Benin': 'BEN',
  'Zambia': 'ZAM',
  // OFC
  'New Zealand': 'NZL',
}
