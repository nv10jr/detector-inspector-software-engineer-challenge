import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { generateChartFromUrl } from "@/lib/pipeline";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const url = typeof (body as { url?: unknown })?.url === "string" ? (body as { url: string }).url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
  }

  const outPath = path.join(os.tmpdir(), `wiki-table-chart-${randomUUID()}.png`);

  try {
    const result = await generateChartFromUrl(url, outPath);
    const buffer = await fs.readFile(result.outputPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'inline; filename="chart.png"',
        "X-Table-Columns": encodeURIComponent(result.tableHeaders.join(", ")),
        "X-Chart-Column": encodeURIComponent(result.columnName),
        "X-Point-Count": String(result.pointCount),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    await fs.rm(outPath, { force: true });
  }
}
