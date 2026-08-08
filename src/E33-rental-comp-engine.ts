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
 * E33: Rental Comp Engine
 *
 * Analyzes rental comparable data for specific neighborhoods and property types.
 * Builds on E31 (neighborhood demographics) to provide detailed rental market analysis:
 * - Median rent and rent per sqft by property type
 * - Rental yield (gross and net)
 * - Vacancy rate trends
 * - Rent growth (annual appreciation)
 * - Demand/supply indicators (absorption rate)
 *
 * Property types:
 * - SFH_RENTAL: Single-family homes for rent
 * - CONDO_RENTAL: Condos/townhouses for rent
 * - MFH_RENTAL: Multi-family (2-4 units, small apartment buildings)
 *
 * Data sources (locked per E29-E45 design spec):
 * - CMHC (Canadian rental data)
 * - US Census Bureau + private rental platforms (US data)
 * - 12-month rolling window
 */

import { validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * Rental comparable data by neighborhood and property type
 */
export interface RentalComp {
  propertyType: 'SFH_RENTAL' | 'CONDO_RENTAL' | 'MFH_RENTAL';
  medianRent: number;
  rentPerSqft: number;
  rentDistribution: {
    p25: number;
    p50: number;
    p75: number;
  };
  grossYield: number;              // annual rent / market price (%)
  netYield: number | null;         // after estimated costs (null if sparse data)
  vacancyRate: number;             // % of units vacant
  rentChange12m: number;           // % annual rent growth
  daysToLease: number;             // average time to find tenant
  absorptionRate: number;          // % of available units leased per month
  rentalVolume12m: number;         // total rental transactions
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RentalCompInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  propertyType: 'SFH_RENTAL' | 'CONDO_RENTAL' | 'MFH_RENTAL';
  asOfDate?: Date;
}

export interface RentalCompOutput extends RentalComp {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  propertyType: 'SFH_RENTAL' | 'CONDO_RENTAL' | 'MFH_RENTAL';
  asOfDate: Date;
}

/**
 * Mock rental comps data store.
 *
 * In production, this queries Supabase `economic_data.rental_comps` table
 * which is populated from CMHC and US Census rental survey data.
 * For now, realistic fixtures representing Aug 4, 2026 data.
 */
interface MockRentalData {
  [key: string]: RentalComp;
}

const MOCK_DATA: MockRentalData = {
  // ===== TORONTO RENTAL COMPS =====

  // Downtown Toronto - SFH Rental
  'toronto-downtown-on-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 3650,
    rentPerSqft: 5.8,
    rentDistribution: {
      p25: 3100,
      p50: 3650,
      p75: 4350,
    },
    grossYield: 2.65,               // $3650 × 12 / $1650000 median price
    netYield: 1.85,                 // after property tax, insurance, maintenance
    vacancyRate: 1.9,
    rentChange12m: 4.8,
    daysToLease: 8,
    absorptionRate: 3.2,
    rentalVolume12m: 425,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Downtown Toronto - CONDO Rental
  'toronto-downtown-on-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 2650,
    rentPerSqft: 5.1,
    rentDistribution: {
      p25: 2250,
      p50: 2650,
      p75: 3150,
    },
    grossYield: 4.90,               // $2650 × 12 / $650000 median price
    netYield: 3.45,
    vacancyRate: 2.1,
    rentChange12m: 5.2,
    daysToLease: 9,
    absorptionRate: 3.8,
    rentalVolume12m: 2850,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Downtown Toronto - MFH Rental
  'toronto-downtown-on-mfh_rental': {
    propertyType: 'MFH_RENTAL',
    medianRent: 7500,
    rentPerSqft: 5.5,
    rentDistribution: {
      p25: 6500,
      p50: 7500,
      p75: 8750,
    },
    grossYield: 4.00,               // combined units / $2250000 median price
    netYield: 2.80,
    vacancyRate: 1.8,
    rentChange12m: 4.2,
    daysToLease: 12,
    absorptionRate: 2.8,
    rentalVolume12m: 185,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Yorkville - SFH Rental
  'toronto-yorkville-on-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 4850,
    rentPerSqft: 6.2,
    rentDistribution: {
      p25: 4200,
      p50: 4850,
      p75: 5750,
    },
    grossYield: 2.71,
    netYield: 1.92,
    vacancyRate: 1.6,
    rentChange12m: 5.8,
    daysToLease: 7,
    absorptionRate: 3.5,
    rentalVolume12m: 285,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Yorkville - CONDO Rental
  'toronto-yorkville-on-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 3250,
    rentPerSqft: 6.1,
    rentDistribution: {
      p25: 2850,
      p50: 3250,
      p75: 3850,
    },
    grossYield: 4.73,
    netYield: 3.35,
    vacancyRate: 1.8,
    rentChange12m: 6.1,
    daysToLease: 8,
    absorptionRate: 4.2,
    rentalVolume12m: 1950,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // North York - SFH Rental
  'toronto-north-york-on-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 2850,
    rentPerSqft: 3.5,
    rentDistribution: {
      p25: 2450,
      p50: 2850,
      p75: 3450,
    },
    grossYield: 2.97,
    netYield: 2.10,
    vacancyRate: 2.3,
    rentChange12m: 3.2,
    daysToLease: 11,
    absorptionRate: 2.8,
    rentalVolume12m: 625,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // North York - CONDO Rental
  'toronto-north-york-on-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 1950,
    rentPerSqft: 3.2,
    rentDistribution: {
      p25: 1650,
      p50: 1950,
      p75: 2350,
    },
    grossYield: 4.46,
    netYield: 3.15,
    vacancyRate: 2.5,
    rentChange12m: 2.8,
    daysToLease: 12,
    absorptionRate: 2.5,
    rentalVolume12m: 3850,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Scarborough - SFH Rental
  'toronto-scarborough-on-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 2150,
    rentPerSqft: 2.3,
    rentDistribution: {
      p25: 1850,
      p50: 2150,
      p75: 2550,
    },
    grossYield: 3.33,
    netYield: 2.35,
    vacancyRate: 2.8,
    rentChange12m: 2.1,
    daysToLease: 14,
    absorptionRate: 2.2,
    rentalVolume12m: 850,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Scarborough - CONDO Rental
  'toronto-scarborough-on-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 1350,
    rentPerSqft: 2.1,
    rentDistribution: {
      p25: 1150,
      p50: 1350,
      p75: 1650,
    },
    grossYield: 4.22,
    netYield: 2.95,
    vacancyRate: 3.1,
    rentChange12m: 1.8,
    daysToLease: 15,
    absorptionRate: 1.9,
    rentalVolume12m: 5200,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Etobicoke - SFH Rental
  'toronto-etobicoke-on-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 2350,
    rentPerSqft: 2.8,
    rentDistribution: {
      p25: 2000,
      p50: 2350,
      p75: 2850,
    },
    grossYield: 3.41,
    netYield: 2.42,
    vacancyRate: 2.6,
    rentChange12m: 2.4,
    daysToLease: 13,
    absorptionRate: 2.4,
    rentalVolume12m: 725,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Etobicoke - CONDO Rental
  'toronto-etobicoke-on-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 1550,
    rentPerSqft: 2.5,
    rentDistribution: {
      p25: 1300,
      p50: 1550,
      p75: 1900,
    },
    grossYield: 4.37,
    netYield: 3.08,
    vacancyRate: 2.8,
    rentChange12m: 2.2,
    daysToLease: 14,
    absorptionRate: 2.3,
    rentalVolume12m: 2850,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // ===== VANCOUVER RENTAL COMPS =====

  // West Side - SFH Rental
  'vancouver-west-side-bc-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 4250,
    rentPerSqft: 4.5,
    rentDistribution: {
      p25: 3650,
      p50: 4250,
      p75: 5050,
    },
    grossYield: 2.62,
    netYield: 1.85,
    vacancyRate: 1.8,
    rentChange12m: 4.2,
    daysToLease: 10,
    absorptionRate: 3.1,
    rentalVolume12m: 580,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // West Side - CONDO Rental
  'vancouver-west-side-bc-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 2450,
    rentPerSqft: 4.1,
    rentDistribution: {
      p25: 2050,
      p50: 2450,
      p75: 2950,
    },
    grossYield: 4.06,
    netYield: 2.86,
    vacancyRate: 2.0,
    rentChange12m: 4.5,
    daysToLease: 11,
    absorptionRate: 3.5,
    rentalVolume12m: 1850,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Downtown - SFH Rental
  'vancouver-downtown-bc-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 3450,
    rentPerSqft: 4.2,
    rentDistribution: {
      p25: 2950,
      p50: 3450,
      p75: 4050,
    },
    grossYield: 2.85,
    netYield: 2.02,
    vacancyRate: 2.1,
    rentChange12m: 5.8,
    daysToLease: 9,
    absorptionRate: 3.8,
    rentalVolume12m: 380,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Downtown - CONDO Rental
  'vancouver-downtown-bc-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 2050,
    rentPerSqft: 3.8,
    rentDistribution: {
      p25: 1750,
      p50: 2050,
      p75: 2450,
    },
    grossYield: 4.28,
    netYield: 3.02,
    vacancyRate: 2.2,
    rentChange12m: 5.5,
    daysToLease: 10,
    absorptionRate: 4.1,
    rentalVolume12m: 3850,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // East - SFH Rental
  'vancouver-east-bc-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 2750,
    rentPerSqft: 3.3,
    rentDistribution: {
      p25: 2350,
      p50: 2750,
      p75: 3250,
    },
    grossYield: 3.15,
    netYield: 2.23,
    vacancyRate: 2.4,
    rentChange12m: 5.8,
    daysToLease: 11,
    absorptionRate: 3.2,
    rentalVolume12m: 450,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // East - CONDO Rental
  'vancouver-east-bc-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 1550,
    rentPerSqft: 2.9,
    rentDistribution: {
      p25: 1300,
      p50: 1550,
      p75: 1850,
    },
    grossYield: 4.38,
    netYield: 3.10,
    vacancyRate: 2.5,
    rentChange12m: 5.2,
    daysToLease: 12,
    absorptionRate: 3.5,
    rentalVolume12m: 2150,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // North Shore - SFH Rental
  'vancouver-north-shore-bc-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 3750,
    rentPerSqft: 4.0,
    rentDistribution: {
      p25: 3200,
      p50: 3750,
      p75: 4450,
    },
    grossYield: 2.90,
    netYield: 2.06,
    vacancyRate: 2.2,
    rentChange12m: 3.5,
    daysToLease: 12,
    absorptionRate: 2.9,
    rentalVolume12m: 520,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // North Shore - CONDO Rental
  'vancouver-north-shore-bc-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 2050,
    rentPerSqft: 3.7,
    rentDistribution: {
      p25: 1750,
      p50: 2050,
      p75: 2450,
    },
    grossYield: 4.67,
    netYield: 3.30,
    vacancyRate: 2.3,
    rentChange12m: 3.2,
    daysToLease: 13,
    absorptionRate: 2.7,
    rentalVolume12m: 1550,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // ===== MONTREAL RENTAL COMPS =====

  // Downtown - SFH Rental
  'montreal-downtown-qc-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 2450,
    rentPerSqft: 3.0,
    rentDistribution: {
      p25: 2100,
      p50: 2450,
      p75: 2950,
    },
    grossYield: 3.56,
    netYield: 2.52,
    vacancyRate: 2.4,
    rentChange12m: 3.8,
    daysToLease: 12,
    absorptionRate: 2.8,
    rentalVolume12m: 320,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Downtown - CONDO Rental
  'montreal-downtown-qc-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 1650,
    rentPerSqft: 2.9,
    rentDistribution: {
      p25: 1400,
      p50: 1650,
      p75: 2000,
    },
    grossYield: 4.65,
    netYield: 3.28,
    vacancyRate: 2.5,
    rentChange12m: 3.5,
    daysToLease: 13,
    absorptionRate: 2.9,
    rentalVolume12m: 2850,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Plateau - SFH Rental
  'montreal-plateau-qc-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 2150,
    rentPerSqft: 2.7,
    rentDistribution: {
      p25: 1850,
      p50: 2150,
      p75: 2550,
    },
    grossYield: 3.56,
    netYield: 2.52,
    vacancyRate: 2.5,
    rentChange12m: 4.1,
    daysToLease: 12,
    absorptionRate: 3.0,
    rentalVolume12m: 380,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Plateau - CONDO Rental
  'montreal-plateau-qc-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 1450,
    rentPerSqft: 2.6,
    rentDistribution: {
      p25: 1200,
      p50: 1450,
      p75: 1750,
    },
    grossYield: 4.52,
    netYield: 3.19,
    vacancyRate: 2.6,
    rentChange12m: 3.8,
    daysToLease: 13,
    absorptionRate: 2.8,
    rentalVolume12m: 3150,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // West Island - SFH Rental
  'montreal-west-island-qc-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 1750,
    rentPerSqft: 2.2,
    rentDistribution: {
      p25: 1500,
      p50: 1750,
      p75: 2050,
    },
    grossYield: 3.36,
    netYield: 2.38,
    vacancyRate: 2.8,
    rentChange12m: 2.1,
    daysToLease: 15,
    absorptionRate: 2.1,
    rentalVolume12m: 280,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // West Island - CONDO Rental
  'montreal-west-island-qc-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 1050,
    rentPerSqft: 1.9,
    rentDistribution: {
      p25: 900,
      p50: 1050,
      p75: 1250,
    },
    grossYield: 3.88,
    netYield: 2.74,
    vacancyRate: 3.0,
    rentChange12m: 1.8,
    daysToLease: 16,
    absorptionRate: 1.9,
    rentalVolume12m: 1450,
    source: `${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // ===== US RENTAL COMPS (Selected Samples) =====

  // New York - Manhattan - SFH Rental
  'new-york-manhattan-ny-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 5850,
    rentPerSqft: 7.1,
    rentDistribution: {
      p25: 5000,
      p50: 5850,
      p75: 6950,
    },
    grossYield: 3.78,               // higher yields than Canadian due to price/rent ratio
    netYield: 2.68,
    vacancyRate: 1.8,
    rentChange12m: 3.2,
    daysToLease: 11,
    absorptionRate: 3.1,
    rentalVolume12m: 2850,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // New York - Manhattan - CONDO Rental
  'new-york-manhattan-ny-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 3850,
    rentPerSqft: 6.5,
    rentDistribution: {
      p25: 3200,
      p50: 3850,
      p75: 4650,
    },
    grossYield: 5.42,
    netYield: 3.84,
    vacancyRate: 2.0,
    rentChange12m: 2.8,
    daysToLease: 12,
    absorptionRate: 3.4,
    rentalVolume12m: 8500,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // Los Angeles - Santa Monica - SFH Rental
  'los-angeles-santa-monica-ca-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 4850,
    rentPerSqft: 5.6,
    rentDistribution: {
      p25: 4150,
      p50: 4850,
      p75: 5750,
    },
    grossYield: 4.01,
    netYield: 2.84,
    vacancyRate: 2.1,
    rentChange12m: 3.8,
    daysToLease: 12,
    absorptionRate: 3.2,
    rentalVolume12m: 580,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // Los Angeles - Santa Monica - CONDO Rental
  'los-angeles-santa-monica-ca-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 3050,
    rentPerSqft: 5.1,
    rentDistribution: {
      p25: 2550,
      p50: 3050,
      p75: 3650,
    },
    grossYield: 5.06,
    netYield: 3.58,
    vacancyRate: 2.2,
    rentChange12m: 4.1,
    daysToLease: 13,
    absorptionRate: 3.5,
    rentalVolume12m: 1450,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // San Francisco - Downtown - SFH Rental
  'san-francisco-downtown-ca-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 5450,
    rentPerSqft: 5.9,
    rentDistribution: {
      p25: 4650,
      p50: 5450,
      p75: 6450,
    },
    grossYield: 3.35,
    netYield: 2.38,
    vacancyRate: 2.3,
    rentChange12m: 1.8,
    daysToLease: 15,
    absorptionRate: 2.4,
    rentalVolume12m: 420,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // San Francisco - Downtown - CONDO Rental
  'san-francisco-downtown-ca-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 3450,
    rentPerSqft: 5.0,
    rentDistribution: {
      p25: 2950,
      p50: 3450,
      p75: 4050,
    },
    grossYield: 4.47,
    netYield: 3.17,
    vacancyRate: 2.4,
    rentChange12m: 1.2,
    daysToLease: 16,
    absorptionRate: 2.3,
    rentalVolume12m: 2100,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // Austin - Downtown - SFH Rental
  'austin-downtown-tx-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 2550,
    rentPerSqft: 3.2,
    rentDistribution: {
      p25: 2150,
      p50: 2550,
      p75: 3050,
    },
    grossYield: 3.50,
    netYield: 2.48,
    vacancyRate: 2.0,
    rentChange12m: 6.8,
    daysToLease: 10,
    absorptionRate: 4.2,
    rentalVolume12m: 1850,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // Austin - Downtown - CONDO Rental
  'austin-downtown-tx-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 1850,
    rentPerSqft: 3.3,
    rentDistribution: {
      p25: 1550,
      p50: 1850,
      p75: 2200,
    },
    grossYield: 5.21,
    netYield: 3.69,
    vacancyRate: 2.1,
    rentChange12m: 7.2,
    daysToLease: 11,
    absorptionRate: 4.5,
    rentalVolume12m: 2850,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // Denver - Downtown - SFH Rental
  'denver-downtown-co-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 2450,
    rentPerSqft: 3.0,
    rentDistribution: {
      p25: 2100,
      p50: 2450,
      p75: 2950,
    },
    grossYield: 3.58,
    netYield: 2.54,
    vacancyRate: 2.2,
    rentChange12m: 4.8,
    daysToLease: 11,
    absorptionRate: 3.5,
    rentalVolume12m: 1250,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // Denver - Downtown - CONDO Rental
  'denver-downtown-co-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 1850,
    rentPerSqft: 3.3,
    rentDistribution: {
      p25: 1550,
      p50: 1850,
      p75: 2200,
    },
    grossYield: 5.21,
    netYield: 3.69,
    vacancyRate: 2.3,
    absorptionRate: 3.2,
    rentChange12m: 4.5,
    daysToLease: 12,
    rentalVolume12m: 1850,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // Chicago - Loop - SFH Rental
  'chicago-loop-il-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 2050,
    rentPerSqft: 2.8,
    rentDistribution: {
      p25: 1750,
      p50: 2050,
      p75: 2450,
    },
    grossYield: 4.17,
    netYield: 2.95,
    vacancyRate: 2.5,
    rentChange12m: 2.1,
    daysToLease: 13,
    absorptionRate: 2.8,
    rentalVolume12m: 480,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // Chicago - Loop - CONDO Rental
  'chicago-loop-il-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 1450,
    rentPerSqft: 2.5,
    rentDistribution: {
      p25: 1200,
      p50: 1450,
      p75: 1750,
    },
    grossYield: 5.35,
    netYield: 3.79,
    vacancyRate: 2.6,
    rentChange12m: 1.8,
    daysToLease: 14,
    absorptionRate: 2.5,
    rentalVolume12m: 3200,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // Miami - Brickell - SFH Rental
  'miami-brickell-fl-sfh_rental': {
    propertyType: 'SFH_RENTAL',
    medianRent: 2850,
    rentPerSqft: 3.6,
    rentDistribution: {
      p25: 2450,
      p50: 2850,
      p75: 3450,
    },
    grossYield: 4.14,
    netYield: 2.93,
    vacancyRate: 2.0,
    rentChange12m: 7.2,
    daysToLease: 9,
    absorptionRate: 4.5,
    rentalVolume12m: 680,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },

  // Miami - Brickell - CONDO Rental
  'miami-brickell-fl-condo_rental': {
    propertyType: 'CONDO_RENTAL',
    medianRent: 2150,
    rentPerSqft: 3.4,
    rentDistribution: {
      p25: 1800,
      p50: 2150,
      p75: 2550,
    },
    grossYield: 6.06,
    netYield: 4.29,
    vacancyRate: 2.1,
    rentChange12m: 7.5,
    daysToLease: 10,
    absorptionRate: 4.8,
    rentalVolume12m: 3850,
    source: `${DATA_SOURCES.FRED}, Census`,
    confidence: 'high',
  },
};

/**
 * Fetch rental comps for a neighborhood and property type
 *
 * @param input Neighborhood ID, city ID, property type, and optional date
 * @returns Rental comparable metrics
 * @throws Error if neighborhood not found or property type invalid
 */
export function rentalCompEngine(input: RentalCompInput): RentalCompOutput {
  const { neighborhoodId, cityId, propertyType, asOfDate } = input;

  const validatedDate = validateDateOrUseToday(asOfDate);

  // Build mock data key
  const mockKey = `${neighborhoodId}-${propertyType.toLowerCase()}`;
  const mockData = MOCK_DATA[mockKey];

  if (!mockData) {
    throw new Error(
      `No rental comps available for neighborhood "${neighborhoodId}" ` +
      `property type "${propertyType}". Available property types: SFH_RENTAL, CONDO_RENTAL, MFH_RENTAL.`
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

export default rentalCompEngine;
