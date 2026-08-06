/**
 * E39 Test Suite: Mortgage Rate Forecast Engine
 *
 * Tests cover:
 * - Rate forecast accuracy and confidence
 * - Affordability impact modeling
 * - Scenario analysis (cuts, hikes, neutral)
 * - Cross-neighborhood rate sensitivity
 * - Payment shock and renewal risk
 */

import { mortgageRateForecast } from '../src/E39-mortgage-rate-forecast';

describe('E39: Mortgage Rate Forecast Engine', () => {

  describe('Toronto Rate Forecasts', () => {

    it('should show rate decline expected in Toronto', () => {
      const result = mortgageRateForecast({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.currentRate5yr).toBe(4.89);
      expect(result.forecast12m.forecastedRate).toBeLessThan(result.currentRate5yr);
      expect(result.ratesDirection).toBe('Falling');
    });

    it('should show higher affordability impact in outer neighborhoods', () => {
      const yorkville = mortgageRateForecast({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      const scarborough = mortgageRateForecast({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(scarborough.currentAffordability.buyersAffected).toBeGreaterThan(yorkville.currentAffordability.buyersAffected);
    });
  });

  describe('Vancouver Rate Forecasts', () => {

    it('should show Vancouver rate environment similar to Toronto', () => {
      const vancouver = mortgageRateForecast({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        regionId: 'west-coast-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(vancouver.rateEnvironment).toBe('Elevated');
      expect(vancouver.ratesDirection).toBe('Falling');
    });
  });

  describe('Montreal Rate Forecasts', () => {

    it('should show best affordability in Montreal', () => {
      const result = mortgageRateForecast({
        neighborhoodId: 'montreal-west-island-qc',
        neighborhoodName: 'West Island',
        cityId: 'montreal-qc',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.currentAffordability.medianPriceAffordable).toBeGreaterThan(300000);
      expect(result.currentAffordability.buyersAffected).toBeLessThan(35);
    });
  });

  describe('US Rate Forecasts', () => {

    it('should show higher rates in US markets', () => {
      const result = mortgageRateForecast({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        regionId: 'us-south',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.currentRate5yr).toBeGreaterThan(5.0);
      expect(result.rateEnvironment).toBe('High');
    });

    it('should show worst affordability in US coastal markets', () => {
      const result = mortgageRateForecast({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        regionId: 'us-west',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.currentAffordability.buyersAffected).toBeGreaterThan(60);
      expect(result.interestExpenseRatio).toBeGreaterThan(45);
    });
  });

  describe('Affordability Impact', () => {

    it('should show rate cuts improve affordability', () => {
      const result = mortgageRateForecast({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      const cutScenario = result.scenarios.find(s => s.name.includes('Cut'));
      expect(cutScenario?.affordabilityImpact).toBeGreaterThan(0);
    });

    it('should show rate hikes reduce affordability', () => {
      const result = mortgageRateForecast({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      const hikeScenario = result.scenarios.find(s => s.name.includes('Hike'));
      expect(hikeScenario?.affordabilityImpact).toBeLessThan(0);
    });
  });

  describe('Rate Sensitivity', () => {

    it('should show price elasticity to rates is negative', () => {
      const result = mortgageRateForecast({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.housePriceElasticityToRates).toBeLessThan(0);
      expect(result.absorptionElasticityToRates).toBeLessThan(0);
    });
  });

  describe('Payment Shock Risk', () => {

    it('should show higher payment shock in expensive US markets', () => {
      const result = mortgageRateForecast({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        regionId: 'us-west',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.paymentShockRisk).toBeGreaterThan(60);
    });
  });

  describe('Error Handling', () => {

    it('should throw error for unknown neighborhood', () => {
      expect(() =>
        mortgageRateForecast({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          regionId: 'atlantis-region',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No mortgage rate forecast data available/);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should have all required output fields', () => {
      const result = mortgageRateForecast({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        regionId: 'central-canada',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('currentRate5yr');
      expect(result).toHaveProperty('forecast3m');
      expect(result).toHaveProperty('forecast6m');
      expect(result).toHaveProperty('forecast12m');
      expect(result).toHaveProperty('currentAffordability');
      expect(result).toHaveProperty('scenarios');
      expect(result).toHaveProperty('housePriceElasticityToRates');
      expect(result).toHaveProperty('interestExpenseRatio');
      expect(result.scenarios.length).toBe(3);
    });
  });
});
