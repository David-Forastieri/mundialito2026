// Service Worker - Mundial 2026 PWA
const CACHE_NAME = 'mundial2026-v1'
const OFFLINE_URL = '/offline'

const STATIC_ASSETS = [
  '/',
  '/fixture',
  '/grupos',
  '/manifest.json',
  // Rutas de fixture por grupo y etapa (precacheadas para PWA offline)
  '/fixture/grupo/A', '/fixture/grupo/B', '/fixture/grupo/C',
  '/fixture/grupo/D', '/fixture/grupo/E', '/fixture/grupo/F',
  '/fixture/grupo/G', '/fixture/grupo/H', '/fixture/grupo/I',
  '/fixture/grupo/J', '/fixture/grupo/K', '/fixture/grupo/L',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Cache-first for static assets
  if (request.destination === 'image' || url.pathname.startsWith('/icons')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    )
    return
  }

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Sin conexión' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    )
    return
  }

  // Stale-while-revalidate for pages
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      return cached || fetchPromise
    })
  )
})

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Mundial 2026', {
      body: data.body || 'Hay novedades en tu grupo',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag || 'mundial2026',
      data: { url: data.url || '/grupos' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
