import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@/lib/invite/generator'
import type { Group, GroupWithMembers, CreateGroupDTO } from '@/types/group.types'

export async function getUserGroups(userId: string): Promise<GroupWithMembers[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      total_points,
      role,
      groups (
        id, name, description, owner_id, invite_code,
        scoring_mode, enable_phases, max_members, created_at
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  if (error) throw error
  return (data || []).map((m) => ({
    ...(m.groups as unknown as Group),
    members: [],
    member_count: 0,
    my_points: m.total_points,
  }))
}

export async function getGroupById(groupId: string): Promise<GroupWithMembers | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        id, user_id, role, total_points, template_id, joined_at,
        profiles ( display_name, username, avatar_url )
      )
    `)
    .eq('id', groupId)
    .single()

  if (error) return null
  return {
    ...data,
    members: data.group_members || [],
    member_count: data.group_members?.length || 0,
  } as unknown as GroupWithMembers
}

export async function createGroup(userId: string, dto: CreateGroupDTO): Promise<Group> {
  const supabase = createClient()
  const invite_code = generateInviteCode()
  const id = crypto.randomUUID()

  const { error } = await supabase
    .from('groups')
    .insert({ id, ...dto, owner_id: userId, invite_code })
  if (error) throw error

  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: id,
    user_id: userId,
    role: 'owner',
  })
  if (memberError) throw memberError

  // Return local data — avoids a SELECT that triggers complex RLS evaluation
  return {
    id,
    name: dto.name,
    description: dto.description ?? null,
    owner_id: userId,
    invite_code,
    scoring_mode: dto.scoring_mode,
    enable_phases: dto.enable_phases,
    max_members: dto.max_members ?? 50,
    created_at: new Date().toISOString(),
  }
}

export async function joinGroupByCode(userId: string, inviteCode: string): Promise<Group> {
  const supabase = createClient()
  const { data: group, error: gError } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase().replace('-', ''))
    .single()

  if (gError || !group) throw new Error('Código de invitación inválido')

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .single()

  if (existing) throw new Error('Ya sos miembro de este grupo')

  const { data: members } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)

  if ((members?.length || 0) >= group.max_members) {
    throw new Error('El grupo está lleno')
  }

  const { error: mError } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    role: 'member',
  })

  if (mError) throw mError
  return group as unknown as Group
}
