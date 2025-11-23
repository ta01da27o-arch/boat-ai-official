// server/fetch_part1.js
import { wait } from "./fetch_utils.js";
import { fetchRacelist } from "./getRacelist.js";

const START = 1;
const END = 8;

async function main() {
  for (let jcd = START; jcd <= END; jcd++) {
    console.log(`\n--- jcd=${jcd} ---`);

    try {
      await fetchRacelist(jcd);
    } catch (e) {
      console.log(`⚠ racelist 取得失敗 jcd=${jcd} : ${e.message}`);
    }

    // ランダム 3〜8秒待機（ブロック回避）
    await wait(3000 + Math.random() * 5000);
  }

  console.log("\n✨ part1 完了!");
}

main();