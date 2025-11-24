// server/fetch_utils.js
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

// ---------------------------------------------
// 基本設定
// ---------------------------------------------
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

// ---------------------------------------------
// retry付きの安全GET
// ---------------------------------------------
export async function safeGet(url, retry = 3) {
  try {
    return await axiosClient.get(url);
  } catch (err) {
    if (retry <= 0)
      throw err;

    console.log(`⚠ retry (${retry}) → ${url}`);
    await wait(3000 + Math.random() * 5000);

    return await safeGet(url, retry - 1);
  }
}

// ---------------------------------------------
// API（JSON/XML取得）
// https://www.boatrace.jp/owpc/pc/m_api/replay?hd=YYYYMMDD
// ---------------------------------------------
export async function fetchHeatsApi(dateStr) {
  const url = `https://www.boatrace.jp/owpc/pc/m_api/replay?hd=${dateStr}`;
  console.log(`🔥 fetchHeatsApi: ${url}`);

  try {
    const res = await safeGet(url);

    const ct = res.headers["content-type"] || "";

    // JSON
    if (ct.includes("json")) {
      return { ok: true, type: "json", data: res.data };
    }

    // XML
    if (ct.includes("xml") || res.data?.startsWith("<?xml")) {
      return { ok: true, type: "xml", data: res.data };
    }

    // 何か別のHTMLなど
    return { ok: false, reason: "unknown-format" };
  } catch (err) {
    return { ok: false, reason: err.message || "api error" };
  }
}

// ---------------------------------------------
// XML → JSON 変換
// ---------------------------------------------
export function parseXmlToJson(xmlStr) {
  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    return parser.parse(xmlStr);
  } catch (err) {
    console.log("⚠ XML parse error:", err.message);
    return null;
  }
}

// ---------------------------------------------
// racelist HTML 取得（JCDごと）
// fetch_all.js が期待するフォーマットで返す
// ---------------------------------------------
export async function fetchRacelistHTML(jcd, dateStr) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${dateStr}`;
  console.log(`🌊 fetchRacelistHTML: ${url}`);

  try {
    const res = await safeGet(url);
    return {
      ok: true,
      body: res.data,
    };
  } catch (err) {
    return {
      ok: false,
      reason: err.message || "request-failed",
    };
  }
}

// ---------------------------------------------
// racelist HTML → racecardリンク抽出
// ---------------------------------------------
export function parseRacelistHTML(html) {
  try {
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const links = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("racecard")) {
        links.push({
          href: "https://www.boatrace.jp" + href,
        });
      }
    });

    return links;
  } catch (err) {
    console.log("⚠ racelist パース失敗:", err.message);
    return [];
  }
}

// ---------------------------------------------
// racecard HTML取得
// ---------------------------------------------
export async function fetchRaceDetailHTML(url) {
  console.log(`📄 fetchRaceDetailHTML: ${url}`);

  try {
    const res = await safeGet(url);
    return {
      ok: true,
      body: res.data,
    };
  } catch (err) {
    return {
      ok: false,
      reason: err.message || "request-failed",
    };
  }
}