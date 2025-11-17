// server/fetch_racecard.js
// racecard（HTML詳細ページ）の情報を取得して構造化する

import axios from "axios";
import * as cheerio from "cheerio";

export async function fetchRacecardDetail(url) {
  const html = await axios.get(url).then(r => r.data);
  const $ = cheerio.load(html);

  const title = $(".heading1_title").text().trim();
  const raceNo = $(".heading2_title span").text().trim();

  const players = [];

  $(".is-tableFixed__1stAdd tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");

    const num = $(tds[0]).text().trim();
    const name = $(tds[1]).text().trim();
    const branch = $(tds[2]).text().trim();
    const motor = $(tds[4]).text().trim();

    players.push({
      number: num,
      name,
      branch,
      motor
    });
  });

  return {
    url,
    title,
    raceNo,
    players
  };
}