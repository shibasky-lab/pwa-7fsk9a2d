if (!window.__DB_INITIALIZED__) {
  window.__DB_INITIALIZED__ = true;

  const DB_NAME = "benchmark_db";
  const DB_VERSION = 1;

  // openDB() 定義など…
}


// ===== DB 定数（グローバル） =====
const DB_NAME = "benchmark_db";
const DB_VERSION = 1;

// ===== DBオープン =====
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = e => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains("points")) {
        const store = db.createObjectStore("points", {
          keyPath: "point_code"
        });
        store.createIndex("point_name", "point_name", { unique: false });
        store.createIndex("prefecture", "prefecture", { unique: false });
        store.createIndex("point_type", "point_type", { unique: false });
      }

      if (!db.objectStoreNames.contains("visits")) {
        db.createObjectStore("visits", {
          keyPath: "point_code"
        });
      }

      if (!db.objectStoreNames.contains("photos")) {
        db.createObjectStore("photos", {
          keyPath: ["point_code", "kind"]
        });
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


