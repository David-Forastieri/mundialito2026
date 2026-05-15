export type MatchStage = 'group' | 'r16' | 'qf' | 'sf' | 'final' | 'third'
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed'
export type Tendency = 'H' | 'D' | 'A'

export interface Match {
  id: string
  home_team: string
  away_team: string
  home_team_code: string
  away_team_code: string
  scheduled_at: string
  stage: MatchStage
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  group_label: string | null
  venue: string | null
  created_at: string
  updated_at: string
}

export interface MatchWithPrediction extends Match {
  prediction?: {
    home_pred: number | null
    away_pred: number | null
    locked: boolean
    points_earned?: number
  }
}

export const STAGE_LABELS: Record<MatchStage, string> = {
  group: 'Fase de Grupos',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinal',
  third: 'Tercer Puesto',
  final: 'Final',
}
