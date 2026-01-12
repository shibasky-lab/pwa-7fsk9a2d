export const DB_NAME = 'benchmark-pwa';
export const DB_VERSION = 3;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains('points')) {
        db.createObjectStore('points', { keyPath: 'pointCode' });
      }

      if (!db.objectStoreNames.contains('visits')) {
        db.createObjectStore('visits', { keyPath: 'pointCode' });
      }

      if (!db.objectStoreNames.contains('photos')) {
        const store = db.createObjectStore('photos', {
          keyPath: 'id',
          autoIncrement: true
        });
        // ★ 必須インデックス
        store.createIndex(
          'pointType',
          ['pointCode', 'type'],
          { unique: true }
        );
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}


