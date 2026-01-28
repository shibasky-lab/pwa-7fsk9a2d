# 基準点探索 PWA - 開発ガイド

## プロジェクト概要

基準点探索PWAは、全国の測量基準点を検索・探索するPWAアプリケーションです。

### 主な機能

- **基準点検索**: 点名またはひらがなで基準点を検索
- **詳細表示**: leafletで地理院地図を表示
- **測設モード**: GPSで現在地から基準点への方向・距離を表示
- **訪問履歴**: 探索した基準点の履歴を管理
- **写真管理**: 近景・遠景2枚の写真を記録
- **データ統計**: 探索統計を表示
- **オフライン対応**: Service Workerによるキャッシング

## ファイル構成

```
pwa-7fsk9a2d-main/
├── index.html              # メインページ（検索）
├── detail.html             # 詳細ページ
├── history.html            # 訪問履歴ページ
├── data.html               # 統計ページ
├── setting.html            # 設定ページ
├── manifest.json           # PWAマニフェスト
├── sw.js                   # Service Worker
├── robots.txt              # ロボット用設定
├── css/
│   └── style.css          # グローバルスタイル
├── js/
│   ├── db.js              # IndexedDB管理
│   ├── init.js            # アプリ初期化
│   ├── index.js           # 検索ページ
│   ├── detail.js          # 詳細ページ
│   ├── history.js         # 履歴ページ
│   ├── data.js            # 統計ページ
│   └── setting.js         # 設定ページ
└── data/
    └── points.json        # 基準点データベース
```

## points.json スキーマ

```json
{
  "id": "TSN001",                    // ユニークID
  "name": "東京一等三角点",         // 点名
  "hiragana": "とうきょういっとう", // ひらがな読み
  "type": "三角点",                 // 基準点種別
  "typeHiragana": "さんかくてん",  // 種別のひらがな
  "prefecture": "東京都",           // 都道府県
  "city": "千代田区",               // 市区町村
  "latitude": 35.6812,              // 緯度
  "longitude": 139.7671,            // 経度
  "elevation": 6.2,                 // 標高
  "description": "説明文",          // 詳細説明
  "accuracy": "一等三角点",         // 精度分類
  "markType": "金属標",             // 標識種別
  "installDate": "1889",            // 設置年
  "remarks": "備考",                // 備考
  "nearbyLandmark": "皇居",         // 近隣ランドマーク
  "photoUrl": null,                 // 写真URL
  "visited": false,                 // 訪問済みフラグ
  "lastVisitDate": null,            // 最終訪問日
  "visitCount": 0,                  // 訪問回数
  "notes": ""                       // メモ
}
```

## データベース構造（IndexedDB）

### points ストア
- 基準点のマスターデータ
- キー: id
- インデックス: name, type, prefecture, hiragana

### visits ストア
- 訪問履歴
- キー: id (autoIncrement)
- インデックス: pointId, visitDate, type

### photos ストア
- 撮影写真
- キー: id (autoIncrement)
- インデックス: visitId, type

## APIリファレンス

### db.js - KijuntenDB クラス

```javascript
// 初期化
await kijuntenDB.init();

// 基準点検索
const results = await kijuntenDB.searchPoints(keyword, type, prefecture);

// 基準点を取得
const point = await kijuntenDB.getPointById(id);

// 訪問履歴を追加
const visitId = await kijuntenDB.addVisit(visit);

// 訪問履歴を取得
const visits = await kijuntenDB.getAllVisits();

// 写真を追加
await kijuntenDB.addPhoto(photo);
```

### ユーティリティ関数 (init.js)

```javascript
// 距離計算（Haversine公式）
const distance = calculateDistance(lat1, lon1, lat2, lon2); // メートル

// 方位角を計算
const bearing = calculateBearing(lat1, lon1, lat2, lon2); // 0-360度

// 方位角から16方位を取得
const direction = getBearingDirection(bearing); // "N", "NE" など

// 画像をリサイズ
const blob = await resizeImage(file, width, height);
```

## 開発のポイント

### Service Worker キャッシング戦略
- **キャッシュファースト**: ローカルファイル（HTML, CSS, JS）
- **ネットワークファースト**: 外部リソース（CDN, API）

### IndexedDB 利用
- オフライン時も訪問履歴・写真を保存
- 検索インデックスで高速な検索が可能

### 測設モード
- Geolocation API で継続的に位置情報を取得
- 方位角・距離をリアルタイムで計算・表示
- 5m以内で音声アラート

### 写真処理
- Canvas API で画像をリサイズ・トリミング
- Base64 エンコーディングで IndexedDB に保存
- 3:4 の比率で 360x480 にリサイズ

## 今後の開発予定

- [ ] ZIP バックアップ機能
- [ ] 点情報の定期更新機能
- [ ] プッシュ通知対応
- [ ] バックグラウンド同期
- [ ] より詳細な統計表示
- [ ] 地図上での複数点表示
- [ ] ルート検索機能
- [ ] 多言語対応

## デバッグ

```javascript
// IndexedDB を確認
const points = await kijuntenDB.getAllPoints();
console.log(points);

// Service Worker の状態を確認
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log(registrations);
});
```

## ライセンス

MIT License

## 参考資料

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Leaflet Documentation](https://leafletjs.com/)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
