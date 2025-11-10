import fs from "fs";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

const inputFile = "./data/today_links.json";
const outputFile = "./data/today.json";

async function fetchHTML(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function parseRacePage(url, stadium, rno) {
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  const entries = [];
  $(".is-fs12").each((i, el) => {
    const cells = $(el).find("td");
    if (cells.length < 8) return;

    const boat = $(cells[0]).text().trim();
    const player = $(cells[1]).text().trim();
    const klass = $(cells[2]).text().trim();
    const st = $(cells[3]).text().trim();
    const motor = $(cells[4]).text().trim();
    const nation = $(cells[5]).text().trim();
    const local = $(cells[6]).text().trim();

    entries.push({ boat, player, klass, st, motor, nation, local });
  });

  return {
    race_no: rno,
    stadium,
    entries
  };
}

async function fetchBoatraceDetails() {
  console.log("🚀 各場の出走表詳細を取得中...");

  if (!fs.existsSync(inputFile)) {
    console.error("❌ 出走表URL一覧(today_links.json)が見つかりません。");
    return;
  }

  const links = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  const results = [];

  for (const item of links) {
    const { stadium, url } = item;

    console.log(`🏁 ${stadium} 取得中...`);

    for (let rno = 1; rno <= 12; rno++) {
      const detailUrl = url.replace(/rno=\d+/, `rno=${rno}`);
      try {
        const raceData = await parseRacePage(detailUrl, stadium, rno);
        results.push(raceData);
        await new Promise((r) => setTimeout(r, 500)); // サーバー負荷軽減
      } catch (e) {
        console.warn(`⚠️ ${stadium} ${rno}R 取得失敗: ${e.message}`);
      }
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), "utf-8");
  console.log(`✅ 完了。${results.length}件の出走表を保存しました。`);
  console.log(`📁 保存先: ${outputFile}`);
}

fetchBoatraceDetails();
