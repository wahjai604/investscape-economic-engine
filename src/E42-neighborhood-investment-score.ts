/**
 * E42: Neighborhood Investment Score Engine
 *
 * Aggregates E29-E37 outputs (regional macro, city market, neighborhood micro)
 * into a single composite investment quality score (1-100) with a 7-factor
 * weighted breakdown:
 * - Price Appreciation (20%)
 * - Rental Yield (15%)
 * - Market Velocity (15%)
 * - Demographics (15%)
 * - Liveability (15%)
 * - Macro Context (10%)
 * - Market Stability (10%)
 *
 * Unlike the other engines in this package, this is a pure computation engine
 * (no mock data store) — every score is derived directly from the caller's
 * inputs, with sensible neutral defaults applied when data is missing so the
 * engine never fails to produce a result.
 */

export interface CapRateRange {
  low: number;
  high: number;
}

export interface NeighborhoodInvestmentScoreInput {
  // From E29: Regional Macro Context
  gdpGrowth: number | null;
  inflationRate: number | null;
  unemploymentRate: number | null;

  // From E30: City-Level Market Analysis
  cityPriceTrend: number | null;
  cityCapRateMedian: number | null;
  cityCapRateRange: CapRateRange | null;
  rentalTrendCity: number | null;

  // From E31: Neighborhood Demographics
  populationGrowth: number | null;
  medianHouseholdIncome: number | null;
  populationDensity: number | null;

  // From E32: Comparable Sales Analysis
  medianSoldPrice: number | null;
  pricePerSqft: number | null;
  daysOnMarket: number | null;
  soldVolume12m: number | null;
  priceVolatility: number | null;

  // From E33: Rental Comp Engine
  medianRent: number | null;
  rentPerSqft: number | null;
  rentalVacancyRate: number | null;

  // From E34: School Rating & Education (null if RES tier)
  averageSchoolRating: number | null;

  // From E35: Walkability & Transit Scorer
  walkScore: number | null;
  transitScore: number | null;
  bikeScore: number | null;

  // From E37: Market Velocity Analyzer
  absorptionRate: number | null;
  buyerCompetitionIndex: number | null;

  regionId: string;
}

export interface InvestmentFactorBreakdown {
  score: number;
  weight: number;
  rationale: string;
}

export interface NeighborhoodInvestmentScoreFactors {
  priceAppreciation: InvestmentFactorBreakdown;
  rentalYield: InvestmentFactorBreakdown;
  marketVelocity: InvestmentFactorBreakdown;
  demographics: InvestmentFactorBreakdown;
  liveability: InvestmentFactorBreakdown;
  macroContext: InvestmentFactorBreakdown;
  marketStability: InvestmentFactorBreakdown;
}

export interface NeighborhoodInvestmentScoreOutput {
  investmentScore: number;
  factors: NeighborhoodInvestmentScoreFactors;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: string;
  riskLevel: 'low' | 'moderate' | 'high';
  completenessScore: number;
  missingInputs: string[];
  disclaimer: string;
}

const DISCLAIMER =
  'InvestScape provides informational analysis only and does not constitute financial, ' +
  'legal, or professional real estate advice. This investment score is based on historical ' +
  'data and market indicators and should not be used as the sole basis for investment ' +
  'decisions. Consult with qualified professionals before making any property investments.';

/** All nullable input fields tracked for completeness/missing-input reporting. */
const ALL_FIELDS: (keyof NeighborhoodInvestmentScoreInput)[] = [
  'gdpGrowth',
  'inflationRate',
  'unemploymentRate',
  'cityPriceTrend',
  'cityCapRateMedian',
  'cityCapRateRange',
  'rentalTrendCity',
  'populationGrowth',
  'medianHouseholdIncome',
  'populationDensity',
  'medianSoldPrice',
  'pricePerSqft',
  'daysOnMarket',
  'soldVolume12m',
  'priceVolatility',
  'medianRent',
  'rentPerSqft',
  'rentalVacancyRate',
  'averageSchoolRating',
  'walkScore',
  'transitScore',
  'bikeScore',
  'absorptionRate',
  'buyerCompetitionIndex',
];

function clamp(value: number): number {
  return Math.min(100, Math.max(1, value));
}

/** Factor 1: Price Appreciation (20%) */
function scorePriceAppreciation(input: NeighborhoodInvestmentScoreInput): InvestmentFactorBreakdown {
  const { cityCapRateMedian, cityPriceTrend, priceVolatility, daysOnMarket } = input;

  if (cityCapRateMedian === null) {
    return {
      score: 50,
      weight: 20,
      rationale: 'Cap rate data unavailable; neutral score applied.',
    };
  }

  let score: number;
  if (cityCapRateMedian >= 6.5) score = 95;
  else if (cityCapRateMedian >= 5.5) score = 85;
  else if (cityCapRateMedian >= 4.5) score = 75;
  else if (cityCapRateMedian >= 3.5) score = 60;
  else if (cityCapRateMedian >= 3.0) score = 45;
  else score = 25;

  const trend = cityPriceTrend ?? 1.5;
  if (trend >= 4) score += 20;
  else if (trend >= 2) score += 12;
  else if (trend >= 0.5) score += 5;
  else score -= 5;

  const volatility = priceVolatility ?? 6;
  if (volatility > 10) score -= 20;
  else if (volatility >= 5) score -= 8;
  else score += 5;

  if (daysOnMarket !== null) {
    if (daysOnMarket <= 30) score += 10;
    else if (daysOnMarket <= 60) score += 5;
    else if (daysOnMarket <= 120) score += 0;
    else score -= 10;
  }

  return {
    score: clamp(score),
    weight: 20,
    rationale: `Cap rate median ${cityCapRateMedian}%, city appreciation ${trend}% YoY, price volatility ${volatility}%.`,
  };
}

/** Factor 2: Rental Yield (15%) */
function scoreRentalYield(input: NeighborhoodInvestmentScoreInput): InvestmentFactorBreakdown {
  const { medianRent, medianSoldPrice, rentalVacancyRate, rentalTrendCity, rentPerSqft } = input;

  let score: number | null = null;
  let gry: number | null = null;

  if (medianRent !== null && medianSoldPrice !== null && medianSoldPrice > 0) {
    gry = ((medianRent * 12) / medianSoldPrice) * 100;
    if (gry >= 5.0) score = 90;
    else if (gry >= 3.5) score = 75;
    else if (gry >= 2.0) score = 55;
    else if (gry >= 1.0) score = 35;
    else score = 15;
  } else if (rentPerSqft !== null) {
    if (rentPerSqft >= 2.0) score = 65;
    else if (rentPerSqft >= 1.5) score = 50;
    else score = 30;
  }

  if (score === null) {
    return {
      score: 50,
      weight: 15,
      rationale: 'Rent and sale price data unavailable; neutral score applied.',
    };
  }

  const vacancy = rentalVacancyRate ?? 5;
  if (vacancy <= 2.5) score += 15;
  else if (vacancy <= 5) score += 8;
  else if (vacancy <= 7) score += 0;
  else if (vacancy <= 10) score -= 8;
  else score -= 20;

  if (rentalTrendCity !== null) {
    if (rentalTrendCity >= 3.5) score += 15;
    else if (rentalTrendCity >= 2.0) score += 10;
    else if (rentalTrendCity >= 0.5) score += 5;
    else score -= 5;
  }

  return {
    score: clamp(score),
    weight: 15,
    rationale:
      gry !== null
        ? `Gross rental yield ${gry.toFixed(1)}%, vacancy ${vacancy}%.`
        : `Rent-per-sqft fallback used, vacancy ${vacancy}%.`,
  };
}

/** Factor 3: Market Velocity (15%) */
function scoreMarketVelocity(input: NeighborhoodInvestmentScoreInput): InvestmentFactorBreakdown {
  const { absorptionRate, buyerCompetitionIndex, soldVolume12m } = input;

  if (absorptionRate === null) {
    return {
      score: 50,
      weight: 15,
      rationale: 'Absorption rate data unavailable; neutral score applied.',
    };
  }

  let score: number;
  if (absorptionRate <= 2) score = 95;
  else if (absorptionRate <= 3) score = 85;
  else if (absorptionRate <= 4) score = 75;
  else if (absorptionRate <= 6) score = 60;
  else if (absorptionRate <= 9) score = 40;
  else score = 20;

  if (buyerCompetitionIndex !== null) {
    if (buyerCompetitionIndex >= 8) score += 20;
    else if (buyerCompetitionIndex >= 6) score += 12;
    else if (buyerCompetitionIndex >= 4) score += 5;
    else score -= 10;
  }

  if (soldVolume12m !== null) {
    if (soldVolume12m >= 100) score += 8;
    else if (soldVolume12m >= 50) score += 4;
    else if (soldVolume12m >= 25) score += 0;
    else score -= 8;
  }

  return {
    score: clamp(score),
    weight: 15,
    rationale: `Absorption rate ${absorptionRate} months${
      buyerCompetitionIndex !== null ? `, buyer competition ${buyerCompetitionIndex}/10` : ''
    }.`,
  };
}

/** Factor 4: Demographics (15%) */
function scoreDemographics(input: NeighborhoodInvestmentScoreInput): InvestmentFactorBreakdown {
  const populationGrowth = input.populationGrowth ?? 1.0;
  const medianHouseholdIncome = input.medianHouseholdIncome ?? 75000;
  const populationDensity = input.populationDensity;

  let score: number;
  if (populationGrowth >= 3.5) score = 85;
  else if (populationGrowth >= 2.0) score = 75;
  else if (populationGrowth >= 0.5) score = 60;
  else if (populationGrowth >= 0) score = 40;
  else score = 15;

  if (medianHouseholdIncome >= 120000) score += 15;
  else if (medianHouseholdIncome >= 90000) score += 10;
  else if (medianHouseholdIncome >= 60000) score += 5;
  else score -= 5;

  if (populationDensity !== null) {
    if (populationDensity >= 3000) score += 8;
    else if (populationDensity >= 1000) score += 12;
    else if (populationDensity >= 500) score += 8;
    else score += 0;
  }

  return {
    score: clamp(score),
    weight: 15,
    rationale: `Population growth ${populationGrowth}%, median household income $${medianHouseholdIncome.toLocaleString()}.`,
  };
}

/** Factor 5: Liveability (15%) */
function scoreLiveability(input: NeighborhoodInvestmentScoreInput): InvestmentFactorBreakdown {
  const walkScore = input.walkScore ?? 50;
  const transitScore = input.transitScore ?? 50;
  const bikeScore = input.bikeScore ?? 50;
  const avg = (walkScore + transitScore + bikeScore) / 3;

  let score: number;
  if (avg >= 80) score = 90;
  else if (avg >= 70) score = 75;
  else if (avg >= 60) score = 60;
  else if (avg >= 50) score = 45;
  else score = 25;

  const { averageSchoolRating } = input;
  if (averageSchoolRating !== null) {
    if (averageSchoolRating >= 8.5) score += 15;
    else if (averageSchoolRating >= 7.5) score += 10;
    else if (averageSchoolRating >= 6.5) score += 5;
    else score -= 5;
  }

  return {
    score: clamp(score),
    weight: 15,
    rationale: `Walkability average ${avg.toFixed(0)}${
      averageSchoolRating !== null ? `, school rating ${averageSchoolRating}/10` : ''
    }.`,
  };
}

/** Factor 6: Macro Context (10%) */
function scoreMacroContext(input: NeighborhoodInvestmentScoreInput): InvestmentFactorBreakdown {
  const gdpGrowth = input.gdpGrowth ?? 2.0;
  const inflationRate = input.inflationRate ?? 2.0;
  const unemploymentRate = input.unemploymentRate ?? 2.0;

  let score: number;
  if (gdpGrowth >= 3.5) score = 85;
  else if (gdpGrowth >= 2.0) score = 75;
  else if (gdpGrowth >= 0.5) score = 60;
  else score = 30;

  if (inflationRate >= 1.5 && inflationRate <= 3.5) score += 10;
  else if (inflationRate >= 1 && inflationRate < 1.5) score += 5;
  else if (inflationRate > 3.5 && inflationRate <= 5) score += 5;
  else if (inflationRate < 1) score += 0;
  else score -= 15;

  if (unemploymentRate <= 4.5) score += 10;
  else if (unemploymentRate <= 6) score += 5;
  else if (unemploymentRate <= 7.5) score += 0;
  else score -= 10;

  return {
    score: clamp(score),
    weight: 10,
    rationale: `GDP growth ${gdpGrowth}%, inflation ${inflationRate}%, unemployment ${unemploymentRate}%.`,
  };
}

/** Factor 7: Market Stability (10%) */
function scoreMarketStability(input: NeighborhoodInvestmentScoreInput): InvestmentFactorBreakdown {
  const priceVolatility = input.priceVolatility ?? 6;
  const { soldVolume12m } = input;
  const rentalVacancyRate = input.rentalVacancyRate ?? 5;

  let score: number;
  if (priceVolatility <= 3) score = 90;
  else if (priceVolatility <= 5) score = 80;
  else if (priceVolatility <= 8) score = 65;
  else if (priceVolatility <= 12) score = 45;
  else score = 20;

  if (soldVolume12m !== null) {
    if (soldVolume12m >= 80) score += 12;
    else if (soldVolume12m >= 50) score += 8;
    else if (soldVolume12m >= 25) score += 4;
    else score -= 8;
  }

  if (rentalVacancyRate <= 4) score += 8;
  else if (rentalVacancyRate <= 7) score += 4;
  else if (rentalVacancyRate <= 10) score += 0;
  else score -= 8;

  return {
    score: clamp(score),
    weight: 10,
    rationale: `Price volatility ${priceVolatility}%, rental vacancy ${rentalVacancyRate}%.`,
  };
}

function deriveGrade(score: number): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; recommendation: string } {
  if (score >= 80) return { grade: 'A', recommendation: 'Strong Buy' };
  if (score >= 65) return { grade: 'B', recommendation: 'Buy' };
  if (score >= 50) return { grade: 'C', recommendation: 'Hold' };
  if (score >= 35) return { grade: 'D', recommendation: 'Caution' };
  return { grade: 'F', recommendation: 'Avoid' };
}

function deriveRiskLevel(score: number, priceVolatility: number): 'low' | 'moderate' | 'high' {
  if (score >= 75) {
    return priceVolatility <= 6 ? 'low' : 'moderate';
  }
  if (score < 50) {
    return 'high';
  }
  return priceVolatility > 10 ? 'high' : 'moderate';
}

/**
 * Compute a composite neighborhood investment score (1-100) from E29-E37 outputs.
 *
 * Never throws on missing data — null inputs fall back to neutral defaults and
 * are surfaced via `missingInputs` / `completenessScore` instead.
 */
export function neighborhoodInvestmentScore(
  input: NeighborhoodInvestmentScoreInput
): NeighborhoodInvestmentScoreOutput {
  const missingInputs = ALL_FIELDS.filter((field) => input[field] === null);
  const completenessScore = Math.round(
    ((ALL_FIELDS.length - missingInputs.length) / ALL_FIELDS.length) * 100
  );

  const priceAppreciation = scorePriceAppreciation(input);
  const rentalYield = scoreRentalYield(input);
  const marketVelocity = scoreMarketVelocity(input);
  const demographics = scoreDemographics(input);
  const liveability = scoreLiveability(input);
  const macroContext = scoreMacroContext(input);
  const marketStability = scoreMarketStability(input);

  const weightedSum =
    priceAppreciation.score * (priceAppreciation.weight / 100) +
    rentalYield.score * (rentalYield.weight / 100) +
    marketVelocity.score * (marketVelocity.weight / 100) +
    demographics.score * (demographics.weight / 100) +
    liveability.score * (liveability.weight / 100) +
    macroContext.score * (macroContext.weight / 100) +
    marketStability.score * (marketStability.weight / 100);

  const investmentScore = Math.round(clamp(weightedSum));
  const { grade, recommendation } = deriveGrade(investmentScore);
  const riskLevel = deriveRiskLevel(investmentScore, input.priceVolatility ?? 6);

  return {
    investmentScore,
    factors: {
      priceAppreciation,
      rentalYield,
      marketVelocity,
      demographics,
      liveability,
      macroContext,
      marketStability,
    },
    grade,
    recommendation,
    riskLevel,
    completenessScore,
    missingInputs,
    disclaimer: DISCLAIMER,
  };
}

export default neighborhoodInvestmentScore;
