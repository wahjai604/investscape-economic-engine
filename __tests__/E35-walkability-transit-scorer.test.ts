/**
 * InvestScape™ Test Suite
 * © 2026 Lighthouse Research Ltd. All rights reserved.
 *
 * Test methodology and validation data are proprietary.
 * See LICENSE for usage restrictions.
 */

/**
 * E35 Test Suite: Walkability & Transit Scorer
 *
 * Tests cover:
 * - Walkability score components (pedestrian infrastructure, street connectivity)
 * - Transit score and category analysis
 * - Bike score and infrastructure
 * - Car dependency assessment
 * - Commute time analysis
 * - Multimodal accessibility
 * - Cross-neighborhood comparisons
 */

import { walkabilityTransitScorer } from '../src/E35-walkability-transit-scorer';

describe('E35: Walkability & Transit Scorer', () => {
  describe('Toronto Walkability', () => {
    it('should show Yorkville as most walkable Toronto neighborhood', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.walkScore).toBe(94);
      expect(result.transitScore).toBe(96);
      expect(result.bikeScore).toBe(90);
      expect(result.walkabilityCategory).toBe("Walker's Paradise");
      expect(result.carDependency).toBe(8);
    });

    it('should show Scarborough as car-dependent Toronto neighborhood', () => {
      const yorkville = walkabilityTransitScorer({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      const scarborough = walkabilityTransitScorer({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(scarborough.carDependency).toBeGreaterThan(yorkville.carDependency);
      expect(scarborough.walkabilityCategory).toBe('Somewhat Walkable');
      expect(scarborough.transitUsageRate).toBeLessThan(yorkville.transitUsageRate);
    });

    it('should show Downtown has shortest commute to city center', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.commuteEstimates.toCityCenter).toBe(5);
      expect(result.avgCommuteTime).toBe(28);
    });
  });

  describe('Vancouver Walkability', () => {
    it('should show Downtown Vancouver as most walkable BC neighborhood', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.walkScore).toBe(95);
      expect(result.bikeScore).toBe(89);
      expect(result.transitScore).toBe(92);
      expect(result.walkabilityCategory).toBe("Walker's Paradise");
    });

    it('should show East Vancouver with excellent bike infrastructure', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'vancouver-east-bc',
        neighborhoodName: 'East Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.bikeScore).toBe(85);
      expect(result.bikeLaneKm).toBe(25);
      expect(result.bikeShareStations).toBe(11);
    });
  });

  describe('Montreal Walkability', () => {
    it('should show Plateau as bike-friendly Montreal neighborhood', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'montreal-plateau-qc',
        neighborhoodName: 'Plateau-Mont-Royal',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.bikeScore).toBe(93); // Highest bike score
      expect(result.bikeLaneKm).toBe(40); // Most bike lanes
      expect(result.bikeShareStations).toBe(30); // Most stations
    });

    it('should show West Island as car-dependent Montreal area', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'montreal-west-island-qc',
        neighborhoodName: 'West Island',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.carDependency).toBe(68);
      expect(result.walkScore).toBe(55);
      expect(result.carCommutingRate).toBe(78);
    });
  });

  describe('US Walkability', () => {
    it('should show Manhattan as most walkable North American neighborhood', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'new-york-manhattan-ny',
        neighborhoodName: 'Manhattan',
        cityId: 'new-york-ny',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.walkScore).toBe(96);
      expect(result.transitScore).toBe(97);
      expect(result.carDependency).toBe(4);
      expect(result.transitUsageRate).toBe(82);
    });

    it('should show San Francisco with excellent transit and biking', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.walkScore).toBe(94);
      expect(result.bikeScore).toBe(91);
      expect(result.transitTypes.streetcar).toBe(true);
    });

    it('should show Austin with emerging transit infrastructure', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.walkScore).toBe(91);
      expect(result.transitTypes.lightRail).toBe(true);
      expect(result.bikeScore).toBe(88);
    });
  });

  describe('Transit Type Availability', () => {
    it('should show subway presence in major downtown cores', () => {
      const toronto = walkabilityTransitScorer({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(toronto.transitTypes.subway).toBe(true);
      expect(toronto.transitScore).toBeGreaterThan(90);
    });

    it('should show light rail in growing US cities', () => {
      const austin = walkabilityTransitScorer({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        asOfDate: new Date('2026-08-04'),
      });

      expect(austin.transitTypes.lightRail).toBe(true);
      expect(austin.transitScore).toBe(82);
    });
  });

  describe('Bike Infrastructure', () => {
    it('should show Montreal with most bike lanes', () => {
      const plateau = walkabilityTransitScorer({
        neighborhoodId: 'montreal-plateau-qc',
        neighborhoodName: 'Plateau-Mont-Royal',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      const downtown = walkabilityTransitScorer({
        neighborhoodId: 'montreal-downtown-qc',
        neighborhoodName: 'Downtown Montreal',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(plateau.bikeLaneKm).toBeGreaterThan(downtown.bikeLaneKm);
      expect(plateau.bikeScore).toBeGreaterThan(downtown.bikeScore);
    });

    it('should show Manhattan with most bike share stations', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'new-york-manhattan-ny',
        neighborhoodName: 'Manhattan',
        cityId: 'new-york-ny',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.bikeShareStations).toBe(350); // Largest in sample
    });
  });

  describe('Commute Time Analysis', () => {
    it('should show Downtown cores with shortest commutes', () => {
      const manhattan = walkabilityTransitScorer({
        neighborhoodId: 'new-york-manhattan-ny',
        neighborhoodName: 'Manhattan',
        cityId: 'new-york-ny',
        asOfDate: new Date('2026-08-04'),
      });

      const etobicoke = walkabilityTransitScorer({
        neighborhoodId: 'toronto-etobicoke-on',
        neighborhoodName: 'Etobicoke',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(manhattan.avgCommuteTime).toBeLessThan(etobicoke.avgCommuteTime);
    });

    it('should show car commute faster than transit in car-dependent areas', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'toronto-etobicoke-on',
        neighborhoodName: 'Etobicoke',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.commuteEstimates.byCarToCityCenter).toBeLessThan(result.commuteEstimates.toCityCenter);
    });
  });

  describe('Car Dependency & Transit Usage', () => {
    it('should show inverse correlation between transit score and car dependency', () => {
      const highTransit = walkabilityTransitScorer({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      const lowTransit = walkabilityTransitScorer({
        neighborhoodId: 'montreal-west-island-qc',
        neighborhoodName: 'West Island',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(highTransit.transitScore).toBeGreaterThan(lowTransit.transitScore);
      expect(highTransit.carDependency).toBeLessThan(lowTransit.carDependency);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown neighborhood', () => {
      expect(() =>
        walkabilityTransitScorer({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No walkability data available/);
    });
  });

  describe('Data Validation & Metadata', () => {
    it('should have all required output fields', () => {
      const result = walkabilityTransitScorer({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('walkScore');
      expect(result).toHaveProperty('transitScore');
      expect(result).toHaveProperty('bikeScore');
      expect(result).toHaveProperty('walkabilityCategory');
      expect(result).toHaveProperty('transitCategory');
      expect(result).toHaveProperty('carDependency');
      expect(result).toHaveProperty('transitUsageRate');
      expect(result).toHaveProperty('commuteEstimates');
      expect(result).toHaveProperty('multimodalAccessibility');
    });
  });
});
