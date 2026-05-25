import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { MatchWithPrediction } from '@/types/match.types'
import type { PredictionTemplate } from '@/types/prediction.types'
import type { ScoringMode } from '@/types/group.types'
import Link from 'next/link'
import ProdeClient from './ProdeClient'

export default async function ProdePage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group } = await serviceClient
    .from('groups')
    .select('id, name, scoring_mode')
    .eq('id', groupId)
    .single()
  if (!group) notFound()

  const { data: member } = await supabase
    .from('group_members')
    .select('template_id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  const { data: templatesData } = await supabase
    .from('prediction_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const templates = (templatesData || []) as unknown as PredictionTemplate[]

  const activeTemplateId = (member as { template_id: string | null } | null)?.template_id ?? null

  let matchesWithPredictions: MatchWithPrediction[] = []
  if (activeTemplateId) {
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        *,
        predictions!left (
          home_pred, away_pred, locked,
          match_scores!left ( points_earned )
        )
      `)
      .eq('predictions.template_id', activeTemplateId)
      .order('scheduled_at', { ascending: true })

    matchesWithPredictions = (matches || []).map((m) => {
      const pred = Array.isArray(m.predictions) ? m.predictions[0] : m.predictions
      const score = pred?.match_scores
        ? (Array.isArray(pred.match_scores) ? pred.match_scores[0] : pred.match_scores)
        : null
      return {
        ...m,
        prediction: pred
          ? {
              home_pred: pred.home_pred,
              away_pred: pred.away_pred,
              locked: pred.locked,
              points_earned: score?.points_earned,
            }
          : undefined,
      } as MatchWithPrediction
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/grupos/${groupId}`} className="text-orange-500 text-sm font-medium">← {group.name}</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Mi Plantilla</h1>
        <p className="text-sm text-gray-500">Modo: {group.scoring_mode === 'exact' ? '🎯 Resultado exacto' : '✅ Tendencia'}</p>
      </div>

      <ProdeClient
        groupId={groupId}
        userId={user.id}
        templates={templates}
        activeTemplateId={activeTemplateId}
        matchesWithPredictions={matchesWithPredictions}
        scoringMode={group.scoring_mode as ScoringMode}
      />
    </div>
  )
}
