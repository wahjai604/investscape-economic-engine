/**
 * E41 Test Suite: Market Cycle Indicator Engine
 *
 * Tests cover:
 * - Cycle phase identification
 * - Leading indicators assessment
 * - Turning point prediction
 * - Cycle momentum analysis
 * - Investment strategy recommendations
 */

import { marketCycleIndicator } from '../src/E41-market-cycle-indicator';

describe('E41: Market Cycle Indicator Engine', () => {

  describe('Toronto Cycle Analysis', () => {

    it('should show Downtown approaching peak', () => {
      const result = marketCycleIndicator({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.currentPhase).toBe('Late Expansion');
      expect(result.phaseMaturity).toBeGreaterThan(65);
      expect(result.cycleHealth).toBe('Mature');
      expect(result.investmentTiming).toBe('Late-Cycle');
    });

    it('should show Scarborough in contraction', () => {
      const result = marketCycleIndicator({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.currentPhase).toBe('Contraction');
      expect(result.cycleHealth).toBe('Weak');
      expect(result.recommendedStrategy).toBe('Wait');
    });

    it('should show North York in early expansion', () => {
      const result = marketCycleIndicator({
        neighborhoodId: 'toronto-north-york-on',
        neighborhoodName: 'North York',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.currentPhase).toBe('Early Expansion');
      expect(result.cycleHealth).toBe('Healthy');
      expect(result.investmentTiming).toBe('Early');
      expect(result.recommendedStrategy).toBe('Aggressive');
    });
  });

  describe('Vancouver Cycle Analysis', () => {

    it('should show East Vancouver approaching peak', () => {
      const result = marketCycleIndicator({
        neighborhoodId: 'vancouver-east-bc',
        neighborhoodName: 'East Vancouver',
        cityId: 'vancouver-bc',
        regionId: 'west-coast-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.currentPhase).toBe('Late Expansion');
      expect(result.phaseMaturity).toBeGreaterThan(75);
      expect(result.turningPoint.monthsUntilTurning).toBeLessThan(10);
      expect(result.turningPoint.probabilityPercent).toBeGreaterThan(80);
    });
  });

  describe('US Cycle Analysis', () => {

    it('should show Austin at peak risk', () => {
      const result = marketCycleIndicator({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        regionId: 'us-south',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.investmentTiming).toBe('Peak');
      expect(result.recommendedStrategy).toBe('Exit');
      expect(result.currentRiskLevel).toBeGreaterThan(80);
    });

    it('should show San Francisco in severe contraction', () => {
      const result = marketCycleIndicator({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        regionId: 'us-west',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.currentPhase).toBe('Contraction');
      expect(result.cycleHealth).toBe('Distressed');
      expect(result.momentumScore).toBeLessThan(-70);
    });
  });

  describe('Leading Indicators', () => {

    it('should show leading indicators predict cycle turns', () => {
      const result = marketCycleIndicator({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.leadingIndicators.length).toBeGreaterThan(0);
      expect(result.leadingIndicators[0]).toHaveProperty('signal');
      expect(result.leadingIndicators[0]).toHaveProperty('magnitude');
    });
  });

  describe('Turning Point Analysis', () => {

    it('should show early expansion cycles have long runways', () => {
      const result = marketCycleIndicator({
        neighborhoodId: 'toronto-north-york-on',
        neighborhoodName: 'North York',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.turningPoint.monthsUntilTurning).toBeGreaterThan(15);
    });

    it('should show late expansion cycles near turning points', () => {
      const result = marketCycleIndicator({
        neighborhoodId: 'vancouver-east-bc',
        neighborhoodName: 'East Vancouver',
        cityId: 'vancouver-bc',
        regionId: 'west-coast-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.turningPoint.monthsUntilTurning).toBeLessThan(12);
      expect(result.turningPoint.probabilityPercent).toBeGreaterThan(80);
    });
  });

  describe('Error Handling', () => {

    it('should throw error for unknown neighborhood', () => {
      expect(() =>
        marketCycleIndicator({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          regionId: 'atlantis-region',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No market cycle data available/);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should have all required output fields', () => {
      const result = marketCycleIndicator({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('currentPhase');
      expect(result).toHaveProperty('phaseMaturity');
      expect(result).toHaveProperty('cycleHealth');
      expect(result).toHaveProperty('leadingIndicators');
      expect(result).toHaveProperty('turningPoint');
      expect(result).toHaveProperty('cycleMomentum');
      expect(result).toHaveProperty('investmentTiming');
      expect(result).toHaveProperty('recommendedStrategy');
    });
  });
});
