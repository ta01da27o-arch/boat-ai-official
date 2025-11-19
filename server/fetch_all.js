// server/fetch_all.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  fetchHeatsApi,
  fetchRacelistHTML,
  parseRacelistHTML,
  fetchRaceDetailHTML,
  parseXmlToJson,
} from "./fetch_utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.join(__dirname, "data");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const JCD_LIST = [
  "01","02","03","04","05","06","07","08",
  "09","10","11","12","13","14","15","16",
  "17","18","19","20","21","22","23","24"
];

function getDate(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function processSingleDay(dateStr) {
  console.log(`\n📅 取得日：${dateStr}`);
  const result = { date: dateStr, venues: [] };

  // ① まず API を叩く（JSON / XML の可能性）
  const apiRes = await fetchHeatsApi(dateStr);
  if (apiRes) {
    if (apiRes.type === "json") {
      console.log("✅ API(JSON) 取得成功");
      // API JSON があるならそれを使って venues を作る（簡易）
      result.api = apiRes.data;
      // ここは用途に応じて整形できるが、まずは保存しておく
    } else if (apiRes.type === "xml") {
      console.log("⚠ API は XML を返しました（保存）");
      const parsed = parseXmlToJson(apiRes.data);
      result.api_xml = parsed || apiRes.data;
    } else {
      console.log("ℹ API は不明な形式を返しました。HTML フォールバックへ");
    }
  } else {
    console.log("ℹ API取得失敗 or 無し → HTML フォールバックへ");
  }

  // ② jcd ごとに racelist HTML を取得して racecard を探す
  for (const jcd of JCD_LIST) {
    console.log(`\n--- jcd=${jcd} ---`);
    const r = await fetchRacelistHTML(jcd, dateStr);
    if (!r || !r.ok) {
      console.log(`⚠ racelist 取得失敗 jcd=${jcd} : ${r?.reason || "no response"}`);
      result.venues.push({ jcd, status: r?.reason || "no-data" });
      continue;
    }

    // parse links
    const cards = parseRacelistHTML(r.body);
    if (!cards || cards.length === 0) {
      console.log(`⚠ 有効な racecard リンクは見つかりませんでした: jcd=${jcd}`);
      result.venues.push({ jcd, status: "no-links" });
      continue;
    }

    const venueObj = { jcd, links: cards, races: [] };

    // 各リンク（racecard）を取得して生HTMLを保存（詳細パースは別途）
    for (const link of cards) {
      console.log(`▶ racecard 取得試行: ${link.href}`);
      const d = await fetchRaceDetailHTML(link.href, `${jcd}`);
      if (!d.ok) {
        console.log(`   ⚠ racecard 取得失敗: ${d.reason}`);
        venueObj.races.push({ link: link.href, ok: false, reason: d.reason });
        continue;
      }
      // 成功したら生HTMLを保存（後で parse_race_detail に渡す）
      const filename = path.join(OUT_DIR, `${dateStr}_jcd${jcd}_${Buffer.from(link.href).toString('base64').slice(0,12)}.html`);
      fs.writeFileSync(filename, d.body, "utf-8");
      console.log(`   ✅ racecard 保存: ${filename}`);
      venueObj.races.push({ link: link.href, ok: true, file: filename });
    }

    result.venues.push(venueObj);
  }

  return result;
}

async function main() {
  const today = getDate(0);
  const yesterday = getDate(-1);

  const outToday = await processSingleDay(today);
  const outYesterday = await processSingleDay(yesterday);

  fs.writeFileSync(path.join(OUT_DIR, "today.json"), JSON.stringify(outToday, null, 2), "utf-8");
  fs.writeFileSync(path.join(OUT_DIR, "yesterday.json"), JSON.stringify(outYesterday, null, 2), "utf-8");

  console.log("\n💾 保存完了: server/data/today.json & yesterday.json");
}

main().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});