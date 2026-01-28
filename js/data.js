/**
 * データ統計ページのJavaScript
 */

async function loadDataPage() {
  try {
    const allVisits = await kijuntenDB.getAllVisits();
    const allPoints = await kijuntenDB.getAllPoints();

    // 基本統計を計算
    const totalVisits = allVisits.length;
    const uniquePointIds = [...new Set(allVisits.map(v => v.pointId))];
    const uniquePoints = uniquePointIds.length;
    
    // 写真数を計算
    let totalPhotos = 0;
    for (const visit of allVisits) {
      const photos = await kijuntenDB.getPhotosByVisitId(visit.id);
      totalPhotos += photos.length;
    }

    // 探索日数を計算
    const uniqueDates = [...new Set(allVisits.map(v => v.visitDate))];
    const visitDays = uniqueDates.length;

    // 画面に表示
    document.getElementById('total-visits').textContent = totalVisits;
    document.getElementById('unique-points').textContent = uniquePoints;
    document.getElementById('total-photos').textContent = totalPhotos;
    document.getElementById('visit-days').textContent = visitDays;

    // 基準点種別別の統計
    displayTypeStats(allVisits);

    // 都道府県別の統計
    displayPrefectureStats(allVisits);
  } catch (error) {
    console.error('データ読み込みエラー:', error);
  }
}

/**
 * 基準点種別別の統計を表示
 */
async function displayTypeStats(visits) {
  const typeCount = {};

  for (const visit of visits) {
    const point = await kijuntenDB.getPointById(visit.pointId);
    if (point) {
      typeCount[point.type] = (typeCount[point.type] || 0) + 1;
    }
  }

  const typeStatsDiv = document.getElementById('type-stats');
  let html = '<div class="point-info-grid">';

  for (const [type, count] of Object.entries(typeCount)) {
    html += `
      <div class="info-item">
        <div class="info-label">${type}</div>
        <div class="info-value">${count}件</div>
      </div>
    `;
  }

  html += '</div>';
  typeStatsDiv.innerHTML = html;
}

/**
 * 都道府県別の統計を表示
 */
async function displayPrefectureStats(visits) {
  const prefectureCount = {};

  for (const visit of visits) {
    const point = await kijuntenDB.getPointById(visit.pointId);
    if (point) {
      prefectureCount[point.prefecture] = (prefectureCount[point.prefecture] || 0) + 1;
    }
  }

  const prefectureStatsDiv = document.getElementById('prefecture-stats');
  let html = '<div style="max-height: 300px; overflow-y: auto;">';

  const sorted = Object.entries(prefectureCount)
    .sort((a, b) => b[1] - a[1]);

  for (const [prefecture, count] of sorted) {
    html += `
      <div style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between;">
        <span>${prefecture}</span>
        <strong>${count}件</strong>
      </div>
    `;
  }

  html += '</div>';
  prefectureStatsDiv.innerHTML = html;
}
