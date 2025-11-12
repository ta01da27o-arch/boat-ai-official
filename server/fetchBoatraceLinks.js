// server/fetchBoatraceLinks.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.boatrace.jp";
const TODAY_URL = `${BASE_URL}/owpc/pc/race/index`;

console.log("🚀 本日の出走表・結果URL一覧を取得中...");

try {
  const res = await fetch(TODAY_URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const links = [];

  $("a").each((_, a) => {
    const href = $(a).attr("href");
    const text = $(a).text().trim();

    if (!href) return;

    // 出走表ページ
    if (href.includes("/raceindex?jcd=") && href.includes("&hd=")) {
      links.push({
        type: "race",
        name: text || "出走表",
        url: href.startsWith("http") ? href : BASE_URL + href,
      });
    }

    // 結果ページ
    if (href.includes("/raceresult?jcd=") && href.includes("&hd=")) {
      links.push({
        type: "result",
        name: text || "結果",
        url: href.startsWith("http") ? href : BASE_URL + href,
      });
    }
  });

  // 重複削除
  const unique = Array.from(
    new Map(links.map((l) => [l.url, l])).values()
  );

  if (!fs.existsSync("server/data")) fs.mkdirSync("server/data", { recursive: true });
  const filePath = path.resolve("server/data/today_links.json");
  fs.writeFileSync(filePath, JSON.stringify(unique, null, 2), "utf-8");

  console.log(`✅ 出走表・結果URLを保存しました (${unique.length}件): ${filePath}`);
} catch (err) {
  console.error("❌ エラー:", err.message);
  process.exit(1);
}