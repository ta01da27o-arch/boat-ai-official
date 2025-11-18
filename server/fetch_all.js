// server/fetch_all.js
import { execSync } from "child_process";

const run = (cmd) => {
  console.log(`▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

console.log("📌 Playwright版データ取得を開始します");

run("npm run fetch-today");
run("npm run fetch-yesterday");

console.log("🎉 すべてのデータ取得が完了しました");