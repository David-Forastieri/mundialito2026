import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncTodayMatches, syncLiveMatches, syncFinishedMatches } from '@/lib/wc2026/sync'

// Vercel Cron: once per day at 8 AM UTC (Hobby plan limit)
// For live scores during matches, trigger manually via /api/fixture/sync
// or upgrade to Pro for per-minute crons
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const results: Record<string, unknown> = {}

    // 1. Sync today's matches from WC2026 API (if key is configured)
    if (process.env.ALLSPORTS_API_KEY) {
      const sync = await syncTodayMatches(supabase as never)
      results.fixture_sync = sync

      // 2. Update live scores
      const live = await syncLiveMatches(supabase as never)
      results.live_sync = live

      // 3. Mark finished matches
      const finished = await syncFinishedMatches(supabase as never)
      results.finished_sync = finished
    }

    // 4. Auto-lock predictions for matches that started
    const { data: started } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'scheduled')
      .lt('scheduled_at', new Date().toISOString())

    if (started?.length) {
      for (const match of started) {
        await supabase.from('matches').update({ status: 'live' }).eq('id', match.id)
        await supabase.from('predictions').update({ locked: true })
          .eq('match_id', match.id).eq('locked', false)
      }
      results.matches_started = started.length
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), ...results })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
