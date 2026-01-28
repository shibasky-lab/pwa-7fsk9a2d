/**
 * 基準点検索ページのJavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  const typeFilter = document.getElementById('type-filter');
  const prefectureFilter = document.getElementById('prefecture-filter');
  const searchResults = document.getElementById('search-results');

  // 検索ボタンをクリック
  searchBtn.addEventListener('click', performSearch);

  // Enterキーで検索
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // 初期表示：都道府県を取得して選択肢に追加
  loadPrefectures();
});

/**
 * 都道府県を取得して選択肢に追加
 */
async function loadPrefectures() {
  try {
    const points = await kijuntenDB.getAllPoints();
    const prefectures = [...new Set(points.map(p => p.prefecture))].sort();
    
    const prefectureFilter = document.getElementById('prefecture-filter');
    prefectures.forEach(prefecture => {
      const option = document.createElement('option');
      option.value = prefecture;
      option.textContent = prefecture;
      prefectureFilter.appendChild(option);
    });
  } catch (error) {
    console.error('都道府県の読み込みエラー:', error);
  }
}

/**
 * 検索を実行
 */
async function performSearch() {
  const keyword = document.getElementById('search-input').value;
  const type = document.getElementById('type-filter').value;
  const prefecture = document.getElementById('prefecture-filter').value;
  const searchResults = document.getElementById('search-results');

  try {
    searchResults.innerHTML = '<div class="text-center p-16"><div class="spinner"></div> 検索中...</div>';
    
    const results = await kijuntenDB.searchPoints(keyword, type, prefecture);

    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="alert alert-info">
          検索条件に該当する基準点がありません
        </div>
      `;
      return;
    }

    // 結果を表示
    let html = `
      <div class="alert alert-info">
        ${results.length}件の基準点が見つかりました
      </div>
      <ul class="list">
    `;

    results.forEach(point => {
      html += `
        <li class="list-item" onclick="goToDetail('${point.id}')">
          <div class="list-item-title">${point.name}</div>
          <div class="list-item-subtitle">${point.hiragana}</div>
          <div class="list-item-meta">
            ${point.type} | ${point.prefecture}${point.city} | ${point.elevation}m
          </div>
        </li>
      `;
    });

    html += '</ul>';
    searchResults.innerHTML = html;
  } catch (error) {
    console.error('検索エラー:', error);
    searchResults.innerHTML = `
      <div class="alert alert-error">
        検索中にエラーが発生しました: ${error.message}
      </div>
    `;
  }
}

/**
 * 詳細画面に移動
 */
function goToDetail(pointId) {
  // localStorage に現在の基準点IDを保存
  localStorage.setItem('currentPointId', pointId);
  // detail.htmlに遷移
  window.location.href = '/detail.html';
}
