import fs from "fs";
import fetch from "node-fetch";

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const dateStr = `${yyyy}${mm}${dd}`;

const VENUES = [
  "01","02","03","04","05","06","07","08","09","10","11","12",
  "13","14","15","16","17","18","19","20","21","22","23","24"
];

const baseRaceUrl = "https://www.boatrace.jp/owpc/pc/race/raceindex?jcd=";
const baseResultUrl = "https://www.boatrace.jp/owpc/pc/race/raceresult?jcd=";

const links = [];

console.log("🚀 本日の出走表・結果URL一覧を取得中...");

for (const jcd of VENUES) {
  links.push({
    venueCode: jcd,
    raceUrl: `${baseRaceUrl}${jcd}&hd=${dateStr}`,
    resultUrl: `${baseResultUrl}${jcd}&hd=${dateStr}`
  });
}

const outputPath = "./server/data/today_links.json";
fs.writeFileSync(outputPath, JSON.stringify(links, null, 2));
console.log(`✅ 出走表・結果URLを保存しました (${links.length}件): ${outputPath}`);