/**
 * E39: Mortgage Rate Forecast Engine
 *
 * Forecasts mortgage rates and models their impact on real estate markets.
 * Part of Composite & Predictive layer showing:
 * - Mortgage rate forecasts (3m, 6m, 12m)
 * - Interest rate scenarios (cuts, hikes, neutral)
 * - Affordability impact by neighborhood
 * - Purchase power changes
 * - Absorption rate sensitivity
 * - Market shock scenarios
 *
 * Dependencies:
 * - E29: Regional Macro Context
 * - E30: City-Level Market Analysis
 * - Bank of Canada / Federal Reserve data
 * - Market consensus forecasts
 */

import { validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * Mortgage rate forecast for time horizon
 */
export interface MortgageRateForecast {
  timeframe: string;              // "3 Month", "6 Month", "12 Month"
  forecastedRate: number;         // % (e.g., 5.25)
  confidenceInterval: number;     // ± percentage points
  probabilityDirection: string;   // "Higher", "Stable", "Lower"
  probabilityPercent: number;     // confidence % (0-100)
}

/**
 * Affordability impact metrics
 */
export interface AffordabilityImpact {
  medianPriceAffordable: number;  // Max home price on median income
  purchasePowerChange: number;    // % change from current
  priceReductionNeeded: number;   // % price drop to maintain affordability
  buyersAffected: number;         // % of market affected
}

/**
 * Rate scenario result
 */
export interface RateScenarioResult {
  name: string;                   // "Rate Cut", "Status Quo", "Rate Hike"
  rateChange: number;             // basis points change
  affordabilityImpact: number;    // % change in affordability
  absorptionImpact: number;       // % change in absorption rate
  priceImpact12m: number;         // % price impact
  probabilityPercent: number;     // likelihood of scenario
}

/**
 * Mortgage rate forecast metrics
 */
export interface MortgageRateForecastMetrics {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  regionId: string;
  asOfDate: Date;

  // Current rate environment
  currentRate5yr: number;         // Current 5-year fixed rate %
  currentRate7yr: number;         // Current 7-year fixed rate %
  currentRate10yr: number;        // Current 10-year fixed rate %
  rateEnvironment: string;        // "High", "Elevated", "Moderate", "Low"

  // Rate forecasts (3 horizons)
  forecast3m: MortgageRateForecast;
  forecast6m: MortgageRateForecast;
  forecast12m: MortgageRateForecast;

  // Central bank expectations
  nextRateDecision: string;       // "Cut", "Hold", "Hike"
  nextDecisionProbability: number; // % probability
  ratesDirection: string;         // "Falling", "Flat", "Rising"

  // Affordability
  currentAffordability: AffordabilityImpact;
  affordabilityChange6m: number;  // % change in affordability
  affordabilityChange12m: number;

  // Scenario analysis (3 scenarios)
  scenarios: RateScenarioResult[];

  // Rate sensitivity
  housePriceElasticityToRates: number; // % price change per 1% rate change
  absorptionElasticityToRates: number;

  // Housing market impact
  interestExpenseRatio: number;   // mortgage payment as % of median income
  paymentShockRisk: number;       // 0-100 (risk of payment shock on renewal)

  // Forecast quality
  consumerSentiment: number;      // 0-100 (affect on buyer confidence)

  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface MortgageRateForecastInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  regionId: string;
  asOfDate?: Date;
}

export interface MortgageRateForecastOutput extends MortgageRateForecastMetrics {}

/**
 * Mock mortgage rate forecast data store.
 *
 * In production, this:
 * - Fetches current rates from Bank of Canada / Federal Reserve APIs
 * - Incorporates consensus forecasts from major banks
 * - Builds models using yield curve, inflation expectations
 * - Simulates scenarios via stress testing
 *
 * For now, realistic fixtures representing Aug 4, 2026 data.
 */
interface MockMortgageRateData {
  [neighborhoodId: string]: MortgageRateForecastMetrics;
}

const MOCK_DATA: MockMortgageRateData = {
  // ===== TORONTO MORTGAGE FORECASTS =====

  'toronto-yorkville-on': {
    neighborhoodId: 'toronto-yorkville-on',
    neighborhoodName: 'Yorkville',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.89,
    currentRate7yr: 4.95,
    currentRate10yr: 5.02,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.79,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.65,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.42,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 685000,
      purchasePowerChange: -8.5,
      priceReductionNeeded: 9.2,
      buyersAffected: 28,
    },
    affordabilityChange6m: 6.8,
    affordabilityChange12m: 12.5,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 8.5,
        absorptionImpact: 12.2,
        priceImpact12m: 6.8,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -4.2,
        absorptionImpact: -6.5,
        priceImpact12m: -3.2,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -3.2,
    absorptionElasticityToRates: -2.8,
    interestExpenseRatio: 32.5,
    paymentShockRisk: 38,
    consumerSentiment: 58,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  'toronto-downtown-on': {
    neighborhoodId: 'toronto-downtown-on',
    neighborhoodName: 'Downtown Toronto',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.89,
    currentRate7yr: 4.95,
    currentRate10yr: 5.02,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.79,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.65,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.42,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 580000,
      purchasePowerChange: -12.5,
      priceReductionNeeded: 13.5,
      buyersAffected: 38,
    },
    affordabilityChange6m: 7.2,
    affordabilityChange12m: 13.8,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 9.2,
        absorptionImpact: 13.5,
        priceImpact12m: 7.5,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -4.8,
        absorptionImpact: -7.2,
        priceImpact12m: -3.8,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -3.5,
    absorptionElasticityToRates: -3.1,
    interestExpenseRatio: 35.2,
    paymentShockRisk: 42,
    consumerSentiment: 54,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  'toronto-scarborough-on': {
    neighborhoodId: 'toronto-scarborough-on',
    neighborhoodName: 'Scarborough',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.89,
    currentRate7yr: 4.95,
    currentRate10yr: 5.02,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.79,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.65,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.42,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 425000,
      purchasePowerChange: -15.2,
      priceReductionNeeded: 16.8,
      buyersAffected: 52,
    },
    affordabilityChange6m: 8.5,
    affordabilityChange12m: 15.2,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 11.5,
        absorptionImpact: 16.8,
        priceImpact12m: 9.2,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -5.8,
        absorptionImpact: -8.5,
        priceImpact12m: -4.5,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -3.8,
    absorptionElasticityToRates: -3.5,
    interestExpenseRatio: 38.8,
    paymentShockRisk: 48,
    consumerSentiment: 48,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  'toronto-north-york-on': {
    neighborhoodId: 'toronto-north-york-on',
    neighborhoodName: 'North York',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.89,
    currentRate7yr: 4.95,
    currentRate10yr: 5.02,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.79,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.65,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.42,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 520000,
      purchasePowerChange: -11.2,
      priceReductionNeeded: 12.5,
      buyersAffected: 35,
    },
    affordabilityChange6m: 7.8,
    affordabilityChange12m: 14.2,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 9.8,
        absorptionImpact: 14.2,
        priceImpact12m: 8.2,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -5.2,
        absorptionImpact: -7.5,
        priceImpact12m: -4.0,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -3.3,
    absorptionElasticityToRates: -2.9,
    interestExpenseRatio: 33.5,
    paymentShockRisk: 40,
    consumerSentiment: 56,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  'toronto-etobicoke-on': {
    neighborhoodId: 'toronto-etobicoke-on',
    neighborhoodName: 'Etobicoke',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.89,
    currentRate7yr: 4.95,
    currentRate10yr: 5.02,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.79,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.65,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.42,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 465000,
      purchasePowerChange: -13.8,
      priceReductionNeeded: 15.2,
      buyersAffected: 42,
    },
    affordabilityChange6m: 8.2,
    affordabilityChange12m: 14.8,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 10.5,
        absorptionImpact: 15.2,
        priceImpact12m: 8.8,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -5.5,
        absorptionImpact: -8.0,
        priceImpact12m: -4.2,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -3.6,
    absorptionElasticityToRates: -3.2,
    interestExpenseRatio: 36.8,
    paymentShockRisk: 45,
    consumerSentiment: 52,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  // ===== VANCOUVER MORTGAGE FORECASTS =====

  'vancouver-downtown-bc': {
    neighborhoodId: 'vancouver-downtown-bc',
    neighborhoodName: 'Downtown Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.85,
    currentRate7yr: 4.92,
    currentRate10yr: 5.00,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.75,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.60,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.38,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 425000,
      purchasePowerChange: -18.5,
      priceReductionNeeded: 20.2,
      buyersAffected: 58,
    },
    affordabilityChange6m: 9.5,
    affordabilityChange12m: 16.8,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 12.8,
        absorptionImpact: 18.5,
        priceImpact12m: 10.2,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -6.5,
        absorptionImpact: -9.5,
        priceImpact12m: -5.0,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -4.2,
    absorptionElasticityToRates: -3.8,
    interestExpenseRatio: 42.5,
    paymentShockRisk: 55,
    consumerSentiment: 45,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  'vancouver-west-side-bc': {
    neighborhoodId: 'vancouver-west-side-bc',
    neighborhoodName: 'West Side Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.85,
    currentRate7yr: 4.92,
    currentRate10yr: 5.00,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.75,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.60,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.38,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 520000,
      purchasePowerChange: -15.2,
      priceReductionNeeded: 16.8,
      buyersAffected: 45,
    },
    affordabilityChange6m: 8.8,
    affordabilityChange12m: 15.5,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 11.2,
        absorptionImpact: 16.2,
        priceImpact12m: 9.5,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -5.8,
        absorptionImpact: -8.5,
        priceImpact12m: -4.5,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -3.6,
    absorptionElasticityToRates: -3.2,
    interestExpenseRatio: 38.2,
    paymentShockRisk: 48,
    consumerSentiment: 52,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  'vancouver-east-bc': {
    neighborhoodId: 'vancouver-east-bc',
    neighborhoodName: 'East Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.85,
    currentRate7yr: 4.92,
    currentRate10yr: 5.00,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.75,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.60,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.38,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 385000,
      purchasePowerChange: -17.8,
      priceReductionNeeded: 19.5,
      buyersAffected: 52,
    },
    affordabilityChange6m: 9.2,
    affordabilityChange12m: 16.2,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 12.2,
        absorptionImpact: 17.5,
        priceImpact12m: 9.8,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -6.2,
        absorptionImpact: -9.0,
        priceImpact12m: -4.8,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -3.95,
    absorptionElasticityToRates: -3.5,
    interestExpenseRatio: 40.8,
    paymentShockRisk: 52,
    consumerSentiment: 48,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  'vancouver-north-shore-bc': {
    neighborhoodId: 'vancouver-north-shore-bc',
    neighborhoodName: 'North Shore',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.85,
    currentRate7yr: 4.92,
    currentRate10yr: 5.00,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.75,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.60,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.38,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 455000,
      purchasePowerChange: -14.5,
      priceReductionNeeded: 16.0,
      buyersAffected: 42,
    },
    affordabilityChange6m: 8.5,
    affordabilityChange12m: 15.2,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 10.8,
        absorptionImpact: 15.5,
        priceImpact12m: 9.2,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -5.5,
        absorptionImpact: -8.0,
        priceImpact12m: -4.2,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -3.5,
    absorptionElasticityToRates: -3.1,
    interestExpenseRatio: 36.5,
    paymentShockRisk: 45,
    consumerSentiment: 54,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  // ===== MONTREAL MORTGAGE FORECASTS =====

  'montreal-downtown-qc': {
    neighborhoodId: 'montreal-downtown-qc',
    neighborhoodName: 'Downtown Montreal',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.89,
    currentRate7yr: 4.95,
    currentRate10yr: 5.02,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.79,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.65,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.42,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 420000,
      purchasePowerChange: -9.5,
      priceReductionNeeded: 10.5,
      buyersAffected: 30,
    },
    affordabilityChange6m: 6.2,
    affordabilityChange12m: 11.8,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 8.2,
        absorptionImpact: 11.8,
        priceImpact12m: 6.5,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -4.0,
        absorptionImpact: -6.0,
        priceImpact12m: -3.0,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -3.0,
    absorptionElasticityToRates: -2.6,
    interestExpenseRatio: 30.5,
    paymentShockRisk: 35,
    consumerSentiment: 62,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  'montreal-plateau-qc': {
    neighborhoodId: 'montreal-plateau-qc',
    neighborhoodName: 'Plateau-Mont-Royal',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.89,
    currentRate7yr: 4.95,
    currentRate10yr: 5.02,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.79,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.65,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.42,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 455000,
      purchasePowerChange: -10.2,
      priceReductionNeeded: 11.5,
      buyersAffected: 32,
    },
    affordabilityChange6m: 6.8,
    affordabilityChange12m: 12.5,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 8.8,
        absorptionImpact: 12.5,
        priceImpact12m: 7.0,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -4.5,
        absorptionImpact: -6.5,
        priceImpact12m: -3.2,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -3.2,
    absorptionElasticityToRates: -2.8,
    interestExpenseRatio: 32.0,
    paymentShockRisk: 38,
    consumerSentiment: 60,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  'montreal-west-island-qc': {
    neighborhoodId: 'montreal-west-island-qc',
    neighborhoodName: 'West Island',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 4.89,
    currentRate7yr: 4.95,
    currentRate10yr: 5.02,
    rateEnvironment: 'Elevated',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 4.79,
      confidenceInterval: 0.35,
      probabilityDirection: 'Lower',
      probabilityPercent: 68,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.65,
      confidenceInterval: 0.45,
      probabilityDirection: 'Lower',
      probabilityPercent: 62,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.42,
      confidenceInterval: 0.65,
      probabilityDirection: 'Lower',
      probabilityPercent: 58,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 72,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 380000,
      purchasePowerChange: -8.2,
      priceReductionNeeded: 8.8,
      buyersAffected: 25,
    },
    affordabilityChange6m: 5.5,
    affordabilityChange12m: 10.2,
    scenarios: [
      {
        name: 'Rate Cut (50 bps)',
        rateChange: -50,
        affordabilityImpact: 7.2,
        absorptionImpact: 10.5,
        priceImpact12m: 5.8,
        probabilityPercent: 45,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 35,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -3.5,
        absorptionImpact: -5.2,
        priceImpact12m: -2.8,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -2.8,
    absorptionElasticityToRates: -2.4,
    interestExpenseRatio: 28.5,
    paymentShockRisk: 32,
    consumerSentiment: 66,
    source: `${DATA_SOURCES.STATCAN}, Bank of Canada, Major Banks Consensus`,
    confidence: 'high',
  },

  // ===== US MORTGAGE FORECASTS (Sample) =====

  'austin-downtown-tx': {
    neighborhoodId: 'austin-downtown-tx',
    neighborhoodName: 'Downtown Austin',
    cityId: 'austin-tx',
    regionId: 'us-south',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 5.15,
    currentRate7yr: 5.22,
    currentRate10yr: 5.32,
    rateEnvironment: 'High',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 5.05,
      confidenceInterval: 0.38,
      probabilityDirection: 'Lower',
      probabilityPercent: 65,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.88,
      confidenceInterval: 0.50,
      probabilityDirection: 'Lower',
      probabilityPercent: 60,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.62,
      confidenceInterval: 0.72,
      probabilityDirection: 'Lower',
      probabilityPercent: 55,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 68,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 685000,
      purchasePowerChange: -19.5,
      priceReductionNeeded: 21.8,
      buyersAffected: 55,
    },
    affordabilityChange6m: 10.2,
    affordabilityChange12m: 18.5,
    scenarios: [
      {
        name: 'Rate Cut (75 bps)',
        rateChange: -75,
        affordabilityImpact: 14.5,
        absorptionImpact: 21.2,
        priceImpact12m: 12.5,
        probabilityPercent: 42,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 38,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -7.2,
        absorptionImpact: -10.5,
        priceImpact12m: -5.8,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -4.5,
    absorptionElasticityToRates: -4.2,
    interestExpenseRatio: 45.2,
    paymentShockRisk: 58,
    consumerSentiment: 42,
    source: `${DATA_SOURCES.FRED}, Federal Reserve, Major Lenders Consensus`,
    confidence: 'high',
  },

  'san-francisco-downtown-ca': {
    neighborhoodId: 'san-francisco-downtown-ca',
    neighborhoodName: 'SOMA / Downtown',
    cityId: 'san-francisco-ca',
    regionId: 'us-west',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 5.12,
    currentRate7yr: 5.20,
    currentRate10yr: 5.30,
    rateEnvironment: 'High',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 5.02,
      confidenceInterval: 0.38,
      probabilityDirection: 'Lower',
      probabilityPercent: 65,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.85,
      confidenceInterval: 0.50,
      probabilityDirection: 'Lower',
      probabilityPercent: 60,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.58,
      confidenceInterval: 0.72,
      probabilityDirection: 'Lower',
      probabilityPercent: 55,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 68,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 580000,
      purchasePowerChange: -22.8,
      priceReductionNeeded: 25.5,
      buyersAffected: 62,
    },
    affordabilityChange6m: 11.8,
    affordabilityChange12m: 21.2,
    scenarios: [
      {
        name: 'Rate Cut (75 bps)',
        rateChange: -75,
        affordabilityImpact: 16.2,
        absorptionImpact: 23.5,
        priceImpact12m: 14.2,
        probabilityPercent: 42,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 38,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -8.2,
        absorptionImpact: -12.0,
        priceImpact12m: -6.5,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -4.8,
    absorptionElasticityToRates: -4.5,
    interestExpenseRatio: 48.8,
    paymentShockRisk: 62,
    consumerSentiment: 38,
    source: `${DATA_SOURCES.FRED}, Federal Reserve, Major Lenders Consensus`,
    confidence: 'high',
  },

  'denver-downtown-co': {
    neighborhoodId: 'denver-downtown-co',
    neighborhoodName: 'Downtown Denver',
    cityId: 'denver-co',
    regionId: 'us-west',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 5.10,
    currentRate7yr: 5.18,
    currentRate10yr: 5.28,
    rateEnvironment: 'High',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 5.00,
      confidenceInterval: 0.38,
      probabilityDirection: 'Lower',
      probabilityPercent: 65,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.82,
      confidenceInterval: 0.50,
      probabilityDirection: 'Lower',
      probabilityPercent: 60,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.55,
      confidenceInterval: 0.72,
      probabilityDirection: 'Lower',
      probabilityPercent: 55,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 68,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 595000,
      purchasePowerChange: -18.2,
      priceReductionNeeded: 20.5,
      buyersAffected: 48,
    },
    affordabilityChange6m: 9.8,
    affordabilityChange12m: 17.5,
    scenarios: [
      {
        name: 'Rate Cut (75 bps)',
        rateChange: -75,
        affordabilityImpact: 13.8,
        absorptionImpact: 19.8,
        priceImpact12m: 11.5,
        probabilityPercent: 42,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 38,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -6.8,
        absorptionImpact: -9.8,
        priceImpact12m: -5.2,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -4.1,
    absorptionElasticityToRates: -3.8,
    interestExpenseRatio: 42.5,
    paymentShockRisk: 52,
    consumerSentiment: 48,
    source: `${DATA_SOURCES.FRED}, Federal Reserve, Major Lenders Consensus`,
    confidence: 'high',
  },

  'miami-brickell-fl': {
    neighborhoodId: 'miami-brickell-fl',
    neighborhoodName: 'Brickell',
    cityId: 'miami-fl',
    regionId: 'us-south',
    asOfDate: new Date('2026-08-04'),
    currentRate5yr: 5.14,
    currentRate7yr: 5.21,
    currentRate10yr: 5.31,
    rateEnvironment: 'High',
    forecast3m: {
      timeframe: '3 Month',
      forecastedRate: 5.04,
      confidenceInterval: 0.38,
      probabilityDirection: 'Lower',
      probabilityPercent: 65,
    },
    forecast6m: {
      timeframe: '6 Month',
      forecastedRate: 4.87,
      confidenceInterval: 0.50,
      probabilityDirection: 'Lower',
      probabilityPercent: 60,
    },
    forecast12m: {
      timeframe: '12 Month',
      forecastedRate: 4.60,
      confidenceInterval: 0.72,
      probabilityDirection: 'Lower',
      probabilityPercent: 55,
    },
    nextRateDecision: 'Cut',
    nextDecisionProbability: 68,
    ratesDirection: 'Falling',
    currentAffordability: {
      medianPriceAffordable: 625000,
      purchasePowerChange: -20.5,
      priceReductionNeeded: 23.2,
      buyersAffected: 58,
    },
    affordabilityChange6m: 10.8,
    affordabilityChange12m: 19.5,
    scenarios: [
      {
        name: 'Rate Cut (75 bps)',
        rateChange: -75,
        affordabilityImpact: 15.2,
        absorptionImpact: 22.0,
        priceImpact12m: 13.2,
        probabilityPercent: 42,
      },
      {
        name: 'Status Quo',
        rateChange: 0,
        affordabilityImpact: 0,
        absorptionImpact: 0,
        priceImpact12m: 0,
        probabilityPercent: 38,
      },
      {
        name: 'Rate Hike (25 bps)',
        rateChange: 25,
        affordabilityImpact: -7.8,
        absorptionImpact: -11.2,
        priceImpact12m: -6.2,
        probabilityPercent: 20,
      },
    ],
    housePriceElasticityToRates: -4.4,
    absorptionElasticityToRates: -4.1,
    interestExpenseRatio: 46.5,
    paymentShockRisk: 60,
    consumerSentiment: 40,
    source: `${DATA_SOURCES.FRED}, Federal Reserve, Major Lenders Consensus`,
    confidence: 'high',
  },
};

/**
 * Fetch mortgage rate forecast metrics for a neighborhood
 *
 * @param input Neighborhood ID, city ID, region ID, and optional date
 * @returns Mortgage rate forecast metrics
 * @throws Error if neighborhood not found
 */
export function mortgageRateForecast(input: MortgageRateForecastInput): MortgageRateForecastOutput {
  const { neighborhoodId, asOfDate } = input;

  const validatedDate = validateDateOrUseToday(asOfDate);

  const mockData = MOCK_DATA[neighborhoodId];
  if (!mockData) {
    throw new Error(`No mortgage rate forecast data available for neighborhood "${neighborhoodId}".`);
  }

  return {
    ...mockData,
    asOfDate: validatedDate,
  };
}

export default mortgageRateForecast;
