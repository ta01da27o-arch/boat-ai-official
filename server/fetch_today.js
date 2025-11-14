import fs from "fs";
import fetch from "node-fetch";
import cheerio from "cheerio";

const TODAY = new Date();
const yyyy = TODAY.getFullYear();
const mm = String(TODAY.getMonth() + 1).padStart(2, "0");
const dd = String(TODAY.getDate()).padStart(2, "0");
const dateStr = `${yyyy}${mm}${dd}`;

const INDEX_URL = "https://www.boatrace.jp/owpc/pc/main";

console.log(`🚀 本日の出走表取得開始 (${dateStr})`);

async function fetchTodayRaceLinks() {
  const res = await fetch(INDEX_URL);
  const html = await res.text();

  const $ = cheerio.load(html);
  const urls = [];

  $(".main_race_info .list_race a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("racelist")) {
      urls.push("https://www.boatrace.jp" + href);
    }
  });

  console.log(`📌 本日のレースURL数: ${urls.length}`);
  return urls;
}

async function fetchRacecard(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const jcd = url.match(/jcd=(\d+)/)?.[1] ?? "??";

    const races = [];

    $(".table1").each((_, el) => {
      const raceNo = $(el).find(".th_title span").text().trim();
      if (!raceNo) return;

      const items = [];
      $(el)
        .find("tbody tr")
        .each((_, tr) => {
          const tds = $(tr).find("td");
          const name = $(tds[2]).text().trim();
          const nation = $(tds[3]).text().trim();
          if (name) items.push({ name, nation });
        });

      races.push({ raceNo, items });
    });

    console.log(`✅ ${jcd}: ${races.length}R 取得`);

    return {
      jcd,
      url,
      date: dateStr,
      races,
    };
  } catch (e) {
    console.log(`❌ 取得失敗: ${url}`);
    return null;
  }
}

async function main() {
  const urls = await fetchTodayRaceLinks();
  const results = [];

  for (const url of urls) {
    const d = await fetchRacecard(url);
    if (d) results.push(d);
  }

  fs.writeFileSync(
    "./server/data/racecards.json",
    JSON.stringify(results, null, 2),
    "utf-8"
  );

  console.log("📄 保存完了: ./server/data/racecards.json");
}

main();