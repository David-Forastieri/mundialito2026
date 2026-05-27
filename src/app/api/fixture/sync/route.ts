import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { syncAllMatches, syncTodayMatches } from '@/lib/wc2026/sync'

const IS_DEV = process.env.NODE_ENV === 'development'

// POST /api/fixture/sync
// Manually sync fixture from WC2026 API
// Use ?mode=all for full sync, ?mode=today for today only (default)
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.ALLSPORTS_API_KEY) {
    return NextResponse.json({ error: 'ALLSPORTS_API_KEY not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const mode       = searchParams.get('mode') || 'today'
  const startParam = searchParams.get('start')  // e.g. ?start=2026-07-05 to resume

  if (IS_DEV) {
    console.warn(
      '\x1b[33m[DEV · Sync]\x1b[0m',
      mode === 'all'
        ? 'Modo "all" limitado a 3 días en desarrollo (producción: 39 días / ~39 req).'
        : 'Modo "today" — 1 llamada a la API.',
    )
  }

  try {
    const supabase  = createServiceClient()
    const startDate = startParam ? new Date(startParam) : undefined
    const result = mode === 'all'
      ? await syncAllMatches(supabase as never, startDate)
      : await syncTodayMatches(supabase as never)

    const devInfo = IS_DEV
      ? {
          dev_mode: true,
          dev_budget: '3 llamadas reales a la API por día en desarrollo',
          ...('devBudgetExhausted' in result && result.devBudgetExhausted
            ? { dev_warning: 'Presupuesto diario agotado — sync detenido. Reiniciará mañana o al reiniciar el servidor.' }
            : {}),
        }
      : {}

    return NextResponse.json({ ok: true, mode, ...devInfo, ...result })
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
  const keysConfigured = [
    process.env.ALLSPORTS_API_KEY,
    process.env.ALLSPORTS_API_KEY_2,
  ].filter(Boolean).length

  return NextResponse.json({
    configured: keysConfigured > 0,
    keys: keysConfigured,
    message: keysConfigured > 0
      ? `${keysConfigured} AllSports API key(s) configured`
      : 'ALLSPORTS_API_KEY not set in environment',
  })
}
