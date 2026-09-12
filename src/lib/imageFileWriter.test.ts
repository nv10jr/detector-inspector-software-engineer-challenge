import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { writeImageFile } from "./imageFileWriter";

const tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wtc-imagewriter-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("Given a rendered image buffer", () => {
  it("When the output directory does not exist yet, Then it creates it and writes the exact bytes", async () => {
    const dir = makeTmpDir();
    const outPath = path.join(dir, "nested", "chart.png");
    const buffer = Buffer.from([1, 2, 3, 4]);

    const resolved = await writeImageFile(buffer, outPath);

    expect(fs.existsSync(outPath)).toBe(true);
    expect(fs.readFileSync(outPath)).toEqual(buffer);
    expect(resolved).toBe(path.resolve(outPath));
  });

  it("When the output directory already exists, Then it just writes the file", async () => {
    const dir = makeTmpDir();
    const outPath = path.join(dir, "chart.png");
    const buffer = Buffer.from([5, 6, 7]);

    await writeImageFile(buffer, outPath);

    expect(fs.readFileSync(outPath)).toEqual(buffer);
  });
});
