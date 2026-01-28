// js/photos.js

/**
 * 写真を登録（近景 c / 遠景 f）
 * - 縦横比固定 3:4
 * - サイズ 360x480 px
 * - JPEG圧縮 0.7
 * @param {File} file - 選択された画像ファイル
 * @param {string} code - 基準点コード
 * @param {'c'|'f'} kind - 'c'=近景, 'f'=遠景
 */
async function addPhoto(file, code, kind) {
  const blob = await resizeImage(file, 360, 480);
  const database = await openDB();
  const store = getStore('photos', 'readwrite');

  return new Promise((resolve, reject) => {
    const req = store.add({ code, kind, blob });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * 1点分の写真を取得
 * @param {string} code - 基準点コード
 * @param {'c'|'f'|null} kind - 種別指定、nullで全て
 */
async function getPhotos(code, kind = null) {
  const database = await openDB();
  const store = getStore('photos');
  const index = store.index('code');

  return new Promise((resolve, reject) => {
    const req = index.getAll(code);
    req.onsuccess = () => {
      let results = req.result;
      if (kind) results = results.filter(p => p.kind === kind);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Canvasでリサイズ + JPEG圧縮
 * @param {File} file
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @returns {Promise<Blob>}
 */
function resizeImage(file, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      // 縦横比 3:4 固定
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      // 縦横比維持して中央に収める
      const ratio = 3 / 4; // width / height
      let drawWidth = targetWidth;
      let drawHeight = targetHeight;

      if (img.width / img.height > ratio) {
        // 横長
        drawHeight = targetHeight;
        drawWidth = img.width * (targetHeight / img.height);
      } else {
        // 縦長
        drawWidth = targetWidth;
        drawHeight = img.height * (targetWidth / img.width);
      }

      // 中央に描画
      ctx.drawImage(
        img,
        (targetWidth - drawWidth) / 2,
        (targetHeight - drawHeight) / 2,
        drawWidth,
        drawHeight
      );

      // JPEG化
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.7
      );
    };

    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * 写真削除
 * @param {number} id - photos.id
 */
async function deletePhoto(id) {
  const database = await openDB();
  const store = getStore('photos', 'readwrite');

  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
