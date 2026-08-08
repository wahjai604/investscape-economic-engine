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
 * E32: Comparable Sales Analysis Engine
 *
 * Analyzes comparable sales data for specific neighborhoods and property types.
 * Builds on E31 (neighborhood demographics) to provide detailed comps analysis:
 * - Price distributions (p25, p50, p75) by property type
 * - Price per sqft trends
 * - Market velocity (days on market, transaction volume)
 * - Outlier detection (unusually priced properties)
 *
 * Property types:
 * - SFH: Single-family homes
 * - CONDO: Condominium/townhouse
 * - MFH: Multi-family (2-4 units, small apartment buildings)
 *
 * Data sources (locked per E29-E45 design spec):
 * - CREA (Canadian comps)
 * - MLS aggregates (US comps via Zillow API)
 * - 12-month rolling window (last 12 months of sales)
 */

import { validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * Comparable sales data by neighborhood and property type
 */
export interface ComparableSale {
  propertyType: 'SFH' | 'CONDO' | 'MFH';
  medianPrice: number;
  pricePerSqft: number;
  priceDistribution: {
    p25: number;
    p50: number;
    p75: number;
  };
  daysOnMarket: number;
  soldVolume12m: number;
  priceChange12m: number;           // % annual appreciation
  daysOnMarketTrend: number;        // change in DOM vs prior year
  outlierLowThreshold: number;      // prices below this are outliers (e.g., distressed)
  outlierHighThreshold: number;     // prices above this are outliers (e.g., renovated premium)
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ComparableSalesInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  propertyType: 'SFH' | 'CONDO' | 'MFH';
  asOfDate?: Date;
}

export interface ComparableSalesOutput extends ComparableSale {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  propertyType: 'SFH' | 'CONDO' | 'MFH';
  asOfDate: Date;
}

/**
 * Mock comps data store.
 *
 * In production, this queries Supabase `economic_data.comparable_sales` table
 * which is populated nightly from CREA/MLS feeds.
 * For now, realistic fixtures representing Aug 4, 2026 data.
 */
interface MockCompsData {
  [key: string]: ComparableSale;
}

const MOCK_DATA: MockCompsData = {
  // ===== TORONTO COMPS =====

  // Downtown Toronto - SFH
  'toronto-downtown-on-sfh': {
    propertyType: 'SFH',
    medianPrice: 1650000,
    pricePerSqft: 2100,
    priceDistribution: {
      p25: 1350000,
      p50: 1650000,
      p75: 2050000,
    },
    daysOnMarket: 12,
    soldVolume12m: 285,
    priceChange12m: 4.2,
    daysOnMarketTrend: -2,
    outlierLowThreshold: 950000,
    outlierHighThreshold: 2500000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Downtown Toronto - CONDO
  'toronto-downtown-on-condo': {
    propertyType: 'CONDO',
    medianPrice: 650000,
    pricePerSqft: 1250,
    priceDistribution: {
      p25: 525000,
      p50: 650000,
      p75: 825000,
    },
    daysOnMarket: 14,
    soldVolume12m: 1850,
    priceChange12m: 5.1,
    daysOnMarketTrend: -1,
    outlierLowThreshold: 350000,
    outlierHighThreshold: 1200000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Downtown Toronto - MFH
  'toronto-downtown-on-mfh': {
    propertyType: 'MFH',
    medianPrice: 2250000,
    pricePerSqft: 1650,
    priceDistribution: {
      p25: 1850000,
      p50: 2250000,
      p75: 2750000,
    },
    daysOnMarket: 18,
    soldVolume12m: 95,
    priceChange12m: 3.8,
    daysOnMarketTrend: 1,
    outlierLowThreshold: 1200000,
    outlierHighThreshold: 3500000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Yorkville - SFH
  'toronto-yorkville-on-sfh': {
    propertyType: 'SFH',
    medianPrice: 2150000,
    pricePerSqft: 2450,
    priceDistribution: {
      p25: 1750000,
      p50: 2150000,
      p75: 2750000,
    },
    daysOnMarket: 11,
    soldVolume12m: 185,
    priceChange12m: 5.8,
    daysOnMarketTrend: -3,
    outlierLowThreshold: 1200000,
    outlierHighThreshold: 3500000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Yorkville - CONDO
  'toronto-yorkville-on-condo': {
    propertyType: 'CONDO',
    medianPrice: 825000,
    pricePerSqft: 1550,
    priceDistribution: {
      p25: 650000,
      p50: 825000,
      p75: 1050000,
    },
    daysOnMarket: 13,
    soldVolume12m: 1250,
    priceChange12m: 6.2,
    daysOnMarketTrend: -2,
    outlierLowThreshold: 450000,
    outlierHighThreshold: 1600000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // North York - SFH
  'toronto-north-york-on-sfh': {
    propertyType: 'SFH',
    medianPrice: 1150000,
    pricePerSqft: 1400,
    priceDistribution: {
      p25: 950000,
      p50: 1150000,
      p75: 1450000,
    },
    daysOnMarket: 16,
    soldVolume12m: 425,
    priceChange12m: 2.8,
    daysOnMarketTrend: 2,
    outlierLowThreshold: 650000,
    outlierHighThreshold: 1850000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // North York - CONDO
  'toronto-north-york-on-condo': {
    propertyType: 'CONDO',
    medianPrice: 525000,
    pricePerSqft: 850,
    priceDistribution: {
      p25: 425000,
      p50: 525000,
      p75: 675000,
    },
    daysOnMarket: 18,
    soldVolume12m: 2100,
    priceChange12m: 2.1,
    daysOnMarketTrend: 3,
    outlierLowThreshold: 300000,
    outlierHighThreshold: 900000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Scarborough - SFH
  'toronto-scarborough-on-sfh': {
    propertyType: 'SFH',
    medianPrice: 775000,
    pricePerSqft: 950,
    priceDistribution: {
      p25: 625000,
      p50: 775000,
      p75: 950000,
    },
    daysOnMarket: 20,
    soldVolume12m: 850,
    priceChange12m: 1.9,
    daysOnMarketTrend: 4,
    outlierLowThreshold: 450000,
    outlierHighThreshold: 1250000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Scarborough - CONDO
  'toronto-scarborough-on-condo': {
    propertyType: 'CONDO',
    medianPrice: 385000,
    pricePerSqft: 650,
    priceDistribution: {
      p25: 325000,
      p50: 385000,
      p75: 475000,
    },
    daysOnMarket: 22,
    soldVolume12m: 3200,
    priceChange12m: 1.5,
    daysOnMarketTrend: 5,
    outlierLowThreshold: 225000,
    outlierHighThreshold: 625000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Etobicoke - SFH
  'toronto-etobicoke-on-sfh': {
    propertyType: 'SFH',
    medianPrice: 825000,
    pricePerSqft: 1000,
    priceDistribution: {
      p25: 675000,
      p50: 825000,
      p75: 1025000,
    },
    daysOnMarket: 21,
    soldVolume12m: 725,
    priceChange12m: 2.2,
    daysOnMarketTrend: 3,
    outlierLowThreshold: 475000,
    outlierHighThreshold: 1350000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Etobicoke - CONDO
  'toronto-etobicoke-on-condo': {
    propertyType: 'CONDO',
    medianPrice: 425000,
    pricePerSqft: 700,
    priceDistribution: {
      p25: 350000,
      p50: 425000,
      p75: 525000,
    },
    daysOnMarket: 20,
    soldVolume12m: 1850,
    priceChange12m: 1.8,
    daysOnMarketTrend: 4,
    outlierLowThreshold: 250000,
    outlierHighThreshold: 700000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // ===== VANCOUVER COMPS =====

  // West Side - SFH
  'vancouver-west-side-bc-sfh': {
    propertyType: 'SFH',
    medianPrice: 1950000,
    pricePerSqft: 2100,
    priceDistribution: {
      p25: 1550000,
      p50: 1950000,
      p75: 2500000,
    },
    daysOnMarket: 11,
    soldVolume12m: 585,
    priceChange12m: 5.8,
    daysOnMarketTrend: -2,
    outlierLowThreshold: 1100000,
    outlierHighThreshold: 3200000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // West Side - CONDO
  'vancouver-west-side-bc-condo': {
    propertyType: 'CONDO',
    medianPrice: 725000,
    pricePerSqft: 1200,
    priceDistribution: {
      p25: 575000,
      p50: 725000,
      p75: 925000,
    },
    daysOnMarket: 13,
    soldVolume12m: 1450,
    priceChange12m: 6.2,
    daysOnMarketTrend: -1,
    outlierLowThreshold: 400000,
    outlierHighThreshold: 1350000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Downtown - SFH
  'vancouver-downtown-bc-sfh': {
    propertyType: 'SFH',
    medianPrice: 1450000,
    pricePerSqft: 1750,
    priceDistribution: {
      p25: 1150000,
      p50: 1450000,
      p75: 1850000,
    },
    daysOnMarket: 14,
    soldVolume12m: 380,
    priceChange12m: 4.5,
    daysOnMarketTrend: 1,
    outlierLowThreshold: 800000,
    outlierHighThreshold: 2250000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Downtown - CONDO
  'vancouver-downtown-bc-condo': {
    propertyType: 'CONDO',
    medianPrice: 575000,
    pricePerSqft: 1050,
    priceDistribution: {
      p25: 450000,
      p50: 575000,
      p75: 750000,
    },
    daysOnMarket: 15,
    soldVolume12m: 2850,
    priceChange12m: 5.2,
    daysOnMarketTrend: 0,
    outlierLowThreshold: 300000,
    outlierHighThreshold: 1100000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // East - SFH
  'vancouver-east-bc-sfh': {
    propertyType: 'SFH',
    medianPrice: 1050000,
    pricePerSqft: 1250,
    priceDistribution: {
      p25: 825000,
      p50: 1050000,
      p75: 1350000,
    },
    daysOnMarket: 17,
    soldVolume12m: 450,
    priceChange12m: 5.2,
    daysOnMarketTrend: -1,
    outlierLowThreshold: 550000,
    outlierHighThreshold: 1750000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // East - CONDO
  'vancouver-east-bc-condo': {
    propertyType: 'CONDO',
    medianPrice: 425000,
    pricePerSqft: 800,
    priceDistribution: {
      p25: 325000,
      p50: 425000,
      p75: 575000,
    },
    daysOnMarket: 18,
    soldVolume12m: 1950,
    priceChange12m: 4.8,
    daysOnMarketTrend: 1,
    outlierLowThreshold: 225000,
    outlierHighThreshold: 775000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // North Shore - SFH
  'vancouver-north-shore-bc-sfh': {
    propertyType: 'SFH',
    medianPrice: 1550000,
    pricePerSqft: 1650,
    priceDistribution: {
      p25: 1250000,
      p50: 1550000,
      p75: 1950000,
    },
    daysOnMarket: 16,
    soldVolume12m: 520,
    priceChange12m: 3.8,
    daysOnMarketTrend: 2,
    outlierLowThreshold: 850000,
    outlierHighThreshold: 2400000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // North Shore - CONDO
  'vancouver-north-shore-bc-condo': {
    propertyType: 'CONDO',
    medianPrice: 525000,
    pricePerSqft: 950,
    priceDistribution: {
      p25: 425000,
      p50: 525000,
      p75: 675000,
    },
    daysOnMarket: 17,
    soldVolume12m: 1250,
    priceChange12m: 3.5,
    daysOnMarketTrend: 2,
    outlierLowThreshold: 300000,
    outlierHighThreshold: 850000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // ===== CALGARY COMPS =====

  // Downtown - SFH
  'calgary-downtown-ab-sfh': {
    propertyType: 'SFH',
    medianPrice: 775000,
    pricePerSqft: 950,
    priceDistribution: {
      p25: 625000,
      p50: 775000,
      p75: 950000,
    },
    daysOnMarket: 19,
    soldVolume12m: 285,
    priceChange12m: 4.2,
    daysOnMarketTrend: 1,
    outlierLowThreshold: 450000,
    outlierHighThreshold: 1250000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Downtown - CONDO
  'calgary-downtown-ab-condo': {
    propertyType: 'CONDO',
    medianPrice: 385000,
    pricePerSqft: 650,
    priceDistribution: {
      p25: 325000,
      p50: 385000,
      p75: 475000,
    },
    daysOnMarket: 21,
    soldVolume12m: 1200,
    priceChange12m: 3.8,
    daysOnMarketTrend: 2,
    outlierLowThreshold: 225000,
    outlierHighThreshold: 625000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Southwest - SFH
  'calgary-southwest-ab-sfh': {
    propertyType: 'SFH',
    medianPrice: 625000,
    pricePerSqft: 800,
    priceDistribution: {
      p25: 500000,
      p50: 625000,
      p75: 775000,
    },
    daysOnMarket: 23,
    soldVolume12m: 480,
    priceChange12m: 3.5,
    daysOnMarketTrend: 2,
    outlierLowThreshold: 350000,
    outlierHighThreshold: 1000000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Southwest - CONDO
  'calgary-southwest-ab-condo': {
    propertyType: 'CONDO',
    medianPrice: 325000,
    pricePerSqft: 550,
    priceDistribution: {
      p25: 275000,
      p50: 325000,
      p75: 400000,
    },
    daysOnMarket: 25,
    soldVolume12m: 850,
    priceChange12m: 2.9,
    daysOnMarketTrend: 3,
    outlierLowThreshold: 190000,
    outlierHighThreshold: 525000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // ===== MONTREAL COMPS =====

  // Downtown - SFH
  'montreal-downtown-qc-sfh': {
    propertyType: 'SFH',
    medianPrice: 825000,
    pricePerSqft: 1000,
    priceDistribution: {
      p25: 675000,
      p50: 825000,
      p75: 1025000,
    },
    daysOnMarket: 18,
    soldVolume12m: 320,
    priceChange12m: 3.2,
    daysOnMarketTrend: 1,
    outlierLowThreshold: 475000,
    outlierHighThreshold: 1350000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Downtown - CONDO
  'montreal-downtown-qc-condo': {
    propertyType: 'CONDO',
    medianPrice: 425000,
    pricePerSqft: 750,
    priceDistribution: {
      p25: 350000,
      p50: 425000,
      p75: 525000,
    },
    daysOnMarket: 19,
    soldVolume12m: 2100,
    priceChange12m: 3.1,
    daysOnMarketTrend: 1,
    outlierLowThreshold: 250000,
    outlierHighThreshold: 700000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Plateau - SFH
  'montreal-plateau-qc-sfh': {
    propertyType: 'SFH',
    medianPrice: 725000,
    pricePerSqft: 900,
    priceDistribution: {
      p25: 575000,
      p50: 725000,
      p75: 900000,
    },
    daysOnMarket: 19,
    soldVolume12m: 380,
    priceChange12m: 3.8,
    daysOnMarketTrend: 0,
    outlierLowThreshold: 400000,
    outlierHighThreshold: 1200000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // Plateau - CONDO
  'montreal-plateau-qc-condo': {
    propertyType: 'CONDO',
    medianPrice: 385000,
    pricePerSqft: 680,
    priceDistribution: {
      p25: 325000,
      p50: 385000,
      p75: 475000,
    },
    daysOnMarket: 20,
    soldVolume12m: 2850,
    priceChange12m: 3.5,
    daysOnMarketTrend: 1,
    outlierLowThreshold: 225000,
    outlierHighThreshold: 625000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // West Island - SFH
  'montreal-west-island-qc-sfh': {
    propertyType: 'SFH',
    medianPrice: 625000,
    pricePerSqft: 800,
    priceDistribution: {
      p25: 500000,
      p50: 625000,
      p75: 775000,
    },
    daysOnMarket: 22,
    soldVolume12m: 280,
    priceChange12m: 1.9,
    daysOnMarketTrend: 3,
    outlierLowThreshold: 350000,
    outlierHighThreshold: 1000000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // West Island - CONDO
  'montreal-west-island-qc-condo': {
    propertyType: 'CONDO',
    medianPrice: 325000,
    pricePerSqft: 580,
    priceDistribution: {
      p25: 275000,
      p50: 325000,
      p75: 400000,
    },
    daysOnMarket: 24,
    soldVolume12m: 1250,
    priceChange12m: 1.6,
    daysOnMarketTrend: 4,
    outlierLowThreshold: 190000,
    outlierHighThreshold: 525000,
    source: `${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },

  // ===== US COMPS (Selected Samples) =====

  // New York - Manhattan - SFH
  'new-york-manhattan-ny-sfh': {
    propertyType: 'SFH',
    medianPrice: 1850000,
    pricePerSqft: 2250,
    priceDistribution: {
      p25: 1450000,
      p50: 1850000,
      p75: 2350000,
    },
    daysOnMarket: 21,
    soldVolume12m: 2850,
    priceChange12m: 2.1,
    daysOnMarketTrend: 2,
    outlierLowThreshold: 1000000,
    outlierHighThreshold: 3200000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // New York - Manhattan - CONDO
  'new-york-manhattan-ny-condo': {
    propertyType: 'CONDO',
    medianPrice: 850000,
    pricePerSqft: 1450,
    priceDistribution: {
      p25: 650000,
      p50: 850000,
      p75: 1100000,
    },
    daysOnMarket: 22,
    soldVolume12m: 8500,
    priceChange12m: 1.8,
    daysOnMarketTrend: 3,
    outlierLowThreshold: 450000,
    outlierHighThreshold: 1600000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // Los Angeles - Santa Monica - SFH
  'los-angeles-santa-monica-ca-sfh': {
    propertyType: 'SFH',
    medianPrice: 1450000,
    pricePerSqft: 1650,
    priceDistribution: {
      p25: 1150000,
      p50: 1450000,
      p75: 1850000,
    },
    daysOnMarket: 19,
    soldVolume12m: 580,
    priceChange12m: 3.2,
    daysOnMarketTrend: 1,
    outlierLowThreshold: 800000,
    outlierHighThreshold: 2400000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // Los Angeles - Santa Monica - CONDO
  'los-angeles-santa-monica-ca-condo': {
    propertyType: 'CONDO',
    medianPrice: 725000,
    pricePerSqft: 1200,
    priceDistribution: {
      p25: 575000,
      p50: 725000,
      p75: 925000,
    },
    daysOnMarket: 20,
    soldVolume12m: 1450,
    priceChange12m: 3.5,
    daysOnMarketTrend: 0,
    outlierLowThreshold: 400000,
    outlierHighThreshold: 1350000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // San Francisco - Downtown - SFH
  'san-francisco-downtown-ca-sfh': {
    propertyType: 'SFH',
    medianPrice: 1950000,
    pricePerSqft: 2100,
    priceDistribution: {
      p25: 1550000,
      p50: 1950000,
      p75: 2500000,
    },
    daysOnMarket: 24,
    soldVolume12m: 420,
    priceChange12m: 1.8,
    daysOnMarketTrend: 4,
    outlierLowThreshold: 1100000,
    outlierHighThreshold: 3200000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // San Francisco - Downtown - CONDO
  'san-francisco-downtown-ca-condo': {
    propertyType: 'CONDO',
    medianPrice: 925000,
    pricePerSqft: 1350,
    priceDistribution: {
      p25: 725000,
      p50: 925000,
      p75: 1200000,
    },
    daysOnMarket: 25,
    soldVolume12m: 2100,
    priceChange12m: 1.2,
    daysOnMarketTrend: 5,
    outlierLowThreshold: 500000,
    outlierHighThreshold: 1800000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // Austin - Downtown - SFH
  'austin-downtown-tx-sfh': {
    propertyType: 'SFH',
    medianPrice: 875000,
    pricePerSqft: 1100,
    priceDistribution: {
      p25: 700000,
      p50: 875000,
      p75: 1100000,
    },
    daysOnMarket: 13,
    soldVolume12m: 1850,
    priceChange12m: 7.8,
    daysOnMarketTrend: -3,
    outlierLowThreshold: 500000,
    outlierHighThreshold: 1450000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // Austin - Downtown - CONDO
  'austin-downtown-tx-condo': {
    propertyType: 'CONDO',
    medianPrice: 425000,
    pricePerSqft: 750,
    priceDistribution: {
      p25: 350000,
      p50: 425000,
      p75: 525000,
    },
    daysOnMarket: 14,
    soldVolume12m: 2850,
    priceChange12m: 8.2,
    daysOnMarketTrend: -2,
    outlierLowThreshold: 250000,
    outlierHighThreshold: 700000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // Denver - Downtown - SFH
  'denver-downtown-co-sfh': {
    propertyType: 'SFH',
    medianPrice: 825000,
    pricePerSqft: 1000,
    priceDistribution: {
      p25: 675000,
      p50: 825000,
      p75: 1025000,
    },
    daysOnMarket: 16,
    soldVolume12m: 1250,
    priceChange12m: 4.8,
    daysOnMarketTrend: 0,
    outlierLowThreshold: 475000,
    outlierHighThreshold: 1350000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // Denver - Downtown - CONDO
  'denver-downtown-co-condo': {
    propertyType: 'CONDO',
    medianPrice: 425000,
    pricePerSqft: 750,
    priceDistribution: {
      p25: 350000,
      p50: 425000,
      p75: 525000,
    },
    daysOnMarket: 17,
    soldVolume12m: 1850,
    priceChange12m: 4.5,
    daysOnMarketTrend: 1,
    outlierLowThreshold: 250000,
    outlierHighThreshold: 700000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // Chicago - Loop - SFH
  'chicago-loop-il-sfh': {
    propertyType: 'SFH',
    medianPrice: 585000,
    pricePerSqft: 800,
    priceDistribution: {
      p25: 475000,
      p50: 585000,
      p75: 725000,
    },
    daysOnMarket: 24,
    soldVolume12m: 480,
    priceChange12m: 2.1,
    daysOnMarketTrend: 3,
    outlierLowThreshold: 350000,
    outlierHighThreshold: 950000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // Chicago - Loop - CONDO
  'chicago-loop-il-condo': {
    propertyType: 'CONDO',
    medianPrice: 325000,
    pricePerSqft: 550,
    priceDistribution: {
      p25: 275000,
      p50: 325000,
      p75: 400000,
    },
    daysOnMarket: 25,
    soldVolume12m: 3200,
    priceChange12m: 1.8,
    daysOnMarketTrend: 4,
    outlierLowThreshold: 190000,
    outlierHighThreshold: 525000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // Miami - Brickell - SFH
  'miami-brickell-fl-sfh': {
    propertyType: 'SFH',
    medianPrice: 825000,
    pricePerSqft: 1050,
    priceDistribution: {
      p25: 650000,
      p50: 825000,
      p75: 1050000,
    },
    daysOnMarket: 15,
    soldVolume12m: 680,
    priceChange12m: 6.8,
    daysOnMarketTrend: -1,
    outlierLowThreshold: 475000,
    outlierHighThreshold: 1350000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  // Miami - Brickell - CONDO
  'miami-brickell-fl-condo': {
    propertyType: 'CONDO',
    medianPrice: 425000,
    pricePerSqft: 850,
    priceDistribution: {
      p25: 350000,
      p50: 425000,
      p75: 525000,
    },
    daysOnMarket: 15,
    soldVolume12m: 3850,
    priceChange12m: 7.2,
    daysOnMarketTrend: 0,
    outlierLowThreshold: 250000,
    outlierHighThreshold: 700000,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },
};

/**
 * Fetch comparable sales for a neighborhood and property type
 *
 * @param input Neighborhood ID, city ID, property type, and optional date
 * @returns Comparable sales metrics
 * @throws Error if neighborhood not found or property type invalid
 */
export function comparableSalesAnalysis(input: ComparableSalesInput): ComparableSalesOutput {
  const { neighborhoodId, cityId, propertyType, asOfDate } = input;

  const validatedDate = validateDateOrUseToday(asOfDate);

  // Build mock data key
  const mockKey = `${neighborhoodId}-${propertyType.toLowerCase()}`;
  const mockData = MOCK_DATA[mockKey];

  if (!mockData) {
    throw new Error(
      `No comparable sales data available for neighborhood "${neighborhoodId}" ` +
      `property type "${propertyType}". Available property types: SFH, CONDO, MFH.`
    );
  }

  return {
    ...mockData,
    neighborhoodId,
    neighborhoodName: input.neighborhoodName,
    cityId,
    propertyType,
    asOfDate: validatedDate,
  };
}

export default comparableSalesAnalysis;
