export type ScoringMode = 'winner' | 'exact'
export type MemberRole = 'owner' | 'member'

export interface Group {
  id: string
  name: string
  description: string | null
  owner_id: string
  invite_code: string
  scoring_mode: ScoringMode
  enable_phases: boolean
  max_members: number
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: MemberRole
  total_points: number
  template_id: string | null
  joined_at: string
  profile?: {
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

export interface GroupWithMembers extends Group {
  members: GroupMember[]
  member_count: number
  my_points?: number
  my_rank?: number
}

export interface CreateGroupDTO {
  name: string
  description?: string
  scoring_mode: ScoringMode
  enable_phases: boolean
  max_members?: number
}
