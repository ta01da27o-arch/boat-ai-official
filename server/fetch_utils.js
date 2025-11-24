import axios from "axios";
import { XMLParser } from "fast-xml-parser";

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const axiosClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
  },
  timeout: 15000,
});

// retry付き安全GET
export async function safeGet(url, retry = 3) {
  try {
    return await axiosClient.get(url);
  } catch (err) {
    if (retry <= 0) throw err;
    console.log(`⚠ retry (${retry}) → ${url}`);
    await wait(3000 + Math.random() * 5000);
    return safeGet(url, retry - 1);
  }
}

// API(XML)取得
export async function fetchHeatsApi(date) {
  const url = `https://www.boatrace.jp/owpc/pc/m_api/replay?hd=${date}`;
  console.log(`🔥 fetchHeatsApi: ${url}`);
  try {
    const res = await safeGet(url);
    if (res.data?.startsWith("<?xml")) {
      return { type: "xml", data: res.data };
    } else if (typeof res.data === "object") {
      return { type: "json", data: res.data };
    } else {
      return { type: "unknown", data: res.data };
    }
  } catch (err) {
    console.log(`⚠ fetchHeatsApi failed: ${err}`);
    return null;
  }
}

// XML → JSON変換
export function parseXmlToJson(xml) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  return parser.parse(xml);
}