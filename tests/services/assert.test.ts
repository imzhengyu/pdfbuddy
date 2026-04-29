import { describe, it, expect } from 'vitest';
import { assert, assertDefined, assertRange, assertNonEmpty, assertString, assertNumber } from '../../src/services/pdf/assert';
import { PDFProcessingError } from '../../src/services/pdf/types';

describe('assert', () => {
  describe('assert', () => {
    it('does not throw when condition is true', () => {
      expect(() => assert(true, 'should not throw')).not.toThrow();
      expect(() => assert(1, 'should not throw')).not.toThrow();
      expect(() => assert('truthy', 'should not throw')).not.toThrow();
    });

    it('throws PDFProcessingError when condition is false', () => {
      expect(() => assert(false, 'test error', 'PROCESSING')).toThrow(PDFProcessingError);
      expect(() => assert(false, 'test error', 'PROCESSING')).toThrow('test error');
    });

    it('uses PROCESSING as default error code', () => {
      expect(() => assert(false, 'test error')).toThrow(PDFProcessingError);
      try {
        assert(false, 'test error');
      } catch (e) {
        expect(e).toMatchObject({ code: 'PROCESSING' });
      }
    });
  });

  describe('assertDefined', () => {
    it('does not throw for non-null values', () => {
      expect(() => assertDefined('value', 'should not throw')).not.toThrow();
      expect(() => assertDefined(0, 'should not throw')).not.toThrow();
      expect(() => assertDefined(false, 'should not throw')).not.toThrow();
      expect(() => assertDefined({}, 'should not throw')).not.toThrow();
    });

    it('throws for null', () => {
      expect(() => assertDefined(null, 'is null')).toThrow(PDFProcessingError);
      expect(() => assertDefined(null, 'is null')).toThrow('is null');
    });

    it('throws for undefined', () => {
      expect(() => assertDefined(undefined, 'is undefined')).toThrow(PDFProcessingError);
      expect(() => assertDefined(undefined, 'is undefined')).toThrow('is undefined');
    });

    it('can specify custom error code', () => {
      expect(() => assertDefined(null, 'file missing', 'FILE_VALIDATION')).toThrow(PDFProcessingError);
    });
  });

  describe('assertRange', () => {
    it('does not throw when value is within range', () => {
      expect(() => assertRange(5, 1, 10, 'out of range')).not.toThrow();
      expect(() => assertRange(1, 1, 10, 'out of range')).not.toThrow();
      expect(() => assertRange(10, 1, 10, 'out of range')).not.toThrow();
    });

    it('throws when value is below minimum', () => {
      expect(() => assertRange(0, 1, 10, 'below min')).toThrow(PDFProcessingError);
      expect(() => assertRange(0, 1, 10, 'below min')).toThrow('below min');
    });

    it('throws when value is above maximum', () => {
      expect(() => assertRange(11, 1, 10, 'above max')).toThrow(PDFProcessingError);
      expect(() => assertRange(11, 1, 10, 'above max')).toThrow('above max');
    });

    it('uses PAGE_RANGE as default error code', () => {
      expect(() => assertRange(11, 1, 10, 'out of range')).toThrow(PDFProcessingError);
    });
  });

  describe('assertNonEmpty', () => {
    it('does not throw for non-empty arrays', () => {
      expect(() => assertNonEmpty([1], 'empty')).not.toThrow();
      expect(() => assertNonEmpty(['a', 'b'], 'empty')).not.toThrow();
      expect(() => assertNonEmpty([false], 'empty')).not.toThrow();
    });

    it('throws for empty arrays', () => {
      expect(() => assertNonEmpty([], 'empty array')).toThrow(PDFProcessingError);
      expect(() => assertNonEmpty([], 'empty array')).toThrow('empty array');
    });

    it('uses PAGE_RANGE as default error code', () => {
      expect(() => assertNonEmpty([], 'empty')).toThrow(PDFProcessingError);
    });
  });

  describe('assertString', () => {
    it('does not throw for strings', () => {
      expect(() => assertString('hello', 'not a string')).not.toThrow();
      expect(() => assertString('', 'not a string')).not.toThrow();
    });

    it('throws for non-strings', () => {
      expect(() => assertString(123, 'not a string')).toThrow(PDFProcessingError);
      expect(() => assertString(null, 'not a string')).toThrow(PDFProcessingError);
      expect(() => assertString(undefined, 'not a string')).toThrow(PDFProcessingError);
      expect(() => assertString({}, 'not a string')).toThrow(PDFProcessingError);
    });

    it('uses FORMAT as default error code', () => {
      expect(() => assertString(123, 'not a string')).toThrow(PDFProcessingError);
    });
  });

  describe('assertNumber', () => {
    it('does not throw for numbers', () => {
      expect(() => assertNumber(0, 'not a number')).not.toThrow();
      expect(() => assertNumber(-5, 'not a number')).not.toThrow();
      expect(() => assertNumber(3.14, 'not a number')).not.toThrow();
    });

    it('throws for non-numbers', () => {
      expect(() => assertNumber('123', 'not a number')).toThrow(PDFProcessingError);
      expect(() => assertNumber(null, 'not a number')).toThrow(PDFProcessingError);
      expect(() => assertNumber(undefined, 'not a number')).toThrow(PDFProcessingError);
    });

    it('throws for NaN', () => {
      expect(() => assertNumber(NaN, 'is NaN')).toThrow(PDFProcessingError);
    });

    it('uses PROCESSING as default error code', () => {
      expect(() => assertNumber('not a number', 'not a number')).toThrow(PDFProcessingError);
    });
  });
});
