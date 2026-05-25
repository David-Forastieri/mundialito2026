import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ScoringMode } from '@/types/group.types'

interface GroupRow {
  group_id: string
  total_points: number | null
  role: string
  groups: {
    id: string
    name: string
    description: string | null
    invite_code: string
    scoring_mode: ScoringMode
    enable_phases: boolean
  } | null
}

export default async function GruposPage() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await serviceClient
    .from('group_members')
    .select(`
      group_id, total_points, role,
      groups (
        id, name, description, invite_code, scoring_mode, enable_phases
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const groups = ((memberships || []) as unknown as GroupRow[])
    .filter(m => m.groups !== null)
    .map(m => ({ ...m.groups!, my_points: m.total_points ?? 0, role: m.role }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mis grupos</h1>

      <div className="flex gap-3">
        <Link href="/grupos/crear"
          className="flex-1 bg-orange-500 text-white rounded-xl p-4 text-center font-semibold hover:bg-orange-600 transition-colors">
          + Crear grupo
        </Link>
        <Link href="/grupos/unirse"
          className="flex-1 bg-white border border-gray-200 rounded-xl p-4 text-center font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          Unirse
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          <div className="text-4xl mb-3">🏆</div>
          <p className="font-medium">Todavía no estás en ningún grupo</p>
          <p className="text-sm mt-1">Creá uno o usá un código de invitación</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => (
            <Link key={group.id} href={`/grupos/${group.id}`}
              className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-200 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{group.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {group.scoring_mode === 'exact' ? '🎯 Exacto' : '✅ Tendencia'}
                    {group.enable_phases && ' · Fases activas'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-orange-500">{group.my_points}</div>
                  <div className="text-xs text-gray-400">pts</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
