import fs from "fs";

const PATH = "./server/data/racecards.json";

if (!fs.existsSync(PATH)) {
  console.error("❌ racecards.json が存在しません。");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(PATH, "utf-8"));
let totalRaces = 0;
data.forEach(v => totalRaces += v.races.length);

console.log("✅ 出走表確認結果:");
console.log(`📊 場数: ${data.length}`);
console.log(`🏁 総レース数: ${totalRaces}`);