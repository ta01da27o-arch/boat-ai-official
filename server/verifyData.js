import fs from "fs";

const file = "./server/data/racecards.json";

if (!fs.existsSync(file)) {
  console.error("❌ データファイルがありません");
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(file, "utf-8"));

let races = 0;
let players = 0;

json.forEach(v => {
  v.races.forEach(r => {
    races++;
    players += r.players.length;
  });
});

console.log("✅ 出走表確認結果:");
console.log(`📊 レース数: ${races}`);
console.log(`👥 選手行数: ${players}`);
console.log("✅ 完了");