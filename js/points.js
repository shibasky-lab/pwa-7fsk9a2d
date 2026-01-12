import { openDB } from "./db.js";

let currentPage = 1;
const PAGE_SIZE = 20;

/* ===== 検索実行 ===== */
window.searchPoints = async function () {
  currentPage = 1;
  await loadPage();
};

/* ===== ページ切り替え ===== */
window.prevPage = async function () {
  if (currentPage > 1) {
    currentPage--;
    await loadPage();
  }
};

window.nextPage = async function () {
  currentPage++;
  await loadPage();
};

/* ===== 実処理 ===== */
async function loadPage() {
  const name = document.getElementById("searchName").value.trim();
  const pref = document.getElementById("searchPref").value;

  const typeChecks = document.querySelectorAll(".typeCheck:checked");
  const types = Array.from(typeChecks).map(cb => cb.value);

  const db = await openDB();
  const tx = db.transaction("points", "readonly");
  const store = tx.objectStore("points");

  const results = [];
  let skipped = 0;

  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (!cursor) {
      renderResults(results);
      renderPager(results.length);
      return;
    }

    const p = cursor.value;

    /* ===== フィルタ ===== */
    if (
      (name && !p.name.includes(name)) ||
      (pref && p.pref !== pref) ||
      (types.length && !types.includes(p.type))
    ) {
      cursor.continue();
      return;
    }

    /* ===== ページング ===== */
    if (skipped < (currentPage - 1) * PAGE_SIZE) {
      skipped++;
      cursor.continue();
      return;
    }

    if (results.length < PAGE_SIZE) {
      results.push(p);
      cursor.continue();
      return;
    }

    renderResults(results);
    renderPager(results.length);
  };
}

/* ===== 表描画 ===== */
function renderResults(list) {
  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">該当なし</td></tr>`;
    return;
  }

  for (const p of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center">${shortType(p.type)}</td>
      <td>${p.name}</td>
      <td>${p.code}</td>
      <td>${p.pref}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-primary"
          onclick="location.href='point.html?code=${p.code}'">
          詳細
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

/* ===== ページ表示 ===== */
function renderPager(count) {
  document.getElementById("pageInfo").textContent =
    `${currentPage} ページ目${count < PAGE_SIZE ? "（最終）" : ""}`;
}

/* ===== 点種略称 ===== */
function shortType(type) {
  return {
    "電子基準点": "電子",
    "一等三角点": "一等",
    "二等三角点": "二等",
    "三等三角点": "三等",
    "四等三角点": "四等"
  }[type] || type;
}
