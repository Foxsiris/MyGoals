/* ============================================================
   Рост — service worker.
   - navigations: network-first, cached shell as offline fallback
   - same-origin assets: stale-while-revalidate
   - cross-origin (Supabase, fonts CSS): untouched — data must
     never be served stale from here
   ============================================================ */
const CACHE = 'rost-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy))
          return res
        })
        .catch(() => caches.match(e.request).then((m) => m || caches.match(new URL('./', self.registration.scope).href))),
    )
    return
  }

  // hashed assets / icons: serve from cache, refresh in background
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const refresh = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(e.request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || refresh
    }),
  )
})
