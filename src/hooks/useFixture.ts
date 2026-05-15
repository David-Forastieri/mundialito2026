'use client'
import { useEffect, useState } from 'react'
import { getFixture } from '@/services/fixture.service'
import type { Match } from '@/types/match.types'

export function useFixture(filters?: { stage?: string; status?: string; date?: string }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getFixture(filters)
      .then(setMatches)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters?.stage, filters?.status, filters?.date])

  return { matches, loading, error, refetch: () => getFixture(filters).then(setMatches) }
}
