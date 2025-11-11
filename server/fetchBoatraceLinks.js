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

  // 各レース場リンクを最新 HTML 構造に合わせて取得
  $("div.m-box_list li a").each((_, a) => {
    const href = $(a).attr("href");
    const name = $(a).find("span").text().trim() || $(a).text().trim();
    if (href && name) {
      links.push({
        name,
        url: href.startsWith("http") ? href : BASE_URL + href,
      });
    }
  });

  // server/data ディレクトリを確実に作成
  const dataDir = path.resolve("server/data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const filePath = path.join(dataDir, "today_links.json");
  fs.writeFileSync(filePath, JSON.stringify(links, null, 2), "utf-8");
  console.log(`✅ 出走表URL一覧を保存しました: ${filePath}`);
} catch (err) {
  console.error("❌ エラー:", err.message);
  process.exit(1);
}