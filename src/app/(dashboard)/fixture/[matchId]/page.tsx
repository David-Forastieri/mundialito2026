import { getMatchById } from '@/services/fixture.service'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import type { MatchStage } from '@/types/match.types'

const STAGE_LABELS: Partial<Record<MatchStage, string>> = {
  r32:   'Ronda de 32',
  r16:   'Octavos de Final',
  qf:    'Cuartos de Final',
  sf:    'Semifinales',
  third: 'Tercer Puesto',
  final: 'Final',
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  const match = await getMatchById(matchId)
  if (!match) notFound()

  const isLive     = match.status === 'live'
  const isFinished = match.status === 'finished'

  // Back link contextual: grupo → /fixture/grupo/X  |  eliminatoria → /fixture/etapa/Y  |  default → /fixture
  const backHref =
    match.stage === 'group' && match.group_label
      ? `/fixture/grupo/${match.group_label}`
      : match.stage !== 'group'
        ? `/fixture/etapa/${match.stage}`
        : '/fixture'

  const backLabel =
    match.stage === 'group' && match.group_label
      ? `← Grupo ${match.group_label}`
      : match.stage !== 'group'
        ? `← ${STAGE_LABELS[match.stage] ?? 'Fixture'}`
        : '← Fixture'

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href={backHref} className="text-orange-500 text-sm font-medium">
        {backLabel}
      </Link>

      {/* Tarjeta del partido */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        {/* Etiqueta grupo / fase */}
        <div className="text-center mb-2">
          {match.group_label ? (
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Grupo {match.group_label}
            </span>
          ) : match.stage !== 'group' ? (
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {STAGE_LABELS[match.stage]}
            </span>
          ) : null}
        </div>

        {/* Badge en vivo */}
        {isLive && (
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              En Vivo
            </span>
          </div>
        )}

        {/* Teams + Score */}
        <div className="grid grid-cols-3 items-center gap-4 my-6">
          {/* Local */}
          <div className="text-center">
            {match.home_team_logo
              ? <img src={match.home_team_logo} alt={match.home_team_code} className="w-16 h-16 object-contain mx-auto mb-2" />
              : <div className="text-5xl mb-2">🏳️</div>
            }
            <div className="font-bold text-lg text-gray-900 leading-tight">{match.home_team}</div>
            <div className="text-xs text-gray-400 uppercase">{match.home_team_code}</div>
          </div>

          {/* Centro */}
          <div className="text-center">
            {(isLive || isFinished) ? (
              <div className="text-4xl font-black text-gray-900">
                {match.home_score} – {match.away_score}
              </div>
            ) : (
              <div className="text-gray-400">
                <div className="text-xl font-semibold">
                  {format(new Date(match.scheduled_at), 'HH:mm')}
                </div>
                <div className="text-xs">
                  {format(new Date(match.scheduled_at), "dd 'de' MMM", { locale: es })}
                </div>
              </div>
            )}
            {isFinished && (
              <div className="text-xs text-gray-400 mt-1">Final</div>
            )}
          </div>

          {/* Visitante */}
          <div className="text-center">
            {match.away_team_logo
              ? <img src={match.away_team_logo} alt={match.away_team_code} className="w-16 h-16 object-contain mx-auto mb-2" />
              : <div className="text-5xl mb-2">🏳️</div>
            }
            <div className="font-bold text-lg text-gray-900 leading-tight">{match.away_team}</div>
            <div className="text-xs text-gray-400 uppercase">{match.away_team_code}</div>
          </div>
        </div>

        {match.venue && (
          <p className="text-center text-sm text-gray-400">📍 {match.venue}</p>
        )}
      </div>

      {/* CTA predicción */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
        <p className="text-orange-700 font-medium mb-2">¿Querés predecir este partido?</p>
        <Link
          href="/grupos"
          className="inline-block bg-orange-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          Ir a mis grupos →
        </Link>
      </div>
    </div>
  )
}
