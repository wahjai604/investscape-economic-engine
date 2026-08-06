/**
 * E43 Test Suite: Portfolio Geographic Diversification Engine
 *
 * Like E42, this engine computes scores directly from formulas, so every
 * expected value below was independently hand-derived by walking the same
 * threshold tables the engine implements. Several of the spec's own worked
 * examples don't reconcile with each other (e.g. its "Test 2" and "Test 3"
 * expected ranges assume different numbers than their own fixtures produce),
 * so this suite asserts what the faithfully-implemented formulas actually
 * compute rather than the spec's rough illustrative guesses.
 *
 * Two structural notes about the implementation (see source comments):
 * - Factor 2 (City Spread) omits a max(0, ...) floor present in the spec's
 *   pseudocode, since applying it literally would zero out every
 *   concentration penalty — contradicting the spec's own "-5" worked example.
 * - Factor 2 evaluates city variety *within each region independently*, so a
 *   portfolio with many regions but only one property per region will always
 *   score poorly on this factor, even though the portfolio has many distinct
 *   cities overall. This is a faithful reading of the spec ("for each
 *   region... weighted average of all region scores"), not a bug.
 */

import {
  portfolioGeographicDiversification,
  Property,
  PortfolioDiversificationInput,
} from '../src/E43-portfolio-geographic-diversification';

function makeProperty(overrides: Partial<Property> & { propertyId: string }): Property {
  return {
    address: '123 Main St',
    regionId: 'west_canada',
    cityId: 'vancouver',
    neighborhoodId: 'west_side',
    propertyType: 'residential',
    purchasePrice: 500000,
    currentMarketValue: 500000,
    annualGrossIncome: 30000,
    mortgageBalance: 0,
    equityValue: 500000,
    currency: 'CAD',
    country: 'CA',
    ...overrides,
  };
}

const BASE_INPUT: Pick<PortfolioDiversificationInput, 'portfolioBaseCurrency' | 'fxRate'> = {
  portfolioBaseCurrency: 'CAD',
  fxRate: 1.25,
};

describe('E43: Portfolio Geographic Diversification Engine', () => {

  describe('Edge case: empty portfolio', () => {

    it('should return a neutral score and prompt to add properties', () => {
      const result = portfolioGeographicDiversification({ properties: [], ...BASE_INPUT });

      expect(result.diversificationScore).toBe(50);
      expect(result.grade).toBe('C');
      expect(result.recommendation).toBe('Add properties to portfolio');
      expect(result.propertyCount).toBe(0);
      expect(result.totalPortfolioValue).toBe(0);
    });
  });

  describe('Edge case: single property (no diversification possible)', () => {

    it('should score 15 / grade F regardless of the underlying factor math', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({
            propertyId: 'prop-1',
            currentMarketValue: 950000,
            annualGrossIncome: 54000,
            mortgageBalance: 600000,
            equityValue: 350000,
          }),
        ],
        ...BASE_INPUT,
      });

      expect(result.diversificationScore).toBe(15);
      expect(result.grade).toBe('F');
      expect(result.recommendation).toBe('Severe Concentration Risk');
      expect(result.riskLevel).toBe('high');
    });

    it('should flag single-property, region, and city overexposure at 100%', () => {
      const result = portfolioGeographicDiversification({
        properties: [makeProperty({ propertyId: 'prop-1' })],
        ...BASE_INPUT,
      });

      expect(result.concentrationRisks.singlePropertyOverexposed).toBe(true);
      expect(result.concentrationRisks.largestPropertyPercent).toBe(100);
      expect(result.concentrationRisks.regionOverexposed).toBe(true);
      expect(result.concentrationRisks.cityOverexposed).toBe(true);
      expect(result.concentrationRisks.incomeConcentration).toBe(true);
      // Single-currency portfolios have no cross-border exposure to unbalance.
      expect(result.concentrationRisks.crossBorderUnbalanced).toBe(false);
    });
  });

  describe('Two properties, same region and city', () => {

    it('should compute a severely concentrated score', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'prop-1', currentMarketValue: 900000, annualGrossIncome: 54000 }),
          makeProperty({ propertyId: 'prop-2', currentMarketValue: 600000, annualGrossIncome: 36000 }),
        ],
        ...BASE_INPUT,
      });

      expect(result.diversificationScore).toBe(17);
      expect(result.grade).toBe('F');
      expect(result.riskLevel).toBe('high');
      expect(result.concentrationRisks.regionOverexposed).toBe(true);
      expect(result.concentrationRisks.cityOverexposed).toBe(true);
      expect(result.concentrationRisks.incomeConcentration).toBe(true);
    });
  });

  describe('Three regions, one property each', () => {

    it('should be dragged down by weak per-region city spread despite regional balance', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'prop-1', regionId: 'west_canada', cityId: 'vancouver', currentMarketValue: 500000, annualGrossIncome: 30000, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'prop-2', regionId: 'central_canada', cityId: 'toronto', currentMarketValue: 500000, annualGrossIncome: 30000, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'prop-3', regionId: 'us_southwest', cityId: 'phoenix', currentMarketValue: 500000, annualGrossIncome: 30000, currency: 'USD', country: 'US' }),
        ],
        ...BASE_INPUT,
      });

      expect(result.diversificationScore).toBe(45);
      expect(result.grade).toBe('D');
      expect(result.factors.regionalSpread.score).toBeCloseTo(69.85, 1);
      expect(result.factors.citySpread.score).toBeCloseTo(1, 1);
      expect(result.concentrationRisks.regionOverexposed).toBe(false);
      expect(result.concentrationRisks.incomeConcentration).toBe(true);
    });
  });

  describe('Well-diversified portfolio (3 regions x 3 cities each)', () => {

    it('should score in the "Moderately Diversified" B range with no risk flags', () => {
      const properties: Property[] = [];
      const regions = ['region-a', 'region-b', 'region-c'];
      const cities = ['city-1', 'city-2', 'city-3'];
      let id = 0;
      for (const region of regions) {
        for (const city of cities) {
          id += 1;
          properties.push(
            makeProperty({
              propertyId: `prop-${id}`,
              regionId: region,
              cityId: `${region}-${city}`,
              currentMarketValue: 100000,
              annualGrossIncome: 10000,
            })
          );
        }
      }

      const result = portfolioGeographicDiversification({ properties, ...BASE_INPUT });

      expect(result.diversificationScore).toBe(75);
      expect(result.grade).toBe('B');
      expect(result.recommendation).toBe('Moderately Diversified');
      expect(result.riskLevel).toBe('low');
      expect(result.factors.citySpread.score).toBeCloseTo(89.92, 1);

      const flags = result.concentrationRisks;
      expect(
        [
          flags.singlePropertyOverexposed,
          flags.regionOverexposed,
          flags.cityOverexposed,
          flags.crossBorderUnbalanced,
          flags.incomeConcentration,
        ].filter(Boolean)
      ).toHaveLength(0);
    });
  });

  describe('Factor: Property Type Distribution', () => {

    it('should score 95 for a well-balanced 60/30/10 residential/commercial/development mix', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', propertyType: 'residential', currentMarketValue: 600000 }),
          makeProperty({ propertyId: 'p2', propertyType: 'commercial', currentMarketValue: 300000 }),
          makeProperty({ propertyId: 'p3', propertyType: 'development', currentMarketValue: 100000, annualGrossIncome: null }),
        ],
        ...BASE_INPUT,
      });

      expect(result.factors.propertyTypeDistribution.score).toBe(95);
      expect(result.propertyTypeBreakdown.residential).toEqual({ count: 1, value: 600000, percent: 60 });
      expect(result.propertyTypeBreakdown.commercial).toEqual({ count: 1, value: 300000, percent: 30 });
      expect(result.propertyTypeBreakdown.development).toEqual({ count: 1, value: 100000, percent: 10 });
    });
  });

  describe('Factor: Asset Value Balance', () => {

    it('should score 38 for a 500k/400k/300k split (spec-consistent worked example)', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 500000 }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 400000 }),
          makeProperty({ propertyId: 'p3', currentMarketValue: 300000 }),
        ],
        ...BASE_INPUT,
      });

      expect(result.factors.assetValueBalance.score).toBe(38);
    });

    it('should give a 0 Gini coefficient for perfectly equal property values', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 500000 }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 500000 }),
        ],
        ...BASE_INPUT,
      });

      // largest = 50% -> base 30; gini = 0 (< 0.3) -> +8
      expect(result.factors.assetValueBalance.score).toBe(38);
    });
  });

  describe('Factor: Income Source Diversity', () => {

    it('should score 55 for a 60k/40k/20k income split (spec-consistent worked example)', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', annualGrossIncome: 60000 }),
          makeProperty({ propertyId: 'p2', annualGrossIncome: 40000 }),
          makeProperty({ propertyId: 'p3', annualGrossIncome: 20000 }),
        ],
        ...BASE_INPUT,
      });

      expect(result.factors.incomeSourceDiversity.score).toBe(55);
      expect(result.concentrationRisks.largestIncomeSourcePercent).toBe(50);
      expect(result.concentrationRisks.incomeConcentration).toBe(true);
    });

    it('should stack the null-income penalty and low-producing-fraction penalty', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', annualGrossIncome: 10000 }),
          makeProperty({ propertyId: 'p2', annualGrossIncome: 10000 }),
          makeProperty({ propertyId: 'p3', annualGrossIncome: null }),
          makeProperty({ propertyId: 'p4', annualGrossIncome: null }),
        ],
        ...BASE_INPUT,
      });

      // largest = 10000/20000 = 50% -> base 45; has null income -> -10;
      // 2/4 = 50% producing -> +5. Total = 40.
      expect(result.factors.incomeSourceDiversity.score).toBe(40);
    });
  });

  describe('Factor: Cross-Border Risk Balance', () => {

    it('should score 90 for a well-balanced 60% CAD / 40% USD split', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 600000, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 320000, currency: 'USD', country: 'US' }),
        ],
        ...BASE_INPUT,
      });

      expect(result.concentrationRisks.cadPercent).toBe(60);
      expect(result.concentrationRisks.usdPercent).toBe(40);
      expect(result.factors.crossBorderRiskBalance.score).toBe(90);
      expect(result.concentrationRisks.crossBorderUnbalanced).toBe(false);
    });

    it('should score 65 for a USD-only (domestic US) portfolio', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', currency: 'USD', country: 'US' }),
          makeProperty({ propertyId: 'p2', currency: 'USD', country: 'US' }),
        ],
        ...BASE_INPUT,
      });

      expect(result.factors.crossBorderRiskBalance.score).toBe(65);
    });

    it('should score 70 for a CAD-only (domestic Canadian) portfolio', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'p2', currency: 'CAD', country: 'CA' }),
        ],
        ...BASE_INPUT,
      });

      expect(result.factors.crossBorderRiskBalance.score).toBe(70);
    });
  });

  describe('Currency conversion', () => {

    it('should convert USD property values into the CAD base currency using fxRate', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 500000, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 400000, currency: 'USD', country: 'US' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
      });

      // 500,000 CAD + (400,000 USD * 1.25) = 1,000,000 CAD
      expect(result.totalPortfolioValue).toBe(1000000);
    });

    it('should fall back to the default 1.25 fxRate when an invalid rate is provided', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 500000, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 400000, currency: 'USD', country: 'US' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxRate: 0,
      });

      expect(result.totalPortfolioValue).toBe(1000000);
    });
  });

  describe('Geographic exposure arrays', () => {

    it('should sort regional and city exposure by value descending', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', regionId: 'region-a', cityId: 'city-a', currentMarketValue: 100000 }),
          makeProperty({ propertyId: 'p2', regionId: 'region-b', cityId: 'city-b', currentMarketValue: 300000 }),
          makeProperty({ propertyId: 'p3', regionId: 'region-c', cityId: 'city-c', currentMarketValue: 200000 }),
        ],
        ...BASE_INPUT,
      });

      expect(result.regionalExposure.map((r) => r.regionId)).toEqual(['region-b', 'region-c', 'region-a']);
      expect(result.cityExposure.map((c) => c.cityId)).toEqual(['city-b', 'city-c', 'city-a']);
    });
  });

  describe('Concentration risk flags in a multi-property portfolio', () => {

    it('should flag single-property, region, and city overexposure when one property dominates', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1', regionId: 'region-a', cityId: 'city-x', currentMarketValue: 700000 }),
          makeProperty({ propertyId: 'p2', regionId: 'region-a', cityId: 'city-y', currentMarketValue: 100000 }),
          makeProperty({ propertyId: 'p3', regionId: 'region-b', cityId: 'city-z', currentMarketValue: 200000 }),
        ],
        ...BASE_INPUT,
      });

      expect(result.concentrationRisks.singlePropertyOverexposed).toBe(true);
      expect(result.concentrationRisks.largestPropertyPercent).toBe(70);
      expect(result.concentrationRisks.regionOverexposed).toBe(true);
      expect(result.concentrationRisks.largestRegionPercent).toBe(80);
      expect(result.concentrationRisks.cityOverexposed).toBe(true);
      expect(result.concentrationRisks.largestCityPercent).toBe(70);
    });
  });

  describe('Robustness: large portfolio', () => {

    it('should handle a 20-property portfolio without error and keep weights summing to 100', () => {
      const properties: Property[] = Array.from({ length: 20 }, (_, i) =>
        makeProperty({
          propertyId: `prop-${i}`,
          regionId: `region-${i % 5}`,
          cityId: `city-${i % 8}`,
          currentMarketValue: 100000 + i * 1000,
          propertyType: i % 3 === 0 ? 'commercial' : i % 3 === 1 ? 'development' : 'residential',
        })
      );

      const result = portfolioGeographicDiversification({ properties, ...BASE_INPUT });

      expect(result.propertyCount).toBe(20);
      expect(result.diversificationScore).toBeGreaterThanOrEqual(1);
      expect(result.diversificationScore).toBeLessThanOrEqual(100);
      const totalWeight = Object.values(result.factors).reduce((sum, f) => sum + f.weight, 0);
      expect(totalWeight).toBe(100);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should report the disclaimer on every response', () => {
      const result = portfolioGeographicDiversification({
        properties: [makeProperty({ propertyId: 'p1' })],
        ...BASE_INPUT,
      });
      expect(result.disclaimer).toContain('informational analysis only');
    });

    it('should have all required output fields', () => {
      const result = portfolioGeographicDiversification({
        properties: [
          makeProperty({ propertyId: 'p1' }),
          makeProperty({ propertyId: 'p2', regionId: 'central_canada', cityId: 'toronto' }),
        ],
        ...BASE_INPUT,
      });

      expect(result).toHaveProperty('diversificationScore');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('regionalExposure');
      expect(result).toHaveProperty('cityExposure');
      expect(result).toHaveProperty('propertyTypeBreakdown');
      expect(result).toHaveProperty('concentrationRisks');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('disclaimer');
      expect(Object.keys(result.factors)).toHaveLength(6);
    });
  });
});
