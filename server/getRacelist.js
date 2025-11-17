// server/getRacelist.js
import axios from "axios";
import * as cheerio from "cheerio";

export async function fetchRacelist(jcd, date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${date}`;
  console.log(`🌊 racelist: ${url}`);

  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (res.headers["content-type"]?.includes("xml") || res.data.startsWith("<?xml")) {
    console.log(`⚠ 非開催: jcd=${jcd}`);
    return [];
  }

  const $ = cheerio.load(res.data);
  const result = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("racecard")) {
      result.push("https://www.boatrace.jp" + href);
    }
  });

  return result;
}