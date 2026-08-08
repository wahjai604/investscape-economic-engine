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
      expect(result.capRateDistribution.p50).toBe(5.2);
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
      expect(result.capRateDistribution.p50).toBe(4.6); // Lowest cap rate
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

      expect(result.capRateDistribution.p50).toBe(5.8); // High cap rate
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

      expect(result.capRateDistribution.p50).toBeGreaterThan(5.8);
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
      expect(result.capRateDistribution.p50).toBe(6.2); // Highest cap rates
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
      expect(result.capRateDistribution.p50).toBe(4.3); // Lowest cap rate
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
      expect(result.capRateDistribution.p50).toBe(4.5); // Expensive market
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
      expect(result.capRateDistribution.p50).toBeGreaterThan(4.8); // Better cap rates
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

      expect(result.capRateDistribution.p50).toBe(6.5); // High cap rates
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

      expect(result.capRateDistribution.p50).toBe(6.2);
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
    });

    it('should return Houston with highest cap rates in South', () => {
      const result = cityMarketAnalysis({
        cityId: 'houston-tx',
        cityName: 'Houston',
        province: 'Texas',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.capRateDistribution.p50).toBe(6.9); // Highest South cap rates
      expect(result.medianHousePrice).toBeLessThan(415000); // Affordable
    });

    it('should return Austin as fastest appreciating South city', () => {
      const result = cityMarketAnalysis({
        cityId: 'austin-tx',
        cityName: 'Austin',
        province: 'Texas',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.priceChange12m).toBe(7.2); // Fastest in entire South region
      expect(result.rentChange12m).toBe(7.5); // Fastest rent growth
      expect(result.daysOnMarket).toBe(15); // Fastest moving market
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
      expect(result.capRateDistribution.p50).toBe(3.9); // Lowest cap rates
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
      expect(result.capRateDistribution.p50).toBe(4.9);
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

      expect(result.medianHousePrice).toBe(425000); // Affordable for West
      expect(result.capRateDistribution.p50).toBe(6.8); // Better cap rates
      expect(result.priceChange12m).toBe(5.8); // Strong growth
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

    it('should show Austin as fastest appreciating US market', () => {
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

      expect(austin.priceChange12m).toBeGreaterThan(chicago.priceChange12m);
    });

    it('should show South region cities with highest cap rates in US', () => {
      const houston = cityMarketAnalysis({
        cityId: 'houston-tx',
        cityName: 'Houston',
        province: 'Texas',
        regionId: US_REGIONS.SOUTH,
        asOfDate: new Date('2026-08-04'),
      });

      const sanFrancisco = cityMarketAnalysis({
        cityId: 'san-francisco-ca',
        cityName: 'San Francisco',
        province: 'California',
        regionId: US_REGIONS.WEST,
        asOfDate: new Date('2026-08-04'),
      });

      expect(houston.capRateDistribution.p50).toBeGreaterThan(sanFrancisco.capRateDistribution.p50!);
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
});
