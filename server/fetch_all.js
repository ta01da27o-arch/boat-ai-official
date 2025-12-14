// server/fetch_all.js
import { todayString, saveJSON } from "./utils.js";
import { fetchHeatsApi, parseHeatsXmlToJs } from "./fetch_heats_api.js";
import { fetchByDate } from "./fetch_playwright.js";
import path from "path";
import fs from "fs-extra";

async function processDate(dateStr) {
  console.log(`\n📅 取得日：${dateStr}`);

  // 1) try official internal API
  const apiRes = await fetchHeatsApi(dateStr);
  if (apiRes) {
    if (apiRes.type === "json") {
      console.log("✅ 内部API(JSON) 取得成功");
      const out = { date: dateStr, source: "api-json", data: apiRes.data };
      const outPath = path.join("server", "data", `${dateStr}.json`);
      await saveJSON(outPath, out);
      return out;
    } else if (apiRes.type === "xml") {
      console.log("⚠ 内部API は XML を返しました（保存）");
      // try parse xml to JS
      const parsed = parseHeatsXmlToJs(apiRes.data);
      const out = { date: dateStr, source: "api-xml", raw: apiRes.data, parsed: parsed };
      const outPath = path.join("server", "data", `${dateStr}.json`);
      await saveJSON(outPath, out);
      return out;
    }
  }

  // 2) Fallback: Playwright scraping
  console.log("ℹ API が利用できないので Playwright フォールバックを実行します");
  const scraped = await fetchByDate(dateStr);
  const outPath = path.join("server", "data", `${dateStr}.json`);
  const out = { date: dateStr, source: "playwright", data: scraped };
  await saveJSON(outPath, out);
  return out;
}

async function main() {
  // today and yesterday (you can adjust)
  const today = todayString(0);
  const yesterday = todayString(-1);

  await fs.ensureDir(path.join("server", "data"));

  await processDate(today);
  await processDate(yesterday);

  console.log("\n✨ 全日データ取得完了");
}

main().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});