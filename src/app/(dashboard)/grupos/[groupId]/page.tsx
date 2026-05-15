import { createClient } from '@/lib/supabase/server'
import { getGroupById } from '@/services/groups.service'
import { getGroupRanking } from '@/services/ranking.service'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function GroupPage({ params }: { params: { groupId: string } }) {
  const group = await getGroupById(params.groupId)
  if (!group) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const ranking = await getGroupRanking(params.groupId).catch(() => [])
  const myEntry = ranking.find(r => r.user_id === user!.id)

  const { data: member } = await supabase
    .from('group_members')
    .select('template_id')
    .eq('group_id', params.groupId)
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/grupos" className="text-orange-500 text-sm font-medium">← Mis grupos</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{group.name}</h1>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span>{group.scoring_mode === 'exact' ? '🎯 Exacto' : '✅ Tendencia'}</span>
          {group.enable_phases && <span>· Fases activas</span>}
          <span>· {group.member_count} miembros</span>
        </div>
      </div>

      {myEntry && (
        <div className="bg-orange-500 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="text-sm opacity-80">Tu posición</div>
            <div className="text-4xl font-black">#{myEntry.rank}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Puntos</div>
            <div className="text-4xl font-black">{myEntry.total_points}</div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/grupos/${params.groupId}/prode`}
          className="flex-1 bg-white border-2 border-orange-200 rounded-xl p-4 text-center hover:border-orange-400 transition-colors">
          <div className="text-2xl mb-1">📝</div>
          <div className="font-semibold text-gray-900 text-sm">
            {member?.template_id ? 'Mi plantilla' : 'Cargar predicciones'}
          </div>
        </Link>
        <button onClick={() => navigator.clipboard?.writeText(`Código: ${group.invite_code}`)}
          className="flex-1 bg-white border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors">
          <div className="text-2xl mb-1">🔗</div>
          <div className="font-semibold text-gray-900 text-sm">Invitar</div>
          <div className="text-xs text-gray-400 mt-0.5 font-mono">{group.invite_code.slice(0,4)}-{group.invite_code.slice(4)}</div>
        </button>
      </div>

      <div>
        <h2 className="font-bold text-gray-900 mb-3">🏆 Tabla de posiciones</h2>
        <div className="space-y-2">
          {ranking.map((entry, i) => (
            <div key={entry.user_id}
              className={`flex items-center gap-4 p-4 rounded-xl ${
                entry.user_id === user!.id ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-gray-100'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                i === 0 ? 'bg-amber-400 text-white' :
                i === 1 ? 'bg-gray-300 text-white' :
                i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {entry.rank}
              </div>
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-sm">
                {entry.display_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">{entry.display_name}</div>
                <div className="text-xs text-gray-400">{entry.predictions_made} predicciones</div>
              </div>
              <div className="font-black text-lg text-gray-900">{entry.total_points}</div>
            </div>
          ))}
          {ranking.length === 0 && (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
              Aún no hay puntos. ¡Cargá tus predicciones!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
