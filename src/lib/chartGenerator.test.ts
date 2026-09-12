import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import { generateChartPng, FONT_PATH } from "./chartGenerator";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("Given cleaned numeric values for the detected column", () => {
  it("When generating a chart, Then it returns a non-empty, valid PNG buffer", async () => {
    const buffer = await generateChartPng([1.46, 1.485, 1.524, 1.6], "Mark");

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 8)).toEqual(PNG_MAGIC);
  });

  it("When there is only a single value, Then it still renders a valid PNG", async () => {
    const buffer = await generateChartPng([2.02], "Mark");

    expect(buffer.subarray(0, 8)).toEqual(PNG_MAGIC);
  });

  it("When there are no values at all, Then it throws rather than rendering an empty chart", async () => {
    await expect(generateChartPng([], "Mark")).rejects.toThrow(/no numeric values/i);
  });

  it("Given the bundled font the renderer registers, Then the font file actually exists at that path", () => {
    // Regression guard for a real bug: this passed locally (macOS always has
    // system fonts to fall back to) but broke on Vercel, whose serverless
    // runtime has none - text rendered as tofu boxes. A bundled font file is
    // only useful if it's actually present; this catches "forgot to commit
    // it" or "path typo" before a deploy does.
    expect(fs.existsSync(FONT_PATH)).toBe(true);
  });
});
