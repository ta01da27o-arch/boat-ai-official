// server/fetch_racelist.js
// racelist（XML）を API 取得 → 開催場だけ racecard URL を返す

import axios from "axios";
import xml2js from "xml2js";

export async function fetchRacelist(date) {
  const racecardUrls = [];
  const parser = new xml2js.Parser();

  console.log(`\n🚀 racelist XML を取得開始: ${date}`);

  for (let jcd = 1; jcd <= 24; jcd++) {
    const jcdStr = String(jcd).padStart(2, "0");
    const url = `https://www.boatrace.jp/owpc/pc/race/xml/racelist?jcd=${jcdStr}&hd=${date}`;

    console.log(`🌊 racelist: ${url}`);

    try {
      const xml = await axios.get(url, { timeout: 7000 }).then(r => r.data);
      const json = await parser.parseStringPromise(xml);

      const hold = json?.jpct_racelist?.Hold?.[0];

      if (!hold) {
        console.log(`⚠ 非開催: jcd=${jcdStr}`);
        continue;
      }

      const races = hold.RaceInfo || [];
      races.forEach(r => {
        const no = r.$?.raceno;
        racecardUrls.push(
          `https://www.boatrace.jp/owpc/pc/race/racecard?jcd=${jcdStr}&hd=${date}&rno=${no}`
        );
      });

    } catch (e) {
      console.log(`⚠ 非開催または取得不可: jcd=${jcdStr}`);
    }
  }

  return racecardUrls;
}