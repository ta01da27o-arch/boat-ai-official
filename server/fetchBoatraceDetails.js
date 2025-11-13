import fs from "fs";
import { chromium } from "playwright";

const LINKS_PATH = "./server/data/today_links.json";
const OUTPUT_PATH = "./server/data/data.json";

if (!fs.existsSync(LINKS_PATH)) {
  console.error("❌ today_links.json が見つかりません。先に fetch-links を実行してください。");
  process.exit(1);
}

const links = JSON.parse(fs.readFileSync(LINKS_PATH, "utf-8"));
const allData = [];

console.log("🚀 各場の【出走表データのみ】を取得中...");

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();

for (const [i, { venueCode, raceUrl }] of links.entries()) {
  const venue = { venueCode, title: "", races: [] };

  try {
    await page.goto(raceUrl, {
      timeout: 90000,
      waitUntil: "networkidle",
    });

    // 出走表が表示されるまで待つ（最大20秒）
    await page.waitForSelector("table.is-tableFixed__typeA1 tbody tr", {
      timeout: 20000,
    });

    // タイトル取得
    venue.title =
      (await page.textContent("h2.heading1_title, h3.title").catch(() => ""))?.trim() || "不明";

    // 出走表テーブルの内容を抽出
    const raceRows = await page.$$eval("table.is-tableFixed__typeA1 tbody tr", (rows) =>
      rows.map((r) => {
        const tds = [...r.querySelectorAll("td")].map((td) => td.textContent.trim());
        return {
          lane: tds[0] || "",
          name: tds[1] || "",
          branch: tds[2] || "",
          class: tds[3] || "",
          st: tds[4] || "",
        };
      })
    );

    venue.races = raceRows.filter((r) => r.name);
    console.log(`✅ ${String(i + 1).padStart(2, "0")}: 出走表(${venue.races.length})件`);

    allData.push(venue);
  } catch (e) {
    console.error(`❌ ${venueCode} 取得失敗: ${e.message}`);
  }

  await new Promise((r) => setTimeout(r, 2000)); // 各場間に休憩
}

await browser.close();
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
console.log(`📄 出走表データ保存完了: ${OUTPUT_PATH}`);