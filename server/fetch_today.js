// fetch_today.js
import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const TODAY = new Date();
const YYYY = TODAY.getFullYear();
const MM = String(TODAY.getMonth() + 1).padStart(2, "0");
const DD = String(TODAY.getDate()).padStart(2, "0");
const DATE = `${YYYY}${MM}${DD}`;

// ★ 本日の開催場 API
const HOLD_API = `https://www.boatrace.jp/owpc/pc/race/json/heats?hd=${DATE}`;

console.log(`🚀 本日の開催場APIを取得中: ${HOLD_API}`);

async function fetchToday() {
  let heatsJson;

  try {
    heatsJson = await fetch(HOLD_API).then(r => r.json());
  } catch (err) {
    console.log("❌ 開催場API取得失敗:", err.message);
    return;
  }

  const heats = heatsJson.heats || [];
  console.log(`🎯 本日開催場: ${heats.length}場`);

  if (heats.length === 0) {
    console.log("⚠️ 本日の開催場がありません");
    return;
  }

  // 出走表URL生成
  const raceUrls = [];
  for (const h of heats) {
    const jcd = h.jcd;

    for (let rno = 1; rno <= 12; rno++) {
      const url = `https://www.boatrace.jp/owpc/pc/race/racelist?rno=${rno}&jcd=${jcd}&hd=${DATE}`;
      raceUrls.push(url);
    }
  }

  console.log(`✅ 出走表URL生成: ${raceUrls.length}件`);

  const result = [];

  // 取得開始
  for (const url of raceUrls) {
    console.log("🌊 取得中:", url);

    try {
      const html = await fetch(url).then(r => r.text());
      const $ = cheerio.load(html);

      if ($(".table1").length === 0) continue;

      const rows = [];

      $(".table1 tbody tr").each((i, row) => {
        const tds = $(row).find("td");
        if (tds.length < 8) return;

        rows.push({
          lane: $(tds[0]).text().trim(),
          name: $(tds[1]).text().trim(),
          class: $(tds[2]).text().trim(),
          avg_st: $(tds[3]).text().trim(),
          f_l: $(tds[4]).text().trim(),
          win_rate: $(tds[5]).text().trim(),
          local_win_rate: $(tds[6]).text().trim(),
          motor_win_rate: $(tds[7]).text().trim(),
        });
      });

      result.push({ url, rows });
    } catch (err) {
      console.log("⚠️ 取得失敗:", err.message);
    }
  }

  const savePath = "./server/data/racecards.json";
  fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
  console.log(`📄 出走表保存完了: ${savePath}`);
}

fetchToday();