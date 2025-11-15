// fetch_today.js
// 本日のボートレース出走表をHTMLスクレイピングで取得

import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { parseRacecard } from "./parseRacecard.js";

const TODAY = new Date();
const YYYY = TODAY.getFullYear();
const MM = String(TODAY.getMonth() + 1).padStart(2, "0");
const DD = String(TODAY.getDate()).padStart(2, "0");
const DATE = `${YYYY}${MM}${DD}`;

const INDEX_URL = `https://www.boatrace.jp/owpc/pc/race/index?hd=${DATE}`;

console.log(`🚀 本日のレース一覧を取得中: ${INDEX_URL}`);

async function fetchToday() {
  const result = [];

  // レース一覧ページ取得
  const html = await fetch(INDEX_URL).then(r => r.text());
  const $ = cheerio.load(html);

  const raceUrls = [];

  $(".table1 tbody tr").each((_, el) => {
    const a = $(el).find("a");
    if (!a.length) return;

    const href = a.attr("href");
    if (href && href.includes("racelist")) {
      raceUrls.push("https://www.boatrace.jp" + href);
    }
  });

  console.log(`✅ 出走表URL取得: ${raceUrls.length}件`);

  for (const url of raceUrls) {
    console.log("🌊 取得中: ", url);
    try {
      const page = await fetch(url).then(r => r.text());
      const $$ = cheerio.load(page);

      // parseRacecard モジュールで抽出
      const races = parseRacecard($$);

      result.push({
        url,
        races
      });

    } catch (err) {
      console.log("❌ 取得失敗:", err.message);
    }
  }

  // 保存
  const savePath = "./server/data/racecards.json";
  fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
  console.log(`📄 出走表保存完了: ${savePath}`);
}

fetchToday();