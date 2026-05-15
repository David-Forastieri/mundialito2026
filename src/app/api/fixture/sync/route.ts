import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncAllMatches, syncTodayMatches } from '@/lib/wc2026/sync'

// POST /api/fixture/sync
// Manually sync fixture from WC2026 API
// Use ?mode=all for full sync, ?mode=today for today only (default)
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.WC2026_API_KEY) {
    return NextResponse.json({ error: 'WC2026_API_KEY not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'today'

  try {
    const supabase = await createServiceClient()
    const result = mode === 'all'
      ? await syncAllMatches(supabase as never)
      : await syncTodayMatches(supabase as never)

    return NextResponse.json({ ok: true, mode, ...result })
  } catch (error) {
    console.error('Fixture sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

// GET /api/fixture/sync — health check
export async function GET() {
  const hasKey = !!process.env.WC2026_API_KEY
  return NextResponse.json({
    configured: hasKey,
    message: hasKey ? 'WC2026 API key found' : 'WC2026_API_KEY not set in environment',
  })
}
