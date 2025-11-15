// verifyData.js
// racecards.json の内容を簡易確認

import fs from "fs";

const file = "./server/data/racecards.json";

if (!fs.existsSync(file)) {
  console.error("❌ データファイルが見つかりません。");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf-8"));
let totalRaces = 0;
let totalRows = 0;

for (const d of data) {
  totalRaces += d.races.length;
  for (const r of d.races) {
    totalRows += r.rows.length;
  }
}

console.log("✅ 出走表確認結果:");
console.log(`📊 レース数: ${totalRaces}`);
console.log(`👥 選手行数: ${totalRows}`);
console.log("✅ 完了");