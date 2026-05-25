import { getFixture } from '@/services/fixture.service'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Match, MatchStage } from '@/types/match.types'

export const revalidate = 60

const STAGE_LABELS: Record<MatchStage, string> = {
  group: 'Fase de Grupos', r16: 'Octavos', qf: 'Cuartos',
  sf: 'Semifinal', third: 'Tercer Puesto', final: 'Final',
}

export default async function FixturePage() {
  const matches = await getFixture().catch((): Match[] => [])

  const byStage = matches.reduce((acc, m) => {
    if (!acc[m.stage]) acc[m.stage] = []
    acc[m.stage].push(m)
    return acc
  }, {} as Record<string, typeof matches>)

  const stageOrder: MatchStage[] = ['group', 'r16', 'qf', 'sf', 'third', 'final']
  const sortedStages = stageOrder.filter(s => byStage[s]?.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fixture</h1>
        <Link href="/grupos/standings"
          className="text-sm font-medium text-orange-500 hover:underline">
          Tabla de grupos →
        </Link>
      </div>

      {sortedStages.map((stage) => (
        <section key={stage}>
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full inline-block" />
            {STAGE_LABELS[stage]}
            <span className="text-xs font-normal text-gray-400">
              ({byStage[stage].length} partidos)
            </span>
          </h2>
          <div className="space-y-2">
            {byStage[stage].map((match) => (
              <Link key={match.id} href={`/fixture/${match.id}`}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-all group">
                {match.group_label && (
                  <span className="text-xs font-bold text-gray-400 w-8 flex-shrink-0">
                    Gr.{match.group_label}
                  </span>
                )}
                <div className="flex-1 grid grid-cols-3 items-center gap-2">
                  <div className="text-sm font-medium text-right truncate">{match.home_team}</div>
                  <div className="text-center text-sm">
                    {match.status === 'live' ? (
                      <span className="text-green-600 font-bold">
                        {match.home_score} - {match.away_score}
                        <span className="ml-1 w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                      </span>
                    ) : match.status === 'finished' ? (
                      <span className="font-bold text-gray-700">{match.home_score} - {match.away_score}</span>
                    ) : (
                      <span className="text-gray-400">
                        {format(new Date(match.scheduled_at), 'dd/MM HH:mm')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium truncate">{match.away_team}</div>
                </div>
                <span className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0">›</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {matches.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📅</div>
          <p>No hay partidos cargados todavía</p>
        </div>
      )}
    </div>
  )
}
