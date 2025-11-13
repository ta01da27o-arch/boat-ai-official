import fs from "fs";
import fetch from "node-fetch";

const OUTPUT_FILE = "./server/data/racecards.json";
const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist";

// ボートレース場コード（01～24）
const VENUE_CODES = [
  "01","02","03","04","05","06","07","08","09","10",
  "11","12","13","14","15","16","17","18","19","20",
  "21","22","23","24"
];

const allData = [];

console.log(`🚀 ${TODAY} の出走表データを取得中...`);

async function fetchRacecard(venueCode) {
  const url = `${BASE_URL}?jcd=${venueCode}&hd=${TODAY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    // HTML内にレース情報があるか確認
    if (!text.includes("race_table")) {
      console.warn(`⚠️ ${venueCode}: 出走表なし`);
      return { venueCode, races: [] };
    }

    // 正規表現で各レース情報を抽出
    const raceRegex = /<tr class="race_table_.*?">([\s\S]*?)<\/tr>/g;
    const tdRegex = /<td.*?>([\s\S]*?)<\/td>/g;

    const races = [];
    let match;
    while ((match = raceRegex.exec(text)) !== null) {
      const row = match[1];
      const tds = [...row.matchAll(tdRegex)].map(m => m[1].replace(/<.*?>/g, "").trim());
      if (tds.length >= 2) {
        races.push({
          raceNumber: tds[0],
          startTime: tds[1]
        });
      }
    }

    console.log(`✅ ${venueCode}: 出走表(${races.length})件`);
    return { venueCode, races };

  } catch (e) {
    console.error(`❌ ${venueCode} 取得失敗: ${e.message}`);
    return { venueCode, races: [] };
  }
}

(async () => {
  for (const code of VENUE_CODES) {
    const data = await fetchRacecard(code);
    allData.push(data);
    await new Promise(r => setTimeout(r, 500)); // サーバー負荷軽減
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
  console.log(`📄 出走表データ保存完了: ${OUTPUT_FILE}`);
})();