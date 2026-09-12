/**
 * Turns raw Wikipedia table cell text into numbers.
 *
 * Assumption: a leading hyphen-minus ("-5") is a negative sign, but an en
 * dash ("–", Wikipedia's usual "no data" placeholder) is not a minus
 * sign and is deliberately left non-numeric so it gets dropped rather than
 * silently becoming 0.
 */
export function cleanNumericValues(raw: string[]): number[] {
  const values: number[] = [];

  for (const cell of raw) {
    const withoutFootnotes = cell.replace(/\[[^\]]*\]/g, "");
    const withoutThousandsCommas = withoutFootnotes.replace(/,/g, "");
    const match = withoutThousandsCommas.trim().match(/^-?\d+(\.\d+)?/);

    if (match) {
      values.push(parseFloat(match[0]));
    }
  }

  return values;
}
