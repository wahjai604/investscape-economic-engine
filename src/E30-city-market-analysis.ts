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
 * E30: City-Level Market Analysis Engine
 *
 * Analyzes mid-level real estate market data for specific cities.
 * Builds on E29 (regional macro context) to provide city-level metrics:
 * - Price trends and distribution
 * - Rental trends and vacancy
 * - Cap rate distribution
 * - Market velocity (days on market, absorption)
 *
 * Data sources (locked per E29-E45 design spec):
 * - CREA aggregate reports (Canada comps)
 * - Zillow API (US comps)
 * - CMHC Housing (Canada rental)
 * - ApartmentList (US rental)
 * - Census / StatCan (population)
 * - FRED / Realtor.com (US median days on market, per CBSA)
 * - Redfin Data Center (US months of supply, per metro)
 */

import { CityMetrics, CityMetricsInput } from './types';
import { validateRegionId, validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES, CANADIAN_REGIONS, US_REGIONS } from './utils/constants';

/**
 * Mock data store for E30.
 *
 * In production, this will query Supabase `economic_data.city_metrics` table
 * and join with regional context from E29.
 * For now, we use fixtures representing realistic Aug 4, 2026 market conditions.
 */
interface MockCityData {
  [cityId: string]: CityMetrics;
}

const MOCK_DATA: MockCityData = {
  // ===== CANADIAN CITIES =====

  // Atlantic Region Cities
  'halifax-ns': {
    cityId: 'halifax-ns',
    cityName: 'Halifax',
    province: 'Nova Scotia',
    regionId: CANADIAN_REGIONS.ATLANTIC,
    asOfDate: new Date('2026-08-04'),
    population: 438000,
    medianHousePrice: 475000,
    medianRent: 1850,
    capRateDistribution: {
      p25: 4.8,
      p50: 5.2,
      p75: 5.8,
    },
    priceChange12m: 2.1,
    rentChange12m: 4.2,
    daysOnMarket: 28,
    absorptionRate: 3.2,
    source: `${DATA_SOURCES.CREA}, ${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  'st-johns-nl': {
    cityId: 'st-johns-nl',
    cityName: "St. John's",
    province: 'Newfoundland and Labrador',
    regionId: CANADIAN_REGIONS.ATLANTIC,
    asOfDate: new Date('2026-08-04'),
    population: 108000,
    medianHousePrice: 385000,
    medianRent: 1650,
    capRateDistribution: {
      p25: 5.1,
      p50: 5.5,
      p75: 6.1,
    },
    priceChange12m: 1.5,
    rentChange12m: 3.8,
    daysOnMarket: 32,
    absorptionRate: 3.8,
    source: `${DATA_SOURCES.CREA}, ${DATA_SOURCES.CMHC}`,
    confidence: 'medium',
  },

  // Central Region Cities
  'toronto-on': {
    cityId: 'toronto-on',
    cityName: 'Toronto',
    province: 'Ontario',
    regionId: CANADIAN_REGIONS.CENTRAL,
    asOfDate: new Date('2026-08-04'),
    population: 2930000,
    medianHousePrice: 825000,
    medianRent: 2450,
    capRateDistribution: {
      p25: 4.1,
      p50: 4.6,
      p75: 5.2,
    },
    priceChange12m: 3.8,
    rentChange12m: 5.2,
    daysOnMarket: 18,
    absorptionRate: 2.1,
    source: `${DATA_SOURCES.CREA}, ${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  'montreal-qc': {
    cityId: 'montreal-qc',
    cityName: 'Montreal',
    province: 'Quebec',
    regionId: CANADIAN_REGIONS.CENTRAL,
    asOfDate: new Date('2026-08-04'),
    population: 4272000,
    medianHousePrice: 595000,
    medianRent: 1950,
    capRateDistribution: {
      p25: 4.3,
      p50: 4.9,
      p75: 5.6,
    },
    priceChange12m: 2.9,
    rentChange12m: 4.1,
    daysOnMarket: 21,
    absorptionRate: 2.4,
    source: `${DATA_SOURCES.CREA}, ${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  'ottawa-on': {
    cityId: 'ottawa-on',
    cityName: 'Ottawa',
    province: 'Ontario',
    regionId: CANADIAN_REGIONS.CENTRAL,
    asOfDate: new Date('2026-08-04'),
    population: 1376000,
    medianHousePrice: 625000,
    medianRent: 1850,
    capRateDistribution: {
      p25: 4.5,
      p50: 5.0,
      p75: 5.5,
    },
    priceChange12m: 2.3,
    rentChange12m: 3.9,
    daysOnMarket: 22,
    absorptionRate: 2.8,
    source: `${DATA_SOURCES.CREA}, ${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Prairie Region Cities
  'calgary-ab': {
    cityId: 'calgary-ab',
    cityName: 'Calgary',
    province: 'Alberta',
    regionId: CANADIAN_REGIONS.PRAIRIE,
    asOfDate: new Date('2026-08-04'),
    population: 1615000,
    medianHousePrice: 525000,
    medianRent: 1750,
    capRateDistribution: {
      p25: 5.2,
      p50: 5.8,
      p75: 6.5,
    },
    priceChange12m: 4.2,
    rentChange12m: 4.8,
    daysOnMarket: 24,
    absorptionRate: 2.9,
    source: `${DATA_SOURCES.CREA}, ${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  'edmonton-ab': {
    cityId: 'edmonton-ab',
    cityName: 'Edmonton',
    province: 'Alberta',
    regionId: CANADIAN_REGIONS.PRAIRIE,
    asOfDate: new Date('2026-08-04'),
    population: 1418000,
    medianHousePrice: 485000,
    medianRent: 1650,
    capRateDistribution: {
      p25: 5.3,
      p50: 5.9,
      p75: 6.6,
    },
    priceChange12m: 3.8,
    rentChange12m: 4.5,
    daysOnMarket: 26,
    absorptionRate: 3.1,
    source: `${DATA_SOURCES.CREA}, ${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  'winnipeg-mb': {
    cityId: 'winnipeg-mb',
    cityName: 'Winnipeg',
    province: 'Manitoba',
    regionId: CANADIAN_REGIONS.PRAIRIE,
    asOfDate: new Date('2026-08-04'),
    population: 932000,
    medianHousePrice: 395000,
    medianRent: 1450,
    capRateDistribution: {
      p25: 5.5,
      p50: 6.2,
      p75: 7.0,
    },
    priceChange12m: 2.1,
    rentChange12m: 3.2,
    daysOnMarket: 29,
    absorptionRate: 3.5,
    source: `${DATA_SOURCES.CREA}, ${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // West Coast Cities
  'vancouver-bc': {
    cityId: 'vancouver-bc',
    cityName: 'Vancouver',
    province: 'British Columbia',
    regionId: CANADIAN_REGIONS.WEST_COAST,
    asOfDate: new Date('2026-08-04'),
    population: 2642000,
    medianHousePrice: 1050000,
    medianRent: 2350,
    capRateDistribution: {
      p25: 3.8,
      p50: 4.3,
      p75: 4.9,
    },
    priceChange12m: 5.2,
    rentChange12m: 5.8,
    daysOnMarket: 16,
    absorptionRate: 1.8,
    source: `${DATA_SOURCES.CREA}, ${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  'victoria-bc': {
    cityId: 'victoria-bc',
    cityName: 'Victoria',
    province: 'British Columbia',
    regionId: CANADIAN_REGIONS.WEST_COAST,
    asOfDate: new Date('2026-08-04'),
    population: 440000,
    medianHousePrice: 875000,
    medianRent: 2050,
    capRateDistribution: {
      p25: 4.0,
      p50: 4.5,
      p75: 5.1,
    },
    priceChange12m: 4.9,
    rentChange12m: 5.3,
    daysOnMarket: 19,
    absorptionRate: 2.2,
    source: `${DATA_SOURCES.CREA}, ${DATA_SOURCES.CMHC}`,
    confidence: 'high',
  },

  // Northern Cities
  'yellowknife-nt': {
    cityId: 'yellowknife-nt',
    cityName: 'Yellowknife',
    province: 'Northwest Territories',
    regionId: CANADIAN_REGIONS.NORTH,
    asOfDate: new Date('2026-08-04'),
    population: 20000,
    medianHousePrice: 425000,
    medianRent: 1950,
    capRateDistribution: {
      p25: null,
      p50: null,
      p75: null,
    },
    priceChange12m: 1.2,
    rentChange12m: 2.8,
    daysOnMarket: 45,
    absorptionRate: 6.2,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'low',
  },

  // ===== US CITIES =====

  // Northeast Region Cities
  'boston-ma': {
    cityId: 'boston-ma',
    cityName: 'Boston',
    province: 'Massachusetts',
    regionId: US_REGIONS.NORTHEAST,
    asOfDate: new Date('2026-08-04'),
    population: 4941000,
    medianHousePrice: 595000,
    medianRent: 2150,
    capRateDistribution: {
      p25: 4.2,
      p50: 4.8,
      p75: 5.5,
    },
    priceChange12m: 2.8,
    rentChange12m: 4.2,
    daysOnMarket: 21,
    absorptionRate: 2.5,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  'new-york-ny': {
    cityId: 'new-york-ny',
    cityName: 'New York',
    province: 'New York',
    regionId: US_REGIONS.NORTHEAST,
    asOfDate: new Date('2026-08-04'),
    population: 20140000,
    medianHousePrice: 525000,
    medianRent: 2850,
    capRateDistribution: {
      p25: 3.9,
      p50: 4.5,
      p75: 5.2,
    },
    priceChange12m: 1.9,
    rentChange12m: 3.8,
    daysOnMarket: 25,
    absorptionRate: 2.8,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  'philadelphia-pa': {
    cityId: 'philadelphia-pa',
    cityName: 'Philadelphia',
    province: 'Pennsylvania',
    regionId: US_REGIONS.NORTHEAST,
    asOfDate: new Date('2026-08-04'),
    population: 6220000,
    medianHousePrice: 365000,
    medianRent: 1650,
    capRateDistribution: {
      p25: 5.1,
      p50: 5.8,
      p75: 6.5,
    },
    priceChange12m: 2.5,
    rentChange12m: 3.9,
    daysOnMarket: 28,
    absorptionRate: 3.2,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  // Midwest Region Cities
  'chicago-il': {
    cityId: 'chicago-il',
    cityName: 'Chicago',
    province: 'Illinois',
    regionId: US_REGIONS.MIDWEST,
    asOfDate: new Date('2026-08-04'),
    population: 9618000,
    medianHousePrice: 295000,
    medianRent: 1550,
    capRateDistribution: {
      p25: 5.8,
      p50: 6.5,
      p75: 7.2,
    },
    priceChange12m: 1.8,
    rentChange12m: 3.1,
    daysOnMarket: 32,
    absorptionRate: 3.8,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  'minneapolis-mn': {
    cityId: 'minneapolis-mn',
    cityName: 'Minneapolis',
    province: 'Minnesota',
    regionId: US_REGIONS.MIDWEST,
    asOfDate: new Date('2026-08-04'),
    population: 3664000,
    medianHousePrice: 385000,
    medianRent: 1450,
    capRateDistribution: {
      p25: 5.5,
      p50: 6.2,
      p75: 6.9,
    },
    priceChange12m: 2.2,
    rentChange12m: 3.5,
    daysOnMarket: 29,
    absorptionRate: 3.5,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  // South Region Cities
  'atlanta-ga': {
    cityId: 'atlanta-ga',
    cityName: 'Atlanta',
    province: 'Georgia',
    regionId: US_REGIONS.SOUTH,
    asOfDate: new Date('2026-08-04'),
    population: 6144000,
    medianHousePrice: 415000,
    medianRent: 1750,
    capRateDistribution: {
      p25: 5.9,
      p50: 6.6,
      p75: 7.4,
    },
    priceChange12m: 5.2,
    rentChange12m: 5.8,
    daysOnMarket: 19,
    absorptionRate: 2.2,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  'miami-fl': {
    cityId: 'miami-fl',
    cityName: 'Miami',
    province: 'Florida',
    regionId: US_REGIONS.SOUTH,
    asOfDate: new Date('2026-08-04'),
    population: 6166000,
    medianHousePrice: 525000,
    medianRent: 2150,
    capRateDistribution: {
      p25: 5.2,
      p50: 5.9,
      p75: 6.7,
    },
    priceChange12m: 6.1,
    rentChange12m: 6.3,
    daysOnMarket: 17,
    absorptionRate: 1.9,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  // ===== MARKET VELOCITY SOURCING (houston/austin/phoenix/dallas/
  // san-antonio/tucson) =====
  //
  // daysOnMarket and absorptionRate on the six metros below are real, retrieved
  // 2026-09-09. Reproduce with:
  //   node scripts/fetch-fred-days-on-market.mjs
  //   node scripts/fetch-redfin-months-of-supply.mjs
  //
  // daysOnMarket  <- FRED series MEDDAYONMAR<CBSA> ("Housing Inventory: Median
  //   Days on Market"), monthly, not seasonally adjusted, Realtor.com data
  //   republished by FRED. All six series were confirmed to exist before any
  //   value was read. VINTAGE: observation month 2026-08 (series last updated
  //   2026-09-04) for all six.
  //
  // absorptionRate <- Redfin Data Center metro market tracker, column
  //   MONTHS_OF_SUPPLY, property type "All Residential", 30-day period, not
  //   seasonally adjusted. The field's documented unit is "Months of inventory",
  //   so this is a direct match with no conversion. VINTAGE: month ending
  //   2026-05-31 (file last modified 2026-06-02) for all six.
  //
  // MIXED VINTAGE IS DELIBERATE AND UNRESOLVED: DOM is an August 2026 figure,
  // months-of-supply is a May 2026 figure, and the record's asOfDate is
  // 2026-08-04. Redfin's public bulk file simply had not been refreshed past May
  // when this was pulled. The stale-but-real May number is preferred over
  // extrapolating an August one. This mismatch is a second reason confidence
  // stays 'medium'.
  //
  // These replaced placeholders that were badly wrong, not merely imprecise —
  // the old values claimed 15-22 days on market and 1.6-2.5 months of supply,
  // i.e. a hot seller's market. Both independent sources agree these metros are
  // actually slow (52-73 days, 3.5-5.4 months). Do not "correct" them back
  // toward the old range because it looks more familiar.
  //
  // Verified against Zillow Research's live public ZHVI/ZORI CSVs on 2026-09-06
  // (files.zillowstatic.com/research/public_csvs/{zhvi,zori}/...), metro
  // "Houston, TX", period 2026-07-31 vs 2025-07-31. Population verified against
  // Census ACS 1-year estimates (api.census.gov/data/2023/acs/acs1), metro
  // "Houston-Pasadena-The Woodlands, TX Metro Area" (CBSA 26420), 2026-09-06.
  //
  // daysOnMarket: real, FRED series MEDDAYONMAR26420 (Realtor.com via FRED),
  // observation month 2026-08, retrieved 2026-09-09.
  // absorptionRate: real, Redfin metro market tracker MONTHS_OF_SUPPLY for
  // "Houston, TX metro area" (26420), month ending 2026-05-31, retrieved
  // 2026-09-09. See the MARKET VELOCITY SOURCING note above this block.
  //
  // capRateDistribution corrected 2026-09-09 from an invented placeholder
  // (p50 6.9) to null, matching dallas-tx/san-antonio-tx/tucson-az's
  // documented convention for unverified markets — cap rate is a confirmed
  // dead end, no free public per-metro feed exists (CoStar/Reis/MSCI own
  // this space). confidence stays 'medium'.
  'houston-tx': {
    cityId: 'houston-tx',
    cityName: 'Houston',
    province: 'Texas',
    regionId: US_REGIONS.SOUTH,
    asOfDate: new Date('2026-08-04'),
    population: 7510252,
    medianHousePrice: 307772,
    medianRent: 1654,
    capRateDistribution: {
      p25: null,
      p50: null,
      p75: null,
    },
    priceChange12m: -2.0,
    rentChange12m: -0.0,
    daysOnMarket: 52,
    absorptionRate: 4.2,
    source: `${DATA_SOURCES.FRED}, Zillow ZHVI/ZORI, ${DATA_SOURCES.REDFIN}`,
    confidence: 'medium',
  },

  // Verified against Zillow Research's live public ZHVI/ZORI CSVs on 2026-09-06,
  // metro "Dallas, TX", period 2026-07-31 vs 2025-07-31. Population verified
  // against Census ACS 1-year estimates (2023), metro "Dallas-Fort Worth-Arlington,
  // TX Metro Area" (CBSA 19100). medianHousePrice/medianRent/priceChange12m/
  // rentChange12m/population are real, live-sourced. capRateDistribution set to
  // null (no reliable source found, per the type's own documented convention for
  // sparse/unverified markets) rather than reusing an invented number.
  //
  // daysOnMarket: real, FRED MEDDAYONMAR19100 ("Dallas-Fort Worth-Arlington,
  // TX"), observation month 2026-08, retrieved 2026-09-09 — full CBSA, matches
  // the population/price basis of this record.
  //
  // absorptionRate: real, Redfin metro market tracker MONTHS_OF_SUPPLY, month
  // ending 2026-05-31, retrieved 2026-09-09 — BUT note the geography differs.
  // Redfin publishes no row for CBSA 19100; it splits DFW into "Dallas, TX
  // metro area" (Metropolitan Division 19124) and "Fort Worth, TX metro area"
  // (23104). The 4.2 below is Redfin's Dallas division (19124) only, i.e. it
  // excludes Fort Worth-Arlington, while every other field on this record is
  // DFW-wide. Blending the two divisions into a DFW-wide months-of-supply is
  // NOT something Redfin publishes, so it is not synthesised here. This is the
  // one geographic seam in the six real metros; keep it in mind before
  // promoting this record to confidence 'high'.
  'dallas-tx': {
    cityId: 'dallas-tx',
    cityName: 'Dallas',
    province: 'Texas',
    regionId: US_REGIONS.SOUTH,
    asOfDate: new Date('2026-08-04'),
    population: 8100037,
    medianHousePrice: 364793,
    medianRent: 1667,
    capRateDistribution: {
      p25: null,
      p50: null,
      p75: null,
    },
    priceChange12m: -2.6,
    rentChange12m: 0.1,
    daysOnMarket: 58,
    absorptionRate: 4.2,
    source: `${DATA_SOURCES.FRED}, Zillow ZHVI/ZORI, ${DATA_SOURCES.REDFIN}`,
    confidence: 'medium',
  },

  // Same verification pass as dallas-tx above, metro "San Antonio, TX" /
  // Census CBSA 41700 ("San Antonio-New Braunfels, TX Metro Area").
  // daysOnMarket: real, FRED MEDDAYONMAR41700, month 2026-08.
  // absorptionRate: real, Redfin 41700 MONTHS_OF_SUPPLY, month ending
  // 2026-05-31. Both retrieved 2026-09-09; Redfin code matches the CBSA.
  'san-antonio-tx': {
    cityId: 'san-antonio-tx',
    cityName: 'San Antonio',
    province: 'Texas',
    regionId: US_REGIONS.SOUTH,
    asOfDate: new Date('2026-08-04'),
    population: 2703999,
    medianHousePrice: 279434,
    medianRent: 1425,
    capRateDistribution: {
      p25: null,
      p50: null,
      p75: null,
    },
    priceChange12m: -1.9,
    rentChange12m: -1.8,
    daysOnMarket: 68,
    absorptionRate: 5.4,
    source: `${DATA_SOURCES.FRED}, Zillow ZHVI/ZORI, ${DATA_SOURCES.REDFIN}`,
    confidence: 'medium',
  },

  // Same verification pass as dallas-tx above, metro "Tucson, AZ" /
  // Census CBSA 46060 ("Tucson, AZ Metro Area").
  // daysOnMarket: real, FRED MEDDAYONMAR46060, month 2026-08 — confirmed the
  // series does exist for Tucson (it is the smallest of the six metros, so this
  // was checked explicitly rather than assumed).
  // absorptionRate: real, Redfin 46060 MONTHS_OF_SUPPLY, month ending
  // 2026-05-31. Both retrieved 2026-09-09; Redfin code matches the CBSA.
  'tucson-az': {
    cityId: 'tucson-az',
    cityName: 'Tucson',
    province: 'Arizona',
    regionId: US_REGIONS.WEST,
    asOfDate: new Date('2026-08-04'),
    population: 1063162,
    medianHousePrice: 340855,
    medianRent: 1483,
    capRateDistribution: {
      p25: null,
      p50: null,
      p75: null,
    },
    priceChange12m: -2.0,
    rentChange12m: 1.1,
    daysOnMarket: 63,
    absorptionRate: 3.7,
    source: `${DATA_SOURCES.FRED}, Zillow ZHVI/ZORI, ${DATA_SOURCES.REDFIN}`,
    confidence: 'medium',
  },

  // NOTE: Prescott Valley-Prescott, AZ (Census CBSA 39150, population
  // 249,081 verified via ACS 2023 1-year estimates) is deliberately NOT
  // added here. Zillow's metro-level ZHVI/ZORI files (895 US metros,
  // checked 2026-09-06) do not cover this metro at all — it's too small
  // for their metro-level research feed. Rather than invent a price/rent
  // figure, this metro stays unbuilt until a real source is found. Do not
  // add it with placeholder numbers — that's exactly the fabricated-data
  // bug this file was fixed for earlier today.

  // Same verification pass as houston-tx above, metro "Austin, TX" /
  // Census CBSA 12420 ("Austin-Round Rock-San Marcos, TX Metro Area").
  // daysOnMarket: real, FRED MEDDAYONMAR12420, month 2026-08 — 73 days, the
  // slowest of the six, consistent with Austin's post-2023 correction.
  // absorptionRate: real, Redfin 12420 MONTHS_OF_SUPPLY, month ending
  // 2026-05-31. Both retrieved 2026-09-09; Redfin code matches the CBSA.
  // (Redfin region 12380 is Austin, MINNESOTA — explicitly excluded.)
  //
  // capRateDistribution corrected 2026-09-09 from an invented placeholder
  // (p50 6.4) to null — see houston-tx's note above; same dead-end, same
  // documented convention.
  'austin-tx': {
    cityId: 'austin-tx',
    cityName: 'Austin',
    province: 'Texas',
    regionId: US_REGIONS.SOUTH,
    asOfDate: new Date('2026-08-04'),
    population: 2473275,
    medianHousePrice: 424339,
    medianRent: 1647,
    capRateDistribution: {
      p25: null,
      p50: null,
      p75: null,
    },
    priceChange12m: -5.2,
    rentChange12m: -0.9,
    daysOnMarket: 73,
    absorptionRate: 5.2,
    source: `${DATA_SOURCES.FRED}, Zillow ZHVI/ZORI, ${DATA_SOURCES.REDFIN}`,
    confidence: 'medium',
  },

  'nashville-tn': {
    cityId: 'nashville-tn',
    cityName: 'Nashville',
    province: 'Tennessee',
    regionId: US_REGIONS.SOUTH,
    asOfDate: new Date('2026-08-04'),
    population: 1960000,
    medianHousePrice: 485000,
    medianRent: 1650,
    capRateDistribution: {
      p25: 6.1,
      p50: 6.8,
      p75: 7.5,
    },
    priceChange12m: 6.8,
    rentChange12m: 6.2,
    daysOnMarket: 16,
    absorptionRate: 1.8,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  // West Region Cities
  'los-angeles-ca': {
    cityId: 'los-angeles-ca',
    cityName: 'Los Angeles',
    province: 'California',
    regionId: US_REGIONS.WEST,
    asOfDate: new Date('2026-08-04'),
    population: 13200000,
    medianHousePrice: 725000,
    medianRent: 2550,
    capRateDistribution: {
      p25: 4.1,
      p50: 4.8,
      p75: 5.5,
    },
    priceChange12m: 3.2,
    rentChange12m: 4.1,
    daysOnMarket: 22,
    absorptionRate: 2.6,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  'san-francisco-ca': {
    cityId: 'san-francisco-ca',
    cityName: 'San Francisco',
    province: 'California',
    regionId: US_REGIONS.WEST,
    asOfDate: new Date('2026-08-04'),
    population: 7753000,
    medianHousePrice: 1150000,
    medianRent: 3150,
    capRateDistribution: {
      p25: 3.2,
      p50: 3.9,
      p75: 4.6,
    },
    priceChange12m: 2.1,
    rentChange12m: 3.5,
    daysOnMarket: 26,
    absorptionRate: 2.9,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  'seattle-wa': {
    cityId: 'seattle-wa',
    cityName: 'Seattle',
    province: 'Washington',
    regionId: US_REGIONS.WEST,
    asOfDate: new Date('2026-08-04'),
    population: 4039000,
    medianHousePrice: 675000,
    medianRent: 2250,
    capRateDistribution: {
      p25: 4.3,
      p50: 4.9,
      p75: 5.6,
    },
    priceChange12m: 3.8,
    rentChange12m: 4.5,
    daysOnMarket: 21,
    absorptionRate: 2.4,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  'denver-co': {
    cityId: 'denver-co',
    cityName: 'Denver',
    province: 'Colorado',
    regionId: US_REGIONS.WEST,
    asOfDate: new Date('2026-08-04'),
    population: 2997000,
    medianHousePrice: 585000,
    medianRent: 1850,
    capRateDistribution: {
      p25: 5.2,
      p50: 5.9,
      p75: 6.6,
    },
    priceChange12m: 4.5,
    rentChange12m: 5.2,
    daysOnMarket: 18,
    absorptionRate: 2.1,
    source: `${DATA_SOURCES.FRED}, Zillow`,
    confidence: 'high',
  },

  // Same verification pass as houston-tx/austin-tx above, metro "Phoenix, AZ" /
  // Census CBSA 38060 ("Phoenix-Mesa-Chandler, AZ Metro Area").
  // daysOnMarket: real, FRED MEDDAYONMAR38060, month 2026-08.
  // absorptionRate: real, Redfin 38060 MONTHS_OF_SUPPLY, month ending
  // 2026-05-31. Both retrieved 2026-09-09; Redfin code matches the CBSA.
  //
  // capRateDistribution corrected 2026-09-09 from an invented placeholder
  // (p50 6.8) to null — see houston-tx's note above; same dead-end, same
  // documented convention.
  'phoenix-az': {
    cityId: 'phoenix-az',
    cityName: 'Phoenix',
    province: 'Arizona',
    regionId: US_REGIONS.WEST,
    asOfDate: new Date('2026-08-04'),
    population: 5070110,
    medianHousePrice: 445924,
    medianRent: 1727,
    capRateDistribution: {
      p25: null,
      p50: null,
      p75: null,
    },
    priceChange12m: -1.5,
    rentChange12m: 0.3,
    daysOnMarket: 67,
    absorptionRate: 3.5,
    source: `${DATA_SOURCES.FRED}, Zillow ZHVI/ZORI, ${DATA_SOURCES.REDFIN}`,
    confidence: 'medium',
  },
};

/**
 * Fetch city-level market analysis
 *
 * @param input City ID, name, province, region, and optional date
 * @returns City market metrics (prices, rents, cap rates, trends, velocity)
 * @throws Error if city not found, region invalid, or date invalid
 *
 * @example
 * const metrics = cityMarketAnalysis({
 *   cityId: 'toronto-on',
 *   cityName: 'Toronto',
 *   province: 'Ontario',
 *   regionId: 'central-canada',
 * });
 * console.log(metrics.medianHousePrice); // 825000
 */
export function cityMarketAnalysis(input: CityMetricsInput): CityMetrics {
  const { cityId, regionId, asOfDate } = input;

  // Validate
  validateRegionId(regionId);
  const validatedDate = validateDateOrUseToday(asOfDate);

  // Look up mock data
  const mockData = MOCK_DATA[cityId];
  if (!mockData) {
    throw new Error(`City "${cityId}" not found in data sources.`);
  }

  // Verify region matches
  if (mockData.regionId !== regionId) {
    throw new Error(
      `City "${cityId}" belongs to region "${mockData.regionId}", ` +
      `but input specified region "${regionId}".`
    );
  }

  // Date matching (same logic as E29)
  if (validatedDate.toDateString() !== mockData.asOfDate.toDateString()) {
    throw new Error(
      `No data available for city "${cityId}" on ${validatedDate.toISOString().split('T')[0]}. ` +
      `Latest data: ${mockData.asOfDate.toISOString().split('T')[0]}`
    );
  }

  return mockData;
}

export default cityMarketAnalysis;
