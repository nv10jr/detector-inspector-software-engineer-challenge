import { describe, it, expect, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import { generateChartFromUrl } from "./pipeline";
import { fetchHtml } from "./htmlFetcher";

vi.mock("./htmlFetcher", () => ({ fetchHtml: vi.fn() }));

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(here, "..", "..", "test", "fixtures", "high-jump.html");

describe("Given the challenge's example Wikipedia page (women's high jump record progression)", () => {
  it("When generating a chart end-to-end, Then it writes a PNG built from the Mark column", async () => {
    const fixtureHtml = fs.readFileSync(FIXTURE_PATH, "utf-8");
    vi.mocked(fetchHtml).mockResolvedValue(fixtureHtml);

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wtc-pipeline-"));
    const outPath = path.join(dir, "chart.png");

    const result = await generateChartFromUrl(
      "https://en.wikipedia.org/wiki/Women%27s_high_jump_world_record_progression",
      outPath
    );

    expect(result.columnName).toBe("Mark");
    expect(result.tableHeaders).toEqual(["Mark", "Athlete", "Date", "Venue"]);
    expect(result.pointCount).toBeGreaterThan(30);
    expect(result.outputPath).toBe(path.resolve(outPath));

    const written = fs.readFileSync(outPath);
    expect(written.subarray(0, 8)).toEqual(PNG_MAGIC);

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
