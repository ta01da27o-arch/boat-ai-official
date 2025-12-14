// server/utils.js
import fs from "fs-extra";
import path from "path";

export const JCD_LIST = [
  "01","02","03","04","05","06","07","08",
  "09","10","11","12","13","14","15","16",
  "17","18","19","20","21","22","23","24"
];

export function todayString(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function saveJSON(filepath, obj) {
  await fs.ensureDir(path.dirname(filepath));
  await fs.writeJson(filepath, obj, { spaces: 2 });
  console.log(`💾 保存完了: ${filepath}`);
}