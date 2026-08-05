/**
 * E36 Test Suite: Crime & Safety Engine
 *
 * Tests cover:
 * - Safety score and category analysis
 * - Crime rates by category (violent, property, drug)
 * - Police presence and emergency response
 * - Trend analysis (year-over-year)
 * - Comparative neighborhood safety
 * - Cross-jurisdiction comparisons
 */

import { crimeSafetyEngine } from '../src/E36-crime-safety-engine';

describe('E36: Crime & Safety Engine', () => {
  describe('Toronto Safety', () => {
    it('should show Yorkville as safest Toronto neighborhood', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.safetyScore).toBe(84);
      expect(result.safetyCategory).toBe('Very Safe');
      expect(result.violentCrimeRate).toBe(45);
      expect(result.propertyCrimeRate).toBe(520);
    });

    it('should show Scarborough as higher-risk Toronto neighborhood', () => {
      const yorkville = crimeSafetyEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      const scarborough = crimeSafetyEngine({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(scarborough.safetyScore).toBeLessThan(yorkville.safetyScore);
      expect(scarborough.violentCrimeRate).toBeGreaterThan(yorkville.violentCrimeRate);
      expect(scarborough.safetyCategory).toBe('Moderate Risk');
    });

    it('should show safety improvements in Yorkville year-over-year', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.crimeChange12m).toBeLessThan(0);
      expect(result.violentCrimeTrend).toBeLessThan(0);
    });
  });

  describe('Vancouver Safety', () => {
    it('should show North Shore as safest Vancouver neighborhood', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'vancouver-north-shore-bc',
        neighborhoodName: 'North Shore',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.safetyScore).toBe(82);
      expect(result.safetyCategory).toBe('Very Safe');
    });

    it('should show Downtown Vancouver with higher crime than West Side', () => {
      const westSide = crimeSafetyEngine({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      const downtown = crimeSafetyEngine({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(downtown.totalCrimeRate).toBeGreaterThan(westSide.totalCrimeRate);
      expect(downtown.safetyScore).toBeLessThan(westSide.safetyScore);
    });

    it('should show East Vancouver with highest crime in region', () => {
      const east = crimeSafetyEngine({
        neighborhoodId: 'vancouver-east-bc',
        neighborhoodName: 'East Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      const north = crimeSafetyEngine({
        neighborhoodId: 'vancouver-north-shore-bc',
        neighborhoodName: 'North Shore',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(east.totalCrimeRate).toBeGreaterThan(north.totalCrimeRate);
      expect(east.crimeChange12m).toBeGreaterThan(north.crimeChange12m);
    });
  });

  describe('Montreal Safety', () => {
    it('should show West Island as safest Montreal neighborhood', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'montreal-west-island-qc',
        neighborhoodName: 'West Island',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.safetyScore).toBe(86);
      expect(result.safetyCategory).toBe('Very Safe');
      expect(result.violentCrimeRate).toBe(38);
    });

    it('should show stable safety trends in Plateau', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'montreal-plateau-qc',
        neighborhoodName: 'Plateau-Mont-Royal',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.crimeChange12m).toBeLessThan(0);
      expect(result.safetyCategory).toBe('Safe');
    });
  });

  describe('US Safety', () => {
    it('should show Manhattan as moderate-risk US downtown', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'new-york-manhattan-ny',
        neighborhoodName: 'Manhattan',
        cityId: 'new-york-ny',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.safetyScore).toBe(74);
      expect(result.safetyCategory).toBe('Safe');
      expect(result.totalCrimeRate).toBeGreaterThan(1000);
    });

    it('should show Santa Monica as safer than San Francisco downtown', () => {
      const santa = crimeSafetyEngine({
        neighborhoodId: 'los-angeles-santa-monica-ca',
        neighborhoodName: 'Santa Monica',
        cityId: 'los-angeles-ca',
        asOfDate: new Date('2026-08-04'),
      });

      const sf = crimeSafetyEngine({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        asOfDate: new Date('2026-08-04'),
      });

      expect(santa.safetyScore).toBeGreaterThan(sf.safetyScore);
      expect(santa.totalCrimeRate).toBeLessThan(sf.totalCrimeRate);
    });

    it('should show Chicago Loop with increasing crime trends', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'chicago-loop-il',
        neighborhoodName: 'The Loop',
        cityId: 'chicago-il',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.crimeChange12m).toBeGreaterThan(0);
      expect(result.violentCrimeTrend).toBeGreaterThan(0);
      expect(result.safetyCategory).toBe('Moderate Risk');
    });
  });

  describe('Police Presence & Emergency Response', () => {
    it('should show higher police staffing in dense downtown cores', () => {
      const manhattan = crimeSafetyEngine({
        neighborhoodId: 'new-york-manhattan-ny',
        neighborhoodName: 'Manhattan',
        cityId: 'new-york-ny',
        asOfDate: new Date('2026-08-04'),
      });

      const suburban = crimeSafetyEngine({
        neighborhoodId: 'montreal-west-island-qc',
        neighborhoodName: 'West Island',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(manhattan.policeOfficersPerCapita).toBeGreaterThan(suburban.policeOfficersPerCapita);
    });

    it('should show faster emergency response in downtown cores', () => {
      const downtown = crimeSafetyEngine({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      const suburban = crimeSafetyEngine({
        neighborhoodId: 'vancouver-north-shore-bc',
        neighborhoodName: 'North Shore',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(downtown.emergencyResponseTime).toBeLessThan(suburban.emergencyResponseTime);
    });
  });

  describe('Crime Rate Breakdowns', () => {
    it('should show violent crime consistently lower than property crime', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.violentCrimeRate).toBeLessThan(result.propertyCrimeRate);
    });

    it('should show drug crime correlation with total crime rate', () => {
      const safe = crimeSafetyEngine({
        neighborhoodId: 'montreal-west-island-qc',
        neighborhoodName: 'West Island',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      const urban = crimeSafetyEngine({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(urban.drugCrimeRate).toBeGreaterThan(safe.drugCrimeRate);
    });
  });

  describe('Comparative Metrics', () => {
    it('should show downtown cores above city and national averages', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.saferThanCityAverage).toBe(false);
      expect(result.saferThanNational).toBe(false);
    });

    it('should show suburban neighborhoods below national crime averages', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'montreal-west-island-qc',
        neighborhoodName: 'West Island',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.saferThanCityAverage).toBe(true);
      expect(result.saferThanNational).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown neighborhood', () => {
      expect(() =>
        crimeSafetyEngine({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No crime and safety data available/);
    });
  });

  describe('Data Validation & Metadata', () => {
    it('should have all required output fields', () => {
      const result = crimeSafetyEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('safetyScore');
      expect(result).toHaveProperty('safetyCategory');
      expect(result).toHaveProperty('violentCrimeRate');
      expect(result).toHaveProperty('propertyCrimeRate');
      expect(result).toHaveProperty('incidents');
      expect(result).toHaveProperty('policeOfficersPerCapita');
      expect(result).toHaveProperty('emergencyResponseTime');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
    });
  });
});
