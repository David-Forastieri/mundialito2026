import { getFixture } from '@/services/fixture.service'
import Link from 'next/link'
import type { Match, MatchStage } from '@/types/match.types'

export const revalidate = 60

// Colores para cada grupo (A–L)
const GROUP_COLORS: Record<string, { header: string; border: string }> = {
  A: { header: 'bg-red-500',     border: 'border-red-200 hover:border-red-400'     },
  B: { header: 'bg-orange-500',  border: 'border-orange-200 hover:border-orange-400'  },
  C: { header: 'bg-amber-500',   border: 'border-amber-200 hover:border-amber-400'   },
  D: { header: 'bg-yellow-500',  border: 'border-yellow-200 hover:border-yellow-400'  },
  E: { header: 'bg-lime-500',    border: 'border-lime-200 hover:border-lime-400'    },
  F: { header: 'bg-emerald-500', border: 'border-emerald-200 hover:border-emerald-400' },
  G: { header: 'bg-teal-500',    border: 'border-teal-200 hover:border-teal-400'    },
  H: { header: 'bg-cyan-600',    border: 'border-cyan-200 hover:border-cyan-400'    },
  I: { header: 'bg-blue-500',    border: 'border-blue-200 hover:border-blue-400'    },
  J: { header: 'bg-indigo-500',  border: 'border-indigo-200 hover:border-indigo-400'  },
  K: { header: 'bg-violet-500',  border: 'border-violet-200 hover:border-violet-400'  },
  L: { header: 'bg-pink-500',    border: 'border-pink-200 hover:border-pink-400'    },
}

const KNOCKOUT_INFO: Partial<Record<MatchStage, { label: string; icon: string }>> = {
  r32:   { label: 'Ronda de 32',      icon: '⚽' },
  r16:   { label: 'Octavos de Final', icon: '🎯' },
  qf:    { label: 'Cuartos de Final', icon: '🔥' },
  sf:    { label: 'Semifinales',      icon: '⭐' },
  third: { label: 'Tercer Puesto',    icon: '🥉' },
  final: { label: 'Final',            icon: '🏆' },
}

function getTeams(matches: Match[]) {
  const map = new Map<string, { name: string; code: string; logo: string | null }>()
  for (const m of matches) {
    if (!map.has(m.home_team_code))
      map.set(m.home_team_code, { name: m.home_team, code: m.home_team_code, logo: m.home_team_logo })
    if (!map.has(m.away_team_code))
      map.set(m.away_team_code, { name: m.away_team, code: m.away_team_code, logo: m.away_team_logo })
  }
  return Array.from(map.values())
}

export default async function FixturePage() {
  const matches = await getFixture().catch((): Match[] => [])

  const groupMatches   = matches.filter(m => m.stage === 'group')
  const knockoutMatches = matches.filter(m => m.stage !== 'group')

  // Agrupar fase de grupos por grupo_label
  const byGroup = groupMatches.reduce((acc, m) => {
    const key = m.group_label ?? '?'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  const sortedGroups = Object.keys(byGroup).sort()

  // Agrupar eliminatorias por stage
  const byStage = knockoutMatches.reduce((acc, m) => {
    if (!acc[m.stage]) acc[m.stage] = []
    acc[m.stage].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  const knockoutOrder: MatchStage[] = ['r32', 'r16', 'qf', 'sf', 'third', 'final']
  const sortedKnockout = knockoutOrder.filter(s => byStage[s]?.length > 0)

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fixture</h1>
        <Link
          href="/grupos/standings"
          className="text-sm font-medium text-orange-500 hover:underline"
        >
          Tabla de grupos →
        </Link>
      </div>

      {/* ── FASE DE GRUPOS ── */}
      {sortedGroups.length > 0 && (
        <section>
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full inline-block" />
            Fase de Grupos
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sortedGroups.map(group => {
              const color    = GROUP_COLORS[group] ?? { header: 'bg-gray-500', border: 'border-gray-200 hover:border-gray-400' }
              const list     = byGroup[group]
              const teams    = getTeams(list)
              const finished = list.filter(m => m.status === 'finished').length
              const live     = list.filter(m => m.status === 'live').length

              return (
                <Link
                  key={group}
                  href={`/fixture/grupo/${group}`}
                  className={`bg-white rounded-2xl border-2 ${color.border} overflow-hidden hover:shadow-lg transition-all active:scale-95`}
                >
                  {/* Header con color del grupo */}
                  <div className={`${color.header} px-4 py-3 text-white`}>
                    <div className="font-black text-xl leading-tight">Grupo {group}</div>
                    <div className="text-white/80 text-xs flex items-center gap-2 mt-0.5">
                      <span>{finished}/{list.length} jugados</span>
                      {live > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          {live} en vivo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Equipos */}
                  <div className="p-3 space-y-1.5">
                    {teams.map(team => (
                      <div key={team.code} className="flex items-center gap-2">
                        {team.logo
                          ? <img src={team.logo} alt={team.code} className="w-5 h-5 object-contain shrink-0" />
                          : <span className="text-sm shrink-0">🏳️</span>
                        }
                        <span className="text-xs font-medium text-gray-700 truncate">{team.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="px-3 pb-3">
                    <span className="text-xs text-gray-400">Ver partidos →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── FASES ELIMINATORIAS ── */}
      {sortedKnockout.length > 0 && (
        <section>
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full inline-block" />
            Fases Eliminatorias
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sortedKnockout.map(stage => {
              const list     = byStage[stage]
              const info     = KNOCKOUT_INFO[stage]!
              const finished = list.filter(m => m.status === 'finished').length
              const live     = list.filter(m => m.status === 'live').length

              return (
                <Link
                  key={stage}
                  href={`/fixture/etapa/${stage}`}
                  className="bg-white rounded-2xl border-2 border-gray-200 hover:border-orange-400 overflow-hidden hover:shadow-lg transition-all active:scale-95"
                >
                  <div className="bg-gray-800 px-4 py-3 text-white">
                    <div className="font-black text-lg leading-tight flex items-center gap-1.5">
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </div>
                    <div className="text-white/70 text-xs flex items-center gap-2 mt-0.5">
                      <span>{finished}/{list.length} jugados</span>
                      {live > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          {live} en vivo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="text-xs text-gray-500">{list.length} partidos</div>
                    <div className="text-xs text-gray-400 mt-1">Ver partidos →</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {matches.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📅</div>
          <p>No hay partidos cargados todavía</p>
        </div>
      )}
    </div>
  )
}
