// server/fetch_today.js
import { fetchXml, saveJSON } from "./fetch_utils.js";
import { parseBoatRaceXML } from "./parse_xml.js";

function getToday() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

async function fetchToday() {
  const today = getToday();

  console.log(`📅 取得日：${today}`);

  const url = `https://www.boatrace.jp/owpc/pc/m_api/replay?hd=${today}`;
  console.log(`🔥 fetchHeatsApi: ${url}`);

  try {
    const xml = await fetchXml(url);

    if (!xml) {
      console.log("⚠ API が空でした");
      return;
    }

    const json = parseBoatRaceXML(xml);

    await saveJSON(`server/data/${today}.json`, json);

    console.log("✨ 本日のデータ取得完了");
  } catch (err) {
    console.error("❌ データ取得失敗:", err.message);
  }
}

fetchToday();