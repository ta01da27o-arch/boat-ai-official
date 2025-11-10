// server/fetchBoatraceLinks.js
// 各場の「本日の出走表」ページURLを公式サイトから収集して保存
// 保存先: data/today_links.json

import fs from "fs";
import fetch from "node-fetch";
import cheerio from "cheerio";

const BASE_URL = "https://www.boatrace.jp";
const LIST_URL = `${BASE_URL}/owpc/pc/race/index`;

async function fetchRaceLinks() {
  console.log("🚀 各場の出走表リンクを取得中...");

  try {
    const res = await fetch(LIST_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const links = [];

    // .contentsFrame1Link a には「本日開催中の場」リンクが一覧で存在
    $(".contentsFrame1Link a").each((i, el) => {
      const href = $(el).attr("href");
      const name = $(el).text().trim();
      if (href && href.includes("/race/")) {
        links.push({
          id: i + 1,
          name,
          url: BASE_URL + href,
        });
      }
    });

    if (!fs.existsSync("data")) fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/today_links.json", JSON.stringify(links, null, 2));

    console.log(`✅ ${links.length} 場分のURLを保存しました → data/today_links.json`);
  } catch (err) {
    console.error("❌ エラー:", err.message);
  }
}

// 実行
fetchRaceLinks();
