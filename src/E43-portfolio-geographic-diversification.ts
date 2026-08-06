/**
 * E43: Portfolio Geographic Diversification Engine
 *
 * Analyzes a portfolio of properties to measure geographic concentration risk
 * and diversification strength across 6 weighted factors:
 * - Regional Spread (25%)
 * - City Spread (20%)
 * - Property Type Distribution (15%)
 * - Asset Value Balance (15%)
 * - Income Source Diversity (15%)
 * - Cross-Border Risk Balance (10%)
 *
 * Like E42, this is a pure computation engine (no mock data store) — every
 * score is derived directly from the caller's property array.
 */

export interface Property {
  propertyId: string;
  address: string;
  regionId: string;
  cityId: string;
  neighborhoodId: string;
  propertyType: 'residential' | 'commercial' | 'development';
  purchasePrice: number;
  currentMarketValue: number;
  annualGrossIncome: number | null;
  mortgageBalance: number | null;
  equityValue: number;
  currency: 'CAD' | 'USD';
  country: 'CA' | 'US';
}

export interface PortfolioDiversificationInput {
  properties: Property[];
  portfolioBaseCurrency: 'CAD' | 'USD';
  fxRate: number;
}

export interface DiversificationFactorBreakdown {
  score: number;
  weight: number;
  rationale: string;
}

export interface GeographicDistribution {
  regionId: string;
  regionName: string;
  propertyCount: number;
  totalValue: number;
  percentOfPortfolio: number;
  incomeContribution: number;
  percentOfIncome: number;
  percentOfEquity: number;
  concentrationScore: number;
}

export interface CityExposure {
  cityId: string;
  cityName: string;
  regionId: string;
  propertyCount: number;
  totalValue: number;
  percentOfPortfolio: number;
  concentrationScore: number;
}

export interface PortfolioDiversificationOutput {
  diversificationScore: number;
  factors: {
    regionalSpread: DiversificationFactorBreakdown;
    citySpread: DiversificationFactorBreakdown;
    propertyTypeDistribution: DiversificationFactorBreakdown;
    assetValueBalance: DiversificationFactorBreakdown;
    incomeSourceDiversity: DiversificationFactorBreakdown;
    crossBorderRiskBalance: DiversificationFactorBreakdown;
  };
  regionalExposure: GeographicDistribution[];
  cityExposure: CityExposure[];
  propertyTypeBreakdown: {
    residential: { count: number; value: number; percent: number };
    commercial: { count: number; value: number; percent: number };
    development: { count: number; value: number; percent: number };
  };
  concentrationRisks: {
    singlePropertyOverexposed: boolean;
    largestPropertyPercent: number;
    largestPropertyId: string;
    regionOverexposed: boolean;
    largestRegionPercent: number;
    largestRegionId: string;
    cityOverexposed: boolean;
    largestCityPercent: number;
    largestCityId: string;
    crossBorderUnbalanced: boolean;
    cadPercent: number;
    usdPercent: number;
    incomeConcentration: boolean;
    largestIncomeSourcePercent: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: string;
  riskLevel: 'low' | 'moderate' | 'high';
  totalPortfolioValue: number;
  totalEquityValue: number;
  totalGrossIncome: number;
  propertyCount: number;
  disclaimer: string;
}

const DISCLAIMER =
  'InvestScape provides informational analysis only and does not constitute investment advice. ' +
  'Geographic diversification analysis is based on property values and income data provided; ' +
  'actual risk depends on market conditions, property-specific factors, and economic cycles. ' +
  'Consult with qualified real estate advisors or financial professionals before making ' +
  'portfolio decisions based on this analysis.';

const DEFAULT_FX_RATE = 1.25;

function clamp(value: number): number {
  return Math.min(100, Math.max(1, value));
}

function humanize(id: string): string {
  return id
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = map.get(key);
    if (group) group.push(item);
    else map.set(key, [item]);
  }
  return map;
}

function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((sum, item) => sum + fn(item), 0);
}

function percentOf(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0;
}

/** Standard Gini coefficient: 0 = perfect equality, 1 = perfect inequality. */
function computeGini(values: number[]): number {
  const n = values.length;
  if (n <= 1) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  const rankWeightedSum = sorted.reduce((s, v, idx) => s + (idx + 1) * v, 0);
  return (2 * rankWeightedSum) / (n * total) - (n + 1) / n;
}

function toBaseCurrency(
  value: number,
  currency: 'CAD' | 'USD',
  base: 'CAD' | 'USD',
  fxRate: number
): number {
  if (currency === base) return value;
  return currency === 'USD' ? value * fxRate : value / fxRate;
}

interface ScoringContext {
  properties: Property[];
  baseValues: Map<string, number>; // propertyId -> currentMarketValue in base currency
  baseIncomes: Map<string, number>; // propertyId -> annualGrossIncome in base currency
  totalValue: number;
  totalIncome: number;
}

/** Factor 1: Regional Spread (25%) */
function scoreRegionalSpread(ctx: ScoringContext): DiversificationFactorBreakdown {
  const { properties, baseValues, totalValue } = ctx;
  const regionGroups = groupBy(properties, (p) => p.regionId);
  const regionCount = regionGroups.size;

  const fractions = [...regionGroups.values()].map(
    (props) => sumBy(props, (p) => baseValues.get(p.propertyId)!) / totalValue
  );

  let base: number;
  if (regionCount >= 5) base = 85;
  else if (regionCount === 4) base = 75;
  else if (regionCount === 3) base = 60;
  else if (regionCount === 2) base = 40;
  else base = 15;

  const herfindahl = fractions.reduce((s, f) => s + f * f, 0);
  const normalizedHerfindahl = (herfindahl - 0.2) / 0.8;
  const concentrationPenalty = normalizedHerfindahl * -30;

  const largest = Math.max(...fractions);
  let bonus: number;
  if (largest <= 0.4) bonus = 15;
  else if (largest <= 0.5) bonus = 8;
  else if (largest <= 0.6) bonus = 0;
  else bonus = -15;

  return {
    score: clamp(base + concentrationPenalty + bonus),
    weight: 25,
    rationale: `${regionCount} region(s), largest ${(largest * 100).toFixed(0)}% of portfolio value.`,
  };
}

/** Factor 2: City Spread (20%) */
function scoreCitySpread(ctx: ScoringContext): DiversificationFactorBreakdown {
  const { properties, baseValues, totalValue } = ctx;
  const regionGroups = groupBy(properties, (p) => p.regionId);

  let weightedSum = 0;
  let totalCityCount = 0;

  for (const props of regionGroups.values()) {
    const regionValue = sumBy(props, (p) => baseValues.get(p.propertyId)!);
    const cityGroups = groupBy(props, (p) => p.cityId);
    const cityCount = cityGroups.size;
    totalCityCount += cityCount;

    let regionScore: number;
    if (cityCount >= 3) regionScore = 80;
    else if (cityCount === 2) regionScore = 55;
    else regionScore = 25;

    const cityFractions = [...cityGroups.values()].map(
      (cityProps) => sumBy(cityProps, (p) => baseValues.get(p.propertyId)!) / regionValue
    );
    const cityHerfindahl = cityFractions.reduce((s, f) => s + f * f, 0);
    // Note: the spec's pseudocode wraps this in max(0, ...), which would zero out
    // every concentration penalty (since (h - 0.33) * -25 is negative whenever h > 0.33,
    // the intended "penalty" case). That contradicts the spec's own worked example
    // ("2 cities 60/40 -> -5"), so the adjustment below omits that erroneous floor.
    regionScore += (cityHerfindahl - 0.33) * -25;

    const largestCity = Math.max(...cityFractions);
    if (largestCity <= 0.5) regionScore += 10;
    else if (largestCity <= 0.7) regionScore += 0;
    else regionScore -= 10;

    weightedSum += regionScore * (regionValue / totalValue);
  }

  return {
    score: clamp(weightedSum),
    weight: 20,
    rationale: `${totalCityCount} total city grouping(s) across ${regionGroups.size} region(s).`,
  };
}

/** Factor 3: Property Type Distribution (15%) */
function scorePropertyTypeDistribution(ctx: ScoringContext): DiversificationFactorBreakdown {
  const { properties, baseValues, totalValue } = ctx;
  const byType = groupBy(properties, (p) => p.propertyType);
  const fractions = [...byType.values()].map(
    (props) => sumBy(props, (p) => baseValues.get(p.propertyId)!) / totalValue
  );
  const mostWeighted = fractions.length > 0 ? Math.max(...fractions) : 0;
  const typesPresent = byType.size;

  let base: number;
  if (mostWeighted < 0.7) base = 85;
  else if (mostWeighted <= 0.8) base = 70;
  else if (mostWeighted <= 0.9) base = 50;
  else base = 20;

  let bonus = 0;
  if (typesPresent >= 3) bonus = 10;
  else if (typesPresent === 2) bonus = 5;

  return {
    score: clamp(base + bonus),
    weight: 15,
    rationale: `${typesPresent} property type(s) present; largest category ${(mostWeighted * 100).toFixed(0)}%.`,
  };
}

/** Factor 4: Asset Value Balance (15%) */
function scoreAssetValueBalance(ctx: ScoringContext): DiversificationFactorBreakdown {
  const { properties, baseValues, totalValue } = ctx;
  const values = properties.map((p) => baseValues.get(p.propertyId)!);
  const largestValue = values.length > 0 ? Math.max(...values) : 0;
  const largestFraction = percentOf(largestValue, totalValue) / 100;

  let base: number;
  if (largestFraction <= 0.15) base = 90;
  else if (largestFraction <= 0.25) base = 80;
  else if (largestFraction <= 0.35) base = 65;
  else if (largestFraction <= 0.4) base = 50;
  else if (largestFraction <= 0.5) base = 30;
  else base = 10;

  const gini = computeGini(values);
  let adjustment: number;
  if (gini < 0.3) adjustment = 8;
  else if (gini < 0.5) adjustment = 4;
  else if (gini < 0.7) adjustment = 0;
  else adjustment = -8;

  return {
    score: clamp(base + adjustment),
    weight: 15,
    rationale: `Largest property ${(largestFraction * 100).toFixed(0)}% of portfolio; Gini ${gini.toFixed(2)}.`,
  };
}

/** Factor 5: Income Source Diversity (15%) */
function scoreIncomeSourceDiversity(ctx: ScoringContext): DiversificationFactorBreakdown {
  const { properties, baseIncomes, totalIncome } = ctx;
  const incomes = properties.map((p) => baseIncomes.get(p.propertyId)!);
  const largestIncome = incomes.length > 0 ? Math.max(...incomes) : 0;
  const largestFraction = percentOf(largestIncome, totalIncome) / 100;

  let base: number;
  if (largestFraction <= 0.15) base = 90;
  else if (largestFraction <= 0.25) base = 80;
  else if (largestFraction <= 0.35) base = 65;
  else if (largestFraction <= 0.5) base = 45;
  else base = 15;

  const hasNullIncome = properties.some((p) => p.annualGrossIncome === null);
  if (hasNullIncome) base -= 10;

  const incomeProducingCount = properties.filter(
    (p) => p.annualGrossIncome !== null && p.annualGrossIncome > 0
  ).length;
  const incomeProducingFraction = properties.length > 0 ? incomeProducingCount / properties.length : 0;
  if (incomeProducingFraction >= 0.75) base += 10;
  else if (incomeProducingFraction >= 0.5) base += 5;
  else base -= 5;

  return {
    score: clamp(base),
    weight: 15,
    rationale: `Largest income source ${(largestFraction * 100).toFixed(0)}% of total; ${incomeProducingCount}/${properties.length} properties income-producing.`,
  };
}

/** Factor 6: Cross-Border Risk Balance (10%) */
function scoreCrossBorderRiskBalance(
  cadPercent: number,
  usdPercent: number
): DiversificationFactorBreakdown {
  let base: number;
  if (usdPercent === 0 || cadPercent === 0) {
    base = cadPercent > 0 ? 70 : 65;
  } else {
    const skew = Math.abs(cadPercent - usdPercent);
    if (skew <= 20) base = 90;
    else if (skew <= 35) base = 75;
    else if (skew <= 50) base = 55;
    else base = 25;
  }

  return {
    score: clamp(base),
    weight: 10,
    rationale: `${cadPercent.toFixed(0)}% CAD, ${usdPercent.toFixed(0)}% USD.`,
  };
}

function deriveGrade(score: number): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; recommendation: string } {
  if (score >= 80) return { grade: 'A', recommendation: 'Well Diversified' };
  if (score >= 65) return { grade: 'B', recommendation: 'Moderately Diversified' };
  if (score >= 50) return { grade: 'C', recommendation: 'Concentrated' };
  if (score >= 35) return { grade: 'D', recommendation: 'Highly Concentrated' };
  return { grade: 'F', recommendation: 'Severe Concentration Risk' };
}

function deriveRiskLevel(score: number, flagCount: number): 'low' | 'moderate' | 'high' {
  if (score >= 75 && flagCount <= 1) return 'low';
  if (score >= 65 && flagCount <= 2) return 'moderate';
  return 'high';
}

function emptyPortfolioOutput(): PortfolioDiversificationOutput {
  const neutralFactor = (weight: number, rationale: string): DiversificationFactorBreakdown => ({
    score: 50,
    weight,
    rationale,
  });

  return {
    diversificationScore: 50,
    factors: {
      regionalSpread: neutralFactor(25, 'No properties in portfolio.'),
      citySpread: neutralFactor(20, 'No properties in portfolio.'),
      propertyTypeDistribution: neutralFactor(15, 'No properties in portfolio.'),
      assetValueBalance: neutralFactor(15, 'No properties in portfolio.'),
      incomeSourceDiversity: neutralFactor(15, 'No properties in portfolio.'),
      crossBorderRiskBalance: neutralFactor(10, 'No properties in portfolio.'),
    },
    regionalExposure: [],
    cityExposure: [],
    propertyTypeBreakdown: {
      residential: { count: 0, value: 0, percent: 0 },
      commercial: { count: 0, value: 0, percent: 0 },
      development: { count: 0, value: 0, percent: 0 },
    },
    concentrationRisks: {
      singlePropertyOverexposed: false,
      largestPropertyPercent: 0,
      largestPropertyId: '',
      regionOverexposed: false,
      largestRegionPercent: 0,
      largestRegionId: '',
      cityOverexposed: false,
      largestCityPercent: 0,
      largestCityId: '',
      crossBorderUnbalanced: false,
      cadPercent: 0,
      usdPercent: 0,
      incomeConcentration: false,
      largestIncomeSourcePercent: 0,
    },
    grade: 'C',
    recommendation: 'Add properties to portfolio',
    riskLevel: 'high',
    totalPortfolioValue: 0,
    totalEquityValue: 0,
    totalGrossIncome: 0,
    propertyCount: 0,
    disclaimer: DISCLAIMER,
  };
}

/**
 * Compute a portfolio-wide geographic diversification score (1-100) from a
 * list of properties. Never throws — an empty portfolio and a single-property
 * portfolio are both valid (if maximally undiversified) inputs.
 */
export function portfolioGeographicDiversification(
  input: PortfolioDiversificationInput
): PortfolioDiversificationOutput {
  const { properties, portfolioBaseCurrency } = input;

  if (properties.length === 0) {
    return emptyPortfolioOutput();
  }

  const fxRate = input.fxRate > 0 && Number.isFinite(input.fxRate) ? input.fxRate : DEFAULT_FX_RATE;

  const baseValues = new Map<string, number>();
  const baseIncomes = new Map<string, number>();
  const baseEquities = new Map<string, number>();
  for (const p of properties) {
    baseValues.set(p.propertyId, toBaseCurrency(p.currentMarketValue, p.currency, portfolioBaseCurrency, fxRate));
    baseIncomes.set(p.propertyId, toBaseCurrency(p.annualGrossIncome ?? 0, p.currency, portfolioBaseCurrency, fxRate));
    baseEquities.set(p.propertyId, toBaseCurrency(p.equityValue, p.currency, portfolioBaseCurrency, fxRate));
  }

  const totalValue = sumBy(properties, (p) => baseValues.get(p.propertyId)!);
  const totalIncome = sumBy(properties, (p) => baseIncomes.get(p.propertyId)!);
  const totalEquity = sumBy(properties, (p) => baseEquities.get(p.propertyId)!);

  const ctx: ScoringContext = { properties, baseValues, baseIncomes, totalValue, totalIncome };

  // ----- Regional exposure -----
  const regionGroups = groupBy(properties, (p) => p.regionId);
  const regionalExposure: GeographicDistribution[] = [...regionGroups.entries()]
    .map(([regionId, props]) => {
      const regionValue = sumBy(props, (p) => baseValues.get(p.propertyId)!);
      const regionIncome = sumBy(props, (p) => baseIncomes.get(p.propertyId)!);
      const regionEquity = sumBy(props, (p) => baseEquities.get(p.propertyId)!);
      const percentOfPortfolio = percentOf(regionValue, totalValue);
      return {
        regionId,
        regionName: humanize(regionId),
        propertyCount: props.length,
        totalValue: regionValue,
        percentOfPortfolio: Math.round(percentOfPortfolio),
        incomeContribution: regionIncome,
        percentOfIncome: Math.round(percentOf(regionIncome, totalIncome)),
        percentOfEquity: Math.round(percentOf(regionEquity, totalEquity)),
        concentrationScore: Math.round(percentOfPortfolio),
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue);

  // ----- City exposure -----
  const cityGroups = groupBy(properties, (p) => `${p.regionId}::${p.cityId}`);
  const cityExposure: CityExposure[] = [...cityGroups.entries()]
    .map(([, props]) => {
      const cityId = props[0].cityId;
      const regionId = props[0].regionId;
      const cityValue = sumBy(props, (p) => baseValues.get(p.propertyId)!);
      const regionValue = sumBy(
        properties.filter((p) => p.regionId === regionId),
        (p) => baseValues.get(p.propertyId)!
      );
      return {
        cityId,
        cityName: humanize(cityId),
        regionId,
        propertyCount: props.length,
        totalValue: cityValue,
        percentOfPortfolio: Math.round(percentOf(cityValue, totalValue)),
        concentrationScore: Math.round(percentOf(cityValue, regionValue)),
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue);

  // ----- Property type breakdown -----
  const typeGroups = groupBy(properties, (p) => p.propertyType);
  const typeBreakdown = (type: Property['propertyType']) => {
    const props = typeGroups.get(type) ?? [];
    const value = sumBy(props, (p) => baseValues.get(p.propertyId)!);
    return { count: props.length, value, percent: Math.round(percentOf(value, totalValue)) };
  };

  // ----- Concentration risk flags -----
  const largestProperty = properties.reduce((max, p) =>
    baseValues.get(p.propertyId)! > baseValues.get(max.propertyId)! ? p : max
  );
  const largestPropertyPercent = percentOf(baseValues.get(largestProperty.propertyId)!, totalValue);

  const largestRegion = regionalExposure[0];
  const largestCity = cityExposure.reduce(
    (max, c) => (c.percentOfPortfolio > max.percentOfPortfolio ? c : max),
    cityExposure[0]
  );

  const cadValue = sumBy(
    properties.filter((p) => p.currency === 'CAD'),
    (p) => baseValues.get(p.propertyId)!
  );
  const usdValue = sumBy(
    properties.filter((p) => p.currency === 'USD'),
    (p) => baseValues.get(p.propertyId)!
  );
  const cadPercent = percentOf(cadValue, totalValue);
  const usdPercent = percentOf(usdValue, totalValue);
  const crossBorderSkew = Math.abs(cadPercent - usdPercent);

  const incomes = properties.map((p) => ({
    id: p.propertyId,
    income: baseIncomes.get(p.propertyId)!,
  }));
  const largestIncomeEntry = incomes.reduce((max, e) => (e.income > max.income ? e : max), incomes[0]);
  const largestIncomeSourcePercent = percentOf(largestIncomeEntry.income, totalIncome);

  const concentrationRisks = {
    singlePropertyOverexposed: largestPropertyPercent > 40,
    largestPropertyPercent: Math.round(largestPropertyPercent),
    largestPropertyId: largestProperty.propertyId,
    regionOverexposed: largestRegion.percentOfPortfolio > 60,
    largestRegionPercent: largestRegion.percentOfPortfolio,
    largestRegionId: largestRegion.regionId,
    cityOverexposed: largestCity.percentOfPortfolio > 50,
    largestCityPercent: largestCity.percentOfPortfolio,
    largestCityId: largestCity.cityId,
    crossBorderUnbalanced: cadPercent > 0 && usdPercent > 0 && crossBorderSkew > 50,
    cadPercent: Math.round(cadPercent),
    usdPercent: Math.round(usdPercent),
    incomeConcentration: largestIncomeSourcePercent > 30,
    largestIncomeSourcePercent: Math.round(largestIncomeSourcePercent),
  };

  // ----- Factors -----
  const factors = {
    regionalSpread: scoreRegionalSpread(ctx),
    citySpread: scoreCitySpread(ctx),
    propertyTypeDistribution: scorePropertyTypeDistribution(ctx),
    assetValueBalance: scoreAssetValueBalance(ctx),
    incomeSourceDiversity: scoreIncomeSourceDiversity(ctx),
    crossBorderRiskBalance: scoreCrossBorderRiskBalance(cadPercent, usdPercent),
  };

  const weightedSum =
    factors.regionalSpread.score * (factors.regionalSpread.weight / 100) +
    factors.citySpread.score * (factors.citySpread.weight / 100) +
    factors.propertyTypeDistribution.score * (factors.propertyTypeDistribution.weight / 100) +
    factors.assetValueBalance.score * (factors.assetValueBalance.weight / 100) +
    factors.incomeSourceDiversity.score * (factors.incomeSourceDiversity.weight / 100) +
    factors.crossBorderRiskBalance.score * (factors.crossBorderRiskBalance.weight / 100);

  // A single property represents zero diversification by definition, regardless
  // of how the individual factor formulas resolve at n=1.
  const diversificationScore = properties.length === 1 ? 15 : Math.round(clamp(weightedSum));

  const { grade, recommendation } = deriveGrade(diversificationScore);
  const flagCount = [
    concentrationRisks.singlePropertyOverexposed,
    concentrationRisks.regionOverexposed,
    concentrationRisks.cityOverexposed,
    concentrationRisks.crossBorderUnbalanced,
    concentrationRisks.incomeConcentration,
  ].filter(Boolean).length;
  const riskLevel = deriveRiskLevel(diversificationScore, flagCount);

  return {
    diversificationScore,
    factors,
    regionalExposure,
    cityExposure,
    propertyTypeBreakdown: {
      residential: typeBreakdown('residential'),
      commercial: typeBreakdown('commercial'),
      development: typeBreakdown('development'),
    },
    concentrationRisks,
    grade,
    recommendation,
    riskLevel,
    totalPortfolioValue: totalValue,
    totalEquityValue: totalEquity,
    totalGrossIncome: totalIncome,
    propertyCount: properties.length,
    disclaimer: DISCLAIMER,
  };
}

export default portfolioGeographicDiversification;
