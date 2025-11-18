// server/fetch_utils.js
import axios from "axios";
import * as cheerio from "cheerio";

export async function fetchRacelistHTML(jcd, date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${date}`;

  try {
    const res = await axios.get(url, { timeout: 15000 });
    return res.data;
  } catch (err) {
    return null;
  }
}

export async function fetchRaceDetailHTML(url) {
  try {
    const res = await axios.get(url, { timeout: 15000 });
    return res.data;
  } catch (err) {
    return null;
  }
}

// racelist → 各詳細URL 抽出
export function parseRacelistHTML(html) {
  const $ = cheerio.load(html);
  const links = [];

  $(".table1 a").each((i, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("racedata")) {
      links.push("https://www.boatrace.jp" + href);
    }
  });

  return links;
}