// server/fetch_all.js
import fs from "fs";
import {
  fetchRacelistHTML,
  fetchRaceDetailHTML,
  parseRacelistHTML
} from "./fetch_utils.js";

const JCD_LIST = [
  "01","02","03","04","05","06","07","08",
  "09","10","11","12","13","14","15","16",
  "17","18","19","20","21","22","23","24"
];

function getDate(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function processDay(dateStr) {
  console.log(`📅 取得開始: ${dateStr}`);

  const result = [];

  for (const jcd of JCD_LIST) {
    console.log(`\n🌊 racelist: jcd=${jcd}`);

    const html = await fetchRacelistHTML(jcd, dateStr);
    if (!html) {
      console.log(`⚠ racelist 取得不可: jcd=${jcd}`);
      continue;
    }

    const races = parseRacelistHTML(html);

    for (const r of races) {
      console.log(`   ▶ racecard: ${r.url}`);

      const detailHTML = await fetchRaceDetailHTML(r.url);
      if (!detailHTML) {
        console.log(`   ⚠ racecard 取得不可`);
        continue;
      }

      result.push({
        jcd,
        date: dateStr,
        raceno: r.raceno,
        title: r.title,
        url: r.url,
        html: detailHTML
      });
    }
  }

  return result;
}

async function main() {
  const today = getDate(0);
  const yesterday = getDate(-1);

  const todayData = await processDay(today);
  fs.writeFileSync("./server/data/today.json", JSON.stringify(todayData, null, 2));

  const ydData = await processDay(yesterday);
  fs.writeFileSync("./server/data/yesterday.json", JSON.stringify(ydData, null, 2));

  console.log("\n💾 保存完了");
  console.log("✨ 完了しました！");
}

main();