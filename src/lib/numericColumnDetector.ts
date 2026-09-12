import type { ParsedTable } from "./wikipediaTableParser";
import { cleanNumericValues } from "./dataCleaner";

export interface DetectedNumericColumn {
  table: ParsedTable;
  columnIndex: number;
  header: string;
  rawValues: string[];
}

const NUMERIC_RATIO_THRESHOLD = 0.6;

interface Candidate {
  table: ParsedTable;
  columnIndex: number;
  header: string;
  rawValues: string[];
  ratio: number;
  isSequentialIndex: boolean;
}

function isSequentialIndex(cleaned: number[], rowCount: number): boolean {
  return (
    cleaned.length === rowCount &&
    cleaned.every((value, i) => value === i + 1)
  );
}

function evaluateColumn(table: ParsedTable, columnIndex: number): Candidate {
  const rawValues = table.rows.map((row) => row[columnIndex] ?? "");
  const cleaned = cleanNumericValues(rawValues);
  const rowCount = table.rows.length;

  return {
    table,
    columnIndex,
    header: table.headers[columnIndex] ?? `Column ${columnIndex + 1}`,
    rawValues,
    ratio: rowCount === 0 ? 0 : cleaned.length / rowCount,
    isSequentialIndex: isSequentialIndex(cleaned, rowCount),
  };
}

function best(candidates: Candidate[]): Candidate {
  return candidates.reduce((champion, candidate) =>
    candidate.ratio > champion.ratio ? candidate : champion
  );
}

/**
 * Picks the column that looks most like a real measurement, across every
 * parsed table (not just the first one). Two heuristics keep this simple
 * while avoiding the most common false positive:
 *  - a column must clear a 60% "cells that parse as numbers" ratio to be
 *    considered a genuine numeric column at all;
 *  - among those, a column whose values are an exact 1..N sequence is
 *    treated as a rank/"#" column and deprioritized, since that's almost
 *    never the measurement the table is actually about.
 * If every qualifying column happens to be sequential, or nothing clears
 * the threshold, the detector falls back to the best raw score it found
 * rather than failing outright — it only throws when no column anywhere
 * has any numeric cells at all.
 */
export function detectNumericColumn(tables: ParsedTable[]): DetectedNumericColumn {
  if (tables.length === 0) {
    throw new Error("No table found on the page.");
  }

  const candidates: Candidate[] = [];
  for (const table of tables) {
    for (let columnIndex = 0; columnIndex < table.headers.length; columnIndex++) {
      candidates.push(evaluateColumn(table, columnIndex));
    }
  }

  const aboveThreshold = candidates.filter((c) => c.ratio >= NUMERIC_RATIO_THRESHOLD);
  const nonSequential = aboveThreshold.filter((c) => !c.isSequentialIndex);

  const pool =
    nonSequential.length > 0
      ? nonSequential
      : aboveThreshold.length > 0
        ? aboveThreshold
        : candidates.filter((c) => c.ratio > 0);

  if (pool.length === 0) {
    throw new Error("No numeric column found in any table on the page.");
  }

  const winner = best(pool);
  return {
    table: winner.table,
    columnIndex: winner.columnIndex,
    header: winner.header,
    rawValues: winner.rawValues,
  };
}
