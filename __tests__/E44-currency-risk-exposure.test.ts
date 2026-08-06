/**
 * E44 Test Suite: Currency Risk Exposure Engine
 *
 * Like E42/E43, this engine computes scores directly from formulas. Every
 * expected value below was verified against the real implementation (not
 * just hand math) because several of the spec's own worked examples contain
 * arithmetic errors, and one factor's threshold divisor is only resolvable
 * by picking whichever of two contradictory worked examples is internally
 * consistent (see source comments in E44-currency-risk-exposure.ts). The
 * spec's illustrative "expected" ranges for its own Test 1/2/6 fixtures
 * don't match what its own formulas compute from those exact fixtures
 * (e.g. Test 1 "all CAD" guesses grade F, but a single-currency CAD
 * portfolio has zero income mismatch, zero FX volatility exposure, and no
 * USD to hedge — only the concentration factor should read as risky, and
 * the faithfully-computed composite reflects that: grade C, not F).
 *
 * Also note: despite the field name, `currencyRiskScore` follows the same
 * "higher = lower risk" polarity as E42/E43 and the grade table itself
 * (score >= 80 -> grade A -> "Low Risk"). One inline spec comment claims
 * the opposite, but it contradicts every worked example and the grade
 * table, so it's treated as a documentation error.
 */

import { currencyRiskExposure, CurrencyProperty } from '../src/E44-currency-risk-exposure';

function makeProperty(overrides: Partial<CurrencyProperty> & { propertyId: string }): CurrencyProperty {
  return {
    currentMarketValue: 500000,
    annualGrossIncome: 30000,
    mortgageBalance: 0,
    currency: 'CAD',
    country: 'CA',
    ...overrides,
  };
}

const BASE_CAD = { baseRate: 1.25, rateChange: 0, volatility: 5 };

describe('E44: Currency Risk Exposure Engine', () => {

  describe('All-CAD portfolio (no currency risk to hedge or diversify against)', () => {

    it('should score moderately, not critically, since only concentration is penalized', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 1000000, annualGrossIncome: 60000 }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 800000, annualGrossIncome: 48000 }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [],
      });

      expect(result.currencyRiskScore).toBe(63);
      expect(result.grade).toBe('C');
      expect(result.factors.exposureConcentration.score).toBe(1);
      expect(result.riskFlags.heavilySkewd).toBe(true);
      expect(result.riskFlags.skewPercent).toBe(100);
      expect(result.riskFlags.dominantCurrency).toBe('CAD');
    });
  });

  describe('Roughly balanced CAD/USD portfolio (44/56 after FX conversion)', () => {

    it('should score well on concentration/income but reflect unhedged USD exposure', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 900000, annualGrossIncome: 54000, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 900000, annualGrossIncome: 54000, currency: 'USD', country: 'US' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [],
      });

      expect(result.currencyRiskScore).toBe(79);
      expect(result.grade).toBe('B');
      expect(result.factors.exposureConcentration.score).toBe(100);
      expect(result.factors.incomeExposure.score).toBe(100);
      expect(result.factors.hedgingCoverage.score).toBe(30);
      expect(result.riskFlags.largeUnhedgedExposure).toBe(true);
    });
  });

  describe('USD-skewed portfolio (~73/27), no income data', () => {

    it('should flag heavy skew and large unhedged exposure', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 1300000, annualGrossIncome: null, currency: 'USD', country: 'US' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 600000, annualGrossIncome: null, currency: 'CAD', country: 'CA' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [],
      });

      expect(result.currencyRiskScore).toBe(60);
      expect(result.grade).toBe('C');
      expect(result.factors.exposureConcentration.score).toBe(70);
      expect(result.factors.incomeExposure.score).toBe(50); // no income -> neutral
      expect(result.riskFlags.heavilySkewd).toBe(true);
      expect(result.riskFlags.dominantCurrency).toBe('USD');
      expect(result.riskFlags.largeUnhedgedExposure).toBe(true);
    });
  });

  describe('Same USD-skewed portfolio, hedged at 75% coverage', () => {

    it('should raise the hedging factor and clear the large-unhedged-exposure flag', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 1300000, annualGrossIncome: null, currency: 'USD', country: 'US' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 600000, annualGrossIncome: null, currency: 'CAD', country: 'CA' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [
          { hedgeId: 'h1', hedgeType: 'forward', coveredAmount: 975000, effectiveRate: 1.27, expiryYears: 2, costPercent: 0.8 },
        ],
      });

      expect(result.currencyRiskScore).toBe(74);
      expect(result.grade).toBe('B');
      expect(result.factors.hedgingCoverage.score).toBe(100);
      expect(result.totalHedgedAmount).toBe(975000);
      expect(result.hedgingEffectiveness).toBe(75);
      expect(result.riskFlags.largeUnhedgedExposure).toBe(false);
      expect(result.riskFlags.unhedgedExposurePercent).toBe(18);

      const hedge = result.hedges[0];
      expect(hedge.protectedValue).toBe(1238250);
      expect(hedge.costAnnual).toBe(7800);
      expect(hedge.breakEvenRate).toBeCloseTo(1.25984, 4);
      expect(hedge.recommendation).toBe('Maintain current');
    });
  });

  describe('Income mismatch: USD asset with no income, CAD asset carrying all income', () => {

    it('should score income exposure poorly and flag the mismatch', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 1000000, annualGrossIncome: 0, currency: 'USD', country: 'US' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 500000, annualGrossIncome: 50000, currency: 'CAD', country: 'CA' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [],
      });

      expect(result.factors.incomeExposure.score).toBe(13);
      expect(result.riskFlags.incomeExposureMismatch).toBe(true);
      expect(result.riskFlags.incomeInDominant).toBe(0);
    });
  });

  describe('High FX volatility (12%)', () => {

    it('should penalize the volatility factor and flag high volatility', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 900000, annualGrossIncome: null, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 900000, annualGrossIncome: null, currency: 'USD', country: 'US' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: { baseRate: 1.25, rateChange: 0, volatility: 12 },
        hedges: [],
      });

      expect(result.factors.volatilityImpact.score).toBe(37);
      expect(result.riskFlags.highVolatility).toBe(true);
      expect(result.riskFlags.volatilityPercent).toBe(12);
    });
  });

  describe('Expiring hedge (6 months to expiry)', () => {

    it('should recommend renewal and flag the expiring hedge', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 1300000, annualGrossIncome: null, currency: 'USD', country: 'US' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 600000, annualGrossIncome: null, currency: 'CAD', country: 'CA' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [
          { hedgeId: 'h1', hedgeType: 'forward', coveredAmount: 650000, effectiveRate: 1.27, expiryYears: 0.5, costPercent: 1.2 },
        ],
      });

      expect(result.hedges[0].recommendation).toBe('Renew expiring hedges');
      expect(result.riskFlags.hedgesExpiring).toBe(true);
      expect(result.riskFlags.hedgesExpiringCount).toBe(1);
    });
  });

  describe('Factor: Exposure Concentration boundary (85% CAD / 15% USD)', () => {

    it('should apply the 50-70% skew penalty tier, not the >70% tier, at exactly 70% skew', () => {
      // Solve for exact 85/15 split in CAD-equivalent terms at fxRate 1.25
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 2833333.33, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 400000, currency: 'USD', country: 'US' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [],
      });

      expect(result.factors.exposureConcentration.score).toBe(40);
      expect(result.riskFlags.skewPercent).toBe(85);
      expect(result.riskFlags.dominantCurrency).toBe('CAD');
    });
  });

  describe('Factor: Hedging quality adjustments stack per-hedge', () => {

    it('should offset a cheap long-dated hedge bonus against an expensive short-dated penalty', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 500000, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 1000000, currency: 'USD', country: 'US' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [
          { hedgeId: 'h1', hedgeType: 'forward', coveredAmount: 400000, effectiveRate: 1.25, expiryYears: 3, costPercent: 0.5 },
          { hedgeId: 'h2', hedgeType: 'option', coveredAmount: 200000, effectiveRate: 1.25, expiryYears: 1.5, costPercent: 2.5 },
        ],
      });

      // 60% coverage -> base 80; +5 (cheap, long-dated) - 5 (cost >= 2%) = net 0 adjustment
      expect(result.factors.hedgingCoverage.score).toBe(80);
      expect(result.totalHedgedAmount).toBe(600000);
    });
  });

  describe('Edge case: empty portfolio', () => {

    it('should return a neutral score without crashing', () => {
      const result = currencyRiskExposure({
        properties: [],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [],
      });

      expect(result.currencyRiskScore).toBe(50);
      expect(result.grade).toBe('C');
      expect(result.totalPortfolioValue).toBe(0);
      expect(result.exposures).toEqual([]);
      expect(result.hedges).toEqual([]);
    });
  });

  describe('Validation & defaults', () => {

    it('should fall back to the default 1.25 fxRate when baseRate is invalid', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 500000, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 400000, currency: 'USD', country: 'US' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: { baseRate: 0, rateChange: 0, volatility: null },
        hedges: [],
      });

      // 400,000 USD * default 1.25 = 500,000 CAD -> exactly 50/50
      expect(result.riskFlags.skewPercent).toBe(50);
      expect(result.riskFlags.volatilityPercent).toBe(5); // null volatility default
    });

    it('should clamp volatility above 30% down to 30%', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 500000, currency: 'CAD', country: 'CA' }),
          makeProperty({ propertyId: 'p2', currentMarketValue: 400000, currency: 'USD', country: 'US' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: { baseRate: 1.25, rateChange: 0, volatility: 50 },
        hedges: [],
      });

      expect(result.riskFlags.volatilityPercent).toBe(30);
    });

    it('should not throw for a USD base-currency portfolio', () => {
      expect(() =>
        currencyRiskExposure({
          properties: [
            makeProperty({ propertyId: 'p1', currentMarketValue: 500000, currency: 'USD', country: 'US' }),
          ],
          portfolioBaseCurrency: 'USD',
          fxScenarios: BASE_CAD,
          hedges: [],
        })
      ).not.toThrow();
    });
  });

  describe('Sensitivity analysis', () => {

    it('should include a base case plus 4 stress scenarios, with USD appreciation increasing value for a USD-heavy portfolio', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currentMarketValue: 900000, currency: 'USD', country: 'US' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [],
      });

      expect(result.sensitivityAnalysis).toHaveLength(5);
      const plus5 = result.sensitivityAnalysis.find((s) => s.scenario === 'USD +5%');
      const minus5 = result.sensitivityAnalysis.find((s) => s.scenario === 'USD -5%');
      expect(plus5?.portfolioValueChange).toBeGreaterThan(0);
      expect(minus5?.portfolioValueChange).toBeLessThan(0);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should report the disclaimer on every response', () => {
      const result = currencyRiskExposure({
        properties: [makeProperty({ propertyId: 'p1' })],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [],
      });
      expect(result.disclaimer).toContain('informational analysis only');
    });

    it('should have all required output fields with weights summing to 100', () => {
      const result = currencyRiskExposure({
        properties: [
          makeProperty({ propertyId: 'p1', currency: 'CAD' }),
          makeProperty({ propertyId: 'p2', currency: 'USD' }),
        ],
        portfolioBaseCurrency: 'CAD',
        fxScenarios: BASE_CAD,
        hedges: [],
      });

      expect(result).toHaveProperty('currencyRiskScore');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('exposures');
      expect(result).toHaveProperty('sensitivityAnalysis');
      expect(result).toHaveProperty('riskFlags');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('disclaimer');

      const totalWeight = Object.values(result.factors).reduce((sum, f) => sum + f.weight, 0);
      expect(totalWeight).toBe(100);
    });
  });
});
