import fs from "fs";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

const OUTPUT_PATH = "./server/data/racecards.json";
const BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist";
const VENUES = Array.from({ length: 24 }, (_, i) => String(i + 1).padStart(2, "0"));

const today = new Date();
const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
console.log(`🚀 ${yyyymmdd} の出走表データを取得中...`);

const results = [];

async function safeFetch(url) {
  try {
    const res = await fetch(url, { timeout: 15000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    console.warn(`⚠️ Fetch失敗: ${url} → ${e.message}`);
    return "";
  }
}

for (const jcd of VENUES) {
  const url = `${BASE_URL}?jcd=${jcd}&hd=${yyyymmdd}`;
  console.log(`🌊 取得中: ${url}`);

  const html = await safeFetch(url);
  if (!html) {
    console.warn(`⚠️ ${jcd}: ページ取得失敗`);
    continue;
  }

  const $ = cheerio.load(html);
  const raceList = [];

  // 例: 12R ぶん走査
  $("div.table1").each((_, table) => {
    const raceTitle = $(table).prev("h3").text().trim();
    const raceRows = $(table).find("tbody tr");

    const raceData = [];
    raceRows.each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length < 4) return;

      raceData.push({
        lane: $(cols[0]).text().trim(),
        name: $(cols[1]).text().trim(),
        branch: $(cols[2]).text().trim(),
        class: $(cols[3]).text().trim(),
        st: $(cols[4]).text().trim(),
      });
    });

    if (raceData.length > 0) {
      raceList.push({
        title: raceTitle || "不明レース",
        entries: raceData,
      });
    }
  });

  if (raceList.length > 0) {
    results.push({ jcd, date: yyyymmdd, races: raceList });
    console.log(`✅ ${jcd}: 出走表(${raceList.length})件`);
  } else {
    console.log(`⚠️ ${jcd}: 出走表なし`);
  }

  await new Promise(r => setTimeout(r, 1000));
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
console.log(`📄 出走表データ保存完了: ${OUTPUT_PATH}`);