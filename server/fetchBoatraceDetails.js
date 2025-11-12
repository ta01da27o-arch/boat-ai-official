import fs from "fs";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

const LINKS_PATH = "./server/data/today_links.json";
const OUTPUT_PATH = "./server/data/data.json";

if (!fs.existsSync("./server/data")) fs.mkdirSync("./server/data", { recursive: true });
if (!fs.existsSync(LINKS_PATH)) {
  console.error("❌ today_links.json が見つかりません。先に fetch-links を実行してください。");
  process.exit(1);
}

const links = JSON.parse(fs.readFileSync(LINKS_PATH, "utf-8"));
const results = [];

console.log("🚀 各場の出走表・結果データを取得中...");

// 再試行付きフェッチ
async function safeFetch(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { timeout: 20000 });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      if (html.includes("<html")) return html;
    } catch (err) {
      console.warn(`⚠️ Fetch失敗(${i + 1}/${retries}): ${url} → ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error(`3回リトライしても取得できません: ${url}`);
}

// メイン処理
for (const [index, { venueCode, raceUrl, resultUrl }] of links.entries()) {
  const venueData = {
    venueCode,
    date: new Date().toISOString().split("T")[0],
    title: "",
    races: [],
    results: []
  };

  try {
    const raceHtml = await safeFetch(raceUrl);
    const $ = cheerio.load(raceHtml);

    // タイトル（レース名）
    const raceTitle =
      $("h2.heading1_title").text().trim() ||
      $("h3.title").text().trim() ||
      $("title").text().trim();
    venueData.title = raceTitle || "不明";

    // 出走表テーブル（新旧両対応）
    const raceTable = $("table.is-tableFixed")
      .add("table.table1-res")
      .add("table.table1");

    raceTable.find("tbody tr").each((i, el) => {
      const cols = $(el).find("td");
      if (cols.length >= 5) {
        venueData.races.push({
          lane: $(cols[0]).text().trim(),
          name: $(cols[1]).text().trim(),
          branch: $(cols[2]).text().trim(),
          class: $(cols[3]).text().trim(),
          st: $(cols[4]).text().trim()
        });
      }
    });

    // 結果ページ
    const resultHtml = await safeFetch(resultUrl);
    const $$ = cheerio.load(resultHtml);
    const resultTable = $$("table.is-tableFixed")
      .add("table.table1-res")
      .add("table.table1");

    resultTable.find("tbody tr").each((i, el) => {
      const cols = $$(el).find("td");
      if (cols.length >= 5) {
        venueData.results.push({
          order: $$(cols[0]).text().trim(),
          name: $$(cols[1]).text().trim(),
          branch: $$(cols[2]).text().trim(),
          class: $$(cols[3]).text().trim(),
          time: $$(cols[4]).text().trim()
        });
      }
    });

    console.log(
      `✅ ${String(index + 1).padStart(2, "0")}: 出走表(${venueData.races.length})件 / 結果(${venueData.results.length})件`
    );

    results.push(venueData);
    await new Promise(r => setTimeout(r, 1500)); // アクセス間隔

  } catch (err) {
    console.error(`❌ ${venueCode} 取得失敗: ${err.message}`);
  }
}

// 保存
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), "utf-8");
console.log(`📄 データ保存完了: ${OUTPUT_PATH}`);