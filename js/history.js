/**
 * 訪問履歴ページのJavaScript
 */

let historyMap;
let allVisits = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadHistoryPage();
  } catch (error) {
    console.error('初期化エラー:', error);
  }
});

/**
 * 訪問履歴ページを読み込み
 */
async function loadHistoryPage() {
  try {
    // すべての訪問履歴を取得
    allVisits = await kijuntenDB.getAllVisits();

    // フィルターボタンのイベントリスナーを設定
    document.getElementById('history-filter-btn').addEventListener('click', filterHistory);
    document.getElementById('history-sort').addEventListener('change', filterHistory);
    document.getElementById('history-type-filter').addEventListener('change', filterHistory);
    document.getElementById('history-search').addEventListener('keyup', filterHistory);

    // 初期表示
    displayHistory(allVisits);
  } catch (error) {
    console.error('履歴読み込みエラー:', error);
  }
}

/**
 * 訪問履歴を表示
 */
async function displayHistory(visits) {
  const historyList = document.getElementById('history-list');
  
  if (visits.length === 0) {
    historyList.innerHTML = `
      <li class="history-item" style="border: none; cursor: default;">
        <div class="text-center text-muted p-16">
          訪問履歴がありません
        </div>
      </li>
    `;
    return;
  }

  let html = '';

  for (const visit of visits) {
    const point = await kijuntenDB.getPointById(visit.pointId);
    if (!point) continue;

    const dateStr = new Date(visit.visitDate).toLocaleDateString('ja-JP');
    const weatherIcon = getWeatherIcon(visit.weather);

    html += `
      <li class="history-item" onclick="showHistoryDetail('${visit.id}', '${visit.pointId}')">
        <div class="history-item-title">${point.name}</div>
        <div class="history-item-meta">
          <div class="history-item-meta-item">${point.type}</div>
          <div class="history-item-meta-item">${dateStr}</div>
        </div>
        <div class="history-item-meta">
          <div class="history-item-meta-item">${point.prefecture}${point.city}</div>
          <div class="history-item-meta-item">${weatherIcon}</div>
        </div>
        ${visit.notes ? `<div class="history-item-notes">${visit.notes}</div>` : ''}
      </li>
    `;
  }

  historyList.innerHTML = html;
}

/**
 * 天気アイコンを取得
 */
function getWeatherIcon(weather) {
  const weatherMap = {
    '晴れ': '☀️',
    '曇り': '☁️',
    '雨': '🌧️',
    '雪': '❄️',
    'その他': '🌤️'
  };
  return weatherMap[weather] || '';
}

/**
 * 訪問履歴の詳細を表示
 */
async function showHistoryDetail(visitId, pointId) {
  try {
    const point = await kijuntenDB.getPointById(pointId);
    const visit = allVisits.find(v => v.id == visitId);
    const photos = await kijuntenDB.getPhotosByVisitId(visitId);

    // 詳細情報を表示
    document.getElementById('history-detail').classList.add('active');
    document.getElementById('history-list-container').style.display = 'none';

    // 基本情報
    document.getElementById('detail-point-name').textContent = point.name;
    document.getElementById('detail-point-type').textContent = point.type;
    document.getElementById('detail-point-prefecture').textContent = point.prefecture;
    document.getElementById('detail-point-city').textContent = point.city;
    document.getElementById('detail-point-elevation').textContent = point.elevation + 'm';

    // 訪問情報
    document.getElementById('detail-visit-date').textContent = new Date(visit.visitDate).toLocaleDateString('ja-JP');
    document.getElementById('detail-visit-weather').textContent = visit.weather || '記録なし';
    document.getElementById('detail-visit-notes').textContent = visit.notes || 'メモなし';

    // 地図を初期化
    if (!historyMap) {
      historyMap = L.map('map').setView([point.latitude, point.longitude], 15);
      L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }
      ).addTo(historyMap);
    } else {
      historyMap.setView([point.latitude, point.longitude], 15);
      historyMap.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          historyMap.removeLayer(layer);
        }
      });
    }

    // マーカーを追加
    L.marker([point.latitude, point.longitude], {
      title: point.name,
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(historyMap);

    historyMap.invalidateSize();

    // 写真を表示
    const photosGrid = document.getElementById('detail-photos-grid');
    if (photos.length === 0) {
      document.getElementById('photos-card').style.display = 'none';
    } else {
      document.getElementById('photos-card').style.display = 'block';
      photosGrid.innerHTML = '';

      photos.forEach(photo => {
        const photoHtml = `
          <div>
            <img src="${photo.data}" class="photo-item" alt="${photo.type}">
            <div class="photo-label">${photo.type === 'nearby' ? '近景' : '遠景'}</div>
          </div>
        `;
        photosGrid.innerHTML += photoHtml;
      });
    }

    // ページをスクロール
    window.scrollTo(0, 0);
  } catch (error) {
    console.error('詳細表示エラー:', error);
  }
}

/**
 * 訪問履歴詳細を閉じる
 */
function closeHistoryDetail() {
  document.getElementById('history-detail').classList.remove('active');
  document.getElementById('history-list-container').style.display = 'block';
  window.scrollTo(0, 0);
}

/**
 * 訪問履歴をフィルター
 */
async function filterHistory() {
  const keyword = document.getElementById('history-search').value;
  const type = document.getElementById('history-type-filter').value;
  const sort = document.getElementById('history-sort').value;

  try {
    let filteredVisits = allVisits;

    // キーワード検索
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      const matchingPoints = [];
      
      for (const visit of filteredVisits) {
        const point = await kijuntenDB.getPointById(visit.pointId);
        if (point.name.toLowerCase().includes(lowerKeyword) ||
            point.hiragana.includes(lowerKeyword)) {
          matchingPoints.push(visit.pointId);
        }
      }

      filteredVisits = filteredVisits.filter(v => matchingPoints.includes(v.pointId));
    }

    // 種別でフィルター
    if (type) {
      filteredVisits = filteredVisits.filter(v => v.type === type);
    }

    // ソート
    switch(sort) {
      case 'date':
        filteredVisits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
        break;
      case 'date-old':
        filteredVisits.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
        break;
      case 'type':
        filteredVisits.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case 'name':
        // 点名でソート（ポイント情報を取得する必要があるため非同期処理）
        const visitsWithNames = [];
        for (const visit of filteredVisits) {
          const point = await kijuntenDB.getPointById(visit.pointId);
          visitsWithNames.push({ visit, pointName: point.name });
        }
        visitsWithNames.sort((a, b) => a.pointName.localeCompare(b.pointName));
        filteredVisits = visitsWithNames.map(v => v.visit);
        break;
    }

    // 表示
    displayHistory(filteredVisits);
  } catch (error) {
    console.error('フィルターエラー:', error);
  }
}
