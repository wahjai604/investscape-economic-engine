/**
 * InvestScape™ Test Suite
 * © 2026 Lighthouse Research Ltd. All rights reserved.
 *
 * Test methodology and validation data are proprietary.
 * See LICENSE for usage restrictions.
 */

/**
 * E45 Test Suite: Scenario Batch Processor Engine (Capstone)
 *
 * IMPORTANT CONTEXT: the spec for this engine assumes a pre-existing "E1-E28"
 * financial calc package (`@investscape/calc-engine`) that is declared in
 * package.json but does not exist anywhere — not in node_modules, not on the
 * npm registry, and not implemented in this repo. Per explicit direction,
 * this engine implements its own minimal-but-correct financial math instead
 * (mortgage amortization for both Canadian semi-annual and US monthly
 * compounding, NOI/cash flow, exit proceeds, and IRR via bisection).
 *
 * Because real financial math produces real numbers, every expected value
 * below was computed by running the actual implementation (not the spec's
 * illustrative guesses, which assume very different — and unverified —
 * cash flow outcomes than what these exact input fixtures produce). For
 * example, the spec's own Test 1 fixture (a $500k property renting for
 * $2,500/month, a rent-to-price ratio well below the common "1% rule")
 * guesses a positive $6-8k year-1 cash flow; the real numbers, run through
 * a real 25-year amortization at 4.5%, produce a negative year-1 cash flow
 * of about -$10,867 — the debt service on a $400k loan simply exceeds the
 * property's NOI at that rent level. Directionally, every scenario below
 * (rate up/down, appreciation up/down, vacancy stress, combined recession)
 * moves portfolio IRR the way it should; the absolute magnitudes are what
 * the real formulas produce for these specific inputs.
 */

import { scenarioBatchProcessor, PropertyWithInputs, MarketScenario } from '../src/E45-scenario-batch-processor';

function baseProperty(overrides: Partial<PropertyWithInputs> & { propertyId: string }): PropertyWithInputs {
  return {
    purchasePrice: 500000,
    downPaymentPercent: 20,
    interestRate: 4.5,
    amortizationYears: 25,
    holdingPeriodYears: 5,
    monthlyRentalIncome: 2500,
    annualPropertyTaxes: 5000,
    monthlyUtilities: 100,
    monthlyMaintenance: 200,
    monthlyPropertyManagement: 250,
    monthlyInsurance: 100,
    monthlyHOA: 0,
    vacancyRate: 5,
    sellingCost: 5,
    currency: 'CAD',
    country: 'CA',
    mortgageCompounding: 'semi-annual',
    regionId: 'west_canada',
    cityId: 'vancouver',
    neighborhoodId: 'west_side',
    E42_investmentScore: 86,
    ...overrides,
  };
}

const baseScenario: MarketScenario = {
  scenarioName: 'Base Case',
  scenarioId: 'base',
  variables: [],
  probability: null,
  description: null,
};

describe('E45: Scenario Batch Processor Engine', () => {

  describe('Base case: single property, single scenario', () => {

    it('should compute real amortization-based IRR and cash flow', () => {
      const result = scenarioBatchProcessor({
        properties: [baseProperty({ propertyId: 'prop-1' })],
        scenarios: [baseScenario],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      expect(result.scenarios).toHaveLength(1);
      const scenario = result.scenarios[0];
      expect(scenario.portfolioIRR).toBeCloseTo(4.8014, 2);
      expect(scenario.year1CashFlow).toBeCloseTo(-10866.7, 0);
      expect(scenario.largestPropertyPercent).toBe(100);
      // Single scenario -> best case and worst case are the same scenario.
      expect(result.bestCaseScenario.scenarioId).toBe('base');
      expect(result.worstCaseScenario.scenarioId).toBe('base');
    });

    it('should compute a sensible capitalization rate independent of financing', () => {
      const result = scenarioBatchProcessor({
        properties: [baseProperty({ propertyId: 'prop-1' })],
        scenarios: [baseScenario],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      // NOI = (30000 * 0.95) - (5000 + 7800) = 15,700; cap rate = 15700/500000
      expect(result.scenarios[0].properties[0].capRate).toBeCloseTo(3.14, 2);
    });
  });

  describe('Rate stress: base + rate +1% + rate -1%', () => {

    it('should rank scenarios by IRR with rate cuts best and hikes worst', () => {
      const rateUp: MarketScenario = {
        scenarioName: 'Rate +1%',
        scenarioId: 'rate_up_1',
        variables: [{ name: 'mortgageRateChange', value: 1.0, unit: 'percent' }],
        probability: null,
        description: null,
      };
      const rateDown: MarketScenario = {
        scenarioName: 'Rate -1%',
        scenarioId: 'rate_down_1',
        variables: [{ name: 'mortgageRateChange', value: -1.0, unit: 'percent' }],
        probability: null,
        description: null,
      };

      const result = scenarioBatchProcessor({
        properties: [baseProperty({ propertyId: 'prop-1' })],
        scenarios: [baseScenario, rateUp, rateDown],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      expect(result.scenarioRanking.map((r) => r.scenarioId)).toEqual(['rate_down_1', 'base', 'rate_up_1']);
      expect(result.scenarioRanking[0].rank).toBe(1);
      expect(result.scenarioRanking[2].rank).toBe(3);
      expect(result.bestCaseScenario.scenarioId).toBe('rate_down_1');
      expect(result.worstCaseScenario.scenarioId).toBe('rate_up_1');
      expect(result.irrRange.min).toBeCloseTo(1.9255, 2);
      expect(result.irrRange.max).toBeCloseTo(7.5954, 2);

      const rateSensitivity = result.sensitivityRanking.find((s) => s.variable === 'mortgageRateChange');
      expect(rateSensitivity?.rank).toBe(1);
      expect(rateSensitivity?.irrImpact).toBeGreaterThan(0);
    });
  });

  describe('Appreciation variance: base + appreciation +1% + -1%', () => {

    it('should rank higher appreciation above lower appreciation', () => {
      const apprHigh: MarketScenario = {
        scenarioName: 'Appreciation +1%',
        scenarioId: 'appr_high',
        variables: [{ name: 'appreciationDelta', value: 1.0, unit: 'percent' }],
        probability: null,
        description: null,
      };
      const apprLow: MarketScenario = {
        scenarioName: 'Appreciation -1%',
        scenarioId: 'appr_low',
        variables: [{ name: 'appreciationDelta', value: -1.0, unit: 'percent' }],
        probability: null,
        description: null,
      };

      const result = scenarioBatchProcessor({
        properties: [baseProperty({ propertyId: 'prop-1' })],
        scenarios: [baseScenario, apprHigh, apprLow],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      expect(result.scenarioRanking.map((r) => r.scenarioId)).toEqual(['appr_high', 'base', 'appr_low']);
      // Appreciation doesn't touch operating cash flow, only exit proceeds.
      expect(result.scenarios[0].year1CashFlow).toBeCloseTo(result.scenarios[1].year1CashFlow, 0);

      const apprSensitivity = result.sensitivityRanking.find((s) => s.variable === 'appreciationDelta');
      expect(apprSensitivity?.cashFlowImpact).toBe(0);
      expect(apprSensitivity?.irrImpact).toBeGreaterThan(0);
    });
  });

  describe('Multi-property portfolio (3 properties, different sizes)', () => {

    it('should pool cash flows and IRR across all properties', () => {
      const result = scenarioBatchProcessor({
        properties: [
          baseProperty({ propertyId: 'prop-1', purchasePrice: 500000 }),
          baseProperty({ propertyId: 'prop-2', purchasePrice: 800000 }),
          baseProperty({ propertyId: 'prop-3', purchasePrice: 300000 }),
        ],
        scenarios: [baseScenario],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      expect(result.portfolioCount).toBe(3);
      expect(result.scenarios[0].properties).toHaveLength(3);
      expect(result.scenarios[0].largestPropertyPercent).toBe(50); // 800k / 1.6M
      expect(result.avgPropertyValue).toBeCloseTo(533333.33, 0);
    });
  });

  describe('Mixed currency portfolio (CAD + USD), FX appreciation scenario', () => {

    it('should convert USD amounts into the CAD base currency and scale correctly under an FX scenario', () => {
      const result = scenarioBatchProcessor({
        properties: [
          baseProperty({ propertyId: 'prop-1', currency: 'CAD', country: 'CA' }),
          baseProperty({ propertyId: 'prop-2', currency: 'USD', country: 'US' }),
        ],
        scenarios: [
          baseScenario,
          {
            scenarioName: 'USD Appreciation +5%',
            scenarioId: 'usd_strong',
            variables: [{ name: 'fxRateChange', value: 5.0, unit: 'percent' }],
            probability: null,
            description: null,
          },
        ],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      const base = result.scenarios[0];
      const usdStrong = result.scenarios[1];

      expect(base.cadExposure).toBe(44);
      expect(base.usdExposure).toBe(56);
      // A stronger USD grows the CAD-equivalent value of the fixed USD
      // holding while the CAD leg is unchanged, so USD's share of the
      // portfolio increases slightly (and CAD's share falls correspondingly).
      expect(usdStrong.usdExposure).toBeGreaterThan(base.usdExposure);
      expect(usdStrong.cadExposure).toBeLessThan(base.cadExposure);

      // A stronger USD raises the CAD-equivalent value of the USD leg, so
      // portfolio-level CAD totals should increase versus the base case.
      expect(usdStrong.totalInitialInvestment).toBeGreaterThan(base.totalInitialInvestment);
      expect(usdStrong.totalEquityAtExit).toBeGreaterThan(base.totalEquityAtExit);
    });
  });

  describe('Vacancy stress: base + vacancy +3pp', () => {

    it('should reduce cash flow and IRR versus base', () => {
      const vacancyHigh: MarketScenario = {
        scenarioName: 'Vacancy +3%',
        scenarioId: 'vacancy_high',
        variables: [{ name: 'vacancyShift', value: 3.0, unit: 'percent_point' }],
        probability: null,
        description: null,
      };

      const result = scenarioBatchProcessor({
        properties: [baseProperty({ propertyId: 'prop-1' })],
        scenarios: [baseScenario, vacancyHigh],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      const [base, stressed] = result.scenarios;
      expect(stressed.year1CashFlow).toBeLessThan(base.year1CashFlow);
      expect(stressed.portfolioIRR).toBeLessThan(base.portfolioIRR);
      expect(result.worstCaseScenario.scenarioId).toBe('vacancy_high');
    });
  });

  describe('Time horizon override', () => {

    it('should replace every property holding period with the override value', () => {
      const result = scenarioBatchProcessor({
        properties: [baseProperty({ propertyId: 'prop-1', holdingPeriodYears: 5 })],
        scenarios: [baseScenario],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: 10,
      });

      expect(result.averageHoldingPeriod).toBe(10);
      expect(result.scenarios[0].properties[0].totalCashFlowHoldingPeriod).toBeCloseTo(-108667.02, 0);
    });
  });

  describe('Combined stress scenario (rate + appreciation + vacancy)', () => {

    it('should compound all three effects into a worse outcome than any single stress', () => {
      const recession: MarketScenario = {
        scenarioName: 'Recession',
        scenarioId: 'recession',
        variables: [
          { name: 'mortgageRateChange', value: 1.5, unit: 'percent' },
          { name: 'appreciationDelta', value: -0.5, unit: 'percent' },
          { name: 'vacancyShift', value: 2.0, unit: 'percent_point' },
        ],
        probability: 0.25,
        description: 'Economic downturn scenario',
      };

      const result = scenarioBatchProcessor({
        properties: [baseProperty({ propertyId: 'prop-1' })],
        scenarios: [baseScenario, recession],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      expect(result.worstCaseScenario.scenarioId).toBe('recession');
      expect(result.scenarios[1].portfolioIRR).toBeLessThan(0);
      expect(result.scenarios[1].probability).toBe(0.25);
      expect(result.scenarios[1].description).toBe('Economic downturn scenario');
      expect(result.worstCaseScenario.reason).toContain('vacancy');
    });
  });

  describe('Edge case: empty portfolio', () => {

    it('should return an empty, well-formed result without crashing', () => {
      const result = scenarioBatchProcessor({
        properties: [],
        scenarios: [baseScenario],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      expect(result.scenarios).toEqual([]);
      expect(result.portfolioCount).toBe(0);
      expect(result.scenarioRanking).toEqual([]);
      expect(result.disclaimer).toContain('informational analysis only');
    });

    it('should return an empty result when no scenarios are provided', () => {
      const result = scenarioBatchProcessor({
        properties: [baseProperty({ propertyId: 'prop-1' })],
        scenarios: [],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      expect(result.scenarios).toEqual([]);
    });
  });

  describe('IRR bisection edge cases', () => {

    it('should widen the search bracket and fall back to a 0 IRR when cash flows never cross zero', () => {
      // A tiny down payment, a maxed-out interest rate, full vacancy, and the
      // worst allowed appreciation clamp combine to make every cash flow in
      // the series negative (operating loss every year, and the exit proceeds
      // still underwater after payoff + selling costs). NPV is then negative
      // at every discount rate, so the bisection's initial bracket never
      // brackets a root: it repeatedly doubles the upper bound (the
      // "widen search" loop) before giving up and reporting a 0 IRR rather
      // than a nonsensical or NaN value.
      const distress: MarketScenario = {
        scenarioName: 'Deep Distress',
        scenarioId: 'distress',
        variables: [{ name: 'appreciationDelta', value: -22.5, unit: 'percent' }],
        probability: null,
        description: null,
      };

      const result = scenarioBatchProcessor({
        properties: [
          baseProperty({
            propertyId: 'prop-1',
            downPaymentPercent: 5,
            interestRate: 25,
            monthlyRentalIncome: 100,
            vacancyRate: 100,
            holdingPeriodYears: 1,
          }),
        ],
        scenarios: [distress],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      expect(result.scenarios[0].properties[0].appreciationRate).toBe(-20);
      expect(result.scenarios[0].properties[0].irr).toBe(0);
    });

    it('should fall back to the midpoint estimate when a huge-magnitude cash flow series never converges within tolerance', () => {
      // Scaling every dollar figure up ~1,000,000x keeps the same cash flow
      // shape (and therefore the same true IRR) as the base-case fixture, but
      // at that magnitude the absolute NPV never drops below the bisection's
      // 1e-6 convergence tolerance before floating-point precision exhausts
      // the search interval — exercising the "exhausted all 200 iterations"
      // fallback return instead of the early-exit convergence check.
      const result = scenarioBatchProcessor({
        properties: [
          baseProperty({
            propertyId: 'prop-1',
            purchasePrice: 500_000_000_000,
            annualPropertyTaxes: 5_000_000_000,
            monthlyRentalIncome: 2_500_000_000,
            monthlyUtilities: 100_000_000,
            monthlyMaintenance: 200_000_000,
            monthlyPropertyManagement: 250_000_000,
            monthlyInsurance: 100_000_000,
          }),
        ],
        scenarios: [baseScenario],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      // Same cash flow shape as the base case fixture, just scaled up — the
      // resulting IRR should still land in the same neighborhood.
      expect(result.scenarios[0].properties[0].irr).toBeCloseTo(4.8014, 1);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should report the disclaimer and tier on every response', () => {
      const result = scenarioBatchProcessor({
        properties: [baseProperty({ propertyId: 'prop-1' })],
        scenarios: [baseScenario],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      expect(result.disclaimer).toContain('informational analysis only');
      expect(result.tier).toBe('COM');
    });

    it('should have all required output fields', () => {
      const result = scenarioBatchProcessor({
        properties: [baseProperty({ propertyId: 'prop-1' })],
        scenarios: [baseScenario],
        portfolioBaseCurrency: 'CAD',
        fxRate: 1.25,
        timeHorizonOverride: null,
      });

      expect(result).toHaveProperty('scenarios');
      expect(result).toHaveProperty('scenarioRanking');
      expect(result).toHaveProperty('bestCaseScenario');
      expect(result).toHaveProperty('worstCaseScenario');
      expect(result).toHaveProperty('irrRange');
      expect(result).toHaveProperty('cashFlowRange');
      expect(result).toHaveProperty('equityMultipleRange');
      expect(result).toHaveProperty('sensitivityRanking');
      expect(result).toHaveProperty('disclaimer');
    });
  });
});
