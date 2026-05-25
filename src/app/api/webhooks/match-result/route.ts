import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import { z } from 'zod'

const WebhookSchema = z.object({
  matchId: z.string().uuid(),
  home_score: z.number().int().min(0),
  away_score: z.number().int().min(0),
})

export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const result = WebhookSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues }, { status: 400 })

  const { matchId, home_score, away_score } = result.data
  const supabase = createServiceClient()

  // Update match result
  await supabase.from('matches').update({
    home_score, away_score, status: 'finished', updated_at: new Date().toISOString()
  }).eq('id', matchId)

  // Get all groups with their scoring mode and predictions for this match
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      id, template_id, home_pred, away_pred,
      prediction_templates (
        user_id,
        group_members ( group_id, groups ( scoring_mode ) )
      )
    `)
    .eq('match_id', matchId)
    .eq('locked', false)

  if (predictions && predictions.length > 0) {
    const scores = predictions.flatMap((p) => {
      const template = p.prediction_templates as { user_id: string; group_members: { group_id: string; groups: { scoring_mode: string } }[] } | null
      if (!template) return []

      return template.group_members.map((gm) => {
        const mode = gm.groups.scoring_mode as 'winner' | 'exact'
        const breakdown = calculateMatchPoints(
          { home_pred: p.home_pred ?? 0, away_pred: p.away_pred ?? 0 },
          { home_score, away_score },
          mode
        )
        return {
          prediction_id: p.id,
          group_id: gm.group_id,
          user_id: template.user_id,
          match_id: matchId,
          points_earned: breakdown.total,
          breakdown: breakdown as unknown as import('@/types/database.types').Json,
        }
      })
    })

    if (scores.length > 0) {
      await supabase.from('match_scores').upsert(scores, { onConflict: 'prediction_id,group_id' })
      // Lock predictions
      await supabase.from('predictions').update({ locked: true }).eq('match_id', matchId)
      // Refresh totals
      await supabase.rpc('refresh_group_totals', { p_match_id: matchId })
    }
  }

  return NextResponse.json({ ok: true, match_id: matchId })
}
