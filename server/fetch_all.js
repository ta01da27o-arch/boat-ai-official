import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchHeatsApi, parseXmlToJson, wait } from "./fetch_utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.join(__dirname, "data");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function getDate(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function processDay(dateStr) {
  console.log(`\n📅 取得日：${dateStr}`);
  const result = { date: dateStr, venues: [] };

  const apiRes = await fetchHeatsApi(dateStr);
  if (!apiRes) {
    console.log("⚠ API取得失敗");
    return result;
  }

  if (apiRes.type === "xml") {
    console.log("⚠ API は XML を返しました（パースして保存）");
    const parsed = parseXmlToJson(apiRes.data);
    result.venues = parsed?.result?.replay || [];
  } else if (apiRes.type === "json") {
    console.log("✅ API(JSON) 取得成功");
    result.venues = apiRes.data?.venues || [];
  } else {
    console.log("ℹ APIは未知形式");
    result.raw = apiRes.data;
  }

  // JSON保存
  const filename = path.join(OUT_DIR, `${dateStr}.json`);
  fs.writeFileSync(filename, JSON.stringify(result, null, 2), "utf-8");
  console.log(`💾 保存完了: ${filename}`);

  return result;
}

async function main() {
  const today = getDate(0);
  const yesterday = getDate(-1);

  await processDay(today);
  await wait(1000); // 少し待機
  await processDay(yesterday);

  console.log("\n✨ 全日データ取得完了");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});