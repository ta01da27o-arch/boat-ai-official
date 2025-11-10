// server/fetchBoatraceLinks.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio"; // ✅ ← 修正点

const BASE_URL = "https://www.boatrace.jp";
const TODAY_URL = `${BASE_URL}/owpc/pc/race/index`;

console.log("🚀 本日の出走表URL一覧を取得中...");

const res = await fetch(TODAY_URL);
const html = await res.text();
const $ = cheerio.load(html);

const links = [];

$("a[href*='/race/racelist?jcd=']").each((_, a) => {
  const href = $(a).attr("href");
  const name = $(a).text().trim();
  if (href && name) {
    links.push({
      name,
      url: BASE_URL + href,
    });
  }
});

if (!fs.existsSync("data")) fs.mkdirSync("data");

const filePath = path.resolve("data/today_links.json");
fs.writeFileSync(filePath, JSON.stringify(links, null, 2), "utf-8");

console.log(`✅ 出走表URL一覧を保存しました: ${filePath}`);
