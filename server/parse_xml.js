// server/parse_xml.js
import { XMLParser } from "fast-xml-parser";

export function parseBoatRaceXML(xmlText) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    allowBooleanAttributes: true,
    parseTagValue: true,
    parseAttributeValue: true
  });

  return parser.parse(xmlText);
}