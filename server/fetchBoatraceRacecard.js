import fs from "fs";
import fetch from "node-fetch";

const OUTPUT_PATH = "./server/data/racecards.json";
const today = new Date();
const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");

console.log(`🚀 ${yyyymmdd} の出走表データを取得中...`);

// 全24場コード（01〜24）
const VENUE_CODES = Array.from({ length: 24 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

const allRacecards = [];

for (const jcd of VENUE_CODES) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${yyyymmdd}`;
  console.log(`🌊 取得中: ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();

    // 出走表部分をJSON的に抜き出す簡易パーサ（HTML構造依存）
    const raceMatches = [...text.matchAll(/<div class="is-tableFixed">([\s\S]*?)<\/table>/g)];
    const races = raceMatches.map((m, idx) => ({
      raceNo: idx + 1,
      html: m[1]
    }));

    if (races.length > 0) {
      allRacecards.push({ jcd, date: yyyymmdd, races });
      console.log(`✅ ${jcd}: ${races.length}件`);
    } else {
      console.log(`⚠️ ${jcd}: 出走表なし`);
    }

  } catch (err) {
    console.warn(`❌ ${jcd}: 取得失敗 (${err.message})`);
  }

  await new Promise(r => setTimeout(r, 1500));
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allRacecards, null, 2));
console.log(`📄 出走表データ保存完了: ${OUTPUT_PATH}`);