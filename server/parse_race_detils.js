// server/parse_race_detail.js
import cheerio from "cheerio";

/**
 * HTMLからレース情報を抽出する
 * @param {string} html - racedata HTML
 */
export function parseRaceDetailHTML(html) {
  const $ = cheerio.load(html);

  // --- タイトル、レース名 ---
  const raceTitle = $(".heading1_title").text().trim() || null;
  const subTitle = $(".heading2_title").text().trim() || null;

  // --- 天候・風 ---
  const weather = $(".weather1_bodyUnitLabel").text().trim() || null;

  const wDir = $(".weather1_windLabel").text().trim() || null;
  const wSpeed = $(".weather1_windValue").text().trim() || null;
  const wave = $(".weather1_waveValue").text().trim() || null;

  // --- 選手データ ---
  const boats = [];

  $(".table1 tbody tr").each((i, row) => {
    const cols = $(row).find("td");

    if (cols.length < 8) return;

    boats.push({
      lane: $(cols[0]).text().trim(),
      playerNo: $(cols[1]).find(".table1_playerNo").text().trim(),
      playerName: $(cols[1]).find(".table1_playerName").text().trim(),
      branch: $(cols[1]).find(".table1_playerArea").text().trim(),
      weight: $(cols[2]).text().trim(),
      avgST: $(cols[3]).text().trim(),
      winRate: $(cols[4]).text().trim(),
      motorNo: $(cols[5]).text().trim(),
      motorRate: $(cols[6]).text().trim(),
      boatNo: $(cols[7]).text().trim(),
    });
  });

  return {
    title: raceTitle,
    subTitle,
    weather,
    windDirection: wDir,
    windSpeed: wSpeed,
    wave,
    boats,
  };
}