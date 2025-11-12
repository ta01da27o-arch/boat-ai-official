// server/verifyData.js
import fs from "fs";
import path from "path";

const LINKS_PATH = path.resolve("server/data/today_links.json");
const DATA_PATH = path.resolve("server/data/data.json");

if (!fs.existsSync(LINKS_PATH) || !fs.existsSync(DATA_PATH)) {
  console.error("⚠️ 必要なファイルが見つかりません。");
  process.exit(1);
}

const links = JSON.parse(fs.readFileSync(LINKS_PATH, "utf-8"));
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

const raceLinks = links.filter((l) => l.type === "race").length;
const resultLinks = links.filter((l) => l.type === "result").length;

console.log("✅ 取得結果確認中...\n");
console.log(`📄 出走表URL: ${raceLinks}件`);
console.log(`📄 結果URL: ${resultLinks}件`);
console.log(`📊 総データ: ${data.length}場分`);
console.log("\n✅ 処理完了");