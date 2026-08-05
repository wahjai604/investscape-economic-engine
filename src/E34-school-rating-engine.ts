/**
 * E34: School Rating & Education Engine
 *
 * Provides detailed education and school quality metrics for neighborhoods.
 * Builds on E31 (neighborhood demographics) to deliver education context:
 * - School ratings (elementary, middle, high school)
 * - District quality metrics
 * - Test scores and graduation rates
 * - School proximity and accessibility
 *
 * Data sources (locked per E29-E45 design spec):
 * - Statistics Canada Census (Canadian schools)
 * - US Census Bureau + Department of Education (US schools)
 * - Provincial/State education ministry data
 * - Standardized test results (EQAO in Ontario, state tests in US)
 */

import { validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * School entity (individual school data)
 */
export interface School {
  schoolId: string;
  schoolName: string;
  schoolType: 'elementary' | 'middle' | 'high';
  rating: number;                  // 1-10 scale
  testScorePercentile: number;     // 0-100 percentile
  graduationRate: number | null;   // % (high school only)
  studentTeacherRatio: number;
  distanceFromCenter: number;      // km
}

/**
 * Neighborhood education metrics
 */
export interface SchoolMetrics {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  asOfDate: Date;

  // School availability
  elementarySchoolCount: number;
  middleSchoolCount: number;
  highSchoolCount: number;

  // Rating averages by type
  avgElementaryRating: number;
  avgMiddleRating: number;
  avgHighRating: number;

  // District quality
  districtName: string;
  districtRating: number;          // Overall district quality 1-10
  districtRank: number;            // Rank within province/state
  districtRankPercentile: number;  // 0-100 percentile

  // Test performance
  avgTestScorePercentile: number;  // Across all grade levels

  // High school outcomes
  avgGraduationRate: number | null;
  postsecondaryEnrollmentRate: number | null;

  // School accessibility
  avgDistanceToElementary: number; // km
  avgDistanceToHigh: number;       // km

  // Education diversity
  hasPrivateSchools: boolean;
  hasInternationalPrograms: boolean;
  hasSpecializedPrograms: boolean; // Arts, STEM, etc.

  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SchoolRatingInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  asOfDate?: Date;
}

export interface SchoolRatingOutput extends SchoolMetrics {
  nearbySchools: School[];
}

/**
 * Mock school data store.
 *
 * In production, this queries Supabase `economic_data.schools` and
 * `economic_data.school_metrics` tables, populated from education ministry data.
 * For now, realistic fixtures representing Aug 4, 2026 data.
 */
interface MockSchoolMetrics {
  [neighborhoodId: string]: SchoolMetrics;
}

interface MockSchoolsByNeighborhood {
  [neighborhoodId: string]: School[];
}

const MOCK_NEIGHBORHOOD_DATA: MockSchoolMetrics = {
  // ===== TORONTO SCHOOLS =====

  'toronto-yorkville-on': {
    neighborhoodId: 'toronto-yorkville-on',
    neighborhoodName: 'Yorkville',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 3,
    middleSchoolCount: 2,
    highSchoolCount: 2,
    avgElementaryRating: 8.7,
    avgMiddleRating: 8.5,
    avgHighRating: 8.3,
    districtName: 'Toronto District School Board',
    districtRating: 8.1,
    districtRank: 8,
    districtRankPercentile: 78,
    avgTestScorePercentile: 82,
    avgGraduationRate: 94.2,
    postsecondaryEnrollmentRate: 89.5,
    avgDistanceToElementary: 0.6,
    avgDistanceToHigh: 1.2,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'toronto-downtown-on': {
    neighborhoodId: 'toronto-downtown-on',
    neighborhoodName: 'Downtown Toronto',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 2,
    avgElementaryRating: 7.8,
    avgMiddleRating: 7.5,
    avgHighRating: 7.9,
    districtName: 'Toronto District School Board',
    districtRating: 8.1,
    districtRank: 8,
    districtRankPercentile: 78,
    avgTestScorePercentile: 76,
    avgGraduationRate: 92.1,
    postsecondaryEnrollmentRate: 87.2,
    avgDistanceToElementary: 0.8,
    avgDistanceToHigh: 1.5,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'toronto-north-york-on': {
    neighborhoodId: 'toronto-north-york-on',
    neighborhoodName: 'North York',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 5,
    middleSchoolCount: 2,
    highSchoolCount: 2,
    avgElementaryRating: 8.2,
    avgMiddleRating: 8.0,
    avgHighRating: 7.9,
    districtName: 'Toronto District School Board',
    districtRating: 8.1,
    districtRank: 8,
    districtRankPercentile: 78,
    avgTestScorePercentile: 79,
    avgGraduationRate: 93.5,
    postsecondaryEnrollmentRate: 88.1,
    avgDistanceToElementary: 0.5,
    avgDistanceToHigh: 1.3,
    hasPrivateSchools: true,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'toronto-scarborough-on': {
    neighborhoodId: 'toronto-scarborough-on',
    neighborhoodName: 'Scarborough',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 8,
    middleSchoolCount: 3,
    highSchoolCount: 2,
    avgElementaryRating: 7.1,
    avgMiddleRating: 6.9,
    avgHighRating: 7.0,
    districtName: 'Toronto District School Board',
    districtRating: 8.1,
    districtRank: 8,
    districtRankPercentile: 78,
    avgTestScorePercentile: 71,
    avgGraduationRate: 90.2,
    postsecondaryEnrollmentRate: 84.5,
    avgDistanceToElementary: 0.4,
    avgDistanceToHigh: 1.8,
    hasPrivateSchools: true,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'toronto-etobicoke-on': {
    neighborhoodId: 'toronto-etobicoke-on',
    neighborhoodName: 'Etobicoke',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 6,
    middleSchoolCount: 2,
    highSchoolCount: 2,
    avgElementaryRating: 7.6,
    avgMiddleRating: 7.4,
    avgHighRating: 7.5,
    districtName: 'Toronto District School Board',
    districtRating: 8.1,
    districtRank: 8,
    districtRankPercentile: 78,
    avgTestScorePercentile: 74,
    avgGraduationRate: 91.8,
    postsecondaryEnrollmentRate: 86.7,
    avgDistanceToElementary: 0.5,
    avgDistanceToHigh: 1.6,
    hasPrivateSchools: true,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  // ===== VANCOUVER SCHOOLS =====

  'vancouver-west-side-bc': {
    neighborhoodId: 'vancouver-west-side-bc',
    neighborhoodName: 'West Side Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 4,
    middleSchoolCount: 2,
    highSchoolCount: 1,
    avgElementaryRating: 8.4,
    avgMiddleRating: 8.2,
    avgHighRating: 8.1,
    districtName: 'Vancouver School Board',
    districtRating: 7.8,
    districtRank: 12,
    districtRankPercentile: 72,
    avgTestScorePercentile: 80,
    avgGraduationRate: 92.8,
    postsecondaryEnrollmentRate: 88.5,
    avgDistanceToElementary: 0.6,
    avgDistanceToHigh: 1.4,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'vancouver-downtown-bc': {
    neighborhoodId: 'vancouver-downtown-bc',
    neighborhoodName: 'Downtown Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 7.5,
    avgMiddleRating: 7.3,
    avgHighRating: 7.4,
    districtName: 'Vancouver School Board',
    districtRating: 7.8,
    districtRank: 12,
    districtRankPercentile: 72,
    avgTestScorePercentile: 77,
    avgGraduationRate: 91.2,
    postsecondaryEnrollmentRate: 86.8,
    avgDistanceToElementary: 1.0,
    avgDistanceToHigh: 1.8,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'vancouver-east-bc': {
    neighborhoodId: 'vancouver-east-bc',
    neighborhoodName: 'East Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 3,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 6.8,
    avgMiddleRating: 6.5,
    avgHighRating: 6.7,
    districtName: 'Vancouver School Board',
    districtRating: 7.8,
    districtRank: 12,
    districtRankPercentile: 72,
    avgTestScorePercentile: 68,
    avgGraduationRate: 88.5,
    postsecondaryEnrollmentRate: 82.1,
    avgDistanceToElementary: 0.7,
    avgDistanceToHigh: 2.1,
    hasPrivateSchools: false,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: false,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'vancouver-north-shore-bc': {
    neighborhoodId: 'vancouver-north-shore-bc',
    neighborhoodName: 'North Shore',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 5,
    middleSchoolCount: 2,
    highSchoolCount: 2,
    avgElementaryRating: 8.3,
    avgMiddleRating: 8.1,
    avgHighRating: 8.0,
    districtName: 'North Vancouver School District',
    districtRating: 8.0,
    districtRank: 10,
    districtRankPercentile: 76,
    avgTestScorePercentile: 81,
    avgGraduationRate: 93.5,
    postsecondaryEnrollmentRate: 89.2,
    avgDistanceToElementary: 0.5,
    avgDistanceToHigh: 1.3,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  // ===== MONTREAL SCHOOLS =====

  'montreal-downtown-qc': {
    neighborhoodId: 'montreal-downtown-qc',
    neighborhoodName: 'Downtown Montreal',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 3,
    middleSchoolCount: 2,
    highSchoolCount: 2,
    avgElementaryRating: 7.3,
    avgMiddleRating: 7.1,
    avgHighRating: 7.2,
    districtName: 'English-language School Board of Quebec',
    districtRating: 7.3,
    districtRank: 15,
    districtRankPercentile: 68,
    avgTestScorePercentile: 72,
    avgGraduationRate: 89.8,
    postsecondaryEnrollmentRate: 85.2,
    avgDistanceToElementary: 0.8,
    avgDistanceToHigh: 1.6,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'montreal-plateau-qc': {
    neighborhoodId: 'montreal-plateau-qc',
    neighborhoodName: 'Plateau-Mont-Royal',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 4,
    middleSchoolCount: 2,
    highSchoolCount: 1,
    avgElementaryRating: 7.5,
    avgMiddleRating: 7.3,
    avgHighRating: 7.4,
    districtName: 'Commission scolaire de Montréal',
    districtRating: 7.1,
    districtRank: 18,
    districtRankPercentile: 65,
    avgTestScorePercentile: 70,
    avgGraduationRate: 88.5,
    postsecondaryEnrollmentRate: 83.9,
    avgDistanceToElementary: 0.6,
    avgDistanceToHigh: 1.7,
    hasPrivateSchools: true,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'montreal-west-island-qc': {
    neighborhoodId: 'montreal-west-island-qc',
    neighborhoodName: 'West Island',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 6,
    middleSchoolCount: 2,
    highSchoolCount: 2,
    avgElementaryRating: 8.1,
    avgMiddleRating: 7.9,
    avgHighRating: 7.8,
    districtName: 'Lester B. Pearson School Board',
    districtRating: 7.9,
    districtRank: 11,
    districtRankPercentile: 74,
    avgTestScorePercentile: 79,
    avgGraduationRate: 91.5,
    postsecondaryEnrollmentRate: 87.3,
    avgDistanceToElementary: 0.5,
    avgDistanceToHigh: 1.4,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  // ===== CALGARY SCHOOLS =====

  'calgary-downtown-ab': {
    neighborhoodId: 'calgary-downtown-ab',
    neighborhoodName: 'Downtown Calgary',
    cityId: 'calgary-ab',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 7.4,
    avgMiddleRating: 7.2,
    avgHighRating: 7.3,
    districtName: 'Calgary Board of Education',
    districtRating: 7.6,
    districtRank: 13,
    districtRankPercentile: 70,
    avgTestScorePercentile: 75,
    avgGraduationRate: 90.5,
    postsecondaryEnrollmentRate: 85.8,
    avgDistanceToElementary: 1.0,
    avgDistanceToHigh: 1.8,
    hasPrivateSchools: true,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'calgary-southwest-ab': {
    neighborhoodId: 'calgary-southwest-ab',
    neighborhoodName: 'Southwest Calgary',
    cityId: 'calgary-ab',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 4,
    middleSchoolCount: 2,
    highSchoolCount: 1,
    avgElementaryRating: 7.8,
    avgMiddleRating: 7.6,
    avgHighRating: 7.7,
    districtName: 'Calgary Board of Education',
    districtRating: 7.6,
    districtRank: 13,
    districtRankPercentile: 70,
    avgTestScorePercentile: 77,
    avgGraduationRate: 91.2,
    postsecondaryEnrollmentRate: 86.5,
    avgDistanceToElementary: 0.5,
    avgDistanceToHigh: 1.5,
    hasPrivateSchools: true,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  // ===== EDMONTON SCHOOLS =====

  'edmonton-downtown-ab': {
    neighborhoodId: 'edmonton-downtown-ab',
    neighborhoodName: 'Downtown Edmonton',
    cityId: 'edmonton-ab',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 6.9,
    avgMiddleRating: 6.7,
    avgHighRating: 6.8,
    districtName: 'Edmonton Public Schools',
    districtRating: 7.4,
    districtRank: 16,
    districtRankPercentile: 66,
    avgTestScorePercentile: 71,
    avgGraduationRate: 89.2,
    postsecondaryEnrollmentRate: 84.1,
    avgDistanceToElementary: 1.1,
    avgDistanceToHigh: 2.0,
    hasPrivateSchools: true,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'edmonton-river-cree-ab': {
    neighborhoodId: 'edmonton-river-cree-ab',
    neighborhoodName: 'River Cree',
    cityId: 'edmonton-ab',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 3,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 7.2,
    avgMiddleRating: 7.0,
    avgHighRating: 7.1,
    districtName: 'Edmonton Public Schools',
    districtRating: 7.4,
    districtRank: 16,
    districtRankPercentile: 66,
    avgTestScorePercentile: 73,
    avgGraduationRate: 90.1,
    postsecondaryEnrollmentRate: 85.2,
    avgDistanceToElementary: 0.6,
    avgDistanceToHigh: 1.7,
    hasPrivateSchools: false,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  // ===== WINNIPEG SCHOOLS =====

  'winnipeg-downtown-mb': {
    neighborhoodId: 'winnipeg-downtown-mb',
    neighborhoodName: 'Downtown Winnipeg',
    cityId: 'winnipeg-mb',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 6.5,
    avgMiddleRating: 6.3,
    avgHighRating: 6.4,
    districtName: 'Winnipeg School Division',
    districtRating: 7.1,
    districtRank: 19,
    districtRankPercentile: 63,
    avgTestScorePercentile: 68,
    avgGraduationRate: 87.5,
    postsecondaryEnrollmentRate: 82.3,
    avgDistanceToElementary: 1.2,
    avgDistanceToHigh: 2.1,
    hasPrivateSchools: true,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: false,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  'winnipeg-river-heights-mb': {
    neighborhoodId: 'winnipeg-river-heights-mb',
    neighborhoodName: 'River Heights',
    cityId: 'winnipeg-mb',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 3,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 7.1,
    avgMiddleRating: 6.9,
    avgHighRating: 7.0,
    districtName: 'Winnipeg School Division',
    districtRating: 7.1,
    districtRank: 19,
    districtRankPercentile: 63,
    avgTestScorePercentile: 70,
    avgGraduationRate: 88.8,
    postsecondaryEnrollmentRate: 83.6,
    avgDistanceToElementary: 0.6,
    avgDistanceToHigh: 1.8,
    hasPrivateSchools: false,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: false,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  // ===== VICTORIA SCHOOLS =====

  'victoria-downtown-bc': {
    neighborhoodId: 'victoria-downtown-bc',
    neighborhoodName: 'Downtown Victoria',
    cityId: 'victoria-bc',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 7.8,
    avgMiddleRating: 7.6,
    avgHighRating: 7.7,
    districtName: 'Greater Victoria School District',
    districtRating: 7.7,
    districtRank: 14,
    districtRankPercentile: 71,
    avgTestScorePercentile: 78,
    avgGraduationRate: 91.2,
    postsecondaryEnrollmentRate: 86.8,
    avgDistanceToElementary: 0.8,
    avgDistanceToHigh: 1.5,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  // ===== OTTAWA SCHOOLS =====

  'ottawa-downtown-on': {
    neighborhoodId: 'ottawa-downtown-on',
    neighborhoodName: 'Downtown Ottawa',
    cityId: 'ottawa-on',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 3,
    middleSchoolCount: 2,
    highSchoolCount: 2,
    avgElementaryRating: 8.0,
    avgMiddleRating: 7.8,
    avgHighRating: 7.9,
    districtName: 'Ottawa-Carleton District School Board',
    districtRating: 8.0,
    districtRank: 9,
    districtRankPercentile: 75,
    avgTestScorePercentile: 80,
    avgGraduationRate: 92.8,
    postsecondaryEnrollmentRate: 88.5,
    avgDistanceToElementary: 0.7,
    avgDistanceToHigh: 1.4,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  // ===== HALIFAX SCHOOLS =====

  'halifax-downtown-ns': {
    neighborhoodId: 'halifax-downtown-ns',
    neighborhoodName: 'Downtown Halifax',
    cityId: 'halifax-ns',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 7.2,
    avgMiddleRating: 7.0,
    avgHighRating: 7.1,
    districtName: 'Halifax Regional Centre for Education',
    districtRating: 7.5,
    districtRank: 14,
    districtRankPercentile: 71,
    avgTestScorePercentile: 74,
    avgGraduationRate: 90.5,
    postsecondaryEnrollmentRate: 85.2,
    avgDistanceToElementary: 0.9,
    avgDistanceToHigh: 1.7,
    hasPrivateSchools: true,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.STATCAN}`,
    confidence: 'high',
  },

  // ===== US SCHOOLS (Sample neighborhoods) =====

  'new-york-manhattan-ny': {
    neighborhoodId: 'new-york-manhattan-ny',
    neighborhoodName: 'Manhattan',
    cityId: 'new-york-ny',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 5,
    middleSchoolCount: 3,
    highSchoolCount: 3,
    avgElementaryRating: 7.9,
    avgMiddleRating: 7.7,
    avgHighRating: 7.8,
    districtName: 'New York City Department of Education',
    districtRating: 7.5,
    districtRank: 35,
    districtRankPercentile: 68,
    avgTestScorePercentile: 75,
    avgGraduationRate: 89.5,
    postsecondaryEnrollmentRate: 84.2,
    avgDistanceToElementary: 0.7,
    avgDistanceToHigh: 1.5,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.FRED}, US Census`,
    confidence: 'high',
  },

  'los-angeles-santa-monica-ca': {
    neighborhoodId: 'los-angeles-santa-monica-ca',
    neighborhoodName: 'Santa Monica',
    cityId: 'los-angeles-ca',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 3,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 8.2,
    avgMiddleRating: 8.0,
    avgHighRating: 8.1,
    districtName: 'Santa Monica-Malibu Unified School District',
    districtRating: 8.4,
    districtRank: 12,
    districtRankPercentile: 78,
    avgTestScorePercentile: 82,
    avgGraduationRate: 93.5,
    postsecondaryEnrollmentRate: 89.2,
    avgDistanceToElementary: 0.6,
    avgDistanceToHigh: 1.3,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.FRED}, US Census`,
    confidence: 'high',
  },

  'san-francisco-downtown-ca': {
    neighborhoodId: 'san-francisco-downtown-ca',
    neighborhoodName: 'SOMA / Downtown',
    cityId: 'san-francisco-ca',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 3,
    middleSchoolCount: 2,
    highSchoolCount: 1,
    avgElementaryRating: 7.6,
    avgMiddleRating: 7.4,
    avgHighRating: 7.5,
    districtName: 'San Francisco Unified School District',
    districtRating: 7.3,
    districtRank: 42,
    districtRankPercentile: 65,
    avgTestScorePercentile: 72,
    avgGraduationRate: 88.2,
    postsecondaryEnrollmentRate: 83.5,
    avgDistanceToElementary: 0.8,
    avgDistanceToHigh: 1.6,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.FRED}, US Census`,
    confidence: 'high',
  },

  'austin-downtown-tx': {
    neighborhoodId: 'austin-downtown-tx',
    neighborhoodName: 'Downtown Austin',
    cityId: 'austin-tx',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 7.8,
    avgMiddleRating: 7.6,
    avgHighRating: 7.7,
    districtName: 'Austin Independent School District',
    districtRating: 8.1,
    districtRank: 15,
    districtRankPercentile: 74,
    avgTestScorePercentile: 79,
    avgGraduationRate: 91.2,
    postsecondaryEnrollmentRate: 86.8,
    avgDistanceToElementary: 0.9,
    avgDistanceToHigh: 1.7,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.FRED}, US Census`,
    confidence: 'high',
  },

  'denver-downtown-co': {
    neighborhoodId: 'denver-downtown-co',
    neighborhoodName: 'Downtown Denver',
    cityId: 'denver-co',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 7.3,
    avgMiddleRating: 7.1,
    avgHighRating: 7.2,
    districtName: 'Denver Public Schools',
    districtRating: 7.6,
    districtRank: 28,
    districtRankPercentile: 70,
    avgTestScorePercentile: 75,
    avgGraduationRate: 90.2,
    postsecondaryEnrollmentRate: 85.5,
    avgDistanceToElementary: 1.0,
    avgDistanceToHigh: 1.8,
    hasPrivateSchools: true,
    hasInternationalPrograms: false,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.FRED}, US Census`,
    confidence: 'high',
  },

  'miami-brickell-fl': {
    neighborhoodId: 'miami-brickell-fl',
    neighborhoodName: 'Brickell',
    cityId: 'miami-fl',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 6.8,
    avgMiddleRating: 6.6,
    avgHighRating: 6.7,
    districtName: 'Miami-Dade County Public Schools',
    districtRating: 6.9,
    districtRank: 48,
    districtRankPercentile: 60,
    avgTestScorePercentile: 65,
    avgGraduationRate: 86.5,
    postsecondaryEnrollmentRate: 81.2,
    avgDistanceToElementary: 1.1,
    avgDistanceToHigh: 2.0,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.FRED}, US Census`,
    confidence: 'high',
  },

  'chicago-loop-il': {
    neighborhoodId: 'chicago-loop-il',
    neighborhoodName: 'The Loop',
    cityId: 'chicago-il',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 6.9,
    avgMiddleRating: 6.7,
    avgHighRating: 6.8,
    districtName: 'Chicago Public Schools',
    districtRating: 6.7,
    districtRank: 52,
    districtRankPercentile: 58,
    avgTestScorePercentile: 63,
    avgGraduationRate: 84.5,
    postsecondaryEnrollmentRate: 79.8,
    avgDistanceToElementary: 1.2,
    avgDistanceToHigh: 2.2,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.FRED}, US Census`,
    confidence: 'high',
  },

  'seattle-capitol-hill-wa': {
    neighborhoodId: 'seattle-capitol-hill-wa',
    neighborhoodName: 'Capitol Hill',
    cityId: 'seattle-wa',
    asOfDate: new Date('2026-08-04'),
    elementarySchoolCount: 2,
    middleSchoolCount: 1,
    highSchoolCount: 1,
    avgElementaryRating: 7.7,
    avgMiddleRating: 7.5,
    avgHighRating: 7.6,
    districtName: 'Seattle Public Schools',
    districtRating: 7.8,
    districtRank: 22,
    districtRankPercentile: 72,
    avgTestScorePercentile: 77,
    avgGraduationRate: 90.8,
    postsecondaryEnrollmentRate: 86.2,
    avgDistanceToElementary: 0.8,
    avgDistanceToHigh: 1.6,
    hasPrivateSchools: true,
    hasInternationalPrograms: true,
    hasSpecializedPrograms: true,
    source: `${DATA_SOURCES.FRED}, US Census`,
    confidence: 'high',
  },
};

const MOCK_SCHOOLS_BY_NEIGHBORHOOD: MockSchoolsByNeighborhood = {
  'toronto-yorkville-on': [
    { schoolId: 'toronto-yorkville-elem-01', schoolName: 'Cottingham Public School', schoolType: 'elementary', rating: 9, testScorePercentile: 88, graduationRate: null, studentTeacherRatio: 15, distanceFromCenter: 0.3 },
    { schoolId: 'toronto-yorkville-middle-01', schoolName: 'Jarvis Collegiate Institute', schoolType: 'middle', rating: 8, testScorePercentile: 85, graduationRate: null, studentTeacherRatio: 16, distanceFromCenter: 0.5 },
    { schoolId: 'toronto-yorkville-high-01', schoolName: 'Jarvis Collegiate Institute', schoolType: 'high', rating: 8, testScorePercentile: 84, graduationRate: 94, studentTeacherRatio: 17, distanceFromCenter: 0.5 },
  ],
  'toronto-downtown-on': [
    { schoolId: 'toronto-downtown-elem-01', schoolName: 'St. Andrew Junior PS', schoolType: 'elementary', rating: 8, testScorePercentile: 80, graduationRate: null, studentTeacherRatio: 16, distanceFromCenter: 0.4 },
    { schoolId: 'toronto-downtown-high-01', schoolName: 'Central Technical School', schoolType: 'high', rating: 8, testScorePercentile: 78, graduationRate: 90, studentTeacherRatio: 18, distanceFromCenter: 0.6 },
  ],
  'vancouver-west-side-bc': [
    { schoolId: 'vancouver-west-elem-01', schoolName: 'Dunbar Elementary School', schoolType: 'elementary', rating: 9, testScorePercentile: 87, graduationRate: null, studentTeacherRatio: 15, distanceFromCenter: 0.4 },
    { schoolId: 'vancouver-west-high-01', schoolName: 'Kitsilano Secondary School', schoolType: 'high', rating: 8, testScorePercentile: 82, graduationRate: 92, studentTeacherRatio: 17, distanceFromCenter: 1.2 },
  ],
  'los-angeles-santa-monica-ca': [
    { schoolId: 'la-santa-elem-01', schoolName: 'John Muir Elementary School', schoolType: 'elementary', rating: 9, testScorePercentile: 89, graduationRate: null, studentTeacherRatio: 14, distanceFromCenter: 0.5 },
    { schoolId: 'la-santa-high-01', schoolName: 'Santa Monica High School', schoolType: 'high', rating: 8, testScorePercentile: 85, graduationRate: 94, studentTeacherRatio: 16, distanceFromCenter: 0.7 },
  ],
};

/**
 * Fetch school ratings for a neighborhood
 *
 * @param input Neighborhood ID, city ID, and optional date
 * @returns School rating and education metrics
 * @throws Error if neighborhood not found
 */
export function schoolRatingEngine(input: SchoolRatingInput): SchoolRatingOutput {
  const { neighborhoodId, asOfDate } = input;

  const validatedDate = validateDateOrUseToday(asOfDate);

  const mockData = MOCK_NEIGHBORHOOD_DATA[neighborhoodId];
  if (!mockData) {
    throw new Error(`No school data available for neighborhood "${neighborhoodId}".`);
  }

  const nearbySchools = MOCK_SCHOOLS_BY_NEIGHBORHOOD[neighborhoodId] || [];

  return {
    ...mockData,
    asOfDate: validatedDate,
    nearbySchools,
  };
}

export default schoolRatingEngine;
