import * as cheerio from "cheerio";

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

/**
 * Extracts tables from a Wikipedia page's rendered HTML. Prefers
 * `table.wikitable` (Wikipedia's standard data-table class, which excludes
 * navboxes/infoboxes); falls back to any `<table>` if no wikitable is
 * present so the parser still works on non-standard pages.
 */
export function parseTables(html: string): ParsedTable[] {
  const $ = cheerio.load(html);

  let tableEls = $("table.wikitable").toArray();
  if (tableEls.length === 0) {
    tableEls = $("table").toArray();
  }

  const tables: ParsedTable[] = [];

  for (const tableEl of tableEls) {
    const rowsEls = $(tableEl).find("tr").toArray();
    if (rowsEls.length === 0) continue;

    const headerRowIndex = rowsEls.findIndex((tr) => $(tr).find("th").length > 0);
    const headerRowEl = rowsEls[headerRowIndex === -1 ? 0 : headerRowIndex];
    const headers = $(headerRowEl)
      .find("th, td")
      .map((_, cell) => $(cell).text().replace(/\s+/g, " ").trim())
      .get();

    const rows: string[][] = [];
    rowsEls.forEach((tr, index) => {
      if (index === (headerRowIndex === -1 ? 0 : headerRowIndex)) return;
      const cells = $(tr)
        .find("td, th")
        .map((_, cell) => $(cell).text().replace(/\s+/g, " ").trim())
        .get();
      if (cells.length > 0) rows.push(cells);
    });

    tables.push({ headers, rows });
  }

  return tables;
}
