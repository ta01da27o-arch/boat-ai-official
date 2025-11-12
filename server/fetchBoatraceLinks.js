// server/fetchBoatraceLinks.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.boatrace.jp";
const TODAY_URL = `${BASE_URL}/owpc/pc/race/index`;

console.log("🚀 本日の出走表・結果URL一覧を取得中...");

try {
  const res = await fetch(TODAY_URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const links = [];
  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");

  // 各レース場リンクを抽出
  $("a[href*='jcd=']").each((_, a) => {
    const href = $(a).attr("href");
    const match = href.match(/jcd=(\d{2})/);
    if (!match) return;
    const jcd = match[1];
    const name = $(a).text().trim() || `場${jcd}`;

    // 出走表ページ racelist
    const raceUrl = `${BASE_URL}/owpc/pc/race/racelist?jcd=${jcd}&hd=${yyyymmdd}`;
    // 結果ページ raceresult
    const resultUrl = `${BASE_URL}/owpc/pc/race/raceresult?jcd=${jcd}&hd=${yyyymmdd}`;

    links.push({
      venueCode: jcd,
      name,
      raceUrl,
      resultUrl,
    });
  });

  if (!fs.existsSync("./server/data")) fs.mkdirSync("./server/data", { recursive: true });
  const filePath = path.resolve("./server/data/today_links.json");
  fs.writeFileSync(filePath, JSON.stringify(links, null, 2), "utf-8");

  console.log(`✅ 出走表・結果URLを保存しました (${links.length}件): ${filePath}`);
} catch (err) {
  console.error("❌ エラー:", err.message);
  process.exit(1);
}