// js/seed.js

const TEST_POINTS = [
  {
    code: "TEST001",
    name: "テスト三角点A",
    type: "二等三角点",
    number: null,
    pref: "千葉県",
    city: "銚子市",
    lat: 35.73456,
    lon: 140.82654
  },
  {
    code: "TEST002",
    name: "テスト電子基準点",
    type: "電子基準点",
    number: "0471",
    pref: "茨城県",
    city: "神栖市",
    lat: 35.88912,
    lon: 140.66432
  }
];

async function seedPointsIfEmpty() {
  const points = await getAllPoints();
  if (points.length > 0) return;

  for (const p of TEST_POINTS) {
    await addPoint(p);
  }

  console.log("テスト用基準点を投入しました");
}
