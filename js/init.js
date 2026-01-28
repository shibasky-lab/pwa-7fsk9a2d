/**
 * アプリケーションの初期化
 */

async function initApp() {
  try {
    // Service Worker登録
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker登録成功:', registration);
    }

    // IndexedDB初期化
    await kijuntenDB.init();
    console.log('IndexedDB初期化完了');

    // points.jsonからデータを取得してDBに保存
    await loadPointsData();

    // ナビゲーション初期化
    initNavigation();

    console.log('アプリケーション初期化完了');
  } catch (error) {
    console.error('初期化エラー:', error);
    alert('アプリケーションの初期化に失敗しました');
  }
}

/**
 * points.jsonを読み込んでDBに保存
 */
async function loadPointsData() {
  try {
    const response = await fetch('/data/points.json');
    const points = await response.json();
    
    // DBに保存
    await kijuntenDB.addOrUpdatePoints(points);
    console.log(`${points.length}個の基準点をDBに保存しました`);
  } catch (error) {
    console.error('points.json読み込みエラー:', error);
  }
}

/**
 * ナビゲーション初期化
 */
function initNavigation() {
  // ナビゲーションリンク
  const navLinks = document.querySelectorAll('.nav-link, .bottom-nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      switchPage(page);
      
      // アクティブ状態を更新
      navLinks.forEach(l => {
        l.classList.remove('active');
      });
      link.classList.add('active');
    });
  });
}

/**
 * ページ切り替え
 */
function switchPage(pageName) {
  // すべてのページを非表示
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => {
    page.classList.remove('active');
  });

  // 選択されたページを表示
  const targetPage = document.getElementById(`${pageName}-page`);
  if (targetPage) {
    targetPage.classList.add('active');
    
    // ページ表示時の処理
    if (pageName === 'history') {
      loadHistoryPage();
    } else if (pageName === 'data') {
      loadDataPage();
    }
  }
}

/**
 * 画像をCanvas上でリサイズ
 */
function resizeImage(file, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        
        // 画像をキャンバスに描画（アスペクト比を保ちながら）
        const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
        const x = (targetWidth / 2) - (img.width / 2) * scale;
        const y = (targetHeight / 2) - (img.height / 2) * scale;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => {
        reject(new Error('画像の読み込みに失敗しました'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 2点間の距離を計算（Haversine公式）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // km
  return distance * 1000; // メートルに変換
}

/**
 * 方位角から16方位を取得
 */
function getBearingDirection(bearing) {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

/**
 * 方位角を計算
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return bearing;
}

/**
 * ページロード時に初期化
 */
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * PWAインストールプロンプト
 */
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // プロンプトを遅延させる
  e.preventDefault();
  deferredPrompt = e;
  console.log('PWAインストールプロンプトが利用可能です');
});

window.addEventListener('appinstalled', () => {
  console.log('PWAがインストールされました');
  deferredPrompt = null;
});
