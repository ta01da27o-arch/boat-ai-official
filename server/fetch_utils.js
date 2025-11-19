import axios from "axios";
import * as cheerio from "cheerio";

export async function fetchRacelistHTML(jcd, date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/index?jcd=${jcd}&hd=${date}`;
  try {
    const res = await axios.get(url, { timeout: 10000 });
    return res.data;
  } catch {
    return null;
  }
}

export async function fetchRacecardHTML(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    return res.data;
  } catch {
    return null;
  }
}

export async function fetchRaceDetailHTML(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    return res.data;
  } catch {
    return null;
  }
}

// racelist HTML → racecard URL を抽出
export function parseRacelistHTML(html) {
  const $ = cheerio.load(html);
  const out = [];

  $(".table1 tbody tr").each((_, tr) => {
    const a = $(tr).find("a");
    const href = a.attr("href");

    if (!href) return;

    const url = "https://www.boatrace.jp" + href;
    const raceno = $(tr).find("th").text().trim();
    const title = $(tr).find("td").eq(0).text().trim();

    out.push({ raceno, title, url });
  });

  return out;
}