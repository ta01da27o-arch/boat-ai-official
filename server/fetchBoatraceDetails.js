import fs from "fs";
import { chromium } from "@playwright/test";
import * as cheerio from "cheerio";

const LINKS_PATH = "./server/data/today_links.json";
const OUTPUT_PATH = "./server/data/data.json";

if (!fs.existsSync(LINKS_PATH)) {
  console.error("❌ today_links.json が見つかりません。先に fetch-links を実行してください。");
  process.exit(1);
}

const links = JSON.parse(fs.readFileSync(LINKS_PATH, "utf-8"));
const allData = [];

console.log("🚀 Playwrightで各場の出走表・結果データを取得中...");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const [i, { venueCode, name, raceUrl, resultUrl }] of links.entries()) {
  const venue = { venueCode, name, races: [], results: [] };

  try {
    // === 出走表 ===
    if (raceUrl) {
      await page.goto(raceUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2500);

      const html = await page.content();
      const $ = cheerio.load(html);

      $("table tbody tr").each((_, el) => {
        const tds = $(el).find("td");
        if (tds.length >= 5) {
          venue.races.push({
            race: $(tds[0]).text().trim(),
            racer: $(tds[1]).text().trim(),
            branch: $(tds[2]).text().trim(),
            class: $(tds[3]).text().trim(),
            st: $(tds[4]).text().trim(),
          });
        }
      });
    }

    // === 結果 ===
    if (resultUrl) {
      await page.goto(resultUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2500);

      const html = await page.content();
      const $ = cheerio.load(html);

      $("table tbody tr").each((_, el) => {
        const tds = $(el).find("td");
        if (tds.length >= 4) {
          venue.results.push({
            order: $(tds[0]).text().trim(),
            racer: $(tds[1]).text().trim(),
            branch: $(tds[2]).text().trim(),
            time: $(tds[3]).text().trim(),
          });
        }
      });
    }

    console.log(
      `✅ ${String(i + 1).padStart(2, "0")}: 出走表(${venue.races.length})件 / 結果(${venue.results.length})件`
    );

    allData.push(venue);
  } catch (err) {
    console.error(`❌ ${venueCode} (${name}) 取得失敗: ${err.message}`);
  }
}

await browser.close();
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2), "utf-8");
console.log(`📄 データ保存完了: ${OUTPUT_PATH}`);