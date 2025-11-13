import fs from "fs";

const PATH = "./server/data/racecards.json";

if (!fs.existsSync(PATH)) {
  console.error("❌ racecards.json が見つかりません。");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(PATH, "utf-8"));
const total = data.reduce((sum, v) => sum + v.races.length, 0);

console.log("✅ 出走表確認結果:");
console.log(`📊 場数: ${data.length}`);
console.log(`🏁 総レース数: ${total}`);
console.log("✅ 処理完了");