// server/verifyData.js
import fs from "fs";

function check(file) {
  if (!fs.existsSync(file)) {
    console.log(`❌ ${file} not found`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(`📊 ${file} 件数: ${data.length}`);
}

check("./server/data/today.json");
check("./server/data/yesterday.json");