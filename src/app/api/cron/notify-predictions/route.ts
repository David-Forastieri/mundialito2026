import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/notifications/send'

// Vercel Cron: every 5 minutes
// vercel.json: { "path": "/api/cron/notify-predictions", "schedule": "*/5 * * * *" }
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  // Find matches starting between 25 and 35 minutes from now
  const windowStart = new Date(now.getTime() + 25 * 60 * 1000).toISOString()
  const windowEnd = new Date(now.getTime() + 35 * 60 * 1000).toISOString()

  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('id, home_team, away_team')
    .eq('status', 'scheduled')
    .gte('scheduled_at', windowStart)
    .lte('scheduled_at', windowEnd)

  if (!upcomingMatches || upcomingMatches.length === 0) {
    return NextResponse.json({ ok: true, notified: 0, reason: 'No matches in window' })
  }

  let notified = 0

  for (const match of upcomingMatches) {
    // Step 1: template IDs that already have a prediction for this match
    const { data: existing } = await supabase
      .from('predictions')
      .select('template_id')
      .eq('match_id', match.id)

    const predictedTemplateIds = new Set(existing?.map(p => p.template_id) ?? [])

    // Step 2: group members who have a linked template that hasn't predicted yet
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, template_id')
      .not('template_id', 'is', null)

    if (!members || members.length === 0) continue

    const userIds = [
      ...new Set(
        members
          .filter(m => m.template_id && !predictedTemplateIds.has(m.template_id))
          .map(m => m.user_id)
      ),
    ]

    if (userIds.length === 0) continue

    await Promise.allSettled(
      userIds.map(uid => {
        notified++
        return sendPushToUser(supabase, uid, {
          title: '⏰ ¡Cerrá tu predicción!',
          body: `${match.home_team} vs ${match.away_team} empieza en 30 min`,
          url: `/fixture/${match.id}`,
          tag: `prediction-reminder-${match.id}`,
        })
      })
    )
  }

  return NextResponse.json({ ok: true, notified, matches: upcomingMatches.length })
}
