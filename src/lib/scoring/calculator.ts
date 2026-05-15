import type { ScoreBreakdown } from '@/types/prediction.types'
import type { ScoringMode } from '@/types/group.types'

type Tendency = 'H' | 'D' | 'A'

function getTendency(home: number, away: number): Tendency {
  if (home > away) return 'H'
  if (home < away) return 'A'
  return 'D'
}

export function calculateMatchPoints(
  prediction: { home_pred: number; away_pred: number },
  result: { home_score: number; away_score: number },
  mode: ScoringMode
): ScoreBreakdown {
  const predTendency = getTendency(prediction.home_pred, prediction.away_pred)
  const realTendency = getTendency(result.home_score, result.away_score)

  const tendency_hit = predTendency === realTendency
  const exact_hit =
    prediction.home_pred === result.home_score &&
    prediction.away_pred === result.away_score

  let tendency_points = 0
  let exact_points = 0

  if (tendency_hit) tendency_points = 3
  if (exact_hit && mode === 'exact') exact_points = 2

  return {
    tendency_hit,
    exact_hit,
    tendency_points,
    exact_points,
    total: tendency_points + exact_points,
  }
}

export function calculateAdvancePoints(
  predicted_position: number | null,
  actual_position: number,
  classified: boolean
): number {
  if (!classified) return 0
  let points = 1 // clasifica
  if (predicted_position === actual_position) points += 2 // posición exacta
  return points
}

export function calculateEliminationPoints(
  predicted_winner: string,
  actual_winner: string
): number {
  return predicted_winner === actual_winner ? 2 : 0
}
