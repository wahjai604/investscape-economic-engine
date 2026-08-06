/**
 * E42 Test Suite: Neighborhood Investment Score Engine
 *
 * This engine computes scores directly from formulas rather than looking up
 * fixtures, so every expected value below was independently hand-derived by
 * walking the same threshold tables the engine implements (see
 * src/E42-neighborhood-investment-score.ts for the tables). Tests cover:
 * - Null-input fallback behavior (defaults, completeness, missing inputs)
 * - A fully-specified "golden" composite score
 * - Comparative scenarios (thin market, weak macro, high volatility, worst-case)
 * - Factor-level edge cases (RES vs COM tier, rental yield fallback, extremes)
 * - Grade/recommendation/risk-level mapping
 */

import {
  neighborhoodInvestmentScore,
  NeighborhoodInvestmentScoreInput,
} from '../src/E42-neighborhood-investment-score';

const ALL_NULL_INPUT: NeighborhoodInvestmentScoreInput = {
  gdpGrowth: null,
  inflationRate: null,
  unemploymentRate: null,
  cityPriceTrend: null,
  cityCapRateMedian: null,
  cityCapRateRange: null,
  rentalTrendCity: null,
  populationGrowth: null,
  medianHouseholdIncome: null,
  populationDensity: null,
  medianSoldPrice: null,
  pricePerSqft: null,
  daysOnMarket: null,
  soldVolume12m: null,
  priceVolatility: null,
  medianRent: null,
  rentPerSqft: null,
  rentalVacancyRate: null,
  averageSchoolRating: null,
  walkScore: null,
  transitScore: null,
  bikeScore: null,
  absorptionRate: null,
  buyerCompetitionIndex: null,
  regionId: 'unknown-region',
};

// "Burnaby, BC" fixture — a fully-specified strong market (Test 2 from spec).
const BURNABY_INPUT: NeighborhoodInvestmentScoreInput = {
  ...ALL_NULL_INPUT,
  gdpGrowth: 2.5,
  inflationRate: 2.3,
  unemploymentRate: 5.1,
  cityCapRateMedian: 5.2,
  cityPriceTrend: 3.1,
  populationGrowth: 2.5,
  medianHouseholdIncome: 92000,
  medianSoldPrice: 1100000,
  pricePerSqft: 620,
  daysOnMarket: 35,
  soldVolume12m: 250,
  priceVolatility: 4.8,
  medianRent: 1850,
  rentalVacancyRate: 4.2,
  rentalTrendCity: 2.8,
  walkScore: 72,
  transitScore: 65,
  bikeScore: 58,
  averageSchoolRating: 7.8,
  absorptionRate: 3.2,
  buyerCompetitionIndex: 7,
  regionId: 'west_canada',
};

describe('E42: Neighborhood Investment Score Engine', () => {

  describe('Null input fallback', () => {

    it('should never throw and should apply neutral defaults when all inputs are null', () => {
      const result = neighborhoodInvestmentScore(ALL_NULL_INPUT);

      expect(result.investmentScore).toBe(58);
      expect(result.grade).toBe('C');
      expect(result.recommendation).toBe('Hold');
      expect(result.riskLevel).toBe('moderate');
      expect(result.completenessScore).toBe(0);
      expect(result.missingInputs).toHaveLength(24);
    });

    it('should report the disclaimer on every response', () => {
      const result = neighborhoodInvestmentScore(ALL_NULL_INPUT);
      expect(result.disclaimer).toContain('informational analysis only');
    });
  });

  describe('Golden fixture: Burnaby, BC (strong market)', () => {

    it('should compute the full composite score and grade', () => {
      const result = neighborhoodInvestmentScore(BURNABY_INPUT);

      expect(result.investmentScore).toBe(86);
      expect(result.grade).toBe('A');
      expect(result.recommendation).toBe('Strong Buy');
      expect(result.riskLevel).toBe('low');
    });

    it('should compute each of the 7 weighted factor scores', () => {
      const { factors } = neighborhoodInvestmentScore(BURNABY_INPUT);

      expect(factors.priceAppreciation.score).toBe(97);
      expect(factors.rentalYield.score).toBe(73);
      expect(factors.marketVelocity.score).toBe(95);
      expect(factors.demographics.score).toBe(85);
      expect(factors.liveability.score).toBe(70);
      expect(factors.macroContext.score).toBe(90);
      expect(factors.marketStability.score).toBe(96);
    });

    it('should have factor weights that sum to 100', () => {
      const { factors } = neighborhoodInvestmentScore(BURNABY_INPUT);
      const totalWeight = Object.values(factors).reduce((sum, f) => sum + f.weight, 0);
      expect(totalWeight).toBe(100);
    });

    it('should report completeness based on the 3 omitted fields', () => {
      const result = neighborhoodInvestmentScore(BURNABY_INPUT);

      expect(result.completenessScore).toBe(88);
      expect(result.missingInputs).toHaveLength(3);
      expect(result.missingInputs).toEqual(
        expect.arrayContaining(['cityCapRateRange', 'populationDensity', 'rentPerSqft'])
      );
    });

    it('should reach full completeness when every field is supplied', () => {
      const fullyPopulated: NeighborhoodInvestmentScoreInput = {
        ...BURNABY_INPUT,
        cityCapRateRange: { low: 4.0, high: 6.5 },
        populationDensity: 1850,
        rentPerSqft: 2.1,
      };
      const result = neighborhoodInvestmentScore(fullyPopulated);

      expect(result.completenessScore).toBe(100);
      expect(result.missingInputs).toHaveLength(0);
    });
  });

  describe('Scenario: thin/rural market pulls score down', () => {

    it('should lower market velocity and stability when absorption and volume are weak', () => {
      const ruralInput: NeighborhoodInvestmentScoreInput = {
        ...BURNABY_INPUT,
        absorptionRate: 18,
        buyerCompetitionIndex: 2,
        soldVolume12m: 15,
      };
      const result = neighborhoodInvestmentScore(ruralInput);

      expect(result.factors.marketVelocity.score).toBe(2);
      expect(result.factors.marketStability.score).toBe(76);
      expect(result.investmentScore).toBe(71);
      expect(result.investmentScore).toBeLessThan(86); // below the Burnaby baseline
      expect(result.grade).toBe('B');
      expect(result.recommendation).toBe('Buy');
    });
  });

  describe('Scenario: weak macro backdrop has capped influence (10% weight)', () => {

    it('should pull the score down but not dominate it', () => {
      const weakMacroInput: NeighborhoodInvestmentScoreInput = {
        ...BURNABY_INPUT,
        gdpGrowth: 0.2,
        inflationRate: 0.8,
        unemploymentRate: 8.5,
      };
      const result = neighborhoodInvestmentScore(weakMacroInput);

      expect(result.factors.macroContext.score).toBe(20);
      expect(result.investmentScore).toBe(79);
      expect(result.investmentScore).toBeLessThan(86);
      expect(result.grade).toBe('B');
    });
  });

  describe('Scenario: high volatility signals risk', () => {

    it('should penalize appreciation and stability, and mark risk as high', () => {
      const volatileInput: NeighborhoodInvestmentScoreInput = {
        ...BURNABY_INPUT,
        priceVolatility: 14,
        rentalVacancyRate: 12,
      };
      const result = neighborhoodInvestmentScore(volatileInput);

      expect(result.factors.priceAppreciation.score).toBe(72);
      expect(result.factors.rentalYield.score).toBe(45);
      expect(result.factors.marketStability.score).toBe(24);
      expect(result.investmentScore).toBe(70);
      expect(result.riskLevel).toBe('high');
    });
  });

  describe('Scenario: worst-case market', () => {

    it('should produce a failing grade with high risk', () => {
      const worstCaseInput: NeighborhoodInvestmentScoreInput = {
        ...ALL_NULL_INPUT,
        cityCapRateMedian: 0.5,
        cityPriceTrend: -2,
        priceVolatility: 20,
        daysOnMarket: 200,
        medianRent: 500,
        medianSoldPrice: 900000,
        rentalVacancyRate: 15,
        rentalTrendCity: -3,
        absorptionRate: 15,
        buyerCompetitionIndex: 1,
        soldVolume12m: 5,
        populationGrowth: -3,
        medianHouseholdIncome: 40000,
        walkScore: 20,
        transitScore: 15,
        bikeScore: 10,
        gdpGrowth: -1,
        inflationRate: 8,
        unemploymentRate: 10,
      };
      const result = neighborhoodInvestmentScore(worstCaseInput);

      expect(result.investmentScore).toBe(7);
      expect(result.grade).toBe('F');
      expect(result.recommendation).toBe('Avoid');
      expect(result.riskLevel).toBe('high');
    });
  });

  describe('Factor: Liveability — RES vs COM tier', () => {

    it('should skip the school rating adjustment for RES tier (null rating)', () => {
      const resInput: NeighborhoodInvestmentScoreInput = {
        ...ALL_NULL_INPUT,
        walkScore: 72,
        transitScore: 65,
        bikeScore: 58,
        averageSchoolRating: null,
      };
      const result = neighborhoodInvestmentScore(resInput);
      expect(result.factors.liveability.score).toBe(60);
    });

    it('should apply the school rating adjustment for COM tier (non-null rating)', () => {
      const comInput: NeighborhoodInvestmentScoreInput = {
        ...ALL_NULL_INPUT,
        walkScore: 72,
        transitScore: 65,
        bikeScore: 58,
        averageSchoolRating: 7.8,
      };
      const result = neighborhoodInvestmentScore(comInput);
      expect(result.factors.liveability.score).toBe(70);
    });
  });

  describe('Factor: Rental Yield fallback via rent-per-sqft', () => {

    it('should use the rent-per-sqft fallback when rent and sale price are unavailable', () => {
      const fallbackInput: NeighborhoodInvestmentScoreInput = {
        ...ALL_NULL_INPUT,
        rentPerSqft: 2.2,
      };
      const result = neighborhoodInvestmentScore(fallbackInput);
      expect(result.factors.rentalYield.score).toBe(73);
    });
  });

  describe('Factor: Demographics with negative population growth', () => {

    it('should apply the declining-population base score', () => {
      const decliningInput: NeighborhoodInvestmentScoreInput = {
        ...ALL_NULL_INPUT,
        populationGrowth: -1.5,
      };
      const result = neighborhoodInvestmentScore(decliningInput);
      expect(result.factors.demographics.score).toBe(20);
    });
  });

  describe('Factor: Price Appreciation extremes', () => {

    it('should score high for an excellent cap rate', () => {
      const highCapRateInput: NeighborhoodInvestmentScoreInput = {
        ...ALL_NULL_INPUT,
        cityCapRateMedian: 8.5,
      };
      const result = neighborhoodInvestmentScore(highCapRateInput);
      expect(result.factors.priceAppreciation.score).toBe(92);
    });

    it('should score low for a weak cap rate', () => {
      const lowCapRateInput: NeighborhoodInvestmentScoreInput = {
        ...ALL_NULL_INPUT,
        cityCapRateMedian: 0.8,
      };
      const result = neighborhoodInvestmentScore(lowCapRateInput);
      expect(result.factors.priceAppreciation.score).toBe(22);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should not throw for a regionId that does not match any known enum format', () => {
      expect(() =>
        neighborhoodInvestmentScore({ ...ALL_NULL_INPUT, regionId: 'west_canada' })
      ).not.toThrow();
    });

    it('should have all required output fields', () => {
      const result = neighborhoodInvestmentScore(BURNABY_INPUT);

      expect(result).toHaveProperty('investmentScore');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('completenessScore');
      expect(result).toHaveProperty('missingInputs');
      expect(result).toHaveProperty('disclaimer');
      expect(Object.keys(result.factors)).toHaveLength(7);
    });
  });
});
