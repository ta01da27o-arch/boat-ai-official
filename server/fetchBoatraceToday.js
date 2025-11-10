import fs from "fs";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

const BASE_URL = "https://www.boatrace.jp/owpc/pc/race/index";
const DATE = new Date();
const YYYYMMDD = DATE.toISOString().slice(0, 10).replace(/-/g, "");

const outputDir = "./data";
const outputFile = `${outputDir}/today.json`;

async function fetchHTML(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function fetchBoatraceToday() {
  console.log("🌊 公式サイトから本日のレース出走表を取得中...");

  try {
    const html = await fetchHTML(BASE_URL);
    const $ = cheerio.load(html);

    const results = [];

    $(".contentsFrame1Inner .contentsFrame2Inner a[href*='racelist']").each(
      (_, el) => {
        const name = $(el).text().trim();
        const href = $(el).attr("href");

        if (href && name) {
          const fullUrl = new URL(href, BASE_URL).href;
          results.push({
            stadium: name,
            url: fullUrl
          });
        }
      }
    );

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), "utf-8");

    console.log(`✅ ${results.length}場の出走表リンクを取得しました`);
    console.log(`📁 保存先: ${outputFile}`);
  } catch (err) {
    console.error("❌ エラー:", err.message);
  }
}

fetchBoatraceToday();
