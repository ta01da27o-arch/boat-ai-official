// server/fetch_utils.js
import axios from "axios";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

export const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const axiosClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
  },
  timeout: 15000,
});

export async function safeGet(url, retry = 3) {
  try {
    return await axiosClient.get(url);
  } catch (err) {
    if (retry <= 0) return null;
    console.log(`⚠ retry (${retry}) → ${url}`);
    await wait(2000 + Math.random() * 2000);
    return await safeGet(url, retry - 1);
  }
}

// ---------------------------
// racelist HTML
// ---------------------------
export async function fetchRacelistHTML(jcd, date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${date}`;
  console.log(`🌊 fetchRacelistHTML: ${url}`);

  const res = await safeGet(url);
  if (!res) return { ok: false, reason: "no response" };

  return { ok: true, body: res.data };
}

// ---------------------------
// racelist HTML パース
// ---------------------------
export function parseRacelistHTML(html) {
  try {
    const $ = cheerio.load(html);
    const links = [];

    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      if (href.includes("racecard")) {
        links.push({ href: "https://www.boatrace.jp" + href });
      }
    });

    return links;
  } catch (e) {
    console.log("⚠ racelist パース失敗:", e.message);
    return [];
  }
}

// ---------------------------
// XML → JSON
// ---------------------------
export function parseXmlToJson(xml) {
  try {
    const parser = new XMLParser();
    return parser.parse(xml);
  } catch (e) {
    return null;
  }
}

// ---------------------------
// API fetch（XML/JSON 混在対応）
// ---------------------------
export async function fetchHeatsApi(date) {
  const url = `https://www.boatrace.jp/owpc/pc/m_api/replay?hd=${date}`;
  console.log("🔥 fetchHeatsApi:", url);

  const res = await safeGet(url);
  if (!res) return null;

  const ct = res.headers["content-type"] || "";

  if (ct.includes("json")) return { type: "json", data: res.data };
  if (ct.includes("xml")) return { type: "xml", data: res.data };

  if (res.data.trim().startsWith("<")) return { type: "xml", data: res.data };

  return { type: "unknown", data: res.data };
}