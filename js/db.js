// js/db.js

const DB_NAME = "benchmarkDB";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // ===== points =====
      if (!db.objectStoreNames.contains("points")) {
        const store = db.createObjectStore("points", {
          keyPath: "code" // 基準点コード
        });

        store.createIndex("name", "name", { unique: false });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("prefecture", "prefecture", { unique: false });
      }

      // ===== visits =====
      if (!db.objectStoreNames.contains("visits")) {
        const store = db.createObjectStore("visits", {
          keyPath: "code" // 1点1履歴
        });

        store.createIndex("date", "date", { unique: false });
        store.createIndex("found", "found", { unique: false });
      }

      // ===== photos =====
      if (!db.objectStoreNames.contains("photos")) {
        const store = db.createObjectStore("photos", {
          keyPath: "id",
          autoIncrement: true
        });

        store.createIndex("code", "code", { unique: false });
        store.createIndex("type", "type", { unique: false }); // c / f
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getStore(name, mode = "readonly") {
  const db = indexedDB.open(DB_NAME);
  const tx = db.result.transaction(name, mode);
  return tx.objectStore(name);
}
