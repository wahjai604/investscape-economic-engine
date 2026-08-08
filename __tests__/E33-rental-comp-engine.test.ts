/**
 * InvestScape™ Test Suite
 * © 2026 Lighthouse Research Ltd. All rights reserved.
 *
 * Test methodology and validation data are proprietary.
 * See LICENSE for usage restrictions.
 */

/**
 * E33 Test Suite: Rental Comp Engine
 *
 * Tests cover:
 * - Rental comps by property type (SFH_RENTAL, CONDO_RENTAL, MFH_RENTAL)
 * - Rent distributions and pricing
 * - Yield analysis (gross and net)
 * - Vacancy and absorption rates
 * - Rental growth trends
 * - Cross-neighborhood and cross-property-type comparisons
 */

import { rentalCompEngine } from '../src/E33-rental-comp-engine';

describe('E33: Rental Comp Engine', () => {

  describe('Toronto Rental Comps', () => {

    it('should show Downtown Toronto SFH with strong yield', () => {
      const result = rentalCompEngine({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.medianRent).toBe(3650);
      expect(result.rentPerSqft).toBe(5.8);
      expect(result.grossYield).toBe(2.65);
      expect(result.netYield).toBe(1.85);
      expect(result.daysToLease).toBe(8); // Fast leasing
      expect(result.confidence).toBe('high');
    });

    it('should show Downtown Toronto CONDO with higher yield than SFH', () => {
      const sfh = rentalCompEngine({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const condo = rentalCompEngine({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'CONDO_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(condo.grossYield).toBeGreaterThan(sfh.grossYield);
      expect(condo.rentalVolume12m).toBeGreaterThan(sfh.rentalVolume12m);
    });

    it('should show Yorkville with higher rents than North York', () => {
      const yorkville = rentalCompEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const northYork = rentalCompEngine({
        neighborhoodId: 'toronto-north-york-on',
        neighborhoodName: 'North York',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(yorkville.medianRent).toBeGreaterThan(northYork.medianRent);
      expect(yorkville.rentChange12m).toBeGreaterThan(northYork.rentChange12m);
    });

    it('should show Scarborough with lowest rents in Toronto', () => {
      const scarborough = rentalCompEngine({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const yorkville = rentalCompEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(scarborough.medianRent).toBeLessThan(yorkville.medianRent);
      expect(scarborough.grossYield).toBeGreaterThan(yorkville.grossYield); // Better yield despite lower price
    });
  });

  describe('Vancouver Rental Comps', () => {

    it('should show West Side with highest rents in Vancouver', () => {
      const westSide = rentalCompEngine({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const eastVan = rentalCompEngine({
        neighborhoodId: 'vancouver-east-bc',
        neighborhoodName: 'East Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(westSide.medianRent).toBeGreaterThan(eastVan.medianRent);
      expect(westSide.rentPerSqft).toBeGreaterThan(eastVan.rentPerSqft);
    });

    it('should show Vancouver CONDO rental yield higher than SFH', () => {
      const sfh = rentalCompEngine({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const condo = rentalCompEngine({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        propertyType: 'CONDO_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(condo.grossYield).toBeGreaterThan(sfh.grossYield);
    });
  });

  describe('US Rental Comps', () => {

    it('should show Manhattan SFH with highest absolute rents in North America', () => {
      const manhattan = rentalCompEngine({
        neighborhoodId: 'new-york-manhattan-ny',
        neighborhoodName: 'Manhattan',
        cityId: 'new-york-ny',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const toronto = rentalCompEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(manhattan.medianRent).toBeGreaterThan(toronto.medianRent);
    });

    it('should show Austin with fastest rental growth in North America', () => {
      const austin = rentalCompEngine({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const sanFrancisco = rentalCompEngine({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(austin.rentChange12m).toBeGreaterThan(sanFrancisco.rentChange12m);
      expect(austin.daysToLease).toBeLessThan(sanFrancisco.daysToLease);
    });

    it('should show Miami with strong rental appreciation', () => {
      const miami = rentalCompEngine({
        neighborhoodId: 'miami-brickell-fl',
        neighborhoodName: 'Brickell',
        cityId: 'miami-fl',
        propertyType: 'CONDO_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(miami.rentChange12m).toBe(7.5); // Strong growth
      expect(miami.grossYield).toBe(6.06); // Excellent yield
    });

    it('should show San Francisco with low rental growth and slower leasing', () => {
      const result = rentalCompEngine({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.rentChange12m).toBe(1.8); // Slow growth
      expect(result.daysToLease).toBe(15); // Slower leasing
    });
  });

  describe('Yield Analysis', () => {

    it('should show US rentals with higher yields than Canadian', () => {
      const toronto = rentalCompEngine({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const austin = rentalCompEngine({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(austin.grossYield).toBeGreaterThan(toronto.grossYield);
    });

    it('should show net yield always lower than gross yield (expenses)', () => {
      const result = rentalCompEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.netYield).toBeLessThan(result.grossYield);
      expect(result.netYield).toBeGreaterThan(0); // Still positive
    });

    it('should show CONDO yields higher than SFH across markets', () => {
      const sfhDenver = rentalCompEngine({
        neighborhoodId: 'denver-downtown-co',
        neighborhoodName: 'Downtown Denver',
        cityId: 'denver-co',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const condoDenver = rentalCompEngine({
        neighborhoodId: 'denver-downtown-co',
        neighborhoodName: 'Downtown Denver',
        cityId: 'denver-co',
        propertyType: 'CONDO_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(condoDenver.grossYield).toBeGreaterThan(sfhDenver.grossYield);
    });
  });

  describe('Market Dynamics', () => {

    it('should show fast absorption in hot markets (Austin)', () => {
      const result = rentalCompEngine({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        propertyType: 'CONDO_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.absorptionRate).toBe(4.5); // Very strong
      expect(result.daysToLease).toBe(11); // Fast
    });

    it('should show slower absorption in cooling markets (San Francisco)', () => {
      const result = rentalCompEngine({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.absorptionRate).toBe(2.4); // Slower
      expect(result.daysToLease).toBe(15); // Longer to lease
    });
  });

  describe('Rent Distributions', () => {

    it('should show quartile distributions with correct ordering', () => {
      const result = rentalCompEngine({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'CONDO_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.rentDistribution.p25).toBeLessThan(result.rentDistribution.p50);
      expect(result.rentDistribution.p50).toBeLessThan(result.rentDistribution.p75);
      expect(result.rentDistribution.p50).toBe(result.medianRent);
    });
  });

  describe('Error Handling', () => {

    it('should throw error for unknown neighborhood', () => {
      expect(() =>
        rentalCompEngine({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          propertyType: 'SFH_RENTAL',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No rental comps available/);
    });

    it('should throw error for invalid property type', () => {
      expect(() =>
        rentalCompEngine({
          neighborhoodId: 'toronto-downtown-on',
          neighborhoodName: 'Downtown Toronto',
          cityId: 'toronto-on',
          propertyType: 'INVALID' as any,
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No rental comps available/);
    });
  });

  describe('Cross-Market Comparisons', () => {

    it('should show Toronto rental market more expensive than Montreal', () => {
      const toronto = rentalCompEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const montreal = rentalCompEngine({
        neighborhoodId: 'montreal-downtown-qc',
        neighborhoodName: 'Downtown Montreal',
        cityId: 'montreal-qc',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(toronto.medianRent).toBeGreaterThan(montreal.medianRent);
    });

    it('should show Miami CONDO rental yield highest in US sample', () => {
      const miami = rentalCompEngine({
        neighborhoodId: 'miami-brickell-fl',
        neighborhoodName: 'Brickell',
        cityId: 'miami-fl',
        propertyType: 'CONDO_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      const sanFrancisco = rentalCompEngine({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        propertyType: 'CONDO_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(miami.grossYield).toBeGreaterThan(sanFrancisco.grossYield);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should have all required output fields', () => {
      const result = rentalCompEngine({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        propertyType: 'SFH_RENTAL',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('neighborhoodId');
      expect(result).toHaveProperty('neighborhoodName');
      expect(result).toHaveProperty('cityId');
      expect(result).toHaveProperty('propertyType');
      expect(result).toHaveProperty('asOfDate');
      expect(result).toHaveProperty('medianRent');
      expect(result).toHaveProperty('rentPerSqft');
      expect(result).toHaveProperty('rentDistribution');
      expect(result).toHaveProperty('grossYield');
      expect(result).toHaveProperty('netYield');
      expect(result).toHaveProperty('vacancyRate');
      expect(result).toHaveProperty('rentChange12m');
      expect(result).toHaveProperty('daysToLease');
      expect(result).toHaveProperty('absorptionRate');
      expect(result).toHaveProperty('rentalVolume12m');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
    });
  });
});
