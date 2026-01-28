const CACHE_NAME = 'kijunten-v1';
const RUNTIME_CACHE = 'kijunten-runtime-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/detail.html',
  '/history.html',
  '/manifest.json',
  '/css/style.css',
  '/js/db.js',
  '/js/init.js',
  '/js/index.js',
  '/js/detail.js',
  '/js/history.js',
  '/data/points.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

// インストール時のキャッシング
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(error => {
        console.log('キャッシング中にエラーが発生しました:', error);
      });
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ネットワークファースト戦略（API、画像など動的なコンテンツ）
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // ローカルファイルはキャッシュファースト
  if (url.origin === location.origin && !url.pathname.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
          // 成功したレスポンスをキャッシュに追加
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      }).catch(() => {
        // オフラインの場合のフォールバック
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('オフラインです', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain; charset=UTF-8'
          })
        });
      })
    );
  } else {
    // 外部リソース（CDNなど）はネットワークファースト
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 成功したレスポンスをキャッシュ
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // ネットワーク失敗時はキャッシュにフォールバック
          return caches.match(event.request);
        })
    );
  }
});

// バックグラウンド同期（今後実装予定）
self.addEventListener('sync', event => {
  if (event.tag === 'sync-visits') {
    event.waitUntil(
      syncVisits()
    );
  }
});

// プッシュ通知（今後実装予定）
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232196F3" width="192" height="192"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="80" fill="white" font-weight="bold">基</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232196F3" width="192" height="192"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="80" fill="white" font-weight="bold">基</text></svg>',
      tag: 'kijunten-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification('基準点探索', options)
    );
  }
});

// バックグラウンド同期の実装
function syncVisits() {
  // 今後実装
  return Promise.resolve();
}
