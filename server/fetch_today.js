import fs from "fs";
import fetch from "node-fetch";
import { load } from "cheerio";

// 今日の日付
const d = new Date();
const yyyy = d.getFullYear();
const mm = String(d.getMonth() + 1).padStart(2, "0");
const dd = String(d.getDate()).padStart(2, "0");
const today = `${yyyy}${mm}${dd}`;

// 保存先
const OUTPUT = "./server/data/racecards.json";

async function fetchRaceList() {
  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${today}`;
  console.log(`🚀 本日のレース一覧を取得中: ${url}`);

  const res = await fetch(url);
  const html = await res.text();

  const $ = load(html);
  const links = [];

  $(".table1 tbody tr").each((i, el) => {
    const stadium = $(el).find("th").text().trim();
    const href = $(el).find("a").attr("href");

    if (href) {
      links.push({
        stadium,
        url: "https://www.boatrace.jp" + href,
      });
    }
  });

  console.log(`✅ 出走表URL取得: ${links.length}件`);
  return links;
}

async function fetchRace(stadium, url) {
  const res = await fetch(url);
  const html = await res.text();

  const $ = load(html);
  const races = [];

  $(".race_table1").each((i, table) => {
    const title = $(table).find(".title1 h2").text().trim();
    if (!title) return;

    const rows = [];

    $(table)
      .find("tbody tr")
      .each((i, tr) => {
        const tds = $(tr).find("td");

        const entry = {
          waku: $(tds[0]).text().trim(),
          name: $(tds[1]).text().trim(),
          motor: $(tds[2]).text().trim(),
        };

        if (entry.waku) rows.push(entry);
      });

    races.push({ title, entries: rows });
  });

  return { stadium, races };
}

async function main() {
  const list = await fetchRaceList();
  const result = [];

  for (const item of list) {
    console.log(`🌊 取得中: ${item.stadium} ${item.url}`);

    try {
      const data = await fetchRace(item.stadium, item.url);
      console.log(`✅ ${item.stadium}: ${data.races.length}R 取得`);
      result.push(data);
    } catch (e) {
      console.log(`❌ ${item.stadium} 取得失敗: ${e.message}`);
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2));
  console.log(`📄 出走表保存完了: ${OUTPUT}`);
}

main();