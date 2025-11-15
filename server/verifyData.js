// server/verifyData.js
// racecards.json の内容確認

import fs from "fs";

const PATH = "./server/data/racecards.json";

if (!fs.existsSync(PATH)) {
  console.log("❌ racecards.json が存在しません");
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(PATH, "utf-8"));

let totalRaces = 0;
let totalRows = 0;

json.forEach(site => {
  site.races.forEach(r => {
    totalRaces++;
    totalRows += r.rows.length;
  });
});

console.log("📊 出走表確認結果:");
console.log("🏟 開催場数:", json.length);
console.log("🏁 レース数:", totalRaces);
console.log("👥 選手行数:", totalRows);
console.log("✅ 完了");