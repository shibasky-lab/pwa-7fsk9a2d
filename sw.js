const CACHE_NAME = 'kijunten-pwa-v8'

// インストール時
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker (minimal mode)...')
  self.skipWaiting()
})

// アクティベート時に全てのキャッシュを削除
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker (minimal mode)...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[SW] Deleting cache:', cacheName)
          return caches.delete(cacheName)
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch時の処理: 常にネットワークから取得（キャッシュなし）
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request))
})
