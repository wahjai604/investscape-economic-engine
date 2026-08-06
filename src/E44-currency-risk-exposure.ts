/**
 * E44: Currency Risk Exposure Engine
 *
 * Measures portfolio USD/CAD sensitivity, hedging impact, and cross-border
 * risk across 4 weighted factors:
 * - Exposure Concentration (30%)
 * - Income Exposure (25%)
 * - Volatility Impact (25%)
 * - Hedging Coverage (20%)
 *
 * Despite the field name, `currencyRiskScore` follows the same polarity as
 * every worked example in the spec and as the grade table itself: HIGHER
 * score = LOWER risk (score >= 80 -> grade A -> "Low Risk"). A single inline
 * comment in the spec claims the opposite ("inverted from E42/E43"), but that
 * comment contradicts every one of the spec's own worked examples and its
 * grade mapping, so it's treated as a documentation error and this engine
 * uses the same "higher = better" polarity as E42/E43 throughout.
 *
 * Like E42/E43, this is a pure computation engine (no mock data store).
 */

export interface CurrencyProperty {
  propertyId: string;
  currentMarketValue: number;
  annualGrossIncome: number | null;
  mortgageBalance: number | null;
  currency: 'CAD' | 'USD';
  country: 'CA' | 'US';
}

export interface FXScenarioInput {
  baseRate: number;
  rateChange: number;
  volatility: number | null;
}

export interface Hedge {
  hedgeId: string;
  hedgeType: 'forward' | 'option' | 'loan' | 'other';
  coveredAmount: number;
  effectiveRate: number;
  expiryYears: number;
  costPercent: number;
}

export interface CurrencyRiskExposureInput {
  properties: CurrencyProperty[];
  portfolioBaseCurrency: 'CAD' | 'USD';
  fxScenarios: FXScenarioInput;
  hedges: Hedge[];
}

export interface CurrencyFactorBreakdown {
  score: number;
  weight: number;
  rationale: string;
}

export interface FXExposure {
  currency: 'CAD' | 'USD';
  value: number;
  income: number | null;
  percentOfPortfolio: number;
  percentOfIncome: number;
}

export interface CurrencyRateSensitivity {
  scenario: string;
  rateAssumed: number;
  portfolioValueChange: number;
  percentChange: number;
  incomeValueChange: number;
}

export interface HedgeImpact {
  hedgeId: string;
  hedgeType: string;
  coveredAmount: number;
  effectiveRate: number;
  expiryYears: number;
  protectedValue: number;
  costAnnual: number;
  breakEvenRate: number;
  recommendation: string;
}

export interface CurrencyRiskExposureOutput {
  currencyRiskScore: number;
  factors: {
    exposureConcentration: CurrencyFactorBreakdown;
    incomeExposure: CurrencyFactorBreakdown;
    volatilityImpact: CurrencyFactorBreakdown;
    hedgingCoverage: CurrencyFactorBreakdown;
  };
  exposures: FXExposure[];
  sensitivityAnalysis: CurrencyRateSensitivity[];
  hedges: HedgeImpact[];
  totalHedgedAmount: number;
  totalHedgeCost: number;
  hedgingEffectiveness: number;
  riskFlags: {
    heavilySkewd: boolean;
    skewPercent: number;
    dominantCurrency: 'CAD' | 'USD';
    incomeExposureMismatch: boolean;
    incomeInDominant: number;
    highVolatility: boolean;
    volatilityPercent: number;
    largeUnhedgedExposure: boolean;
    unhedgedExposurePercent: number;
    hedgesExpiring: boolean;
    hedgesExpiringCount: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  totalPortfolioValue: number;
  cadValue: number;
  usdValue: number;
  cadEquivalent: number;
  totalValue: number;
  disclaimer: string;
}

const DISCLAIMER =
  'InvestScape provides informational analysis only and does not constitute financial, ' +
  'investment, or professional advice. Currency risk analysis is based on historical FX ' +
  'volatility and assumed exchange rates; actual FX movements and hedging effectiveness ' +
  'depend on market conditions and global events. Hedging strategies involve costs and ' +
  'counterparty risks. Consult qualified financial advisors or currency specialists ' +
  'before implementing hedging strategies or making cross-border investment decisions.';

const DEFAULT_FX_RATE = 1.25;
const DEFAULT_VOLATILITY = 5;
const STRESS_SCENARIOS = [5, -5, 10, -10];

function clamp(value: number): number {
  return Math.min(100, Math.max(1, value));
}

function toBase(value: number, currency: 'CAD' | 'USD', base: 'CAD' | 'USD', rate: number): number {
  if (currency === base) return value;
  return currency === 'USD' ? value * rate : value / rate;
}

interface CurrencyTotals {
  cadValue: number; // native CAD sum
  usdValue: number; // native USD sum
  cadIncome: number; // native CAD sum
  usdIncome: number; // native USD sum
  totalValueBase: number;
  totalIncomeBase: number;
  cadPercent: number; // 0-100, of totalValueBase
  usdPercent: number; // 0-100, of totalValueBase
  cadIncomePercent: number; // 0-100, of totalIncomeBase
  usdIncomePercent: number; // 0-100, of totalIncomeBase
}

function computeTotals(
  properties: CurrencyProperty[],
  base: 'CAD' | 'USD',
  fxRate: number
): CurrencyTotals {
  let cadValue = 0;
  let usdValue = 0;
  let cadIncome = 0;
  let usdIncome = 0;

  for (const p of properties) {
    const income = p.annualGrossIncome ?? 0;
    if (p.currency === 'CAD') {
      cadValue += p.currentMarketValue;
      cadIncome += income;
    } else {
      usdValue += p.currentMarketValue;
      usdIncome += income;
    }
  }

  const totalValueBase = toBase(cadValue, 'CAD', base, fxRate) + toBase(usdValue, 'USD', base, fxRate);
  const totalIncomeBase = toBase(cadIncome, 'CAD', base, fxRate) + toBase(usdIncome, 'USD', base, fxRate);

  const cadValueBase = toBase(cadValue, 'CAD', base, fxRate);
  const usdValueBase = toBase(usdValue, 'USD', base, fxRate);
  const cadIncomeBase = toBase(cadIncome, 'CAD', base, fxRate);
  const usdIncomeBase = toBase(usdIncome, 'USD', base, fxRate);

  return {
    cadValue,
    usdValue,
    cadIncome,
    usdIncome,
    totalValueBase,
    totalIncomeBase,
    cadPercent: totalValueBase > 0 ? (cadValueBase / totalValueBase) * 100 : 0,
    usdPercent: totalValueBase > 0 ? (usdValueBase / totalValueBase) * 100 : 0,
    cadIncomePercent: totalIncomeBase > 0 ? (cadIncomeBase / totalIncomeBase) * 100 : 0,
    usdIncomePercent: totalIncomeBase > 0 ? (usdIncomeBase / totalIncomeBase) * 100 : 0,
  };
}

/** Factor 1: Exposure Concentration (30%) */
function scoreExposureConcentration(totals: CurrencyTotals): CurrencyFactorBreakdown {
  const { cadPercent, usdPercent } = totals;
  const cadFraction = cadPercent / 100;
  const usdFraction = usdPercent / 100;
  const herfindahl = cadFraction * cadFraction + usdFraction * usdFraction;

  let base: number;
  if (herfindahl <= 0.5) base = 95;
  else if (herfindahl <= 0.55) base = 85;
  else if (herfindahl <= 0.65) base = 70;
  else if (herfindahl <= 0.8) base = 50;
  else base = 20;

  const skew = Math.abs(cadPercent - usdPercent);
  let adjustment: number;
  if (skew <= 20) adjustment = 15;
  else if (skew <= 35) adjustment = 5;
  else if (skew <= 50) adjustment = 0;
  else if (skew <= 70) adjustment = -10;
  else adjustment = -20;

  let singleCurrencyPenalty = 0;
  if (cadPercent === 0 || usdPercent === 0) singleCurrencyPenalty = -15;

  return {
    score: clamp(base + adjustment + singleCurrencyPenalty),
    weight: 30,
    rationale: `Portfolio ${cadPercent.toFixed(0)}% CAD / ${usdPercent.toFixed(0)}% USD; skew ${skew.toFixed(0)}%.`,
  };
}

/** Factor 2: Income Exposure (25%) */
function scoreIncomeExposure(totals: CurrencyTotals): CurrencyFactorBreakdown {
  const { cadPercent, usdPercent, cadIncomePercent, usdIncomePercent, cadIncome, usdIncome, totalIncomeBase, totalValueBase } =
    totals;

  if (totalIncomeBase === 0) {
    return { score: 50, weight: 25, rationale: 'No income-producing properties; neutral score applied.' };
  }

  const dominantIsCad = cadPercent >= usdPercent;
  const assetInDominant = dominantIsCad ? cadPercent : usdPercent;
  const incomeInDominant = dominantIsCad ? cadIncomePercent : usdIncomePercent;
  const mismatch = Math.abs(assetInDominant - incomeInDominant);

  let base: number;
  if (mismatch <= 10) base = 90;
  else if (mismatch <= 20) base = 75;
  else if (mismatch <= 35) base = 60;
  else if (mismatch <= 50) base = 40;
  else base = 15;

  if (cadIncome > 0 && usdIncome > 0) base += 10;
  else base -= 5;

  const incomePercentOfValue = totalValueBase > 0 ? (totalIncomeBase / totalValueBase) * 100 : 0;
  if (incomePercentOfValue >= 4) base += 8;
  else if (incomePercentOfValue >= 2) base += 3;
  else if (incomePercentOfValue >= 1) base += 0;
  else base -= 5;

  return {
    score: clamp(base),
    weight: 25,
    rationale: `Income ${cadIncomePercent.toFixed(0)}% CAD / ${usdIncomePercent.toFixed(0)}% USD; ${incomePercentOfValue.toFixed(1)}% of portfolio value.`,
  };
}

/** Factor 3: Volatility Impact (25%) */
function scoreVolatilityImpact(
  totals: CurrencyTotals,
  volatility: number,
  scenarios: CurrencyRateSensitivity[]
): CurrencyFactorBreakdown {
  let base: number;
  if (volatility <= 3) base = 95;
  else if (volatility <= 5) base = 85;
  else if (volatility <= 8) base = 70;
  else if (volatility <= 12) base = 50;
  else base = 20;

  const worstCaseChange = Math.min(...scenarios.map((s) => s.portfolioValueChange));
  const worstCasePercent =
    totals.totalValueBase > 0 ? (worstCaseChange / totals.totalValueBase) * 100 : 0;
  const absWorstCase = Math.abs(worstCasePercent);

  if (absWorstCase <= 5) {
    // no penalty
  } else if (absWorstCase <= 10) {
    base -= 5;
  } else if (absWorstCase <= 15) {
    base -= 10;
  } else {
    base -= 15;
  }

  const { cadPercent, usdPercent } = totals;
  if (cadPercent > 10 && usdPercent > 10) {
    const exposureMultiplier = Math.min(cadPercent, usdPercent) / 50;
    const volatilityRisk = volatility * exposureMultiplier;
    if (volatilityRisk > 3) base -= 8;
  } else {
    base += 5;
  }

  return {
    score: clamp(base),
    weight: 25,
    rationale: `FX volatility ${volatility.toFixed(1)}%; worst-case stress scenario ${worstCasePercent.toFixed(1)}% of portfolio.`,
  };
}

/** Factor 4: Hedging Coverage (20%) */
function scoreHedgingCoverage(
  totals: CurrencyTotals,
  hedges: Hedge[]
): CurrencyFactorBreakdown {
  const { usdValue, usdPercent } = totals;
  const totalHedgedUsd = hedges.reduce((sum, h) => sum + h.coveredAmount, 0);

  let base: number;
  if (hedges.length === 0) {
    if (usdPercent <= 20) base = 85;
    else if (usdPercent <= 40) base = 60;
    else base = 30;
  } else {
    const hedgeCoveragePercent = usdValue > 0 ? (totalHedgedUsd / usdValue) * 100 : 0;
    if (hedgeCoveragePercent >= 75) base = 95;
    else if (hedgeCoveragePercent >= 50) base = 80;
    else if (hedgeCoveragePercent >= 25) base = 60;
    else base = 40;

    for (const hedge of hedges) {
      if (hedge.costPercent < 1 && hedge.expiryYears >= 2) base += 5;
      else if (hedge.costPercent >= 2 || hedge.expiryYears < 1) base -= 5;
    }

    const expiringCount = hedges.filter((h) => h.expiryYears < 1).length;
    if (expiringCount > 0) base -= 10;
  }

  return {
    score: clamp(base),
    weight: 20,
    rationale:
      hedges.length === 0
        ? `No hedges in place; USD exposure ${usdPercent.toFixed(0)}% of portfolio.`
        : `${hedges.length} hedge(s) covering $${totalHedgedUsd.toLocaleString()} USD.`,
  };
}

function deriveGrade(score: number): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; recommendation: string; riskLevel: 'low' | 'moderate' | 'high' | 'critical' } {
  if (score >= 80) return { grade: 'A', recommendation: 'Low Risk', riskLevel: 'low' };
  if (score >= 65) return { grade: 'B', recommendation: 'Moderate Risk', riskLevel: 'moderate' };
  if (score >= 50) return { grade: 'C', recommendation: 'Moderate-High Risk', riskLevel: 'moderate' };
  if (score >= 35) return { grade: 'D', recommendation: 'High Risk', riskLevel: 'high' };
  return { grade: 'F', recommendation: 'Critical Risk', riskLevel: 'critical' };
}

function emptyPortfolioOutput(): CurrencyRiskExposureOutput {
  const neutral = (weight: number): CurrencyFactorBreakdown => ({
    score: 50,
    weight,
    rationale: 'No properties in portfolio.',
  });

  return {
    currencyRiskScore: 50,
    factors: {
      exposureConcentration: neutral(30),
      incomeExposure: neutral(25),
      volatilityImpact: neutral(25),
      hedgingCoverage: neutral(20),
    },
    exposures: [],
    sensitivityAnalysis: [],
    hedges: [],
    totalHedgedAmount: 0,
    totalHedgeCost: 0,
    hedgingEffectiveness: 0,
    riskFlags: {
      heavilySkewd: false,
      skewPercent: 0,
      dominantCurrency: 'CAD',
      incomeExposureMismatch: false,
      incomeInDominant: 0,
      highVolatility: false,
      volatilityPercent: 0,
      largeUnhedgedExposure: false,
      unhedgedExposurePercent: 0,
      hedgesExpiring: false,
      hedgesExpiringCount: 0,
    },
    grade: 'C',
    recommendation: 'Moderate-High Risk',
    riskLevel: 'moderate',
    totalPortfolioValue: 0,
    cadValue: 0,
    usdValue: 0,
    cadEquivalent: 0,
    totalValue: 0,
    disclaimer: DISCLAIMER,
  };
}

/**
 * Compute a portfolio-wide currency risk exposure score (1-100, higher =
 * lower risk) from a list of properties, an FX scenario, and any hedges.
 * Never throws — an empty portfolio and a single-currency portfolio are both
 * valid inputs.
 */
export function currencyRiskExposure(input: CurrencyRiskExposureInput): CurrencyRiskExposureOutput {
  const { properties, portfolioBaseCurrency: base, hedges } = input;

  if (properties.length === 0) {
    return emptyPortfolioOutput();
  }

  const fxRate =
    input.fxScenarios.baseRate > 0 && Number.isFinite(input.fxScenarios.baseRate)
      ? input.fxScenarios.baseRate
      : DEFAULT_FX_RATE;
  const rawVolatility = input.fxScenarios.volatility ?? DEFAULT_VOLATILITY;
  const volatility = Math.min(30, Math.max(0, rawVolatility));

  const totals = computeTotals(properties, base, fxRate);
  const { cadValue, usdValue, cadIncome, usdIncome, totalValueBase, totalIncomeBase, cadPercent, usdPercent } = totals;

  // ----- Sensitivity analysis -----
  const buildScenario = (label: string, rateChangePercent: number): CurrencyRateSensitivity => {
    const newRate = fxRate * (1 + rateChangePercent / 100);
    const newTotalValue = toBase(cadValue, 'CAD', base, newRate) + toBase(usdValue, 'USD', base, newRate);
    const newTotalIncome = toBase(cadIncome, 'CAD', base, newRate) + toBase(usdIncome, 'USD', base, newRate);
    return {
      scenario: label,
      rateAssumed: newRate,
      portfolioValueChange: newTotalValue - totalValueBase,
      percentChange: totalValueBase > 0 ? ((newTotalValue - totalValueBase) / totalValueBase) * 100 : 0,
      incomeValueChange: newTotalIncome - totalIncomeBase,
    };
  };

  const sensitivityAnalysis: CurrencyRateSensitivity[] = [
    buildScenario(`Base Case (USD/CAD ${fxRate})`, 0),
    ...STRESS_SCENARIOS.map((pct) => buildScenario(`USD ${pct >= 0 ? '+' : ''}${pct}%`, pct)),
  ];
  const stressScenarios = sensitivityAnalysis.slice(1);

  // ----- Factors -----
  const factors = {
    exposureConcentration: scoreExposureConcentration(totals),
    incomeExposure: scoreIncomeExposure(totals),
    volatilityImpact: scoreVolatilityImpact(totals, volatility, stressScenarios),
    hedgingCoverage: scoreHedgingCoverage(totals, hedges),
  };

  const weightedSum =
    factors.exposureConcentration.score * (factors.exposureConcentration.weight / 100) +
    factors.incomeExposure.score * (factors.incomeExposure.weight / 100) +
    factors.volatilityImpact.score * (factors.volatilityImpact.weight / 100) +
    factors.hedgingCoverage.score * (factors.hedgingCoverage.weight / 100);

  const currencyRiskScore = Math.round(clamp(weightedSum));
  const { grade, recommendation, riskLevel } = deriveGrade(currencyRiskScore);

  // ----- Exposures -----
  const cadValueBase = toBase(cadValue, 'CAD', base, fxRate);
  const usdValueBase = toBase(usdValue, 'USD', base, fxRate);
  const cadIncomeBase = toBase(cadIncome, 'CAD', base, fxRate);
  const usdIncomeBase = toBase(usdIncome, 'USD', base, fxRate);
  const exposures: FXExposure[] = [
    {
      currency: 'CAD',
      value: cadValueBase,
      income: cadIncomeBase,
      percentOfPortfolio: Math.round(cadPercent),
      percentOfIncome: Math.round(totals.cadIncomePercent),
    },
    {
      currency: 'USD',
      value: usdValueBase,
      income: usdIncomeBase,
      percentOfPortfolio: Math.round(usdPercent),
      percentOfIncome: Math.round(totals.usdIncomePercent),
    },
  ];

  // ----- Hedges -----
  const totalHedgedAmount = hedges.reduce((sum, h) => sum + h.coveredAmount, 0);
  const totalHedgeCost = hedges.reduce((sum, h) => sum + h.coveredAmount * (h.costPercent / 100), 0);
  const hedgeCoveragePercent = usdValue > 0 ? (totalHedgedAmount / usdValue) * 100 : 0;
  const netUnhedgedUsd = usdValueBase - toBase(totalHedgedAmount, 'USD', base, fxRate);
  const unhedgedExposurePercent = totalValueBase > 0 ? (netUnhedgedUsd / totalValueBase) * 100 : 0;

  const hedgeImpacts: HedgeImpact[] = hedges.map((h) => {
    let hedgeRecommendation: string;
    if (h.expiryYears < 1) hedgeRecommendation = 'Renew expiring hedges';
    else if (hedgeCoveragePercent < 50 && unhedgedExposurePercent > 25) hedgeRecommendation = 'Expand hedges';
    else if (hedgeCoveragePercent > 80 && h.costPercent >= 1.5) hedgeRecommendation = 'Consider unwinding';
    else hedgeRecommendation = 'Maintain current';

    return {
      hedgeId: h.hedgeId,
      hedgeType: h.hedgeType,
      coveredAmount: h.coveredAmount,
      effectiveRate: h.effectiveRate,
      expiryYears: h.expiryYears,
      protectedValue: h.coveredAmount * h.effectiveRate,
      costAnnual: h.coveredAmount * (h.costPercent / 100),
      breakEvenRate: h.effectiveRate * (1 - h.costPercent / 100),
      recommendation: hedgeRecommendation,
    };
  });

  const hedgingEffectiveness = usdValueBase > 0 ? Math.round((toBase(totalHedgedAmount, 'USD', base, fxRate) / usdValueBase) * 100) : 0;

  // ----- Risk flags -----
  const dominantIsCad = cadPercent >= usdPercent;
  const dominantPercent = dominantIsCad ? cadPercent : usdPercent;
  const incomeInDominant = totalIncomeBase > 0 ? (dominantIsCad ? totals.cadIncomePercent : totals.usdIncomePercent) : 0;
  const incomeMismatch = totalIncomeBase > 0 ? Math.abs(dominantPercent - incomeInDominant) : 0;
  const expiringHedges = hedges.filter((h) => h.expiryYears < 1);

  const riskFlags = {
    heavilySkewd: dominantPercent > 70,
    skewPercent: Math.round(dominantPercent),
    dominantCurrency: (dominantIsCad ? 'CAD' : 'USD') as 'CAD' | 'USD',
    incomeExposureMismatch: incomeMismatch > 20,
    incomeInDominant: Math.round(incomeInDominant),
    highVolatility: volatility > 8,
    volatilityPercent: volatility,
    largeUnhedgedExposure: unhedgedExposurePercent > 25,
    unhedgedExposurePercent: Math.round(unhedgedExposurePercent),
    hedgesExpiring: expiringHedges.length > 0,
    hedgesExpiringCount: expiringHedges.length,
  };

  return {
    currencyRiskScore,
    factors,
    exposures,
    sensitivityAnalysis,
    hedges: hedgeImpacts,
    totalHedgedAmount,
    totalHedgeCost,
    hedgingEffectiveness,
    riskFlags,
    grade,
    recommendation,
    riskLevel,
    totalPortfolioValue: totalValueBase,
    cadValue,
    usdValue,
    cadEquivalent: usdValueBase,
    totalValue: totalValueBase,
    disclaimer: DISCLAIMER,
  };
}

export default currencyRiskExposure;
