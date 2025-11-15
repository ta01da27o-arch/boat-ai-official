// server/parseRacecard.js
// racelist HTML から出走表・選手データを抜き出す

export function parseRacecard($) {
  const result = [];

  // 各レースブロック
  $(".race_table").each((_, raceEl) => {
    const raceNumber = $(raceEl).find(".number").text().trim();

    const rows = [];

    // 選手行を抽出
    $(raceEl).find("tbody tr").each((_, row) => {
      const tds = $(row).find("td");

      if (tds.length < 8) return; // データ行だけ対象

      rows.push({
        waku: $(tds[0]).text().trim(),
        name: $(tds[1]).text().trim(),
        grade: $(tds[2]).text().trim(),
        st: $(tds[3]).text().trim(),
        flying: $(tds[4]).text().trim(),
        nationalRate: $(tds[5]).text().trim(),
        localRate: $(tds[6]).text().trim(),
        motorRate: $(tds[7]).text().trim(),
      });
    });

    result.push({
      race: raceNumber,
      rows
    });
  });

  return result;
}