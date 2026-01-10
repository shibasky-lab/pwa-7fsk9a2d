let currentPage = 1;
const PAGE_SIZE = 20;
let lastResults = [];

/* 点種別表示変換 */
function shortType(type) {
  if (type === "電子基準点") return "電子";
  if (type === "一等三角点") return "一等";
  if (type === "二等三角点") return "二等";
  if (type === "三等三角点") return "三等";
  if (type === "四等三角点") return "四等";
  return type;
}

/* 検索実行 */
async function searchPoints() {
  const name = document.getElementById("search-name").value.trim();
  const pref = document.getElementById("search-pref").value;

  const checkedTypes = Array.from(
    document.querySelectorAll('#type-filters input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  const db = await openDB();
  const tx = db.transaction("points", "readonly");
  const store = tx.objectStore("points");

  lastResults = [];
  currentPage = 1;

  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (!cursor) {
      renderPage();
      return;
    }

    const p = cursor.value;

    if (
      (name === "" || p.point_name.includes(name)) &&
      (pref === "" || p.prefecture === pref) &&
      checkedTypes.includes(p.point_type)
    ) {
      lastResults.push(p);
    }

    cursor.continue();
  };
}

/* ページ描画 */
function renderPage() {
  const tbody = document.getElementById("result-body");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = lastResults.slice(start, start + PAGE_SIZE);

  for (const p of pageItems) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td align="center">${shortType(p.point_type)}</td>
      <td>${p.point_name}</td>
      <td>${p.point_code}</td>
      <td>${p.prefecture}</td>
      <td align="center">
        <button onclick="openDetail('${p.point_code}')">詳細</button>
      </td>
    `;

    tbody.appendChild(tr);
  }

  const totalPages = Math.max(1, Math.ceil(lastResults.length / PAGE_SIZE));
  document.getElementById("page-info").textContent =
    `${currentPage} / ${totalPages}`;
}

/* ページ操作 */
document.getElementById("next-page").onclick = () => {
  if (currentPage * PAGE_SIZE < lastResults.length) {
    currentPage++;
    renderPage();
  }
};

document.getElementById("prev-page").onclick = () => {
  if (currentPage > 1) {
    currentPage--;
    renderPage();
  }
};

/* 検索ボタン */
document.getElementById("search-btn").onclick = searchPoints;

/* 詳細画面（後で作る） */
function openDetail(pointCode) {
  alert(`詳細画面へ遷移: ${pointCode}`);
}
