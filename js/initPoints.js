import { openDB } from "./db.js";

const POINTS_JSON_URL = "./data/points.json";

export async function initPointsIfNeeded() {
  const db = await openDB();

  const count = await db
    .transaction("points")
    .objectStore("points")
    .count();

  // meta 取得
  const meta = await fetchMeta();

  if (count === meta.total) {
    return; // 正常、何もしない
  }

  await loadPoints(meta);
}

async function fetchMeta() {
  const res = await fetch(POINTS_JSON_URL);
  const json = await res.json();
  return json.meta;
}

async function loadPoints(meta) {
  showLoading(`基準点データを読み込んでいます…`);

  const res = await fetch(POINTS_JSON_URL);
  const json = await res.json();
  const points = json.points;

  const db = await openDB();
  const tx = db.transaction("points", "readwrite");
  const store = tx.objectStore("points");

  // 既存削除（pointsのみ）
  store.clear();

  let loaded = 0;
  for (const p of points) {
    store.add(p);
    loaded++;

    if (loaded % 1000 === 0) {
      showLoading(
        `基準点データを読み込んでいます…<br>
        ${loaded} / ${meta.total} 件`
      );
      await sleep(0);
    }
  }

  await tx.done;
  hideLoading();
}

function showLoading(text) {
  const overlay = document.getElementById("loadingOverlay");
  const label = document.getElementById("loadingText");
  label.innerHTML = text;
  overlay.style.display = "flex";
}

function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
