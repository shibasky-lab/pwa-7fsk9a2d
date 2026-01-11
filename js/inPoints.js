import { openDB } from "./db.js";

const POINTS_URL = "./data/points.json";

export async function initPointsIfNeeded() {
  const db = await openDB();

  const count = await getPointCount(db);
  if (count > 0) {
    console.log("points already initialized:", count);
    return;
  }

  console.log("initializing points...");
  const points = await fetch(POINTS_URL).then(r => r.json());
  await bulkInsert(db, "points", points);
  console.log("points initialized:", points.length);
}

// ----------------------------

function getPointCount(db) {
  return new Promise(resolve => {
    const tx = db.transaction("points", "readonly");
    const store = tx.objectStore("points");
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
  });
}

function bulkInsert(db, storeName, records) {
  return new Promise(resolve => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    records.forEach(r => store.put(r));
    tx.oncomplete = resolve;
  });
}
