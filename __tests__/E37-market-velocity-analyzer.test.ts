/**
 * E37 Test Suite: Market Velocity Analyzer
 *
 * Tests cover:
 * - Market temperature and heat scoring
 * - Sales velocity (DOM, absorption, price momentum)
 * - Rental velocity (DTL, tightness, rent growth)
 * - Buyer/seller/renter/landlord market dynamics
 * - Market momentum classification
 * - Cross-neighborhood comparisons
 */

import { marketVelocityAnalyzer } from '../src/E37-market-velocity-analyzer';

describe('E37: Market Velocity Analyzer', () => {
  describe('Toronto Market Velocity', () => {
    it('should show Downtown Toronto as hottest Toronto market', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.marketTemperature).toBe('Hot');
      expect(result.marketHeat).toBe(78);
      expect(result.marketVelocityIndex).toBe(82);
      expect(result.hottestInCity).toBe(true);
    });

    it('should show Scarborough as coldest Toronto market', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.marketTemperature).toBe('Cool');
      expect(result.marketHeat).toBe(38);
      expect(result.coldestInCity).toBe(true);
      expect(result.buyerMarket).toBe(true);
      expect(result.sellerMarket).toBe(false);
    });

    it('should show Downtown with fastest sales velocity', () => {
      const downtown = marketVelocityAnalyzer({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      const scarborough = marketVelocityAnalyzer({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(downtown.salesVelocity.daysOnMarket).toBeLessThan(scarborough.salesVelocity.daysOnMarket);
      expect(downtown.salesVelocity.absorptionRate).toBeGreaterThan(scarborough.salesVelocity.absorptionRate);
    });
  });

  describe('Vancouver Market Velocity', () => {
    it('should show Downtown Vancouver as hottest market', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'vancouver-downtown-bc',
        neighborhoodName: 'Downtown Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.hottestInCity).toBe(true);
      expect(result.marketTemperature).toBe('Hot');
      expect(result.marketHeat).toBe(76);
    });

    it('should show North Shore as coldest Vancouver neighborhood', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'vancouver-north-shore-bc',
        neighborhoodName: 'North Shore',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.coldestInCity).toBe(true);
      expect(result.marketTemperature).toBe('Balanced');
      expect(result.momentum).toBe('Stable');
    });
  });

  describe('Montreal Market Velocity', () => {
    it('should show Plateau as hottest Montreal neighborhood', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'montreal-plateau-qc',
        neighborhoodName: 'Plateau-Mont-Royal',
        cityId: 'montreal-qc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.hottestInCity).toBe(true);
      expect(result.marketTemperature).toBe('Warm');
      expect(result.marketHeat).toBe(66);
    });
  });

  describe('US Market Velocity', () => {
    it('should show Austin Downtown as hottest US market in sample', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.marketTemperature).toBe('Hot');
      expect(result.marketHeat).toBe(82);
      expect(result.momentum).toBe('Accelerating');
      expect(result.salesVelocity.priceChange12m).toBe(11.2);
    });

    it('should show San Francisco with declining momentum', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.marketTemperature).toBe('Cool');
      expect(result.momentum).toBe('Declining');
      expect(result.salesVelocity.priceChange12m).toBeLessThan(0);
      expect(result.rentalVelocity.rentChange12m).toBeLessThan(0);
    });
  });

  describe('Sales Velocity Analysis', () => {
    it('should show faster DOM in hot markets vs cool markets', () => {
      const hot = marketVelocityAnalyzer({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        asOfDate: new Date('2026-08-04'),
      });

      const cool = marketVelocityAnalyzer({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        asOfDate: new Date('2026-08-04'),
      });

      expect(hot.salesVelocity.daysOnMarket).toBeLessThan(cool.salesVelocity.daysOnMarket);
    });

    it('should show price appreciation in hot markets', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'miami-brickell-fl',
        neighborhoodName: 'Brickell',
        cityId: 'miami-fl',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.salesVelocity.priceChange6m).toBeGreaterThan(0);
      expect(result.salesVelocity.priceChange12m).toBeGreaterThan(result.salesVelocity.priceChange6m);
    });
  });

  describe('Rental Velocity Analysis', () => {
    it('should show faster days-to-lease in landlord markets', () => {
      const landlord = marketVelocityAnalyzer({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      const renter = marketVelocityAnalyzer({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        asOfDate: new Date('2026-08-04'),
      });

      expect(landlord.rentalVelocity.daysToLease).toBeLessThan(renter.rentalVelocity.daysToLease);
    });

    it('should show positive rent growth in tight markets', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.rentalVelocity.rentChange12m).toBeGreaterThan(0);
      expect(result.rentalVelocity.marketTightness).toBeGreaterThan(90);
    });
  });

  describe('Market Temperature & Heat', () => {
    it('should show temperature categories align with heat scores', () => {
      const hot = marketVelocityAnalyzer({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        asOfDate: new Date('2026-08-04'),
      });

      const cool = marketVelocityAnalyzer({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        asOfDate: new Date('2026-08-04'),
      });

      expect(hot.marketTemperature).toBe('Hot');
      expect(hot.marketHeat).toBeGreaterThan(cool.marketHeat);
      expect(cool.marketTemperature).toBe('Cool');
    });
  });

  describe('Momentum Classification', () => {
    it('should show accelerating momentum in fastest-growing markets', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.momentum).toBe('Accelerating');
      expect(result.salesVelocity.priceChange6m).toBeLessThan(result.salesVelocity.priceChange12m);
    });

    it('should show declining momentum in cooling markets', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'san-francisco-downtown-ca',
        neighborhoodName: 'SOMA / Downtown',
        cityId: 'san-francisco-ca',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.momentum).toBe('Declining');
      expect(result.salesVelocity.priceChange12m).toBeLessThan(0);
    });
  });

  describe('Market Dynamics (Buyer/Seller/Renter/Landlord)', () => {
    it('should show buyer market in cooling neighborhoods', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.buyerMarket).toBe(true);
      expect(result.sellerMarket).toBe(false);
    });

    it('should show seller market in hot neighborhoods', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.sellerMarket).toBe(true);
      expect(result.buyerMarket).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown neighborhood', () => {
      expect(() =>
        marketVelocityAnalyzer({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No market velocity data available/);
    });
  });

  describe('Data Validation & Metadata', () => {
    it('should have all required output fields', () => {
      const result = marketVelocityAnalyzer({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('marketTemperature');
      expect(result).toHaveProperty('marketHeat');
      expect(result).toHaveProperty('salesVelocity');
      expect(result).toHaveProperty('rentalVelocity');
      expect(result).toHaveProperty('marketVelocityIndex');
      expect(result).toHaveProperty('momentum');
      expect(result).toHaveProperty('buyerMarket');
      expect(result).toHaveProperty('sellerMarket');
      expect(result).toHaveProperty('outlookDirection');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
    });
  });
});
