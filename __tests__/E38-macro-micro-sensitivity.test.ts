/**
 * E38 Test Suite: Macro-to-Micro Sensitivity Engine
 *
 * Tests cover:
 * - Price and rental sensitivity scoring
 * - Elasticity coefficient analysis
 * - Correlation with macro levels
 * - Recession vulnerability
 * - Growth capture potential
 * - Scenario impact analysis
 */

import { macroMicroSensitivity } from '../src/E38-macro-micro-sensitivity';

describe('E38: Macro-to-Micro Sensitivity Engine', () => {

  describe('Toronto Sensitivity Analysis', () => {

    it('should show Scarborough as most macro-sensitive Toronto neighborhood', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceSensitivityScore).toBe(82);
      expect(result.correlation.beta).toBeGreaterThan(1.3);
      expect(result.recessionVulnerability).toBe(78);
    });

    it('should show North York as least sensitive Toronto neighborhood', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'toronto-north-york-on',
        neighborhoodName: 'North York',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceSensitivityScore).toBe(58);
      expect(result.correlation.beta).toBeLessThan(1.0);
      expect(result.recessionVulnerability).toBeLessThan(60);
    });

    it('should show higher elasticity in sensitive neighborhoods', () => {
      const sensitive = macroMicroSensitivity({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      const stable = macroMicroSensitivity({
        neighborhoodId: 'toronto-north-york-on',
        neighborhoodName: 'North York',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(sensitive.priceElasticity.priceToGDP).toBeGreaterThan(stable.priceElasticity.priceToGDP);
    });
  });

  describe('Vancouver Sensitivity Analysis', () => {

    it('should show East Vancouver as most sensitive', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'vancouver-east-bc',
        neighborhoodName: 'East Vancouver',
        cityId: 'vancouver-bc',
        regionId: 'west-coast-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceSensitivityScore).toBe(80);
      expect(result.recessionVulnerability).toBe(74);
    });

    it('should show North Shore as least sensitive', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'vancouver-north-shore-bc',
        neighborhoodName: 'North Shore',
        cityId: 'vancouver-bc',
        regionId: 'west-coast-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceSensitivityScore).toBe(55);
      expect(result.portfolioDiversificationBenefit).toBeGreaterThan(50);
    });
  });

  describe('Elasticity Coefficients', () => {

    it('should show consistent elasticity patterns across neighborhoods', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      // Interest rate elasticity should be negative
      expect(result.priceElasticity.priceToInterestRate).toBeLessThan(0);

      // GDP elasticity should be positive
      expect(result.priceElasticity.priceToGDP).toBeGreaterThan(0);

      // Unemployment elasticity should be negative
      expect(result.priceElasticity.priceToUnemployment).toBeLessThan(0);
    });
  });

  describe('Correlation with Macro Levels', () => {

    it('should show downtown cores more correlated with city-level factors', () => {
      const downtown = macroMicroSensitivity({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      const suburban = macroMicroSensitivity({
        neighborhoodId: 'toronto-north-york-on',
        neighborhoodName: 'North York',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(downtown.correlation.correlationWithCity).toBeGreaterThan(suburban.correlation.correlationWithCity);
    });
  });

  describe('Recession Vulnerability', () => {

    it('should show tech-heavy markets with higher recession vulnerability', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        regionId: 'us-west',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.recessionVulnerability).toBeGreaterThan(80);
      expect(result.marketConcentration.jobConcentration).toBeGreaterThan(70);
    });
  });

  describe('Scenario Analysis', () => {

    it('should show negative impacts in recession scenarios', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        regionId: 'us-south',
        asOfDate: new Date('2026-08-04'),
      });

      const recessionScenario = result.scenarios.find(s => s.name.includes('Recession'));
      expect(recessionScenario).toBeDefined();
      expect(recessionScenario?.priceImpact12m).toBeLessThan(0);
      expect(recessionScenario?.rentalImpact12m).toBeLessThan(0);
    });

    it('should show recovery timeline in scenario results', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        regionId: 'us-west',
        asOfDate: new Date('2026-08-04'),
      });

      const recessionScenario = result.scenarios.find(s => s.name.includes('Recession'));
      expect(recessionScenario?.recoveryMonths).toBeGreaterThan(30);
    });
  });

  describe('Growth Capture', () => {

    it('should show high-beta neighborhoods capturing more upside', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        regionId: 'us-south',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.growthCapture).toBeGreaterThan(85);
      expect(result.correlation.beta).toBeGreaterThan(1.4);
    });
  });

  describe('Market Concentration', () => {

    it('should show higher concentration in single-industry markets', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        regionId: 'us-west',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.marketConcentration.jobConcentration).toBeGreaterThan(70);
      expect(result.marketConcentration.industryDiversification).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {

    it('should throw error for unknown neighborhood', () => {
      expect(() =>
        macroMicroSensitivity({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          regionId: 'atlantis-region',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No macro-to-micro sensitivity data available/);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should have all required output fields', () => {
      const result = macroMicroSensitivity({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('priceSensitivityScore');
      expect(result).toHaveProperty('priceElasticity');
      expect(result).toHaveProperty('correlation');
      expect(result).toHaveProperty('recessionVulnerability');
      expect(result).toHaveProperty('growthCapture');
      expect(result).toHaveProperty('scenarios');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
      expect(result.scenarios.length).toBeGreaterThan(0);
    });
  });
});
