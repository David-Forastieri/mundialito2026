import { getFixture } from '@/services/fixture.service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatArgTime } from '@/lib/date'
import type { Match, MatchStage } from '@/types/match.types'

export const revalidate = 60

const STAGE_INFO: Partial<Record<MatchStage, { label: string; sublabel: string; icon: string; header: string }>> = {
  r32:   { label: 'Ronda de 32',      sublabel: '32 equipos clasificados', icon: '⚽', header: 'bg-slate-700' },
  r16:   { label: 'Octavos de Final', sublabel: '16 mejores equipos',       icon: '🎯', header: 'bg-slate-800' },
  qf:    { label: 'Cuartos de Final', sublabel: '8 equipos en juego',       icon: '🔥', header: 'bg-gray-800'  },
  sf:    { label: 'Semifinales',      sublabel: '4 equipos por el título',   icon: '⭐', header: 'bg-zinc-800'  },
  third: { label: 'Tercer Puesto',    sublabel: 'Disputa por el bronce',     icon: '🥉', header: 'bg-amber-700' },
  final: { label: 'Final',            sublabel: 'La gran final del mundial', icon: '🏆', header: 'bg-yellow-600'},
}

export async function generateMetadata({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params
  const info = STAGE_INFO[stage as MatchStage]
  return { title: `${info?.label ?? stage} · Fixture Mundial 2026` }
}

export default async function StagePage({
  params,
}: {
  params: Promise<{ stage: string }>
}) {
  const { stage } = await params

  const info = STAGE_INFO[stage as MatchStage]
  if (!info) notFound()

  const matches = await getFixture({ stage }).catch((): Match[] => [])
  if (matches.length === 0) notFound()

  const finished = matches.filter(m => m.status === 'finished').length
  const live     = matches.filter(m => m.status === 'live').length

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/fixture" className="text-orange-500 text-sm font-medium inline-flex items-center gap-1">
        ← Fixture
      </Link>

      {/* Cabecera de la fase */}
      <div className={`${info.header} rounded-2xl p-5 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">
              Fase Eliminatoria
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl">{info.icon}</span>
              <span className="text-3xl font-black leading-tight">{info.label}</span>
            </div>
            <div className="text-white/70 text-sm mt-1">{info.sublabel}</div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-white/80 text-sm font-semibold">{finished}/{matches.length}</div>
            <div className="text-white/60 text-xs">jugados</div>
          </div>
        </div>

        {live > 0 && (
          <div className="mt-4 flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2 w-fit">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-bold">{live} partido{live !== 1 ? 's' : ''} en vivo</span>
          </div>
        )}
      </div>

      {/* Lista de partidos */}
      <section>
        <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-orange-500 rounded-full inline-block" />
          Partidos
          <span className="text-xs font-normal text-gray-400">({matches.length})</span>
        </h2>

        <div className="space-y-2">
          {matches.map(match => (
            <Link
              key={match.id}
              href={`/fixture/${match.id}`}
              className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 grid grid-cols-3 items-center gap-2">
                {/* Local */}
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-medium text-right truncate leading-tight">
                    {match.home_team}
                  </span>
                  {match.home_team_logo
                    ? <img src={match.home_team_logo} alt={match.home_team_code} className="w-6 h-6 object-contain shrink-0" />
                    : <span className="text-lg shrink-0">🏳️</span>
                  }
                </div>

                {/* Marcador / Hora */}
                <div className="text-center">
                  {match.status === 'live' ? (
                    <div className="flex flex-col items-center">
                      <span className="text-green-600 font-black text-base">
                        {match.home_score} – {match.away_score}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-green-500 font-semibold">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        En vivo
                      </span>
                    </div>
                  ) : match.status === 'finished' ? (
                    <span className="font-black text-base text-gray-800">
                      {match.home_score} – {match.away_score}
                    </span>
                  ) : (
                    <div>
                      <div className="font-bold text-gray-800 text-sm">
                        {formatArgTime(match.scheduled_at, 'HH:mm')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatArgTime(match.scheduled_at, "dd 'de' MMM")}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visitante */}
                <div className="flex items-center gap-2">
                  {match.away_team_logo
                    ? <img src={match.away_team_logo} alt={match.away_team_code} className="w-6 h-6 object-contain shrink-0" />
                    : <span className="text-lg shrink-0">🏳️</span>
                  }
                  <span className="text-sm font-medium truncate leading-tight">
                    {match.away_team}
                  </span>
                </div>
              </div>

              <span className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0">›</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
