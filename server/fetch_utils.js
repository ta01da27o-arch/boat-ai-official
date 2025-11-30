import axios from "axios";
import fs from "fs-extra";

export const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function saveJSON(path, data) {
  await fs.ensureDir(path.substring(0, path.lastIndexOf("/")));
  await fs.writeJson(path, data, { spaces: 2 });
  console.log(`💾 保存完了: ${path}`);
}

export async function fetchXml(url) {
  const res = await axios.get(url, {
    timeout: 15000,
    responseType: "text"
  });
  return res.data;
}