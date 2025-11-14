// fetch_today.js
// 本日のレース一覧ページから出走表URLを抽出して取得
import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const TODAY = new Date();
const YYYY = TODAY.getFullYear();
const MM = String(TODAY.getMonth() + 1).padStart(2, "0");
const DD = String(TODAY.getDate()).padStart(2, "0");
const DATE = `${YYYY}${MM}${DD}`;

const INDEX_URL = `https://www.boatrace.jp/owpc/pc/race/index?hd=${DATE}`;

console.log(`🚀 本日のレース一覧を取得中: ${INDEX_URL}`);

async function fetchPlayerStats(profileUrl) {
  try {
    const html = await fetch(profileUrl).then(r => r.text());
    const $ = cheerio.load(html);

    const stats = {
      course_stats: {}
    };

    // 進入コース1着率（1〜6コース）
    $("#main_content table tr").each((i, el) => {
      const th = $(el).find("th").text().trim();
      if (th.includes("1コース")) stats.course_stats["1"] = parseFloat($(el).find("td").text()) || 0;
      if (th.includes("2コース")) stats.course_stats["2"] = parseFloat($(el).find("td").text()) || 0;
      if (th.includes("3コース")) stats.course_stats["3"] = parseFloat($(el).find("td").text()) || 0;
      if (th.includes("4コース")) stats.course_stats["4"] = parseFloat($(el).find("td").text()) || 0;
      if (th.includes("5コース")) stats.course_stats["5"] = parseFloat($(el).find("td").text()) || 0;
      if (th.includes("6コース")) stats.course_stats["6"] = parseFloat($(el).find("td").text()) || 0;
    });

    return stats;
  } catch (e) {
    return { course_stats: {} };
  }
}

async function fetchToday() {
  const result = [];

  // ① 本日のレース一覧ページ取得
  const html = await fetch(INDEX_URL).then(r => r.text());
  const $ = cheerio.load(html);

  const raceUrls = [];

  $(".table1 tbody tr").each((i, el) => {
    const a = $(el).find("a");
    if (!a.length) return;
    const href = a.attr("href");
    if (!href) return;
    if (href.includes("racelist")) raceUrls.push("https://www.boatrace.jp" + href);
  });

  console.log(`✅ 出走表URL取得: ${raceUrls.length}件`);

  // ② 各レースページ取得
  for (const url of raceUrls) {
    console.log("🌊 取得中: ", url);
    try {
      const pageHtml = await fetch(url).then(r => r.text());
      const $$ = cheerio.load(pageHtml);

      const races = [];

      $$(".tab4_body").each((i, raceEl) => {
        const title = $$(raceEl).find(".race_title").text().trim();
        if (!title) return;

        const table = $$(raceEl).find(".table1");
        const rows = [];

        table.find("tbody tr").each((i, row) => {
          const tds = $$(row).find("td");
          if (!tds.length) return;

          const playerName = $$(tds[1]).text().trim();
          const profileHref = $$(tds[1]).find("a").attr("href");
          const playerProfileUrl = profileHref ? "https://www.boatrace.jp" + profileHref : null;

          const player = {
            lane: $$(tds[0]).text().trim(),
            name: playerName,
            class: $$(tds[2]).text().trim(),
            avg_st: $$(tds[3]).text().trim(),
            f_l: $$(tds[4]).text().trim(),
            win_rate: parseFloat($$(tds[5]).text().trim()) || 0,
            local_win_rate: parseFloat($$(tds[6]).text().trim()) || 0,
            motor_win_rate: parseFloat($$(tds[7]).text().trim()) || 0,
            course_stats: {}
          };

          rows.push(player);
        });

        races.push({ title, rows });
      });

      // ③ 各選手のプロフィールページから進入コース1着率取得
      for (const race of races) {
        for (const player of race.rows) {
          if (player.name && player.course_stats && player.profileUrl) {
            const stats = await fetchPlayerStats(player.profileUrl);
            player.course_stats = stats.course_stats;
          }
        }
      }

      result.push({
        url,
        races
      });
    } catch (err) {
      console.log("❌ 取得失敗:", err.message);
    }
  }

  // 保存
  const savePath = "./server/data/racecards.json";
  fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
  console.log(`📄 出走表保存完了: ${savePath}`);
}

fetchToday();