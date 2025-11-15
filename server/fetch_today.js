// server/fetch_today.js
// 全国24場の racelist ページを直接取得して解析する安定版

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

// 24場
const JCDS = [
  "01","02","03","04","05","06",
  "07","08","09","10","11","12",
  "13","14","15","16","17","18",
  "19","20","21","22","23","24"
];

console.log(`🚀 本日の全 racelist を取得: ${DATE}`);

async function fetchToday() {
  const allData = [];

  for (const jcd of JCDS) {
    const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${DATE}`;
    console.log(`🌊 racelist 取得中: ${url}`);

    try {
      const html = await fetch(url).then(r => r.text());

      // XML の場合は開催なし
      if (html.startsWith("<?xml")) {
        console.log(`⚠ XML返却 → スキップ: jcd=${jcd}`);
        continue;
      }

      const $ = cheerio.load(html);
      const races = parseRacecard($);

      if (races.length === 0) {
        console.log(`⚠ レースなし: jcd=${jcd}`);
        continue;
      }

      allData.push({
        jcd,
        url,
        races
      });

    } catch (err) {
      console.log(`❌ 取得失敗 jcd=${jcd}: ${err.message}`);
    }
  }

  const savePath = "./server/data/racecards.json";
  fs.writeFileSync(savePath, JSON.stringify(allData, null, 2));
  console.log(`📄 出走表保存完了: ${savePath}`);
}

fetchToday();