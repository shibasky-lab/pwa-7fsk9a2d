const CACHE_NAME = 'kijunten-pwa-v5'
const urlsToCache = [
  './',
  './index.html',
  './search.html',
  './detail.html',
  './css/style.css',
  './src/db.js',
  './src/metadata.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
]

// インストール時にキャッシュを作成
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell')
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting())
  )
})

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch時の処理: Cache First戦略
self.addEventListener('fetch', event => {
  // Leafletや外部リソースはネットワーク優先
  if (event.request.url.includes('unpkg.com') || 
      event.request.url.includes('cyberjapandata.gsi.go.jp')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('', { status: 200 })
      })
    )
    return
  }

  // dataディレクトリのJSONファイルはキャッシュしない（IndexedDBで管理）
  if (event.request.url.includes('/data/')) {
    event.respondWith(fetch(event.request))
    return
  }

  // アプリのリソースはキャッシュ優先
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url)
          return response
        }

        // クエリパラメータを無視してマッチングを試みる
        const url = new URL(event.request.url)
        if (url.search && url.origin === location.origin) {
          console.log('[SW] Trying match ignoring query params:', url.pathname)
          
          return caches.match(event.request, { ignoreSearch: true })
            .then(cachedResponse => {
              if (cachedResponse) {
                console.log('[SW] Found in cache (ignoring search):', url.pathname)
                return cachedResponse
              }
              
              return fetchAndCache(event.request)
            })
        }

        return fetchAndCache(event.request)
      })
  )
})

// ネットワークから取得してキャッシュする関数
function fetchAndCache(request) {
  return fetch(request)
    .then(response => {
      if (!response || response.status !== 200 || response.type === 'error') {
        return response
      }

      const responseToCache = response.clone()
      const url = new URL(request.url)
      if (url.origin === location.origin) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache)
        })
      }

      return response
    })
    .catch(err => {
      console.error('[SW] Network request failed:', request.url, err)
      return new Response('', {
        status: 408,
        statusText: 'Request Timeout (offline)'
      })
    })
}
