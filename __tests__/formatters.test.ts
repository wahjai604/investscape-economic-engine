/**
 * InvestScape™ Test Suite
 * © 2026 Lighthouse Research Ltd. All rights reserved.
 *
 * formatters.test.ts — Formatting utilities test suite
 */

import {
  formatPercentage,
  formatCurrency,
  formatNumber,
  formatDate,
} from '../src/utils/formatters';

describe('formatters.ts', () => {
  describe('formatPercentage', () => {
    it('should format a decimal as percentage with default 1 decimal place', () => {
      expect(formatPercentage(0.5)).toBe('50.0%');
    });

    it('should format with custom decimal places', () => {
      expect(formatPercentage(0.333, 2)).toBe('33.30%');
      expect(formatPercentage(0.6667, 3)).toBe('66.670%');
    });

    it('should handle 0 and 1', () => {
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(1)).toBe('100.0%');
    });

    it('should handle null gracefully', () => {
      expect(formatPercentage(null)).toBe('N/A');
    });

    it('should handle small decimals', () => {
      expect(formatPercentage(0.0123)).toBe('1.2%');
      expect(formatPercentage(0.001, 2)).toBe('0.10%');
    });

    it('should handle negative values', () => {
      expect(formatPercentage(-0.25)).toBe('-25.0%');
    });
  });

  describe('formatCurrency', () => {
    it('should format CAD currency by default', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1500000)).toBe('$1,500,000');
    });

    it('should format USD currency when specified', () => {
      // en-CA locale renders USD with a "US$" prefix to disambiguate from CAD.
      expect(formatCurrency(1000, 'USD')).toBe('US$1,000');
      expect(formatCurrency(500000, 'USD')).toBe('US$500,000');
    });

    it('should round to nearest dollar (no decimals)', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
      expect(formatCurrency(1000.49)).toBe('$1,000');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(0, 'USD')).toBe('US$0');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-5000)).toBe('-$5,000');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(999999999)).toBe('$999,999,999');
    });
  });

  describe('formatNumber', () => {
    it('should format with default 2 decimal places', () => {
      expect(formatNumber(1234.5678)).toBe('1,234.57');
      expect(formatNumber(100.1)).toBe('100.10');
    });

    it('should format with custom decimal places', () => {
      expect(formatNumber(3.14159, 3)).toBe('3.142');
      expect(formatNumber(2.7, 1)).toBe('2.7');
      expect(formatNumber(100, 0)).toBe('100');
    });

    it('should add thousand separators', () => {
      expect(formatNumber(1000000)).toBe('1,000,000.00');
      expect(formatNumber(50000.5, 1)).toBe('50,000.5');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0.00');
      expect(formatNumber(0, 3)).toBe('0.000');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234.5)).toBe('-1,234.50');
    });

    it('should handle very small decimals', () => {
      expect(formatNumber(0.001, 3)).toBe('0.001');
      expect(formatNumber(0.0001, 4)).toBe('0.0001');
    });
  });

  describe('formatDate', () => {
    it('should format date as ISO string (YYYY-MM-DD)', () => {
      const date = new Date('2026-08-10T12:34:56Z');
      expect(formatDate(date)).toBe('2026-08-10');
    });

    it('should handle various dates correctly', () => {
      const jan1 = new Date('2026-01-01T00:00:00Z');
      expect(formatDate(jan1)).toBe('2026-01-01');

      const dec31 = new Date('2025-12-31T23:59:59Z');
      expect(formatDate(dec31)).toBe('2025-12-31');
    });

    it('should handle dates in different timezones consistently', () => {
      const date = new Date(Date.UTC(2026, 7, 15)); // Aug 15, 2026 UTC
      expect(formatDate(date)).toBe('2026-08-15');
    });

    it('should format leap year dates', () => {
      const leapDay = new Date('2024-02-29T00:00:00Z');
      expect(formatDate(leapDay)).toBe('2024-02-29');
    });
  });
});
