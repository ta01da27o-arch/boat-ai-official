// server/fetch_utils.js
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";

// ---- 設定 ----
const BASE_XML = "https://www.boatrace.jp/owpc/pc/race/racelist_xml";
const BASE_HTML = "https://www.boatrace.jp/owpc/pc/race/racelist";
const DETAIL_HTML = "https://www.boatrace.jp/owpc/pc/race/racedata";

/**
 * XML racelist を取得
 */
export async function fetchRaceListXML(jcd, dateStr) {
  const url = `${BASE_XML}?jcd=${jcd}&hd=${dateStr}`;
  try {
    const res = await axios.get(url, { timeout: 8000 });
    if (!res.data || res.data.includes("<title>404")) return null;
    return res.data;
  } catch {
    return null;
  }
}

/**
 * HTML racelist（fallback）
 */
export async function fetchRaceListHTML(jcd, dateStr) {
  const url = `${BASE_HTML}?jcd=${jcd}&hd=${dateStr}`;
  try {
    const res = await axios.get(url, { timeout: 8000 });
    if (!res.data) return null;
    return res.data;
  } catch {
    return null;
  }
}

/**
 * racelist（XML→HTML fallback）
 */
export async function fetchRaceList(jcd, dateStr) {
  const xml = await fetchRaceListXML(jcd, dateStr);
  if (xml) return { type: "xml", data: xml };

  const html = await fetchRaceListHTML(jcd, dateStr);
  if (html) return { type: "html", data: html };

  return null;
}

/**
 * racelist → レース番号一覧抽出
 */
export function parseRaceNumbers(listData) {
  const { type, data } = listData;

  if (type === "xml") {
    const $ = cheerio.load(data, { xmlMode: true });
    const races = [];
    $("item").each((i, el) => {
      const no = $(el).attr("id");
      if (no) races.push(no);
    });
    return races;
  }

  if (type === "html") {
    const $ = cheerio.load(data);
    const races = [];
    $(".is-h2.card").each((i, el) => {
      const txt = $(el).find(".h2_title").text().trim();
      const match = txt.match(/(\d{1,2})R/);
      if (match) races.push(match[1]);
    });
    return races;
  }

  return [];
}

/**
 * レース詳細ページ取得
 */
export async function fetchRaceDetail(jcd, dateStr, raceNo) {
  const url = `${DETAIL_HTML}?jcd=${jcd}&hd=${dateStr}&rno=${raceNo}`;
  try {
    const res = await axios.get(url, { timeout: 8000 });
    return res.data || null;
  } catch {
    return null;
  }
}

/**
 * jcd の1日分の全レース取得
 */
export async function fetchJCDAll(jcd, dateStr) {
  const racelist = await fetchRaceList(jcd, dateStr);
  if (!racelist) return null;

  const raceNos = parseRaceNumbers(racelist);
  const detail = {};

  for (const no of raceNos) {
    const html = await fetchRaceDetail(jcd, dateStr, no);
    detail[no] = html;
  }

  return {
    jcd,
    date: dateStr,
    racelist,
    detail,
  };
}