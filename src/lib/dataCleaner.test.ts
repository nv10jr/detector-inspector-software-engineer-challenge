import { describe, it, expect } from "vitest";
import { cleanNumericValues } from "./dataCleaner";

describe("Given raw Wikipedia table cell text for a numeric column", () => {
  it("When a cell has a metric value with a parenthetical imperial alt-unit, Then it extracts the leading metric number", () => {
    expect(cleanNumericValues(["1.46 m (4 ft 9¼ in)"])).toEqual([1.46]);
  });

  it("When a cell uses thousands-separator commas, Then it strips them before parsing", () => {
    expect(cleanNumericValues(["1,234"])).toEqual([1234]);
  });

  it("When a cell has a trailing footnote reference, Then it strips the footnote before parsing", () => {
    expect(cleanNumericValues(["1.90[1]"])).toEqual([1.9]);
  });

  it("When a cell is a non-numeric placeholder (en dash or N/A), Then it is dropped, not coerced to 0", () => {
    expect(cleanNumericValues(["1.5", "–", "N/A", "1.6"])).toEqual([1.5, 1.6]);
  });

  it("When a cell is a negative number, Then the sign is preserved", () => {
    expect(cleanNumericValues(["-5", "-3.2"])).toEqual([-5, -3.2]);
  });

  it("When the input is empty, Then it returns an empty array", () => {
    expect(cleanNumericValues([])).toEqual([]);
  });
});
