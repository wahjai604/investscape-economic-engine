/**
 * InvestScape™ Calculation Engine
 * © 2026 Lighthouse Research Ltd. All rights reserved.
 *
 * InvestScape™ is a registered trademark of Lighthouse Research Ltd.
 * This software is proprietary and confidential.
 *
 * LICENSING:
 * - Personal/Educational Use: Permitted (see LICENSE)
 * - Commercial Use: Requires written Commercial License Agreement
 * Contact: wahjai604@gmail.com
 *
 * DISCLAIMER:
 * This software is provided "as-is" for informational purposes only.
 * Not investment advice, tax advice, or financial advice.
 * Use at your own risk.
 */

/**
 * E45: Scenario Batch Processor Engine (Capstone)
 *
 * Runs a portfolio of properties through multiple market scenarios (rate
 * shifts, appreciation deltas, vacancy stress, FX moves) and reports
 * per-scenario portfolio-level cash flow, IRR, and equity outcomes, plus a
 * scenario ranking and a sensitivity ranking of which variable moves IRR
 * the most.
 *
 * IMPORTANT IMPLEMENTATION NOTE: the original spec for this engine assumes
 * it can call a pre-existing "E1-E28" financial calc engine (a package named
 * `@investscape/calc-engine`, declared in package.json but not actually
 * published or present anywhere in this repo or on the npm registry). Per
 * explicit direction, this engine instead implements minimal but correct
 * versions of the needed financial math directly (mortgage payment and
 * amortization for both Canadian semi-annual and US monthly compounding,
 * NOI/cash flow, exit proceeds, and IRR via bisection), consistent with how
 * E42-E44 are self-contained formula engines with no external dependency.
 *
 * Reference metrics (diversificationScore, currencyRiskScore) are computed
 * by genuinely calling this package's own E43/E44 engines against a
 * lightweight mapping of each property's acquisition-time snapshot, rather
 * than reimplementing that logic a third time.
 */

import { portfolioGeographicDiversification, Property as DiversificationProperty } from './E43-portfolio-geographic-diversification';
import { currencyRiskExposure, CurrencyProperty } from './E44-currency-risk-exposure';

export interface ScenarioVariable {
  name: string;
  value: number;
  unit: string;
}

export interface MarketScenario {
  scenarioName: string;
  scenarioId: string;
  variables: ScenarioVariable[];
  probability: number | null;
  description: string | null;
}

export interface PropertyWithInputs {
  propertyId: string;
  purchasePrice: number;
  downPaymentPercent: number;
  interestRate: number;
  amortizationYears: number;
  holdingPeriodYears: number;
  monthlyRentalIncome: number;
  annualPropertyTaxes: number;
  monthlyUtilities: number;
  monthlyMaintenance: number;
  monthlyPropertyManagement: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  vacancyRate: number;
  sellingCost: number | null;
  currency: 'CAD' | 'USD';
  country: 'CA' | 'US';
  mortgageCompounding: 'semi-annual' | 'monthly';
  regionId: string | null;
  cityId: string | null;
  neighborhoodId: string | null;
  E42_investmentScore: number | null;
}

export interface ScenarioBatchInput {
  properties: PropertyWithInputs[];
  scenarios: MarketScenario[];
  portfolioBaseCurrency: 'CAD' | 'USD';
  fxRate: number;
  timeHorizonOverride: number | null;
}

export interface ScenarioPropertyMetrics {
  propertyId: string;
  propertyAddress: string | null;
  purchasePrice: number;
  downPayment: number;
  equityAtExit: number;
  totalCashFlowAnnual: number;
  averageCashFlowAnnual: number;
  totalCashFlowHoldingPeriod: number;
  cashOnCashYear1: number;
  capRate: number;
  irr: number;
  exitPrice: number;
  sellingCosts: number;
  netProceeds: number;
  totalEquityGain: number;
  equityMultiple: number;
  appreciationRate: number;
  totalAppreciation: number;
}

export interface ScenarioPortfolioMetrics {
  scenarioName: string;
  scenarioId: string;
  year1CashFlow: number;
  averageAnnualCashFlow: number;
  totalCashFlowHoldingPeriod: number;
  portfolioIRR: number;
  portfolioEquityMultiple: number;
  totalInitialInvestment: number;
  totalEquityAtExit: number;
  totalEquityGain: number;
  totalAppreciation: number;
  properties: ScenarioPropertyMetrics[];
  diversificationScore: number;
  largestPropertyPercent: number;
  currencyRiskScore: number;
  cadExposure: number;
  usdExposure: number;
  probability: number | null;
  description: string | null;
}

export interface ScenarioRanking {
  scenarioId: string;
  scenarioName: string;
  portfolioIRR: number;
  equityMultiple: number;
  year1CashFlow: number;
  rank: number;
}

export interface ScenarioBatchOutput {
  scenarios: ScenarioPortfolioMetrics[];
  scenarioRanking: ScenarioRanking[];
  bestCaseScenario: { scenarioId: string; scenarioName: string; portfolioIRR: number; reason: string };
  worstCaseScenario: { scenarioId: string; scenarioName: string; portfolioIRR: number; reason: string };
  irrRange: { min: number; max: number; spread: number };
  cashFlowRange: { min: number; max: number };
  equityMultipleRange: { min: number; max: number };
  sensitivityRanking: Array<{ variable: string; irrImpact: number; cashFlowImpact: number; rank: number }>;
  portfolioCount: number;
  totalInitialInvestment: number;
  avgPropertyValue: number;
  averageHoldingPeriod: number;
  tier: 'RES' | 'COM' | 'DEV';
  disclaimer: string;
}

const DISCLAIMER =
  'InvestScape provides informational analysis only and does not constitute investment, ' +
  'financial, tax, or professional real estate advice. Scenario analysis uses projected ' +
  'market variables, historical correlations, and assumed behaviors; actual outcomes will ' +
  'differ. Past performance and historical projections do not guarantee future results. ' +
  'This analysis does not account for personal tax situations, individual risk tolerances, ' +
  'or market conditions beyond the modeled scenarios. Consult qualified financial advisors, ' +
  'tax professionals, and real estate experts before making investment decisions based on ' +
  'this scenario analysis.';

const DEFAULT_HOLDING_PERIOD = 5;
const DEFAULT_BASE_APPRECIATION_RATE = 2.5;
const DEFAULT_SELLING_COST_PERCENT = 6;
const DEFAULT_FX_RATE = 1.25;

function clampRange(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Converts a nominal annual rate into an effective monthly periodic rate. */
function monthlyRate(annualRatePercent: number, compounding: 'semi-annual' | 'monthly'): number {
  const annualRate = annualRatePercent / 100;
  if (compounding === 'monthly') return annualRate / 12;
  // Canadian mortgages compound semi-annually; convert the semi-annual
  // periodic rate to an equivalent effective monthly rate.
  const semiAnnualRate = annualRate / 2;
  return Math.pow(1 + semiAnnualRate, 1 / 6) - 1;
}

function mortgagePayment(
  principal: number,
  annualRatePercent: number,
  amortizationYears: number,
  compounding: 'semi-annual' | 'monthly'
): number {
  const r = monthlyRate(annualRatePercent, compounding);
  const n = amortizationYears * 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

function remainingBalance(
  principal: number,
  annualRatePercent: number,
  amortizationYears: number,
  compounding: 'semi-annual' | 'monthly',
  monthsElapsed: number
): number {
  const r = monthlyRate(annualRatePercent, compounding);
  const payment = mortgagePayment(principal, annualRatePercent, amortizationYears, compounding);
  if (r === 0) return Math.max(0, principal - payment * monthsElapsed);
  const grown = principal * Math.pow(1 + r, monthsElapsed);
  const paid = payment * ((Math.pow(1 + r, monthsElapsed) - 1) / r);
  return Math.max(0, grown - paid);
}

function npv(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
}

/** IRR via bisection; robust for the single-sign-change cash flow patterns real estate produces. */
function computeIRR(cashFlows: number[]): number {
  let lo = -0.9999;
  let hi = 10;
  let npvLo = npv(lo, cashFlows);
  let npvHi = npv(hi, cashFlows);

  let attempts = 0;
  while (Math.sign(npvLo) === Math.sign(npvHi) && attempts < 10) {
    hi *= 2;
    npvHi = npv(hi, cashFlows);
    attempts++;
  }
  if (npvLo === 0) return lo * 100;
  if (npvHi === 0) return hi * 100;
  if (Math.sign(npvLo) === Math.sign(npvHi)) return NaN;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const npvMid = npv(mid, cashFlows);
    if (Math.abs(npvMid) < 1e-6) return mid * 100;
    if (Math.sign(npvMid) === Math.sign(npvLo)) {
      lo = mid;
      npvLo = npvMid;
    } else {
      hi = mid;
    }
  }
  return ((lo + hi) / 2) * 100;
}

interface AdjustedInputs {
  interestRate: number;
  appreciationRate: number;
  vacancyRate: number;
  holdingPeriodYears: number;
  fxRate: number;
}

function applyScenario(
  property: PropertyWithInputs,
  scenario: MarketScenario,
  timeHorizonOverride: number | null,
  baseFxRate: number
): AdjustedInputs {
  let rateShift = 0;
  let appreciationShift = 0;
  let vacancyShift = 0;
  let fxShiftPercent = 0;

  for (const v of scenario.variables) {
    switch (v.name) {
      case 'mortgageRateChange':
        rateShift += v.value;
        break;
      case 'appreciationDelta':
        appreciationShift += v.value;
        break;
      case 'vacancyShift':
        vacancyShift += v.value;
        break;
      case 'fxRateChange':
        fxShiftPercent += v.value;
        break;
      default:
      // Unknown variable names are ignored rather than throwing, so new
      // scenario types don't break existing callers.
    }
  }

  const holdingPeriodYears = Math.max(
    1,
    Math.round(timeHorizonOverride ?? property.holdingPeriodYears ?? DEFAULT_HOLDING_PERIOD)
  );

  return {
    interestRate: clampRange(property.interestRate + rateShift, 0.1, 25),
    appreciationRate: clampRange(DEFAULT_BASE_APPRECIATION_RATE + appreciationShift, -20, 20),
    vacancyRate: clampRange(property.vacancyRate + vacancyShift, 0, 100),
    holdingPeriodYears,
    fxRate: baseFxRate * (1 + fxShiftPercent / 100),
  };
}

function computePropertyMetrics(property: PropertyWithInputs, adjusted: AdjustedInputs): {
  metrics: ScenarioPropertyMetrics;
  cashFlowSeries: number[]; // index 0 = year0 outflow, index n = final year (CF + net proceeds)
} {
  const loanAmount = property.purchasePrice * (1 - property.downPaymentPercent / 100);
  const downPayment = property.purchasePrice - loanAmount;

  const payment = mortgagePayment(loanAmount, adjusted.interestRate, property.amortizationYears, property.mortgageCompounding);
  const annualDebtService = payment * 12;

  const effectiveGrossIncome = property.monthlyRentalIncome * 12 * (1 - adjusted.vacancyRate / 100);
  const annualOperatingExpenses =
    property.annualPropertyTaxes +
    (property.monthlyUtilities + property.monthlyMaintenance + property.monthlyPropertyManagement + property.monthlyInsurance + property.monthlyHOA) *
      12;
  const noi = effectiveGrossIncome - annualOperatingExpenses;
  const annualCashFlow = noi - annualDebtService;

  const n = adjusted.holdingPeriodYears;
  const exitPrice = property.purchasePrice * Math.pow(1 + adjusted.appreciationRate / 100, n);
  const totalAppreciation = exitPrice - property.purchasePrice;

  const sellingCostPercent = property.sellingCost ?? DEFAULT_SELLING_COST_PERCENT;
  const sellingCosts = exitPrice * (sellingCostPercent / 100);
  const balanceAtExit = remainingBalance(loanAmount, adjusted.interestRate, property.amortizationYears, property.mortgageCompounding, n * 12);
  const netProceeds = exitPrice - balanceAtExit - sellingCosts;
  const totalEquityGain = netProceeds - downPayment;
  const equityMultiple = downPayment > 0 ? netProceeds / downPayment : 0;

  const cashFlowSeries: number[] = [-downPayment];
  for (let year = 1; year < n; year++) cashFlowSeries.push(annualCashFlow);
  cashFlowSeries.push(annualCashFlow + netProceeds);

  const irr = computeIRR(cashFlowSeries);
  const totalCashFlowHoldingPeriod = annualCashFlow * n;
  const capRate = property.purchasePrice > 0 ? (noi / property.purchasePrice) * 100 : 0;
  const cashOnCashYear1 = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

  return {
    metrics: {
      propertyId: property.propertyId,
      propertyAddress: null,
      purchasePrice: property.purchasePrice,
      downPayment,
      equityAtExit: netProceeds,
      totalCashFlowAnnual: annualCashFlow,
      averageCashFlowAnnual: annualCashFlow,
      totalCashFlowHoldingPeriod,
      cashOnCashYear1,
      capRate,
      irr: Number.isFinite(irr) ? irr : 0,
      exitPrice,
      sellingCosts,
      netProceeds,
      totalEquityGain,
      equityMultiple,
      appreciationRate: adjusted.appreciationRate,
      totalAppreciation,
    },
    cashFlowSeries,
  };
}

function toBase(value: number, currency: 'CAD' | 'USD', base: 'CAD' | 'USD', fxRate: number): number {
  if (currency === base) return value;
  return currency === 'USD' ? value * fxRate : value / fxRate;
}

/**
 * Pools each property's cash flow series (already converted to the portfolio
 * base currency) into a single portfolio-level series and IRRs it.
 */
function poolPortfolioIRR(series: number[][]): number {
  const maxYears = Math.max(...series.map((s) => s.length));
  const pooled: number[] = new Array(maxYears).fill(0);
  for (const s of series) {
    for (let t = 0; t < s.length; t++) pooled[t] += s[t];
  }
  const irr = computeIRR(pooled);
  return Number.isFinite(irr) ? irr : 0;
}

function toDiversificationProperty(p: PropertyWithInputs): DiversificationProperty {
  const downPayment = p.purchasePrice * (p.downPaymentPercent / 100);
  return {
    propertyId: p.propertyId,
    address: '',
    regionId: p.regionId ?? 'unknown',
    cityId: p.cityId ?? 'unknown',
    neighborhoodId: p.neighborhoodId ?? 'unknown',
    propertyType: 'residential',
    purchasePrice: p.purchasePrice,
    currentMarketValue: p.purchasePrice,
    annualGrossIncome: p.monthlyRentalIncome * 12,
    mortgageBalance: p.purchasePrice - downPayment,
    equityValue: downPayment,
    currency: p.currency,
    country: p.country,
  };
}

function toCurrencyProperty(p: PropertyWithInputs): CurrencyProperty {
  return {
    propertyId: p.propertyId,
    currentMarketValue: p.purchasePrice,
    annualGrossIncome: p.monthlyRentalIncome * 12,
    mortgageBalance: p.purchasePrice - p.purchasePrice * (p.downPaymentPercent / 100),
    currency: p.currency,
    country: p.country,
  };
}

function describeScenarioReason(scenario: MarketScenario): string {
  if (scenario.variables.length === 0) {
    return 'Baseline assumptions with no market stress applied.';
  }
  const clauses: string[] = [];
  for (const v of scenario.variables) {
    if (v.name === 'mortgageRateChange') {
      clauses.push(
        v.value < 0
          ? 'lower mortgage rates reduce debt service, increasing cash flow and returns'
          : 'higher mortgage rates increase debt service, reducing cash flow and returns'
      );
    } else if (v.name === 'appreciationDelta') {
      clauses.push(
        v.value >= 0
          ? 'stronger appreciation increases exit equity'
          : 'weaker appreciation reduces exit equity'
      );
    } else if (v.name === 'vacancyShift') {
      clauses.push(
        v.value >= 0
          ? 'higher vacancy reduces effective rental income'
          : 'lower vacancy increases effective rental income'
      );
    } else if (v.name === 'fxRateChange') {
      clauses.push(v.value >= 0 ? 'USD appreciation increases CAD-equivalent value' : 'USD depreciation reduces CAD-equivalent value');
    }
  }
  if (clauses.length === 0) return `Scenario "${scenario.scenarioName}" applies custom market assumptions.`;
  return clauses.join('; ').replace(/^./, (c) => c.toUpperCase()) + '.';
}

function emptyOutput(): ScenarioBatchOutput {
  return {
    scenarios: [],
    scenarioRanking: [],
    bestCaseScenario: { scenarioId: '', scenarioName: '', portfolioIRR: 0, reason: 'No properties in portfolio.' },
    worstCaseScenario: { scenarioId: '', scenarioName: '', portfolioIRR: 0, reason: 'No properties in portfolio.' },
    irrRange: { min: 0, max: 0, spread: 0 },
    cashFlowRange: { min: 0, max: 0 },
    equityMultipleRange: { min: 0, max: 0 },
    sensitivityRanking: [],
    portfolioCount: 0,
    totalInitialInvestment: 0,
    avgPropertyValue: 0,
    averageHoldingPeriod: 0,
    tier: 'COM',
    disclaimer: DISCLAIMER,
  };
}

/**
 * Runs a portfolio through multiple market scenarios and reports per-scenario
 * portfolio-level IRR, cash flow, and equity outcomes, plus scenario and
 * sensitivity rankings. Never throws — an empty portfolio or an empty
 * scenario list both return a well-formed, empty-shaped result.
 */
export function scenarioBatchProcessor(input: ScenarioBatchInput): ScenarioBatchOutput {
  const { properties, scenarios, portfolioBaseCurrency, timeHorizonOverride } = input;

  if (properties.length === 0 || scenarios.length === 0) {
    return emptyOutput();
  }

  const fxRate = input.fxRate > 0 && Number.isFinite(input.fxRate) ? input.fxRate : DEFAULT_FX_RATE;

  // Reference diversification metrics are computed once from the portfolio's
  // acquisition-time composition; they don't shift with market scenarios.
  const diversification = portfolioGeographicDiversification({
    properties: properties.map(toDiversificationProperty),
    portfolioBaseCurrency,
    fxRate,
  });

  const scenarioMetrics: ScenarioPortfolioMetrics[] = scenarios.map((scenario) => {
    const perPropertyResults = properties.map((property) => {
      const adjusted = applyScenario(property, scenario, timeHorizonOverride, fxRate);
      const result = computePropertyMetrics(property, adjusted);
      return { ...result, currency: property.currency, fxRate: adjusted.fxRate };
    });

    // Per-property metrics stay in each property's native currency (what an
    // owner of that specific property would see); portfolio-level aggregates
    // below convert every property into the base currency before pooling, so
    // an fxRateChange scenario actually moves the pooled IRR/cash flow for
    // mixed-currency portfolios.
    const propertyMetrics = perPropertyResults.map((r) => r.metrics);
    const toBaseFor = (r: (typeof perPropertyResults)[number], value: number) =>
      toBase(value, r.currency, portfolioBaseCurrency, r.fxRate);

    const baseCashFlowSeries = perPropertyResults.map((r) => r.cashFlowSeries.map((cf) => toBaseFor(r, cf)));
    const portfolioIRR = poolPortfolioIRR(baseCashFlowSeries);

    const year1CashFlow = perPropertyResults.reduce((sum, r) => sum + toBaseFor(r, r.metrics.totalCashFlowAnnual), 0);
    const totalCashFlowHoldingPeriod = perPropertyResults.reduce(
      (sum, r) => sum + toBaseFor(r, r.metrics.totalCashFlowHoldingPeriod),
      0
    );
    const totalInitialInvestment = perPropertyResults.reduce((sum, r) => sum + toBaseFor(r, r.metrics.downPayment), 0);
    const totalEquityAtExit = perPropertyResults.reduce((sum, r) => sum + toBaseFor(r, r.metrics.equityAtExit), 0);
    const totalEquityGain = perPropertyResults.reduce((sum, r) => sum + toBaseFor(r, r.metrics.totalEquityGain), 0);
    const totalAppreciation = perPropertyResults.reduce((sum, r) => sum + toBaseFor(r, r.metrics.totalAppreciation), 0);
    const largestPropertyValue = Math.max(...perPropertyResults.map((r) => toBaseFor(r, r.metrics.purchasePrice)));
    const totalValue = perPropertyResults.reduce((sum, r) => sum + toBaseFor(r, r.metrics.purchasePrice), 0);

    const currency = currencyRiskExposure({
      properties: properties.map(toCurrencyProperty),
      portfolioBaseCurrency,
      fxScenarios: { baseRate: fxRate * (1 + (scenario.variables.find((v) => v.name === 'fxRateChange')?.value ?? 0) / 100), rateChange: 0, volatility: null },
      hedges: [],
    });

    return {
      scenarioName: scenario.scenarioName,
      scenarioId: scenario.scenarioId,
      year1CashFlow,
      averageAnnualCashFlow: year1CashFlow,
      totalCashFlowHoldingPeriod,
      portfolioIRR,
      portfolioEquityMultiple: totalInitialInvestment > 0 ? totalEquityAtExit / totalInitialInvestment : 0,
      totalInitialInvestment,
      totalEquityAtExit,
      totalEquityGain,
      totalAppreciation,
      properties: propertyMetrics,
      diversificationScore: diversification.diversificationScore,
      largestPropertyPercent: totalValue > 0 ? Math.round((largestPropertyValue / totalValue) * 100) : 0,
      currencyRiskScore: currency.currencyRiskScore,
      cadExposure: Math.round(currency.exposures.find((e) => e.currency === 'CAD')!.percentOfPortfolio),
      usdExposure: Math.round(currency.exposures.find((e) => e.currency === 'USD')!.percentOfPortfolio),
      probability: scenario.probability,
      description: scenario.description,
    };
  });

  // ----- Ranking -----
  const scenarioRanking: ScenarioRanking[] = [...scenarioMetrics]
    .sort((a, b) => b.portfolioIRR - a.portfolioIRR)
    .map((s, idx) => ({
      scenarioId: s.scenarioId,
      scenarioName: s.scenarioName,
      portfolioIRR: s.portfolioIRR,
      equityMultiple: s.portfolioEquityMultiple,
      year1CashFlow: s.year1CashFlow,
      rank: idx + 1,
    }));

  const bestRanked = scenarioRanking[0];
  const worstRanked = scenarioRanking[scenarioRanking.length - 1];
  const bestScenarioDef = scenarios.find((s) => s.scenarioId === bestRanked.scenarioId)!;
  const worstScenarioDef = scenarios.find((s) => s.scenarioId === worstRanked.scenarioId)!;

  const irrValues = scenarioMetrics.map((s) => s.portfolioIRR);
  const cashFlowValues = scenarioMetrics.map((s) => s.year1CashFlow);
  const equityMultipleValues = scenarioMetrics.map((s) => s.portfolioEquityMultiple);

  const irrMin = Math.min(...irrValues);
  const irrMax = Math.max(...irrValues);

  // ----- Sensitivity ranking -----
  const variableGroups = new Map<string, Array<{ value: number; irr: number; cashFlow: number }>>();
  for (const scenario of scenarios) {
    const metrics = scenarioMetrics.find((s) => s.scenarioId === scenario.scenarioId)!;
    const namesInScenario = new Set(scenario.variables.map((v) => v.name));
    for (const name of namesInScenario) {
      const totalValueForVar = scenario.variables.filter((v) => v.name === name).reduce((sum, v) => sum + v.value, 0);
      if (!variableGroups.has(name)) variableGroups.set(name, []);
      variableGroups.get(name)!.push({ value: totalValueForVar, irr: metrics.portfolioIRR, cashFlow: metrics.year1CashFlow });
    }
  }
  // Every tracked variable is implicitly 0 in any scenario that doesn't
  // reference it (most naturally, the base case), giving a reference point.
  const baseCase = scenarioMetrics.find((s) => scenarios.find((sc) => sc.scenarioId === s.scenarioId)?.variables.length === 0);
  if (baseCase) {
    for (const [, points] of variableGroups) {
      points.push({ value: 0, irr: baseCase.portfolioIRR, cashFlow: baseCase.year1CashFlow });
    }
  }

  const sensitivityRanking = [...variableGroups.entries()]
    .map(([variable, points]) => {
      const values = points.map((p) => p.value);
      const range = Math.max(...values) - Math.min(...values);
      if (range === 0) return null;
      const maxPoint = points.reduce((a, b) => (b.value > a.value ? b : a));
      const minPoint = points.reduce((a, b) => (b.value < a.value ? b : a));
      const irrImpact = Math.abs(((maxPoint.irr - minPoint.irr) / range) * 100);
      const cashFlowImpact = Math.abs((maxPoint.cashFlow - minPoint.cashFlow) / range);
      return { variable, irrImpact, cashFlowImpact };
    })
    .filter((v): v is { variable: string; irrImpact: number; cashFlowImpact: number } => v !== null)
    .sort((a, b) => b.irrImpact - a.irrImpact)
    .map((v, idx) => ({ ...v, rank: idx + 1 }));

  const averageHoldingPeriod =
    properties.reduce((sum, p) => sum + Math.round(timeHorizonOverride ?? p.holdingPeriodYears ?? DEFAULT_HOLDING_PERIOD), 0) / properties.length;

  return {
    scenarios: scenarioMetrics,
    scenarioRanking,
    bestCaseScenario: {
      scenarioId: bestRanked.scenarioId,
      scenarioName: bestRanked.scenarioName,
      portfolioIRR: bestRanked.portfolioIRR,
      reason: describeScenarioReason(bestScenarioDef),
    },
    worstCaseScenario: {
      scenarioId: worstRanked.scenarioId,
      scenarioName: worstRanked.scenarioName,
      portfolioIRR: worstRanked.portfolioIRR,
      reason: describeScenarioReason(worstScenarioDef),
    },
    irrRange: { min: irrMin, max: irrMax, spread: Math.round((irrMax - irrMin) * 100) },
    cashFlowRange: { min: Math.min(...cashFlowValues), max: Math.max(...cashFlowValues) },
    equityMultipleRange: { min: Math.min(...equityMultipleValues), max: Math.max(...equityMultipleValues) },
    sensitivityRanking,
    portfolioCount: properties.length,
    totalInitialInvestment: scenarioMetrics[0].totalInitialInvestment,
    avgPropertyValue: properties.reduce((sum, p) => sum + p.purchasePrice, 0) / properties.length,
    averageHoldingPeriod,
    tier: 'COM',
    disclaimer: DISCLAIMER,
  };
}

export default scenarioBatchProcessor;
