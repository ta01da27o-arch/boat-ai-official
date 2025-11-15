// fetch_today.js
// 全国24場の racelist を直接取得する安定版

import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { parseRacecard } from "./parseRacecard.js";

// 今日の日付
const TODAY = new Date();
const YYYY = TODAY.getFullYear();
const MM = String(TODAY.getMonth() + 1).padStart(2, "0");
const DD = String(TODAY.getDate()).padStart(2, "0");
const DATE = `${YYYY}${MM}${DD}`;

// 24場コード
const JCDS = [
  "01","02","03","04","05","06",
  "07","08","09","10","11","12",
  "13","14","15","16","17","18",
  "19","20","21","22","23","24"
];

console.log(`🚀 本日のレースを取得: ${DATE}`);

async function fetchToday() {
  const result = [];

  for (const jcd of JCDS) {
    const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${DATE}`;
    console.log(`🌊 racelist 取得中: ${url}`);

    try {
      const html = await fetch(url).then(r => r.text());

      // XMLのときは対象外
      if (html.startsWith("<?xml")) {
        console.log(`⚠ XML返却 → スキップ: jcd=${jcd}`);
        continue;
      }

      const $ = cheerio.load(html);

      const races = parseRacecard($);

      if (!races || races.length === 0) {
        console.log(`⚠ レースなし: jcd=${jcd}`);
        continue;
      }

      result.push({
        jcd,
        url,
        races
      });

    } catch (err) {
      console.log(`❌ 取得失敗 jcd=${jcd}: ${err.message}`);
    }
  }

  // 保存
  const savePath = "./server/data/racecards.json";
  fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
  console.log(`📄 出走表保存完了: ${savePath}`);
}

fetchToday();