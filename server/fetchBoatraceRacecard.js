import fs from "fs";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const VENUE_CODES = Array.from({ length: 24 }, (_, i) => String(i + 1).padStart(2, "0"));
const OUTPUT_PATH = "./server/data/racecards.json";

const allData = [];

async function fetchRacecard(url) {
  try {
    const res = await fetch(url, { timeout: 15000 });
    if (!res.ok) return null;
    const html = await res.text();
    return html.includes("<html") ? html : null;
  } catch {
    return null;
  }
}

console.log(`🚀 ${TODAY} の出走表データを取得中...`);

for (const code of VENUE_CODES) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${code}&hd=${TODAY}`;
  console.log(`🌊 取得中: ${url}`);

  const html = await fetchRacecard(url);
  if (!html) {
    console.warn(`⚠️ ${code}: 出走表なし`);
    continue;
  }

  const $ = cheerio.load(html);
  const title = $("h2.heading1_title, h3.title").first().text().trim() || `場${code}`;
  const races = [];

  $("section#race_list table tbody tr").each((_, el) => {
    const tds = $(el).find("td");
    if (tds.length > 3) {
      races.push({
        lane: $(tds[0]).text().trim(),
        name: $(tds[1]).text().trim(),
        branch: $(tds[2]).text().trim(),
        class: $(tds[3]).text().trim(),
        st: $(tds[4]).text().trim()
      });
    }
  });

  allData.push({ venueCode: code, title, races });
  console.log(`✅ ${code}: 出走表(${races.length})件`);
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
console.log(`📄 出走表データ保存完了: ${OUTPUT_PATH}`);