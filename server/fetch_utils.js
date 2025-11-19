// server/fetch_utils.js
import fs from "fs";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

const BASE_URL = "https://www.boatrace.jp";
const DEBUG_DIR = path.resolve("./server/data/debug");
if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });

function writeDebugFile(name, content) {
  try {
    fs.writeFileSync(path.join(DEBUG_DIR, name), content, "utf-8");
  } catch (e) {
    console.warn("debug write failed:", e.message);
  }
}

// 汎用ヘッダ（公式に近づける）
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://www.boatrace.jp/",
};

/**
 * まず公式の heats JSON/XML API を試す。
 * API: /owpc/pc/race/json/heats?hd=YYYYMMDD
 * - JSON が返ればパースして返す
 * - XML が返れば生XML保存して null（後でHTMLフォールバック）
 */
export async function fetchHeatsApi(dateStr) {
  const url = `${BASE_URL}/owpc/pc/race/json/heats?hd=${dateStr}`;
  try {
    const res = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 15000,
      responseType: "text",
      validateStatus: () => true,
    });

    writeDebugFile(`heats_api_${dateStr}.txt`, `URL: ${url}\n\nSTATUS: ${res.status}\n\n${res.data}`);

    // try parse JSON
    try {
      const obj = JSON.parse(res.data);
      return { type: "json", data: obj };
    } catch (e) {
      // not JSON -> maybe XML or HTML; try XML parse
      const xml = res.data;
      if (xml && xml.trim().startsWith("<?xml")) {
        // 保存して返す for debug
        return { type: "xml", data: xml };
      }
      // otherwise treat as unknown
      return { type: "unknown", data: res.data };
    }
  } catch (err) {
    writeDebugFile(`heats_api_error_${dateStr}.txt`, `${url}\n\nERROR: ${err.message}`);
    return null;
  }
}

/**
 * racelist HTML を取得（jcd と日付）
 * HTML 取得時は生データを debug に保存する
 */
export async function fetchRacelistHTML(jcd, dateStr) {
  const url = `${BASE_URL}/owpc/pc/race/racelist?jcd=${jcd}&hd=${dateStr}`;
  try {
    const res = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 20000,
      responseType: "text",
      validateStatus: () => true,
    });

    writeDebugFile(`racelist_jcd${jcd}_${dateStr}.html`, `URL: ${url}\n\nSTATUS: ${res.status}\n\n${res.data}`);

    if (res.status !== 200) return { ok: false, reason: `HTTP ${res.status}`, body: res.data };
    if (!res.data) return { ok: false, reason: "empty", body: res.data };

    // detect "不正なURLへのリクエストです" or other block messages
    if (res.data.includes("不正なURLへのリクエストです") || res.data.includes("異常なアクセス")) {
      return { ok: false, reason: "blocked", body: res.data };
    }

    return { ok: true, body: res.data };
  } catch (err) {
    writeDebugFile(`racelist_err_jcd${jcd}_${dateStr}.txt`, `${url}\n\nERROR: ${err.message}`);
    return { ok: false, reason: err.message };
  }
}

/**
 * racelist HTML から racecard リンクを抽出
 * - javascript: のリンクは除外
 * - racecard パターンを優先して抽出
 */
export function parseRacelistHTML(html) {
  const $ = cheerio.load(html);
  const out = [];

  // 代表的なテーブル領域を幅広く探す（複数パターンに対応）
  // table.table1, .race_list, .m-raceList 等を順にチェック
  const candidates = $("table.table1, .table1, table.race_list, .race_list, .m-raceList, .holdList");

  candidates.each((_, table) => {
    $(table)
      .find("a")
      .each((_, a) => {
        const href = $(a).attr("href");
        if (!href) return;
        const h = href.trim();

        // 除外条件
        if (h.startsWith("javascript:")) return;
        if (h.includes("MultiOpen(")) return;

        // racecard パターンのみ取得
        if (h.includes("/owpc/pc/race/racecard") || h.includes("/owpc/pc/race/index")) {
          const url = h.startsWith("http") ? h : BASE_URL + h;
          const text = $(a).text().trim();
          out.push({ href: url, text });
        }
      });
  });

  // dedupe by href
  const seen = new Set();
  const dedup = [];
  for (const it of out) {
    if (!seen.has(it.href)) {
      seen.add(it.href);
      dedup.push(it);
    }
  }

  return dedup;
}

/**
 * racecard の生HTMLを取得（詳細ページの取得）
 */
export async function fetchRaceDetailHTML(url, tag = "") {
  try {
    const res = await axios.get(url, {
      headers: {
        ...DEFAULT_HEADERS,
        Referer: BASE_URL,
      },
      timeout: 20000,
      responseType: "text",
      validateStatus: () => true,
    });

    // save debug
    const safeName = `racecard_${tag || "unknown"}_${Date.now()}.html`.replace(/[\/\\:?<>|"]/g, "_");
    writeDebugFile(safeName, `URL: ${url}\n\nSTATUS: ${res.status}\n\n${res.data}`);

    if (res.status !== 200) return { ok: false, reason: `HTTP ${res.status}`, body: res.data };
    if (!res.data) return { ok: false, reason: "empty", body: res.data };

    if (res.data.includes("不正なURLへのリクエストです") || res.data.includes("異常なアクセス")) {
      return { ok: false, reason: "blocked", body: res.data };
    }

    return { ok: true, body: res.data };
  } catch (err) {
    writeDebugFile(`racecard_err_${Date.now()}.txt`, `${url}\n\nERROR: ${err.message}`);
    return { ok: false, reason: err.message };
  }
}

/**
 * XML -> JS に変換（fast-xml-parser）
 */
export function parseXmlToJson(xmlStr) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  });
  try {
    return parser.parse(xmlStr);
  } catch (e) {
    return null;
  }
}