// parseRacecard.js
// cheerioオブジェクトから出走表の全データを抽出

export function parseRacecard($$) {
  const races = [];

  $$(".tab4_body").each((_, raceEl) => {
    const title = $$(raceEl).find(".race_title").text().trim();
    if (!title) return;

    const table = $$(raceEl).find(".table1");
    const rows = [];

    table.find("tbody tr").each((_, row) => {
      const tds = $$(row).find("td");

      if (tds.length < 10) return; // 最低限の列チェック

      const data = {
        lane: $$(tds[0]).text().trim(),
        name: $$(tds[1]).text().trim(),
        class: $$(tds[2]).text().trim(),
        st: $$(tds[3]).text().trim(),
        f: $$(tds[4]).text().trim(),
        avg: $$(tds[5]).text().trim(),
        winRateAll: $$(tds[6]).text().trim(),
        winRateLocal: $$(tds[7]).text().trim(),
        motorRate: $$(tds[8]).text().trim(),
        courseWinRate: $$(tds[9]).text().trim()
      };

      rows.push(data);
    });

    races.push({ title, rows });
  });

  return races;
}