import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import { sendPushToUser } from '@/lib/notifications/send'
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
  const { data: match } = await supabase
    .from('matches')
    .update({ home_score, away_score, status: 'finished', updated_at: new Date().toISOString() })
    .eq('id', matchId)
    .select('home_team, away_team')
    .single()

  // Get all groups with their scoring mode and predictions for this match
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      id, template_id, home_pred, away_pred,
      prediction_templates (
        user_id,
        group_members ( group_id, groups ( id, name, scoring_mode ) )
      )
    `)
    .eq('match_id', matchId)
    .eq('locked', false)

  if (predictions && predictions.length > 0) {
    const scores = predictions.flatMap((p) => {
      const template = p.prediction_templates as { user_id: string; group_members: { group_id: string; groups: { id: string; name: string; scoring_mode: string } }[] } | null
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
      await supabase.from('predictions').update({ locked: true }).eq('match_id', matchId)
      await supabase.rpc('refresh_group_totals', { p_match_id: matchId })

      // Send push notifications: one per (user, group) with points earned + current position
      const matchLabel = match ? `${match.home_team} vs ${match.away_team}` : 'Partido'

      // Collect unique group IDs to fetch rankings in one pass
      const groupIds = [...new Set(scores.map(s => s.group_id))]

      // Fetch rankings for all affected groups at once
      const rankingsByGroup = new Map<string, { user_id: string; total_points: number; rank: number }[]>()
      await Promise.all(
        groupIds.map(async (gid) => {
          const { data: members } = await supabase
            .from('group_members')
            .select('user_id, total_points')
            .eq('group_id', gid)
            .order('total_points', { ascending: false })
          if (members) {
            rankingsByGroup.set(
              gid,
              members.map((m, i) => ({ user_id: m.user_id, total_points: m.total_points, rank: i + 1 }))
            )
          }
        })
      )

      // Group scores by (user_id, group_id) — a user may have multiple predictions per group
      const userGroupPoints = new Map<string, { userId: string; groupId: string; groupName: string; points: number }>()
      for (const s of scores) {
        const template = (predictions.find(p => p.id === s.prediction_id)?.prediction_templates) as { user_id: string; group_members: { group_id: string; groups: { id: string; name: string; scoring_mode: string } }[] } | null
        const groupName = template?.group_members.find(gm => gm.group_id === s.group_id)?.groups.name ?? ''
        const key = `${s.user_id}:${s.group_id}`
        const existing = userGroupPoints.get(key)
        userGroupPoints.set(key, {
          userId: s.user_id,
          groupId: s.group_id,
          groupName,
          points: (existing?.points ?? 0) + s.points_earned,
        })
      }

      await Promise.allSettled(
        [...userGroupPoints.values()].map(({ userId, groupId, groupName, points }) => {
          const ranking = rankingsByGroup.get(groupId)
          const userRank = ranking?.find(r => r.user_id === userId)?.rank
          const posText = userRank ? ` · Posición #${userRank}` : ''
          const ptsText = points === 1 ? '1 pto' : `${points} pts`

          return sendPushToUser(supabase, userId, {
            title: `⚽ ${matchLabel}`,
            body: `${ptsText} en ${groupName}${posText}`,
            url: `/grupos/${groupId}`,
            tag: `match-result-${matchId}-${groupId}`,
          })
        })
      )
    }
  }

  return NextResponse.json({ ok: true, match_id: matchId })
}
