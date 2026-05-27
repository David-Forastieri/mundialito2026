import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  // Accept 8-char clean code or 9-char formatted code with dash
  invite_code: z.string().min(8).max(9),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Código inválido' }, { status: 400 })

  const { invite_code } = parsed.data
  const cleanCode = invite_code.toUpperCase().replace(/-/g, '').trim()

  // Use service client to bypass RLS — a new user joining has no membership yet
  // so the user-context client would be blocked from reading the groups table.
  const service = createServiceClient()
  const { data: group, error: gError } = await service
    .from('groups')
    .select('id, max_members')
    .eq('invite_code', cleanCode)
    .single()

  if (gError || !group) return NextResponse.json({ error: 'Código de invitación inválido' }, { status: 404 })

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single()

  if (existing) return NextResponse.json({ error: 'Ya sos miembro de este grupo' }, { status: 409 })

  const { count: memberCount } = await supabase
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', group.id)

  if ((memberCount ?? 0) >= group.max_members) {
    return NextResponse.json({ error: 'El grupo está lleno' }, { status: 409 })
  }

  const { error: joinError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'member' })

  if (joinError) return NextResponse.json({ error: 'Error al unirse al grupo' }, { status: 500 })

  return NextResponse.json({ success: true, group_id: group.id })
}
