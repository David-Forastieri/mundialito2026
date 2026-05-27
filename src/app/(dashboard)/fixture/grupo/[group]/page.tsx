import { getFixture } from '@/services/fixture.service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Match } from '@/types/match.types'

export const revalidate = 60

const GROUP_COLORS: Record<string, { header: string; pill: string }> = {
  A: { header: 'bg-red-500',     pill: 'bg-red-100 text-red-700'       },
  B: { header: 'bg-orange-500',  pill: 'bg-orange-100 text-orange-700'  },
  C: { header: 'bg-amber-500',   pill: 'bg-amber-100 text-amber-700'    },
  D: { header: 'bg-yellow-500',  pill: 'bg-yellow-100 text-yellow-800'  },
  E: { header: 'bg-lime-500',    pill: 'bg-lime-100 text-lime-700'      },
  F: { header: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700'},
  G: { header: 'bg-teal-500',    pill: 'bg-teal-100 text-teal-700'      },
  H: { header: 'bg-cyan-600',    pill: 'bg-cyan-100 text-cyan-700'      },
  I: { header: 'bg-blue-500',    pill: 'bg-blue-100 text-blue-700'      },
  J: { header: 'bg-indigo-500',  pill: 'bg-indigo-100 text-indigo-700'  },
  K: { header: 'bg-violet-500',  pill: 'bg-violet-100 text-violet-700'  },
  L: { header: 'bg-pink-500',    pill: 'bg-pink-100 text-pink-700'      },
}

const DEFAULT_COLOR = { header: 'bg-gray-600', pill: 'bg-gray-100 text-gray-700' }

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params
  return { title: `Grupo ${group.toUpperCase()} · Fixture Mundial 2026` }
}

export default async function GroupFixturePage({
  params,
}: {
  params: Promise<{ group: string }>
}) {
  const { group } = await params
  const groupLabel = group.toUpperCase()

  const allMatches = await getFixture({ stage: 'group' }).catch((): Match[] => [])
  const matches = allMatches.filter(m => m.group_label === groupLabel)

  if (matches.length === 0) notFound()

  const color = GROUP_COLORS[groupLabel] ?? DEFAULT_COLOR

  // Equipos únicos del grupo
  const teamMap = new Map<string, { name: string; code: string; logo: string | null }>()
  for (const m of matches) {
    if (!teamMap.has(m.home_team_code))
      teamMap.set(m.home_team_code, { name: m.home_team, code: m.home_team_code, logo: m.home_team_logo })
    if (!teamMap.has(m.away_team_code))
      teamMap.set(m.away_team_code, { name: m.away_team, code: m.away_team_code, logo: m.away_team_logo })
  }
  const teams   = Array.from(teamMap.values())
  const finished = matches.filter(m => m.status === 'finished').length
  const live     = matches.filter(m => m.status === 'live').length

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/fixture" className="text-orange-500 text-sm font-medium inline-flex items-center gap-1">
        ← Fixture
      </Link>

      {/* Tarjeta de cabecera del grupo */}
      <div className={`${color.header} rounded-2xl p-5 text-white`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">
              Fase de Grupos
            </div>
            <div className="text-5xl font-black leading-none">Grupo {groupLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-white/80 text-sm font-semibold">{finished}/{matches.length}</div>
            <div className="text-white/60 text-xs">jugados</div>
            {live > 0 && (
              <div className="flex items-center justify-end gap-1 mt-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-bold">{live} en vivo</span>
              </div>
            )}
          </div>
        </div>

        {/* Grid de equipos */}
        <div className="grid grid-cols-2 gap-2">
          {teams.map(team => (
            <div key={team.code} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
              {team.logo
                ? <img src={team.logo} alt={team.code} className="w-6 h-6 object-contain shrink-0" />
                : <span className="text-lg shrink-0">🏳️</span>
              }
              <span className="text-sm font-semibold truncate">{team.name}</span>
            </div>
          ))}
        </div>
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
                        {format(new Date(match.scheduled_at), 'HH:mm')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(match.scheduled_at), "dd 'de' MMM", { locale: es })}
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

      {/* CTA tabla */}
      <Link
        href="/grupos/standings"
        className="block text-center bg-white border-2 border-gray-100 hover:border-orange-300 rounded-2xl py-3 text-sm font-semibold text-gray-600 hover:text-orange-600 transition-all"
      >
        Ver tabla del Grupo {groupLabel} →
      </Link>
    </div>
  )
}
