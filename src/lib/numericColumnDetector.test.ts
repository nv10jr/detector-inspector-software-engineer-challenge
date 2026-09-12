import { describe, it, expect } from "vitest";
import { detectNumericColumn } from "./numericColumnDetector";
import type { ParsedTable } from "./wikipediaTableParser";

function table(headers: string[], rows: string[][]): ParsedTable {
  return { headers, rows };
}

describe("Given one or more parsed Wikipedia tables", () => {
  it("When one column has units/footnotes and another is names/dates, Then it picks the measurement column", () => {
    const t = table(
      ["Mark", "Athlete", "Date"],
      [
        ["1.46 m (4 ft 9¼ in)", "Nancy Voorhees", "20 May 1922"],
        ["1.485 m (4 ft 10¼ in)", "Elizabeth Stine", "26 May 1923"],
        ["1.524 m (5 ft 0 in)", "Phyllis Green", "11 July 1925"],
      ]
    );

    const result = detectNumericColumn([t]);

    expect(result.header).toBe("Mark");
    expect(result.columnIndex).toBe(0);
    expect(result.rawValues).toEqual([
      "1.46 m (4 ft 9¼ in)",
      "1.485 m (4 ft 10¼ in)",
      "1.524 m (5 ft 0 in)",
    ]);
  });

  it("When a table has both a sequential rank column and a measurement column, Then it skips the rank column", () => {
    const t = table(
      ["Rank", "Score"],
      [
        ["1", "88.5 pts"],
        ["2", "91.2 pts"],
        ["3", "76.0 pts"],
      ]
    );

    const result = detectNumericColumn([t]);

    expect(result.header).toBe("Score");
    expect(result.columnIndex).toBe(1);
  });

  it("When the first table has no numeric column at all, Then it searches later tables", () => {
    const textOnly = table(
      ["Name", "Country"],
      [
        ["Alice", "USA"],
        ["Bob", "GBR"],
      ]
    );
    const numeric = table(
      ["Height"],
      [["1.5 m"], ["1.6 m"], ["1.7 m"]]
    );

    const result = detectNumericColumn([textOnly, numeric]);

    expect(result.header).toBe("Height");
  });

  it("When a column has some non-numeric placeholder cells mixed in, Then it is still selected if it clears the threshold, keeping raw (uncleaned) values", () => {
    const t = table(
      ["Mark"],
      [["1.46 m"], ["N/A"], ["1.60 m"], ["1.62 m"]]
    );

    const result = detectNumericColumn([t]);

    expect(result.header).toBe("Mark");
    expect(result.rawValues).toEqual(["1.46 m", "N/A", "1.60 m", "1.62 m"]);
  });

  it("When no table has any numeric column, Then it throws a clear error", () => {
    const t = table(["Name", "Country"], [["Alice", "USA"], ["Bob", "GBR"]]);
    expect(() => detectNumericColumn([t])).toThrow(/no numeric column/i);
  });

  it("When there are no tables at all, Then it throws a clear error", () => {
    expect(() => detectNumericColumn([])).toThrow(/no table/i);
  });
});
