import { openDB } from './db.js';

const PAGE_SIZE = 20;

let results = [];
let currentPage = 0;

// 都道府県コード順（JIS順）
const PREFS = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県",
  "沖縄県"
];

// プルダウン生成
const prefSelect = document.getElementById('searchPref');
PREFS.forEach(p => {
  const opt = document.createElement('option');
  opt.value = p;
  opt.textContent = p;
  prefSelect.appendChild(opt);
});

document.getElementById('searchBtn').onclick = search;
document.getElementById('prevBtn').onclick = prevPage;
document.getElementById('nextBtn').onclick = nextPage;

async function search() {
  const name = document.getElementById('searchName').value;
  const pref = prefSelect.value;
  const types = [...document.querySelectorAll('.typeCheck:checked')]
    .map(cb => cb.value);

  results = [];
  currentPage = 0;

  const db = await openDB();
  const store = db.transaction('points').objectStore('points');

  store.openCursor().onsuccess = e => {
    const cur = e.target.result;
    if (!cur) {
      render();
      return;
    }

    const p = cur.value;

    if (
      (!name || p.pointName.includes(name)) &&
      (!pref || p.prefecture === pref) &&
      (types.length === 0 || types.includes(p.pointType))
    ) {
      results.push(p);
    }

    cur.continue();
  };
}

function render() {
  const body = document.getElementById('resultBody');
  body.innerHTML = '';

  const start = currentPage * PAGE_SIZE;
  const pageItems = results.slice(start, start + PAGE_SIZE);

  pageItems.forEach(p => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${shortType(p.pointType)}</td>
      <td>${p.pointName}</td>
      <td>${p.pointCode}</td>
      <td>${p.prefecture}</td>
      <td><a href="point.html?code=${p.pointCode}">詳細</a></td>
    `;
    body.appendChild(tr);
  });

  const maxPage = Math.max(1, Math.ceil(results.length / PAGE_SIZE));

  document.getElementById('pageInfo').textContent =
    `${currentPage + 1} / ${maxPage}（全${results.length}件）`;


  document.getElementById('prevBtn').disabled = currentPage === 0;
  document.getElementById('nextBtn').disabled =
    currentPage >= maxPage - 1;
}

function nextPage() {
  currentPage++;
  render();
}

function prevPage() {
  currentPage--;
  render();
}

function shortType(t) {
  return {
    "電子基準点": "電子",
    "一等三角点": "一等",
    "二等三角点": "二等",
    "三等三角点": "三等",
    "四等三角点": "四等"
  }[t] || t;
}
