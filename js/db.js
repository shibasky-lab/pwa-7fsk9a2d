/**
 * IndexedDBを使用したデータベース管理
 */

class KijuntenDB {
  constructor() {
    this.db = null;
    this.dbName = 'KijuntenPointsDB';
    this.version = 1;
  }

  /**
   * データベースの初期化
   */
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB初期化完了');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 基準点データストア
        if (!db.objectStoreNames.contains('points')) {
          const pointStore = db.createObjectStore('points', { keyPath: 'id' });
          pointStore.createIndex('name', 'name', { unique: false });
          pointStore.createIndex('type', 'type', { unique: false });
          pointStore.createIndex('prefecture', 'prefecture', { unique: false });
          pointStore.createIndex('hiragana', 'hiragana', { unique: false });
        }

        // 訪問履歴ストア
        if (!db.objectStoreNames.contains('visits')) {
          const visitStore = db.createObjectStore('visits', { keyPath: 'id', autoIncrement: true });
          visitStore.createIndex('pointId', 'pointId', { unique: false });
          visitStore.createIndex('visitDate', 'visitDate', { unique: false });
          visitStore.createIndex('type', 'type', { unique: false });
        }

        // 写真ストア
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
          photoStore.createIndex('visitId', 'visitId', { unique: false });
          photoStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * すべての基準点データを取得
   */
  getAllPoints() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['points'], 'readonly');
      const store = transaction.objectStore('points');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 基準点データを追加/更新
   */
  addOrUpdatePoints(points) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['points'], 'readwrite');
      const store = transaction.objectStore('points');

      points.forEach(point => {
        store.put(point);
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  /**
   * 基準点を検索
   */
  searchPoints(keyword = '', type = '', prefecture = '') {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['points'], 'readonly');
      const store = transaction.objectStore('points');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result;

        // キーワード検索（漢字またはひらがな）
        if (keyword) {
          const lowerKeyword = keyword.toLowerCase();
          results = results.filter(point => 
            point.name.toLowerCase().includes(lowerKeyword) ||
            point.hiragana.includes(lowerKeyword)
          );
        }

        // 基準点種別でフィルター
        if (type) {
          results = results.filter(point => point.type === type);
        }

        // 都道府県でフィルター
        if (prefecture) {
          results = results.filter(point => point.prefecture === prefecture);
        }

        resolve(results);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 特定のIDで基準点を取得
   */
  getPointById(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['points'], 'readonly');
      const store = transaction.objectStore('points');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 訪問履歴を追加
   */
  addVisit(visit) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['visits'], 'readwrite');
      const store = transaction.objectStore('visits');
      const request = store.add(visit);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * すべての訪問履歴を取得
   */
  getAllVisits() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['visits'], 'readonly');
      const store = transaction.objectStore('visits');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * ポイントIDで訪問履歴を取得
   */
  getVisitsByPointId(pointId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['visits'], 'readonly');
      const store = transaction.objectStore('visits');
      const index = store.index('pointId');
      const request = index.getAll(pointId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 訪問履歴を検索
   */
  searchVisits(keyword = '', type = '', sort = 'date') {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['visits', 'points'], 'readonly');
      const visitStore = transaction.objectStore('visits');
      const pointStore = transaction.objectStore('points');
      const visitRequest = visitStore.getAll();

      visitRequest.onsuccess = () => {
        let visits = visitRequest.result;

        // キーワード検索
        if (keyword) {
          const pointIds = [];
          const pointSearchRequest = pointStore.getAll();

          pointSearchRequest.onsuccess = () => {
            const points = pointSearchRequest.result;
            const matchingPoints = points.filter(p => 
              p.name.toLowerCase().includes(keyword.toLowerCase()) ||
              p.hiragana.includes(keyword)
            );
            
            const matchingPointIds = matchingPoints.map(p => p.id);
            visits = visits.filter(v => matchingPointIds.includes(v.pointId));

            // フィルターとソート
            if (type) {
              visits = visits.filter(v => v.type === type);
            }

            visits.sort((a, b) => {
              switch(sort) {
                case 'date':
                  return new Date(b.visitDate) - new Date(a.visitDate);
                case 'date-old':
                  return new Date(a.visitDate) - new Date(b.visitDate);
                default:
                  return 0;
              }
            });

            resolve(visits);
          };
        } else {
          if (type) {
            visits = visits.filter(v => v.type === type);
          }

          visits.sort((a, b) => {
            switch(sort) {
              case 'date':
                return new Date(b.visitDate) - new Date(a.visitDate);
              case 'date-old':
                return new Date(a.visitDate) - new Date(b.visitDate);
              default:
                return 0;
            }
          });

          resolve(visits);
        }
      };

      visitRequest.onerror = () => {
        reject(visitRequest.error);
      };
    });
  }

  /**
   * 写真を追加
   */
  addPhoto(photo) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['photos'], 'readwrite');
      const store = transaction.objectStore('photos');
      const request = store.add(photo);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 訪問IDで写真を取得
   */
  getPhotosByVisitId(visitId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const index = store.index('visitId');
      const request = index.getAll(visitId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 訪問履歴をクリア
   */
  clearVisits() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['visits', 'photos'], 'readwrite');
      const visitStore = transaction.objectStore('visits');
      const photoStore = transaction.objectStore('photos');
      
      visitStore.clear();
      photoStore.clear();

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  /**
   * すべてのデータをクリア
   */
  clearAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['points', 'visits', 'photos'], 'readwrite');
      
      transaction.objectStore('points').clear();
      transaction.objectStore('visits').clear();
      transaction.objectStore('photos').clear();

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }
}

// グローバルインスタンス
const kijuntenDB = new KijuntenDB();
