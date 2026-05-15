export type StageTarget = 'r16' | 'qf' | 'sf' | 'final' | 'champion'

export interface PredictionTemplate {
  id: string
  user_id: string
  name: string
  cloned_from: string | null
  created_at: string
}

export interface Prediction {
  id: string
  template_id: string
  match_id: string
  home_pred: number | null
  away_pred: number | null
  locked: boolean
  created_at: string
  updated_at: string
}

export interface SavePredictionDTO {
  template_id: string
  match_id: string
  home_pred: number
  away_pred: number
}

export interface ScoreBreakdown {
  tendency_points: number
  exact_points: number
  total: number
  tendency_hit: boolean
  exact_hit: boolean
}

export interface AdvancePrediction {
  id: string
  template_id: string
  team: string
  stage_target: StageTarget
  position_pred: number | null
  points_earned: number
}
