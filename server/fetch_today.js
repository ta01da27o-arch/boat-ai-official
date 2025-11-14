// server/fetch_today.js
import fs from "fs";
import cheerio from "cheerio";
import fetch from "node-fetch";

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const dateStr = `${yyyy}${mm}${dd}`;

const LIST_URL =
  `https://www.boatrace.jp/owpc/pc/race/index?hd=${dateStr}`;

console.log("🚀 本日のレース一覧を取得中:", LIST_URL);

async function fetchRaceList() {
  const html = await (await fetch(LIST_URL)).text();
  const $ = cheerio.load(html);

  const raceUrls = [];

  // raceindex の URL だけ拾う（ここが重要）
  $("a[href*='raceindex']").each((i, el) => {
    let href = $(el).attr("href");
    if (!href) return;

    // 相対パスを絶対URLに変換
    if (href.startsWith("/")) {
      href = `https://www.boatrace.jp${href}`;
    }

    // raceindex のみ追加
    if (href.includes("raceindex")) {
      raceUrls.push(href);
    }
  });

  console.log(`✅ 出走表URL取得: ${raceUrls.length}件`);
  return raceUrls;
}

// 個々の出走表を取得
async function fetchRacecard(url) {
  try {
    const html = await (await fetch(url)).text();
    const $ = cheerio.load(html);

    const title = $(".heading1_title").text().trim() || "不明";

    const races = [];
    $(".race_table1").each((i, table) => {
      const race = {
        number: i + 1,
        rows: []
      };

      $(table)
        .find("tbody tr")
        .each((_, tr) => {
          const tds = $(tr)
            .find("td")
            .map((_, td) => $(td).text().trim())
            .get();
          if (tds.length > 0) race.rows.push(tds);
        });

      races.push(race);
    });

    return { url, title, races };
  } catch (e) {
    console.log("❌ 取得失敗:", url, e.message);
    return null;
  }
}

async function main() {
  const urls = await fetchRaceList();

  const racecards = [];
  for (const url of urls) {
    console.log("🌊 取得中:", url);
    const data = await fetchRacecard(url);
    if (data && data.races.length > 0) {
      racecards.push(data);
    }
  }

  fs.writeFileSync(
    "./server/data/racecards.json",
    JSON.stringify(racecards, null, 2)
  );

  console.log("📄 出走表保存完了: ./server/data/racecards.json");
}

main();