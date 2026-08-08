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
 * Neighborhood-level detailed data
 * Represents street-level granularity for micro analysis
 */

export interface NeighborhoodMetrics {
  neighborhoodId: string;            // 'vancouver-west-side'
  neighborhoodName: string;
  cityId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  asOfDate: Date;

  // Demographics
  population: number;
  populationGrowth: number;          // % annually
  medianAge: number;
  medianHouseholdIncome: number;
  householdCount: number;

  // Real estate
  medianListPrice: number;           // Last 12 months
  medianSoldPrice: number;
  pricePerSqft: number;
  medianRent: number;                // 1-bed average
  rentPerSqft: number;
  rentalVacancyRate: number;         // %
  daysOnMarket: number;
  soldVolume12m: number;             // Number of transactions

  // Walkability & transit
  walkScore: number;                 // 0-100
  transitScore: number;              // 0-100
  bikeScore: number;                 // 0-100

  // Schools (if included)
  nearbySchools?: Array<{
    name: string;
    type: 'elementary' | 'middle' | 'high';
    rating: number | null;           // 0-10 or null if unavailable
  }>;
  averageSchoolRating: number | null;

  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface NeighborhoodMetricsInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  asOfDate?: Date;
}
