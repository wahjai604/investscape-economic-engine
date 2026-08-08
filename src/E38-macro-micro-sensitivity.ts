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
 * E38: Macro-to-Micro Sensitivity Engine
 *
 * Quantifies how macro-level (regional/city) economic factors impact
 * neighborhood-level real estate outcomes. Composite analysis measuring:
 * - Price sensitivity to macro shocks
 * - Rental sensitivity to economic conditions
 * - Market concentration (how much neighborhood depends on macro)
 * - Elasticity coefficients (% change in neighborhood for 1% macro change)
 * - Recession vulnerability
 * - Growth capture potential
 * - Diversification value
 *
 * Dependencies:
 * - E29: Regional Macro Context
 * - E30: City-Level Market Analysis
 * - E37: Market Velocity Analyzer
 * - Calc Engine (E1-E28): Return metrics for validation
 */

import { validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * Elasticity coefficients measuring sensitivity to macro changes
 */
export interface ElasticityCoefficients {
  priceToGDP: number;             // price % change per 1% GDP change
  priceToInterestRate: number;    // price % change per 1% interest rate change
  priceToUnemployment: number;    // price % change per 1% unemployment change
  rentToGDP: number;              // rent % change per 1% GDP change
  rentToUnemployment: number;     // rent % change per 1% unemployment change
  absorptionToGDP: number;        // absorption % change per 1% GDP change
  domToInterestRate: number;      // DOM days change per 1% interest rate change
}

/**
 * Historical correlation analysis
 */
export interface CorrelationMetrics {
  correlationWithRegion: number;  // 0-1.0 (how tightly tied to regional trends)
  correlationWithCity: number;    // 0-1.0 (how tightly tied to city trends)
  correlationWithNational: number; // 0-1.0 (how tightly tied to national trends)
  beta: number;                   // market beta (1.0 = market average, >1 = amplified)
}

/**
 * Concentration and diversification metrics
 */
export interface ConcentrationMetrics {
  jobConcentration: number;       // % of jobs in top 3 sectors
  employerConcentration: number;  // % of jobs in top 5 employers
  industryDiversification: number; // 0-100 (higher = more diversified)
  marketConcentration: number;    // 0-100 (higher = dependent on macro)
}

/**
 * Scenario analysis results
 */
export interface ShockScenarioResults {
  name: string;                   // "Recession", "Rate Shock", "Tech Boom"
  priceImpact12m: number;         // % price impact
  rentalImpact12m: number;        // % rental impact
  absorptionImpact12m: number;    // % absorption impact
  recoveryMonths: number;         // months to recover to baseline
  probabilityPercent: number;     // likelihood of scenario in 12 months
}

/**
 * Macro-to-micro sensitivity metrics
 */
export interface MacroMicroSensitivityMetrics {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  regionId: string;
  asOfDate: Date;

  // Price sensitivity
  priceSensitivityScore: number;  // 0-100 (0 = immune, 100 = very sensitive)
  priceElasticity: ElasticityCoefficients;

  // Rental sensitivity
  rentalSensitivityScore: number; // 0-100

  // Market concentration
  marketConcentration: ConcentrationMetrics;

  // Correlation analysis
  correlation: CorrelationMetrics;

  // Vulnerability metrics
  recessionVulnerability: number; // 0-100 (higher = more vulnerable)
  growthCapture: number;          // 0-100 (ability to capture upside)

  // Diversification benefit
  portfolioDiversificationBenefit: number; // 0-100 (hedge value)

  // Scenario analysis (3 scenarios)
  scenarios: ShockScenarioResults[];

  // Macro factor rankings
  mostSensitiveToFactor: string;  // which macro factor matters most
  leastSensitiveToFactor: string; // which macro factor matters least

  // Forward outlook
  sensitivityOutlook: string;     // "Increasing", "Stable", "Decreasing"

  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface MacroMicroSensitivityInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  regionId: string;
  asOfDate?: Date;
}

export interface MacroMicroSensitivityOutput extends MacroMicroSensitivityMetrics {}

/**
 * Mock macro-to-micro sensitivity data store.
 *
 * In production, this:
 * - Queries E29/E30 regional/city macro data
 * - Queries neighborhood E32-E37 metrics
 * - Calculates elasticity via historical regression
 * - Simulates scenario impacts via Monte Carlo
 *
 * For now, realistic fixtures representing Aug 4, 2026 data.
 */
interface MockSensitivityData {
  [neighborhoodId: string]: MacroMicroSensitivityMetrics;
}

const MOCK_DATA: MockSensitivityData = {
  // ===== TORONTO SENSITIVITY =====

  'toronto-yorkville-on': {
    neighborhoodId: 'toronto-yorkville-on',
    neighborhoodName: 'Yorkville',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 65,
    priceElasticity: {
      priceToGDP: 1.2,
      priceToInterestRate: -0.85,
      priceToUnemployment: -0.65,
      rentToGDP: 0.95,
      rentToUnemployment: -0.45,
      absorptionToGDP: 1.1,
      domToInterestRate: 2.5,
    },
    rentalSensitivityScore: 58,
    marketConcentration: {
      jobConcentration: 42,
      employerConcentration: 38,
      industryDiversification: 72,
      marketConcentration: 55,
    },
    correlation: {
      correlationWithRegion: 0.72,
      correlationWithCity: 0.85,
      correlationWithNational: 0.62,
      beta: 1.05,
    },
    recessionVulnerability: 58,
    growthCapture: 72,
    portfolioDiversificationBenefit: 48,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -8.5,
        rentalImpact12m: -4.2,
        absorptionImpact12m: -12.1,
        recoveryMonths: 18,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -6.8,
        rentalImpact12m: -2.1,
        absorptionImpact12m: -10.5,
        recoveryMonths: 12,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 12.5,
        rentalImpact12m: 14.2,
        absorptionImpact12m: 18.5,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Immigration',
    sensitivityOutlook: 'Stable',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  'toronto-downtown-on': {
    neighborhoodId: 'toronto-downtown-on',
    neighborhoodName: 'Downtown Toronto',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 72,
    priceElasticity: {
      priceToGDP: 1.35,
      priceToInterestRate: -0.95,
      priceToUnemployment: -0.75,
      rentToGDP: 1.15,
      rentToUnemployment: -0.55,
      absorptionToGDP: 1.25,
      domToInterestRate: 2.8,
    },
    rentalSensitivityScore: 68,
    marketConcentration: {
      jobConcentration: 48,
      employerConcentration: 42,
      industryDiversification: 68,
      marketConcentration: 62,
    },
    correlation: {
      correlationWithRegion: 0.78,
      correlationWithCity: 0.92,
      correlationWithNational: 0.68,
      beta: 1.15,
    },
    recessionVulnerability: 65,
    growthCapture: 78,
    portfolioDiversificationBenefit: 42,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -10.2,
        rentalImpact12m: -5.8,
        absorptionImpact12m: -14.5,
        recoveryMonths: 20,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -7.6,
        rentalImpact12m: -2.8,
        absorptionImpact12m: -12.2,
        recoveryMonths: 14,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 15.2,
        rentalImpact12m: 16.8,
        absorptionImpact12m: 21.5,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Increasing',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  'toronto-scarborough-on': {
    neighborhoodId: 'toronto-scarborough-on',
    neighborhoodName: 'Scarborough',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 82,
    priceElasticity: {
      priceToGDP: 1.85,
      priceToInterestRate: -1.25,
      priceToUnemployment: -1.05,
      rentToGDP: 1.45,
      rentToUnemployment: -0.75,
      absorptionToGDP: 1.65,
      domToInterestRate: 3.5,
    },
    rentalSensitivityScore: 78,
    marketConcentration: {
      jobConcentration: 62,
      employerConcentration: 55,
      industryDiversification: 52,
      marketConcentration: 78,
    },
    correlation: {
      correlationWithRegion: 0.85,
      correlationWithCity: 0.88,
      correlationWithNational: 0.75,
      beta: 1.35,
    },
    recessionVulnerability: 78,
    growthCapture: 65,
    portfolioDiversificationBenefit: 35,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -14.8,
        rentalImpact12m: -8.5,
        absorptionImpact12m: -19.2,
        recoveryMonths: 28,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -10.0,
        rentalImpact12m: -4.2,
        absorptionImpact12m: -16.5,
        recoveryMonths: 18,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 19.5,
        rentalImpact12m: 18.2,
        absorptionImpact12m: 25.8,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'GDP Growth',
    leastSensitiveToFactor: 'Immigration',
    sensitivityOutlook: 'Increasing',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  'toronto-north-york-on': {
    neighborhoodId: 'toronto-north-york-on',
    neighborhoodName: 'North York',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 58,
    priceElasticity: {
      priceToGDP: 1.05,
      priceToInterestRate: -0.75,
      priceToUnemployment: -0.55,
      rentToGDP: 0.85,
      rentToUnemployment: -0.35,
      absorptionToGDP: 0.95,
      domToInterestRate: 2.2,
    },
    rentalSensitivityScore: 52,
    marketConcentration: {
      jobConcentration: 38,
      employerConcentration: 35,
      industryDiversification: 78,
      marketConcentration: 48,
    },
    correlation: {
      correlationWithRegion: 0.68,
      correlationWithCity: 0.78,
      correlationWithNational: 0.58,
      beta: 0.95,
    },
    recessionVulnerability: 52,
    growthCapture: 68,
    portfolioDiversificationBenefit: 55,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -6.5,
        rentalImpact12m: -2.8,
        absorptionImpact12m: -8.5,
        recoveryMonths: 14,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -5.2,
        rentalImpact12m: -1.5,
        absorptionImpact12m: -7.8,
        recoveryMonths: 10,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 10.8,
        rentalImpact12m: 12.5,
        absorptionImpact12m: 15.2,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Stable',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  'toronto-etobicoke-on': {
    neighborhoodId: 'toronto-etobicoke-on',
    neighborhoodName: 'Etobicoke',
    cityId: 'toronto-on',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 75,
    priceElasticity: {
      priceToGDP: 1.55,
      priceToInterestRate: -1.05,
      priceToUnemployment: -0.85,
      rentToGDP: 1.25,
      rentToUnemployment: -0.65,
      absorptionToGDP: 1.45,
      domToInterestRate: 3.0,
    },
    rentalSensitivityScore: 72,
    marketConcentration: {
      jobConcentration: 52,
      employerConcentration: 48,
      industryDiversification: 62,
      marketConcentration: 65,
    },
    correlation: {
      correlationWithRegion: 0.76,
      correlationWithCity: 0.86,
      correlationWithNational: 0.66,
      beta: 1.25,
    },
    recessionVulnerability: 68,
    growthCapture: 72,
    portfolioDiversificationBenefit: 45,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -11.2,
        rentalImpact12m: -5.2,
        absorptionImpact12m: -13.8,
        recoveryMonths: 20,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -8.5,
        rentalImpact12m: -3.2,
        absorptionImpact12m: -11.8,
        recoveryMonths: 15,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 14.5,
        rentalImpact12m: 15.8,
        absorptionImpact12m: 20.2,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Stable',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  // ===== VANCOUVER SENSITIVITY =====

  'vancouver-downtown-bc': {
    neighborhoodId: 'vancouver-downtown-bc',
    neighborhoodName: 'Downtown Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 78,
    priceElasticity: {
      priceToGDP: 1.65,
      priceToInterestRate: -1.15,
      priceToUnemployment: -0.95,
      rentToGDP: 1.35,
      rentToUnemployment: -0.65,
      absorptionToGDP: 1.55,
      domToInterestRate: 3.2,
    },
    rentalSensitivityScore: 74,
    marketConcentration: {
      jobConcentration: 55,
      employerConcentration: 48,
      industryDiversification: 60,
      marketConcentration: 68,
    },
    correlation: {
      correlationWithRegion: 0.82,
      correlationWithCity: 0.90,
      correlationWithNational: 0.70,
      beta: 1.32,
    },
    recessionVulnerability: 72,
    growthCapture: 76,
    portfolioDiversificationBenefit: 40,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -12.5,
        rentalImpact12m: -6.8,
        absorptionImpact12m: -16.2,
        recoveryMonths: 24,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -9.2,
        rentalImpact12m: -3.5,
        absorptionImpact12m: -13.5,
        recoveryMonths: 16,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 17.8,
        rentalImpact12m: 17.2,
        absorptionImpact12m: 23.2,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Increasing',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  'vancouver-west-side-bc': {
    neighborhoodId: 'vancouver-west-side-bc',
    neighborhoodName: 'West Side Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 62,
    priceElasticity: {
      priceToGDP: 1.15,
      priceToInterestRate: -0.85,
      priceToUnemployment: -0.65,
      rentToGDP: 0.95,
      rentToUnemployment: -0.45,
      absorptionToGDP: 1.05,
      domToInterestRate: 2.4,
    },
    rentalSensitivityScore: 56,
    marketConcentration: {
      jobConcentration: 40,
      employerConcentration: 36,
      industryDiversification: 76,
      marketConcentration: 52,
    },
    correlation: {
      correlationWithRegion: 0.70,
      correlationWithCity: 0.82,
      correlationWithNational: 0.60,
      beta: 1.02,
    },
    recessionVulnerability: 56,
    growthCapture: 70,
    portfolioDiversificationBenefit: 52,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -7.8,
        rentalImpact12m: -3.5,
        absorptionImpact12m: -9.8,
        recoveryMonths: 16,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -6.2,
        rentalImpact12m: -2.0,
        absorptionImpact12m: -8.8,
        recoveryMonths: 12,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 11.5,
        rentalImpact12m: 13.2,
        absorptionImpact12m: 16.8,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Stable',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  'vancouver-east-bc': {
    neighborhoodId: 'vancouver-east-bc',
    neighborhoodName: 'East Vancouver',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 80,
    priceElasticity: {
      priceToGDP: 1.75,
      priceToInterestRate: -1.22,
      priceToUnemployment: -1.08,
      rentToGDP: 1.48,
      rentToUnemployment: -0.78,
      absorptionToGDP: 1.68,
      domToInterestRate: 3.4,
    },
    rentalSensitivityScore: 76,
    marketConcentration: {
      jobConcentration: 58,
      employerConcentration: 52,
      industryDiversification: 55,
      marketConcentration: 72,
    },
    correlation: {
      correlationWithRegion: 0.84,
      correlationWithCity: 0.87,
      correlationWithNational: 0.72,
      beta: 1.28,
    },
    recessionVulnerability: 74,
    growthCapture: 74,
    portfolioDiversificationBenefit: 38,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -13.8,
        rentalImpact12m: -7.2,
        absorptionImpact12m: -17.8,
        recoveryMonths: 26,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -9.8,
        rentalImpact12m: -4.0,
        absorptionImpact12m: -14.8,
        recoveryMonths: 18,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 18.2,
        rentalImpact12m: 19.5,
        absorptionImpact12m: 24.8,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'GDP Growth',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Increasing',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  'vancouver-north-shore-bc': {
    neighborhoodId: 'vancouver-north-shore-bc',
    neighborhoodName: 'North Shore',
    cityId: 'vancouver-bc',
    regionId: 'west-coast-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 55,
    priceElasticity: {
      priceToGDP: 0.95,
      priceToInterestRate: -0.72,
      priceToUnemployment: -0.52,
      rentToGDP: 0.78,
      rentToUnemployment: -0.38,
      absorptionToGDP: 0.88,
      domToInterestRate: 2.0,
    },
    rentalSensitivityScore: 48,
    marketConcentration: {
      jobConcentration: 35,
      employerConcentration: 32,
      industryDiversification: 80,
      marketConcentration: 45,
    },
    correlation: {
      correlationWithRegion: 0.65,
      correlationWithCity: 0.75,
      correlationWithNational: 0.55,
      beta: 0.92,
    },
    recessionVulnerability: 48,
    growthCapture: 65,
    portfolioDiversificationBenefit: 58,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -5.8,
        rentalImpact12m: -2.2,
        absorptionImpact12m: -7.2,
        recoveryMonths: 12,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -4.8,
        rentalImpact12m: -1.2,
        absorptionImpact12m: -6.5,
        recoveryMonths: 9,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 9.5,
        rentalImpact12m: 11.2,
        absorptionImpact12m: 13.8,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Stable',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  // ===== MONTREAL SENSITIVITY =====

  'montreal-downtown-qc': {
    neighborhoodId: 'montreal-downtown-qc',
    neighborhoodName: 'Downtown Montreal',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 68,
    priceElasticity: {
      priceToGDP: 1.32,
      priceToInterestRate: -0.92,
      priceToUnemployment: -0.72,
      rentToGDP: 1.08,
      rentToUnemployment: -0.52,
      absorptionToGDP: 1.22,
      domToInterestRate: 2.6,
    },
    rentalSensitivityScore: 62,
    marketConcentration: {
      jobConcentration: 46,
      employerConcentration: 42,
      industryDiversification: 70,
      marketConcentration: 60,
    },
    correlation: {
      correlationWithRegion: 0.74,
      correlationWithCity: 0.88,
      correlationWithNational: 0.64,
      beta: 1.12,
    },
    recessionVulnerability: 62,
    growthCapture: 74,
    portfolioDiversificationBenefit: 48,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -9.8,
        rentalImpact12m: -4.5,
        absorptionImpact12m: -12.2,
        recoveryMonths: 18,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -7.2,
        rentalImpact12m: -2.5,
        absorptionImpact12m: -10.5,
        recoveryMonths: 13,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 14.2,
        rentalImpact12m: 15.8,
        absorptionImpact12m: 19.5,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Stable',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  'montreal-plateau-qc': {
    neighborhoodId: 'montreal-plateau-qc',
    neighborhoodName: 'Plateau-Mont-Royal',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 64,
    priceElasticity: {
      priceToGDP: 1.18,
      priceToInterestRate: -0.85,
      priceToUnemployment: -0.65,
      rentToGDP: 0.98,
      rentToUnemployment: -0.45,
      absorptionToGDP: 1.12,
      domToInterestRate: 2.4,
    },
    rentalSensitivityScore: 58,
    marketConcentration: {
      jobConcentration: 42,
      employerConcentration: 38,
      industryDiversification: 74,
      marketConcentration: 56,
    },
    correlation: {
      correlationWithRegion: 0.70,
      correlationWithCity: 0.84,
      correlationWithNational: 0.60,
      beta: 1.04,
    },
    recessionVulnerability: 56,
    growthCapture: 70,
    portfolioDiversificationBenefit: 52,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -8.2,
        rentalImpact12m: -3.8,
        absorptionImpact12m: -10.5,
        recoveryMonths: 16,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -6.5,
        rentalImpact12m: -2.0,
        absorptionImpact12m: -9.2,
        recoveryMonths: 12,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 12.5,
        rentalImpact12m: 14.2,
        absorptionImpact12m: 17.8,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Immigration',
    sensitivityOutlook: 'Stable',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  'montreal-west-island-qc': {
    neighborhoodId: 'montreal-west-island-qc',
    neighborhoodName: 'West Island',
    cityId: 'montreal-qc',
    regionId: 'central-canada',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 70,
    priceElasticity: {
      priceToGDP: 1.48,
      priceToInterestRate: -1.02,
      priceToUnemployment: -0.82,
      rentToGDP: 1.18,
      rentToUnemployment: -0.58,
      absorptionToGDP: 1.38,
      domToInterestRate: 2.8,
    },
    rentalSensitivityScore: 66,
    marketConcentration: {
      jobConcentration: 50,
      employerConcentration: 45,
      industryDiversification: 65,
      marketConcentration: 64,
    },
    correlation: {
      correlationWithRegion: 0.76,
      correlationWithCity: 0.85,
      correlationWithNational: 0.65,
      beta: 1.22,
    },
    recessionVulnerability: 66,
    growthCapture: 72,
    portfolioDiversificationBenefit: 45,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -10.8,
        rentalImpact12m: -5.2,
        absorptionImpact12m: -13.5,
        recoveryMonths: 19,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -8.2,
        rentalImpact12m: -3.0,
        absorptionImpact12m: -11.8,
        recoveryMonths: 14,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge (15% pop growth)',
        priceImpact12m: 15.8,
        rentalImpact12m: 16.5,
        absorptionImpact12m: 21.2,
        recoveryMonths: 0,
        probabilityPercent: 18,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Increasing',
    source: `${DATA_SOURCES.STATCAN}, Regression Analysis`,
    confidence: 'high',
  },

  // ===== US SENSITIVITY (Sample) =====

  'austin-downtown-tx': {
    neighborhoodId: 'austin-downtown-tx',
    neighborhoodName: 'Downtown Austin',
    cityId: 'austin-tx',
    regionId: 'us-south',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 86,
    priceElasticity: {
      priceToGDP: 2.05,
      priceToInterestRate: -1.35,
      priceToUnemployment: -1.15,
      rentToGDP: 1.68,
      rentToUnemployment: -0.88,
      absorptionToGDP: 1.95,
      domToInterestRate: 3.8,
    },
    rentalSensitivityScore: 82,
    marketConcentration: {
      jobConcentration: 65,
      employerConcentration: 58,
      industryDiversification: 48,
      marketConcentration: 75,
    },
    correlation: {
      correlationWithRegion: 0.88,
      correlationWithCity: 0.92,
      correlationWithNational: 0.78,
      beta: 1.45,
    },
    recessionVulnerability: 82,
    growthCapture: 88,
    portfolioDiversificationBenefit: 32,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -16.5,
        rentalImpact12m: -9.2,
        absorptionImpact12m: -21.5,
        recoveryMonths: 32,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -11.2,
        rentalImpact12m: -5.0,
        absorptionImpact12m: -17.2,
        recoveryMonths: 20,
        probabilityPercent: 35,
      },
      {
        name: 'Boom (3% GDP growth)',
        priceImpact12m: 22.8,
        rentalImpact12m: 21.5,
        absorptionImpact12m: 28.8,
        recoveryMonths: 0,
        probabilityPercent: 15,
      },
    ],
    mostSensitiveToFactor: 'GDP Growth',
    leastSensitiveToFactor: 'Immigration',
    sensitivityOutlook: 'Increasing',
    source: `${DATA_SOURCES.FRED}, Regression Analysis`,
    confidence: 'high',
  },

  'san-francisco-downtown-ca': {
    neighborhoodId: 'san-francisco-downtown-ca',
    neighborhoodName: 'SOMA / Downtown',
    cityId: 'san-francisco-ca',
    regionId: 'us-west',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 88,
    priceElasticity: {
      priceToGDP: 2.25,
      priceToInterestRate: -1.48,
      priceToUnemployment: -1.28,
      rentToGDP: 1.85,
      rentToUnemployment: -0.98,
      absorptionToGDP: 2.15,
      domToInterestRate: 4.2,
    },
    rentalSensitivityScore: 85,
    marketConcentration: {
      jobConcentration: 72,
      employerConcentration: 65,
      industryDiversification: 42,
      marketConcentration: 82,
    },
    correlation: {
      correlationWithRegion: 0.90,
      correlationWithCity: 0.94,
      correlationWithNational: 0.80,
      beta: 1.58,
    },
    recessionVulnerability: 88,
    growthCapture: 92,
    portfolioDiversificationBenefit: 28,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -18.8,
        rentalImpact12m: -10.5,
        absorptionImpact12m: -24.2,
        recoveryMonths: 36,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -12.8,
        rentalImpact12m: -5.8,
        absorptionImpact12m: -18.8,
        recoveryMonths: 22,
        probabilityPercent: 35,
      },
      {
        name: 'Tech Boom',
        priceImpact12m: 25.2,
        rentalImpact12m: 24.8,
        absorptionImpact12m: 31.5,
        recoveryMonths: 0,
        probabilityPercent: 12,
      },
    ],
    mostSensitiveToFactor: 'GDP Growth',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Increasing',
    source: `${DATA_SOURCES.FRED}, Regression Analysis`,
    confidence: 'high',
  },

  'miami-brickell-fl': {
    neighborhoodId: 'miami-brickell-fl',
    neighborhoodName: 'Brickell',
    cityId: 'miami-fl',
    regionId: 'us-south',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 84,
    priceElasticity: {
      priceToGDP: 1.95,
      priceToInterestRate: -1.28,
      priceToUnemployment: -1.08,
      rentToGDP: 1.58,
      rentToUnemployment: -0.78,
      absorptionToGDP: 1.85,
      domToInterestRate: 3.6,
    },
    rentalSensitivityScore: 80,
    marketConcentration: {
      jobConcentration: 62,
      employerConcentration: 55,
      industryDiversification: 50,
      marketConcentration: 72,
    },
    correlation: {
      correlationWithRegion: 0.86,
      correlationWithCity: 0.90,
      correlationWithNational: 0.76,
      beta: 1.42,
    },
    recessionVulnerability: 80,
    growthCapture: 86,
    portfolioDiversificationBenefit: 35,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -15.8,
        rentalImpact12m: -8.5,
        absorptionImpact12m: -20.5,
        recoveryMonths: 30,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -10.8,
        rentalImpact12m: -4.8,
        absorptionImpact12m: -15.8,
        recoveryMonths: 18,
        probabilityPercent: 35,
      },
      {
        name: 'Immigration Surge',
        priceImpact12m: 21.2,
        rentalImpact12m: 20.5,
        absorptionImpact12m: 26.8,
        recoveryMonths: 0,
        probabilityPercent: 16,
      },
    ],
    mostSensitiveToFactor: 'GDP Growth',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Stable',
    source: `${DATA_SOURCES.FRED}, Regression Analysis`,
    confidence: 'high',
  },

  'denver-downtown-co': {
    neighborhoodId: 'denver-downtown-co',
    neighborhoodName: 'Downtown Denver',
    cityId: 'denver-co',
    regionId: 'us-west',
    asOfDate: new Date('2026-08-04'),
    priceSensitivityScore: 76,
    priceElasticity: {
      priceToGDP: 1.58,
      priceToInterestRate: -1.08,
      priceToUnemployment: -0.88,
      rentToGDP: 1.28,
      rentToUnemployment: -0.58,
      absorptionToGDP: 1.48,
      domToInterestRate: 3.0,
    },
    rentalSensitivityScore: 70,
    marketConcentration: {
      jobConcentration: 48,
      employerConcentration: 42,
      industryDiversification: 64,
      marketConcentration: 62,
    },
    correlation: {
      correlationWithRegion: 0.78,
      correlationWithCity: 0.88,
      correlationWithNational: 0.68,
      beta: 1.28,
    },
    recessionVulnerability: 70,
    growthCapture: 78,
    portfolioDiversificationBenefit: 42,
    scenarios: [
      {
        name: 'Recession (2% GDP drop)',
        priceImpact12m: -12.2,
        rentalImpact12m: -6.2,
        absorptionImpact12m: -15.8,
        recoveryMonths: 22,
        probabilityPercent: 22,
      },
      {
        name: 'Rate Shock (2% rate increase)',
        priceImpact12m: -8.8,
        rentalImpact12m: -3.5,
        absorptionImpact12m: -12.5,
        recoveryMonths: 15,
        probabilityPercent: 35,
      },
      {
        name: 'Tech & Energy Boom',
        priceImpact12m: 18.5,
        rentalImpact12m: 17.8,
        absorptionImpact12m: 23.2,
        recoveryMonths: 0,
        probabilityPercent: 14,
      },
    ],
    mostSensitiveToFactor: 'Interest Rates',
    leastSensitiveToFactor: 'Unemployment',
    sensitivityOutlook: 'Stable',
    source: `${DATA_SOURCES.FRED}, Regression Analysis`,
    confidence: 'high',
  },
};

/**
 * Fetch macro-to-micro sensitivity metrics for a neighborhood
 *
 * @param input Neighborhood ID, city ID, region ID, and optional date
 * @returns Macro-to-micro sensitivity metrics
 * @throws Error if neighborhood not found
 */
export function macroMicroSensitivity(input: MacroMicroSensitivityInput): MacroMicroSensitivityOutput {
  const { neighborhoodId, asOfDate } = input;

  const validatedDate = validateDateOrUseToday(asOfDate);

  const mockData = MOCK_DATA[neighborhoodId];
  if (!mockData) {
    throw new Error(`No macro-to-micro sensitivity data available for neighborhood "${neighborhoodId}".`);
  }

  return {
    ...mockData,
    asOfDate: validatedDate,
  };
}

export default macroMicroSensitivity;
