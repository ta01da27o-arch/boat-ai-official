// server/fetch_day.js
import fs from "fs";
import { getRacecardUrls, fetchRaceDetail } from "./fetch_utils.js";

export async function fetchDay(date, savePath) {
  const allData = [];
  console.log(`\n📅 取得日: ${date}`);

  for (let jcd = 1; jcd <= 24; jcd++) {
    const code = jcd.toString().padStart(2, "0");

    console.log(
      `🌊 racelist: https://www.boatrace.jp/owpc/pc/race/index?jcd=${code}&hd=${date}`
    );

    const urls = await getRacecardUrls(code, date);

    if (urls.length === 0) {
      console.log(`⚠ 非開催または取得不可: jcd=${code}`);
      continue;
    }

    console.log(`🔗 出走表URL数: ${urls.length}`);

    for (const url of urls) {
      const detail = await fetchRaceDetail(url);
      if (detail) allData.push(detail);
    }
  }

  fs.writeFileSync(savePath, JSON.stringify(allData, null, 2));
  console.log(`💾 保存完了: ${savePath}`);
}