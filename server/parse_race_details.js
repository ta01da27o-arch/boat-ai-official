import * as cheerio from "cheerio";

export function parseRaceDetailHTML(html) {
  const $ = cheerio.load(html);

  const title = $(".header_title").text().trim() || "";
  const weather = $(".weather1_bodyUnitLabel").text().trim();

  const table = [];
  $(".table1 tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length === 0) return;

    table.push({
      lane: $(tds[0]).text().trim(),
      name: $(tds[1]).text().trim(),
      time: $(tds[3]).text().trim(),
    });
  });

  return {
    title,
    weather,
    entries: table
  };
}