'use client'
import { useEffect, useState, useCallback } from 'react'
import { getGroupRanking } from '@/services/ranking.service'
import { useGroupRankingRealtime } from './useRealtime'
import type { RankingEntry } from '@/types/ranking.types'

export function useGroupRanking(groupId: string) {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRanking = useCallback(() => {
    getGroupRanking(groupId)
      .then(setRanking)
      .finally(() => setLoading(false))
  }, [groupId])

  useEffect(() => { fetchRanking() }, [fetchRanking])
  useGroupRankingRealtime(groupId, fetchRanking)

  return { ranking, loading, refetch: fetchRanking }
}
