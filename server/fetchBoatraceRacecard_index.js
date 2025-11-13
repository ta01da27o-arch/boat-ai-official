import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const BASE_URL = "https://www.boatrace.jp";
const INDEX_URL = `${BASE_URL}/owpc/pc/race/index`;
const OUTPUT_PATH = "./server/data/racecards.json";

async function fetchRaceIndex() {
  console.log(`🚀 本日のレース一覧ページを取得中...`);
  const { data } = await axios.get(INDEX_URL, { timeout: 30000 });
  const $ = cheerio.load(data);
  const raceLinks = [];

  $(".contentsFrame1 table tbody tr").each((_, row) => {
    const raceHref = $(row).find("a").attr("href");
    if (raceHref && raceHref.includes("racelist")) {
      const absUrl = BASE_URL + raceHref;
      raceLinks.push(absUrl);
    }
  });

  console.log(`✅ レースURL取得完了 (${raceLinks.length}件)`);
  return raceLinks;
}

async function fetchRaceDetail(url) {
  try {
    const { data } = await axios.get(url, { timeout: 20000 });
    const $ = cheerio.load(data);

    const title = $(".heading1_titleName").text().trim();
    const date = $(".heading1_date").text().trim();
    const jyo = title.replace("レース", "");

    const races = [];
    $(".table1").each((_, tbl) => {
      const raceTitle = $(tbl).find("caption").text().trim();
      const rows = $(tbl).find("tbody tr");

      const entries = [];
      rows.each((_, tr) => {
        const tds = $(tr).find("td");
        const lane = $(tds[0]).text().trim();
        const name = $(tds[1]).text().trim();
        const branch = $(tds[2]).text().trim();
        if (lane && name) entries.push({ lane, name, branch });
      });

      if (entries.length > 0) {
        races.push({ raceTitle, entries });
      }
    });

    return { jyo, date, url, races };
  } catch (err) {
    console.log(`⚠️ 取得失敗: ${url}`);
    return null;
  }
}

async function main() {
  const raceLinks = await fetchRaceIndex();
  const results = [];

  for (const url of raceLinks) {
    const raceData = await fetchRaceDetail(url);
    if (raceData && raceData.races.length > 0) {
      results.push(raceData);
      console.log(`✅ ${raceData.jyo}: ${raceData.races.length}件`);
    } else {
      console.log(`⚠️ 出走表なし: ${url}`);
    }
    await new Promise((r) => setTimeout(r, 800)); // 負荷軽減
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), "utf-8");
  console.log(`📄 出走表データ保存完了: ${OUTPUT_PATH}`);
}

main().catch((err) => console.error("❌ エラー:", err));