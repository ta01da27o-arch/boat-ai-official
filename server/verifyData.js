// server/verifyData.js
import fs from "fs";
import path from "path";

const linksPath = path.resolve("server/data/today_links.json");
const dataPath = path.resolve("server/data/data.json");

console.log("✅ 取得結果確認中...\n");

if (fs.existsSync(linksPath)) {
  const links = JSON.parse(fs.readFileSync(linksPath, "utf-8"));
  console.log(`📄 出走表URL一覧: ${links.length}件`);
} else {
  console.log("⚠️ today_links.json が見つかりません");
}

if (fs.existsSync(dataPath)) {
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`📊 出走表詳細: ${data.length}場分`);
} else {
  console.log("⚠️ data.json が見つかりません");
}

console.log("\n✅ 処理完了");