'use client'
import { useEffect, useCallback } from 'react'
import { subscribeToGroupRanking, subscribeToMatch } from '@/lib/supabase/realtime'

export function useGroupRankingRealtime(groupId: string, onUpdate: () => void) {
  const stableOnUpdate = useCallback(onUpdate, [])

  useEffect(() => {
    if (!groupId) return
    const unsubscribe = subscribeToGroupRanking(groupId, stableOnUpdate)
    return unsubscribe
  }, [groupId, stableOnUpdate])
}

export function useMatchRealtime(matchId: string, onUpdate: () => void) {
  const stableOnUpdate = useCallback(onUpdate, [])

  useEffect(() => {
    if (!matchId) return
    const unsubscribe = subscribeToMatch(matchId, stableOnUpdate)
    return unsubscribe
  }, [matchId, stableOnUpdate])
}
