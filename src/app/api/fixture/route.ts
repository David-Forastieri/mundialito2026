import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')
  const status = searchParams.get('status')
  const date = searchParams.get('date')

  const supabase = await createClient()
  let query = supabase.from('matches').select('*').order('scheduled_at', { ascending: true })

  if (stage) query = query.eq('stage', stage)
  if (status) query = query.eq('status', status)
  if (date) {
    const start = new Date(date); start.setHours(0,0,0,0)
    const end = new Date(date); end.setHours(23,59,59,999)
    query = query.gte('scheduled_at', start.toISOString()).lte('scheduled_at', end.toISOString())
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
