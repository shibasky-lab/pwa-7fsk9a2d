/**
 * 設定ページのJavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // イベントリスナーを設定
  document.getElementById('backup-btn').addEventListener('click', performBackup);
  document.getElementById('update-points-btn').addEventListener('click', updatePoints);
  document.getElementById('clear-history-btn').addEventListener('click', clearHistoryData);
  document.getElementById('clear-all-btn').addEventListener('click', clearAllData);
});

/**
 * バックアップ（ZIP出力）
 */
async function performBackup() {
  try {
    alert('バックアップ機能の実装が進行中です');
    // 今後実装：JSZipライブラリを使用してZIPファイルを生成
  } catch (error) {
    console.error('バックアップエラー:', error);
    alert('バックアップに失敗しました: ' + error.message);
  }
}

/**
 * 点情報を更新
 */
async function updatePoints() {
  try {
    const confirm = window.confirm('点情報を更新しますか？');
    if (!confirm) return;

    // points.jsonを再度読み込み
    const response = await fetch('/data/points.json');
    const points = await response.json();
    
    // DBに保存
    await kijuntenDB.addOrUpdatePoints(points);
    
    alert(`${points.length}個の基準点情報を更新しました`);
  } catch (error) {
    console.error('更新エラー:', error);
    alert('更新に失敗しました: ' + error.message);
  }
}

/**
 * 訪問履歴をクリア
 */
async function clearHistoryData() {
  const confirm = window.confirm(
    '訪問履歴をすべて削除します。\\n' +
    'この操作は取り消せません。\\n' +
    'よろしいですか？'
  );

  if (!confirm) return;

  try {
    await kijuntenDB.clearVisits();
    alert('訪問履歴を削除しました');
  } catch (error) {
    console.error('削除エラー:', error);
    alert('削除に失敗しました: ' + error.message);
  }
}

/**
 * すべてのデータをクリア
 */
async function clearAllData() {
  const confirm = window.confirm(
    'すべてのデータを削除します。\\n' +
    '基準点データを含むすべての情報が失われます。\\n' +
    'この操作は取り消せません。\\n' +
    'よろしいですか？'
  );

  if (!confirm) return;

  try {
    await kijuntenDB.clearAll();
    alert('すべてのデータを削除しました');
    location.reload();
  } catch (error) {
    console.error('削除エラー:', error);
    alert('削除に失敗しました: ' + error.message);
  }
}
