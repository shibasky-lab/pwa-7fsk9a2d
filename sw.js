const CACHE_NAME = 'kijunten-pwa-v15'
const RUNTIME_CACHE = 'kijunten-runtime-v15'
const RUNTIME_CACHE_MAX_SIZE = 50 // Runtime Cacheの最大アイテム数

// キャッシュするリソース（必要最小限）
const CACHE_URLS = [
  './',
  './index.html',
  './search.html',
  './detail.html',
  './add-visit.html',
  './sokusetsu.html',
  './setting.html',
  './stats.html',
  './css/style.css',
  './src/db.js',
  './src/metadata.js',
  './icon-192.png',
  './icon-512.png',
  './manifest.json'
]

// インストール時: 必須リソースをキャッシュ
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell')
        return cache.addAll(CACHE_URLS)
      })
      .then(() => self.skipWaiting())
  )
})

// アクティベート時: 古いキャッシュを削除
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...')
  console.log('[SW] Current cache names:', CACHE_NAME, RUNTIME_CACHE)
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('[SW] Found existing caches:', cacheNames)
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName).then(success => {
              console.log('[SW] Cache deleted:', cacheName, 'success:', success)
              return success
            })
          }
        })
      )
    }).then(() => {
      console.log('[SW] All old caches cleaned, claiming clients...')
      return self.clients.claim()
    }).then(() => {
      console.log('[SW] Service Worker activated successfully')
    })
  )
})

// Fetch時の処理: キャッシング戦略
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // 同一オリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return
  }

  // データファイル（/data/以下のJSONファイル）はキャッシュせずネットワークから取得
  if (shouldSkipCache(url)) {
    event.respondWith(fetch(request))
    return
  }

  // キャッシュ戦略を選択
  if (shouldCacheFirst(url)) {
    // HTML/CSS/JS/画像: Cache First（キャッシュ優先）
    event.respondWith(cacheFirst(request))
  } else if (shouldNetworkFirst(url)) {
    // 設定ファイルなど: Network First（ネットワーク優先）
    event.respondWith(networkFirst(request))
  } else {
    // その他: ネットワークのみ
    event.respondWith(fetch(request))
  }
})

// Cache First戦略: キャッシュ優先、ネットワークフォールバック
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  
  // HTMLファイルの場合、URLパラメータを無視してマッチング
  const url = new URL(request.url)
  let cacheKey = request
  
  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    // パラメータなしのURLでキャッシュを検索
    // mode='navigate'はRequestコンストラクタで使えないため除外
    const requestInit = {
      method: request.method,
      headers: request.headers,
      credentials: request.credentials
    }
    
    // navigateモード以外の場合のみmodeを設定
    if (request.mode !== 'navigate') {
      requestInit.mode = request.mode
    }
    
    cacheKey = new Request(url.origin + url.pathname, requestInit)
  }
  
  const cached = await cache.match(cacheKey)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    // 成功したらキャッシュに保存（Runtime Cache）
    if (response.ok) {
      await addToRuntimeCache(cacheKey, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Fetch failed:', error)
    throw error
  }
}

// Network First戦略: ネットワーク優先、キャッシュフォールバック
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    // 成功したらキャッシュに保存
    if (response.ok) {
      await addToRuntimeCache(request, response.clone())
    }
    return response
  } catch (error) {
    // ネットワークエラー時はキャッシュから返す
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    throw error
  }
}

// Cache First戦略を使うべきか判定
function shouldCacheFirst(url) {
  const path = url.pathname
  // setting.htmlは除外（常に最新版を取得）
  if (path.endsWith('setting.html')) {
    return false
  }
  // HTML, CSS, JS, 画像ファイル
  return path.endsWith('.html') || 
         path.endsWith('.css') || 
         path.endsWith('.js') || 
         path.endsWith('.png') || 
         path.endsWith('.jpg') || 
         path.endsWith('.svg') ||
         path.endsWith('.webp') ||
         path === '/' ||
         path === './index.html'
}

// Network First戦略を使うべきか判定
function shouldNetworkFirst(url) {
  const path = url.pathname
  // setting.htmlは常に最新版を取得
  if (path.endsWith('setting.html')) {
    return true
  }
  // manifest.jsonは最新版を取得（それ以外のデータは除外）
  if (path.endsWith('manifest.json')) {
    return true
  }
  return false
}

// キャッシュをスキップすべきか判定（データファイルなど）
function shouldSkipCache(url) {
  const path = url.pathname
  // /data/以下のファイルはキャッシュしない（DBデータ）
  if (path.includes('/data/')) {
    return true
  }
  // その他の大きなデータファイルもキャッシュしない
  return false
}

// Runtime Cacheのサイズを制限（古いものから削除）
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  if (keys.length > maxSize) {
    // 古いものから削除（先頭から削除）
    const itemsToDelete = keys.length - maxSize
    for (let i = 0; i < itemsToDelete; i++) {
      await cache.delete(keys[i])
    }
    console.log(`[SW] Cleaned ${itemsToDelete} items from ${cacheName}`)
  }
}

// Runtime Cacheに安全に追加
async function addToRuntimeCache(request, response) {
  const cache = await caches.open(RUNTIME_CACHE)
  await cache.put(request, response)
  await limitCacheSize(RUNTIME_CACHE, RUNTIME_CACHE_MAX_SIZE)
}

// SKIP_WAITINGメッセージを受け取ったら即座にアクティベート
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating immediately')
    self.skipWaiting()
  }
})
