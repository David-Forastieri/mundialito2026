import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { savePrediction } from '@/services/predictions.service'
import { z } from 'zod'

const SavePredictionSchema = z.object({
  template_id: z.string().uuid(),
  match_id: z.string().uuid(),
  home_pred: z.number().int().min(0).max(20),
  away_pred: z.number().int().min(0).max(20),
})

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const result = SavePredictionSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues }, { status: 400 })

  try {
    const prediction = await savePrediction(result.data)
    return NextResponse.json(prediction)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
