'use client'

import { useEffect, useState } from 'react'
import { requestNotificationPermission, subscribeToPush } from '@/lib/notifications/push'

async function syncSubscription() {
  const subscription = await subscribeToPush()
  if (!subscription) return
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  })
}

export default function PushManager() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(console.error)

    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
      syncSubscription()
    } else if (Notification.permission === 'default') {
      // Show banner after a short delay so it doesn't feel intrusive on load
      const timer = setTimeout(() => setShowBanner(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  async function handleEnable() {
    setShowBanner(false)
    const granted = await requestNotificationPermission()
    if (granted) await syncSubscription()
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-80 z-50
                    bg-white border border-orange-200 rounded-2xl shadow-xl p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl leading-none">🔔</span>
        <div>
          <p className="text-sm font-semibold text-gray-900">Activá las notificaciones</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Resultados de partidos, tus puntos y novedades del grupo al instante.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleEnable}
          className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
        >
          Activar
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="flex-1 border border-gray-200 text-gray-500 text-sm py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}
