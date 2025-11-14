// server/verifyData.js

import fs from "fs";

const file = "./server/data/racecards.json";

if (!fs.existsSync(file)) {
  console.error("❌ データファイルがありません");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf-8"));

let totalRaces = data.length;
let totalRows = 0;
for (const r of data) totalRows += r.rows.length;

console.log("✅ 出走表確認結果:");
console.log(`📊 レース数: ${totalRaces}`);
console.log(`👥 選手行数: ${totalRows}`);
console.log("✅ 完了");