import axios from "axios";
import fs from "fs-extra";
import { XMLParser } from "fast-xml-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

/**
 * XML API を取得 → JSON に変換して返す
 */
export async function fetchXmlApi(url) {
  try {
    const res = await axios.get(url, { timeout: 15000 });
    const xml = res.data;

    return parser.parse(xml);
  } catch (err) {
    console.error("❌ fetchXmlApi error:", err.message);
    return null;
  }
}

/**
 * JSON を server/data に保存
 */
export async function saveJson(date, data) {
  const savePath = path.join(__dirname, "data", `${date}.json`);
  await fs.ensureDir(path.dirname(savePath));
  await fs.writeJSON(savePath, data, { spaces: 2 });
  console.log(`💾 保存完了: ${savePath}`);
}