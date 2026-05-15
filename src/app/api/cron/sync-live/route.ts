import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncLiveMatches, syncFinishedMatches } from '@/lib/wc2026/sync'

// Vercel Cron: every minute during World Cup
// vercel.json: { "path": "/api/cron/sync-live", "schedule": "* * * * *" }
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.WC2026_API_KEY) {
    return NextResponse.json({ error: 'WC2026_API_KEY not configured' }, { status: 500 })
  }

  try {
    const supabase = await createServiceClient()

    // Check if there are any live matches before hitting the API
    const { data: liveMatches } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'live')
      .limit(1)

    // Also check if any match started in the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data: recentMatches } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'scheduled')
      .gte('scheduled_at', twoHoursAgo)
      .lte('scheduled_at', new Date().toISOString())
      .limit(1)

    // Only call API if there's something happening
    const hasActivity = (liveMatches?.length ?? 0) > 0 || (recentMatches?.length ?? 0) > 0

    if (!hasActivity) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'No active matches' })
    }

    const [liveResult, finishedResult] = await Promise.all([
      syncLiveMatches(supabase as never),
      syncFinishedMatches(supabase as never),
    ])

    return NextResponse.json({
      ok: true,
      live_updated: liveResult.updated,
      finished: finishedResult.finished,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron sync-live error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
