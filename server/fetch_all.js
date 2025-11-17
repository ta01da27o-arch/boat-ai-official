// server/fetch_all.js
import { fetchDay } from "./fetch_day.js";

function format(d) {
  return (
    d.getFullYear().toString() +
    (d.getMonth() + 1).toString().padStart(2, "0") +
    d.getDate().toString().padStart(2, "0")
  );
}

const today = new Date();
const yesterday = new Date(today.getTime() - 86400000);

const todayStr = format(today);
const yestStr = format(yesterday);

await fetchDay(todayStr, "./server/data/today.json");
await fetchDay(yestStr, "./server/data/yesterday.json");

console.log("✨ 完了しました！");