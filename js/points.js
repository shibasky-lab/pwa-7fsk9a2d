// js/points.js

/**
 * 基準点を追加（上書きあり）
 */
async function addPoint(point) {
  const database = await openDB();
  const store = getStore('points', 'readwrite');

  return new Promise((resolve, reject) => {
    const req = store.put(point);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * 基準点を1件取得
 */
async function getPoint(code) {
  const database = await openDB();
  const store = getStore('points');

  return new Promise((resolve, reject) => {
    const req = store.get(code);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 基準点を全件取得
 */
async function getAllPoints() {
  const database = await openDB();
  const store = getStore('points');

  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 点種別で絞り込み
 */
async function getPointsByType(type) {
  const database = await openDB();
  const store = getStore('points');
  const index = store.index('type');

  return new Promise((resolve, reject) => {
    const req = index.getAll(type);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 都道府県で絞り込み
 */
async function getPointsByPref(pref) {
  const database = await openDB();
  const store = getStore('points');
  const index = store.index('prefecture');

  return new Promise((resolve, reject) => {
    const req = index.getAll(pref);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
