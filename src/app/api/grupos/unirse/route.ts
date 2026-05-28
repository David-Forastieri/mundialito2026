import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendPushToUser } from '@/lib/notifications/send'

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
    .select('id, name, max_members, owner_id')
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

  // Use service client — the joining user isn't a member yet so RLS would return 0
  const { count: memberCount } = await service
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

  // Notify the group owner that a new member joined (skip if owner joins their own group)
  if (group.owner_id && group.owner_id !== user.id) {
    const { data: profile } = await service
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const displayName = profile?.display_name ?? 'Alguien'

    await sendPushToUser(service, group.owner_id, {
      title: '👋 Nuevo miembro',
      body: `${displayName} se unió a ${group.name}`,
      url: `/grupos/${group.id}`,
      tag: `new-member-${group.id}-${user.id}`,
    })
  }

  return NextResponse.json({ success: true, group_id: group.id })
}
