/**
 * E40: Appreciation Probability Engine
 *
 * Forecasts price appreciation probability and magnitude for neighborhoods.
 * Part of Composite & Predictive layer showing:
 * - Expected appreciation over 1/3/5 year horizons
 * - Probability of price appreciation
 * - Risk-adjusted returns
 * - Upside/downside scenarios
 * - Cycle position assessment
 * - Momentum vs mean reversion
 *
 * Dependencies:
 * - E30: City-Level Market Analysis
 * - E37: Market Velocity Analyzer
 * - E38: Macro-to-Micro Sensitivity
 * - E39: Mortgage Rate Forecast
 * - Historical price data
 */

import { validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * Appreciation forecast for time horizon
 */
export interface AppreciationForecast {
  timeframe: string;              // "1 Year", "3 Year", "5 Year"
  expectedAppreciation: number;   // % annualized
  probabilityOfAppreciation: number; // % (likelihood of positive returns)
  confidenceInterval: number;     // ± percentage points
  upside: number;                 // % optimistic scenario
  downside: number;               // % pessimistic scenario
}

/**
 * Cycle position analysis
 */
export interface CyclePosition {
  phaseName: string;              // "Early Expansion", "Late Expansion", "Peak", "Contraction", "Trough"
  yearsInPhase: number;           // How long in current phase
  phaseCompletion: number;        // 0-100 (how far through phase)
  estimatedYearsRemaining: number; // Expected duration remaining
}

/**
 * Risk-adjusted metrics
 */
export interface RiskAdjustedMetrics {
  sharpeRatio: number;            // Return per unit of risk
  volatility: number;             // Historical price volatility %
  downsideProtection: number;     // 0-100 (protection against declines)
  recoveryTime: number;           // months to recover from 10% decline
}

/**
 * Appreciation probability metrics
 */
export interface AppreciationProbabilityMetrics {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  regionId: string;
  asOfDate: Date;

  // Price history
  priceChange1y: number;          // % annual appreciation
  priceChange3y: number;          // % annual average
  priceChange5y: number;          // % annual average
  priceVolatility: number;        // historical volatility

  // Appreciation forecasts (3 horizons)
  forecast1y: AppreciationForecast;
  forecast3y: AppreciationForecast;
  forecast5y: AppreciationForecast;

  // Cycle analysis
  cyclePosition: CyclePosition;
  cycleMomentum: string;          // "Accelerating", "Steady", "Decelerating", "Reversing"
  cycleMomentumScore: number;     // -100 to 100 (negative = downside risk)

  // Risk-adjusted returns
  riskAdjustedMetrics: RiskAdjustedMetrics;

  // Comparative analysis
  outperformingCity: boolean;     // vs city average
  outperformingRegion: boolean;   // vs region average
  outperformingNational: boolean; // vs national average

  // Key drivers of appreciation
  primaryDriver: string;          // "Supply Constraint", "Demand Growth", "Rate Decline", "Development", "etc"
  secondaryDriver: string;

  // Risk factors
  riskFactors: string[];          // [e.g., "Interest Rate Sensitivity", "Supply Surge", "Economic Slowdown"]

  // Appreciation outlook
  outlook: string;                // "Strong", "Moderate", "Balanced", "Cautious", "Weak"

  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AppreciationProbabilityInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  regionId: string;
  asOfDate?: Date;
}

export interface AppreciationProbabilityOutput extends AppreciationProbabilityMetrics {}

/**
 * Mock appreciation probability data store.
 *
 * In production, this:
 * - Queries historical price indices for neighborhoods
 * - Builds regression models using macro/micro factors
 * - Simulates price paths via Monte Carlo
 * - Calibrates cycle position from leading indicators
 *
 * For now, realistic fixtures representing Aug 4, 2026 data.
 */
interface MockAppreciationData {
  [neighborhoodId: string]: AppreciationProbabilityMetrics;
}

const MOCK_DATA: MockAppreciationData = {
  // ===== TORONTO APPRECIATION =====

  'toronto-yorkville-on': {
    neighborhoodId: 'toronto-yorkville-on',
    neighborhoodName: 'Yorkville',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 2.8,
    priceChange3y: 3.5,
    priceChange5y: 4.2,
    priceVolatility: 8.5,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 3.8,
      probabilityOfAppreciation: 72,
      confidenceInterval: 1.2,
      upside: 6.5,
      downside: -1.2,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 4.2,
      probabilityOfAppreciation: 75,
      confidenceInterval: 1.8,
      upside: 8.5,
      downside: -2.1,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 3.8,
      probabilityOfAppreciation: 72,
      confidenceInterval: 2.5,
      upside: 9.2,
      downside: -3.5,
    },
    cyclePosition: {
      phaseName: 'Late Expansion',
      yearsInPhase: 2.3,
      phaseCompletion: 65,
      estimatedYearsRemaining: 1.2,
    },
    cycleMomentum: 'Steady',
    cycleMomentumScore: 35,
    riskAdjustedMetrics: {
      sharpeRatio: 0.42,
      volatility: 8.5,
      downsideProtection: 68,
      recoveryTime: 14,
    },
    outperformingCity: true,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Supply Constraint',
    secondaryDriver: 'Demand Growth',
    riskFactors: ['Interest Rate Sensitivity', 'Market Saturation'],
    outlook: 'Moderate',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  'toronto-downtown-on': {
    neighborhoodId: 'toronto-downtown-on',
    neighborhoodName: 'Downtown Toronto',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 3.2,
    priceChange3y: 4.1,
    priceChange5y: 4.8,
    priceVolatility: 9.2,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 4.5,
      probabilityOfAppreciation: 75,
      confidenceInterval: 1.3,
      upside: 7.8,
      downside: -1.5,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 4.8,
      probabilityOfAppreciation: 76,
      confidenceInterval: 1.9,
      upside: 9.5,
      downside: -2.2,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 4.2,
      probabilityOfAppreciation: 73,
      confidenceInterval: 2.6,
      upside: 10.2,
      downside: -3.8,
    },
    cyclePosition: {
      phaseName: 'Late Expansion',
      yearsInPhase: 2.5,
      phaseCompletion: 68,
      estimatedYearsRemaining: 1.0,
    },
    cycleMomentum: 'Steady',
    cycleMomentumScore: 38,
    riskAdjustedMetrics: {
      sharpeRatio: 0.45,
      volatility: 9.2,
      downsideProtection: 65,
      recoveryTime: 16,
    },
    outperformingCity: true,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Demand Growth',
    secondaryDriver: 'Supply Constraint',
    riskFactors: ['Interest Rate Sensitivity', 'Economic Slowdown Risk'],
    outlook: 'Moderate',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  'toronto-scarborough-on': {
    neighborhoodId: 'toronto-scarborough-on',
    neighborhoodName: 'Scarborough',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: -1.2,
    priceChange3y: 0.8,
    priceChange5y: 1.5,
    priceVolatility: 12.5,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 0.5,
      probabilityOfAppreciation: 52,
      confidenceInterval: 2.1,
      upside: 3.2,
      downside: -4.5,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 1.8,
      probabilityOfAppreciation: 58,
      confidenceInterval: 2.8,
      upside: 5.8,
      downside: -5.5,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 2.2,
      probabilityOfAppreciation: 62,
      confidenceInterval: 3.2,
      upside: 7.5,
      downside: -6.2,
    },
    cyclePosition: {
      phaseName: 'Contraction',
      yearsInPhase: 1.8,
      phaseCompletion: 45,
      estimatedYearsRemaining: 2.2,
    },
    cycleMomentum: 'Decelerating',
    cycleMomentumScore: -22,
    riskAdjustedMetrics: {
      sharpeRatio: 0.15,
      volatility: 12.5,
      downsideProtection: 48,
      recoveryTime: 24,
    },
    outperformingCity: false,
    outperformingRegion: false,
    outperformingNational: false,
    primaryDriver: 'Mean Reversion',
    secondaryDriver: 'Supply Oversupply',
    riskFactors: ['Inventory Buildup', 'Weak Absorption', 'Interest Rate Sensitivity'],
    outlook: 'Cautious',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  'toronto-north-york-on': {
    neighborhoodId: 'toronto-north-york-on',
    neighborhoodName: 'North York',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 0.5,
    priceChange3y: 1.8,
    priceChange5y: 2.5,
    priceVolatility: 10.2,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 1.8,
      probabilityOfAppreciation: 62,
      confidenceInterval: 1.8,
      upside: 4.8,
      downside: -2.8,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 2.5,
      probabilityOfAppreciation: 65,
      confidenceInterval: 2.2,
      upside: 6.5,
      downside: -3.5,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 2.8,
      probabilityOfAppreciation: 68,
      confidenceInterval: 2.8,
      upside: 7.8,
      downside: -4.2,
    },
    cyclePosition: {
      phaseName: 'Early Expansion',
      yearsInPhase: 1.2,
      phaseCompletion: 35,
      estimatedYearsRemaining: 2.3,
    },
    cycleMomentum: 'Accelerating',
    cycleMomentumScore: 18,
    riskAdjustedMetrics: {
      sharpeRatio: 0.32,
      volatility: 10.2,
      downsideProtection: 62,
      recoveryTime: 18,
    },
    outperformingCity: false,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Demand Growth',
    secondaryDriver: 'Development',
    riskFactors: ['Market Saturation', 'Supply Uncertainty'],
    outlook: 'Balanced',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  'toronto-etobicoke-on': {
    neighborhoodId: 'toronto-etobicoke-on',
    neighborhoodName: 'Etobicoke',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: -0.8,
    priceChange3y: 1.2,
    priceChange5y: 2.0,
    priceVolatility: 11.5,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 1.2,
      probabilityOfAppreciation: 58,
      confidenceInterval: 1.9,
      upside: 4.2,
      downside: -3.2,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 2.2,
      probabilityOfAppreciation: 62,
      confidenceInterval: 2.3,
      upside: 6.0,
      downside: -4.0,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 2.5,
      probabilityOfAppreciation: 65,
      confidenceInterval: 2.9,
      upside: 7.2,
      downside: -4.8,
    },
    cyclePosition: {
      phaseName: 'Contraction',
      yearsInPhase: 1.5,
      phaseCompletion: 40,
      estimatedYearsRemaining: 2.5,
    },
    cycleMomentum: 'Decelerating',
    cycleMomentumScore: -15,
    riskAdjustedMetrics: {
      sharpeRatio: 0.25,
      volatility: 11.5,
      downsideProtection: 56,
      recoveryTime: 20,
    },
    outperformingCity: false,
    outperformingRegion: false,
    outperformingNational: true,
    primaryDriver: 'Mean Reversion',
    secondaryDriver: 'Rate Sensitivity',
    riskFactors: ['Weak Momentum', 'Inventory Buildup', 'Economic Uncertainty'],
    outlook: 'Cautious',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  // ===== VANCOUVER APPRECIATION =====

  'vancouver-downtown-bc': {
    neighborhoodId: 'vancouver-downtown-bc',
    neighborhoodName: 'Downtown Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 4.5,
    priceChange3y: 5.2,
    priceChange5y: 5.8,
    priceVolatility: 10.8,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 5.2,
      probabilityOfAppreciation: 78,
      confidenceInterval: 1.4,
      upside: 8.8,
      downside: -1.8,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 5.5,
      probabilityOfAppreciation: 78,
      confidenceInterval: 2.0,
      upside: 10.2,
      downside: -2.5,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 4.8,
      probabilityOfAppreciation: 75,
      confidenceInterval: 2.8,
      upside: 10.5,
      downside: -4.2,
    },
    cyclePosition: {
      phaseName: 'Late Expansion',
      yearsInPhase: 2.8,
      phaseCompletion: 72,
      estimatedYearsRemaining: 0.8,
    },
    cycleMomentum: 'Steady',
    cycleMomentumScore: 42,
    riskAdjustedMetrics: {
      sharpeRatio: 0.48,
      volatility: 10.8,
      downsideProtection: 70,
      recoveryTime: 13,
    },
    outperformingCity: true,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Supply Constraint',
    secondaryDriver: 'Immigration Demand',
    riskFactors: ['Interest Rate Sensitivity', 'Foreign Buyer Restrictions'],
    outlook: 'Strong',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  'vancouver-west-side-bc': {
    neighborhoodId: 'vancouver-west-side-bc',
    neighborhoodName: 'West Side Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 3.8,
    priceChange3y: 4.5,
    priceChange5y: 5.1,
    priceVolatility: 9.5,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 4.2,
      probabilityOfAppreciation: 74,
      confidenceInterval: 1.3,
      upside: 7.5,
      downside: -1.5,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 4.5,
      probabilityOfAppreciation: 75,
      confidenceInterval: 1.9,
      upside: 8.8,
      downside: -2.2,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 4.0,
      probabilityOfAppreciation: 72,
      confidenceInterval: 2.6,
      upside: 8.8,
      downside: -3.8,
    },
    cyclePosition: {
      phaseName: 'Late Expansion',
      yearsInPhase: 2.5,
      phaseCompletion: 68,
      estimatedYearsRemaining: 1.1,
    },
    cycleMomentum: 'Steady',
    cycleMomentumScore: 32,
    riskAdjustedMetrics: {
      sharpeRatio: 0.44,
      volatility: 9.5,
      downsideProtection: 72,
      recoveryTime: 12,
    },
    outperformingCity: true,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Supply Constraint',
    secondaryDriver: 'Wealth Effect',
    riskFactors: ['Interest Rate Sensitivity', 'Market Saturation'],
    outlook: 'Moderate',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  'vancouver-east-bc': {
    neighborhoodId: 'vancouver-east-bc',
    neighborhoodName: 'East Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 5.2,
    priceChange3y: 5.8,
    priceChange5y: 6.2,
    priceVolatility: 11.2,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 5.8,
      probabilityOfAppreciation: 80,
      confidenceInterval: 1.5,
      upside: 9.5,
      downside: -1.2,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 6.2,
      probabilityOfAppreciation: 80,
      confidenceInterval: 2.1,
      upside: 11.2,
      downside: -2.0,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 5.2,
      probabilityOfAppreciation: 77,
      confidenceInterval: 2.9,
      upside: 11.5,
      downside: -3.8,
    },
    cyclePosition: {
      phaseName: 'Late Expansion',
      yearsInPhase: 3.1,
      phaseCompletion: 75,
      estimatedYearsRemaining: 0.6,
    },
    cycleMomentum: 'Accelerating',
    cycleMomentumScore: 52,
    riskAdjustedMetrics: {
      sharpeRatio: 0.52,
      volatility: 11.2,
      downsideProtection: 68,
      recoveryTime: 15,
    },
    outperformingCity: true,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Gentrification',
    secondaryDriver: 'Demand Growth',
    riskFactors: ['Cycle Peak Risk', 'Affordability Crisis'],
    outlook: 'Strong',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  'vancouver-north-shore-bc': {
    neighborhoodId: 'vancouver-north-shore-bc',
    neighborhoodName: 'North Shore',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 2.5,
    priceChange3y: 3.2,
    priceChange5y: 3.8,
    priceVolatility: 9.1,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 3.2,
      probabilityOfAppreciation: 68,
      confidenceInterval: 1.2,
      upside: 6.2,
      downside: -1.8,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 3.5,
      probabilityOfAppreciation: 70,
      confidenceInterval: 1.8,
      upside: 7.2,
      downside: -2.5,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 3.2,
      probabilityOfAppreciation: 68,
      confidenceInterval: 2.5,
      upside: 7.8,
      downside: -3.5,
    },
    cyclePosition: {
      phaseName: 'Early Expansion',
      yearsInPhase: 1.5,
      phaseCompletion: 40,
      estimatedYearsRemaining: 2.0,
    },
    cycleMomentum: 'Accelerating',
    cycleMomentumScore: 22,
    riskAdjustedMetrics: {
      sharpeRatio: 0.38,
      volatility: 9.1,
      downsideProtection: 68,
      recoveryTime: 14,
    },
    outperformingCity: false,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Demand Growth',
    secondaryDriver: 'Development',
    riskFactors: ['Supply Uncertainty', 'Market Saturation'],
    outlook: 'Balanced',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  // ===== MONTREAL APPRECIATION =====

  'montreal-downtown-qc': {
    neighborhoodId: 'montreal-downtown-qc',
    neighborhoodName: 'Downtown Montreal',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 2.2,
    priceChange3y: 2.8,
    priceChange5y: 3.2,
    priceVolatility: 7.8,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 2.8,
      probabilityOfAppreciation: 68,
      confidenceInterval: 1.1,
      upside: 5.2,
      downside: -1.5,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 3.2,
      probabilityOfAppreciation: 70,
      confidenceInterval: 1.6,
      upside: 6.8,
      downside: -2.2,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 2.8,
      probabilityOfAppreciation: 68,
      confidenceInterval: 2.3,
      upside: 6.8,
      downside: -3.2,
    },
    cyclePosition: {
      phaseName: 'Early Expansion',
      yearsInPhase: 1.8,
      phaseCompletion: 42,
      estimatedYearsRemaining: 2.1,
    },
    cycleMomentum: 'Accelerating',
    cycleMomentumScore: 15,
    riskAdjustedMetrics: {
      sharpeRatio: 0.40,
      volatility: 7.8,
      downsideProtection: 72,
      recoveryTime: 12,
    },
    outperformingCity: true,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Demand Growth',
    secondaryDriver: 'Revitalization',
    riskFactors: ['Interest Rate Sensitivity', 'Market Maturation'],
    outlook: 'Moderate',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  'montreal-plateau-qc': {
    neighborhoodId: 'montreal-plateau-qc',
    neighborhoodName: 'Plateau-Mont-Royal',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 3.5,
    priceChange3y: 3.8,
    priceChange5y: 4.2,
    priceVolatility: 8.5,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 3.8,
      probabilityOfAppreciation: 72,
      confidenceInterval: 1.2,
      upside: 6.5,
      downside: -1.2,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 4.0,
      probabilityOfAppreciation: 73,
      confidenceInterval: 1.7,
      upside: 7.5,
      downside: -1.8,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 3.5,
      probabilityOfAppreciation: 70,
      confidenceInterval: 2.4,
      upside: 7.8,
      downside: -3.0,
    },
    cyclePosition: {
      phaseName: 'Late Expansion',
      yearsInPhase: 2.2,
      phaseCompletion: 60,
      estimatedYearsRemaining: 1.5,
    },
    cycleMomentum: 'Steady',
    cycleMomentumScore: 28,
    riskAdjustedMetrics: {
      sharpeRatio: 0.46,
      volatility: 8.5,
      downsideProtection: 70,
      recoveryTime: 13,
    },
    outperformingCity: true,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Gentrification',
    secondaryDriver: 'Cultural Demand',
    riskFactors: ['Market Saturation', 'Lifestyle Trend Risk'],
    outlook: 'Moderate',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  'montreal-west-island-qc': {
    neighborhoodId: 'montreal-west-island-qc',
    neighborhoodName: 'West Island',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 0.2,
    priceChange3y: 0.8,
    priceChange5y: 1.2,
    priceVolatility: 9.8,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 0.5,
      probabilityOfAppreciation: 50,
      confidenceInterval: 1.5,
      upside: 3.2,
      downside: -3.8,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 1.2,
      probabilityOfAppreciation: 55,
      confidenceInterval: 2.1,
      upside: 4.8,
      downside: -4.5,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 1.5,
      probabilityOfAppreciation: 58,
      confidenceInterval: 2.7,
      upside: 5.5,
      downside: -5.2,
    },
    cyclePosition: {
      phaseName: 'Contraction',
      yearsInPhase: 2.0,
      phaseCompletion: 50,
      estimatedYearsRemaining: 2.0,
    },
    cycleMomentum: 'Decelerating',
    cycleMomentumScore: -18,
    riskAdjustedMetrics: {
      sharpeRatio: 0.18,
      volatility: 9.8,
      downsideProtection: 52,
      recoveryTime: 22,
    },
    outperformingCity: false,
    outperformingRegion: false,
    outperformingNational: false,
    primaryDriver: 'Mean Reversion',
    secondaryDriver: 'Inventory Oversupply',
    riskFactors: ['Weak Demand', 'Affordability Crisis', 'Population Flight'],
    outlook: 'Weak',
    source: `${DATA_SOURCES.STATCAN}, Price Index Analysis`,
    confidence: 'high',
  },

  // ===== US APPRECIATION (Sample) =====

  'austin-downtown-tx': {
    neighborhoodId: 'austin-downtown-tx',
    neighborhoodName: 'Downtown Austin',
    cityId: 'austin-tx',
    regionId: 'us-south',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 8.5,
    priceChange3y: 9.2,
    priceChange5y: 8.8,
    priceVolatility: 13.5,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 7.2,
      probabilityOfAppreciation: 82,
      confidenceInterval: 1.8,
      upside: 11.2,
      downside: -0.8,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 6.8,
      probabilityOfAppreciation: 80,
      confidenceInterval: 2.3,
      upside: 11.8,
      downside: -1.5,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 5.5,
      probabilityOfAppreciation: 75,
      confidenceInterval: 3.2,
      upside: 11.2,
      downside: -3.2,
    },
    cyclePosition: {
      phaseName: 'Late Expansion',
      yearsInPhase: 3.2,
      phaseCompletion: 78,
      estimatedYearsRemaining: 0.5,
    },
    cycleMomentum: 'Decelerating',
    cycleMomentumScore: 48,
    riskAdjustedMetrics: {
      sharpeRatio: 0.55,
      volatility: 13.5,
      downsideProtection: 62,
      recoveryTime: 18,
    },
    outperformingCity: true,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Tech Migration',
    secondaryDriver: 'Demand Growth',
    riskFactors: ['Cycle Peak Risk', 'Affordability Crisis', 'Oversupply Risk'],
    outlook: 'Strong',
    source: `${DATA_SOURCES.FRED}, Price Index Analysis`,
    confidence: 'high',
  },

  'san-francisco-downtown-ca': {
    neighborhoodId: 'san-francisco-downtown-ca',
    neighborhoodName: 'SOMA / Downtown',
    cityId: 'san-francisco-ca',
    regionId: 'us-west',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: -3.2,
    priceChange3y: -1.5,
    priceChange5y: 0.8,
    priceVolatility: 15.2,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: -0.8,
      probabilityOfAppreciation: 42,
      confidenceInterval: 2.5,
      upside: 3.8,
      downside: -6.2,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 0.5,
      probabilityOfAppreciation: 48,
      confidenceInterval: 3.2,
      upside: 6.2,
      downside: -8.5,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 1.2,
      probabilityOfAppreciation: 52,
      confidenceInterval: 3.8,
      upside: 8.2,
      downside: -10.2,
    },
    cyclePosition: {
      phaseName: 'Contraction',
      yearsInPhase: 2.5,
      phaseCompletion: 55,
      estimatedYearsRemaining: 1.8,
    },
    cycleMomentum: 'Reversing',
    cycleMomentumScore: -68,
    riskAdjustedMetrics: {
      sharpeRatio: -0.05,
      volatility: 15.2,
      downsideProtection: 35,
      recoveryTime: 32,
    },
    outperformingCity: false,
    outperformingRegion: false,
    outperformingNational: false,
    primaryDriver: 'Remote Work Shift',
    secondaryDriver: 'Tech Downturn',
    riskFactors: ['Continued Decline Risk', 'Office Vacancy', 'Affordability Collapse'],
    outlook: 'Weak',
    source: `${DATA_SOURCES.FRED}, Price Index Analysis`,
    confidence: 'high',
  },

  'denver-downtown-co': {
    neighborhoodId: 'denver-downtown-co',
    neighborhoodName: 'Downtown Denver',
    cityId: 'denver-co',
    regionId: 'us-west',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 4.8,
    priceChange3y: 5.5,
    priceChange5y: 5.8,
    priceVolatility: 11.2,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 4.2,
      probabilityOfAppreciation: 72,
      confidenceInterval: 1.6,
      upside: 7.8,
      downside: -1.8,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 4.5,
      probabilityOfAppreciation: 73,
      confidenceInterval: 2.1,
      upside: 8.8,
      downside: -2.5,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 3.8,
      probabilityOfAppreciation: 70,
      confidenceInterval: 2.8,
      upside: 8.5,
      downside: -3.8,
    },
    cyclePosition: {
      phaseName: 'Late Expansion',
      yearsInPhase: 2.8,
      phaseCompletion: 70,
      estimatedYearsRemaining: 0.9,
    },
    cycleMomentum: 'Steady',
    cycleMomentumScore: 35,
    riskAdjustedMetrics: {
      sharpeRatio: 0.42,
      volatility: 11.2,
      downsideProtection: 65,
      recoveryTime: 16,
    },
    outperformingCity: true,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Migration Inflow',
    secondaryDriver: 'Supply Constraint',
    riskFactors: ['Cycle Peak Risk', 'Affordability Crisis'],
    outlook: 'Moderate',
    source: `${DATA_SOURCES.FRED}, Price Index Analysis`,
    confidence: 'high',
  },

  'miami-brickell-fl': {
    neighborhoodId: 'miami-brickell-fl',
    neighborhoodName: 'Brickell',
    cityId: 'miami-fl',
    regionId: 'us-south',
    asOfDate: new Date('2026-08-04'),
    priceChange1y: 6.2,
    priceChange3y: 6.8,
    priceChange5y: 6.5,
    priceVolatility: 12.0,
    forecast1y: {
      timeframe: '1 Year',
      expectedAppreciation: 5.5,
      probabilityOfAppreciation: 76,
      confidenceInterval: 1.7,
      upside: 9.2,
      downside: -1.5,
    },
    forecast3y: {
      timeframe: '3 Year',
      expectedAppreciation: 5.2,
      probabilityOfAppreciation: 75,
      confidenceInterval: 2.2,
      upside: 9.8,
      downside: -2.2,
    },
    forecast5y: {
      timeframe: '5 Year',
      expectedAppreciation: 4.2,
      probabilityOfAppreciation: 70,
      confidenceInterval: 2.9,
      upside: 9.2,
      downside: -3.8,
    },
    cyclePosition: {
      phaseName: 'Late Expansion',
      yearsInPhase: 2.6,
      phaseCompletion: 68,
      estimatedYearsRemaining: 1.1,
    },
    cycleMomentum: 'Steady',
    cycleMomentumScore: 38,
    riskAdjustedMetrics: {
      sharpeRatio: 0.48,
      volatility: 12.0,
      downsideProtection: 64,
      recoveryTime: 17,
    },
    outperformingCity: true,
    outperformingRegion: true,
    outperformingNational: true,
    primaryDriver: 'Immigration Demand',
    secondaryDriver: 'Development',
    riskFactors: ['Interest Rate Sensitivity', 'Cycle Peak Risk'],
    outlook: 'Strong',
    source: `${DATA_SOURCES.FRED}, Price Index Analysis`,
    confidence: 'high',
  },
};

/**
 * Fetch appreciation probability metrics for a neighborhood
 *
 * @param input Neighborhood ID, city ID, region ID, and optional date
 * @returns Appreciation probability metrics
 * @throws Error if neighborhood not found
 */
export function appreciationProbability(input: AppreciationProbabilityInput): AppreciationProbabilityOutput {
  const { neighborhoodId, asOfDate } = input;

  const validatedDate = validateDateOrUseToday(asOfDate);

  const mockData = MOCK_DATA[neighborhoodId];
  if (!mockData) {
    throw new Error(`No appreciation probability data available for neighborhood "${neighborhoodId}".`);
  }

  return {
    ...mockData,
    asOfDate: validatedDate,
  };
}

export default appreciationProbability;
