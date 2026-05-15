import { createClient } from '@/lib/supabase/client'
import type { Match, MatchWithPrediction } from '@/types/match.types'

export async function getFixture(filters?: {
  stage?: string
  status?: string
  date?: string
}): Promise<Match[]> {
  const supabase = createClient()
  let query = supabase
    .from('matches')
    .select('*')
    .order('scheduled_at', { ascending: true })

  if (filters?.stage) query = query.eq('stage', filters.stage)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.date) {
    const start = new Date(filters.date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(filters.date)
    end.setHours(23, 59, 59, 999)
    query = query.gte('scheduled_at', start.toISOString()).lte('scheduled_at', end.toISOString())
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()
  if (error) return null
  return data
}

export async function getFixtureWithPredictions(
  templateId: string,
  groupId: string
): Promise<MatchWithPrediction[]> {
  const supabase = createClient()
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      *,
      predictions!left (
        home_pred, away_pred, locked,
        match_scores!left ( points_earned )
      )
    `)
    .eq('predictions.template_id', templateId)
    .order('scheduled_at', { ascending: true })

  if (error) throw error

  return (matches || []).map((m) => {
    const pred = Array.isArray(m.predictions) ? m.predictions[0] : m.predictions
    const score = pred?.match_scores
      ? (Array.isArray(pred.match_scores) ? pred.match_scores[0] : pred.match_scores)
      : null

    return {
      ...m,
      prediction: pred
        ? {
            home_pred: pred.home_pred,
            away_pred: pred.away_pred,
            locked: pred.locked,
            points_earned: score?.points_earned,
          }
        : undefined,
    } as MatchWithPrediction
  })
}
