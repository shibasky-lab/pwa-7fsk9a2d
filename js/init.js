import { openDB } from './db.js';

export async function initPoints(onProgress) {
  const db = await openDB();

  const metaTx = db.transaction('meta', 'readonly');
  const metaStore = metaTx.objectStore('meta');
  const existsReq = metaStore.get('pointsLoaded');

  return new Promise((resolve) => {
    existsReq.onsuccess = async () => {
      if (existsReq.result?.value) {
        resolve(false);
        return;
      }

      const res = await fetch('./data/points.json');
      const points = await res.json();

      const tx = db.transaction(['points', 'meta'], 'readwrite');
      const store = tx.objectStore('points');

      let i = 0;
      for (const p of points) {
        store.put(p);
        i++;
        if (i % 500 === 0) {
          onProgress(Math.floor(i / points.length * 100));
        }
      }

      tx.objectStore('meta').put({
        key: 'pointsLoaded',
        value: true
      });

      tx.oncomplete = () => resolve(true);
    };
  });
}
