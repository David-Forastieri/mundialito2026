'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/services/groups.service'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function CrearGrupoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scoringMode, setScoringMode] = useState<'winner' | 'exact'>('exact')
  const [enablePhases, setEnablePhases] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true); setError(null)
    try {
      const group = await createGroup(user.id, { name, description, scoring_mode: scoringMode, enable_phases: enablePhases })
      router.push(`/grupos/${group.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el grupo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <Link href="/grupos" className="text-orange-500 text-sm font-medium">← Volver</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-6">Crear grupo</h1>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleCreate} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
            placeholder="Ej: Los cracks de la oficina"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Una descripción del grupo..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"/>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Sistema de puntuación</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'exact', label: '🎯 Resultado exacto', desc: '3 pts tendencia + 2 pts exacto' },
              { value: 'winner', label: '✅ Solo tendencia', desc: '3 pts por ganador/empate' },
            ].map((opt) => (
              <button key={opt.value} type="button" onClick={() => setScoringMode(opt.value as 'exact' | 'winner')}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  scoringMode === opt.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="font-semibold text-sm">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <div className="font-medium text-gray-900 text-sm">Puntos por clasificación</div>
            <div className="text-xs text-gray-500">Sumar pts cuando equipos avanzan de fase</div>
          </div>
          <button type="button" onClick={() => setEnablePhases(!enablePhases)}
            className={`relative w-12 h-6 rounded-full transition-colors ${enablePhases ? 'bg-orange-500' : 'bg-gray-200'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enablePhases ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <button type="submit" disabled={loading || !name.trim()}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl transition-colors">
          {loading ? 'Creando...' : 'Crear grupo'}
        </button>
      </form>
    </div>
  )
}
