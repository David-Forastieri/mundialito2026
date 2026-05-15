export interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  push_token: string | null
  created_at: string
  updated_at: string
}

export interface UpdateProfileDTO {
  username?: string
  display_name?: string
  avatar_url?: string
  push_token?: string
}
