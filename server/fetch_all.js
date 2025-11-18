// server/fetch_all.js
import fs from "fs";
import path from "path";
import { fetchJCDAll } from "./fetch_utils.js";

const JCD_LIST = [
  "01","02","03","04","05","06","07","08",
  "09","10","11","12","13","14","15","16",
  "17","18","19","20","21","22","23","24"
];

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function getYesterday() {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const today = getToday();
  const yesterday = getYesterday();

  const outToday = [];
  const outYesterday = [];

  for (const jcd of JCD_LIST) {
    console.log(`■ ${jcd} 今日を取得中...`);
    const t = await fetchJCDAll(jcd, today);
    if (t) outToday.push(t);

    console.log(`■ ${jcd} 前日を取得中...`);
    const y = await fetchJCDAll(jcd, yesterday);
    if (y) outYesterday.push(y);
  }

  fs.writeFileSync(
    "server/data/today.json",
    JSON.stringify(outToday, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    "server/data/yesterday.json",
    JSON.stringify(outYesterday, null, 2),
    "utf8"
  );

  console.log("🏁 更新完了");
}

main();