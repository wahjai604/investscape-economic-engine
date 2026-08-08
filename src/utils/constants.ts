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
 * Constants for economic engines
 *
 * Canadian regions based on Statistics Canada official divisions.
 * US regions based on US Census Bureau official divisions.
 */

// Canadian regions (Statistics Canada)
export const CANADIAN_REGIONS = {
  ATLANTIC: 'atlantic-canada',
  CENTRAL: 'central-canada',
  PRAIRIE: 'prairie-canada',
  WEST_COAST: 'west-coast-canada',
  NORTH: 'northern-canada',
} as const;

// US regions (US Census Bureau)
export const US_REGIONS = {
  NORTHEAST: 'us-northeast',
  MIDWEST: 'us-midwest',
  SOUTH: 'us-south',
  WEST: 'us-west',
} as const;

// Combined for backward compatibility and easier validation
export const REGIONS = {
  ...CANADIAN_REGIONS,
  ...US_REGIONS,
} as const;

export const REGION_NAMES: Record<string, string> = {
  // Canadian regions
  [CANADIAN_REGIONS.ATLANTIC]: 'Atlantic Canada (Maritimes)',
  [CANADIAN_REGIONS.CENTRAL]: 'Central Canada',
  [CANADIAN_REGIONS.PRAIRIE]: 'Prairie Provinces',
  [CANADIAN_REGIONS.WEST_COAST]: 'West Coast',
  [CANADIAN_REGIONS.NORTH]: 'Northern Canada',

  // US regions
  [US_REGIONS.NORTHEAST]: 'US Northeast',
  [US_REGIONS.MIDWEST]: 'US Midwest',
  [US_REGIONS.SOUTH]: 'US South',
  [US_REGIONS.WEST]: 'US West',
};

export const REGION_DETAILS: Record<string, { country: string; provinces?: string[]; states?: string[] }> = {
  // Canadian regions
  [CANADIAN_REGIONS.ATLANTIC]: {
    country: 'Canada',
    provinces: ['New Brunswick', 'Nova Scotia', 'Prince Edward Island', 'Newfoundland and Labrador'],
  },
  [CANADIAN_REGIONS.CENTRAL]: {
    country: 'Canada',
    provinces: ['Ontario', 'Quebec'],
  },
  [CANADIAN_REGIONS.PRAIRIE]: {
    country: 'Canada',
    provinces: ['Manitoba', 'Saskatchewan', 'Alberta'],
  },
  [CANADIAN_REGIONS.WEST_COAST]: {
    country: 'Canada',
    provinces: ['British Columbia'],
  },
  [CANADIAN_REGIONS.NORTH]: {
    country: 'Canada',
    provinces: ['Yukon', 'Northwest Territories', 'Nunavut'],
  },

  // US regions
  [US_REGIONS.NORTHEAST]: {
    country: 'United States',
    states: ['Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut', 'New York', 'Pennsylvania', 'New Jersey'],
  },
  [US_REGIONS.MIDWEST]: {
    country: 'United States',
    states: ['Ohio', 'Indiana', 'Illinois', 'Michigan', 'Wisconsin', 'Minnesota', 'Iowa', 'Missouri', 'North Dakota', 'South Dakota', 'Nebraska', 'Kansas'],
  },
  [US_REGIONS.SOUTH]: {
    country: 'United States',
    states: ['Delaware', 'Maryland', 'Virginia', 'West Virginia', 'North Carolina', 'South Carolina', 'Georgia', 'Florida', 'Kentucky', 'Tennessee', 'Mississippi', 'Alabama', 'Arkansas', 'Louisiana', 'Oklahoma', 'Texas'],
  },
  [US_REGIONS.WEST]: {
    country: 'United States',
    states: ['Montana', 'Idaho', 'Wyoming', 'Colorado', 'New Mexico', 'Arizona', 'Utah', 'Nevada', 'Washington', 'Oregon', 'California', 'Alaska', 'Hawaii'],
  },
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

// Data source attribution (locked per E29-E45 design spec)
export const DATA_SOURCES = {
  STATCAN: 'Statistics Canada',
  BOC: 'Bank of Canada',
  FRED: 'Federal Reserve FRED',
  CENSUS: 'US Census Bureau',
  CMHC: 'CMHC',
  CREA: 'CREA',
  CBRE: 'CBRE',
  FHFA: 'FHFA',
} as const;
