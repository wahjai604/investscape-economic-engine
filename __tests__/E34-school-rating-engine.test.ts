/**
 * E34 Test Suite: School Rating & Education Engine
 *
 * Tests cover:
 * - School ratings by type (elementary, middle, high)
 * - District quality metrics
 * - Test score performance
 * - Graduation and postsecondary rates
 * - School accessibility and diversity
 * - Cross-neighborhood education analysis
 */

import { schoolRatingEngine } from '../src/E34-school-rating-engine';

describe('E34: School Rating & Education Engine', () => {

  describe('Toronto Schools', () => {

    it('should show Yorkville with highest-rated schools in Toronto', () => {
      const result = schoolRatingEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgElementaryRating).toBe(8.7);
      expect(result.avgHighRating).toBe(8.3);
      expect(result.avgTestScorePercentile).toBe(82);
      expect(result.avgGraduationRate).toBe(94.2);
      expect(result.hasInternationalPrograms).toBe(true);
      expect(result.hasSpecializedPrograms).toBe(true);
    });

    it('should show Scarborough with more schools but lower ratings', () => {
      const yorkville = schoolRatingEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      const scarborough = schoolRatingEngine({
        neighborhoodId: 'toronto-scarborough-on',
        neighborhoodName: 'Scarborough',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(scarborough.elementarySchoolCount).toBeGreaterThan(yorkville.elementarySchoolCount);
      expect(yorkville.avgElementaryRating).toBeGreaterThan(scarborough.avgElementaryRating);
      expect(yorkville.avgGraduationRate).toBeGreaterThan(scarborough.avgGraduationRate as number);
    });

    it('should show Toronto District School Board across neighborhoods', () => {
      const result = schoolRatingEngine({
        neighborhoodId: 'toronto-downtown-on',
        neighborhoodName: 'Downtown Toronto',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.districtName).toBe('Toronto District School Board');
      expect(result.districtRating).toBe(8.1);
    });
  });

  describe('Vancouver Schools', () => {

    it('should show West Side with strongest schools in Vancouver', () => {
      const result = schoolRatingEngine({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgElementaryRating).toBe(8.4);
      expect(result.avgTestScorePercentile).toBe(80);
      expect(result.postsecondaryEnrollmentRate).toBe(88.5);
    });

    it('should show East Vancouver with lower-rated schools', () => {
      const eastVan = schoolRatingEngine({
        neighborhoodId: 'vancouver-east-bc',
        neighborhoodName: 'East Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(eastVan.avgElementaryRating).toBe(6.8);
      expect(eastVan.hasSpecializedPrograms).toBe(false);
    });
  });

  describe('US Schools', () => {

    it('should show Santa Monica with highest-rated schools in US sample', () => {
      const result = schoolRatingEngine({
        neighborhoodId: 'los-angeles-santa-monica-ca',
        neighborhoodName: 'Santa Monica',
        cityId: 'los-angeles-ca',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgElementaryRating).toBe(8.2);
      expect(result.districtRating).toBe(8.4);
      expect(result.avgGraduationRate).toBe(93.5);
    });

    it('should show Austin with strong and growing schools', () => {
      const result = schoolRatingEngine({
        neighborhoodId: 'austin-downtown-tx',
        neighborhoodName: 'Downtown Austin',
        cityId: 'austin-tx',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgElementaryRating).toBe(7.8);
      expect(result.districtRating).toBe(8.1);
      expect(result.hasInternationalPrograms).toBe(true);
    });

    it('should show Miami with lower-rated schools', () => {
      const result = schoolRatingEngine({
        neighborhoodId: 'miami-brickell-fl',
        neighborhoodName: 'Brickell',
        cityId: 'miami-fl',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgElementaryRating).toBe(6.8);
      expect(result.districtRating).toBe(6.9);
      expect(result.avgGraduationRate).toBe(86.5);
    });
  });

  describe('District Quality', () => {

    it('should show district rankings correlate with school ratings', () => {
      const excellent = schoolRatingEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      const struggling = schoolRatingEngine({
        neighborhoodId: 'chicago-loop-il',
        neighborhoodName: 'The Loop',
        cityId: 'chicago-il',
        asOfDate: new Date('2026-08-04'),
      });

      expect(excellent.districtRank).toBeLessThan(struggling.districtRank); // Lower rank = better
      expect(excellent.districtRating).toBeGreaterThan(struggling.districtRating);
    });
  });

  describe('Test Scores & Graduation', () => {

    it('should show test scores correlated with graduation rates', () => {
      const result = schoolRatingEngine({
        neighborhoodId: 'los-angeles-santa-monica-ca',
        neighborhoodName: 'Santa Monica',
        cityId: 'los-angeles-ca',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgTestScorePercentile).toBe(82);
      expect(result.avgGraduationRate).toBe(93.5); // High correlation
    });

    it('should show postsecondary enrollment follows graduation', () => {
      const high = schoolRatingEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      const low = schoolRatingEngine({
        neighborhoodId: 'chicago-loop-il',
        neighborhoodName: 'The Loop',
        cityId: 'chicago-il',
        asOfDate: new Date('2026-08-04'),
      });

      expect(high.postsecondaryEnrollmentRate).toBeGreaterThan(low.postsecondaryEnrollmentRate as number);
    });
  });

  describe('School Accessibility', () => {

    it('should show shorter distances to schools in dense neighborhoods', () => {
      const yorkville = schoolRatingEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      const chicago = schoolRatingEngine({
        neighborhoodId: 'chicago-loop-il',
        neighborhoodName: 'The Loop',
        cityId: 'chicago-il',
        asOfDate: new Date('2026-08-04'),
      });

      expect(yorkville.avgDistanceToElementary).toBeLessThan(chicago.avgDistanceToElementary);
    });
  });

  describe('Program Diversity', () => {

    it('should show international programs in premium neighborhoods', () => {
      const yorkville = schoolRatingEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(yorkville.hasInternationalPrograms).toBe(true);
      expect(yorkville.hasSpecializedPrograms).toBe(true);
    });

    it('should show limited programs in lower-income neighborhoods', () => {
      const eastVan = schoolRatingEngine({
        neighborhoodId: 'vancouver-east-bc',
        neighborhoodName: 'East Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      expect(eastVan.hasInternationalPrograms).toBe(false);
      expect(eastVan.hasSpecializedPrograms).toBe(false);
    });
  });

  describe('Cross-Market Comparisons', () => {

    it('should show Vancouver more expensive than Toronto with similar school quality', () => {
      const vancouver = schoolRatingEngine({
        neighborhoodId: 'vancouver-west-side-bc',
        neighborhoodName: 'West Side Vancouver',
        cityId: 'vancouver-bc',
        asOfDate: new Date('2026-08-04'),
      });

      const toronto = schoolRatingEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(vancouver.avgElementaryRating).toBeLessThan(toronto.avgElementaryRating);
      // Vancouver is more expensive (from prior engines) but has lower school ratings
    });

    it('should show US coastal cities with excellent schools justify premium prices', () => {
      const result = schoolRatingEngine({
        neighborhoodId: 'los-angeles-santa-monica-ca',
        neighborhoodName: 'Santa Monica',
        cityId: 'los-angeles-ca',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result.avgElementaryRating).toBe(8.2);
      expect(result.districtRating).toBe(8.4);
      expect(result.postsecondaryEnrollmentRate).toBe(89.2);
    });
  });

  describe('Error Handling', () => {

    it('should throw error for unknown neighborhood', () => {
      expect(() =>
        schoolRatingEngine({
          neighborhoodId: 'atlantis-downtown',
          neighborhoodName: 'Atlantis Downtown',
          cityId: 'atlantis-at',
          asOfDate: new Date('2026-08-04'),
        })
      ).toThrow(/No school data available/);
    });
  });

  describe('Data Validation & Metadata', () => {

    it('should have all required output fields', () => {
      const result = schoolRatingEngine({
        neighborhoodId: 'toronto-yorkville-on',
        neighborhoodName: 'Yorkville',
        cityId: 'toronto-on',
        asOfDate: new Date('2026-08-04'),
      });

      expect(result).toHaveProperty('neighborhoodId');
      expect(result).toHaveProperty('neighborhoodName');
      expect(result).toHaveProperty('cityId');
      expect(result).toHaveProperty('asOfDate');
      expect(result).toHaveProperty('elementarySchoolCount');
      expect(result).toHaveProperty('avgElementaryRating');
      expect(result).toHaveProperty('districtName');
      expect(result).toHaveProperty('districtRating');
      expect(result).toHaveProperty('avgTestScorePercentile');
      expect(result).toHaveProperty('avgGraduationRate');
      expect(result).toHaveProperty('postsecondaryEnrollmentRate');
      expect(result).toHaveProperty('hasInternationalPrograms');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('nearbySchools');
    });
  });
});
