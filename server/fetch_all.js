// server/fetch_all.js
import fs from "fs";
import axios from "axios";
import { fetchRacelist } from "./getRacelist.js";
import { parseRacecard } from "./parseRacecard.js";

const jcdList = [...Array(24)].map((_, i) =>
  String(i + 1).padStart(2, "0")
);

// 日付シフト
function shift(day, diff) {
  const y = Number(day.slice(0, 4));
  const m = Number(day.slice(4, 6)) - 1;
  const d = Number(day.slice(6, 8));
  const dt = new Date(y, m, d + diff);
  return dt.toISOString().slice(0, 10).replace(/-/g, "");
}

// 有効なレース日を検索
async function findRaceDate(base) {
  for (let i = 0; i < 5; i++) {
    const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${base}`;
    const res = await axios.get(url);

    if (!res.data.startsWith("<?xml")) return base;

    base = shift(base, -1);
  }
  return base;
}

// racecard詳細取得
async function fetchDetail(url) {
  const html = await axios.get(url).then(r => r.data);
  return parseRacecard(html);
}

async function fetchByDay(day, outfile) {
  console.log(`📅 取得日: ${day}`);

  const allUrls = [];

  for (const jcd of jcdList) {
    const urls = await fetchRacelist(jcd, day);
    allUrls.push(...urls);
  }

  console.log(`🔗 racecard URL数: ${allUrls.length}`);

  const results = [];

  for (const url of allUrls) {
    console.log("📄 解析中:", url);
    try {
      const detail = await fetchDetail(url);
      results.push({ url, ...detail });
    } catch {
      console.log("❌ 取得失敗:", url);
    }
  }

  fs.writeFileSync(outfile, JSON.stringify(results, null, 2));
  console.log(`💾 保存完了: ${outfile}`);
}

async function main() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const validToday = await findRaceDate(today);
  const validYesterday = shift(validToday, -1);

  await fetchByDay(validToday, "./server/data/today.json");
  await fetchByDay(validYesterday, "./server/data/yesterday.json");
}

main();