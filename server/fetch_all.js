// server/fetch_all.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  fetchRacelistHTML,
  parseRacelistHTML,
  fetchRaceDetailHTML
} from "./fetch_utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JCD_LIST = [
  "01","02","03","04","05","06","07","08",
  "09","10","11","12","13","14","15","16",
  "17","18","19","20","21","22","23","24"
];

// 日付を YYYYMMDD で返す
function getDate(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// 1 日分の処理
async function processDay(dateStr) {
  console.log(`📅 取得日: ${dateStr}`);

  const results = [];

  for (const jcd of JCD_LIST) {
    console.log(`\n===== JCD=${jcd} =====`);

    // racelist HTML 取得
    const html = await fetchRacelistHTML(jcd, dateStr);
    if (!html) {
      console.log(`⚠ 非開催 or 取得不可: jcd=${jcd}`);
      continue;
    }

    // racelist をパース
    const cards = parseRacelistHTML(html);
    if (cards.length === 0) {
      console.log(`⚠ 有効なレースなし: jcd=${jcd}`);
      continue;
    }

    // 各 racecard 取得
    for (const card of cards) {
      console.log(`▶ racecard: ${card.url}`);

      const detailHTML = await fetchRaceDetailHTML(card.url);
      if (!detailHTML) {
        console.log("   ⚠ racecard 取得不可");
        continue;
      }

      results.push({
        jcd,
        date: dateStr,
        raceno: card.raceno,
        title: card.title,
        url: card.url,
        html: detailHTML
      });
    }
  }

  return results;
}

// 実行メイン
async function main() {
  const today = getDate(0);
  const yesterday = getDate(-1);

  const outToday = await processDay(today);
  const outYesterday = await processDay(yesterday);

  const savePathToday = path.join(__dirname, "data", "today.json");
  const savePathYesterday = path.join(__dirname, "data", "yesterday.json");

  fs.writeFileSync(savePathToday, JSON.stringify(outToday, null, 2));
  fs.writeFileSync(savePathYesterday, JSON.stringify(outYesterday, null, 2));

  console.log(`\n💾 保存完了`);
  console.log(`✨ 完了しました！`);
}

main();