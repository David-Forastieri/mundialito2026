export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string | null; display_name: string | null; avatar_url: string | null; push_token: string | null; created_at: string; updated_at: string }
        Insert: { id: string; username?: string | null; display_name?: string | null; avatar_url?: string | null; push_token?: string | null; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      groups: {
        Row: { id: string; name: string; description: string | null; owner_id: string; invite_code: string; scoring_mode: 'winner' | 'exact'; enable_phases: boolean; max_members: number; created_at: string }
        Insert: { id?: string; name: string; description?: string | null; owner_id: string; invite_code: string; scoring_mode?: 'winner' | 'exact'; enable_phases?: boolean; max_members?: number; created_at?: string }
        Update: Partial<Database['public']['Tables']['groups']['Insert']>
      }
      group_members: {
        Row: { id: string; group_id: string; user_id: string; role: 'owner' | 'member'; total_points: number; template_id: string | null; joined_at: string }
        Insert: { id?: string; group_id: string; user_id: string; role?: 'owner' | 'member'; total_points?: number; template_id?: string | null; joined_at?: string }
        Update: Partial<Database['public']['Tables']['group_members']['Insert']>
      }
      matches: {
        Row: { id: string; home_team: string; away_team: string; home_team_code: string; away_team_code: string; scheduled_at: string; stage: 'group' | 'r16' | 'qf' | 'sf' | 'final' | 'third'; status: 'scheduled' | 'live' | 'finished' | 'postponed'; home_score: number | null; away_score: number | null; group_label: string | null; venue: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; home_team: string; away_team: string; home_team_code: string; away_team_code: string; scheduled_at: string; stage?: 'group' | 'r16' | 'qf' | 'sf' | 'final' | 'third'; status?: 'scheduled' | 'live' | 'finished' | 'postponed'; home_score?: number | null; away_score?: number | null; group_label?: string | null; venue?: string | null }
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
      }
      prediction_templates: {
        Row: { id: string; user_id: string; name: string; cloned_from: string | null; created_at: string }
        Insert: { id?: string; user_id: string; name: string; cloned_from?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['prediction_templates']['Insert']>
      }
      predictions: {
        Row: { id: string; template_id: string; match_id: string; home_pred: number | null; away_pred: number | null; locked: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; template_id: string; match_id: string; home_pred?: number | null; away_pred?: number | null; locked?: boolean; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['predictions']['Insert']>
      }
      match_scores: {
        Row: { id: string; prediction_id: string; group_id: string; user_id: string; match_id: string; points_earned: number; breakdown: Json; calculated_at: string }
        Insert: { id?: string; prediction_id: string; group_id: string; user_id: string; match_id: string; points_earned?: number; breakdown?: Json; calculated_at?: string }
        Update: Partial<Database['public']['Tables']['match_scores']['Insert']>
      }
      advance_predictions: {
        Row: { id: string; template_id: string; team: string; stage_target: 'r16' | 'qf' | 'sf' | 'final' | 'champion'; position_pred: number | null; points_earned: number; created_at: string }
        Insert: { id?: string; template_id: string; team: string; stage_target: 'r16' | 'qf' | 'sf' | 'final' | 'champion'; position_pred?: number | null; points_earned?: number }
        Update: Partial<Database['public']['Tables']['advance_predictions']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      refresh_group_totals: { Args: { p_match_id: string }; Returns: void }
      get_group_ranking: { Args: { p_group_id: string }; Returns: Array<{ user_id: string; display_name: string; avatar_url: string | null; total_points: number; rank: number; predictions_made: number }> }
    }
    Enums: Record<string, never>
  }
}
