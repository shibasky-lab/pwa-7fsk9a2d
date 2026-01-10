// js/db.js

const DB_NAME = 'benchmarkDB';
const DB_VERSION = 1;

let db = null;

/**
 * DBオープン
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // === 基準点マスタ ===
      if (!database.objectStoreNames.contains('points')) {
        const store = database.createObjectStore('points', {
          keyPath: 'code'
        });

        store.createIndex('type', 'type', { unique: false });
        store.createIndex('pref', 'pref', { unique: false });
        store.createIndex('city', 'city', { unique: false });
      }

      // === 探索履歴（1点1回） ===
      if (!database.objectStoreNames.contains('visits')) {
        database.createObjectStore('visits', {
          keyPath: 'code'
        });
      }

      // === 写真 ===
      if (!database.objectStoreNames.contains('photos')) {
        const store = database.createObjectStore('photos', {
          keyPath: 'id',
          autoIncrement: true
        });

        store.createIndex('code', 'code', { unique: false });
        store.createIndex('kind', 'kind', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * ObjectStore取得
 */
function getStore(storeName, mode = 'readonly') {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}
