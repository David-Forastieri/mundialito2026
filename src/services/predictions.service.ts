import { createClient } from '@/lib/supabase/client'
import type { Prediction, PredictionTemplate, SavePredictionDTO } from '@/types/prediction.types'

export async function getUserTemplates(userId: string): Promise<PredictionTemplate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prediction_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createTemplate(userId: string, name: string): Promise<PredictionTemplate> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prediction_templates')
    .insert({ user_id: userId, name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cloneTemplate(
  userId: string,
  templateId: string,
  newName: string
): Promise<PredictionTemplate> {
  const supabase = createClient()

  const { data: newTemplate, error } = await supabase
    .from('prediction_templates')
    .insert({ user_id: userId, name: newName, cloned_from: templateId })
    .select()
    .single()
  if (error) throw error

  const { data: predictions } = await supabase
    .from('predictions')
    .select('match_id, home_pred, away_pred')
    .eq('template_id', templateId)
    .eq('locked', false)

  if (predictions && predictions.length > 0) {
    await supabase.from('predictions').insert(
      predictions.map((p) => ({
        template_id: newTemplate.id,
        match_id: p.match_id,
        home_pred: p.home_pred,
        away_pred: p.away_pred,
      }))
    )
  }

  return newTemplate
}

export async function savePrediction(dto: SavePredictionDTO): Promise<Prediction> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('predictions')
    .upsert(dto, { onConflict: 'template_id,match_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getTemplatePredictions(templateId: string): Promise<Prediction[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('template_id', templateId)
  if (error) throw error
  return data || []
}
