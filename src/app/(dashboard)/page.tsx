import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatArgTime } from '@/lib/date'

export default async function HomePage() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: upcomingMatches }, { data: memberships, count: totalGroups }] = await Promise.all([
    supabase
      .from('matches')
      .select('id, home_team, away_team, home_team_code, away_team_code, home_team_logo, away_team_logo, scheduled_at, status, stage, group_label')
      .in('status', ['scheduled', 'live'])
      .order('scheduled_at', { ascending: true })
      .limit(3),
    serviceClient
      .from('group_members')
      .select('total_points, role, groups(id, name)', { count: 'exact' })
      .eq('user_id', user!.id)
      .order('joined_at', { ascending: false })
      .limit(3),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Mundial 2026</h1>
        <p className="text-gray-500 text-sm mt-1">¡El prode más grande del mundo!</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/fixture" className="bg-orange-500 rounded-2xl p-5 text-white block">
          <div className="text-2xl mb-1">📅</div>
          <div className="font-bold">Ver Fixture</div>
          <div className="text-xs opacity-80 mt-0.5">Todos los partidos</div>
        </Link>
        <Link href="/grupos" className="bg-white border border-gray-200 rounded-2xl p-5 block">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-bold text-gray-900">Mis Grupos</div>
          <div className="text-xs text-gray-500 mt-0.5">{totalGroups ?? 0} grupos</div>
        </Link>
      </div>

      {(upcomingMatches?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Próximos partidos</h2>
            <Link href="/fixture" className="text-orange-500 text-sm font-medium">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {upcomingMatches!.map(match => (
              <Link key={match.id} href={`/fixture/${match.id}`}
                className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-2 hover:border-orange-200 transition-colors group">

                {/* Local */}
                <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 truncate text-right leading-tight">
                    {match.home_team}
                  </span>
                  {match.home_team_logo
                    ? <img src={match.home_team_logo} alt={match.home_team_code ?? ''} className="w-7 h-7 object-contain shrink-0" />
                    : <span className="text-xl shrink-0">🏳️</span>
                  }
                </div>

                {/* Centro: hora / en vivo */}
                <div className="shrink-0 text-center w-20">
                  {match.status === 'live' ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      EN VIVO
                    </span>
                  ) : (
                    <div className="text-xs text-gray-400 leading-tight">
                      <div className="font-semibold text-gray-600">{formatArgTime(match.scheduled_at, 'HH:mm')}</div>
                      <div>{formatArgTime(match.scheduled_at, 'dd MMM')}</div>
                    </div>
                  )}
                </div>

                {/* Visitante */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {match.away_team_logo
                    ? <img src={match.away_team_logo} alt={match.away_team_code ?? ''} className="w-7 h-7 object-contain shrink-0" />
                    : <span className="text-xl shrink-0">🏳️</span>
                  }
                  <span className="text-sm font-semibold text-gray-900 truncate leading-tight">
                    {match.away_team}
                  </span>
                </div>

                <span className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 text-sm">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(memberships?.length ?? 0) > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Mis grupos</h2>
            <Link href="/grupos" className="text-orange-500 text-sm font-medium">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {memberships!.map(m => {
              const group = m.groups as unknown as { id: string; name: string } | null
              if (!group) return null
              return (
                <Link key={group.id} href={`/grupos/${group.id}`}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-orange-200 transition-colors">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{group.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.role === 'owner' ? 'Organizador' : 'Miembro'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg text-gray-900">{m.total_points ?? 0}</div>
                    <div className="text-xs text-gray-400">pts</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-bold text-gray-900 mb-1">¡Creá tu grupo!</h3>
          <p className="text-sm text-gray-500 mb-4">Invitá amigos y compitan por el prode del Mundial</p>
          <Link href="/grupos/crear"
            className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm inline-block hover:bg-orange-600 transition-colors">
            Crear grupo
          </Link>
        </div>
      )}
    </div>
  )
}
