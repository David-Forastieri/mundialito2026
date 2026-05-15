import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Vercel Cron: runs every 6 hours (configured in vercel.json)
// During the World Cup, you can change to "0 * * * *" (every hour)
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  // Validate this is called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServiceClient()

    // Auto-lock predictions for matches that have started
    const { data: startedMatches } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'scheduled')
      .lt('scheduled_at', new Date().toISOString())

    if (startedMatches && startedMatches.length > 0) {
      for (const match of startedMatches) {
        await supabase
          .from('matches')
          .update({ status: 'live' })
          .eq('id', match.id)

        await supabase
          .from('predictions')
          .update({ locked: true })
          .eq('match_id', match.id)
          .eq('locked', false)
      }
    }

    return NextResponse.json({
      ok: true,
      matches_updated: startedMatches?.length ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron sync-fixture error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
