// verifyData.js
// JSON の内容をチェックしてログ出力

import fs from "fs";

const path = "./server/data/racecards.json";

if (!fs.existsSync(path)) {
  console.log("❌ racecards.json が存在しません");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path, "utf8"));

let raceCount = 0;
let rowCount = 0;

data.forEach(block => {
  block.races.forEach(race => {
    raceCount++;
    rowCount += race.rows.length;
  });
});

console.log("✅ 出走表確認結果:");
console.log(`📊 レース数: ${raceCount}`);
console.log(`👥 選手行数: ${rowCount}`);
console.log("✅ 完了");