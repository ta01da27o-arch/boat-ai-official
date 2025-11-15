// debug_today.js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const TODAY = new Date();
const YYYY = TODAY.getFullYear();
const MM = String(TODAY.getMonth()+1).padStart(2,"0");
const DD = String(TODAY.getDate()).padStart(2,"0");
const DATE = `${YYYY}${MM}${DD}`;

const URL = `https://www.boatrace.jp/owpc/pc/race/index?hd=${DATE}`;

(async()=>{
  const html = await fetch(URL).then(r=>r.text());
  const $ = cheerio.load(html);

  const hrefs = [];
  $("a").each((i, el)=>{
    const href = $(el).attr("href");
    if(href) hrefs.push(href);
  });

  console.log("All hrefs found:", hrefs.slice(0,50));
  console.log("Count:", hrefs.length);
})();
