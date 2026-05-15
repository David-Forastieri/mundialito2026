import { createClient } from '@/lib/supabase/server'
import { getGroupById } from '@/services/groups.service'
import { getFixtureWithPredictions } from '@/services/fixture.service'
import { getUserTemplates } from '@/services/predictions.service'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ProdeClient from './ProdeClient'

export default async function ProdePage({ params }: { params: { groupId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const group = await getGroupById(params.groupId)
  if (!group) notFound()

  const { data: member } = await supabase
    .from('group_members')
    .select('template_id')
    .eq('group_id', params.groupId)
    .eq('user_id', user.id)
    .single()

  const templates = await getUserTemplates(user.id)
  const activeTemplateId = member?.template_id

  let matchesWithPredictions = []
  if (activeTemplateId) {
    matchesWithPredictions = await getFixtureWithPredictions(activeTemplateId, params.groupId).catch(() => [])
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/grupos/${params.groupId}`} className="text-orange-500 text-sm font-medium">← {group.name}</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Mi Plantilla</h1>
        <p className="text-sm text-gray-500">Modo: {group.scoring_mode === 'exact' ? '🎯 Resultado exacto' : '✅ Tendencia'}</p>
      </div>

      <ProdeClient
        groupId={params.groupId}
        userId={user.id}
        templates={templates}
        activeTemplateId={activeTemplateId || null}
        matchesWithPredictions={matchesWithPredictions}
        scoringMode={group.scoring_mode}
      />
    </div>
  )
}
