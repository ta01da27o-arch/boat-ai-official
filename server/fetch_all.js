import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  fetchRacelistHTML,
  fetchRacecardHTML,
  fetchRaceDetailHTML,
  parseRacelistHTML
} from "./fetch_utils.js";
import { parseRaceDetailHTML } from "./parse_race_details.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JCD_LIST = [
  "01","02","03","04","05","06","07","08",
  "09","10","11","12","13","14","15","16",
  "17","18","19","20","21","22","23","24"
];

function getDate(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0,10).replace(/-/g,"");
}

async function processDay(dateStr) {
  const result = [];

  for (const jcd of JCD_LIST) {
    console.log(`\n■ ${jcd} — racelist 取得中（${dateStr}）`);

    const html = await fetchRacelistHTML(jcd, dateStr);
    if (!html) {
      console.log(`⚠ racelist 取得不可: jcd=${jcd}`);
      continue;
    }

    const races = parseRacelistHTML(html);
    if (!races.length) {
      console.log(`⚠ レースが存在しない: jcd=${jcd}`);
      continue;
    }

    for (const race of races) {
      console.log(`   ▶ racecard: ${race.url}`);
      const rcHTML = await fetchRacecardHTML(race.url);
      if (!rcHTML) {
        console.log(`   ⚠ racecard 取得不可`);
        continue;
      }

      // racecard から detail URL 取得
      const detailUrl = race.url.replace("racecard", "racedata");
      console.log(`   ▶ detail: ${detailUrl}`);

      const rdHTML = await fetchRaceDetailHTML(detailUrl);
      if (!rdHTML) {
        console.log("   ⚠ detail 取得不可");
        continue;
      }

      const detail = parseRaceDetailHTML(rdHTML);

      result.push({
        date: dateStr,
        jcd,
        raceno: race.raceno,
        title: race.title,
        racecardUrl: race.url,
        detailUrl,
        detail
      });
    }
  }

  return result;
}


async function main() {
  console.log("📅 取得開始");
  const today = getDate(0);
  const yesterday = getDate(-1);

  const dataToday = await processDay(today);
  const dataYesterday = await processDay(yesterday);

  const outDir = path.join(__dirname, "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  fs.writeFileSync(`${outDir}/${today}.json`, JSON.stringify(dataToday, null, 2));
  fs.writeFileSync(`${outDir}/${yesterday}.json`, JSON.stringify(dataYesterday, null, 2));

  console.log("\n💾 保存完了");
  console.log("✨ 完了しました！");
}

main();