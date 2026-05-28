import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const SubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const parsed = SubscriptionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update({ push_token: JSON.stringify(parsed.data.subscription) })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Error al guardar suscripción' }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await supabase.from('profiles').update({ push_token: null }).eq('id', user.id)
  return NextResponse.json({ success: true })
}
