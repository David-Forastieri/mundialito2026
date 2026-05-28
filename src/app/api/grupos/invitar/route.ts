import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  group_id: z.string().uuid(),
  invited_email: z.string().email(),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { group_id, invited_email } = parsed.data

  // Fetch group and validate ownership in a single query.
  // Only the group owner can invite users.
  const serviceClient = createServiceClient()
  const { data: group } = await serviceClient
    .from('groups')
    .select('name, invite_code, owner_id')
    .eq('id', group_id)
    .single()

  if (!group) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
  if (group.owner_id !== user.id) {
    return NextResponse.json({ error: 'Solo el dueño del grupo puede invitar usuarios' }, { status: 403 })
  }

  // Store invitation (upsert to avoid duplicates).
  // Use service client — the group_invitations INSERT policy checks group_members via the
  // self-referential RLS, which silently returns false and blocks the insert.
  // Ownership was already verified above (group.owner_id === user.id).
  const { error: inviteError } = await serviceClient
    .from('group_invitations')
    .upsert(
      { group_id, invited_email, invited_by: user.id, status: 'pending' },
      { onConflict: 'group_id,invited_email' }
    )

  if (inviteError) return NextResponse.json({ error: 'Error al crear la invitación' }, { status: 500 })

  // Send email via Resend if configured
  const resendKey = process.env.RESEND_API_KEY
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mundialito2026-eight.vercel.app'
  const siteUrl = rawSiteUrl.startsWith('http://localhost') ? 'https://mundialito2026-eight.vercel.app' : rawSiteUrl
  const inviteCode = group.invite_code
  const formattedCode = `${inviteCode.slice(0, 4)}-${inviteCode.slice(4)}`

  if (resendKey) {
    const emailBody = {
      from: 'Mundial 2026 Prode <onboarding@resend.dev>',
      to: [invited_email],
      subject: `Te invitaron al grupo "${group.name}" en Mundial 2026 Prode`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#f97316">⚽ Mundial 2026 Prode</h2>
          <p>¡Hola! Te invitaron a unirte al grupo <strong>${group.name}</strong>.</p>
          <p>Usá este código de invitación:</p>
          <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
            <span style="font-size:28px;font-weight:900;font-family:monospace;color:#ea580c;letter-spacing:4px">${formattedCode}</span>
          </div>
          <a href="${siteUrl}/invitacion?code=${formattedCode}"
             style="display:block;background:#f97316;color:#fff;text-decoration:none;padding:14px 24px;border-radius:12px;text-align:center;font-weight:700;font-size:16px">
            Unirme al grupo
          </a>
          <p style="margin-top:16px;font-size:12px;color:#9ca3af">
            Este enlace expira en 7 días. Si no querés unirte, podés ignorar este email.
          </p>
        </div>
      `,
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
      body: JSON.stringify(emailBody),
    })
  }

  return NextResponse.json({
    success: true,
    emailSent: !!resendKey,
    inviteCode: formattedCode,
  })
}
