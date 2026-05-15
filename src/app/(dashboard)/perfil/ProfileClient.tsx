'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/services/auth.service'
import { signOut } from '@/services/auth.service'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/user.types'

export default function ProfileClient({ user, profile }: { user: User; profile: UserProfile | null }) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
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

      <button onClick={handleSignOut}
        className="w-full py-3 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors">
        Cerrar sesión
      </button>
    </div>
  )
}
