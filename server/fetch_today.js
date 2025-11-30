import { fetchXml, saveJSON } from "./fetch_utils.js";
import { parseBoatraceXML } from "./parse_xml.js";

function getToday() {
  const d = new Date();
  d.setHours(d.getHours() + 9); // 日本時間
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const today = getToday();
  console.log(`📅 本日: ${today}`);

  const url = `https://www.boatrace.jp/owpc/pc/m_api/replay?hd=${today}`;
  console.log(`🔥 fetch: ${url}`);

  const xml = await fetchXml(url);
  if (!xml) {
    console.log("❌ XML 取得失敗");
    return;
  }

  const races = parseBoatraceXML(xml);

  const out = {
    date: today,
    count: races.length,
    races
  };

  await saveJSON(`server/data/${today}.json`, out);

  console.log("✨ 本日のレースデータ取得完了");
}

main();