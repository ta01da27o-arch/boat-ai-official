// server/fetch_heats_api.js
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const AX = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
    "Accept-Language": "ja,en-US;q=0.9"
  },
  timeout: 15000
});

/**
 * fetchHeatsApi(date) - try to fetch official internal API for "heats" or "replay"
 * returns:
 *  - { type: 'json', data }
 *  - { type: 'xml', data }  (raw xml string)
 *  - null if not available
 */
export async function fetchHeatsApi(dateStr) {
  // candidate endpoints used by BOATRACE site historically
  const endpoints = [
    `https://www.boatrace.jp/owpc/pc/m_api/replay?hd=${dateStr}`,
    `https://www.boatrace.jp/owpc/pc/race/json/heats?hd=${dateStr}`,
    `https://www.boatrace.jp/owpc/pc/race/xml/heats?hd=${dateStr}`
  ];

  for (const url of endpoints) {
    try {
      console.log(`🔥 fetchHeatsApi: ${url}`);
      const res = await AX.get(url, { responseType: "text" });
      const ct = (res.headers["content-type"] || "").toLowerCase();

      const bodyText = typeof res.data === "string" ? res.data : JSON.stringify(res.data);

      if (ct.includes("application/json") || bodyText.trim().startsWith("{") || bodyText.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(bodyText);
          return { type: "json", data: parsed, url };
        } catch (e) {
          // fallback: might be text but JSON-parsable error - continue
          console.warn("⚠ fetchHeatsApi: JSON parse error", e.message);
        }
      }

      // if XML or starts with <?xml or <html> we treat accordingly
      if (bodyText.trim().startsWith("<?xml") || bodyText.trim().startsWith("<")) {
        // if it's HTML error page, still return xml/html string for inspection
        return { type: "xml", data: bodyText, url };
      }

    } catch (err) {
      console.warn(`⚠ fetchHeatsApi failed for ${url}: ${err.message}`);
      // try next
    }
  }

  return null;
}

/**
 * parseHeatsXmlToJs(xmlString) - if you want to convert XML to JS object (optional)
 */
export function parseHeatsXmlToJs(xmlString) {
  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
    return parser.parse(xmlString);
  } catch (e) {
    console.warn("⚠ parseHeatsXmlToJs failed:", e.message);
    return null;
  }
}