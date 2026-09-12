import { generateChartFromUrl } from "../src/lib/pipeline";

async function main() {
  const [, , url, outPathArg] = process.argv;

  if (!url) {
    console.error("Usage: npm run generate -- <wikipediaUrl> [outputPath=chart.png]");
    process.exitCode = 1;
    return;
  }

  const outPath = outPathArg ?? "chart.png";

  try {
    const result = await generateChartFromUrl(url, outPath);
    console.log(`Wrote ${result.outputPath}`);
    console.log(`Table columns: ${result.tableHeaders.join(", ")}`);
    console.log(`Charted column: "${result.columnName}" (${result.pointCount} points)`);
  } catch (err) {
    console.error(`Failed: ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

main();
