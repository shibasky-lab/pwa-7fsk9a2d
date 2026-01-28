/**
 * 詳細画面のJavaScript
 */

let map;
let currentPoint;
let nearbyPhotoFile;
let distantPhotoFile;
let surveyingModeActive = false;
let geoWatchId;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 現在地の基準点IDを取得
    const pointId = localStorage.getItem('currentPointId');
    
    if (!pointId) {
      alert('基準点情報が見つかりません');
      window.location.href = '/index.html';
      return;
    }

    // 基準点情報を取得
    currentPoint = await kijuntenDB.getPointById(pointId);
    
    if (!currentPoint) {
      alert('基準点が見つかりません');
      window.location.href = '/index.html';
      return;
    }

    // ページに情報を表示
    displayPointInfo(currentPoint);
    
    // 地図を初期化
    initMap(currentPoint);
    
    // イベントリスナーを設定
    setupEventListeners();
    
    // 訪問日を今日で初期化
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('visit-date').value = today;
  } catch (error) {
    console.error('初期化エラー:', error);
    alert('エラーが発生しました: ' + error.message);
  }
});

/**
 * 基準点情報をページに表示
 */
function displayPointInfo(point) {
  document.getElementById('point-name').textContent = point.name;
  document.getElementById('point-type').textContent = point.type;
  document.getElementById('point-prefecture').textContent = point.prefecture;
  document.getElementById('point-city').textContent = point.city;
  document.getElementById('point-elevation').textContent = point.elevation + 'm';
  document.getElementById('point-description').textContent = point.description;
  
  // 詳細情報
  document.getElementById('detail-accuracy').textContent = point.accuracy;
  document.getElementById('detail-mark-type').textContent = point.markType;
  document.getElementById('detail-install-date').textContent = point.installDate;
  document.getElementById('detail-landmark').textContent = point.nearbyLandmark;
  document.getElementById('detail-remarks').textContent = point.remarks;
}

/**
 * 地図を初期化
 */
function initMap(point) {
  // 地理院地図を初期化
  map = L.map('map').setView([point.latitude, point.longitude], 15);
  
  // 地理院地図のタイルレイヤーを追加
  L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }
  ).addTo(map);

  // 基準点のマーカーを追加
  const marker = L.marker([point.latitude, point.longitude], {
    title: point.name,
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(map);

  marker.bindPopup(`<strong>${point.name}</strong><br>${point.prefecture}${point.city}<br>標高: ${point.elevation}m`);

  // ウィンドウのリサイズ時にマップをリサイズ
  map.invalidateSize();
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners() {
  // 測設モードボタン
  document.getElementById('surveying-mode-btn').addEventListener('click', startSurveyingMode);
  document.getElementById('close-surveying-btn').addEventListener('click', closeSurveyingMode);

  // 写真アップロード
  document.getElementById('nearby-photo').addEventListener('change', handleNearbyPhotoUpload);
  document.getElementById('distant-photo').addEventListener('change', handleDistantPhotoUpload);

  // 探索を記録
  document.getElementById('save-visit-btn').addEventListener('click', saveVisit);
}

/**
 * 測設モードを開始
 */
function startSurveyingMode() {
  surveyingModeActive = true;
  document.getElementById('surveying-mode-btn').style.display = 'none';
  document.getElementById('close-surveying-btn').style.display = 'block';
  document.getElementById('gps-info').classList.add('active');

  // 現在地をリアルタイムで取得
  if ('geolocation' in navigator) {
    geoWatchId = navigator.geolocation.watchPosition(
      (position) => {
        updateSurveyingInfo(position);
      },
      (error) => {
        console.error('位置情報取得エラー:', error);
        alert('位置情報が取得できません: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  } else {
    alert('このデバイスはGeolocation APIに対応していません');
  }
}

/**
 * 測設モード中の情報を更新
 */
function updateSurveyingInfo(position) {
  const userLat = position.coords.latitude;
  const userLon = position.coords.longitude;
  const accuracy = Math.round(position.coords.accuracy);
  const altitude = position.coords.altitude ? Math.round(position.coords.altitude) : 'N/A';
  const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0; // m/s → km/h

  // 距離を計算
  const distance = calculateDistance(userLat, userLon, currentPoint.latitude, currentPoint.longitude);
  const distanceText = distance < 1000 ? 
    Math.round(distance) + 'm' : 
    (distance / 1000).toFixed(2) + 'km';

  // 方位角を計算
  const bearing = calculateBearing(userLat, userLon, currentPoint.latitude, currentPoint.longitude);
  const direction = getBearingDirection(bearing);

  // 画面に情報を表示
  document.getElementById('direction-display').textContent = direction;
  document.getElementById('distance-display').textContent = distance < 1000 ? 
    Math.round(distance) + 'm' : 
    (distance / 1000).toFixed(1) + 'km';
  document.getElementById('accuracy-display').textContent = accuracy;
  document.getElementById('bearing-display').textContent = Math.round(bearing) + '°';
  document.getElementById('altitude-display').textContent = altitude !== 'N/A' ? altitude + 'm' : 'N/A';
  document.getElementById('speed-display').textContent = speed;

  // 5m以内で接近メッセージと音
  if (distance < 5) {
    document.getElementById('proximity-message').textContent = '🎉 5m以内に入りました！';
    playProximitySound();
  } else if (distance < 20) {
    document.getElementById('proximity-message').textContent = '✓ 接近中...';
  } else {
    document.getElementById('proximity-message').textContent = '';
  }

  // マップの中心を更新
  if (map) {
    map.setView([userLat, userLon], 15);
  }
}

/**
 * 接近音を再生
 */
function playProximitySound() {
  // Web Audio APIで簡単な音を生成
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.frequency.value = 1000;
  oscillator.type = 'sine';

  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

/**
 * 測設モードを終了
 */
function closeSurveyingMode() {
  surveyingModeActive = false;
  document.getElementById('surveying-mode-btn').style.display = 'block';
  document.getElementById('close-surveying-btn').style.display = 'none';
  document.getElementById('gps-info').classList.remove('active');

  // 位置情報の監視を停止
  if (geoWatchId) {
    navigator.geolocation.clearWatch(geoWatchId);
  }
}

/**
 * 近景写真を処理
 */
async function handleNearbyPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // 画像をリサイズ（3:4の比率で360x480）
    const resizedBlob = await resizeImage(file, 360, 480);
    nearbyPhotoFile = {
      blob: resizedBlob,
      type: 'nearby',
      name: 'nearby.jpg'
    };

    // プレビューを表示
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('nearby-preview').src = e.target.result;
      document.getElementById('nearby-preview').classList.remove('hidden');
      document.querySelector('label[for="nearby-photo"]').style.display = 'none';
    };
    reader.readAsDataURL(resizedBlob);
  } catch (error) {
    console.error('近景写真の処理エラー:', error);
    alert('写真の処理に失敗しました: ' + error.message);
  }
}

/**
 * 遠景写真を処理
 */
async function handleDistantPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // 画像をリサイズ（3:4の比率で360x480）
    const resizedBlob = await resizeImage(file, 360, 480);
    distantPhotoFile = {
      blob: resizedBlob,
      type: 'distant',
      name: 'distant.jpg'
    };

    // プレビューを表示
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('distant-preview').src = e.target.result;
      document.getElementById('distant-preview').classList.remove('hidden');
      document.querySelector('label[for="distant-photo"]').style.display = 'none';
    };
    reader.readAsDataURL(resizedBlob);
  } catch (error) {
    console.error('遠景写真の処理エラー:', error);
    alert('写真の処理に失敗しました: ' + error.message);
  }
}

/**
 * 探索を記録
 */
async function saveVisit() {
  try {
    const visitDate = document.getElementById('visit-date').value;
    const notes = document.getElementById('visit-notes').value;
    const weather = document.getElementById('visit-weather').value;

    if (!visitDate) {
      alert('探索日を選択してください');
      return;
    }

    // 訪問記録を作成
    const visit = {
      pointId: currentPoint.id,
      visitDate: visitDate,
      notes: notes,
      weather: weather,
      type: currentPoint.type,
      createdAt: new Date().toISOString(),
      photos: []
    };

    // 訪問記録をDBに追加
    const visitId = await kijuntenDB.addVisit(visit);
    console.log('訪問記録を保存しました:', visitId);

    // 写真をDBに追加
    if (nearbyPhotoFile) {
      const nearbyPhoto = {
        visitId: visitId,
        type: 'nearby',
        data: await blobToBase64(nearbyPhotoFile.blob),
        timestamp: new Date().toISOString()
      };
      await kijuntenDB.addPhoto(nearbyPhoto);
    }

    if (distantPhotoFile) {
      const distantPhoto = {
        visitId: visitId,
        type: 'distant',
        data: await blobToBase64(distantPhotoFile.blob),
        timestamp: new Date().toISOString()
      };
      await kijuntenDB.addPhoto(distantPhoto);
    }

    alert('探索を記録しました！');
    
    // フォームをリセット
    document.getElementById('visit-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('visit-notes').value = '';
    document.getElementById('visit-weather').value = '';
    document.getElementById('nearby-preview').classList.add('hidden');
    document.getElementById('distant-preview').classList.add('hidden');
    document.querySelector('label[for="nearby-photo"]').style.display = 'block';
    document.querySelector('label[for="distant-photo"]').style.display = 'block';
    nearbyPhotoFile = null;
    distantPhotoFile = null;
  } catch (error) {
    console.error('訪問記録の保存エラー:', error);
    alert('訪問記録の保存に失敗しました: ' + error.message);
  }
}

/**
 * BlobをBase64に変換
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
