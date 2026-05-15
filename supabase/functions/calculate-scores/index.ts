import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getTendency(home: number, away: number): 'H' | 'D' | 'A' {
  return home > away ? 'H' : home < away ? 'A' : 'D'
}

function calculatePoints(
  pred: { home_pred: number; away_pred: number },
  result: { home_score: number; away_score: number },
  mode: 'winner' | 'exact'
) {
  const predT = getTendency(pred.home_pred, pred.away_pred)
  const realT = getTendency(result.home_score, result.away_score)
  const tendencyHit = predT === realT
  const exactHit = pred.home_pred === result.home_score && pred.away_pred === result.away_score

  let points = 0
  if (tendencyHit) points += 3
  if (exactHit && mode === 'exact') points += 2

  return { points, tendency_hit: tendencyHit, exact_hit: exactHit, tendency_points: tendencyHit ? 3 : 0, exact_points: exactHit && mode === 'exact' ? 2 : 0 }
}

serve(async (req) => {
  const { matchId, home_score, away_score } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEY')!
  )

  // Update match
  await supabase.from('matches').update({
    home_score, away_score, status: 'finished', updated_at: new Date().toISOString()
  }).eq('id', matchId)

  // Get all predictions
  const { data: predictions } = await supabase
    .from('predictions')
    .select('id, template_id, home_pred, away_pred, prediction_templates(user_id, group_members(group_id, groups(scoring_mode)))')
    .eq('match_id', matchId)
    .eq('locked', false)

  if (!predictions?.length) return new Response('No predictions', { status: 200 })

  const scores = []
  for (const p of predictions) {
    const template = p.prediction_templates as { user_id: string; group_members: { group_id: string; groups: { scoring_mode: string } }[] } | null
    if (!template) continue
    for (const gm of template.group_members) {
      const mode = gm.groups.scoring_mode as 'winner' | 'exact'
      const breakdown = calculatePoints(
        { home_pred: p.home_pred ?? 0, away_pred: p.away_pred ?? 0 },
        { home_score, away_score },
        mode
      )
      scores.push({ prediction_id: p.id, group_id: gm.group_id, user_id: template.user_id, match_id: matchId, points_earned: breakdown.points, breakdown })
    }
  }

  if (scores.length > 0) {
    await supabase.from('match_scores').upsert(scores, { onConflict: 'prediction_id,group_id' })
    await supabase.from('predictions').update({ locked: true }).eq('match_id', matchId)
    await supabase.rpc('refresh_group_totals', { p_match_id: matchId })
  }

  return new Response(JSON.stringify({ ok: true, scores_calculated: scores.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
