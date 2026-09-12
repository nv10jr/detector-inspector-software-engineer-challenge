import { describe, it, expect } from "vitest";
import { parseTables } from "./wikipediaTableParser";

const wikitableHtml = `
<html><body>
<table class="wikitable">
  <tr><th>Mark</th><th>Athlete</th><th>Date</th></tr>
  <tr><td>1.46 m (4 ft 9&frac14; in)</td><td>Nancy Voorhees</td><td>20 May 1922</td></tr>
  <tr><td>1.485 m (4 ft 10&frac14; in)</td><td>Elizabeth Stine</td><td>26 May 1923</td></tr>
</table>
</body></html>
`;

describe("Given Wikipedia page HTML", () => {
  it("When it contains a table.wikitable, Then it extracts headers and row text in order", () => {
    const tables = parseTables(wikitableHtml);
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(["Mark", "Athlete", "Date"]);
    expect(tables[0].rows).toEqual([
      ["1.46 m (4 ft 9¼ in)", "Nancy Voorhees", "20 May 1922"],
      ["1.485 m (4 ft 10¼ in)", "Elizabeth Stine", "26 May 1923"],
    ]);
  });

  it("When there is no table at all, Then it returns an empty array", () => {
    expect(parseTables("<html><body><p>no tables here</p></body></html>")).toEqual([]);
  });

  it("When there are multiple table.wikitable elements, Then it returns them in document order", () => {
    const html = `
      <table class="wikitable"><tr><th>A</th></tr><tr><td>1</td></tr></table>
      <table class="wikitable"><tr><th>B</th></tr><tr><td>2</td></tr></table>
    `;
    const tables = parseTables(html);
    expect(tables).toHaveLength(2);
    expect(tables[0].headers).toEqual(["A"]);
    expect(tables[1].headers).toEqual(["B"]);
  });

  it("When no table.wikitable exists but a plain table does, Then it falls back to the plain table", () => {
    const html = `<table><tr><th>X</th><th>Y</th></tr><tr><td>1</td><td>2</td></tr></table>`;
    const tables = parseTables(html);
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(["X", "Y"]);
  });

  it("When a cell contains a footnote reference, Then the raw text (including the footnote) is preserved for later cleaning", () => {
    const html = `<table class="wikitable"><tr><th>Venue</th></tr><tr><td>Simsbury<sup><a>[1]</a></sup></td></tr></table>`;
    const tables = parseTables(html);
    expect(tables[0].rows[0][0]).toBe("Simsbury[1]");
  });
});
