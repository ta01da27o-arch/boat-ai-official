// server/fetch_part2.js
import { wait } from "./fetch_utils.js";
import { fetchRacelist } from "./getRacelist.js";

const START = 9;
const END = 16;

async function main() {
  for (let jcd = START; jcd <= END; jcd++) {
    console.log(`\n--- jcd=${jcd} ---`);

    try {
      await fetchRacelist(jcd);
    } catch (e) {
      console.log(`⚠ racelist 取得失敗 jcd=${jcd} : ${e.message}`);
    }

    await wait(3000 + Math.random() * 5000);
  }

  console.log("\n✨ part2 完了!");
}

main();