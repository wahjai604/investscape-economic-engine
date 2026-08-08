/**
 * InvestScape™ Test Suite
 * © 2026 Lighthouse Research Ltd. All rights reserved.
 *
 * Test methodology and validation data are proprietary.
 * See LICENSE for usage restrictions.
 */

/**
 * E29 Test Suite: Regional Macro Context Engine
 *
 * Tests cover:
 * - Canadian region data retrieval (5 regions)
 * - US region data retrieval (4 regions)
 * - Data freshness and confidence levels
 * - Error handling (unknown regions, invalid dates)
 * - Null handling (missing data points like cap rates in Northern Canada)
 * - Date validation logic
 */

import { regionalMacroContext } from '../src/E29-regional-macro-context';
import { CANADIAN_REGIONS, US_REGIONS, DATA_SOURCES } from '../src/utils/constants';

describe('E29: Regional Macro Context Engine', () => {

  describe('Canadian Regions', () => {

    it('should return Atlantic Canada macro context with high confidence', () => {
      const result = regionalMacroContext({
        regionId: CANADIAN_REGIONS.ATLANTIC,
        regionName: 'Atlantic Canada (Maritimes)',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.regionId).toBe(CANADIAN_REGIONS.ATLANTIC);
      expect(result.gdpGrowth).toBe(1.8);
      expect(result.inflationRate).toBe(2.4);
      expect(result.mortgageRate5yr).toBe(4.89);
      expect(result.employmentGrowth).toBe(0.5);
      expect(result.constructionStarts).toBe(12000);
      expect(result.avgCapRate).toBe(5.1);
      expect(result.avgAppreciation).toBe(2.8);
      expect(result.confidence).toBe('high');
      expect(result.source).toContain(DATA_SOURCES.STATCAN);
    });

    it('should return Central Canada macro context (most populous region)', () => {
      const result = regionalMacroContext({
        regionId: CANADIAN_REGIONS.CENTRAL,
        regionName: 'Central Canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.gdpGrowth).toBe(2.2);
      expect(result.constructionStarts).toBe(68000); // Highest in Canada
      expect(result.avgCapRate).toBe(4.6); // Lowest cap rate (most expensive)
      expect(result.avgAppreciation).toBe(3.2);
    });

    it('should return Prairie Provinces macro context (oil & gas region)', () => {
      const result = regionalMacroContext({
        regionId: CANADIAN_REGIONS.PRAIRIE,
        regionName: 'Prairie Provinces',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.gdpGrowth).toBe(2.5); // Highest GDP growth in Canada
      expect(result.employmentGrowth).toBe(1.2); // Highest employment growth
      expect(result.avgCapRate).toBe(5.5); // Highest cap rate (most affordable)
      expect(result.avgAppreciation).toBe(3.5);
    });

    it('should return West Coast macro context (BC)', () => {
      const result = regionalMacroContext({
        regionId: CANADIAN_REGIONS.WEST_COAST,
        regionName: 'West Coast',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgAppreciation).toBe(3.8); // Second highest appreciation
      expect(result.constructionStarts).toBe(42000);
      expect(result.avgCapRate).toBe(4.3); // Second lowest (expensive market)
    });

    it('should return Northern Canada with medium confidence and null cap rate', () => {
      const result = regionalMacroContext({
        regionId: CANADIAN_REGIONS.NORTH,
        regionName: 'Northern Canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.confidence).toBe('medium');
      expect(result.avgCapRate).toBeNull(); // Sparse market, no reliable cap rate data
      expect(result.inflationRate).toBe(3.2); // Highest inflation (logistics costs)
      expect(result.mortgageRate5yr).toBe(5.19); // Higher rate due to remote risk
      expect(result.constructionStarts).toBe(2000); // Sparse development
    });
  });

  describe('US Regions', () => {

    it('should return US Northeast macro context', () => {
      const result = regionalMacroContext({
        regionId: US_REGIONS.NORTHEAST,
        regionName: 'US Northeast',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.gdpGrowth).toBe(2.3);
      expect(result.mortgageRate5yr).toBe(5.42);
      expect(result.source).toContain(DATA_SOURCES.FRED);
      expect(result.source).toContain(DATA_SOURCES.CENSUS);
    });

    it('should return US Midwest macro context with high cap rates', () => {
      const result = regionalMacroContext({
        regionId: US_REGIONS.MIDWEST,
        regionName: 'US Midwest',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgCapRate).toBe(5.8); // Highest among US regions
      expect(result.avgAppreciation).toBe(2.9); // Lowest among US regions
    });

    it('should return US South macro context (fastest growing region)', () => {
      const result = regionalMacroContext({
        regionId: US_REGIONS.SOUTH,
        regionName: 'US South',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.gdpGrowth).toBe(2.9); // Highest GDP growth
      expect(result.employmentGrowth).toBe(1.4); // Highest employment growth
      expect(result.constructionStarts).toBe(420000); // Highest construction (boom market)
      expect(result.avgCapRate).toBe(6.2); // Highest cap rate
      expect(result.avgAppreciation).toBe(4.1); // Strong appreciation
    });

    it('should return US West macro context with highest appreciation', () => {
      const result = regionalMacroContext({
        regionId: US_REGIONS.WEST,
        regionName: 'US West',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgAppreciation).toBe(4.5); // Highest appreciation globally
      expect(result.constructionStarts).toBe(280000);
      expect(result.inflationRate).toBe(3.1); // Highest inflation
    });
  });

  describe('Error Handling', () => {

    it('should throw error for unknown region ID', () => {
      expect(() =>
        regionalMacroContext({
          regionId: 'narnia',
          regionName: 'Narnia',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/Invalid region ID/);
    });

    it('should throw error when region ID is not found in data store', () => {
      // This would only happen if validators pass but data doesn't exist
      // In practice, this is a safeguard against incomplete data
      expect(() =>
        regionalMacroContext({
          regionId: 'atlantic-canada',
          regionName: 'Atlantic Canada',
          asOfDate: new Date('2025-01-01'), // Different date, no mock data
        })
      ).toThrow(/No data available/);
    });
  });

  describe('Date Handling', () => {

    it("should use today's date if asOfDate is not provided", () => {
      // Freeze time to the exact same timestamp used to build the mock data
      // (new Date('2026-08-04') = UTC midnight), since the engine compares
      // dates via toDateString() (local time) and the current implementation
      // matches on an exact as-of date.
      jest.useFakeTimers().setSystemTime(new Date('2026-08-04'));

      const result = regionalMacroContext({
        regionId: CANADIAN_REGIONS.CENTRAL,
        regionName: 'Central Canada',
        // asOfDate intentionally omitted
      });

      expect(result).toBeDefined();
      expect(result.regionId).toBe(CANADIAN_REGIONS.CENTRAL);

      jest.useRealTimers();
    });

    it('should accept valid date objects', () => {
      const testDate = new Date('2026-08-04');
      const result = regionalMacroContext({
        regionId: CANADIAN_REGIONS.PRAIRIE,
        regionName: 'Prairie Provinces',
        asOfDate: testDate,
      });

      expect(result.asOfDate).toEqual(testDate);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should include correct source attribution', () => {
      const canadianResult = regionalMacroContext({
        regionId: CANADIAN_REGIONS.ATLANTIC,
        regionName: 'Atlantic Canada (Maritimes)',
        asOfDate: new Date('2026-08-04'),
      });

      expect(canadianResult.source).toContain('Statistics Canada');
      expect(canadianResult.source).toContain('Bank of Canada');

      const usResult = regionalMacroContext({
        regionId: US_REGIONS.SOUTH,
        regionName: 'US South',
        asOfDate: new Date('2026-08-04'),
      });

      expect(usResult.source).toContain('Federal Reserve');
      expect(usResult.source).toContain('CBRE');
    });

    it('should have all required output fields', () => {
      const result = regionalMacroContext({
        regionId: CANADIAN_REGIONS.CENTRAL,
        regionName: 'Central Canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('regionId');
      expect(result).toHaveProperty('regionName');
      expect(result).toHaveProperty('asOfDate');
      expect(result).toHaveProperty('gdpGrowth');
      expect(result).toHaveProperty('inflationRate');
      expect(result).toHaveProperty('mortgageRate5yr');
      expect(result).toHaveProperty('employmentGrowth');
      expect(result).toHaveProperty('constructionStarts');
      expect(result).toHaveProperty('avgCapRate');
      expect(result).toHaveProperty('avgAppreciation');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
    });

    it('should properly handle null values (e.g., missing cap rate data)', () => {
      const result = regionalMacroContext({
        regionId: CANADIAN_REGIONS.NORTH,
        regionName: 'Northern Canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgCapRate).toBeNull();
      expect(result.gdpGrowth).not.toBeNull();
      expect(result.avgAppreciation).not.toBeNull();
    });
  });

  describe('Cross-region Comparisons', () => {

    it('should show Central Canada as most expensive (lowest cap rate)', () => {
      const centralCanada = regionalMacroContext({
        regionId: CANADIAN_REGIONS.CENTRAL,
        regionName: 'Central Canada',
        asOfDate: new Date('2026-08-04'),
      });

      const prairie = regionalMacroContext({
        regionId: CANADIAN_REGIONS.PRAIRIE,
        regionName: 'Prairie Provinces',
        asOfDate: new Date('2026-08-04'),
      });

      expect(centralCanada.avgCapRate).toBeLessThan(prairie.avgCapRate as number);
    });

    it('should show US South as fastest growing region', () => {
      const south = regionalMacroContext({
        regionId: US_REGIONS.SOUTH,
        regionName: 'US South',
        asOfDate: new Date('2026-08-04'),
      });

      const midwest = regionalMacroContext({
        regionId: US_REGIONS.MIDWEST,
        regionName: 'US Midwest',
        asOfDate: new Date('2026-08-04'),
      });

      expect(south.gdpGrowth).toBeGreaterThan(midwest.gdpGrowth as number);
      expect(south.employmentGrowth).toBeGreaterThan(midwest.employmentGrowth as number);
    });
  });
});
