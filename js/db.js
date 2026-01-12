export const DB_NAME = 'benchmark-pwa';
export const DB_VERSION = 2;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;

      // 基準点マスタ
      if (!db.objectStoreNames.contains('points')) {
        db.createObjectStore('points', {
          keyPath: 'pointCode'
        });
      }

      // 探索履歴（1点 = 1レコード）
      if (!db.objectStoreNames.contains('visits')) {
        db.createObjectStore('visits', {
          keyPath: 'pointCode'
        });
      }

      // 写真（近景・遠景を複数持てる）
      if (!db.objectStoreNames.contains('photos')) {
        const store = db.createObjectStore('photos', {
          keyPath: 'id',
          autoIncrement: true
        });

        // 検索用インデックス
        store.createIndex('pointCode', 'pointCode', { unique: false });
        store.createIndex('type', 'type', { unique: false }); // 'near' | 'far'
      }

      // 初期化・メタ情報
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', {
          keyPath: 'key'
        });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
