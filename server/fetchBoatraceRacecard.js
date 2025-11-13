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

    const title = $("title").text().trim();
    const raceTables = $(".table1.is-tableFixed__3rdadd").toArray();
    if (raceTables.length === 0) {
      console.warn(`⚠️ ${venueCode}: 出走表なし`);
      return null;
    }

    const races = raceTables.map((table, idx) => {
      const rows = $(table).find("tbody tr").toArray();
      const boats = rows.map(row => {
        const cols = $(row).find("td").toArray();
        return {
          lane: $(cols[0]).text().trim(),
          name: $(cols[2]).text().trim(),
          st: $(cols[5]).text().trim(),
        };
      });
      return {
        raceNo: idx + 1,
        boats,
      };
    });

    console.log(`✅ ${venueCode}: 出走表(${races.length})件`);
    return { venueCode, title, races };

  } catch (e) {
    console.error(`❌ ${venueCode} 取得失敗: ${e.message}`);
    return null;
  }
}

(async () => {
  for (const code of VENUES) {
    const data = await fetchRacecard(code);
    if (data) allData.push(data);
    await new Promise(r => setTimeout(r, 800)); // 負荷軽減
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
  console.log(`📄 出走表データ保存完了: ${OUTPUT_PATH}`);
})();