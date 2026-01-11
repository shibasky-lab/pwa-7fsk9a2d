// ================================
// IndexedDB 設定（最終確定版）
// ================================

const DB_NAME = "benchmark-pwa-db";
const DB_VERSION = 1;

// ================================
// DBオープン
// ================================
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // ----------------------------
      // points（基準点マスタ）
      // ----------------------------
      if (!db.objectStoreNames.contains("points")) {
        const store = db.createObjectStore("points", {
          keyPath: "pointCode" // 基準点コード
        });

        store.createIndex("pointName", "pointName", { unique: false });
        store.createIndex("pointType", "pointType", { unique: false });
        store.createIndex("prefecture", "prefecture", { unique: false });
        store.createIndex("lat", "lat", { unique: false });
        store.createIndex("lon", "lon", { unique: false });
      }

      // ----------------------------
      // visits（探索履歴：1点1件）
      // ----------------------------
      if (!db.objectStoreNames.contains("visits")) {
        const store = db.createObjectStore("visits", {
          keyPath: "pointCode"
        });

        store.createIndex("visitDate", "visitDate", { unique: false });
        store.createIndex("found", "found", { unique: false });
      }

      // ----------------------------
      // photos（近景・遠景）
      // ----------------------------
      if (!db.objectStoreNames.contains("photos")) {
        db.createObjectStore("photos", {
          keyPath: "pointCode"
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ================================
// 共通ヘルパ
// ================================
export async function withStore(storeName, mode, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    const result = callback(store);

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}
