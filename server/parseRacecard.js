// server/parseRacecard.js
import * as cheerio from "cheerio";

export function parseRacecard(html) {
  const $ = cheerio.load(html);

  const title = $(".title").text().trim();
  const weather = $(".weather1_bodyUnitLabel").text().trim();
  const wind = $(".weather1_bodyUnitUnit").text().trim();

  const races = [];

  $(".table1").each((_, table) => {
    const rows = [];

    $(table)
      .find("tbody tr")
      .each((_, tr) => {
        const tds = $(tr)
          .find("td")
          .map((__, td) => $(td).text().trim())
          .get();

        if (tds.length > 0) {
          rows.push(tds);
        }
      });

    if (rows.length > 0) {
      races.push(rows);
    }
  });

  return {
    title,
    weather,
    wind,
    races
  };
}