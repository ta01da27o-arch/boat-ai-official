// server/fetchBoatraceDetails.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const LINKS_PATH = path.resolve("server/data/today_links.json");
const DATA_PATH = path.resolve("server/data/data.json");

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

    const races = [];

    // 出走表テーブル抽出（構造変更対応・複数レース対応）
    $("div.table1").each((_, tableDiv) => {
      const raceTitle = $(tableDiv).find("h3").text().trim() || "不明レース";

      $(tableDiv)
        .find("table tbody tr")
        .each((_, tr) => {
          const tds = $(tr).find("td");
          if (tds.length < 5) return;

          races.push({
            race: raceTitle,
            boat: $(tds[0]).text().trim(),
            name: $(tds[1]).text().trim(),
            class: $(tds[2]).text().trim(),
            st: $(tds[3]).text().trim(),
            time: $(tds[4]).text().trim(),
          });
        });
    });

    results.push({
      venue: link.name,
      url: link.url,
      races,
    });

    console.log(`✅ ${link.name}：${races.length}件`);
  } catch (err) {
    console.error(`❌ ${link.name} 取得エラー:`, err.message);
  }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(results, null, 2), "utf-8");
console.log(`📄 全場データ保存完了: ${DATA_PATH}`);