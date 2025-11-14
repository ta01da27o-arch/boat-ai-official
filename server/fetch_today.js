// fetch_today.js
import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const TODAY = new Date();
const YYYY = TODAY.getFullYear();
const MM = String(TODAY.getMonth() + 1).padStart(2, "0");
const DD = String(TODAY.getDate()).padStart(2, "0");
const DATE = `${YYYY}${MM}${DD}`;
const INDEX_URL = `https://www.boatrace.jp/owpc/pc/race/index?hd=${DATE}`;

console.log(`🚀 本日のレース一覧を取得中: ${INDEX_URL}`);

async function fetchToday() {
  const html = await fetch(INDEX_URL).then(r => r.text());
  const $ = cheerio.load(html);

  // ------------------------------
  // ① indexページの holdList を抽出
  // ------------------------------
  const scriptText = $("script")
    .map((i, el) => $(el).html())
    .get()
    .find((txt) => txt && txt.includes("holdList"));

  if (!scriptText) {
    console.log("❌ holdList が見つかりません");
    return;
  }

  // holdList を JSON として抽出
  const jsonText = scriptText.match(/holdList = (.*?);/)[1];
  const holdList = JSON.parse(jsonText);

  console.log(`🎯 本日開催場: ${holdList.length}場`);

  // ------------------------------
  // ② 各場の出走表 URL を作成する
  // ------------------------------
  const raceUrls = [];

  for (const hold of holdList) {
    const jcd = hold.jcd;
    for (let rno = 1; rno <= 12; rno++) {
      const url = `https://www.boatrace.jp/owpc/pc/race/racelist?rno=${rno}&jcd=${jcd}&hd=${DATE}`;
      raceUrls.push(url);
    }
  }

  console.log(`✅ 出走表URL生成: ${raceUrls.length}件`);

  // ------------------------------
  // ③ 出走表データを取得
  // ------------------------------
  const result = [];

  for (const url of raceUrls) {
    console.log("🌊 取得中:", url);

    try {
      const raceHtml = await fetch(url).then(r => r.text());
      const $$ = cheerio.load(raceHtml);

      // 出走表がないレースはスキップ
      if ($$(".table1").length === 0) continue;

      const rows = [];

      $$(".table1 tbody tr").each((i, row) => {
        const tds = $$(row).find("td");
        if (tds.length < 8) return;

        rows.push({
          lane: $$(tds[0]).text().trim(),
          name: $$(tds[1]).text().trim(),
          class: $$(tds[2]).text().trim(),
          avg_st: $$(tds[3]).text().trim(),
          f_l: $$(tds[4]).text().trim(),
          win_rate: $$(tds[5]).text().trim(),
          local_win_rate: $$(tds[6]).text().trim(),
          motor_win_rate: $$(tds[7]).text().trim()
        });
      });

      result.push({ url, rows });

    } catch (err) {
      console.log("⚠️ 取得失敗:", err.message);
    }
  }

  // 保存
  const savePath = "./server/data/racecards.json";
  fs.writeFileSync(savePath, JSON.stringify(result, null, 2));

  console.log(`📄 出走表保存完了: ${savePath}`);
}

fetchToday();