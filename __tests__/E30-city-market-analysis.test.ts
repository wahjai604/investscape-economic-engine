/**
 * InvestScape™ Test Suite
 * © 2026 Lighthouse Research Ltd. All rights reserved.
 *
 * Test methodology and validation data are proprietary.
 * See LICENSE for usage restrictions.
 */

/**
 * E30 Test Suite: City-Level Market Analysis Engine
 *
 * Tests cover:
 * - Canadian city data retrieval (10 cities across 5 regions)
 * - US city data retrieval (13 cities across 4 regions)
 * - Price and rent trends
 * - Cap rate distributions
 * - Market velocity (days on market, absorption)
 * - Error handling (unknown city, invalid region, region mismatch)
 * - Null handling (sparse markets like Yellowknife)
 * - Cross-city and cross-region comparisons
 */

import { cityMarketAnalysis } from '../src/E30-city-market-analysis';
import { CANADIAN_REGIONS, US_REGIONS } from '../src/utils/constants';

describe('E30: City-Level Market Analysis Engine', () => {

  describe('Canadian Cities - Atlantic Region', () => {

    it('should return Halifax market analysis with positive growth', () => {
      const result = cityMarketAnalysis({
        cityId: 'halifax-ns',
        cityName: 'Halifax',
        province: 'Nova Scotia',
        regionId: CANADIAN_REGIONS.ATLANTIC,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.cityName).toBe('Halifax');
      expect(result.medianHousePrice).toBe(475000);
      expect(result.medianRent).toBe(1850);
      expect(result.priceChange12m).toBe(2.1);
      expect(result.rentChange12m).toBe(4.2);
      expect(result.daysOnMarket).toBe(28);
      // Cap rate removed 2026-09-11 (E68 Phase 4B audit): "CREA, CMHC" is not
      // valid commercial cap-rate provenance and no free replacement was found
      // for this exact city/range. Real C&W Canadian multifamily data lives in
      // E68, not written back here (see E30 in-file audit comment).
      expect(result.capRateDistribution.p50).toBeNull();
      expect(result.confidence).toBe('high');
    });

    it("should return St. John's market analysis with medium confidence", () => {
      const result = cityMarketAnalysis({
        cityId: 'st-johns-nl',
        cityName: "St. John's",
        province: 'Newfoundland and Labrador',
        regionId: CANADIAN_REGIONS.ATLANTIC,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.confidence).toBe('medium');
      expect(result.medianHousePrice).toBeLessThan(475000); // Smaller market
      expect(result.absorptionRate).toBeGreaterThan(3.2); // Slower market
    });
  });

  describe('Canadian Cities - Central Region', () => {

    it('should return Toronto as most expensive Canadian market', () => {
      const result = cityMarketAnalysis({
        cityId: 'toronto-on',
        cityName: 'Toronto',
        province: 'Ontario',
        regionId: CANADIAN_REGIONS.CENTRAL,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHousePrice).toBe(825000);
      // Cap rate removed 2026-09-11 (E68 Phase 4B audit): "CREA, CMHC" is not
      // valid commercial cap-rate provenance and no free replacement was found
      // for this exact city/range. Real C&W Canadian multifamily data lives in
      // E68, not written back here (see E30 in-file audit comment).
      expect(result.capRateDistribution.p50).toBeNull(); // was 4.6, now unsourced
      expect(result.daysOnMarket).toBe(18); // Fast market
      expect(result.rentChange12m).toBe(5.2); // Strong rental growth
    });

    it('should return Montreal as second-largest metro', () => {
      const result = cityMarketAnalysis({
        cityId: 'montreal-qc',
        cityName: 'Montreal',
        province: 'Quebec',
        regionId: CANADIAN_REGIONS.CENTRAL,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.population).toBe(4272000); // Largest population
      expect(result.medianHousePrice).toBe(595000); // More affordable than Toronto
      expect(result.absorptionRate).toBe(2.4);
    });

    it('should return Ottawa as growing tech hub', () => {
      const result = cityMarketAnalysis({
        cityId: 'ottawa-on',
        cityName: 'Ottawa',
        province: 'Ontario',
        regionId: CANADIAN_REGIONS.CENTRAL,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceChange12m).toBe(2.3);
      expect(result.rentChange12m).toBe(3.9);
      expect(result.medianHousePrice).toBe(625000); // Between Montreal and Toronto
    });
  });

  describe('Canadian Cities - Prairie Region', () => {

    it('should return Calgary with high cap rates and appreciation', () => {
      const result = cityMarketAnalysis({
        cityId: 'calgary-ab',
        cityName: 'Calgary',
        province: 'Alberta',
        regionId: CANADIAN_REGIONS.PRAIRIE,
        asOfDate: new Date('2026-08-04'),
      });

      // Cap rate removed 2026-09-11 (E68 Phase 4B audit): "CREA, CMHC" is not
      // valid commercial cap-rate provenance and no free replacement was found
      // for this exact city/range. Real C&W Canadian multifamily data lives in
      // E68, not written back here (see E30 in-file audit comment).
      expect(result.capRateDistribution.p50).toBeNull(); // was 5.8, now unsourced
      expect(result.priceChange12m).toBe(4.2); // Strong appreciation
      expect(result.rentChange12m).toBe(4.8);
    });

    it('should return Edmonton with similar metrics to Calgary', () => {
      const result = cityMarketAnalysis({
        cityId: 'edmonton-ab',
        cityName: 'Edmonton',
        province: 'Alberta',
        regionId: CANADIAN_REGIONS.PRAIRIE,
        asOfDate: new Date('2026-08-04'),
      });

      // Cap rate removed 2026-09-11 (E68 Phase 4B audit): "CREA, CMHC" is not
      // valid commercial cap-rate provenance and no free replacement was found
      // for this exact city/range. Real C&W Canadian multifamily data lives in
      // E68, not written back here (see E30 in-file audit comment).
      expect(result.capRateDistribution.p50).toBeNull(); // was toBeGreaterThan(5.8)
      expect(result.medianHousePrice).toBeLessThan(525000); // More affordable
    });

    it('should return Winnipeg as most affordable Prairie city', () => {
      const result = cityMarketAnalysis({
        cityId: 'winnipeg-mb',
        cityName: 'Winnipeg',
        province: 'Manitoba',
        regionId: CANADIAN_REGIONS.PRAIRIE,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHousePrice).toBe(395000); // Lowest in Prairie
      // Cap rate removed 2026-09-11 (E68 Phase 4B audit): "CREA, CMHC" is not
      // valid commercial cap-rate provenance and no free replacement was found
      // for this exact city/range. Real C&W Canadian multifamily data lives in
      // E68, not written back here (see E30 in-file audit comment).
      expect(result.capRateDistribution.p50).toBeNull(); // was 6.2, now unsourced
      expect(result.medianRent).toBe(1450); // Lowest rent
    });
  });

  describe('Canadian Cities - West Coast Region', () => {

    it('should return Vancouver as most expensive Canadian city', () => {
      const result = cityMarketAnalysis({
        cityId: 'vancouver-bc',
        cityName: 'Vancouver',
        province: 'British Columbia',
        regionId: CANADIAN_REGIONS.WEST_COAST,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHousePrice).toBe(1050000); // Most expensive
      // Cap rate removed 2026-09-11 (E68 Phase 4B audit): "CREA, CMHC" is not
      // valid commercial cap-rate provenance and no free replacement was found
      // for this exact city/range. Real C&W Canadian multifamily data lives in
      // E68, not written back here (see E30 in-file audit comment).
      expect(result.capRateDistribution.p50).toBeNull(); // was 4.3, now unsourced
      expect(result.priceChange12m).toBe(5.2); // Strong appreciation
      expect(result.daysOnMarket).toBe(16); // Fastest market
    });

    it('should return Victoria as secondary BC market', () => {
      const result = cityMarketAnalysis({
        cityId: 'victoria-bc',
        cityName: 'Victoria',
        province: 'British Columbia',
        regionId: CANADIAN_REGIONS.WEST_COAST,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHousePrice).toBeLessThan(1050000);
      expect(result.medianHousePrice).toBeGreaterThan(825000); // Between Toronto and Vancouver
    });
  });

  describe('Canadian Cities - Northern Region', () => {

    it('should return Yellowknife with sparse market indicators and null cap rates', () => {
      const result = cityMarketAnalysis({
        cityId: 'yellowknife-nt',
        cityName: 'Yellowknife',
        province: 'Northwest Territories',
        regionId: CANADIAN_REGIONS.NORTH,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.confidence).toBe('low');
      expect(result.capRateDistribution.p25).toBeNull();
      expect(result.capRateDistribution.p50).toBeNull();
      expect(result.capRateDistribution.p75).toBeNull();
      expect(result.absorptionRate).toBe(6.2); // Very slow market
      expect(result.daysOnMarket).toBe(45); // Much longer to sell
    });
  });

  describe('US Cities - Northeast Region', () => {

    it('should return Boston with strong rental growth', () => {
      const result = cityMarketAnalysis({
        cityId: 'boston-ma',
        cityName: 'Boston',
        province: 'Massachusetts',
        regionId: US_REGIONS.NORTHEAST,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHousePrice).toBe(595000);
      expect(result.rentChange12m).toBe(4.2);
      expect(result.confidence).toBe('high');
    });

    it('should return New York with high rents and large population', () => {
      const result = cityMarketAnalysis({
        cityId: 'new-york-ny',
        cityName: 'New York',
        province: 'New York',
        regionId: US_REGIONS.NORTHEAST,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.population).toBe(20140000); // Largest US metro
      expect(result.medianRent).toBe(2850); // Highest rents
      // Cap rate removed 2026-09-10 (E68 Phase 4A audit): "FRED, Zillow" is not
      // valid commercial cap-rate provenance and no free replacement was found.
      expect(result.capRateDistribution.p50).toBeNull();
    });

    it('should return Philadelphia as affordable Northeast alternative', () => {
      const result = cityMarketAnalysis({
        cityId: 'philadelphia-pa',
        cityName: 'Philadelphia',
        province: 'Pennsylvania',
        regionId: US_REGIONS.NORTHEAST,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHousePrice).toBeLessThan(595000);
      // Cap rate removed 2026-09-10 (E68 Phase 4A audit): "FRED, Zillow" is not
      // valid commercial cap-rate provenance and no free replacement was found.
      expect(result.capRateDistribution.p50).toBeNull();
    });
  });

  describe('US Cities - Midwest Region', () => {

    it('should return Chicago as major Midwest hub', () => {
      const result = cityMarketAnalysis({
        cityId: 'chicago-il',
        cityName: 'Chicago',
        province: 'Illinois',
        regionId: US_REGIONS.MIDWEST,
        asOfDate: new Date('2026-08-04'),
      });

      // Cap rate removed 2026-09-10 (E68 Phase 4A audit): "FRED, Zillow" is not
      // valid commercial cap-rate provenance and no free replacement was found.
      expect(result.capRateDistribution.p50).toBeNull();
      expect(result.medianHousePrice).toBe(295000); // Affordable
    });

    it('should return Minneapolis with similar Midwest profile', () => {
      const result = cityMarketAnalysis({
        cityId: 'minneapolis-mn',
        cityName: 'Minneapolis',
        province: 'Minnesota',
        regionId: US_REGIONS.MIDWEST,
        asOfDate: new Date('2026-08-04'),
      });

      // Cap rate removed 2026-09-10 (E68 Phase 4A audit): "FRED, Zillow" is not
      // valid commercial cap-rate provenance and no free replacement was found.
      expect(result.capRateDistribution.p50).toBeNull();
      expect(result.medianHousePrice).toBeGreaterThan(295000);
    });
  });

  describe('US Cities - South Region (Fastest Growing)', () => {

    it('should return Atlanta with strong growth metrics', () => {
      const result = cityMarketAnalysis({
        cityId: 'atlanta-ga',
        cityName: 'Atlanta',
        province: 'Georgia',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceChange12m).toBe(5.2); // Strong appreciation
      expect(result.rentChange12m).toBe(5.8);
      expect(result.daysOnMarket).toBe(19); // Fast market
    });

    it('should return Miami with highest South region appreciation', () => {
      const result = cityMarketAnalysis({
        cityId: 'miami-fl',
        cityName: 'Miami',
        province: 'Florida',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceChange12m).toBe(6.1); // Fastest in South
      expect(result.rentChange12m).toBe(6.3);
      expect(result.absorptionRate).toBe(1.9); // Tight market
      // Prior "FRED, Zillow"-tagged cap rate (p25 5.2 / p50 5.9 / p75 6.7)
      // removed 2026-09-10 by E68 Phase 4 — no legitimate commercial cap-rate
      // source found for this metro.
      expect(result.capRateDistribution.p25).toBeNull();
      expect(result.capRateDistribution.p50).toBeNull();
      expect(result.capRateDistribution.p75).toBeNull();
    });

    it('should return Houston as affordable, with cap rate left unsourced (2026-09-09 correction)', () => {
      const result = cityMarketAnalysis({
        cityId: 'houston-tx',
        cityName: 'Houston',
        province: 'Texas',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      // Prior invented placeholder (p50 6.9) removed 2026-09-09 — matches
      // dallas-tx/san-antonio-tx/tucson-az's documented null convention;
      // no free per-metro cap rate source exists.
      expect(result.capRateDistribution.p50).toBeNull();
      expect(result.medianHousePrice).toBeLessThan(415000); // Affordable
    });

    it('should return Austin with real Zillow-verified price/rent decline (2026-09-06)', () => {
      const result = cityMarketAnalysis({
        cityId: 'austin-tx',
        cityName: 'Austin',
        province: 'Texas',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      // Live-verified against Zillow ZHVI/ZORI 2026-09-06 — Austin's post-2023
      // price correction means it is NOT the fastest-appreciating South city
      // anymore (previous mock data claimed +7.2%/+7.5%, which was fabricated).
      expect(result.priceChange12m).toBe(-5.2);
      expect(result.rentChange12m).toBe(-0.9);
      // Now live-sourced: FRED MEDDAYONMAR12420, observation month 2026-08,
      // retrieved 2026-09-09. Was previously the placeholder 15.
      expect(result.daysOnMarket).toBe(73);
    });

    it('should return Nashville as emerging growth market', () => {
      const result = cityMarketAnalysis({
        cityId: 'nashville-tn',
        cityName: 'Nashville',
        province: 'Tennessee',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceChange12m).toBe(6.8);
      expect(result.rentChange12m).toBe(6.2);
      expect(result.daysOnMarket).toBe(16);
    });
  });

  describe('US Cities - West Region', () => {

    it('should return San Francisco as most expensive US city', () => {
      const result = cityMarketAnalysis({
        cityId: 'san-francisco-ca',
        cityName: 'San Francisco',
        province: 'California',
        regionId: US_REGIONS.WEST,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHousePrice).toBe(1150000); // Most expensive
      expect(result.medianRent).toBe(3150); // Highest rents
      // Cap rate removed 2026-09-10 (E68 Phase 4A audit): "FRED, Zillow" is not
      // valid commercial cap-rate provenance and no free replacement was found.
      expect(result.capRateDistribution.p50).toBeNull();
    });

    it('should return Los Angeles as major West Coast market', () => {
      const result = cityMarketAnalysis({
        cityId: 'los-angeles-ca',
        cityName: 'Los Angeles',
        province: 'California',
        regionId: US_REGIONS.WEST,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.population).toBeGreaterThan(10000000);
      expect(result.medianHousePrice).toBeGreaterThan(675000); // Pricier than Seattle
    });

    it('should return Seattle with balanced West profile', () => {
      const result = cityMarketAnalysis({
        cityId: 'seattle-wa',
        cityName: 'Seattle',
        province: 'Washington',
        regionId: US_REGIONS.WEST,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHousePrice).toBe(675000);
      // Prior "FRED, Zillow"-tagged value (p50 4.9) removed 2026-09-10 by E68
      // Phase 4 — neither source publishes a commercial cap rate. Same null
      // convention as houston-tx/austin-tx/phoenix-az.
      expect(result.capRateDistribution.p25).toBeNull();
      expect(result.capRateDistribution.p50).toBeNull();
      expect(result.capRateDistribution.p75).toBeNull();
    });

    it('should return Denver as Mountain West hub', () => {
      const result = cityMarketAnalysis({
        cityId: 'denver-co',
        cityName: 'Denver',
        province: 'Colorado',
        regionId: US_REGIONS.WEST,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceChange12m).toBe(4.5);
      expect(result.rentChange12m).toBe(5.2);
    });

    it('should return Phoenix as affordable West alternative', () => {
      const result = cityMarketAnalysis({
        cityId: 'phoenix-az',
        cityName: 'Phoenix',
        province: 'Arizona',
        regionId: US_REGIONS.WEST,
        asOfDate: new Date('2026-08-04'),
      });

      // Live-verified against Zillow ZHVI/ZORI 2026-09-06 (previous mock values
      // of $425,000 / +5.8% were fabricated placeholders).
      expect(result.medianHousePrice).toBe(445924);
      // Prior invented placeholder (p50 6.8) removed 2026-09-09 — matches
      // dallas-tx/san-antonio-tx/tucson-az's documented null convention.
      expect(result.capRateDistribution.p50).toBeNull();
      expect(result.priceChange12m).toBe(-1.5);
    });
  });

  describe('Error Handling', () => {

    it('should throw error for unknown city ID', () => {
      expect(() =>
        cityMarketAnalysis({
          cityId: 'atlantis-at',
          cityName: 'Atlantis',
          province: 'Atlantis',
          regionId: CANADIAN_REGIONS.ATLANTIC,
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/City "atlantis-at" not found/);
    });

    it('should throw error if city belongs to different region', () => {
      expect(() =>
        cityMarketAnalysis({
          cityId: 'toronto-on',
          cityName: 'Toronto',
          province: 'Ontario',
          regionId: CANADIAN_REGIONS.ATLANTIC, // Wrong region
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/belongs to region "central-canada"/);
    });

    it('should throw error for invalid region ID', () => {
      expect(() =>
        cityMarketAnalysis({
          cityId: 'toronto-on',
          cityName: 'Toronto',
          province: 'Ontario',
          regionId: 'invalid-region',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/Invalid region ID/);
    });

    it('should throw error for date mismatch', () => {
      expect(() =>
        cityMarketAnalysis({
          cityId: 'toronto-on',
          cityName: 'Toronto',
          province: 'Ontario',
          regionId: CANADIAN_REGIONS.CENTRAL,
          asOfDate: new Date('2025-01-01'), // Different date
        })
      ).toThrow(/No data available/);
    });
  });

  describe('Cross-city Comparisons', () => {

    it('should show Vancouver as most expensive Canadian city', () => {
      const vancouver = cityMarketAnalysis({
        cityId: 'vancouver-bc',
        cityName: 'Vancouver',
        province: 'British Columbia',
        regionId: CANADIAN_REGIONS.WEST_COAST,
        asOfDate: new Date('2026-08-04'),
      });

      const toronto = cityMarketAnalysis({
        cityId: 'toronto-on',
        cityName: 'Toronto',
        province: 'Ontario',
        regionId: CANADIAN_REGIONS.CENTRAL,
        asOfDate: new Date('2026-08-04'),
      });

      expect(vancouver.medianHousePrice).toBeGreaterThan(toronto.medianHousePrice);
    });

    it('should show Chicago outpacing Austin on price growth (live Zillow data, 2026-09-06)', () => {
      const austin = cityMarketAnalysis({
        cityId: 'austin-tx',
        cityName: 'Austin',
        province: 'Texas',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      const chicago = cityMarketAnalysis({
        cityId: 'chicago-il',
        cityName: 'Chicago',
        province: 'Illinois',
        regionId: US_REGIONS.MIDWEST,
        asOfDate: new Date('2026-08-04'),
      });

      // Reversed from the original mock-data assertion: real Zillow ZHVI shows
      // Austin in a post-2023 price correction (-5.2%), while Chicago's mock
      // figure (+1.8%, still unverified) is positive — Austin is no longer
      // "fastest appreciating" now that its number is real.
      expect(chicago.priceChange12m).toBeGreaterThan(austin.priceChange12m);
    });

    it('should leave Houston cap rate unsourced rather than compare it against a fabricated South-vs-West claim (corrected 2026-09-09)', () => {
      // This test previously asserted Houston's cap rate beat San Francisco's,
      // using an invented South-region placeholder (p50 6.9) that was removed
      // 2026-09-09 — no free per-metro cap rate source exists, so Houston now
      // correctly reports null, matching dallas-tx/san-antonio-tx/tucson-az's
      // documented convention. A real South-vs-West cap rate comparison isn't
      // possible honestly until a real source is found; asserting null here is
      // the accurate claim, not a downgrade.
      const houston = cityMarketAnalysis({
        cityId: 'houston-tx',
        cityName: 'Houston',
        province: 'Texas',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      expect(houston.capRateDistribution.p50).toBeNull();
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should have all required output fields', () => {
      const result = cityMarketAnalysis({
        cityId: 'toronto-on',
        cityName: 'Toronto',
        province: 'Ontario',
        regionId: CANADIAN_REGIONS.CENTRAL,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('cityId');
      expect(result).toHaveProperty('cityName');
      expect(result).toHaveProperty('province');
      expect(result).toHaveProperty('regionId');
      expect(result).toHaveProperty('asOfDate');
      expect(result).toHaveProperty('population');
      expect(result).toHaveProperty('medianHousePrice');
      expect(result).toHaveProperty('medianRent');
      expect(result).toHaveProperty('capRateDistribution');
      expect(result).toHaveProperty('priceChange12m');
      expect(result).toHaveProperty('rentChange12m');
      expect(result).toHaveProperty('daysOnMarket');
      expect(result).toHaveProperty('absorptionRate');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
    });

    it('should properly handle null cap rate distributions for sparse markets', () => {
      const result = cityMarketAnalysis({
        cityId: 'yellowknife-nt',
        cityName: 'Yellowknife',
        province: 'Northwest Territories',
        regionId: CANADIAN_REGIONS.NORTH,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.capRateDistribution.p25).toBeNull();
      expect(result.capRateDistribution.p50).toBeNull();
      expect(result.capRateDistribution.p75).toBeNull();
      expect(result.medianHousePrice).not.toBeNull();
    });
  });

  /**
   * Live-sourced market velocity, retrieved 2026-09-09. Reproduce with:
   *   node scripts/fetch-fred-days-on-market.mjs
   *   node scripts/fetch-redfin-months-of-supply.mjs
   *
   * daysOnMarket  <- FRED MEDDAYONMAR<CBSA>, observation month 2026-08.
   * absorptionRate <- Redfin metro market tracker MONTHS_OF_SUPPLY,
   *                   "All Residential", NSA, month ending 2026-05-31.
   *
   * These are exact-value assertions on purpose. The previous placeholders were
   * plausible-looking inventions and nothing caught them; pinning the real
   * figures means any future drift has to be an explicit, deliberate edit.
   */
  describe('Live-sourced market velocity (FRED + Redfin, 2026-09-09)', () => {

    const VERIFIED_VELOCITY: ReadonlyArray<{
      cityId: string;
      cityName: string;
      province: string;
      regionId: string;
      cbsa: string;
      daysOnMarket: number;
      absorptionRate: number;
    }> = [
      { cityId: 'houston-tx', cityName: 'Houston', province: 'Texas', regionId: US_REGIONS.SOUTH, cbsa: '26420', daysOnMarket: 52, absorptionRate: 4.2 },
      { cityId: 'austin-tx', cityName: 'Austin', province: 'Texas', regionId: US_REGIONS.SOUTH, cbsa: '12420', daysOnMarket: 73, absorptionRate: 5.2 },
      { cityId: 'dallas-tx', cityName: 'Dallas', province: 'Texas', regionId: US_REGIONS.SOUTH, cbsa: '19100', daysOnMarket: 58, absorptionRate: 4.2 },
      { cityId: 'san-antonio-tx', cityName: 'San Antonio', province: 'Texas', regionId: US_REGIONS.SOUTH, cbsa: '41700', daysOnMarket: 68, absorptionRate: 5.4 },
      { cityId: 'phoenix-az', cityName: 'Phoenix', province: 'Arizona', regionId: US_REGIONS.WEST, cbsa: '38060', daysOnMarket: 67, absorptionRate: 3.5 },
      { cityId: 'tucson-az', cityName: 'Tucson', province: 'Arizona', regionId: US_REGIONS.WEST, cbsa: '46060', daysOnMarket: 63, absorptionRate: 3.7 },
    ];

    it.each(VERIFIED_VELOCITY)(
      'should return live-sourced velocity for $cityId (CBSA $cbsa)',
      ({ cityId, cityName, province, regionId, daysOnMarket, absorptionRate }) => {
        const result = cityMarketAnalysis({
          cityId,
          cityName,
          province,
          regionId,
          asOfDate: new Date('2026-08-04'),
        });

        expect(result.daysOnMarket).toBe(daysOnMarket);
        expect(result.absorptionRate).toBe(absorptionRate);
      }
    );

    it('should cite both FRED and Redfin on every live-sourced metro', () => {
      for (const { cityId, cityName, province, regionId } of VERIFIED_VELOCITY) {
        const result = cityMarketAnalysis({
          cityId,
          cityName,
          province,
          regionId,
          asOfDate: new Date('2026-08-04'),
        });

        expect(result.source).toContain('Redfin Data Center');
        expect(result.source).toContain('Federal Reserve FRED');
        expect(result.source).toContain('Zillow ZHVI/ZORI');
      }
    });

    it('should keep source clean of audit/dev commentary (renders in the UI)', () => {
      // Guards a real regression: dev notes once leaked into the SOURCE KPI
      // card. `source` is user-facing prose, not a place for TODOs or vintages.
      const forbidden = ['TODO', 'FIXME', 'placeholder', 'unverified', 'XXX', 'HACK', 'NOTE:', 'fabricat'];

      for (const { cityId, cityName, province, regionId } of VERIFIED_VELOCITY) {
        const result = cityMarketAnalysis({
          cityId,
          cityName,
          province,
          regionId,
          asOfDate: new Date('2026-08-04'),
        });

        for (const token of forbidden) {
          expect(result.source.toLowerCase()).not.toContain(token.toLowerCase());
        }
      }
    });

    it('should classify all six as slow markets, not the hot markets the old placeholders implied', () => {
      // The replaced placeholders claimed 15-22 DOM and 1.6-2.5 months of
      // supply. FRED and Redfin independently disagree: every one of these
      // metros is above 6 weeks on market and above 3 months of supply.
      for (const { cityId, cityName, province, regionId } of VERIFIED_VELOCITY) {
        const result = cityMarketAnalysis({
          cityId,
          cityName,
          province,
          regionId,
          asOfDate: new Date('2026-08-04'),
        });

        expect(result.daysOnMarket).toBeGreaterThan(42);
        expect(result.absorptionRate).toBeGreaterThan(3);
      }
    });

    it('should hold confidence at medium while cap rate stays unsourced', () => {
      for (const { cityId, cityName, province, regionId } of VERIFIED_VELOCITY) {
        const result = cityMarketAnalysis({
          cityId,
          cityName,
          province,
          regionId,
          asOfDate: new Date('2026-08-04'),
        });

        expect(result.confidence).toBe('medium');
      }
    });

    it('should show Austin as the slowest of the six on days on market', () => {
      const austin = cityMarketAnalysis({
        cityId: 'austin-tx',
        cityName: 'Austin',
        province: 'Texas',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      const others = VERIFIED_VELOCITY.filter((m) => m.cityId !== 'austin-tx').map(
        ({ cityId, cityName, province, regionId }) =>
          cityMarketAnalysis({
            cityId,
            cityName,
            province,
            regionId,
            asOfDate: new Date('2026-08-04'),
          })
      );

      for (const other of others) {
        expect(austin.daysOnMarket).toBeGreaterThan(other.daysOnMarket);
      }
    });
  });
});
