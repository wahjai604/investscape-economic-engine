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

  // Cap rate distribution
  capRateDistribution: {
    p25: number;
    p50: number;
    p75: number;
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
