'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, signOut } from '@/services/auth.service'
import { requestNotificationPermission, subscribeToPush } from '@/lib/notifications/push'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/user.types'

type NotifState = 'unsupported' | 'denied' | 'enabled' | 'disabled'

export default function ProfileClient({ user, profile }: { user: User; profile: UserProfile | null }) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifState, setNotifState] = useState<NotifState>('disabled')
  const [notifLoading, setNotifLoading] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setNotifState('denied')
      return
    }
    if (Notification.permission === 'granted') {
      // Check if we actually have an active subscription
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => {
          setNotifState(sub ? 'enabled' : 'disabled')
        })
      )
    }
  }, [])

  async function handleToggle() {
    if (notifLoading || notifState === 'unsupported' || notifState === 'denied') return
    setNotifLoading(true)

    try {
      if (notifState === 'enabled') {
        // Unsubscribe
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        await fetch('/api/push/subscribe', { method: 'DELETE' })
        setNotifState('disabled')
      } else {
        // Subscribe
        const granted = await requestNotificationPermission()
        if (!granted) {
          setNotifState(Notification.permission === 'denied' ? 'denied' : 'disabled')
          return
        }
        const subscription = await subscribeToPush()
        if (!subscription) return
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        })
        setNotifState('enabled')
      }
    } finally {
      setNotifLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(user.id, { display_name: displayName })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const initial = (profile?.display_name || user.email || '?').charAt(0).toUpperCase()

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-black text-orange-600">
          {initial}
        </div>
        <div>
          <div className="font-bold text-gray-900 text-lg">{profile?.display_name || 'Sin nombre'}</div>
          <div className="text-gray-500 text-sm">{user.email}</div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Editar perfil</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"/>
        </div>
        <button type="submit" disabled={saving}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl transition-colors">
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </form>

      {notifState !== 'unsupported' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Notificaciones</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Alertas push</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {notifState === 'denied'
                  ? 'Bloqueadas en el navegador — habilitá desde Configuración'
                  : notifState === 'enabled'
                  ? 'Activadas — resultados, puntos y novedades del grupo'
                  : 'Recibí alertas aunque la app esté cerrada'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={notifLoading || notifState === 'denied'}
              aria-label={notifState === 'enabled' ? 'Desactivar notificaciones' : 'Activar notificaciones'}
              className={`
                relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200
                focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1
                disabled:opacity-40 disabled:cursor-not-allowed
                ${notifState === 'enabled' ? 'bg-orange-500' : 'bg-gray-200'}
              `}
            >
              <span className={`
                inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200
                ${notifState === 'enabled' ? 'translate-x-6' : 'translate-x-1'}
                ${notifLoading ? 'opacity-60' : ''}
              `} />
            </button>
          </div>
        </div>
      )}

      <button onClick={handleSignOut}
        className="w-full py-3 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors">
        Cerrar sesión
      </button>
    </div>
  )
}
