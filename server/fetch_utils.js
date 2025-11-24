// server/fetch_utils.js
import axios from "axios";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

// =======================
// 共通ユーティリティ
// =======================
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

// 安全GET（retry付き）
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

// =======================
// Racelist HTML 取得
// =======================
export async function fetchRacelistHTML(jcd, date) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${date}`;
  console.log(`🌊 fetchRacelistHTML: ${url}`);
  try {
    const res = await safeGet(url);
    return { ok: true, body: res.data };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// Racelist HTML 解析 → racecard リンク一覧
export function parseRacelistHTML(html) {
  try {
    const $ = cheerio.load(html);
    const links = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("racecard")) {
        links.push({ href: "https://www.boatrace.jp" + href });
      }
    });
    return links;
  } catch (err) {
    console.log("⚠ racelist パース失敗:", err.message);
    return [];
  }
}

// =======================
// Racecard HTML 取得
// =======================
export async function fetchRaceDetailHTML(url, jcd = "") {
  console.log(`▶ fetchRaceDetailHTML: ${url}`);
  try {
    const res = await safeGet(url);
    if (!res) return { ok: false, reason: "no response" };
    return { ok: true, body: res.data };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// =======================
// API 取得 (JSON or XML)
// =======================
export async function fetchHeatsApi(date) {
  const url = `https://www.boatrace.jp/owpc/pc/m_api/replay?hd=${date}`;
  console.log(`🔥 fetchHeatsApi: ${url}`);
  try {
    const res = await safeGet(url);
    const data = res.data;
    if (typeof data === "object") return { type: "json", data };
    if (typeof data === "string" && data.trim().startsWith("<?xml")) {
      return { type: "xml", data };
    }
    return { type: "unknown", data };
  } catch (err) {
    console.log("⚠ fetchHeatsApi 取得失敗:", err.message);
    return null;
  }
}

// =======================
// XML → JSON 変換
// =======================
export function parseXmlToJson(xmlString) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    return parser.parse(xmlString);
  } catch (err) {
    console.log("⚠ XMLパース失敗:", err.message);
    return null;
  }
}