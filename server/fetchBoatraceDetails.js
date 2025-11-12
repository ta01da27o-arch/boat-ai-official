import fs from "fs";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

const LINKS_PATH = "./server/data/today_links.json";
const OUTPUT_PATH = "./server/data/data.json";

if (!fs.existsSync(LINKS_PATH)) {
  console.error("❌ today_links.json が見つかりません。先に fetch-links を実行してください。");
  process.exit(1);
}

const links = JSON.parse(fs.readFileSync(LINKS_PATH, "utf-8"));
const allData = [];

console.log("🚀 各場の出走表・結果データを取得中...");

async function safeFetch(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { timeout: 15000 });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.includes("<html")) return text;
    } catch (err) {
      console.warn(`⚠️ Fetch失敗(${i + 1}/${retries}): ${url} → ${err.message}`);
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  return "";
}

for (const [i, { venueCode, raceUrl, resultUrl }] of links.entries()) {
  const venue = { venueCode, title: "", races: [], results: [] };

  try {
    // 出走表取得
    const raceHtml = await safeFetch(raceUrl);
    if (raceHtml) {
      const $ = cheerio.load(raceHtml);
      venue.title = $("h2.heading1_title, h3.title").first().text().trim() || "不明";

      $("section#race_list table tbody tr").each((_, el) => {
        const tds = $(el).find("td");
        if (tds.length > 3) {
          venue.races.push({
            lane: $(tds[0]).text().trim(),
            name: $(tds[1]).text().trim(),
            branch: $(tds[2]).text().trim(),
            class: $(tds[3]).text().trim(),
            st: $(tds[4]).text().trim()
          });
        }
      });
    }

    // 結果取得
    const resultHtml = await safeFetch(resultUrl);
    if (resultHtml) {
      const $$ = cheerio.load(resultHtml);
      $$("#race_result table tbody tr").each((_, el) => {
        const tds = $$(el).find("td");
        if (tds.length > 3) {
          venue.results.push({
            order: $$(tds[0]).text().trim(),
            name: $$(tds[1]).text().trim(),
            branch: $$(tds[2]).text().trim(),
            time: $$(tds[3]).text().trim()
          });
        }
      });
    }

    console.log(
      `✅ ${String(i + 1).padStart(2, "0")}: 出走表(${venue.races.length})件 / 結果(${venue.results.length})件`
    );
    allData.push(venue);
  } catch (e) {
    console.error(`❌ ${venueCode} 取得失敗: ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 1000));
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
console.log(`📄 データ保存完了: ${OUTPUT_PATH}`);