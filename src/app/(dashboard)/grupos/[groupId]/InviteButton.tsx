'use client'
import { useState } from 'react'

interface Props {
  groupId: string
  inviteCode: string
}

export default function InviteButton({ groupId, inviteCode }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const formattedCode = `${inviteCode.slice(0, 4)}-${inviteCode.slice(4)}`

  function handleCopy() {
    navigator.clipboard?.writeText(formattedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function sendInvite() {
    if (!email.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/grupos/invitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, invited_email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Error al enviar la invitación' })
      } else if (data.emailSent) {
        setResult({ type: 'success', message: `✓ Invitación enviada a ${email}` })
        setEmail('')
        setTimeout(() => setOpen(false), 2500)
      } else {
        // Email failed — show code so the user can share it manually
        setResult({
          type: 'error',
          message: `No se pudo enviar el email. Compartí el código manualmente: ${formattedCode}`,
        })
        console.warn('[InviteButton] emailError:', data.emailError)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setResult(null) }}
        className="flex-1 bg-white border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors"
      >
        <div className="text-2xl mb-1">🔗</div>
        <div className="font-semibold text-gray-900 text-sm">Invitar</div>
        <div className="text-xs text-gray-400 mt-0.5 font-mono">{formattedCode}</div>
      </button>

      {open && (
        <div className="fixed inset-0 z-60 flex items-end md:items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom)+5rem)] md:pb-4 bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">Invitar al grupo</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            {/* Copy code section */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Código de invitación</p>
              <p className="text-2xl font-black font-mono tracking-widest text-orange-600">{formattedCode}</p>
              <button
                onClick={handleCopy}
                className="mt-2 text-xs text-orange-500 font-medium hover:text-orange-700"
              >
                {copied ? '✓ Copiado!' : 'Copiar código'}
              </button>
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">o enviar por email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email form */}
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendInvite()}
                placeholder="email@ejemplo.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {result && (
                <p className={`text-sm text-center ${result.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {result.message}
                </p>
              )}
              <button
                onClick={sendInvite}
                disabled={!email.trim() || loading}
                className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors hover:bg-orange-600"
              >
                {loading ? (
                  <>
                    <span style={{ animation: 'spin 0.9s linear infinite', display: 'inline-block' }}>⚽</span>
                    Enviando...
                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                  </>
                ) : 'Enviar invitación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
