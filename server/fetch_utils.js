// server/fetch_utils.js
import axios from "axios";
import * as cheerio from "cheerio";

// --- 共通 ---
export const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const axiosClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
  },
  timeout: 15000,
});

// retry付き GET
export async function safeGet(url, retry = 3) {
  try {
    return await axiosClient.get(url);
  } catch (err) {
    if (retry <= 0) throw err;
    console.log(`⚠ retry (${retry}) → ${url}`);
    await wait(3000 + Math.random() * 5000);
    return await safeGet(url, retry - 1);
  }
}

// --- ★ API（決まり手・展示リプレイなど） ---
export async function fetchHeatsApi(date) {
  const url = `https://www.boatrace.jp/owpc/pc/m_api/replay?hd=${date}`;
  console.log(`🔥 fetchHeatsApi: ${url}`);

  const res = await safeGet(url);
  return res.data; // JSON
}

// --- ★ HTML 取得 ---
export async function fetchRacelistHTML(jcd, date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${date}`;
  console.log(`🌊 fetchRacelistHTML: ${url}`);

  const res = await safeGet(url);
  return res.data;
}

// --- ★ racelist HTML → URL 抽出 ---
export function parseRacelistHTML(html) {
  const $ = cheerio.load(html);
  const result = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("racecard")) {
      result.push("https://www.boatrace.jp" + href);
    }
  });

  return result;
}

// --- ★ レース詳細 HTML ---
export async function fetchRaceDetailHTML(url) {
  console.log(`📄 fetchRaceDetailHTML: ${url}`);
  const res = await safeGet(url);
  return res.data;
}

// --- ★ XML → JSON ---
export function parseXmlToJson(xmlText) {
  try {
    const json = JSON.parse(xmlText);
    return json;
  } catch (err) {
    return null;
  }
}