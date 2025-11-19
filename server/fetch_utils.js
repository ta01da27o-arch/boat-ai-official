// server/fetch_utils.js
import axios from "axios";
import * as cheerio from "cheerio";

/* ---------------------------------------------
  基本設定
--------------------------------------------- */

export const BASE_URL = "https://www.boatrace.jp";

/* ---------------------------------------------
  racelist HTML を取得（開催中のみ HTML / 非開催は null）
--------------------------------------------- */
export async function fetchRacelistHTML(jcd, dateStr) {
  const url = `${BASE_URL}/owpc/pc/race/racelist?jcd=${jcd}&hd=${dateStr}`;

  console.log(`🌊 racelist HTML 取得中: ${url}`);

  try {
    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      responseType: "text",
      validateStatus: () => true,
    });

    // 非開催は「開催予定はありません」などの文言が返る
    if (res.status !== 200) return null;
    if (!res.data || res.data.includes("開催予定はありません")) return null;

    return res.data;
  } catch (err) {
    console.log(`⚠ racelist HTML エラー jcd=${jcd}:`, err.message);
    return null;
  }
}

/* ---------------------------------------------
  racelist HTML → racecard URL 抽出
  ★ javascript:MultiOpen(...) は完全除外 ★
--------------------------------------------- */
export function parseRacelistHTML(html) {
  const $ = cheerio.load(html);
  const out = [];

  $(".table1 tbody tr").each((_, tr) => {
    const a = $(tr).find("a");
    const href = a.attr("href");

    // 無効リンク除外（今回のバグの原因）
    if (!href || href.startsWith("javascript")) {
      return;
    }

    // 正規 URL の場合だけ racecard として扱う
    if (!href.includes("/owpc/pc/race/racecard")) {
      return;
    }

    const url = BASE_URL + href;
    const raceno = $(tr).find("th").text().trim();
    const title = $(tr).find("td").eq(0).text().trim();

    out.push({ raceno, title, url });
  });

  return out;
}

/* ---------------------------------------------
  racecard → 詳細ページ（レース番号ごと）HTML 取得
--------------------------------------------- */
export async function fetchRaceDetailHTML(url) {
  console.log(`   ▶ racecard 取得: ${url}`);

  try {
    const res = await axios.get(url, {
      timeout: 15000,
      responseType: "text",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      validateStatus: () => true,
    });

    if (res.status !== 200) return null;
    if (!res.data) return null;

    return res.data;
  } catch (err) {
    console.log("   ⚠ racecard エラー:", err.message);
    return null;
  }
}