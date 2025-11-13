import fs from "fs";

const PATH = "./server/data/data.json";

if (!fs.existsSync(PATH)) {
  console.error("❌ data.json が見つかりません。");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(PATH, "utf-8"));
let raceCount = 0;
let resultCount = 0;

for (const d of data) {
  raceCount += d.races.length;
  resultCount += d.results.length;
}

console.log("✅ 取得結果確認中...");
console.log(`📊 総データ: ${data.length}場分`);
console.log(`🏁 出走表合計: ${raceCount}件`);
console.log(`🏆 結果合計: ${resultCount}件`);
console.log("✅ 処理完了");