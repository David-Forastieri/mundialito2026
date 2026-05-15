import { getMatchById } from '@/services/fixture.service'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export default async function MatchPage({ params }: { params: { matchId: string } }) {
  const match = await getMatchById(params.matchId)
  if (!match) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  return (
    <div className="space-y-6">
      <Link href="/fixture" className="text-orange-500 text-sm font-medium">← Volver al fixture</Link>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="text-center mb-2">
          {match.group_label && (
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Grupo {match.group_label}
            </span>
          )}
        </div>

        {isLive && (
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> En Vivo
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 items-center gap-4 my-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🏳️</div>
            <div className="font-bold text-lg text-gray-900">{match.home_team}</div>
            <div className="text-xs text-gray-400 uppercase">{match.home_team_code}</div>
          </div>
          <div className="text-center">
            {(isLive || isFinished) ? (
              <div className="text-4xl font-black text-gray-900">
                {match.home_score} – {match.away_score}
              </div>
            ) : (
              <div className="text-gray-400">
                <div className="text-xl font-semibold">{format(new Date(match.scheduled_at), 'HH:mm')}</div>
                <div className="text-xs">{format(new Date(match.scheduled_at), "dd 'de' MMM", { locale: es })}</div>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">🏳️</div>
            <div className="font-bold text-lg text-gray-900">{match.away_team}</div>
            <div className="text-xs text-gray-400 uppercase">{match.away_team_code}</div>
          </div>
        </div>

        {match.venue && (
          <p className="text-center text-sm text-gray-400">📍 {match.venue}</p>
        )}
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
        <p className="text-orange-700 font-medium mb-2">¿Querés predecir este partido?</p>
        <Link href="/grupos" className="inline-block bg-orange-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
          Ir a mis grupos →
        </Link>
      </div>
    </div>
  )
}
