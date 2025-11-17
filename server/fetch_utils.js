// server/fetch_utils.js
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

export async function fetchXML(url) {
  try {
    const res = await axios.get(url, { timeout: 8000 });
    if (res.headers["content-type"]?.includes("xml")) {
      return res.data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchHTML(url) {
  try {
    const res = await axios.get(url, { timeout: 8000 });
    return res.data;
  } catch {
    return null;
  }
}

export async function getRacecardUrls(jcd, date) {
  const xmlUrl = `https://www.boatrace.jp/owpc/pc/race/xml/racelist?jcd=${jcd}&hd=${date}`;
  const htmlUrl = `https://www.boatrace.jp/owpc/pc/race/index?jcd=${jcd}&hd=${date}`;

  const xmlData = await fetchXML(xmlUrl);
  if (xmlData) {
    const urls = [...xmlData.matchAll(/<url>(.*?)<\/url>/g)].map(m => m[1]);
    if (urls.length > 0) return urls;
  }

  const html = await fetchHTML(htmlUrl);
  if (!html) return [];

  const $ = cheerio.load(html);
  const urls = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/owpc/pc/race/racecard")) {
      urls.push("https://www.boatrace.jp" + href);
    }
  });

  return urls;
}

export async function fetchRaceDetail(url) {
  try {
    const html = await fetchHTML(url);
    if (!html) return null;

    const $ = cheerio.load(html);

    const title = $(".heading1_title").text().trim();

    const players = [];
    $(".table1 tbody tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length >= 6) {
        players.push({
          lane: $(tds[0]).text().trim(),
          name: $(tds[1]).text().trim(),
          reg: $(tds[2]).text().trim(),
        });
      }
    });

    return { url, title, players };
  } catch {
    return null;
  }
}