'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Invitation {
  id: string
  status: string
  created_at: string
  groups: { id: string; name: string; scoring_mode: string } | null
}

interface Props {
  initialInvitations: Invitation[]
  initialCode?: string
}

export default function UnirseClient({ initialInvitations, initialCode = '' }: Props) {
  const router = useRouter()
  const [invitations, setInvitations] = useState(initialInvitations)
  const [code, setCode] = useState(initialCode)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function acceptInvitation(id: string) {
    setLoading(id)
    setError('')
    try {
      const res = await fetch('/api/grupos/invitaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'accepted' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al aceptar'); return }
      setInvitations(prev => prev.filter(i => i.id !== id))
      router.push('/grupos')
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  async function rejectInvitation(id: string) {
    setLoading(`reject-${id}`)
    setError('')
    try {
      const res = await fetch('/api/grupos/invitaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      })
      if (!res.ok) { setError('Error al rechazar'); return }
      setInvitations(prev => prev.filter(i => i.id !== id))
    } finally {
      setLoading(null)
    }
  }

  async function joinByCode() {
    if (!code.trim()) return
    setLoading('code')
    setError('')
    try {
      const clean = code.toUpperCase().replace('-', '').trim()
      const res = await fetch('/api/grupos/unirse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: clean }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Código inválido'); return }
      router.push('/grupos')
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Invitaciones pendientes</h2>
          <div className="space-y-3">
            {invitations.map(inv => (
              <div key={inv.id} className="bg-white border border-orange-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">{inv.groups?.name ?? '—'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {inv.groups?.scoring_mode === 'exact' ? '🎯 Exacto' : '✅ Tendencia'}
                    </div>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                    Pendiente
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptInvitation(inv.id)}
                    disabled={loading !== null}
                    className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading === inv.id ? (
                      <>
                        <span style={{ animation: 'spin 0.9s linear infinite', display: 'inline-block' }}>⚽</span>
                        Cargando...
                        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                      </>
                    ) : 'Aceptar'}
                  </button>
                  <button
                    onClick={() => rejectInvitation(inv.id)}
                    disabled={loading !== null}
                    className="flex-1 bg-white border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
                  >
                    {loading === `reject-${inv.id}` ? '...' : 'Rechazar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.length === 0 && (
        <div className="text-center py-6 text-gray-400 bg-white rounded-xl border border-gray-100">
          <div className="text-3xl mb-2">📭</div>
          <p className="text-sm">No tenés invitaciones pendientes</p>
        </div>
      )}

      {/* Join by code */}
      <div>
        <h2 className="font-bold text-gray-900 mb-3">Usar código de invitación</h2>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="XXXX-XXXX"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-orange-400"
            maxLength={9}
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            onClick={joinByCode}
            disabled={!code.trim() || loading === 'code'}
            className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === 'code' ? (
              <>
                <span style={{ animation: 'spin 0.9s linear infinite', display: 'inline-block' }}>⚽</span>
                Cargando...
              </>
            ) : 'Unirme al grupo'}
          </button>
        </div>
      </div>
    </div>
  )
}
