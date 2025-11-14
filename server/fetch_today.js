// fetch_today.js
import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const TODAY = new Date();
const YYYY = TODAY.getFullYear();
const MM = String(TODAY.getMonth() + 1).padStart(2, "0");
const DD = String(TODAY.getDate()).padStart(2, "0");
const DATE = `${YYYY}${MM}${DD}`;

// 開催場API（JSON or XML）
const HOLD_API = `https://www.boatrace.jp/owpc/pc/race/json/heats?hd=${DATE}`;

console.log(`🚀 開催場API取得: ${HOLD_API}`);

async function fetchToday() {
  let apiText;

  try {
    apiText = await fetch(HOLD_API).then(r => r.text());
  } catch (err) {
    console.log("❌ API取得通信エラー:", err.message);
    return;
  }

  let heats = [];

  // -----------------------------
  // 判定：JSON か XML か
  // -----------------------------
  if (apiText.trim().startsWith("{")) {
    // JSON開催
    try {
      const json = JSON.parse(apiText);
      heats = json.heats || [];
      console.log(`🎯 開催場( JSON ): ${heats.length} 場`);
    } catch (err) {
      console.log("❌ JSON解析エラー:", err.message);
      return;
    }
  } else {
    // XML → 本日開催なし
    console.log("⚠️ 本日は開催がありません（APIがXMLを返しました）");
    heats = [];
  }

  if (heats.length === 0) {
    console.log("📌 今日はレースなし → 取得処理をスキップします");
    
    fs.writeFileSync("./server/data/racecards.json", JSON.stringify([], null, 2));
    console.log("📄 空データを保存しました");
    return;
  }

  // -----------------------------
  // 開催あり → 出走表URL生成
  // -----------------------------
  const raceUrls = [];
  for (const h of heats) {
    const jcd = h.jcd;
    for (let rno = 1; rno <= 12; rno++) {
      raceUrls.push(
        `https://www.boatrace.jp/owpc/pc/race/racelist?rno=${rno}&jcd=${jcd}&hd=${DATE}`
      );
    }
  }

  console.log(`📌 出走表URL: ${raceUrls.length} 件`);

  const result = [];

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
      console.log("⚠️ 出走表取得エラー:", err.message);
    }
  }

  fs.writeFileSync("./server/data/racecards.json", JSON.stringify(result, null, 2));
  console.log("📄 出走表保存完了");
}

fetchToday();