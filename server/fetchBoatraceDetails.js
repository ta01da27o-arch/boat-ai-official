// server/fetchBoatraceDetails.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const LINKS_PATH = path.resolve("server/data/today_links.json");
if (!fs.existsSync(LINKS_PATH)) {
  console.error("⚠️ today_links.json が見つかりません。fetch-links を先に実行してください。");
  process.exit(1);
}

const links = JSON.parse(fs.readFileSync(LINKS_PATH, "utf-8"));
const results = [];

console.log("🚀 各場の出走表・結果データを取得中...");

for (const link of links) {
  try {
    const res = await fetch(link.url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const races = [];

    // 出走表の場合
    if (link.type === "race") {
      $("table.is-tableFixed__3rdadd tr").each((_, tr) => {
        const cols = $(tr).find("td");
        if (cols.length < 5) return;

        races.push({
          type: "出走表",
          boatNo: $(cols[0]).text().trim(),
          racer: $(cols[1]).text().trim(),
          rank: $(cols[2]).text().trim(),
          st: $(cols[3]).text().trim(),
          time: $(cols[4]).text().trim(),
        });
      });
    }

    // 結果ページの場合
    if (link.type === "result") {
      $("table.is-tableFixed__3rdadd tr").each((_, tr) => {
        const cols = $(tr).find("td");
        if (cols.length < 5) return;

        races.push({
          type: "結果",
          rank: $(cols[0]).text().trim(),
          boatNo: $(cols[1]).text().trim(),
          racer: $(cols[2]).text().trim(),
          time: $(cols[3]).text().trim(),
          st: $(cols[4]).text().trim(),
        });
      });
    }

    results.push({
      venue: link.name,
      type: link.type,
      url: link.url,
      races,
    });

    console.log(`✅ ${link.name} (${link.type})：${races.length}件`);
  } catch (err) {
    console.error(`❌ ${link.name} (${link.type}) 取得失敗: ${err.message}`);
  }
}

const DATA_PATH = path.resolve("server/data/data.json");
fs.writeFileSync(DATA_PATH, JSON.stringify(results, null, 2), "utf-8");
console.log(`📄 データ保存完了: ${DATA_PATH}`);