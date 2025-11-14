import fs from "fs";

const file = "./server/data/racecards.json";

if (!fs.existsSync(file)) {
  console.error("❌ データファイルが見つかりません。");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf-8"));

let totalRaces = 0;
for (const d of data) totalRaces += d.races.length;

console.log("✅ 出走表確認結果:");
console.log(`📊 場数: ${data.length}`);
console.log(`🏁 総レース数: ${totalRaces}`);
console.log("✅ 処理完了");