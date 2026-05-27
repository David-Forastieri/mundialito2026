import { fetchGroupStandings } from '@/lib/wc2026/client'
import type { AllSportsStandingGroup } from '@/types/wc2026api.types'
import { TEAM_CODE_MAP } from '@/types/wc2026api.types'
import Link from 'next/link'
import TeamLogo from '@/components/TeamLogo'

export const revalidate = 300

export default async function StandingsPage() {
  let groups: AllSportsStandingGroup[] = []
  let error = false

  try {
    groups = await fetchGroupStandings()
  } catch (err) {
    error = true
    console.error('[standings] fetchGroupStandings failed:', err)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tabla de Grupos</h1>
        <Link href="/fixture" className="text-sm text-orange-500 font-medium hover:underline">
          Ver fixture →
        </Link>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
          No se pudo cargar la tabla en este momento. Intentá de nuevo más tarde.
        </div>
      )}

      {groups.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          {process.env.NODE_ENV === 'development' ? (
            <p className="text-sm">Tabla deshabilitada en desarrollo<br/>
              <span className="text-xs opacity-70">(se activa en producción para no gastar cuota de API)</span>
            </p>
          ) : (
            <p>La fase de grupos aún no comenzó</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => {
          const letter = group.name.replace('Group ', '')
          return (
            <div key={group.name} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="bg-orange-500 px-4 py-2.5">
                <span className="font-black text-white text-lg">Grupo {letter}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left px-3 py-2 font-medium w-6">#</th>
                      <th className="text-left px-3 py-2 font-medium">Equipo</th>
                      <th className="px-2 py-2 font-medium text-center">PJ</th>
                      <th className="px-2 py-2 font-medium text-center">G</th>
                      <th className="px-2 py-2 font-medium text-center">E</th>
                      <th className="px-2 py-2 font-medium text-center">P</th>
                      <th className="px-2 py-2 font-medium text-center">GD</th>
                      <th className="px-2 py-2 font-bold text-center text-gray-600">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, i) => {
                      const code = TEAM_CODE_MAP[row.team.name] ?? row.team.name.slice(0, 3).toUpperCase()
                      const gd = row.scoresFor - row.scoresAgainst
                      return (
                        <tr key={row.team.id}
                          className={`border-b border-gray-50 last:border-0 ${i < 2 ? 'bg-green-50/50' : ''}`}>
                          <td className="px-3 py-2.5 text-gray-400 text-xs">{row.position}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <TeamLogo
                                src={`/api/team-logo/${row.team.id}`}
                                alt={code}
                                className="w-5 h-5 object-contain rounded-sm"
                              />
                              <span className="font-medium text-gray-900">{row.team.name}</span>
                              {i < 2 && <span className="text-xs text-green-600 font-medium hidden sm:inline">✓</span>}
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-center text-gray-600">{row.matches}</td>
                          <td className="px-2 py-2.5 text-center text-gray-600">{row.wins}</td>
                          <td className="px-2 py-2.5 text-center text-gray-600">{row.draws}</td>
                          <td className="px-2 py-2.5 text-center text-gray-600">{row.losses}</td>
                          <td className="px-2 py-2.5 text-center text-gray-600">
                            {gd > 0 ? `+${gd}` : gd}
                          </td>
                          <td className="px-2 py-2.5 text-center font-black text-gray-900">{row.points}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-3 py-2 bg-gray-50 text-xs text-gray-400 flex items-center gap-1">
                <span className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm inline-block" />
                Clasifican a Ronda de 32
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
