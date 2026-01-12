import { openDB } from "./db.js";

const params = new URLSearchParams(location.search);
const code = params.get("code");

if (!code) {
  alert("基準点コードがありません");
}

const db = await openDB();

const tx = db.transaction("points", "readonly");
const store = tx.objectStore("points");
const req = store.get(code);

req.onsuccess = () => {
  const p = req.result;
  if (!p) {
    alert("基準点が見つかりません");
    return;
  }

  document.getElementById("pointName").textContent = p.name;

  const body = document.getElementById("detailBody");
  body.innerHTML = `
    <tr><th>点種</th><td>${p.type}</td></tr>
    <tr><th>基準点コード</th><td>${p.code}</td></tr>
    <tr><th>都道府県</th><td>${p.pref}</td></tr>
    <tr><th>市町村</th><td>${p.city}</td></tr>
    <tr><th>緯度</th><td>${p.lat}</td></tr>
    <tr><th>経度</th><td>${p.lon}</td></tr>
  `;
};
