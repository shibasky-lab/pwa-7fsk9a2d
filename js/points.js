import { withStore } from "./db.js";

const PAGE_SIZE = 20;
let currentPage = 1;
let lastResults = [];

export async function searchPoints() {
  const name = document.getElementById("searchName").value.trim();
  const prefecture = document.getElementById("searchPref").value;
  const types = [...document.querySelectorAll(".typeCheck:checked")]
    .map(cb => cb.value);

  lastResults = await withStore("points", "readonly", store => {
    return new Promise(resolve => {
      const results = [];
      store.openCursor().onsuccess = e => {
        const cursor = e.target.result;
        if (!cursor) return resolve(results);

        const p = cursor.value;

        if (name && !p.pointName.includes(name)) return cursor.continue();
        if (prefecture && p.prefecture !== prefecture) return cursor.continue();
        if (types.length && !types.includes(p.pointType)) return cursor.continue();

        results.push(p);
        cursor.continue();
      };
    });
  });

  currentPage = 1;
  renderPage();
}

export function renderPage() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = lastResults.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";

  pageData.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${shortType(p.pointType)}</td>
      <td>${p.pointName}</td>
      <td>${p.pointCode}</td>
      <td>${p.prefecture}</td>
      <td><button onclick="openDetail('${p.pointCode}')">詳細</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("pageInfo").textContent =
    `${currentPage} / ${Math.max(1, Math.ceil(lastResults.length / PAGE_SIZE))}`;
}

export function nextPage() {
  if (currentPage * PAGE_SIZE < lastResults.length) {
    currentPage++;
    renderPage();
  }
}

export function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderPage();
  }
}

// ================================
// 表示用変換
// ================================
function shortType(type) {
  return {
    "電子基準点": "電子",
    "一等三角点": "一等",
    "二等三角点": "二等",
    "三等三角点": "三等",
    "四等三角点": "四等"
  }[type] || type;
}
