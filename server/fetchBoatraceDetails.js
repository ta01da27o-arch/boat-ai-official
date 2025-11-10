// server/fetchBoatraceDetails.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const LINKS_PATH = path.resolve("data/today_links.json");

if (!fs.existsSync(LINKS_PATH)) {
  console.error("⚠️ 出走表URL一覧(today_links.json)が見つかりません。fetch-linksを先に実行してください。");
  process.exit(1);
}

const links = JSON.parse(fs.readFileSync(LINKS_PATH, "utf-8"));
const results = [];

console.log("🚀 各場の出走表詳細を取得中...");

for (const link of links) {
  try {
    const res = await fetch(link.url);
    const html = await res.text();
    const $ = cheerio.load(html);

    // 最新 HTML 構造に合わせて出走表を抽出
    const races = [];
    $("table.race_table tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length === 0) return; // ヘッダー行などスキップ

      const raceData = {
        boat: $(tds[0]).text().trim(),
        class: $(tds[1]).text().trim(),
        name: $(tds[2]).text().trim(),
        st: $(tds[3]).text().trim(),
        local: $(tds[4]).text().trim(),
        mt: $(tds[5]).text().trim(),
        course: $(tds[6]).text().trim(),
        eval: $(tds[7]).text().trim(),
      };
      races.push(raceData);
    });

    results.push({
      venue: link.name,
      url: link.url,
      races,
    });
    console.log(`✅ ${link.name} 取得完了 (${races.length}件)`);
  } catch (err) {
    console.error(`❌ ${link.name} 取得エラー:`, err.message);
  }
}

if (!fs.existsSync("data")) fs.mkdirSync("data");
const DATA_PATH = path.resolve("data/data.json");
fs.writeFileSync(DATA_PATH, JSON.stringify(results, null, 2), "utf-8");
console.log(`📄 全場データ保存完了: ${DATA_PATH}`);