// server/fetchBoatraceLinks.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.boatrace.jp";
const TODAY_URL = `${BASE_URL}/owpc/pc/race/index`;

console.log("🚀 本日の出走表URL一覧を取得中...");

try {
  const res = await fetch(TODAY_URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const links = [];

  // 各場リンクを抽出（2025年版構造対応）
  $("ul.raceList li a").each((_, a) => {
    const href = $(a).attr("href");
    const name = $(a).find("span").text().trim() || $(a).text().trim();
    if (href && name) {
      links.push({
        name,
        url: href.startsWith("http") ? href : BASE_URL + href,
      });
    }
  });

  if (!fs.existsSync("server/data")) fs.mkdirSync("server/data", { recursive: true });

  const filePath = path.resolve("server/data/today_links.json");
  fs.writeFileSync(filePath, JSON.stringify(links, null, 2), "utf-8");

  if (links.length === 0) {
    console.warn("⚠️ 出走表リンクが見つかりませんでした。HTML構造が変更された可能性があります。");
  } else {
    console.log(`✅ 出走表URL一覧(${links.length}件)を保存しました: ${filePath}`);
  }
} catch (err) {
  console.error("❌ エラー:", err.message);
  process.exit(1);
}