export const DB_NAME = 'benchmark-pwa';
export const DB_VERSION = 1;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;

      db.createObjectStore('points', { keyPath: 'pointCode' });
      db.createObjectStore('visits', { keyPath: 'pointCode' });
      db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('meta', { keyPath: 'key' });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
