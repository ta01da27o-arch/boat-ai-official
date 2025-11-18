// server/fetch_all.js
import fs from "fs";
import { fetchRacelistHTML, fetchRaceDetailHTML, parseRacelistHTML } from "./fetch_utils.js";
import { parseRaceDetailHTML } from "./parse_race_detail.js";

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
  const out = [];

  for (const jcd of JCD_LIST) {
    console.log(`■ ${jcd} 取得中...`);

    const html = await fetchRacelistHTML(jcd, dateStr);
    if (!html) {
      console.log(`⚠ racelist 取得不可: jcd=${jcd}`);
      continue;
    }

    const raceUrls = parseRacelistHTML(html);
    if (raceUrls.length === 0) {
      console.log(`⚠ レースなし: jcd=${jcd}`);
      continue;
    }

    const detail = {};

    for (const url of raceUrls) {
      const raceNo = url.match(/rno=(\d+)/)?.[1] || null;

      const htmlDetail = await fetchRaceDetailHTML(url);
      if (!htmlDetail) continue;

      detail[raceNo] = parseRaceDetailHTML(htmlDetail);
    }

    out.push({
      jcd,
      date: dateStr,
      detail,
    });
  }

  return out;
}

async function main() {
  const today = getDate(0);
  const yesterday = getDate(-1);

  const todayData = await processDay(today);
  const ydayData = await processDay(yesterday);

  fs.writeFileSync("server/data/today.json", JSON.stringify(todayData, null, 2));
  fs.writeFileSync("server/data/yesterday.json", JSON.stringify(ydayData, null, 2));

  console.log("🏁 データ構造化完了");
}

main();