/**
 * Result of reading the page-range input.
 *
 * @param pages - Sorted, de-duplicated page numbers that the input asked for
 * @param errors - Human-readable problems with the input; empty when it is clean
 */
export interface PageRangeParseResult {
  pages: number[];
  errors: string[];
}

/**
 * Parses a comma-separated list of page ranges.
 * Supports single pages (e.g., "1,3,5") and ranges (e.g., "1-3").
 *
 * Malformed tokens are reported in `errors` instead of being silently dropped,
 * so the UI can tell the user why fewer pages than expected were selected:
 * - more than one dash ("1-3-5")
 * - backwards ranges ("5-3")
 * - non-numeric parts ("1, abc")
 * - pages beyond the document ("1-10" on a 5-page file)
 *
 * When `maxPages` is not known yet (0), the upper bound is not enforced.
 *
 * @param input - Comma-separated page numbers or ranges
 * @param maxPages - Maximum valid page number, or 0 when it is not known yet
 */
export function parsePageRangeInput(input: string, maxPages: number): PageRangeParseResult {
  const pages: number[] = [];
  const errors: string[] = [];
  const parts = input.split(',');

  const hasKnownLength = maxPages >= 1;
  const outOfRange = (page: number) => errors.push(`Page ${page} is outside 1-${maxPages}`);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const segments = trimmed.split('-').map((segment) => segment.trim());

    if (segments.length > 2) {
      errors.push(`"${trimmed}" is not a valid range`);
      continue;
    }

    if (segments.length === 2) {
      const start = parseInt(segments[0], 10);
      const end = parseInt(segments[1], 10);

      if (isNaN(start) || isNaN(end) || start < 1 || end < 1) {
        errors.push(`"${trimmed}" is not a valid range`);
        continue;
      }

      if (start > end) {
        errors.push(`"${trimmed}" runs backwards`);
        continue;
      }

      for (let i = start; i <= end; i++) {
        if (hasKnownLength && i > maxPages) {
          outOfRange(i);
          break;
        }
        if (!pages.includes(i)) pages.push(i);
      }
      continue;
    }

    const num = parseInt(segments[0], 10);
    if (isNaN(num) || num < 1) {
      errors.push(`"${trimmed}" is not a valid page number`);
      continue;
    }
    if (hasKnownLength && num > maxPages) {
      outOfRange(num);
      continue;
    }
    if (!pages.includes(num)) pages.push(num);
  }

  return { pages: pages.sort((a, b) => a - b), errors };
}

/**
 * Parses a comma-separated list of page ranges into a sorted array of unique
 * page numbers. Values are clamped to the range [1, maxPages].
 *
 * Use {@link parsePageRangeInput} when the caller needs to explain invalid
 * input to the user; this helper only returns the pages.
 *
 * @param input - Comma-separated page numbers or ranges
 * @param maxPages - Maximum valid page number
 * @returns Sorted array of unique page numbers, or empty array if input is empty/invalid
 */
export function parsePageRanges(input: string, maxPages: number): number[] {
  return parsePageRangeInput(input, maxPages).pages;
}
