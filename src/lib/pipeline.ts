import { fetchHtml } from "./htmlFetcher";
import { parseTables } from "./wikipediaTableParser";
import { detectNumericColumn } from "./numericColumnDetector";
import { cleanNumericValues } from "./dataCleaner";
import { generateChartPng } from "./chartGenerator";
import { writeImageFile } from "./imageFileWriter";

export interface PipelineResult {
  outputPath: string;
  tableHeaders: string[];
  columnName: string;
  pointCount: number;
}

/**
 * Input URL -> HTML Fetcher -> Wikipedia Table Parser -> Numeric Column
 * Detector -> Data Cleaner/Transformer -> Chart Generator -> Image File
 * Output. Each stage is its own module (see src/lib/); this just wires
 * them together in order.
 */
export async function generateChartFromUrl(
  url: string,
  outPath: string
): Promise<PipelineResult> {
  const html = await fetchHtml(url);
  const tables = parseTables(html);
  const detected = detectNumericColumn(tables);
  const values = cleanNumericValues(detected.rawValues);
  const png = await generateChartPng(values, detected.header);
  const outputPath = await writeImageFile(png, outPath);

  return {
    outputPath,
    tableHeaders: detected.table.headers,
    columnName: detected.header,
    pointCount: values.length,
  };
}
