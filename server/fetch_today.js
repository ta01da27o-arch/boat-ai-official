// fetch_today.js
// 本日のレース一覧ページから出走表URLを抽出して取得する

import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";  // ← ★ 修正ポイント

const TODAY = new Date();
const YYYY = TODAY.getFullYear();
const MM = String(TODAY.getMonth() + 1).padStart(2, "0");
const DD = String(TODAY.getDate()).padStart(2, "0");
const DATE = `${YYYY}${MM}${DD}`;

const INDEX_URL = `https://www.boatrace.jp/owpc/pc/race/index?hd=${DATE}`;

console.log(`🚀 本日のレース一覧を取得中: ${INDEX_URL}`);

async function fetchToday() {
  const result = [];

  // -----------------------------
  // ① レース一覧ページを取得
  // -----------------------------
  const html = await fetch(INDEX_URL).then(r => r.text());
  const $ = cheerio.load(html);

  const urls = [];

  $(".table1").find("tbody tr").each((i, el) => {
    const a = $(el).find("a");
    if (!a.length) return;

    const href = a.attr("href");
    if (!href) return;

    if (href.includes("racelist")) {
      const full = "https://www.boatrace.jp" + href;
      urls.push(full);
    }
  });

  console.log(`✅ 出走表URL取得: ${urls.length}件`);

  // -----------------------------
  // ② 各出走表ページを取得
  // -----------------------------
  for (const url of urls) {
    console.log("🌊 取得中: ", url);

    try {
      const page = await fetch(url).then(r => r.text());
      const $$ = cheerio.load(page);

      const races = [];

      // R番号一覧
      $$(".tab4_body").each((i, raceEl) => {
        const title = $$(raceEl).find(".race_title").text().trim();
        if (!title) return;

        const table = $$(raceEl).find(".table1");
        const rows = [];

        table.find("tbody tr").each((i, row) => {
          const cols = $$(row).find("td").map((i, td) =>
            $$(td).text().trim()
          ).get();
          rows.push(cols);
        });

        races.push({ title, rows });
      });

      result.push({
        url,
        races
      });

    } catch (err) {
      console.log("❌  取得失敗:", err.message);
    }
  }

  // -----------------------------
  // ③ 保存
  // -----------------------------
  const savePath = "./server/data/racecards.json";
  fs.writeFileSync(savePath, JSON.stringify(result, null, 2));

  console.log(`📄 出走表保存完了: ${savePath}`);
}

fetchToday();