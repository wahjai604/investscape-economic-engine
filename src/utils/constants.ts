/**
 * Constants for economic engines
 */

export const REGIONS = {
  WESTERN_CANADA: 'western-canada',
  EASTERN_CANADA: 'eastern-canada',
  US_SOUTHEAST: 'us-southeast',
  US_SOUTHWEST: 'us-southwest',
  US_MIDWEST: 'us-midwest',
  US_NORTHEAST: 'us-northeast',
  US_WEST: 'us-west',
} as const;

export const REGION_NAMES: Record<string, string> = {
  [REGIONS.WESTERN_CANADA]: 'Western Canada',
  [REGIONS.EASTERN_CANADA]: 'Eastern Canada',
  [REGIONS.US_SOUTHEAST]: 'US Southeast',
  [REGIONS.US_SOUTHWEST]: 'US Southwest',
  [REGIONS.US_MIDWEST]: 'US Midwest',
  [REGIONS.US_NORTHEAST]: 'US Northeast',
  [REGIONS.US_WEST]: 'US West',
};

export const CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const DATA_FRESHNESS_TTL = {
  RATES: 7 * 24 * 60 * 60 * 1000,        // 7 days
  COMPS: 30 * 24 * 60 * 60 * 1000,       // 30 days
  DEMOGRAPHICS: 90 * 24 * 60 * 60 * 1000, // 90 days
  MACRO: 14 * 24 * 60 * 60 * 1000,       // 14 days
} as const;
