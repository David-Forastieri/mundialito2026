import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: upcomingMatches }, { count: totalGroups }, { data: memberships }] = await Promise.all([
    supabase
      .from('matches')
      .select('id, home_team, away_team, scheduled_at, status, stage')
      .in('status', ['scheduled', 'live'])
      .order('scheduled_at', { ascending: true })
      .limit(3),
    supabase
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('group_members')
      .select('total_points, role, groups(id, name)')
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
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-orange-200 transition-colors">
                <span className="text-sm font-semibold text-gray-900 flex-1 text-right">{match.home_team}</span>
                {match.status === 'live' ? (
                  <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">EN VIVO</span>
                ) : (
                  <span className="text-xs text-gray-400 font-mono text-center">
                    <span className="block">{new Date(match.scheduled_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                    <span className="block">{new Date(match.scheduled_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  </span>
                )}
                <span className="text-sm font-semibold text-gray-900 flex-1">{match.away_team}</span>
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
