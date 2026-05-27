import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Use service client so the JOIN to groups works even before the user is a member.
  // The invited_email filter ensures users only see their own invitations.
  const service = createServiceClient()
  const { data: invitations } = await service
    .from('group_invitations')
    .select(`
      id, status, created_at, expires_at,
      groups ( id, name, scoring_mode )
    `)
    .eq('invited_email', user.email!)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return NextResponse.json({ invitations: invitations || [] })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, status } = await req.json()
  if (!id || !['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { data: invitation } = await supabase
    .from('group_invitations')
    .select('group_id')
    .eq('id', id)
    .eq('invited_email', user.email!)
    .eq('status', 'pending')
    .single()

  if (!invitation) return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })

  if (status === 'accepted') {
    if (!invitation.group_id) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })

    // Check not already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', invitation.group_id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({ group_id: invitation.group_id, user_id: user.id, role: 'member' })
      if (joinError) return NextResponse.json({ error: 'Error al unirse al grupo' }, { status: 500 })
    }
  }

  await supabase
    .from('group_invitations')
    .update({ status })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
