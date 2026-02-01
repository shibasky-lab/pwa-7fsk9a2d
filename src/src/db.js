/**
 * IndexedDB管理モジュール
 * 基準点データ、訪問履歴、写真、メタデータを管理
 */

const DB_NAME = 'KijuntenPWA'
const DB_VERSION = 2

// ObjectStore定義
const STORES = {
  BASES: 'bases',           // 基準点情報（points.json）
  CODES: 'codes',           // 基準点コード一覧（p_code_list.json）
  VISITS: 'visits',         // 訪問履歴
  PHOTOS: 'photos',         // 写真データ
  METADATA: 'metadata',     // メタデータ（rank_id, quality_id等の対応表）
  SYNC_STATUS: 'syncStatus' // 同期ステータス
}

class KijuntenDB {
  constructor() {
    this.db = null
  }

  /**
   * DBを初期化
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (e) => {
        const db = e.target.result

        // 基準点情報テーブル
        if (!db.objectStoreNames.contains(STORES.BASES)) {
          const baseStore = db.createObjectStore(STORES.BASES, { keyPath: 'id' })
          baseStore.createIndex('rank_id', 'rank_id', { unique: false })
          baseStore.createIndex('pref_id', 'pref_id', { unique: false })
          baseStore.createIndex('name', 'name', { unique: false })
          baseStore.createIndex('name_kana', 'name_kana', { unique: false })
          baseStore.createIndex('fig20_name', 'fig20_name', { unique: false })
          baseStore.createIndex('fig5_name', 'fig5_name', { unique: false })
        }

        // 基準点コード一覧テーブル
        if (!db.objectStoreNames.contains(STORES.CODES)) {
          const codeStore = db.createObjectStore(STORES.CODES, { keyPath: 'id' })
          codeStore.createIndex('prefecture_name', 'prefecture_name', { unique: false })
          codeStore.createIndex('rank_ids', 'rank_ids', { unique: false })
        }

        // 訪問履歴テーブル
        if (!db.objectStoreNames.contains(STORES.VISITS)) {
          const visitStore = db.createObjectStore(STORES.VISITS, { keyPath: 'id', autoIncrement: true })
          visitStore.createIndex('base_id', 'base_id', { unique: false })
          visitStore.createIndex('visit_date', 'visit_date', { unique: false })
          visitStore.createIndex('rank_id', 'rank_id', { unique: false })
        }

        // 写真テーブル
        if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
          const photoStore = db.createObjectStore(STORES.PHOTOS, { keyPath: 'id', autoIncrement: true })
          photoStore.createIndex('visit_id', 'visit_id', { unique: false })
          photoStore.createIndex('photo_type', 'photo_type', { unique: false })
        }

        // メタデータテーブル
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' })
        }

        // 同期ステータステーブル
        if (!db.objectStoreNames.contains(STORES.SYNC_STATUS)) {
          db.createObjectStore(STORES.SYNC_STATUS, { keyPath: 'key' })
        }
      }
    })
  }

  /**
   * トランザクション実行ヘルパー
   */
  _transaction(storeNames, mode = 'readonly') {
    return this.db.transaction(storeNames, mode)
  }

  // ===== 基準点情報操作 =====

  async addBase(baseData) {
    const tx = this._transaction([STORES.BASES], 'readwrite')
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.BASES).add(baseData)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async addBases(basesData) {
    const tx = this._transaction([STORES.BASES], 'readwrite')
    const store = tx.objectStore(STORES.BASES)
    
    return new Promise((resolve, reject) => {
      basesData.forEach(data => store.add(data))
      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  }

  async getBase(id) {
    const tx = this._transaction([STORES.BASES])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.BASES).get(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAllBases() {
    const tx = this._transaction([STORES.BASES])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.BASES).getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async searchBases(filters = {}) {
    const { rankIds = [], nameQuery = '', nameKanaQuery = '', prefId = '' } = filters
    const tx = this._transaction([STORES.BASES])
    const store = tx.objectStore(STORES.BASES)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        let results = request.result
        
        if (rankIds.length > 0) {
          results = results.filter(b => rankIds.includes(b.rank_id))
        }
        
        // 都道府県フィルタ
        if (prefId) {
          results = results.filter(b => b.pref_id === prefId)
        }
        
        // 点名検索：nameまたはname_kanaのどちらかにマッチすればOK（OR条件）
        if (nameQuery || nameKanaQuery) {
          results = results.filter(b => {
            const matchName = nameQuery && b.name && b.name.includes(nameQuery)
            const matchKana = nameKanaQuery && b.name_kana && b.name_kana.includes(nameKanaQuery)
            return matchName || matchKana
          })
        }
        
        resolve(results)
      }
    })
  }

  // ===== 基準点コード操作 =====

  async addCode(codeData) {
    const tx = this._transaction([STORES.CODES], 'readwrite')
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.CODES).add(codeData)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async addCodes(codesData) {
    const tx = this._transaction([STORES.CODES], 'readwrite')
    const store = tx.objectStore(STORES.CODES)
    
    return new Promise((resolve, reject) => {
      codesData.forEach(data => store.add(data))
      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  }

  async getAllCodes() {
    const tx = this._transaction([STORES.CODES])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.CODES).getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async clearCodes() {
    const tx = this._transaction([STORES.CODES], 'readwrite')
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.CODES).clear()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  // ===== 訪問履歴操作 =====

  async addVisit(visitData) {
    const tx = this._transaction([STORES.VISITS], 'readwrite')
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.VISITS).add(visitData)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getVisit(id) {
    const tx = this._transaction([STORES.VISITS])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.VISITS).get(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAllVisits() {
    const tx = this._transaction([STORES.VISITS])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.VISITS).getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
        resolve(results)
      }
    })
  }

  async getVisitsByRankId(rankId) {
    const tx = this._transaction([STORES.VISITS])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.VISITS).index('rank_id').getAll(rankId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results = request.result.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
        resolve(results)
      }
    })
  }

  // ===== 写真操作 =====

  async addPhoto(photoData) {
    const tx = this._transaction([STORES.PHOTOS], 'readwrite')
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.PHOTOS).add(photoData)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getPhotosByVisitId(visitId) {
    const tx = this._transaction([STORES.PHOTOS])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.PHOTOS).index('visit_id').getAll(visitId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  // ===== メタデータ操作 =====

  async setMetadata(key, value) {
    const tx = this._transaction([STORES.METADATA], 'readwrite')
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.METADATA).put({ key, value })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getMetadata(key) {
    const tx = this._transaction([STORES.METADATA])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.METADATA).get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result?.value)
    })
  }

  // ===== 同期ステータス操作 =====

  async setSyncStatus(key, status) {
    const tx = this._transaction([STORES.SYNC_STATUS], 'readwrite')
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.SYNC_STATUS).put({ key, ...status })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getSyncStatus(key) {
    const tx = this._transaction([STORES.SYNC_STATUS])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.SYNC_STATUS).get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  // ===== メタデータ操作 =====

  async setMetadata(key, data) {
    const tx = this._transaction([STORES.METADATA], 'readwrite')
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.METADATA).put({ key, data })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getMetadata(key) {
    const tx = this._transaction([STORES.METADATA])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.METADATA).get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result ? request.result.data : null)
    })
  }

  async getAllMetadata() {
    const tx = this._transaction([STORES.METADATA])
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORES.METADATA).getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = {}
        request.result.forEach(item => {
          result[item.key] = item.data
        })
        resolve(result)
      }
    })
  }

  // ===== ユーティリティ =====

  async clearAll() {
    const tx = this._transaction([
      STORES.BASES,
      STORES.CODES,
      STORES.VISITS,
      STORES.PHOTOS,
      STORES.METADATA,
      STORES.SYNC_STATUS
    ], 'readwrite')

    return new Promise((resolve, reject) => {
      Object.values(STORES).forEach(store => {
        tx.objectStore(store).clear()
      })
      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  }

  async getSize() {
    const bases = await this.getAllBases()
    const codes = await this.getAllCodes()
    const visits = await this.getAllVisits()
    
    return {
      bases: bases.length,
      codes: codes.length,
      visits: visits.length
    }
  }
}

export default KijuntenDB
