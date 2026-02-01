/**
 * メタデータ定義
 * _id系パラメータと_value系パラメータの対応表
 */

import KijuntenDB from './db.js'

const db = new KijuntenDB()
let dbInitialized = false

export const METADATA_DEFS = {
  // 基準点種別（rank_id）
  RANK_IDS: {
    key: 'rank_ids',
    data: {
      'EL0': '電子基準点',
      'TR1': '一等三角点',
      'TR2': '二等三角点',
      'TR3': '三等三角点',
      'TR4': '四等三角点',
      'EK0': '四等三角点'
    }
  },

  // 品質区分（quality_id）
  QUALITY_IDS: {
    key: 'quality_ids',
    data: {}
  },

  // 取付状態（attachment_id）
  ATTACHMENT_IDS: {
    key: 'attachment_ids',
    data: {}
  },

  // 成果の状態（result_status_id）
  RESULT_STATUS_IDS: {
    key: 'result_status_ids',
    data: {}
  },

  // 成果の区分（result_division_id）
  RESULT_DIVISION_IDS: {
    key: 'result_division_ids',
    data: {}
  },

  // 復旧状況（reconstruction_status_id）
  RECONSTRUCTION_STATUS_IDS: {
    key: 'reconstruction_status_ids',
    data: {}
  },

  // 属性の状態（attr_status_id）
  ATTR_STATUS_IDS: {
    key: 'attr_status_ids',
    data: {}
  },

  // 地目（land_type_id）
  LAND_TYPE_IDS: {
    key: 'land_type_ids',
    data: {}
  },

  // 都道府県コード順
  PREFECTURES: {
    key: 'prefectures',
    data: [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
      '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
      '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
      '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ]
  }
}

// マスタデータの読み込み状態を管理
let masterDataLoaded = false
let masterDataPromise = null

// JSONファイルからマスタデータを読み込んでIndexedDBに保存
async function loadMasterData() {
  if (masterDataLoaded) return
  if (masterDataPromise) return masterDataPromise

  masterDataPromise = (async () => {
    try {
      // DBを初期化
      if (!dbInitialized) {
        await db.init()
        dbInitialized = true
      }

      // マスタファイルの定義
      const masterFiles = [
        { key: 'quality_ids', file: '/data/quality_ids.json' },
        { key: 'attachment_ids', file: '/data/attachment_ids.json' },
        { key: 'result_status_ids', file: '/data/result_status_ids.json' },
        { key: 'result_division_ids', file: '/data/result_division_ids.json' },
        { key: 'reconstruction_status_ids', file: '/data/reconstruction_status_ids.json' },
        { key: 'attr_status_ids', file: '/data/attr_status_ids.json' },
        { key: 'land_type_ids', file: '/data/land_type_ids.json' }
      ]

      // IndexedDBからマスタデータを読み込み
      const cachedMetadata = await db.getAllMetadata()
      
      // 実際のマスタデータキーをチェック
      const hasValidData = masterFiles.some(({ key }) => cachedMetadata[key] && Object.keys(cachedMetadata[key]).length > 0)
      
      // キャッシュがあればそれを使用
      if (hasValidData) {
        console.log('[Metadata] Loading from IndexedDB', cachedMetadata)
        for (const def of Object.values(METADATA_DEFS)) {
          if (cachedMetadata[def.key]) {
            def.data = cachedMetadata[def.key]
            console.log(`[Metadata] Loaded ${def.key}:`, Object.keys(def.data).length, 'items')
          }
        }
        masterDataLoaded = true
        return
      }

      // キャッシュがない場合はJSONファイルから読み込み
      console.log('[Metadata] Loading from JSON files')

      for (const { key, file } of masterFiles) {
        try {
          const response = await fetch(file)
          const data = await response.json()
          
          console.log(`[Metadata] Loaded ${key} from JSON:`, Object.keys(data).length, 'items')
          
          // METADATA_DEFSに設定
          for (const def of Object.values(METADATA_DEFS)) {
            if (def.key === key) {
              def.data = data
              break
            }
          }

          // IndexedDBに保存
          await db.setMetadata(key, data)
        } catch (error) {
          console.error(`Failed to load ${file}:`, error)
        }
      }
      
      masterDataLoaded = true
    } catch (error) {
      console.error('Failed to load master data:', error)
      throw error
    }
  })()

  return masterDataPromise
}

// マスタデータの読み込みを待機する
export async function ensureMasterDataLoaded() {
  await loadMasterData()
}

/**
 * メタデータを取得
 * @param {string} key - メタデータキー
 * @returns {object} メタデータ値
 */
export function getMetadataValue(key) {
  for (const def of Object.values(METADATA_DEFS)) {
    if (def.key === key) {
      return def.data
    }
  }
  return null
}

/**
 * IDから日本語ラベルを取得
 * @param {string} metadataKey - メタデータキー（例：'rank_ids'）
 * @param {string} id - ID値
 * @returns {string} 日本語ラベル
 */
export function getLabel(metadataKey, id) {
  for (const def of Object.values(METADATA_DEFS)) {
    if (def.key === metadataKey) {
      if (def.data[id]) {
        return def.data[id]
      } else {
        console.warn(`[Metadata] No label found for ${metadataKey}:${id}`, 'Available keys:', Object.keys(def.data))
        return id
      }
    }
  }
  console.error(`[Metadata] No metadata definition for key: ${metadataKey}`)
  return id
}
