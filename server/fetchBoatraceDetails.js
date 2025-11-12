import fs from "fs";
import cheerio from "cheerio";
import fetch from "node-fetch";

const links = JSON.parse(fs.readFileSync("./server/data/today_links.json", "utf-8"));
const outputPath = "./server/data/data.json";
const results = [];

console.log("🚀 各場の出走表・結果データを取得中...");

for (const { venueCode, raceUrl, resultUrl } of links) {
  const venueData = { venueCode, date: new Date().toISOString().split("T")[0], races: [] };

  try {
    // 出走表
    const raceHtml = await fetch(raceUrl).then(r => r.text());
    const $ = cheerio.load(raceHtml);
    const raceTitle = $("h2.heading1_title").text().trim() || "不明";
    const raceList = [];

    $("div.table1 table.is-tableFixed tbody tr").each((i, el) => {
      const cols = $(el).find("td");
      if (cols.length >= 5) {
        raceList.push({
          lane: $(cols[0]).text().trim(),
          name: $(cols[1]).text().trim(),
          branch: $(cols[2]).text().trim(),
          class: $(cols[3]).text().trim(),
          st: $(cols[4]).text().trim(),
        });
      }
    });
    venueData.races = raceList;
    venueData.title = raceTitle;

    // 結果
    const resultHtml = await fetch(resultUrl).then(r => r.text());
    const $$ = cheerio.load(resultHtml);
    const resultRows = [];

    $$("div.table1 table.is-tableFixed tbody tr").each((i, el) => {
      const cols = $$(el).find("td");
      if (cols.length >= 5) {
        resultRows.push({
          order: $$(cols[0]).text().trim(),
          name: $$(cols[1]).text().trim(),
          branch: $$(cols[2]).text().trim(),
          class: $$(cols[3]).text().trim(),
          time: $$(cols[4]).text().trim()
        });
      }
    });

    venueData.results = resultRows;

    console.log(`✅ ${raceTitle} (race)：${raceList.length}件 / (result)：${resultRows.length}件`);
    results.push(venueData);

  } catch (err) {
    console.error(`❌ ${venueCode} 取得失敗:`, err.message);
  }
}

fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`📄 データ保存完了: ${outputPath}`);