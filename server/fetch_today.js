// server/fetch_today.js
// 本日のレース一覧ページ → racelist → 各レース → 選手データ取得

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

async function fetchHTML(url) {
  try {
    const res = await fetch(url);
    return await res.text();
  } catch (e) {
    console.log("❌ fetch失敗:", url, e.message);
    return null;
  }
}

function parseRaceListUrls(html) {
  const $ = cheerio.load(html);
  const urls = [];

  $(".table1 tbody tr").each((i, el) => {
    const a = $(el).find("a");
    if (!a.length) return;

    const href = a.attr("href");
    if (!href) return;

    if (href.includes("racelist")) {
      const full = "https://www.boatrace.jp" + href;
      urls.push(full);
    }
  });

  return urls;
}

function parseRaceLinks(html) {
  const $ = cheerio.load(html);
  const list = [];

  $(".race_table1 tbody tr").each((i, el) => {
    const a = $(el).find("a");
    if (!a.length) return;

    const href = a.attr("href");
    if (!href) return;

    if (href.includes("race?")) {
      list.push("https://www.boatrace.jp/owpc/pc/race/" + href);
    }
  });

  return list;
}

function parseRaceDetail(html) {
  const $ = cheerio.load(html);
  const rows = [];

  $(".table1 tbody tr").each((i, tr) => {
    const tds = $(tr).find("td").map((i, td) =>
      $(td).text().trim()
    ).get();

    if (tds.length >= 8) {
      rows.push({
        waku: tds[0],
        name: tds[1],
        class: tds[2],
        st: tds[3],
        fl: tds[4],
        nat_rate: tds[5],
        local_rate: tds[6],
        motor_rate: tds[7]
      });
    }
  });

  return rows;
}

async function main() {
  const indexHTML = await fetchHTML(INDEX_URL);
  if (!indexHTML) return;

  const listUrls = parseRaceListUrls(indexHTML);

  console.log(`✅ racelist取得: ${listUrls.length}件`);

  const result = [];

  for (const listUrl of listUrls) {
    console.log("🌊 racelist取得中:", listUrl);

    const listHTML = await fetchHTML(listUrl);
    if (!listHTML) continue;

    const raceUrls = parseRaceLinks(listHTML);

    console.log(`   ↳ Rリンク取得: ${raceUrls.length}件`);

    for (const raceUrl of raceUrls) {
      console.log("     🏁 レース取得:", raceUrl);

      const html = await fetchHTML(raceUrl);
      if (!html) continue;

      const rows = parseRaceDetail(html);

      result.push({
        url: raceUrl,
        rows
      });
    }
  }

  fs.writeFileSync("./server/data/racecards.json", JSON.stringify(result, null, 2));
  console.log("📄 データ保存完了: server/data/racecards.json");
}

main();