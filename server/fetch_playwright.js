// server/fetch_playwright.js
import { chromium } from "playwright";
import * as cheerio from "cheerio";

/**
 * fetchByDate(dateStr)
 * - dateStr: 'YYYYMMDD'
 * returns object:
 * { date: dateStr, venues: [ { jcd, name, racecards: [ {raceNo, rows:[ {lane, name, rank, ...} ] } ] } ] }
 *
 * This function uses Playwright to render pages and extract the visible racecards.
 */
export async function fetchByDate(dateStr) {
  console.log(`▶ Playwright fetch for ${dateStr}`);
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
    locale: "ja-JP"
  });

  const page = await context.newPage();
  const baseIndexUrl = `https://www.boatrace.jp/owpc/pc/race/index?hd=${dateStr}`;

  try {
    console.log("▶ open:", baseIndexUrl);
    await page.goto(baseIndexUrl, { waitUntil: "domcontentloaded", timeout: 25000 });

    // Get HTML and find racelist/racecard links
    const content = await page.content();
    const $ = cheerio.load(content);

    // collect links to racelist or direct race pages
    const links = new Set();

    // find racelist links (per jcd) and racecard links
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      if (href.includes("racelist") || href.includes("raceindex") || href.includes("racecard") || href.includes("race/index")) {
        // normalize
        let full = href;
        if (!full.startsWith("http")) full = "https://www.boatrace.jp" + href;
        links.add(full);
      }
    });

    const linkArr = Array.from(links).slice(0, 200); // safety cap
    console.log(`▶ candidate links found: ${linkArr.length}`);

    const result = { date: dateStr, venues: [] };

    for (const lnk of linkArr) {
      try {
        console.log(`  ▶ nav ${lnk}`);
        await page.goto(lnk, { waitUntil: "domcontentloaded", timeout: 20000 });
        // Wait small time for dynamic content
        await page.waitForTimeout(600);
        const body = await page.content();
        const $$ = cheerio.load(body);

        // detect venue name
        const title = $$("h2.heading1_title span, h3.title, .stadium_name").first().text().trim() || $$("title").text().trim();
        // parse race tables: common patterns: .table1, .race_table, .tab4_body
        const races = [];

        // If there are tab4_body (race blocks)
        $$(".tab4_body, .race_card, .race_table, table.table1").each((i, el) => {
          const block = $$(el);
          // try to extract rows of players
          const rows = [];
          block.find("tbody tr").each((_, tr) => {
            const cols = $$(tr).find("td").map((i, td) => $$(td).text().trim()).get();
            if (cols.length > 0) rows.push(cols);
          });
          if (rows.length > 0) races.push({ rawRows: rows });
        });

        // fallback: if no tables, try to parse lists of racers
        if (races.length === 0) {
          // attempt to parse specific racecard layout
          const racerRows = [];
          $$(".race_card_table tbody tr, .entry_table tbody tr, .racerlist tr").each((_, tr) => {
            const cols = $$(tr).find("td").map((i, td) => $$(td).text().trim()).get();
            if (cols.length > 0) racerRows.push(cols);
          });
          if (racerRows.length > 0) races.push({ rawRows: racerRows });
        }

        if (races.length > 0) {
          result.venues.push({
            url: lnk,
            title,
            races
          });
          console.log(`   ✅ parsed: ${title} / blocks:${races.length}`);
        } else {
          console.log("   ⚠ no race table found on page");
        }

      } catch (e) {
        console.warn("   ⚠ page parse failed:", e.message);
      }
    }

    await browser.close();
    return result;

  } catch (err) {
    console.error("❌ Playwright fetch error:", err.message);
    try { await browser.close(); } catch {}
    return { date: dateStr, venues: [] };
  }
}