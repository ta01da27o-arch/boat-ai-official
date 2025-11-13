import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const OUTPUT_PATH = "./server/data/racecards.json";
const BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist";
const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, "");

const VENUES = [
  "01","02","03","04","05","06","07","08","09","10",
  "11","12","13","14","15","16","17","18","19","20",
  "21","22","23","24"
];

const allData = [];

async function fetchRacecard(venueCode) {
  const url = `${BASE_URL}?jcd=${venueCode}&hd=${TODAY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const $ = cheerio.load(html);

    // 各レースセクション（12R）を抽出
    const raceSections = $(".race_list").toArray();
    if (raceSections.length === 0) {
      console.warn(`⚠️ ${venueCode}: 出走表なし`);
      return null;
    }

    const races = raceSections.map((section, idx) => {
      const raceNo = idx + 1;
      const boats = [];

      $(section)
        .find("table.is-tableFixed__3rdadd tbody tr")
        .each((_, row) => {
          const cols = $(row).find("td");
          const lane = $(cols[0]).text().trim();
          const name = $(cols[1]).find(".is-fs12").text().trim();
          const st = $(cols[5]).text().trim();
          if (lane && name) {
            boats.push({ lane, name, st });
          }
        });

      return { raceNo, boats };
    });

    console.log(`✅ ${venueCode}: 出走表(${races.length})件`);
    return { venueCode, races };

  } catch (e) {
    console.error(`❌ ${venueCode} 取得失敗: ${e.message}`);
    return null;
  }
}

(async () => {
  console.log(`🚀 ${TODAY} の出走表データを取得中...`);
  for (const code of VENUES) {
    const data = await fetchRacecard(code);
    if (data) allData.push(data);
    await new Promise(r => setTimeout(r, 800)); // サーバ負荷軽減
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
  console.log(`📄 出走表データ保存完了: ${OUTPUT_PATH}`);
})();