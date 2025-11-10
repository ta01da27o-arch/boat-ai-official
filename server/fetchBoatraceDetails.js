// server/fetchBoatraceDetails.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const LINKS_FILE = path.resolve("data/today_links.json");
const OUTPUT_FILE = path.resolve("data/data.json");

console.log("🚀 各場の出走表詳細を取得中...");

if (!fs.existsSync(LINKS_FILE)) {
  console.error("❌ 出走表URL一覧(today_links.json)が見つかりません。");
  process.exit(1);
}

// today_links.jsonを読み込み
const links = JSON.parse(fs.readFileSync(LINKS_FILE, "utf-8"));

if (!Array.isArray(links) || links.length === 0) {
  console.error("⚠️ 出走表URLが空です。fetch-linksを先に実行してください。");
  process.exit(1);
}

let allVenuesData = [];

for (const venue of links) {
  const { name, url } = venue;
  if (!url) continue;

  console.log(`🌊 ${name} 取得中: ${url}`);

  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    // 出走表テーブル抽出（例：boatrace.jp公式構造に対応）
    const raceTitle = $("h2").first().text().trim() || `${name}`;
    const raceRows = [];

    $("table.is-tableFixed__type1 tbody tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 6) return;

      const boatNo = $(tds[0]).text().trim();
      const playerName = $(tds[1]).text().trim();
      const grade = $(tds[2]).text().trim();
      const st = $(tds[3]).text().trim();
      const course = $(tds[4]).text().trim();
      const comment = $(tds[5]).text().trim();

      raceRows.push({
        boatNo,
        playerName,
        grade,
        st,
        course,
        comment,
      });
    });

    allVenuesData.push({
      venue: name,
      title: raceTitle,
      entries: raceRows,
    });

    // サーバー負荷軽減
    await new Promise((r) => setTimeout(r, 1000));

  } catch (err) {
    console.error(`❌ ${name} 取得失敗: ${err.message}`);
  }
}

// data.jsonとして保存
if (allVenuesData.length > 0) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allVenuesData, null, 2), "utf-8");
  console.log(`✅ 出走表データ保存完了: ${OUTPUT_FILE}`);
} else {
  console.log("⚠️ 出走表データが取得できませんでした。");
  }
