import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserGroups, createGroup } from '@/services/groups.service'
import { z } from 'zod'

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  scoring_mode: z.enum(['winner', 'exact']).default('exact'),
  enable_phases: z.boolean().default(true),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const groups = await getUserGroups(user.id)
    return NextResponse.json(groups)
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener grupos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const result = CreateGroupSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.issues }, { status: 400 })

  try {
    const group = await createGroup(user.id, result.data)
    return NextResponse.json(group, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
