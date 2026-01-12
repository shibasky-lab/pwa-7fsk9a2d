import { openDB, withStore } from "./db.js";

const VERSION_URL = "./data/version.json";
const POINTS_URL = "./data/points.json";

export async function bootstrap() {
  const versionInfo = await fetch(VERSION_URL).then(r => r.json());

  const stored = await getStoredVersion();

  if (!stored || stored.version !== versionInfo.pointsVersion) {
    await updatePoints(versionInfo);
  }
}

// ================================
// version取得
// ================================
async function getStoredVersion() {
  return withStore("meta", "readonly", store => store.get("points_version"));
}

// ================================
// 更新処理
// ================================
async function updatePoints(versionInfo) {
  const points = await fetch(POINTS_URL).then(r => r.json());

  const db = await openDB();

  await Promise.all([
    clearStore(db, "points"),
    clearStore(db, "meta")
  ]);

  await bulkInsert(db, "points", points);

  await withStore("meta", "readwrite", store =>
    store.put({
      key: "points_version",
      version: versionInfo.pointsVersion,
      count: versionInfo.count
    })
  );
}

// ================================
// ヘルパ
// ================================
function clearStore(db, name) {
  return new Promise(res => {
    const tx = db.transaction(name, "readwrite");
    tx.objectStore(name).clear();
    tx.oncomplete = res;
  });
}

function bulkInsert(db, name, records) {
  return new Promise(res => {
    const tx = db.transaction(name, "readwrite");
    const store = tx.objectStore(name);
    records.forEach(r => store.put(r));
    tx.oncomplete = res;
  });
}
