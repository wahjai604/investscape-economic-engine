/**
 * InvestScape™ Test Suite
 * © 2026 Lighthouse Research Ltd. All rights reserved.
 *
 * Test methodology and validation data are proprietary.
 * See LICENSE for usage restrictions.
 */

/**
 * E40 Test Suite: Appreciation Probability Engine
 *
 * Tests cover:
 * - Appreciation forecasts and probability
 * - Cycle position and momentum
 * - Risk-adjusted return metrics
 * - Cross-neighborhood comparisons
 * - Performance vs city/region/national
 */

import { appreciationProbability } from '../src/E40-appreciation-probability';

describe('E40: Appreciation Probability Engine', () => {

  describe('Toronto Appreciation', () => {

    it('should show Downtown with highest appreciation forecast', () => {
      const result = appreciationProbability({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.forecast1y.expectedAppreciation).toBe(4.5);
      expect(result.forecast1y.probabilityOfAppreciation).toBe(75);
      expect(result.outperformingCity).toBe(true);
    });

    it('should show Scarborough with weakest appreciation outlook', () => {
      const result = appreciationProbability({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.forecast1y.expectedAppreciation).toBeLessThan(1.0);
      expect(result.forecast1y.probabilityOfAppreciation).toBeLessThan(55);
      expect(result.outlook).toBe('Cautious');
    });
  });

  describe('Vancouver Appreciation', () => {

    it('should show East Vancouver with strongest appreciation', () => {
      const result = appreciationProbability({
        neighborhoodId: 'vancouver-east-bc',
        neighborhoodName: 'East Vancouver',
        cityId: 'vancouver-bc',
        regionId: 'west-coast-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.forecast1y.expectedAppreciation).toBe(5.8);
      expect(result.forecast1y.probabilityOfAppreciation).toBe(80);
      expect(result.cycleMomentum).toBe('Accelerating');
    });
  });

  describe('Cycle Position', () => {

    it('should show downtown cores in late expansion', () => {
      const result = appreciationProbability({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.cyclePosition.phaseName).toBe('Late Expansion');
      expect(result.cyclePosition.phaseCompletion).toBeGreaterThan(60);
    });

    it('should show Scarborough in contraction phase', () => {
      const result = appreciationProbability({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.cyclePosition.phaseName).toBe('Contraction');
      expect(result.cycleMomentum).toBe('Decelerating');
      expect(result.cycleMomentumScore).toBeLessThan(0);
    });
  });

  describe('Risk-Adjusted Returns', () => {

    it('should show higher Sharpe ratio in stable markets', () => {
      const downtown = appreciationProbability({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      const scarborough = appreciationProbability({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(downtown.riskAdjustedMetrics.sharpeRatio).toBeGreaterThan(scarborough.riskAdjustedMetrics.sharpeRatio);
    });
  });

  describe('Cross-Market Comparisons', () => {

    it('should show San Francisco with negative appreciation outlook', () => {
      const result = appreciationProbability({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        regionId: 'us-west',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.forecast1y.expectedAppreciation).toBeLessThan(0);
      expect(result.outlook).toBe('Weak');
      expect(result.cycleMomentum).toBe('Reversing');
    });

    it('should show Austin with strongest US appreciation', () => {
      const result = appreciationProbability({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        regionId: 'us-south',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.forecast1y.expectedAppreciation).toBeGreaterThan(7.0);
      expect(result.outlook).toBe('Strong');
    });
  });

  describe('Error Handling', () => {

    it('should throw error for unknown neighborhood', () => {
      expect(() =>
        appreciationProbability({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          regionId: 'atlantis-region',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No appreciation probability data available/);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should have all required output fields', () => {
      const result = appreciationProbability({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('priceChange1y');
      expect(result).toHaveProperty('forecast1y');
      expect(result).toHaveProperty('forecast3y');
      expect(result).toHaveProperty('forecast5y');
      expect(result).toHaveProperty('cyclePosition');
      expect(result).toHaveProperty('cycleMomentum');
      expect(result).toHaveProperty('riskAdjustedMetrics');
      expect(result).toHaveProperty('outlook');
      expect(result.riskAdjustedMetrics).toHaveProperty('sharpeRatio');
    });
  });
});
