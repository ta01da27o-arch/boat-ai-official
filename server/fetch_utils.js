// fetch_utils.js
// XML → HTML フォールバック ＋ 開催判定 ＋ 安全fetch

import axios from "axios";
import * as cheerio from "cheerio";

/**
 * 安全fetch（XML/HTML共通）
 */
export async function safeFetch(url, type = "text") {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    return type === "xml" ? res.data : res.data;
  } catch (err) {
    console.log(`❌ Fetch失敗: ${url}`);
    return null;
  }
}

/**
 * XML開催判定 ＆ racelist取得
 */
export async function getRacelistUrls(jcd, hd) {
  const xmlUrl = `https://www.boatrace.jp/owpc/pc/race/xml/racelist?jcd=${jcd}&hd=${hd}`;
  const htmlUrl = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${jcd}&hd=${hd}`;

  // --- ① XML試行 ---
  const xmlText = await safeFetch(xmlUrl, "xml");

  if (xmlText) {
    // 開催していれば <Racelist> 内に複数の race タグがある
    const hasRace = xmlText.includes("<item>") || xmlText.includes("<race>");
    if (hasRace) {
      console.log(`🟢 XML開催: jcd=${jcd}`);
      // XML では racelist は1ページなので URL を返す
      return [htmlUrl];
    } else {
      console.log(`⚠ XML非開催: jcd=${jcd}`);
    }
  }

  // --- ② HTMLフォールバック ---
  console.log(`🔄 HTMLフォールバック: jcd=${jcd}`);
  const html = await safeFetch(htmlUrl);

  if (!html) return [];

  const $ = cheerio.load(html);
  const urls = [];

  $(".table1 a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("racelist")) {
      urls.push("https://www.boatrace.jp" + href);
    }
  });

  if (urls.length === 0) {
    console.log(`⚠ HTML非開催: jcd=${jcd}`);
    return [];
  }

  console.log(`🟢 HTML開催: jcd=${jcd} URL数=${urls.length}`);
  return urls;
}