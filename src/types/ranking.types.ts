export interface RankingEntry {
  user_id: string
  display_name: string
  avatar_url: string | null
  total_points: number
  rank: number
  predictions_made: number
  previous_rank?: number
  rank_change?: number
}

export interface GroupRanking {
  group_id: string
  entries: RankingEntry[]
  last_updated: string
}
