import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true
});

export function parseBoatraceXML(xml) {
  try {
    const json = parser.parse(xml);

    // API 返却データの基本構造
    if (!json || !json.heats || !json.heats.heats) {
      console.log("⚠ heats データが見つかりません");
      return [];
    }

    const heats = json.heats.heats;
    const list = Array.isArray(heats) ? heats : [heats];

    return list.map(h => ({
      jcd: h.jcd,
      raceno: h.rno,
      title: h.title,
      deadline: h.shimekiri,
      course: h.jname
    }));

  } catch (err) {
    console.log("❌ XML パース失敗", err.message);
    return [];
  }
}