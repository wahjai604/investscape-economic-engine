/**
 * InvestScape™ Test Suite
 * © 2026 Lighthouse Research Ltd. All rights reserved.
 *
 * Test methodology and validation data are proprietary.
 * See LICENSE for usage restrictions.
 */

/**
 * E32 Test Suite: Comparable Sales Analysis Engine
 *
 * Tests cover:
 * - Comparable sales by property type (SFH, CONDO, MFH)
 * - Price distributions across neighborhoods
 * - Price per sqft metrics
 * - Market velocity (days on market, transaction volume)
 * - Outlier detection thresholds
 * - Price trend analysis
 * - Cross-neighborhood and cross-property-type comparisons
 */

import { comparableSalesAnalysis } from '../src/E32-comparable-sales-analysis';

describe('E32: Comparable Sales Analysis Engine', () => {

  describe('Toronto Comps', () => {

    it('should show Downtown Toronto SFH as luxury segment', () => {
      const result = comparableSalesAnalysis({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianPrice).toBe(1650000);
      expect(result.pricePerSqft).toBe(2100);
      expect(result.priceDistribution.p50).toBe(1650000);
      expect(result.daysOnMarket).toBe(12); // Fast market
      expect(result.priceChange12m).toBe(4.2);
      expect(result.confidence).toBe('high');
    });

    it('should show Downtown Toronto CONDO as higher volume than SFH', () => {
      const sfh = comparableSalesAnalysis({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const condo = comparableSalesAnalysis({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'CONDO',
        asOfDate: new Date('2026-08-04'),
      });

      expect(condo.soldVolume12m).toBeGreaterThan(sfh.soldVolume12m);
      expect(condo.medianPrice).toBeLessThan(sfh.medianPrice);
    });

    it('should show Yorkville as most expensive Toronto neighborhood for SFH', () => {
      const yorkville = comparableSalesAnalysis({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const downtown = comparableSalesAnalysis({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(yorkville.medianPrice).toBeGreaterThan(downtown.medianPrice);
      expect(yorkville.pricePerSqft).toBeGreaterThan(downtown.pricePerSqft);
    });

    it('should show Scarborough as most affordable Toronto SFH market', () => {
      const scarborough = comparableSalesAnalysis({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const yorkville = comparableSalesAnalysis({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(scarborough.medianPrice).toBeLessThan(yorkville.medianPrice);
      expect(scarborough.daysOnMarket).toBeGreaterThan(yorkville.daysOnMarket);
    });

    it('should detect outlier prices correctly', () => {
      const result = comparableSalesAnalysis({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.outlierLowThreshold).toBe(1200000); // Below this = distressed
      expect(result.outlierHighThreshold).toBe(3500000); // Above this = premium
      expect(result.medianPrice).toBeGreaterThan(result.outlierLowThreshold);
      expect(result.medianPrice).toBeLessThan(result.outlierHighThreshold);
    });
  });

  describe('Vancouver Comps', () => {

    it('should show West Side SFH as most expensive Vancouver', () => {
      const westSide = comparableSalesAnalysis({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const downtown = comparableSalesAnalysis({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(westSide.medianPrice).toBeGreaterThan(downtown.medianPrice);
      expect(westSide.pricePerSqft).toBeGreaterThan(downtown.pricePerSqft);
    });

    it('should show strong appreciation in Vancouver', () => {
      const westSide = comparableSalesAnalysis({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(westSide.priceChange12m).toBe(5.8); // Strong growth
    });
  });

  describe('US Comps', () => {

    it('should show Manhattan SFH as most expensive US market', () => {
      const manhattan = comparableSalesAnalysis({
        neighborhoodId: 'new-york-manhattan-ny',
        neighborhoodName: 'Manhattan',
        cityId: 'new-york-ny',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const losAngeles = comparableSalesAnalysis({
        neighborhoodId: 'los-angeles-santa-monica-ca',
        neighborhoodName: 'Santa Monica',
        cityId: 'los-angeles-ca',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(manhattan.medianPrice).toBeGreaterThan(losAngeles.medianPrice);
    });

    it('should show Austin as fastest appreciating US market', () => {
      const austin = comparableSalesAnalysis({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const sanFrancisco = comparableSalesAnalysis({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(austin.priceChange12m).toBeGreaterThan(sanFrancisco.priceChange12m);
      expect(austin.daysOnMarket).toBeLessThan(sanFrancisco.daysOnMarket);
    });

    it('should show Miami with strong rental and appreciation growth', () => {
      const miami = comparableSalesAnalysis({
        neighborhoodId: 'miami-brickell-fl',
        neighborhoodName: 'Brickell',
        cityId: 'miami-fl',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(miami.priceChange12m).toBe(6.8); // Strong growth
      expect(miami.daysOnMarket).toBe(15); // Fast market
    });

    it('should show Chicago cheaper than Manhattan for condos', () => {
      const chicago = comparableSalesAnalysis({
        neighborhoodId: 'chicago-loop-il',
        neighborhoodName: 'The Loop',
        cityId: 'chicago-il',
        propertyType: 'CONDO',
        asOfDate: new Date('2026-08-04'),
      });

      const manhattan = comparableSalesAnalysis({
        neighborhoodId: 'new-york-manhattan-ny',
        neighborhoodName: 'Manhattan',
        cityId: 'new-york-ny',
        propertyType: 'CONDO',
        asOfDate: new Date('2026-08-04'),
      });

      expect(chicago.medianPrice).toBeLessThan(manhattan.medianPrice);
    });
  });

  describe('Property Type Analysis', () => {

    it('should show CONDO prices lower than SFH in same neighborhood', () => {
      const sfh = comparableSalesAnalysis({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const condo = comparableSalesAnalysis({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'CONDO',
        asOfDate: new Date('2026-08-04'),
      });

      expect(condo.medianPrice).toBeLessThan(sfh.medianPrice);
      expect(condo.soldVolume12m).toBeGreaterThan(sfh.soldVolume12m);
    });

    it('should show CONDO with higher turnover than SFH', () => {
      const sfh = comparableSalesAnalysis({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const condo = comparableSalesAnalysis({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'CONDO',
        asOfDate: new Date('2026-08-04'),
      });

      expect(condo.soldVolume12m).toBeGreaterThan(sfh.soldVolume12m);
    });
  });

  describe('Market Velocity', () => {

    it('should show Austin Downtown with fastest DOM', () => {
      const austin = comparableSalesAnalysis({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const sanFrancisco = comparableSalesAnalysis({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(austin.daysOnMarket).toBeLessThan(sanFrancisco.daysOnMarket);
    });

    it('should show cooling markets with increasing DOM', () => {
      const sanFrancisco = comparableSalesAnalysis({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(sanFrancisco.daysOnMarketTrend).toBeGreaterThan(0); // DOM increasing
      expect(sanFrancisco.priceChange12m).toBeLessThan(2.0); // Slower appreciation
    });
  });

  describe('Price Distributions', () => {

    it('should show price distributions with correct quartiles', () => {
      const result = comparableSalesAnalysis({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceDistribution.p25).toBeLessThan(result.priceDistribution.p50);
      expect(result.priceDistribution.p50).toBeLessThan(result.priceDistribution.p75);
      expect(result.priceDistribution.p50).toBe(result.medianPrice);
    });

    it('should show wider distribution in luxury markets', () => {
      const yorkville = comparableSalesAnalysis({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const scarborough = comparableSalesAnalysis({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const yorkvilleDelta = yorkville.priceDistribution.p75 - yorkville.priceDistribution.p25;
      const scarboroughDelta = scarborough.priceDistribution.p75 - scarborough.priceDistribution.p25;

      expect(yorkvilleDelta).toBeGreaterThan(scarboroughDelta); // Wider distribution
    });
  });

  describe('Error Handling', () => {

    it('should throw error for unknown neighborhood', () => {
      expect(() =>
        comparableSalesAnalysis({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          propertyType: 'SFH',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No comparable sales data available/);
    });

    it('should throw error for invalid property type', () => {
      expect(() =>
        comparableSalesAnalysis({
          neighborhoodId: 'toronto-downtown-on',
          neighborhoodName: 'Downtown Toronto',
          cityId: 'toronto-on',
          propertyType: 'INVALID' as any,
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No comparable sales data available/);
    });
  });

  describe('Cross-Market Comparisons', () => {

    it('should show Yorkville SFH pricier than Vancouver West Side SFH', () => {
      const vancouver = comparableSalesAnalysis({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      const toronto = comparableSalesAnalysis({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(toronto.medianPrice).toBeGreaterThan(vancouver.medianPrice);
    });

    it('should show San Francisco CONDO pricier than Vancouver West Side CONDO', () => {
      const sanFrancisco = comparableSalesAnalysis({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        propertyType: 'CONDO',
        asOfDate: new Date('2026-08-04'),
      });

      const vancouver = comparableSalesAnalysis({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'CONDO',
        asOfDate: new Date('2026-08-04'),
      });

      expect(sanFrancisco.medianPrice).toBeGreaterThan(vancouver.medianPrice);
      expect(sanFrancisco.pricePerSqft).toBeGreaterThan(vancouver.pricePerSqft);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should have all required output fields', () => {
      const result = comparableSalesAnalysis({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'SFH',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('neighborhoodId');
      expect(result).toHaveProperty('neighborhoodName');
      expect(result).toHaveProperty('cityId');
      expect(result).toHaveProperty('propertyType');
      expect(result).toHaveProperty('asOfDate');
      expect(result).toHaveProperty('medianPrice');
      expect(result).toHaveProperty('pricePerSqft');
      expect(result).toHaveProperty('priceDistribution');
      expect(result).toHaveProperty('daysOnMarket');
      expect(result).toHaveProperty('soldVolume12m');
      expect(result).toHaveProperty('priceChange12m');
      expect(result).toHaveProperty('daysOnMarketTrend');
      expect(result).toHaveProperty('outlierLowThreshold');
      expect(result).toHaveProperty('outlierHighThreshold');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
    });
  });
});
