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
 * City-level market metrics
 * Represents mid-level market analysis for a specific city
 */

export interface CityMetrics {
  cityId: string;                    // 'vancouver-bc', 'toronto-on'
  cityName: string;
  province: string;                  // Province or state
  regionId: string;                  // Link to parent region
  asOfDate: Date;

  // Market data
  population: number;
  medianHousePrice: number;          // CAD or USD (specified separately)
  medianRent: number;                // Monthly, specified unit type

  // Cap rate distribution (null where no reliable data exists, e.g. sparse markets)
  capRateDistribution: {
    p25: number | null;
    p50: number | null;
    p75: number | null;
  };

  // Trends
  priceChange12m: number;            // %, e.g., 3.2
  rentChange12m: number;             // %, e.g., 2.1

  // Market velocity
  daysOnMarket: number;
  absorptionRate: number;            // Months of inventory

  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CityMetricsInput {
  cityId: string;
  cityName: string;
  province: string;
  regionId: string;
  asOfDate?: Date;
}
