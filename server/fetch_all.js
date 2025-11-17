// server/fetch_all.js
// 本日 & 前日のレースデータを racelist(XML) → racecard(HTML) まで全取得

import fs from "fs";
import { fetchRacelist } from "./fetch_racelist.js";
import { fetchRacecardDetail } from "./fetch_racecard.js";

// 今日
const TODAY = new Date();
const YYYY = TODAY.getFullYear();
const MM = String(TODAY.getMonth() + 1).padStart(2, "0");
const DD = String(TODAY.getDate()).padStart(2, "0");
const TODAY_ID = `${YYYY}${MM}${DD}`;

// 前日
const Y = new Date();
Y.setDate(Y.getDate() - 1);
const YYYY2 = Y.getFullYear();
const MM2 = String(Y.getMonth() + 1).padStart(2, "0");
const DD2 = String(Y.getDate()).padStart(2, "0");
const YESTERDAY_ID = `${YYYY2}${MM2}${DD2}`;

async function run(date, savePath) {
  console.log(`\n============================`);
  console.log(`📅 取得対象日: ${date}`);
  console.log("============================\n");

  const racecardUrls = await fetchRacelist(date);

  console.log(`🔗 racecard URL数: ${racecardUrls.length}`);

  const allData = [];

  for (const url of racecardUrls) {
    console.log(`🌊 racecard 取得: ${url}`);
    try {
      const raceInfo = await fetchRacecardDetail(url);
      allData.push(raceInfo);
    } catch (e) {
      console.log("❌ 取得失敗:", e.message);
    }
  }

  fs.writeFileSync(savePath, JSON.stringify(allData, null, 2));

  console.log(`💾 保存完了: ${savePath}`);
}

// 本日
await run(TODAY_ID, "./server/data/today.json");

// 前日
await run(YESTERDAY_ID, "./server/data/yesterday.json");

console.log("\n✨ 完了しました！");