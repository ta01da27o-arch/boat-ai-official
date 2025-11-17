// fetch_all.js
// 本日 + 前日 をセットで取得

import { fetchDay } from "./fetch_day.js";

function getDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);

  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");

  return `${Y}${M}${D}`;
}

const today = getDate(0);
const yesterday = getDate(-1);

await fetchDay(today, "./server/data/today.json");
await fetchDay(yesterday, "./server/data/yesterday.json");

console.log("\n✨ 完了しました！\n");