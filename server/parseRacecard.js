// parseRacecard.js
// racelist ページの HTML を抽出する

export function parseRacecard($) {
  const result = [];

  // 各レース枠（12R まである）
  $(".table1").each((_, table) => {
    const race = {
      title: "",
      rows: []
    };

    // レース番号（例：第1レース）
    race.title = $(table).find(".hdg-l2-01").text().trim();

    // 出走表の行
    $(table).find("tbody tr").each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length < 10) return; // 不正行はスキップ

      const data = {
        waku: $(tds[0]).text().trim(),
        player: $(tds[1]).text().trim(),
        reg: $(tds[2]).text().trim(),
        branch: $(tds[3]).text().trim(),
        weight: $(tds[4]).text().trim(),
        fl: $(tds[5]).text().trim(),
        win_rate: $(tds[6]).text().trim(),
        motor: $(tds[7]).text().trim(),
        boat: $(tds[8]).text().trim()
      };

      race.rows.push(data);
    });

    if (race.rows.length > 0) result.push(race);
  });

  return result;
}