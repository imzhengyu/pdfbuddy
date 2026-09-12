import { describe, it, expect } from 'vitest';
import { parsePageRanges, parsePageRangeInput } from '../../src/utils/pageRangeUtils';

describe('parsePageRanges', () => {
  it('returns empty array for empty input', () => {
    expect(parsePageRanges('', 10)).toEqual([]);
  });

  it('parses single pages', () => {
    expect(parsePageRanges('1, 3, 5', 10)).toEqual([1, 3, 5]);
  });

  it('parses page ranges', () => {
    expect(parsePageRanges('1-3', 10)).toEqual([1, 2, 3]);
  });

  it('parses mixed single pages and ranges', () => {
    expect(parsePageRanges('1-3, 5, 7-9', 10)).toEqual([1, 2, 3, 5, 7, 8, 9]);
  });

  it('removes duplicates', () => {
    expect(parsePageRanges('1, 1-2, 2', 10)).toEqual([1, 2]);
  });

  it('sorts pages in ascending order', () => {
    expect(parsePageRanges('5, 1, 3', 10)).toEqual([1, 3, 5]);
  });

  it('clamps ranges to maxPages', () => {
    expect(parsePageRanges('1-10', 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('ignores pages above maxPages', () => {
    expect(parsePageRanges('1, 5, 100', 5)).toEqual([1, 5]);
  });

  it('ignores invalid parts', () => {
    expect(parsePageRanges('1, abc, 3-xyz, 5', 10)).toEqual([1, 5]);
  });

  it('handles whitespace around separators', () => {
    expect(parsePageRanges('  1 - 3 ,  5  ', 10)).toEqual([1, 2, 3, 5]);
  });

  it('reports malformed tokens instead of silently dropping pages (B-2)', () => {
    const result = parsePageRangeInput('1-3-5', 10);

    expect(result.pages).toEqual([]);
    expect(result.errors).toEqual(['"1-3-5" is not a valid range']);
  });

  it('reports backwards ranges instead of returning nothing', () => {
    const result = parsePageRangeInput('5-3', 10);

    expect(result.pages).toEqual([]);
    expect(result.errors).toEqual(['"5-3" runs backwards']);
  });

  it('reports pages beyond the document and keeps the valid ones', () => {
    const result = parsePageRangeInput('1-2, 99', 5);

    expect(result.pages).toEqual([1, 2]);
    expect(result.errors).toEqual(['Page 99 is outside 1-5']);
  });

  it('reports the first page of a range that runs past the document', () => {
    const result = parsePageRangeInput('4-10', 5);

    expect(result.pages).toEqual([4, 5]);
    expect(result.errors).toEqual(['Page 6 is outside 1-5']);
  });

  it('does not enforce an upper bound before the page count is known', () => {
    const result = parsePageRangeInput('1-3', 0);

    expect(result.pages).toEqual([1, 2, 3]);
    expect(result.errors).toEqual([]);
  });

  it('reports non-numeric tokens', () => {
    const result = parsePageRangeInput('abc, 3-xyz', 10);

    expect(result.pages).toEqual([]);
    expect(result.errors).toEqual([
      '"abc" is not a valid page number',
      '"3-xyz" is not a valid range'
    ]);
  });
});
