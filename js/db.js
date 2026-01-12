export const DB_NAME = 'benchmark-pwa';
export const DB_VERSION = 1;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;

      // points
      if (!db.objectStoreNames.contains('points')) {
        db.createObjectStore('points', { keyPath: 'pointCode' });
      }

      // visits（1点1履歴）
      if (!db.objectStoreNames.contains('visits')) {
        const store = db.createObjectStore('visits', { keyPath: 'pointCode' });
        store.createIndex('found', 'found', { unique: false });
        store.createIndex('visitDate', 'visitDate', { unique: false });
      }

      // photos
      if (!db.objectStoreNames.contains('photos')) {
        const store = db.createObjectStore('photos', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('pointCode', 'pointCode', { unique: false });
        store.createIndex('type', 'type', { unique: false }); // near / far
      }

      // meta（初期化済みフラグ・バージョン管理用）
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}


