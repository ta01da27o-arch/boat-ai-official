// server/fetch_playwright.js
import fs from "fs-extra";
import dayjs from "dayjs";
import { chromium } from "playwright";

// ---- 日付決定（環境変数 HD_OFFSET = -1 で前日） ----
const offset = process.env.HD_OFFSET ? Number(process.env.HD_OFFSET) : 0;
const targetDate = dayjs().add(offset, "day").format("YYYYMMDD");

// ---- 全24場番号 ----
const JCD_LIST = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12",
  "13", "14", "15", "16", "17", "18",
  "19", "20", "21", "22", "23", "24"
];

console.log(`📅 取得日: ${targetDate}`);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allData = [];

  for (const jcd of JCD_LIST) {
    const raceListUrl = `https://www.boatrace.jp/owpc/pc/race/index?jcd=${jcd}&hd=${targetDate}`;
    console.log(`🌊 レースリスト：${raceListUrl}`);

    try {
      await page.goto(raceListUrl, { timeout: 20000 });

      // 非開催判定
      const noRace = await page.locator(".noData, .is-noData").count();
      if (noRace > 0) {
        console.log(`⚠ 非開催: jcd=${jcd}`);
        continue;
      }

      // レース番号のリンク取得
      const raceLinks = await page.$$eval(
        ".race_table a",
        (els) => els.map((el) => el.href)
      );

      if (raceLinks.length === 0) {
        console.log(`⚠ レースなし: jcd=${jcd}`);
        continue;
      }

      for (const raceUrl of raceLinks) {
        console.log(`  → 取得: ${raceUrl}`);

        await page.goto(raceUrl, { timeout: 20000 });

        const title = await page.locator(".heading1_title").innerText().catch(() => "");
        const raceName = await page.locator(".heading2_title").innerText().catch(() => "");

        const tableData = await page.$$eval(
          ".table1 tbody tr",
          (rows) =>
            rows.map((tr) => {
              const td = [...tr.querySelectorAll("td")].map((t) => t.innerText.trim());
              return td;
            })
        );

        allData.push({
          jcd,
          date: targetDate,
          raceUrl,
          title,
          raceName,
          detail: tableData,
        });
      }
    } catch (e) {
      console.log(`❌エラー: jcd=${jcd} / ${e.message}`);
    }
  }

  // 保存
  const savePath = `./data/race_${targetDate}.json`;
  await fs.outputJson(savePath, allData, { spaces: 2 });

  console.log(`✅ 完了: ${savePath}`);
  await browser.close();
})();