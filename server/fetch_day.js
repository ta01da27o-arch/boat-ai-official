// fetch_day.js
// 任意の日付の「racelist → 各レース詳細」を全取得して保存

import fs from "fs";
import * as cheerio from "cheerio";
import axios from "axios";
import { getRacelistUrls } from "./fetch_utils.js";
import { parseRacecard } from "./parseRacecard.js";

const BOAT_COURSES = [...Array(24).keys()].map(i => String(i + 1).padStart(2, "0"));

export async function fetchDay(targetDate, savePath) {
  console.log(`\n📅 取得開始: ${targetDate} → ${savePath}\n`);

  const allRaceDetailUrls = [];

  // ① 全場の racelist を確認
  for (const jcd of BOAT_COURSES) {
    console.log(`🌊 racelist確認: jcd=${jcd}`);
    const urls = await getRacelistUrls(jcd, targetDate);

    if (urls.length === 0) continue;

    allRaceDetailUrls.push(...urls);
  }

  console.log(`🔗 racelist URL数: ${allRaceDetailUrls.length}`);

  const results = [];

  // ② racelist ページから「各レース詳細ページ」取得
  for (const url of allRaceDetailUrls) {
    console.log(`📄 racelist取得: ${url}`);
    try {
      const html = await axios.get(url).then(r => r.data);
      const $ = cheerio.load(html);

      $("a").each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.includes("/pc/race/racecard")) {
          const full = "https://www.boatrace.jp" + href;
          results.push(full);
        }
      });

    } catch (err) {
      console.log("❌ racelist取得失敗:", err.message);
    }
  }

  console.log(`🏁 racecard URL数: ${results.length}`);

  const raceData = [];

  // ③ 各レース詳細を取得
  for (const url of results) {
    console.log(`🚤 racecard取得: ${url}`);
    try {
      const html = await axios.get(url).then(r => r.data);
      const $ = cheerio.load(html);

      const data = parseRacecard($);
      raceData.push({ url, data });
    } catch (err) {
      console.log("❌ racecard取得失敗:", err.message);
    }
  }

  // ④ 保存
  fs.writeFileSync(savePath, JSON.stringify(raceData, null, 2));
  console.log(`💾 保存完了: ${savePath}`);
}