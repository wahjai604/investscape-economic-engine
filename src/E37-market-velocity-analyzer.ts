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
 * E37: Market Velocity Analyzer
 *
 * Provides comprehensive market velocity and momentum metrics for neighborhoods.
 * Capstone of Market Analysis Layer (E29-E37) showing:
 * - Market temperature (hot, warm, balanced, cool, cold)
 * - Absorption rates (how fast inventory turns)
 * - Days on market (for sales and rentals)
 * - Price momentum (appreciation/depreciation trends)
 * - Rental momentum (rent growth)
 * - Market velocity index (composite score)
 * - Buyer/seller/renter dynamics
 *
 * Data sources (locked per E29-E45 design spec):
 * - MLS transaction data (absorption, DOM)
 * - Rental listing data (rental velocity)
 * - Price indices (momentum, trends)
 * - Market sentiment analysis
 */

import { validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * Market dynamics for sales
 */
export interface SalesVelocity {
  daysOnMarket: number; // average days from listing to sale
  absorptionRate: number; // % of inventory sold per month
  listingToSaleRatio: number; // asking price to sale price %
  pricePercentile: number; // where prices rank (0-100)
  priceChange6m: number; // % change in 6 months
  priceChange12m: number; // % change in 12 months
  priceChange24m: number; // % change in 24 months
  newListings12m: number; // count in last 12 months
  soldListings12m: number; // count sold in last 12 months
  listingsRatio: number; // sold / new listings %
}

/**
 * Market dynamics for rentals
 */
export interface RentalVelocity {
  daysToLease: number; // average days from listing to lease
  absorptionRate: number; // % of vacant units rented per month
  rentChange6m: number; // % change in 6 months
  rentChange12m: number; // % change in 12 months
  rentChange24m: number; // % change in 24 months
  vacancyRate: number; // % of units vacant
  newListings12m: number; // rental listings in last 12 months
  leasedListings12m: number; // count leased in last 12 months
  marketTightness: number; // 0-100 (100 = extremely tight, 0 = soft)
}

/**
 * Market velocity metrics
 */
export interface MarketVelocityMetrics {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  asOfDate: Date;

  // Market temperature
  marketTemperature: string; // Hot, Warm, Balanced, Cool, Cold
  marketHeat: number; // 0-100 (0 = cold, 100 = hot)

  // Sales velocity
  salesVelocity: SalesVelocity;

  // Rental velocity
  rentalVelocity: RentalVelocity;

  // Market dynamics
  buyerMarket: boolean; // true if favors buyers
  sellerMarket: boolean; // true if favors sellers
  renterMarket: boolean; // true if favors renters
  landlordMarket: boolean; // true if favors landlords

  // Composite velocity score
  marketVelocityIndex: number; // 0-100 (higher = more active)
  momentum: string; // Accelerating, Strong, Stable, Weakening, Declining

  // Forecast
  outlookMonths: number; // forward-looking 3, 6, 12 months
  outlookDirection: string; // Up, Stable, Down
  outlookConfidence: number; // 0-100

  // Comparative
  hottestInCity: boolean; // highest market heat in city
  coldestInCity: boolean; // lowest market heat in city
  fasterThanCity: boolean; // above city average velocity

  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface MarketVelocityInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  asOfDate?: Date;
}

export interface MarketVelocityOutput extends MarketVelocityMetrics {}

/**
 * Mock market velocity data store.
 *
 * In production, this queries Supabase `economic_data.market_velocity_metrics` table
 * populated from MLS data, rental platforms, and price indices.
 * For now, realistic fixtures representing Aug 4, 2026 market conditions.
 */
interface MockMarketVelocityData {
  [neighborhoodId: string]: MarketVelocityMetrics;
}

const MOCK_DATA: MockMarketVelocityData = {
  // ===== TORONTO MARKET VELOCITY =====

  'toronto-yorkville-on': {
    neighborhoodId: 'toronto-yorkville-on',
    neighborhoodName: 'Yorkville',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Warm',
    marketHeat: 68,
    salesVelocity: {
      daysOnMarket: 22,
      absorptionRate: 8.5,
      listingToSaleRatio: 98.2,
      pricePercentile: 92,
      priceChange6m: 2.1,
      priceChange12m: 4.5,
      priceChange24m: 8.2,
      newListings12m: 145,
      soldListings12m: 128,
      listingsRatio: 88.3,
    },
    rentalVelocity: {
      daysToLease: 8,
      absorptionRate: 12.2,
      rentChange6m: 3.2,
      rentChange12m: 6.8,
      rentChange24m: 14.2,
      vacancyRate: 0.8,
      newListings12m: 85,
      leasedListings12m: 78,
      marketTightness: 88,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 72,
    momentum: 'Strong',
    outlookMonths: 6,
    outlookDirection: 'Up',
    outlookConfidence: 75,
    hottestInCity: false,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  'toronto-downtown-on': {
    neighborhoodId: 'toronto-downtown-on',
    neighborhoodName: 'Downtown Toronto',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Hot',
    marketHeat: 78,
    salesVelocity: {
      daysOnMarket: 18,
      absorptionRate: 10.2,
      listingToSaleRatio: 99.1,
      pricePercentile: 95,
      priceChange6m: 3.2,
      priceChange12m: 6.8,
      priceChange24m: 12.5,
      newListings12m: 185,
      soldListings12m: 172,
      listingsRatio: 93.0,
    },
    rentalVelocity: {
      daysToLease: 6,
      absorptionRate: 14.5,
      rentChange6m: 4.1,
      rentChange12m: 8.5,
      rentChange24m: 18.2,
      vacancyRate: 0.6,
      newListings12m: 120,
      leasedListings12m: 115,
      marketTightness: 92,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 82,
    momentum: 'Accelerating',
    outlookMonths: 6,
    outlookDirection: 'Up',
    outlookConfidence: 82,
    hottestInCity: true,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  'toronto-north-york-on': {
    neighborhoodId: 'toronto-north-york-on',
    neighborhoodName: 'North York',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Balanced',
    marketHeat: 52,
    salesVelocity: {
      daysOnMarket: 35,
      absorptionRate: 6.2,
      listingToSaleRatio: 96.5,
      pricePercentile: 55,
      priceChange6m: 0.5,
      priceChange12m: 1.2,
      priceChange24m: 2.8,
      newListings12m: 220,
      soldListings12m: 185,
      listingsRatio: 84.1,
    },
    rentalVelocity: {
      daysToLease: 12,
      absorptionRate: 8.5,
      rentChange6m: 1.8,
      rentChange12m: 3.5,
      rentChange24m: 7.2,
      vacancyRate: 1.8,
      newListings12m: 140,
      leasedListings12m: 120,
      marketTightness: 62,
    },
    buyerMarket: false,
    sellerMarket: false,
    renterMarket: false,
    landlordMarket: false,
    marketVelocityIndex: 55,
    momentum: 'Stable',
    outlookMonths: 12,
    outlookDirection: 'Stable',
    outlookConfidence: 68,
    hottestInCity: false,
    coldestInCity: false,
    fasterThanCity: false,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  'toronto-scarborough-on': {
    neighborhoodId: 'toronto-scarborough-on',
    neighborhoodName: 'Scarborough',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Cool',
    marketHeat: 38,
    salesVelocity: {
      daysOnMarket: 48,
      absorptionRate: 4.8,
      listingToSaleRatio: 94.2,
      pricePercentile: 35,
      priceChange6m: -1.2,
      priceChange12m: -2.1,
      priceChange24m: -3.5,
      newListings12m: 280,
      soldListings12m: 165,
      listingsRatio: 58.9,
    },
    rentalVelocity: {
      daysToLease: 18,
      absorptionRate: 5.8,
      rentChange6m: 0.8,
      rentChange12m: 1.5,
      rentChange24m: 3.2,
      vacancyRate: 3.2,
      newListings12m: 160,
      leasedListings12m: 95,
      marketTightness: 42,
    },
    buyerMarket: true,
    sellerMarket: false,
    renterMarket: true,
    landlordMarket: false,
    marketVelocityIndex: 38,
    momentum: 'Declining',
    outlookMonths: 12,
    outlookDirection: 'Down',
    outlookConfidence: 70,
    hottestInCity: false,
    coldestInCity: true,
    fasterThanCity: false,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  'toronto-etobicoke-on': {
    neighborhoodId: 'toronto-etobicoke-on',
    neighborhoodName: 'Etobicoke',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Cool',
    marketHeat: 42,
    salesVelocity: {
      daysOnMarket: 42,
      absorptionRate: 5.2,
      listingToSaleRatio: 94.8,
      pricePercentile: 38,
      priceChange6m: -0.8,
      priceChange12m: -1.5,
      priceChange24m: -2.2,
      newListings12m: 260,
      soldListings12m: 170,
      listingsRatio: 65.4,
    },
    rentalVelocity: {
      daysToLease: 16,
      absorptionRate: 6.5,
      rentChange6m: 1.2,
      rentChange12m: 2.5,
      rentChange24m: 5.2,
      vacancyRate: 2.8,
      newListings12m: 155,
      leasedListings12m: 102,
      marketTightness: 48,
    },
    buyerMarket: true,
    sellerMarket: false,
    renterMarket: true,
    landlordMarket: false,
    marketVelocityIndex: 42,
    momentum: 'Weakening',
    outlookMonths: 12,
    outlookDirection: 'Down',
    outlookConfidence: 72,
    hottestInCity: false,
    coldestInCity: false,
    fasterThanCity: false,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  // ===== VANCOUVER MARKET VELOCITY =====

  'vancouver-west-side-bc': {
    neighborhoodId: 'vancouver-west-side-bc',
    neighborhoodName: 'West Side Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Warm',
    marketHeat: 65,
    salesVelocity: {
      daysOnMarket: 25,
      absorptionRate: 7.8,
      listingToSaleRatio: 97.9,
      pricePercentile: 88,
      priceChange6m: 1.8,
      priceChange12m: 3.8,
      priceChange24m: 7.5,
      newListings12m: 165,
      soldListings12m: 145,
      listingsRatio: 87.9,
    },
    rentalVelocity: {
      daysToLease: 9,
      absorptionRate: 11.2,
      rentChange6m: 2.8,
      rentChange12m: 5.8,
      rentChange24m: 12.1,
      vacancyRate: 1.2,
      newListings12m: 95,
      leasedListings12m: 88,
      marketTightness: 85,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 68,
    momentum: 'Strong',
    outlookMonths: 6,
    outlookDirection: 'Up',
    outlookConfidence: 73,
    hottestInCity: false,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  'vancouver-downtown-bc': {
    neighborhoodId: 'vancouver-downtown-bc',
    neighborhoodName: 'Downtown Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Hot',
    marketHeat: 76,
    salesVelocity: {
      daysOnMarket: 16,
      absorptionRate: 11.5,
      listingToSaleRatio: 99.3,
      pricePercentile: 96,
      priceChange6m: 3.8,
      priceChange12m: 7.8,
      priceChange24m: 15.2,
      newListings12m: 220,
      soldListings12m: 205,
      listingsRatio: 93.2,
    },
    rentalVelocity: {
      daysToLease: 5,
      absorptionRate: 15.8,
      rentChange6m: 4.8,
      rentChange12m: 9.8,
      rentChange24m: 19.5,
      vacancyRate: 0.5,
      newListings12m: 145,
      leasedListings12m: 138,
      marketTightness: 94,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 80,
    momentum: 'Accelerating',
    outlookMonths: 6,
    outlookDirection: 'Up',
    outlookConfidence: 80,
    hottestInCity: true,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  'vancouver-east-bc': {
    neighborhoodId: 'vancouver-east-bc',
    neighborhoodName: 'East Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Warm',
    marketHeat: 62,
    salesVelocity: {
      daysOnMarket: 28,
      absorptionRate: 7.2,
      listingToSaleRatio: 97.5,
      pricePercentile: 72,
      priceChange6m: 2.2,
      priceChange12m: 4.5,
      priceChange24m: 9.2,
      newListings12m: 185,
      soldListings12m: 155,
      listingsRatio: 83.8,
    },
    rentalVelocity: {
      daysToLease: 10,
      absorptionRate: 10.5,
      rentChange6m: 3.2,
      rentChange12m: 6.8,
      rentChange24m: 13.8,
      vacancyRate: 1.5,
      newListings12m: 110,
      leasedListings12m: 102,
      marketTightness: 82,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 65,
    momentum: 'Strong',
    outlookMonths: 6,
    outlookDirection: 'Up',
    outlookConfidence: 72,
    hottestInCity: false,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  'vancouver-north-shore-bc': {
    neighborhoodId: 'vancouver-north-shore-bc',
    neighborhoodName: 'North Shore',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Balanced',
    marketHeat: 50,
    salesVelocity: {
      daysOnMarket: 38,
      absorptionRate: 5.8,
      listingToSaleRatio: 96.2,
      pricePercentile: 60,
      priceChange6m: 0.8,
      priceChange12m: 1.8,
      priceChange24m: 3.8,
      newListings12m: 195,
      soldListings12m: 160,
      listingsRatio: 82.1,
    },
    rentalVelocity: {
      daysToLease: 13,
      absorptionRate: 7.8,
      rentChange6m: 1.5,
      rentChange12m: 3.2,
      rentChange24m: 6.8,
      vacancyRate: 2.2,
      newListings12m: 115,
      leasedListings12m: 95,
      marketTightness: 58,
    },
    buyerMarket: false,
    sellerMarket: false,
    renterMarket: false,
    landlordMarket: false,
    marketVelocityIndex: 52,
    momentum: 'Stable',
    outlookMonths: 12,
    outlookDirection: 'Stable',
    outlookConfidence: 70,
    hottestInCity: false,
    coldestInCity: true,
    fasterThanCity: false,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  // ===== MONTREAL MARKET VELOCITY =====

  'montreal-downtown-qc': {
    neighborhoodId: 'montreal-downtown-qc',
    neighborhoodName: 'Downtown Montreal',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Warm',
    marketHeat: 64,
    salesVelocity: {
      daysOnMarket: 26,
      absorptionRate: 7.5,
      listingToSaleRatio: 97.8,
      pricePercentile: 85,
      priceChange6m: 1.5,
      priceChange12m: 3.2,
      priceChange24m: 6.8,
      newListings12m: 155,
      soldListings12m: 135,
      listingsRatio: 87.1,
    },
    rentalVelocity: {
      daysToLease: 10,
      absorptionRate: 9.8,
      rentChange6m: 2.5,
      rentChange12m: 5.2,
      rentChange24m: 10.8,
      vacancyRate: 1.8,
      newListings12m: 105,
      leasedListings12m: 95,
      marketTightness: 78,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 66,
    momentum: 'Strong',
    outlookMonths: 6,
    outlookDirection: 'Up',
    outlookConfidence: 71,
    hottestInCity: false,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  'montreal-plateau-qc': {
    neighborhoodId: 'montreal-plateau-qc',
    neighborhoodName: 'Plateau-Mont-Royal',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Warm',
    marketHeat: 66,
    salesVelocity: {
      daysOnMarket: 24,
      absorptionRate: 8.2,
      listingToSaleRatio: 98.1,
      pricePercentile: 82,
      priceChange6m: 2.2,
      priceChange12m: 4.5,
      priceChange24m: 9.2,
      newListings12m: 168,
      soldListings12m: 152,
      listingsRatio: 90.5,
    },
    rentalVelocity: {
      daysToLease: 8,
      absorptionRate: 11.5,
      rentChange6m: 3.5,
      rentChange12m: 7.2,
      rentChange24m: 14.8,
      vacancyRate: 0.9,
      newListings12m: 125,
      leasedListings12m: 118,
      marketTightness: 88,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 70,
    momentum: 'Strong',
    outlookMonths: 6,
    outlookDirection: 'Up',
    outlookConfidence: 74,
    hottestInCity: true,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  'montreal-west-island-qc': {
    neighborhoodId: 'montreal-west-island-qc',
    neighborhoodName: 'West Island',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Cool',
    marketHeat: 44,
    salesVelocity: {
      daysOnMarket: 40,
      absorptionRate: 5.2,
      listingToSaleRatio: 95.5,
      pricePercentile: 42,
      priceChange6m: -0.5,
      priceChange12m: -1.0,
      priceChange24m: -1.8,
      newListings12m: 225,
      soldListings12m: 155,
      listingsRatio: 68.9,
    },
    rentalVelocity: {
      daysToLease: 14,
      absorptionRate: 6.8,
      rentChange6m: 0.8,
      rentChange12m: 1.8,
      rentChange24m: 3.8,
      vacancyRate: 2.8,
      newListings12m: 140,
      leasedListings12m: 105,
      marketTightness: 52,
    },
    buyerMarket: true,
    sellerMarket: false,
    renterMarket: true,
    landlordMarket: false,
    marketVelocityIndex: 44,
    momentum: 'Weakening',
    outlookMonths: 12,
    outlookDirection: 'Down',
    outlookConfidence: 68,
    hottestInCity: false,
    coldestInCity: true,
    fasterThanCity: false,
    source: `${DATA_SOURCES.STATCAN}, MLS`,
    confidence: 'high',
  },

  // ===== US MARKET VELOCITY (Sample) =====

  'new-york-manhattan-ny': {
    neighborhoodId: 'new-york-manhattan-ny',
    neighborhoodName: 'Manhattan',
    cityId: 'new-york-ny',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Warm',
    marketHeat: 64,
    salesVelocity: {
      daysOnMarket: 28,
      absorptionRate: 7.2,
      listingToSaleRatio: 97.5,
      pricePercentile: 94,
      priceChange6m: 1.8,
      priceChange12m: 3.8,
      priceChange24m: 7.8,
      newListings12m: 245,
      soldListings12m: 215,
      listingsRatio: 87.8,
    },
    rentalVelocity: {
      daysToLease: 11,
      absorptionRate: 9.5,
      rentChange6m: 2.8,
      rentChange12m: 5.8,
      rentChange24m: 11.8,
      vacancyRate: 1.5,
      newListings12m: 180,
      leasedListings12m: 165,
      marketTightness: 82,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 66,
    momentum: 'Strong',
    outlookMonths: 6,
    outlookDirection: 'Up',
    outlookConfidence: 70,
    hottestInCity: false,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  'austin-downtown-tx': {
    neighborhoodId: 'austin-downtown-tx',
    neighborhoodName: 'Downtown Austin',
    cityId: 'austin-tx',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Hot',
    marketHeat: 82,
    salesVelocity: {
      daysOnMarket: 12,
      absorptionRate: 14.2,
      listingToSaleRatio: 99.8,
      pricePercentile: 98,
      priceChange6m: 5.2,
      priceChange12m: 11.2,
      priceChange24m: 22.8,
      newListings12m: 185,
      soldListings12m: 175,
      listingsRatio: 94.6,
    },
    rentalVelocity: {
      daysToLease: 4,
      absorptionRate: 18.5,
      rentChange6m: 6.2,
      rentChange12m: 12.8,
      rentChange24m: 25.2,
      vacancyRate: 0.3,
      newListings12m: 95,
      leasedListings12m: 92,
      marketTightness: 96,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 86,
    momentum: 'Accelerating',
    outlookMonths: 3,
    outlookDirection: 'Up',
    outlookConfidence: 85,
    hottestInCity: true,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  'san-francisco-downtown-ca': {
    neighborhoodId: 'san-francisco-downtown-ca',
    neighborhoodName: 'SOMA / Downtown',
    cityId: 'san-francisco-ca',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Cool',
    marketHeat: 46,
    salesVelocity: {
      daysOnMarket: 45,
      absorptionRate: 4.8,
      listingToSaleRatio: 94.5,
      pricePercentile: 48,
      priceChange6m: -2.5,
      priceChange12m: -4.8,
      priceChange24m: -8.2,
      newListings12m: 285,
      soldListings12m: 165,
      listingsRatio: 57.9,
    },
    rentalVelocity: {
      daysToLease: 22,
      absorptionRate: 4.2,
      rentChange6m: -1.2,
      rentChange12m: -2.5,
      rentChange24m: -5.2,
      vacancyRate: 4.5,
      newListings12m: 155,
      leasedListings12m: 75,
      marketTightness: 35,
    },
    buyerMarket: true,
    sellerMarket: false,
    renterMarket: true,
    landlordMarket: false,
    marketVelocityIndex: 40,
    momentum: 'Declining',
    outlookMonths: 12,
    outlookDirection: 'Down',
    outlookConfidence: 76,
    hottestInCity: false,
    coldestInCity: true,
    fasterThanCity: false,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  'denver-downtown-co': {
    neighborhoodId: 'denver-downtown-co',
    neighborhoodName: 'Downtown Denver',
    cityId: 'denver-co',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Hot',
    marketHeat: 74,
    salesVelocity: {
      daysOnMarket: 20,
      absorptionRate: 10.8,
      listingToSaleRatio: 98.8,
      pricePercentile: 88,
      priceChange6m: 3.2,
      priceChange12m: 6.8,
      priceChange24m: 13.8,
      newListings12m: 215,
      soldListings12m: 195,
      listingsRatio: 90.7,
    },
    rentalVelocity: {
      daysToLease: 8,
      absorptionRate: 12.2,
      rentChange6m: 3.8,
      rentChange12m: 7.8,
      rentChange24m: 15.8,
      vacancyRate: 1.2,
      newListings12m: 125,
      leasedListings12m: 118,
      marketTightness: 84,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 74,
    momentum: 'Strong',
    outlookMonths: 6,
    outlookDirection: 'Up',
    outlookConfidence: 76,
    hottestInCity: false,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },

  'miami-brickell-fl': {
    neighborhoodId: 'miami-brickell-fl',
    neighborhoodName: 'Brickell',
    cityId: 'miami-fl',
    asOfDate: new Date('2026-08-04'),
    marketTemperature: 'Hot',
    marketHeat: 78,
    salesVelocity: {
      daysOnMarket: 16,
      absorptionRate: 12.5,
      listingToSaleRatio: 99.2,
      pricePercentile: 92,
      priceChange6m: 4.2,
      priceChange12m: 8.8,
      priceChange24m: 17.5,
      newListings12m: 265,
      soldListings12m: 245,
      listingsRatio: 92.5,
    },
    rentalVelocity: {
      daysToLease: 7,
      absorptionRate: 14.8,
      rentChange6m: 4.5,
      rentChange12m: 9.2,
      rentChange24m: 18.8,
      vacancyRate: 0.8,
      newListings12m: 155,
      leasedListings12m: 148,
      marketTightness: 90,
    },
    buyerMarket: false,
    sellerMarket: true,
    renterMarket: false,
    landlordMarket: true,
    marketVelocityIndex: 78,
    momentum: 'Accelerating',
    outlookMonths: 6,
    outlookDirection: 'Up',
    outlookConfidence: 78,
    hottestInCity: true,
    coldestInCity: false,
    fasterThanCity: true,
    source: `${DATA_SOURCES.FRED}, MLS`,
    confidence: 'high',
  },
};

/**
 * Fetch market velocity and momentum metrics for a neighborhood
 *
 * @param input Neighborhood ID, city ID, and optional date
 * @returns Market velocity metrics
 * @throws Error if neighborhood not found
 */
export function marketVelocityAnalyzer(input: MarketVelocityInput): MarketVelocityOutput {
  const { neighborhoodId, asOfDate } = input;

  const validatedDate = validateDateOrUseToday(asOfDate);

  const mockData = MOCK_DATA[neighborhoodId];
  if (!mockData) {
    throw new Error(`No market velocity data available for neighborhood "${neighborhoodId}".`);
  }

  return {
    ...mockData,
    asOfDate: validatedDate,
  };
}

export default marketVelocityAnalyzer;
