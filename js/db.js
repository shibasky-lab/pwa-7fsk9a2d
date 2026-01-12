req.onupgradeneeded = e => {
  const db = e.target.result;

  if (!db.objectStoreNames.contains('points')) {
    db.createObjectStore('points', { keyPath: 'pointCode' });
  }

  if (!db.objectStoreNames.contains('visits')) {
    db.createObjectStore('visits', { keyPath: 'pointCode' });
  }

  if (!db.objectStoreNames.contains('photos')) {
    db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
  }

  if (!db.objectStoreNames.contains('meta')) {
    db.createObjectStore('meta', { keyPath: 'key' });
  }
};

