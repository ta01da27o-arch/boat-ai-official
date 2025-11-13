import fs from "fs";
import fetch from "node-fetch";

const OUTPUT_PATH = "./server/data/racecards.json";

const BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"; // JSON APIのURL（例）
const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, "");

const VENUES = [
  "01","02","03","04","05","06","07","08","09","10",
  "11","12","13","14","15","16","17","18","19","20",
  "21","22","23","24"
];

const allData = [];

async function fetchRacecard(venueCode) {
  const url = `${BASE_URL}?jcd=${venueCode}&hd=${TODAY}&type=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.races || json.races.length === 0) {
      console.warn(`⚠️ ${venueCode}: 出走表なし`);
      return null;
    }

    const venue = {
      venueCode,
      title: json.venueName || `場コード${venueCode}`,
      races: json.races.map(r => ({
        raceNo: r.raceNo,
        startTime: r.startTime,
        boats: r.boats.map(b => ({
          lane: b.lane,
          name: b.name,
          class: b.class,
          st: b.st
        }))
      }))
    };

    console.log(`✅ ${venueCode}: 出走表(${venue.races.length})件`);
    return venue;

  } catch (e) {
    console.error(`❌ ${venueCode} 取得失敗: ${e.message}`);
    return null;
  }
}

(async () => {
  for (const code of VENUES) {
    const data = await fetchRacecard(code);
    if (data) allData.push(data);
    await new Promise(r => setTimeout(r, 500)); // 連続アクセス防止
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
  console.log(`📄 出走表データ保存完了: ${OUTPUT_PATH}`);
})();