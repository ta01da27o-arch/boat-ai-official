import fs from "fs";

const links = JSON.parse(fs.readFileSync("./server/data/today_links.json", "utf-8"));
const data = JSON.parse(fs.readFileSync("./server/data/data.json", "utf-8"));

console.log("✅ 取得結果確認中...\n");

console.log(`📄 出走表URL: ${links.length}件`);
console.log(`📊 総データ: ${data.length}場分`);

let totalRaces = 0;
data.forEach(v => totalRaces += v.races.length);
console.log(`🏁 出走表合計: ${totalRaces}件\n`);

console.log("✅ 処理完了");