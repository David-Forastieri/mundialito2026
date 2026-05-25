import { fetchGroupStandings } from '@/lib/wc2026/client'
import type { WC2026GroupStanding } from '@/types/wc2026api.types'
import Link from 'next/link'

export const revalidate = 300 // revalidate every 5 minutes

export default async function StandingsPage() {
  let standings: WC2026GroupStanding[] = []
  let error = false

  try {
    standings = await fetchGroupStandings()
  } catch {
    error = true
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

      {standings.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          <p>La fase de grupos aún no comenzó</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standings.map((group) => (
          <div key={group.group} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="bg-orange-500 px-4 py-2.5 flex items-center gap-2">
              <span className="font-black text-white text-lg">Grupo {group.group}</span>
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
                    <th className="px-2 py-2 font-medium text-center font-bold text-gray-600">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {group.standings.map((entry, i) => (
                    <tr key={entry.team.code}
                      className={`border-b border-gray-50 last:border-0 ${
                        i < 2 ? 'bg-green-50/50' : ''
                      }`}>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{entry.position}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {entry.team.flag && (
                            <img src={entry.team.flag} alt={entry.team.code}
                              className="w-5 h-4 object-cover rounded-sm" />
                          )}
                          <span className="font-medium text-gray-900">{entry.team.name}</span>
                          {i < 2 && (
                            <span className="text-xs text-green-600 font-medium hidden sm:inline">✓</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center text-gray-600">{entry.played}</td>
                      <td className="px-2 py-2.5 text-center text-gray-600">{entry.won}</td>
                      <td className="px-2 py-2.5 text-center text-gray-600">{entry.drawn}</td>
                      <td className="px-2 py-2.5 text-center text-gray-600">{entry.lost}</td>
                      <td className="px-2 py-2.5 text-center text-gray-600">
                        {entry.goal_difference > 0 ? `+${entry.goal_difference}` : entry.goal_difference}
                      </td>
                      <td className="px-2 py-2.5 text-center font-black text-gray-900">{entry.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 bg-gray-50 text-xs text-gray-400 flex items-center gap-1">
              <span className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm inline-block" />
              Clasifican a Octavos
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
