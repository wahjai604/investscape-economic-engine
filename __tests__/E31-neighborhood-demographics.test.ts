/**
 * E31 Test Suite: Neighborhood Demographics Engine
 *
 * Tests cover:
 * - Canadian neighborhood data (20 neighborhoods across 10 cities)
 * - US neighborhood data (20 neighborhoods across 13 cities)
 * - Demographic validation (population, income, age)
 * - Walkability and transit scores
 * - School ratings and education
 * - Market metrics (prices, rents, DOM, volume)
 * - Error handling (unknown neighborhood, city mismatch)
 * - Sparse market handling (Yellowknife with low confidence)
 * - Cross-neighborhood comparisons
 */

import { neighborhoodDemographics } from '../src/E31-neighborhood-demographics';

describe('E31: Neighborhood Demographics Engine', () => {

  describe('Toronto Neighborhoods', () => {

    it('should return Downtown Toronto as most expensive and walkable', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        coordinates: { lat: 43.6629, lng: -79.3957 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianListPrice).toBe(1050000);
      expect(result.walkScore).toBe(92);
      expect(result.transitScore).toBe(95);
      expect(result.medianAge).toBe(31); // Younger demographic
      expect(result.medianHouseholdIncome).toBe(95000);
      expect(result.confidence).toBe('high');
    });

    it('should return North York with family-friendly profile', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'toronto-north-york-on',
        neighborhoodName: 'North York',
        cityId: 'toronto-on',
        coordinates: { lat: 43.7615, lng: -79.4111 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.averageSchoolRating).toBe(8.0); // Strong schools
      expect(result.medianAge).toBe(38); // Older demographic
      expect(result.population).toBeGreaterThan(375000);
    });

    it('should return Yorkville as luxury neighborhood', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        coordinates: { lat: 43.6785, lng: -79.3935 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHouseholdIncome).toBe(125000); // Highest income
      expect(result.medianListPrice).toBe(1250000); // Most expensive
      expect(result.rentalVacancyRate).toBe(1.8); // Tightest rental market
    });

    it('should return Scarborough as most populous Toronto neighborhood', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        coordinates: { lat: 43.7732, lng: -79.2375 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.population).toBe(625000); // Largest
      expect(result.soldVolume12m).toBe(15200); // Most transactions
    });

    it('should return Etobicoke as established suburban area', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'toronto-etobicoke-on',
        neighborhoodName: 'Etobicoke',
        cityId: 'toronto-on',
        coordinates: { lat: 43.5890, lng: -79.5441 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianAge).toBe(40); // Oldest Toronto neighborhood
      expect(result.walkScore).toBe(58); // Least walkable
      expect(result.medianListPrice).toBeLessThan(625000);
    });
  });

  describe('Vancouver Neighborhoods', () => {

    it('should return West Side as most expensive Vancouver area', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        coordinates: { lat: 49.2625, lng: -123.1810 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianListPrice).toBe(1450000); // Most expensive Vancouver
      expect(result.medianHouseholdIncome).toBe(98000);
      expect(result.confidence).toBe('high');
    });

    it('should return Downtown Vancouver with highest growth', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        coordinates: { lat: 49.2827, lng: -123.1207 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.populationGrowth).toBe(3.5); // Highest growth rate
      expect(result.medianAge).toBe(32); // Younger
    });

    it('should return East Vancouver with highest growth potential', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'vancouver-east-bc',
        neighborhoodName: 'East Vancouver',
        cityId: 'vancouver-bc',
        coordinates: { lat: 49.2800, lng: -123.0500 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.populationGrowth).toBe(4.2); // Fastest growth
      expect(result.medianHouseholdIncome).toBe(68000); // Lower income
      expect(result.medianListPrice).toBeLessThan(1000000);
    });

    it('should return North Shore as established family area', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'vancouver-north-shore-bc',
        neighborhoodName: 'North Shore',
        cityId: 'vancouver-bc',
        coordinates: { lat: 49.3200, lng: -123.0724 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianAge).toBe(41); // Older demographic
      expect(result.averageSchoolRating).toBe(8.0); // Good schools
    });
  });

  describe('Montreal Neighborhoods', () => {

    it('should return Downtown Montreal as walkable urban core', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'montreal-downtown-qc',
        neighborhoodName: 'Downtown Montreal',
        cityId: 'montreal-qc',
        coordinates: { lat: 45.5017, lng: -73.5673 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.walkScore).toBe(94); // Highly walkable
      expect(result.transitScore).toBe(93);
      expect(result.medianAge).toBe(30); // Youngest Montreal neighborhood
    });

    it('should return Plateau as vibrant cultural neighborhood', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'montreal-plateau-qc',
        neighborhoodName: 'Plateau-Mont-Royal',
        cityId: 'montreal-qc',
        coordinates: { lat: 45.5268, lng: -73.5904 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.bikeScore).toBe(93); // Highest bike score
      expect(result.populationGrowth).toBe(3.1); // Strong growth
      expect(result.population).toBe(385000); // Largest Montreal neighborhood
    });

    it('should return West Island as suburban family area', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'montreal-west-island-qc',
        neighborhoodName: 'West Island',
        cityId: 'montreal-qc',
        coordinates: { lat: 45.4733, lng: -73.8216 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianAge).toBe(42); // Oldest Montreal neighborhood
      expect(result.walkScore).toBe(55); // Car-dependent
      expect(result.averageSchoolRating).toBe(8.0); // Best schools
    });
  });

  describe('US Neighborhoods - Major Markets', () => {

    it('should return Manhattan as most expensive US neighborhood', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'new-york-manhattan-ny',
        neighborhoodName: 'Manhattan',
        cityId: 'new-york-ny',
        coordinates: { lat: 40.7831, lng: -73.9712 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianListPrice).toBe(895000);
      expect(result.medianRent).toBe(3650); // Highest rents
      expect(result.walkScore).toBe(96); // Most walkable
      expect(result.transitScore).toBe(97); // Best transit
      expect(result.population).toBe(1625000); // Largest population
    });

    it('should return Brooklyn as fast-growing alternative to Manhattan', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'new-york-brooklyn-ny',
        neighborhoodName: 'Brooklyn',
        cityId: 'new-york-ny',
        coordinates: { lat: 40.6501, lng: -73.9496 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.populationGrowth).toBe(1.2); // Growing
      expect(result.medianHouseholdIncome).toBe(78000); // Lower than Manhattan
      expect(result.medianListPrice).toBeLessThan(895000);
    });

    it('should return San Francisco Downtown as tech hub with high costs', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHouseholdIncome).toBe(105000); // Highest income
      expect(result.medianListPrice).toBe(1450000); // Second most expensive
      expect(result.medianRent).toBe(3850); // Highest rents after Manhattan
    });

    it('should return Downtown Austin as fastest appreciating US neighborhood', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        coordinates: { lat: 30.2672, lng: -97.7431 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.populationGrowth).toBe(4.2); // Fastest growth
      expect(result.daysOnMarket).toBe(14); // Fastest selling
      expect(result.soldVolume12m).toBe(12500); // High transaction volume
    });

    it('should return Los Angeles Santa Monica as upscale coastal neighborhood', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'los-angeles-santa-monica-ca',
        neighborhoodName: 'Santa Monica',
        cityId: 'los-angeles-ca',
        coordinates: { lat: 34.0195, lng: -118.4912 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianHouseholdIncome).toBe(95000);
      expect(result.medianListPrice).toBe(895000);
      expect(result.walkScore).toBe(91); // Highly walkable
      expect(result.averageSchoolRating).toBe(8.0); // Best schools in LA
    });

    it('should return Los Angeles Highland Park as gentrifying neighborhood', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'los-angeles-highland-park-ca',
        neighborhoodName: 'Highland Park',
        cityId: 'los-angeles-ca',
        coordinates: { lat: 34.1200, lng: -118.2350 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.populationGrowth).toBe(3.2); // Strong growth
      expect(result.medianHouseholdIncome).toBe(62000); // Lower income
      expect(result.medianListPrice).toBe(425000); // More affordable
    });
  });

  describe('Secondary Markets', () => {

    it('should return Chicago Loop as walkable urban core', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'chicago-loop-il',
        neighborhoodName: 'The Loop',
        cityId: 'chicago-il',
        coordinates: { lat: 41.8819, lng: -87.6278 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.walkScore).toBe(95); // Highly walkable
      expect(result.transitScore).toBe(94); // Excellent transit
      expect(result.medianListPrice).toBe(385000); // Affordable for a downtown
    });

    it('should return Denver Downtown as tech/creative hub', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'denver-downtown-co',
        neighborhoodName: 'Downtown Denver',
        cityId: 'denver-co',
        coordinates: { lat: 39.7392, lng: -104.9903 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.populationGrowth).toBe(3.5);
      expect(result.medianAge).toBe(31);
      expect(result.walkScore).toBe(90);
    });

    it('should return Seattle Capitol Hill as vibrant neighborhood', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'seattle-capitol-hill-wa',
        neighborhoodName: 'Capitol Hill',
        cityId: 'seattle-wa',
        coordinates: { lat: 47.6205, lng: -122.3212 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.walkScore).toBe(92);
      expect(result.medianAge).toBe(32);
      expect(result.medianHouseholdIncome).toBe(82000);
    });
  });

  describe('Sparse Market Handling', () => {

    it('should handle Yellowknife Downtown with low confidence and sparse data', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'yellowknife-downtown-nt',
        neighborhoodName: 'Downtown Yellowknife',
        cityId: 'yellowknife-nt',
        coordinates: { lat: 62.4540, lng: -114.3718 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.confidence).toBe('low');
      expect(result.averageSchoolRating).toBeNull(); // Insufficient data
      expect(result.daysOnMarket).toBe(45); // Very slow market
      expect(result.soldVolume12m).toBe(120); // Minimal transaction volume
    });

    it("should handle St. John's Downtown with medium confidence", () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'st-johns-downtown-nl',
        neighborhoodName: "Downtown St. John's",
        cityId: 'st-johns-nl',
        coordinates: { lat: 47.5615, lng: -52.7126 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.confidence).toBe('medium');
      expect(result.population).toBe(85000); // Smaller market
      expect(result.soldVolume12m).toBe(1800); // Low volume
    });
  });

  describe('Error Handling', () => {

    it('should throw error for unknown neighborhood ID', () => {
      expect(() =>
        neighborhoodDemographics({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          coordinates: { lat: 0, lng: 0 },
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/Neighborhood "atlantis-downtown" not found/);
    });

    it('should throw error if neighborhood city mismatch', () => {
      expect(() =>
        neighborhoodDemographics({
          neighborhoodId: 'toronto-downtown-on',
          neighborhoodName: 'Downtown Toronto',
          cityId: 'vancouver-bc', // Wrong city
          coordinates: { lat: 43.6629, lng: -79.3957 },
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/belongs to city "toronto-on"/);
    });

    it('should throw error for date mismatch', () => {
      expect(() =>
        neighborhoodDemographics({
          neighborhoodId: 'toronto-downtown-on',
          neighborhoodName: 'Downtown Toronto',
          cityId: 'toronto-on',
          coordinates: { lat: 43.6629, lng: -79.3957 },
          asOfDate: new Date('2025-01-01'), // Different date
        })
      ).toThrow(/No data available/);
    });
  });

  describe('Cross-Neighborhood Comparisons', () => {

    it('should show Manhattan as most expensive and walkable', () => {
      const manhattan = neighborhoodDemographics({
        neighborhoodId: 'new-york-manhattan-ny',
        neighborhoodName: 'Manhattan',
        cityId: 'new-york-ny',
        coordinates: { lat: 40.7831, lng: -73.9712 },
        asOfDate: new Date('2026-08-04'),
      });

      const queens = neighborhoodDemographics({
        neighborhoodId: 'new-york-queens-ny',
        neighborhoodName: 'Queens',
        cityId: 'new-york-ny',
        coordinates: { lat: 40.7282, lng: -73.7949 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(manhattan.medianListPrice).toBeGreaterThan(queens.medianListPrice);
      expect(manhattan.walkScore).toBeGreaterThan(queens.walkScore);
      expect(manhattan.medianRent).toBeGreaterThan(queens.medianRent);
    });

    it('should show Downtown Toronto as luxury vs Scarborough as mass market', () => {
      const downtown = neighborhoodDemographics({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        coordinates: { lat: 43.6629, lng: -79.3957 },
        asOfDate: new Date('2026-08-04'),
      });

      const scarborough = neighborhoodDemographics({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        coordinates: { lat: 43.7732, lng: -79.2375 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(downtown.medianHouseholdIncome).toBeGreaterThan(scarborough.medianHouseholdIncome);
      expect(scarborough.population).toBeGreaterThan(downtown.population); // More populous
      expect(scarborough.soldVolume12m).toBeGreaterThan(downtown.soldVolume12m); // Higher turnover
    });

    it('should show Austin Downtown as fastest appreciating', () => {
      const austin = neighborhoodDemographics({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        coordinates: { lat: 30.2672, lng: -97.7431 },
        asOfDate: new Date('2026-08-04'),
      });

      const denver = neighborhoodDemographics({
        neighborhoodId: 'denver-downtown-co',
        neighborhoodName: 'Downtown Denver',
        cityId: 'denver-co',
        coordinates: { lat: 39.7392, lng: -104.9903 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(austin.populationGrowth).toBeGreaterThan(denver.populationGrowth);
      expect(austin.daysOnMarket).toBeLessThan(denver.daysOnMarket);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should have all required output fields', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        coordinates: { lat: 43.6629, lng: -79.3957 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('neighborhoodId');
      expect(result).toHaveProperty('neighborhoodName');
      expect(result).toHaveProperty('cityId');
      expect(result).toHaveProperty('coordinates');
      expect(result).toHaveProperty('asOfDate');
      expect(result).toHaveProperty('population');
      expect(result).toHaveProperty('populationGrowth');
      expect(result).toHaveProperty('medianAge');
      expect(result).toHaveProperty('medianHouseholdIncome');
      expect(result).toHaveProperty('householdCount');
      expect(result).toHaveProperty('medianListPrice');
      expect(result).toHaveProperty('medianSoldPrice');
      expect(result).toHaveProperty('pricePerSqft');
      expect(result).toHaveProperty('medianRent');
      expect(result).toHaveProperty('rentPerSqft');
      expect(result).toHaveProperty('rentalVacancyRate');
      expect(result).toHaveProperty('daysOnMarket');
      expect(result).toHaveProperty('soldVolume12m');
      expect(result).toHaveProperty('walkScore');
      expect(result).toHaveProperty('transitScore');
      expect(result).toHaveProperty('bikeScore');
      expect(result).toHaveProperty('averageSchoolRating');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
    });

    it('should handle optional school ratings for sparse markets', () => {
      const result = neighborhoodDemographics({
        neighborhoodId: 'yellowknife-downtown-nt',
        neighborhoodName: 'Downtown Yellowknife',
        cityId: 'yellowknife-nt',
        coordinates: { lat: 62.4540, lng: -114.3718 },
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.averageSchoolRating).toBeNull();
      expect(result.walkScore).not.toBeNull();
    });
  });
});
