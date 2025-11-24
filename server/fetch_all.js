import { fetchXmlApi, saveJson } from "./fetch_utils.js";

/**
 * 指定日付のレースデータを取得
 */
async function fetchDay(date) {
  console.log(`\n📅 取得日：${date}`);

  const apiUrl = `https://www.boatrace.jp/owpc/pc/m_api/replay?hd=${date}`;
  console.log(`🔥 fetchHeatsApi: ${apiUrl}`);

  const xmlJson = await fetchXmlApi(apiUrl);

  if (!xmlJson) {
    console.log("❌ API 取得失敗");
    return;
  }

  console.log("⚠ API は XML を返しました（パースして保存）");

  const finalData = {
    date,
    raw: xmlJson,
  };

  await saveJson(date, finalData);
}

/**
 * 実行部：今日 + 前日
 */
async function main() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  const todayStr = `${yyyy}${mm}${dd}`;

  // 前日
  const yDate = new Date(today);
  yDate.setDate(yDate.getDate() - 1);
  const yyyyy = yDate.getFullYear();
  const ymm = String(yDate.getMonth() + 1).padStart(2, "0");
  const ydd = String(yDate.getDate()).padStart(2, "0");

  const yesterdayStr = `${yyyyy}${ymm}${ydd}`;

  await fetchDay(todayStr);
  await fetchDay(yesterdayStr);

  console.log("\n✨ 全日データ取得完了");
}

main();