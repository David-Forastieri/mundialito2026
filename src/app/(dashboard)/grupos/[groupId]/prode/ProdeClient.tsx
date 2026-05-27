'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { savePrediction, createTemplate } from '@/services/predictions.service'
import { formatArgTime } from '@/lib/date'
import type { MatchWithPrediction } from '@/types/match.types'
import type { PredictionTemplate } from '@/types/prediction.types'
import type { ScoringMode } from '@/types/group.types'

interface Props {
  groupId: string
  userId: string
  templates: PredictionTemplate[]
  activeTemplateId: string | null
  matchesWithPredictions: MatchWithPrediction[]
  scoringMode: ScoringMode
}

export default function ProdeClient({ groupId, userId, templates, activeTemplateId, matchesWithPredictions }: Props) {
  const [templateId, setTemplateId] = useState(activeTemplateId)
  const [matches, setMatches] = useState(matchesWithPredictions)
  const [saving, setSaving] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')

  async function selectTemplate(id: string) {
    const supabase = createClient()
    await supabase.from('group_members')
      .update({ template_id: id })
      .eq('group_id', groupId)
      .eq('user_id', userId)
    setTemplateId(id)
    window.location.reload()
  }

  async function handleCreateTemplate() {
    if (!newTemplateName.trim()) return
    setCreating(true)
    try {
      const t = await createTemplate(userId, newTemplateName)
      await selectTemplate(t.id)
    } finally {
      setCreating(false)
    }
  }

  async function handlePrediction(matchId: string, home: number, away: number) {
    if (!templateId) return
    setSaving(matchId)
    try {
      await savePrediction({ template_id: templateId, match_id: matchId, home_pred: home, away_pred: away })
      setMatches(prev => prev.map(m => m.id === matchId
        ? { ...m, prediction: { ...(m.prediction || {}), home_pred: home, away_pred: away, locked: false } }
        : m
      ))
    } finally {
      setSaving(null)
    }
  }

  if (!templateId) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="font-bold text-amber-900 mb-1">Elegí una plantilla para este grupo</h2>
          <p className="text-sm text-amber-700">Cada grupo requiere una plantilla de predicciones. Podés crear una nueva o clonar una existente.</p>
        </div>

        {templates.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Usar plantilla existente:</p>
            <div className="space-y-2">
              {templates.map(t => (
                <button key={t.id} onClick={() => selectTemplate(t.id)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-orange-400 transition-colors">
                  <div className="font-semibold">{t.name}</div>
                  {t.cloned_from && <div className="text-xs text-gray-400">Clonada</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Crear plantilla nueva:</p>
          <div className="flex gap-2">
            <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)}
              placeholder="Nombre de la plantilla" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
            <button onClick={handleCreateTemplate} disabled={creating || !newTemplateName.trim()}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:bg-orange-300">
              {creating ? '...' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const groupedByStage = matches.reduce((acc, m) => {
    if (!acc[m.stage]) acc[m.stage] = []
    acc[m.stage].push(m)
    return acc
  }, {} as Record<string, MatchWithPrediction[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedByStage).map(([stage, stageMatches]) => (
        <section key={stage}>
          <h2 className="font-bold text-gray-700 mb-3 capitalize">{stage === 'group' ? 'Fase de Grupos' : stage}</h2>
          <div className="space-y-3">
            {stageMatches.map((match) => {
              const now = new Date()
              const scheduledAt = new Date(match.scheduled_at)
              const openAt = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000)
              const closeAt = new Date(scheduledAt.getTime() - 30 * 60 * 1000)
              const tooEarly = now < openAt
              const locked = match.prediction?.locked || now >= closeAt
              const canEdit = !tooEarly && !locked
              const hasResult = match.status === 'finished'

              const hoursUntilOpen = Math.ceil((openAt.getTime() - now.getTime()) / (1000 * 60 * 60))

              return (
                <div key={match.id} className={`bg-white border rounded-2xl p-4 ${
                  canEdit ? 'border-orange-200' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">
                      {formatArgTime(scheduledAt, "dd MMM · HH:mm")}
                      {match.group_label && ` · Gr. ${match.group_label}`}
                    </span>
                    {hasResult && match.prediction?.points_earned !== undefined && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        match.prediction.points_earned > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {match.prediction.points_earned} pts
                      </span>
                    )}
                    {tooEarly && !hasResult && (
                      <span className="text-xs text-orange-400">
                        🕐 Abre en {hoursUntilOpen}h
                      </span>
                    )}
                    {locked && !tooEarly && !hasResult && (
                      <span className="text-xs text-gray-400">🔒 Cerrado</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 items-center gap-3">
                    <div className="text-sm font-semibold text-right">{match.home_team}</div>
                    <div className="flex items-center justify-center gap-2">
                      {!canEdit ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-700">
                            {match.prediction?.home_pred ?? '—'}
                          </div>
                          <span className="text-gray-400">–</span>
                          <div className="w-12 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-700">
                            {match.prediction?.away_pred ?? '—'}
                          </div>
                        </div>
                      ) : (
                        <PredictionInput
                          homeValue={match.prediction?.home_pred ?? null}
                          awayValue={match.prediction?.away_pred ?? null}
                          onChange={(h, a) => handlePrediction(match.id, h, a)}
                          saving={saving === match.id}
                        />
                      )}
                    </div>
                    <div className="text-sm font-semibold">{match.away_team}</div>
                  </div>

                  {hasResult && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-center text-sm text-gray-500">
                      Resultado: <strong className="text-gray-900">{match.home_score} – {match.away_score}</strong>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {matches.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">📅</div>
          <p>No hay partidos disponibles todavía</p>
        </div>
      )}
    </div>
  )
}

function PredictionInput({
  homeValue, awayValue, onChange, saving
}: {
  homeValue: number | null, awayValue: number | null,
  onChange: (h: number, a: number) => void, saving: boolean
}) {
  const [home, setHome] = useState(homeValue?.toString() ?? '')
  const [away, setAway] = useState(awayValue?.toString() ?? '')

  function handleChange(newHome: string, newAway: string) {
    setHome(newHome); setAway(newAway)
    const h = parseInt(newHome), a = parseInt(newAway)
    if (!isNaN(h) && !isNaN(a) && h >= 0 && a >= 0) {
      onChange(h, a)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input type="number" min="0" max="20" value={home}
        onChange={e => handleChange(e.target.value, away)}
        className="w-12 h-10 border border-orange-200 rounded-lg text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <span className="text-gray-400 font-bold">–</span>
      <input type="number" min="0" max="20" value={away}
        onChange={e => handleChange(home, e.target.value)}
        className="w-12 h-10 border border-orange-200 rounded-lg text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      {saving && <span className="ml-1 text-xs text-orange-400">💾</span>}
    </div>
  )
}
