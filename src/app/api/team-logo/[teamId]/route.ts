import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const API_HOST = process.env.ALLSPORTS_API_HOST!
const API_KEYS = [
  process.env.ALLSPORTS_API_KEY,
  process.env.ALLSPORTS_API_KEY_2,
].filter(Boolean) as string[]

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <rect width="40" height="40" rx="4" fill="#e5e7eb"/>
  <text x="20" y="26" font-size="18" text-anchor="middle" fill="#9ca3af">🏳</text>
</svg>`

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params

  if (!/^\d+$/.test(teamId)) {
    return new NextResponse(null, { status: 400 })
  }

  // Skip API calls in local dev — return fallback directly to save quota
  if (process.env.NODE_ENV === 'development') {
    return new NextResponse(FALLBACK_SVG, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
    })
  }

  // Try all keys; on 429 (rate-limit) retry once after a short delay
  const tryKeys = async (): Promise<Response | null> => {
    for (const key of API_KEYS) {
      const res = await fetch(
        `https://${API_HOST}/api/team/${teamId}/image`,
        {
          headers: {
            'X-RapidAPI-Key':  key,
            'X-RapidAPI-Host': API_HOST,
          },
        },
      )
      if (res.status === 429) continue   // try next key
      if (!res.ok)            return null // 404 or other error — no point retrying
      return res
    }
    return null // all keys returned 429
  }

  let upstream = await tryKeys()

  // All keys rate-limited (per-second burst) — wait 400ms and try once more
  if (!upstream) {
    await new Promise(r => setTimeout(r, 400))
    upstream = await tryKeys()
  }

  if (upstream) {
    const image = await upstream.arrayBuffer()
    return new NextResponse(image, {
      headers: {
        'Content-Type':  upstream.headers.get('Content-Type') ?? 'image/png',
        // Long CDN cache — logo never changes once a team is in the tournament
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  }

  // Quota exhausted or not found — SVG placeholder.
  // no-store: CDN won't cache this failure so the next request retries the API.
  return new NextResponse(FALLBACK_SVG, {
    headers: {
      'Content-Type':  'image/svg+xml',
      'Cache-Control': 'no-store',
    },
  })
}
