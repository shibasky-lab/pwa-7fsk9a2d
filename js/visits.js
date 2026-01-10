// js/visits.js

/**
 * 探索履歴を登録（1点1回）
 * すでにある場合は上書き
 * 
 * @param {Object} visit
 * visit = {
 *   code: "基準点コード",
 *   date: "2026-01-10",
 *   found: true/false,
 *   memo: "任意"
 * }
 */
async function addVisit(visit) {
  const database = await openDB();
  const store = getStore('visits', 'readwrite');

  return new Promise((resolve, reject) => {
    const req = store.put(visit); // 上書きあり
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * 探索履歴を1件取得
 * @param {string} code - 基準点コード
 */
async function getVisit(code) {
  const database = await openDB();
  const store = getStore('visits');

  return new Promise((resolve, reject) => {
    const req = store.get(code);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 全件取得
 */
async function getAllVisits() {
  const database = await openDB();
  const store = getStore('visits');

  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 発見済み／未発見で絞り込み
 * @param {boolean} found
 */
async function getVisitsByFound(found) {
  const database = await openDB();
  const store = getStore('visits');

  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const filtered = req.result.filter(v => v.found === found);
      resolve(filtered);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * 探索履歴削除
 * @param {string} code - 基準点コード
 */
async function deleteVisit(code) {
  const database = await openDB();
  const store = getStore('visits', 'readwrite');

  return new Promise((resolve, reject) => {
    const req = store.delete(code);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
