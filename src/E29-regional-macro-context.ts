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
 * E29: Regional Macro Context Engine
 *
 * Fetches and aggregates macro-level economic data for a given region.
 * This is the foundation for all downstream neighborhood/city analysis.
 *
 * Data sources (locked per E29-E45 design spec):
 * - Statistics Canada (GDP, inflation, employment, mortgage rates, construction starts)
 * - Federal Reserve FRED (US economic data)
 * - Bank of Canada (Canadian rates)
 * - CREA / Census Bureau (real estate metrics)
 * - CMHC Housing Starts
 * - CBRE Reports (cap rates)
 * - FHFA (appreciation trends)
 */

import { RegionMetrics, RegionMetricsInput } from './types';
import { validateRegionId, validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * Mock data store for E29.
 *
 * In production, this will query Supabase `economic_data.region_metrics` table.
 * For now, we use fixtures that represent realistic data as of Aug 4, 2026.
 */
interface MockRegionData {
  [regionId: string]: RegionMetrics;
}

const MOCK_DATA: MockRegionData = {
  'atlantic-canada': {
    regionId: 'atlantic-canada',
    regionName: 'Atlantic Canada (Maritimes)',
    asOfDate: new Date('2026-08-04'),
    gdpGrowth: 1.8,
    inflationRate: 2.4,
    mortgageRate5yr: 4.89,
    employmentGrowth: 0.5,
    constructionStarts: 12000,
    avgCapRate: 5.1,
    avgAppreciation: 2.8,
    source: `${DATA_SOURCES.STATCAN}, ${DATA_SOURCES.BOC}, ${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },
  'central-canada': {
    regionId: 'central-canada',
    regionName: 'Central Canada',
    asOfDate: new Date('2026-08-04'),
    gdpGrowth: 2.2,
    inflationRate: 2.7,
    mortgageRate5yr: 4.89,
    employmentGrowth: 0.9,
    constructionStarts: 68000,
    avgCapRate: 4.6,
    avgAppreciation: 3.2,
    source: `${DATA_SOURCES.STATCAN}, ${DATA_SOURCES.BOC}, ${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },
  'prairie-canada': {
    regionId: 'prairie-canada',
    regionName: 'Prairie Provinces',
    asOfDate: new Date('2026-08-04'),
    gdpGrowth: 2.5,
    inflationRate: 2.9,
    mortgageRate5yr: 4.89,
    employmentGrowth: 1.2,
    constructionStarts: 35000,
    avgCapRate: 5.5,
    avgAppreciation: 3.5,
    source: `${DATA_SOURCES.STATCAN}, ${DATA_SOURCES.BOC}, ${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },
  'west-coast-canada': {
    regionId: 'west-coast-canada',
    regionName: 'West Coast',
    asOfDate: new Date('2026-08-04'),
    gdpGrowth: 2.0,
    inflationRate: 2.6,
    mortgageRate5yr: 4.89,
    employmentGrowth: 0.8,
    constructionStarts: 42000,
    avgCapRate: 4.3,
    avgAppreciation: 3.8,
    source: `${DATA_SOURCES.STATCAN}, ${DATA_SOURCES.BOC}, ${DATA_SOURCES.CREA}`,
    confidence: 'high',
  },
  'northern-canada': {
    regionId: 'northern-canada',
    regionName: 'Northern Canada',
    asOfDate: new Date('2026-08-04'),
    gdpGrowth: 1.5,
    inflationRate: 3.2,
    mortgageRate5yr: 5.19,
    employmentGrowth: 0.3,
    constructionStarts: 2000,
    avgCapRate: null,
    avgAppreciation: 2.1,
    source: `${DATA_SOURCES.STATCAN}, ${DATA_SOURCES.BOC}`,
    confidence: 'medium',
  },
  'us-northeast': {
    regionId: 'us-northeast',
    regionName: 'US Northeast',
    asOfDate: new Date('2026-08-04'),
    gdpGrowth: 2.3,
    inflationRate: 2.8,
    mortgageRate5yr: 5.42,
    employmentGrowth: 0.9,
    constructionStarts: 185000,
    avgCapRate: 5.2,
    avgAppreciation: 3.5,
    source: `${DATA_SOURCES.FRED}, ${DATA_SOURCES.CENSUS}, ${DATA_SOURCES.CBRE}`,
    confidence: 'high',
  },
  'us-midwest': {
    regionId: 'us-midwest',
    regionName: 'US Midwest',
    asOfDate: new Date('2026-08-04'),
    gdpGrowth: 2.1,
    inflationRate: 2.7,
    mortgageRate5yr: 5.42,
    employmentGrowth: 0.7,
    constructionStarts: 215000,
    avgCapRate: 5.8,
    avgAppreciation: 2.9,
    source: `${DATA_SOURCES.FRED}, ${DATA_SOURCES.CENSUS}, ${DATA_SOURCES.CBRE}`,
    confidence: 'high',
  },
  'us-south': {
    regionId: 'us-south',
    regionName: 'US South',
    asOfDate: new Date('2026-08-04'),
    gdpGrowth: 2.9,
    inflationRate: 3.0,
    mortgageRate5yr: 5.42,
    employmentGrowth: 1.4,
    constructionStarts: 420000,
    avgCapRate: 6.2,
    avgAppreciation: 4.1,
    source: `${DATA_SOURCES.FRED}, ${DATA_SOURCES.CENSUS}, ${DATA_SOURCES.CBRE}`,
    confidence: 'high',
  },
  'us-west': {
    regionId: 'us-west',
    regionName: 'US West',
    asOfDate: new Date('2026-08-04'),
    gdpGrowth: 2.6,
    inflationRate: 3.1,
    mortgageRate5yr: 5.42,
    employmentGrowth: 1.1,
    constructionStarts: 280000,
    avgCapRate: 5.5,
    avgAppreciation: 4.5,
    source: `${DATA_SOURCES.FRED}, ${DATA_SOURCES.CENSUS}, ${DATA_SOURCES.CBRE}`,
    confidence: 'high',
  },
};

/**
 * Fetch regional macro context
 *
 * @param input Region ID, name, and optional date
 * @returns Region macro metrics (GDP, inflation, rates, cap rates, etc.)
 * @throws Error if region not found or date is invalid
 *
 * @example
 * const metrics = regionalMacroContext({
 *   regionId: 'central-canada',
 *   regionName: 'Central Canada',
 * });
 * console.log(metrics.gdpGrowth); // 2.2
 */
export function regionalMacroContext(input: RegionMetricsInput): RegionMetrics {
  const { regionId, asOfDate } = input;

  // Validate
  validateRegionId(regionId);
  const validatedDate = validateDateOrUseToday(asOfDate);

  // Look up mock data
  const mockData = MOCK_DATA[regionId];
  if (!mockData) {
    throw new Error(`Region "${regionId}" not found in data sources.`);
  }

  // In production, this would query Supabase with date filtering:
  // const result = await supabase
  //   .from('region_metrics')
  //   .select('*')
  //   .eq('region_id', regionId)
  //   .eq('as_of_date', validatedDate)
  //   .single();
  //
  // For now, if date doesn't match mock, throw
  if (validatedDate.toDateString() !== mockData.asOfDate.toDateString()) {
    // In real implementation, would return closest historical snapshot or throw
    throw new Error(
      `No data available for region "${regionId}" on ${validatedDate.toISOString().split('T')[0]}. ` +
      `Latest data: ${mockData.asOfDate.toISOString().split('T')[0]}`
    );
  }

  return mockData;
}

export default regionalMacroContext;
