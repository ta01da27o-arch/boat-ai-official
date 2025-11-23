// server/getRacelist.js
import * as cheerio from "cheerio";
import { safeGet, wait } from "./fetch_utils.js";

/**
 * レース一覧を取得する（ブロック回避 + retry + ランダム待機）
 */
export async function fetchRacelist(jcd, dateStr) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${dateStr}`;
  console.log(`🌊 racelist: ${url}`);

  let html;
  try {
    const res = await safeGet(url);   // axios → safeGet に置換（retry付き）
    html = res.data;
  } catch (err) {
    console.log(`⚠ racelist 取得失敗 jcd=${jcd} : ${err.message}`);
    throw err;
  }

  // XML → 非開催
  if (html.startsWith("<?xml") || html.includes("<!DOCTYPE xml")) {
    console.log(`⚠ 非開催: jcd=${jcd}`);
    return [];
  }

  const $ = cheerio.load(html);
  const list = [];

  // racecard リンク抽出
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("racecard")) {
      list.push("https://www.boatrace.jp" + href);
    }
  });

  // ランダム待機（2〜6秒：ブロック回避）
  await wait(2000 + Math.random() * 4000);

  return list;
}