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
 * E41: Market Cycle Indicator Engine
 *
 * Identifies market cycle phases and predicts turning points.
 * Capstone of Composite & Predictive layer showing:
 * - Current cycle phase (expansion, peak, contraction, trough)
 * - Cycle maturity (how far through phase)
 * - Leading indicators (what's coming)
 * - Turning point probability
 * - Cycle length analysis
 * - Risk/opportunity assessment
 *
 * Dependencies:
 * - E30: City-Level Market Analysis
 * - E37: Market Velocity Analyzer
 * - E38: Macro-to-Micro Sensitivity
 * - E39: Mortgage Rate Forecast
 * - E40: Appreciation Probability
 */

import { validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * Leading indicator assessment
 */
export interface LeadingIndicator {
  name: string;                   // e.g., "Inventory Buildup", "Rate Decline"
  signal: string;                 // "Bullish", "Neutral", "Bearish"
  magnitude: number;              // -100 to 100 (strength of signal)
  leadTimeMonths: number;         // how many months ahead it leads price
}

/**
 * Cycle turning point assessment
 */
export interface TurningPointAnalysis {
  nextPhase: string;              // "Expansion", "Peak", "Contraction", "Trough"
  monthsUntilTurning: number;     // estimated months
  probabilityPercent: number;     // confidence % (0-100)
  triggerFactors: string[];       // what would cause turning point
}

/**
 * Market cycle metrics
 */
export interface MarketCycleMetrics {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  regionId: string;
  asOfDate: Date;

  // Current cycle phase
  currentPhase: string;           // "Early Expansion", "Late Expansion", "Peak", "Contraction", "Trough"
  phaseStartDate: Date;           // when current phase began
  yearsInPhase: number;           // how long in this phase
  phaseMaturity: number;          // 0-100 (completion % of phase)

  // Phase characteristics
  phaseName: string;              // human-readable phase name
  cycleHealth: string;            // "Strong", "Healthy", "Mature", "Weak", "Distressed"

  // Historical cycle metrics
  averageCycleLength: number;     // years (typical cycle duration)
  averagePhaseLength: number;     // years (typical phase duration)
  cyclesObserved: number;         // number of complete cycles in history

  // Leading indicators (3 key ones)
  leadingIndicators: LeadingIndicator[];

  // Turning point analysis
  turningPoint: TurningPointAnalysis;

  // Cycle momentum
  cycleMomentum: string;          // "Accelerating", "Steady", "Decelerating", "Reversing"
  momentumScore: number;          // -100 to 100 (negative = declining, positive = growing)

  // Risk/opportunity assessment
  currentRiskLevel: number;       // 0-100 (0 = low risk, 100 = high risk)
  opportunityScore: number;       // 0-100 (0 = limited upside, 100 = strong upside)

  // Scenario probabilities (3 scenarios)
  softLandingProbability: number; // smooth transition to new phase
  hardLandingProbability: number; // sharp downturn
  continuationProbability: number; // stays in current phase longer

  // Investment implications
  investmentTiming: string;       // "Early", "Mid-Cycle", "Late-Cycle", "Peak", "Recovery"
  recommendedStrategy: string;    // "Aggressive", "Balanced", "Defensive", "Wait"

  // Cycle warnings
  warningFlags: string[];         // ["Affordability Crisis", "Rate Shock Risk", etc]

  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface MarketCycleInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  regionId: string;
  asOfDate?: Date;
}

export interface MarketCycleOutput extends MarketCycleMetrics {}

/**
 * Mock market cycle data store.
 *
 * In production, this:
 * - Analyzes historical price cycles to determine phase
 * - Measures current indicators against historical averages
 * - Runs regime-switching models to assess cycle state
 * - Projects turning points using leading indicators
 *
 * For now, realistic fixtures representing Aug 4, 2026 data.
 */
interface MockCycleData {
  [neighborhoodId: string]: MarketCycleMetrics;
}

const MOCK_DATA: MockCycleData = {
  // ===== TORONTO CYCLE =====

  'toronto-yorkville-on': {
    neighborhoodId: 'toronto-yorkville-on',
    neighborhoodName: 'Yorkville',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Late Expansion',
    phaseStartDate: new Date('2024-06-01'),
    yearsInPhase: 2.2,
    phaseMaturity: 65,
    phaseName: 'Late Expansion - Strong Momentum',
    cycleHealth: 'Mature',
    averageCycleLength: 8.5,
    averagePhaseLength: 2.1,
    cyclesObserved: 4,
    leadingIndicators: [
      {
        name: 'Inventory Decline',
        signal: 'Bullish',
        magnitude: 42,
        leadTimeMonths: 6,
      },
      {
        name: 'Rate Decline Expected',
        signal: 'Bullish',
        magnitude: 35,
        leadTimeMonths: 3,
      },
      {
        name: 'Affordability Deterioration',
        signal: 'Bearish',
        magnitude: -28,
        leadTimeMonths: 9,
      },
    ],
    turningPoint: {
      nextPhase: 'Peak',
      monthsUntilTurning: 14,
      probabilityPercent: 62,
      triggerFactors: ['Affordability Crisis', 'Rate Shock', 'Economic Slowdown'],
    },
    cycleMomentum: 'Steady',
    momentumScore: 35,
    currentRiskLevel: 45,
    opportunityScore: 68,
    softLandingProbability: 55,
    hardLandingProbability: 18,
    continuationProbability: 27,
    investmentTiming: 'Mid-Cycle',
    recommendedStrategy: 'Balanced',
    warningFlags: ['Affordability Stress', 'Market Saturation'],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  'toronto-downtown-on': {
    neighborhoodId: 'toronto-downtown-on',
    neighborhoodName: 'Downtown Toronto',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Late Expansion',
    phaseStartDate: new Date('2024-04-01'),
    yearsInPhase: 2.4,
    phaseMaturity: 68,
    phaseName: 'Late Expansion - Peak Risk',
    cycleHealth: 'Mature',
    averageCycleLength: 8.5,
    averagePhaseLength: 2.1,
    cyclesObserved: 4,
    leadingIndicators: [
      {
        name: 'Absorption Rate Decline',
        signal: 'Bearish',
        magnitude: -38,
        leadTimeMonths: 6,
      },
      {
        name: 'Price Growth Slowing',
        signal: 'Bearish',
        magnitude: -35,
        leadTimeMonths: 4,
      },
      {
        name: 'Investor Exit Signals',
        signal: 'Bearish',
        magnitude: -42,
        leadTimeMonths: 8,
      },
    ],
    turningPoint: {
      nextPhase: 'Peak',
      monthsUntilTurning: 10,
      probabilityPercent: 72,
      triggerFactors: ['Rate Shock', 'Affordability Crisis', 'Economic Slowdown'],
    },
    cycleMomentum: 'Decelerating',
    momentumScore: 18,
    currentRiskLevel: 62,
    opportunityScore: 52,
    softLandingProbability: 42,
    hardLandingProbability: 28,
    continuationProbability: 30,
    investmentTiming: 'Late-Cycle',
    recommendedStrategy: 'Defensive',
    warningFlags: ['Peak Risk', 'Affordability Crisis', 'Momentum Loss'],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  'toronto-scarborough-on': {
    neighborhoodId: 'toronto-scarborough-on',
    neighborhoodName: 'Scarborough',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Contraction',
    phaseStartDate: new Date('2024-12-01'),
    yearsInPhase: 1.7,
    phaseMaturity: 45,
    phaseName: 'Contraction - Early Stage',
    cycleHealth: 'Weak',
    averageCycleLength: 8.5,
    averagePhaseLength: 2.1,
    cyclesObserved: 4,
    leadingIndicators: [
      {
        name: 'Inventory Surge',
        signal: 'Bearish',
        magnitude: -68,
        leadTimeMonths: 3,
      },
      {
        name: 'Price Decline',
        signal: 'Bearish',
        magnitude: -75,
        leadTimeMonths: 2,
      },
      {
        name: 'Days-to-Sale Rising',
        signal: 'Bearish',
        magnitude: -62,
        leadTimeMonths: 4,
      },
    ],
    turningPoint: {
      nextPhase: 'Trough',
      monthsUntilTurning: 18,
      probabilityPercent: 68,
      triggerFactors: ['Rate Cuts Begin', 'Inventory Absorption', 'Affordability Recovery'],
    },
    cycleMomentum: 'Reversing',
    momentumScore: -55,
    currentRiskLevel: 72,
    opportunityScore: 35,
    softLandingProbability: 32,
    hardLandingProbability: 48,
    continuationProbability: 20,
    investmentTiming: 'Recovery',
    recommendedStrategy: 'Wait',
    warningFlags: ['Contraction Active', 'Inventory Buildup', 'Weak Demand'],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  'toronto-north-york-on': {
    neighborhoodId: 'toronto-north-york-on',
    neighborhoodName: 'North York',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Early Expansion',
    phaseStartDate: new Date('2025-08-01'),
    yearsInPhase: 1.0,
    phaseMaturity: 32,
    phaseName: 'Early Expansion - Building Momentum',
    cycleHealth: 'Healthy',
    averageCycleLength: 8.5,
    averagePhaseLength: 2.1,
    cyclesObserved: 4,
    leadingIndicators: [
      {
        name: 'Absorption Rate Rising',
        signal: 'Bullish',
        magnitude: 45,
        leadTimeMonths: 5,
      },
      {
        name: 'Buyer Confidence Improving',
        signal: 'Bullish',
        magnitude: 38,
        leadTimeMonths: 6,
      },
      {
        name: 'New Construction Starts',
        signal: 'Bullish',
        magnitude: 32,
        leadTimeMonths: 8,
      },
    ],
    turningPoint: {
      nextPhase: 'Late Expansion',
      monthsUntilTurning: 22,
      probabilityPercent: 58,
      triggerFactors: ['Continued Rate Cuts', 'Supply Recovery', 'Affordability Improvement'],
    },
    cycleMomentum: 'Accelerating',
    momentumScore: 42,
    currentRiskLevel: 32,
    opportunityScore: 75,
    softLandingProbability: 68,
    hardLandingProbability: 12,
    continuationProbability: 20,
    investmentTiming: 'Early',
    recommendedStrategy: 'Aggressive',
    warningFlags: [],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  'toronto-etobicoke-on': {
    neighborhoodId: 'toronto-etobicoke-on',
    neighborhoodName: 'Etobicoke',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Contraction',
    phaseStartDate: new Date('2025-02-01'),
    yearsInPhase: 1.5,
    phaseMaturity: 42,
    phaseName: 'Contraction - Mid Stage',
    cycleHealth: 'Weak',
    averageCycleLength: 8.5,
    averagePhaseLength: 2.1,
    cyclesObserved: 4,
    leadingIndicators: [
      {
        name: 'Inventory Building',
        signal: 'Bearish',
        magnitude: -55,
        leadTimeMonths: 4,
      },
      {
        name: 'Price Softness',
        signal: 'Bearish',
        magnitude: -48,
        leadTimeMonths: 3,
      },
      {
        name: 'Affordability Stress',
        signal: 'Bearish',
        magnitude: -38,
        leadTimeMonths: 5,
      },
    ],
    turningPoint: {
      nextPhase: 'Trough',
      monthsUntilTurning: 20,
      probabilityPercent: 65,
      triggerFactors: ['Significant Rate Cuts', 'Employment Growth', 'Inventory Clearing'],
    },
    cycleMomentum: 'Decelerating',
    momentumScore: -42,
    currentRiskLevel: 68,
    opportunityScore: 42,
    softLandingProbability: 38,
    hardLandingProbability: 42,
    continuationProbability: 20,
    investmentTiming: 'Recovery',
    recommendedStrategy: 'Defensive',
    warningFlags: ['Contraction Ongoing', 'Weak Sentiment'],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  // ===== VANCOUVER CYCLE =====

  'vancouver-downtown-bc': {
    neighborhoodId: 'vancouver-downtown-bc',
    neighborhoodName: 'Downtown Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Late Expansion',
    phaseStartDate: new Date('2024-02-01'),
    yearsInPhase: 2.5,
    phaseMaturity: 72,
    phaseName: 'Late Expansion - Peak Approaching',
    cycleHealth: 'Mature',
    averageCycleLength: 8.2,
    averagePhaseLength: 2.0,
    cyclesObserved: 5,
    leadingIndicators: [
      {
        name: 'Price Momentum Slowing',
        signal: 'Bearish',
        magnitude: -32,
        leadTimeMonths: 5,
      },
      {
        name: 'Affordability Deterioration',
        signal: 'Bearish',
        magnitude: -48,
        leadTimeMonths: 8,
      },
      {
        name: 'Foreign Buyer Uncertainty',
        signal: 'Bearish',
        magnitude: -35,
        leadTimeMonths: 6,
      },
    ],
    turningPoint: {
      nextPhase: 'Peak',
      monthsUntilTurning: 8,
      probabilityPercent: 78,
      triggerFactors: ['Affordability Ceiling', 'Rate Shock', 'Policy Changes'],
    },
    cycleMomentum: 'Decelerating',
    momentumScore: 22,
    currentRiskLevel: 68,
    opportunityScore: 45,
    softLandingProbability: 48,
    hardLandingProbability: 32,
    continuationProbability: 20,
    investmentTiming: 'Late-Cycle',
    recommendedStrategy: 'Defensive',
    warningFlags: ['Peak Risk', 'Affordability Crisis', 'Policy Risk'],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  'vancouver-west-side-bc': {
    neighborhoodId: 'vancouver-west-side-bc',
    neighborhoodName: 'West Side Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Late Expansion',
    phaseStartDate: new Date('2024-05-01'),
    yearsInPhase: 2.3,
    phaseMaturity: 68,
    phaseName: 'Late Expansion - Strong But Maturing',
    cycleHealth: 'Mature',
    averageCycleLength: 8.2,
    averagePhaseLength: 2.0,
    cyclesObserved: 5,
    leadingIndicators: [
      {
        name: 'Inventory Plateau',
        signal: 'Neutral',
        magnitude: 0,
        leadTimeMonths: 0,
      },
      {
        name: 'Rate Environment Stabilizing',
        signal: 'Bullish',
        magnitude: 28,
        leadTimeMonths: 4,
      },
      {
        name: 'Demand Steady',
        signal: 'Neutral',
        magnitude: 8,
        leadTimeMonths: 2,
      },
    ],
    turningPoint: {
      nextPhase: 'Peak',
      monthsUntilTurning: 16,
      probabilityPercent: 62,
      triggerFactors: ['Affordability Stress', 'Supply Increase', 'Rate Shock'],
    },
    cycleMomentum: 'Steady',
    momentumScore: 32,
    currentRiskLevel: 52,
    opportunityScore: 62,
    softLandingProbability: 58,
    hardLandingProbability: 20,
    continuationProbability: 22,
    investmentTiming: 'Mid-Cycle',
    recommendedStrategy: 'Balanced',
    warningFlags: ['Affordability Stress'],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  'vancouver-east-bc': {
    neighborhoodId: 'vancouver-east-bc',
    neighborhoodName: 'East Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Late Expansion',
    phaseStartDate: new Date('2023-09-01'),
    yearsInPhase: 2.9,
    phaseMaturity: 78,
    phaseName: 'Late Expansion - Peak Imminent',
    cycleHealth: 'Mature',
    averageCycleLength: 8.2,
    averagePhaseLength: 2.0,
    cyclesObserved: 5,
    leadingIndicators: [
      {
        name: 'Rapid Price Growth Unsustainable',
        signal: 'Bearish',
        magnitude: -58,
        leadTimeMonths: 5,
      },
      {
        name: 'Gentrification Reaching Limits',
        signal: 'Bearish',
        magnitude: -45,
        leadTimeMonths: 7,
      },
      {
        name: 'Affordability Crisis Peak',
        signal: 'Bearish',
        magnitude: -62,
        leadTimeMonths: 6,
      },
    ],
    turningPoint: {
      nextPhase: 'Peak',
      monthsUntilTurning: 6,
      probabilityPercent: 85,
      triggerFactors: ['Affordability Ceiling Hit', 'Economic Shock', 'Supply Surge'],
    },
    cycleMomentum: 'Reversing',
    momentumScore: -35,
    currentRiskLevel: 78,
    opportunityScore: 32,
    softLandingProbability: 38,
    hardLandingProbability: 48,
    continuationProbability: 14,
    investmentTiming: 'Peak',
    recommendedStrategy: 'Defensive',
    warningFlags: ['Peak Imminent', 'Affordability Crisis', 'Momentum Reversing'],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  'vancouver-north-shore-bc': {
    neighborhoodId: 'vancouver-north-shore-bc',
    neighborhoodName: 'North Shore',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Early Expansion',
    phaseStartDate: new Date('2025-10-01'),
    yearsInPhase: 0.8,
    phaseMaturity: 28,
    phaseName: 'Early Expansion - Building',
    cycleHealth: 'Healthy',
    averageCycleLength: 8.2,
    averagePhaseLength: 2.0,
    cyclesObserved: 5,
    leadingIndicators: [
      {
        name: 'Absorption Improving',
        signal: 'Bullish',
        magnitude: 42,
        leadTimeMonths: 6,
      },
      {
        name: 'Inventory Declining',
        signal: 'Bullish',
        magnitude: 38,
        leadTimeMonths: 5,
      },
      {
        name: 'Buyer Confidence Growing',
        signal: 'Bullish',
        magnitude: 35,
        leadTimeMonths: 7,
      },
    ],
    turningPoint: {
      nextPhase: 'Late Expansion',
      monthsUntilTurning: 20,
      probabilityPercent: 60,
      triggerFactors: ['Continued Rate Cuts', 'Affordability Improvement', 'Supply Constraint'],
    },
    cycleMomentum: 'Accelerating',
    momentumScore: 45,
    currentRiskLevel: 28,
    opportunityScore: 78,
    softLandingProbability: 72,
    hardLandingProbability: 10,
    continuationProbability: 18,
    investmentTiming: 'Early',
    recommendedStrategy: 'Aggressive',
    warningFlags: [],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  // ===== MONTREAL CYCLE =====

  'montreal-downtown-qc': {
    neighborhoodId: 'montreal-downtown-qc',
    neighborhoodName: 'Downtown Montreal',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Early Expansion',
    phaseStartDate: new Date('2025-06-01'),
    yearsInPhase: 1.2,
    phaseMaturity: 38,
    phaseName: 'Early Expansion - Revitalization',
    cycleHealth: 'Healthy',
    averageCycleLength: 8.3,
    averagePhaseLength: 2.1,
    cyclesObserved: 4,
    leadingIndicators: [
      {
        name: 'Downtown Revitalization',
        signal: 'Bullish',
        magnitude: 52,
        leadTimeMonths: 8,
      },
      {
        name: 'Investment Inflows',
        signal: 'Bullish',
        magnitude: 42,
        leadTimeMonths: 6,
      },
      {
        name: 'Demand Growing',
        signal: 'Bullish',
        magnitude: 38,
        leadTimeMonths: 5,
      },
    ],
    turningPoint: {
      nextPhase: 'Late Expansion',
      monthsUntilTurning: 20,
      probabilityPercent: 55,
      triggerFactors: ['Continued Investment', 'Supply Growth', 'Rate Stability'],
    },
    cycleMomentum: 'Accelerating',
    momentumScore: 48,
    currentRiskLevel: 30,
    opportunityScore: 76,
    softLandingProbability: 70,
    hardLandingProbability: 12,
    continuationProbability: 18,
    investmentTiming: 'Early',
    recommendedStrategy: 'Aggressive',
    warningFlags: [],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  'montreal-plateau-qc': {
    neighborhoodId: 'montreal-plateau-qc',
    neighborhoodName: 'Plateau-Mont-Royal',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Late Expansion',
    phaseStartDate: new Date('2024-08-01'),
    yearsInPhase: 2.0,
    phaseMaturity: 60,
    phaseName: 'Late Expansion - Sustained Strength',
    cycleHealth: 'Mature',
    averageCycleLength: 8.3,
    averagePhaseLength: 2.1,
    cyclesObserved: 4,
    leadingIndicators: [
      {
        name: 'Cultural Demand Stable',
        signal: 'Neutral',
        magnitude: 12,
        leadTimeMonths: 2,
      },
      {
        name: 'Gentrification Plateauing',
        signal: 'Bearish',
        magnitude: -28,
        leadTimeMonths: 6,
      },
      {
        name: 'Price Growth Slowing',
        signal: 'Bearish',
        magnitude: -22,
        leadTimeMonths: 4,
      },
    ],
    turningPoint: {
      nextPhase: 'Peak',
      monthsUntilTurning: 18,
      probabilityPercent: 60,
      triggerFactors: ['Market Saturation', 'Affordability Stress', 'Lifestyle Trend Shift'],
    },
    cycleMomentum: 'Steady',
    momentumScore: 28,
    currentRiskLevel: 48,
    opportunityScore: 62,
    softLandingProbability: 60,
    hardLandingProbability: 18,
    continuationProbability: 22,
    investmentTiming: 'Mid-Cycle',
    recommendedStrategy: 'Balanced',
    warningFlags: ['Market Saturation', 'Growth Slowing'],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  'montreal-west-island-qc': {
    neighborhoodId: 'montreal-west-island-qc',
    neighborhoodName: 'West Island',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Contraction',
    phaseStartDate: new Date('2024-10-01'),
    yearsInPhase: 1.8,
    phaseMaturity: 48,
    phaseName: 'Contraction - Mid Stage',
    cycleHealth: 'Weak',
    averageCycleLength: 8.3,
    averagePhaseLength: 2.1,
    cyclesObserved: 4,
    leadingIndicators: [
      {
        name: 'Population Flight',
        signal: 'Bearish',
        magnitude: -65,
        leadTimeMonths: 8,
      },
      {
        name: 'Affordability Collapse',
        signal: 'Bearish',
        magnitude: -72,
        leadTimeMonths: 6,
      },
      {
        name: 'Weak Local Demand',
        signal: 'Bearish',
        magnitude: -58,
        leadTimeMonths: 4,
      },
    ],
    turningPoint: {
      nextPhase: 'Trough',
      monthsUntilTurning: 16,
      probabilityPercent: 70,
      triggerFactors: ['Market Bottom Formation', 'Rate Cuts', 'New Buyer Entry'],
    },
    cycleMomentum: 'Reversing',
    momentumScore: -62,
    currentRiskLevel: 78,
    opportunityScore: 28,
    softLandingProbability: 28,
    hardLandingProbability: 58,
    continuationProbability: 14,
    investmentTiming: 'Recovery',
    recommendedStrategy: 'Wait',
    warningFlags: ['Contraction Severe', 'Population Loss', 'Affordability Crisis'],
    source: `${DATA_SOURCES.STATCAN}, Cycle Analysis`,
    confidence: 'high',
  },

  // ===== US CYCLE (Sample) =====

  'austin-downtown-tx': {
    neighborhoodId: 'austin-downtown-tx',
    neighborhoodName: 'Downtown Austin',
    cityId: 'austin-tx',
    regionId: 'us-south',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Late Expansion',
    phaseStartDate: new Date('2023-03-01'),
    yearsInPhase: 3.4,
    phaseMaturity: 82,
    phaseName: 'Late Expansion - Extreme Maturity',
    cycleHealth: 'Mature',
    averageCycleLength: 8.0,
    averagePhaseLength: 2.0,
    cyclesObserved: 5,
    leadingIndicators: [
      {
        name: 'Tech Sector Plateau',
        signal: 'Bearish',
        magnitude: -55,
        leadTimeMonths: 6,
      },
      {
        name: 'Population Inflow Slowing',
        signal: 'Bearish',
        magnitude: -42,
        leadTimeMonths: 7,
      },
      {
        name: 'Affordability Crisis Peak',
        signal: 'Bearish',
        magnitude: -68,
        leadTimeMonths: 5,
      },
    ],
    turningPoint: {
      nextPhase: 'Peak',
      monthsUntilTurning: 4,
      probabilityPercent: 88,
      triggerFactors: ['Affordability Ceiling', 'Tech Downturn', 'Remote Work Reversal'],
    },
    cycleMomentum: 'Reversing',
    momentumScore: -48,
    currentRiskLevel: 82,
    opportunityScore: 28,
    softLandingProbability: 32,
    hardLandingProbability: 58,
    continuationProbability: 10,
    investmentTiming: 'Peak',
    recommendedStrategy: 'Exit',
    warningFlags: ['Peak Imminent', 'Affordability Crisis', 'Momentum Reversing', 'Oversupply Risk'],
    source: `${DATA_SOURCES.FRED}, Cycle Analysis`,
    confidence: 'high',
  },

  'san-francisco-downtown-ca': {
    neighborhoodId: 'san-francisco-downtown-ca',
    neighborhoodName: 'SOMA / Downtown',
    cityId: 'san-francisco-ca',
    regionId: 'us-west',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Contraction',
    phaseStartDate: new Date('2024-06-01'),
    yearsInPhase: 2.2,
    phaseMaturity: 58,
    phaseName: 'Contraction - Deep Downturn',
    cycleHealth: 'Distressed',
    averageCycleLength: 8.5,
    averagePhaseLength: 2.1,
    cyclesObserved: 4,
    leadingIndicators: [
      {
        name: 'Remote Work Permanent',
        signal: 'Bearish',
        magnitude: -78,
        leadTimeMonths: 4,
      },
      {
        name: 'Office Vacancy Surge',
        signal: 'Bearish',
        magnitude: -85,
        leadTimeMonths: 3,
      },
      {
        name: 'Tech Sector Weakness',
        signal: 'Bearish',
        magnitude: -72,
        leadTimeMonths: 5,
      },
    ],
    turningPoint: {
      nextPhase: 'Trough',
      monthsUntilTurning: 14,
      probabilityPercent: 75,
      triggerFactors: ['Market Bottom', 'Remote Work Reversal', 'Tech Recovery'],
    },
    cycleMomentum: 'Accelerating Downward',
    momentumScore: -78,
    currentRiskLevel: 88,
    opportunityScore: 18,
    softLandingProbability: 18,
    hardLandingProbability: 75,
    continuationProbability: 7,
    investmentTiming: 'Recovery',
    recommendedStrategy: 'Wait',
    warningFlags: ['Severe Contraction', 'Structural Change', 'Long Recovery Needed'],
    source: `${DATA_SOURCES.FRED}, Cycle Analysis`,
    confidence: 'high',
  },

  'denver-downtown-co': {
    neighborhoodId: 'denver-downtown-co',
    neighborhoodName: 'Downtown Denver',
    cityId: 'denver-co',
    regionId: 'us-west',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Late Expansion',
    phaseStartDate: new Date('2024-03-01'),
    yearsInPhase: 2.4,
    phaseMaturity: 70,
    phaseName: 'Late Expansion - Migration Driven',
    cycleHealth: 'Mature',
    averageCycleLength: 8.0,
    averagePhaseLength: 2.0,
    cyclesObserved: 5,
    leadingIndicators: [
      {
        name: 'Migration Inflow Steady',
        signal: 'Bullish',
        magnitude: 38,
        leadTimeMonths: 6,
      },
      {
        name: 'Supply Constraint Tightening',
        signal: 'Bullish',
        magnitude: 32,
        leadTimeMonths: 7,
      },
      {
        name: 'Affordability Stress Growing',
        signal: 'Bearish',
        magnitude: -42,
        leadTimeMonths: 8,
      },
    ],
    turningPoint: {
      nextPhase: 'Peak',
      monthsUntilTurning: 14,
      probabilityPercent: 65,
      triggerFactors: ['Affordability Ceiling', 'Rate Shock', 'Migration Slowdown'],
    },
    cycleMomentum: 'Steady',
    momentumScore: 35,
    currentRiskLevel: 58,
    opportunityScore: 58,
    softLandingProbability: 58,
    hardLandingProbability: 22,
    continuationProbability: 20,
    investmentTiming: 'Mid-Cycle',
    recommendedStrategy: 'Balanced',
    warningFlags: ['Affordability Stress', 'Cycle Maturity'],
    source: `${DATA_SOURCES.FRED}, Cycle Analysis`,
    confidence: 'high',
  },

  'miami-brickell-fl': {
    neighborhoodId: 'miami-brickell-fl',
    neighborhoodName: 'Brickell',
    cityId: 'miami-fl',
    regionId: 'us-south',
    asOfDate: new Date('2026-08-04'),
    currentPhase: 'Late Expansion',
    phaseStartDate: new Date('2024-01-01'),
    yearsInPhase: 2.6,
    phaseMaturity: 75,
    phaseName: 'Late Expansion - Immigration Fueled',
    cycleHealth: 'Mature',
    averageCycleLength: 8.0,
    averagePhaseLength: 2.0,
    cyclesObserved: 5,
    leadingIndicators: [
      {
        name: 'Immigration Demand Strong',
        signal: 'Bullish',
        magnitude: 48,
        leadTimeMonths: 8,
      },
      {
        name: 'Supply Growth Accelerating',
        signal: 'Neutral',
        magnitude: 8,
        leadTimeMonths: 6,
      },
      {
        name: 'Rate Sensitivity High',
        signal: 'Bearish',
        magnitude: -35,
        leadTimeMonths: 5,
      },
    ],
    turningPoint: {
      nextPhase: 'Peak',
      monthsUntilTurning: 12,
      probabilityPercent: 68,
      triggerFactors: ['Rate Shock', 'Affordability Crisis', 'Supply Surge'],
    },
    cycleMomentum: 'Steady',
    momentumScore: 42,
    currentRiskLevel: 55,
    opportunityScore: 62,
    softLandingProbability: 58,
    hardLandingProbability: 22,
    continuationProbability: 20,
    investmentTiming: 'Mid-Cycle',
    recommendedStrategy: 'Balanced',
    warningFlags: ['Affordability Stress', 'Cycle Maturity'],
    source: `${DATA_SOURCES.FRED}, Cycle Analysis`,
    confidence: 'high',
  },
};

/**
 * Fetch market cycle metrics for a neighborhood
 *
 * @param input Neighborhood ID, city ID, region ID, and optional date
 * @returns Market cycle metrics
 * @throws Error if neighborhood not found
 */
export function marketCycleIndicator(input: MarketCycleInput): MarketCycleOutput {
  const { neighborhoodId, asOfDate } = input;

  const validatedDate = validateDateOrUseToday(asOfDate);

  const mockData = MOCK_DATA[neighborhoodId];
  if (!mockData) {
    throw new Error(`No market cycle data available for neighborhood "${neighborhoodId}".`);
  }

  return {
    ...mockData,
    asOfDate: validatedDate,
  };
}

export default marketCycleIndicator;
