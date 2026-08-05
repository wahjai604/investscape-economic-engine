/**
 * Region-level economic metrics
 * Represents macro context for a geographic region (e.g., Western Canada, US Southeast)
 */

export interface RegionMetrics {
  regionId: string;                  // 'western-canada', 'us-southeast', etc.
  regionName: string;                // 'Western Canada', 'US Southeast'
  asOfDate: Date;                    // When this data snapshot was taken

  // Macro indicators
  gdpGrowth: number | null;          // Annual %, e.g., 2.5
  inflationRate: number | null;      // Annual %, e.g., 3.2
  mortgageRate5yr: number;           // Current 5yr fixed %, e.g., 4.89
  employmentGrowth: number | null;   // Annual %, e.g., 1.1

  // Real estate specific
  constructionStarts: number;        // Units/year
  avgCapRate: number;                // %, e.g., 5.8
  avgAppreciation: number;           // Annual %, e.g., 3.5

  // Metadata
  source: string;                    // "StatCan", "FRED", "BoC", etc.
  confidence: 'high' | 'medium' | 'low';
}

export interface RegionMetricsInput {
  regionId: string;
  regionName: string;
  asOfDate?: Date;                   // Defaults to today
}
