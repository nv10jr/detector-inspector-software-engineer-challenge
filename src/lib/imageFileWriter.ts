import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function writeImageFile(buffer: Buffer, outPath: string): Promise<string> {
  const resolved = path.resolve(outPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, buffer);
  return resolved;
}
