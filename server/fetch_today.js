// fetch_today.js
// 公式API + HTML fallback で当日の出走表を100%取得する

import fs from "fs";
import fetch from "node-fetch";
import cheerio from "cheerio";

// 今日の日付
const TODAY = new Date();
const YYYY = TODAY.getFullYear();
const MM = String(TODAY.getMonth() + 1).padStart(2, "0");
const DD = String(TODAY.getDate()).padStart(2, "0");
const DATE = `${YYYY}${MM}${DD}`;

// 開催場API
const HEATS_URL = `https://www.boatrace.jp/owpc/pc/race/json/heats?hd=${DATE}`;

console.log(`🚀 開催場API取得: ${HEATS_URL}`);


// -----------------------------------------------------
// ① API で開催場取得
// -----------------------------------------------------
async function getHeatsAPI() {
  try {
    const res = await fetch(HEATS_URL);
    const text = await res.text();

    if (!text.startsWith("{")) return null; // XML → fallback

    const json = JSON.parse(text);
    if (!json.heats) return null;

    return json.heats.map(h => h.jcd);
  } catch {
    return null;
  }
}


// -----------------------------------------------------
// ② HTML Fallback（APIが壊れている場合）
// -----------------------------------------------------
async function getHeatsHTML() {
  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${DATE}`;
  console.log("🔄 API fallback → HTML解析:", url);

  const html = await fetch(url).then(r => r.text());
  const $ = cheerio.load(html);

  const codes = new Set();

  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const m = href.match(/jcd=(\d{2})/);
    if (m) codes.add(m[1]);
  });

  return [...codes];
}


// -----------------------------------------------------
// ③ 出走表 API を取得
// -----------------------------------------------------
async function fetchRacecard(jcd) {
  const url = `https://www.boatrace.jp/owpc/pc/race/json/racecard?hd=${DATE}&jcd=${jcd}`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!text.startsWith("{")) {
      console.log(`⚠ XML返却 → スキップ: jcd=${jcd}`);
      return null;
    }

    const json = JSON.parse(text);
    return json;
  } catch {
    console.log(`❌ 出走表取得失敗: jcd=${jcd}`);
    return null;
  }
}


// -----------------------------------------------------
// ④ メイン処理
// -----------------------------------------------------
async function main() {
  let heats = await getHeatsAPI();

  if (!heats || heats.length === 0) {
    console.log("⚠ API不調 → HTML fallback へ切替");
    heats = await getHeatsHTML();
  }

  console.log(`🏟 開催場数: ${heats.length}`);

  const result = [];

  for (const jcd of heats) {
    const data = await fetchRacecard(jcd);
    if (!data || !data.record) continue;

    const venueName = data.record.head.jyoName;

    const races = data.record.raceCardData.map(r => ({
      raceNo: r.raceNo,
      players: r.entry.map(p => ({
        name: p.playerName,
        class: p.class,
        st: p.stAvg,
        f: p.fCount,
        nationRate: p.nationWinRate,
        localRate: p.localWinRate,
        motorRate: p.motor2rate,
        courseRate: p.course2rate
      }))
    }));

    result.push({
      jcd,
      venueName,
      races
    });
  }

  // 保存
  const path = "./server/data/racecards.json";
  fs.writeFileSync(path, JSON.stringify(result, null, 2));

  console.log(`📄 データ保存完了: ${path}`);
  console.log(`📊 開催場: ${result.length}`);
  console.log(`🏁 総レース: ${result.reduce((a, b) => a + b.races.length, 0)}`);
}

main();