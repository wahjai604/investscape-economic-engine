/**
 * E36: Crime & Safety Engine
 *
 * Provides detailed crime statistics and safety metrics for neighborhoods.
 * Builds on E31 (neighborhood demographics) to deliver crime context:
 * - Crime rates by category (violent, property, other)
 * - Safety category assessment
 * - Police presence and staffing
 * - Emergency response times
 * - Trend analysis (year-over-year)
 * - Comparative neighborhood safety
 *
 * DISCLAIMER: All metrics are informational only. Users should verify
 * current data with official law enforcement and government sources.
 * Not legal or realtor advice.
 *
 * Data sources (locked per E29-E45 design spec):
 * - Statistics Canada crime data
 * - FBI Uniform Crime Reporting (US)
 * - Local police service crime reports
 * - Emergency service response times
 */

import { validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * Crime incident types tracked
 */
export interface CrimeIncidents {
  homicide: number; // per 100,000
  assault: number; // per 100,000 (aggravated)
  robbery: number; // per 100,000
  sexualAssault: number; // per 100,000
  burglary: number; // per 100,000
  theft: number; // per 100,000
  autoTheft: number; // per 100,000
  arson: number; // per 100,000
  drugOffenses: number; // per 100,000
  other: number; // per 100,000
}

/**
 * Crime and safety metrics for neighborhood
 */
export interface CrimeSafetyMetrics {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  asOfDate: Date;

  // Overall safety score
  safetyScore: number; // 0-100 (higher = safer)
  safetyCategory: string; // Very Safe, Safe, Moderate Risk, High Risk, Very High Risk

  // Crime rates (per 100,000 population)
  violentCrimeRate: number; // homicide + assault + robbery + sexual assault
  propertyCrimeRate: number; // burglary + theft + auto theft + arson
  drugCrimeRate: number; // drug offenses
  totalCrimeRate: number; // all incidents

  // Crime breakdown
  incidents: CrimeIncidents;

  // Trend analysis
  crimeChange12m: number; // % change year-over-year
  violentCrimeTrend: number; // % change YoY
  propertyCrimeTrend: number; // % change YoY

  // Police and emergency services
  policeOfficersPerCapita: number; // officers per 1,000 residents
  policeStations: number; // in or near neighborhood
  emergencyResponseTime: number; // minutes average

  // Comparative metrics
  saferThanCityAverage: boolean; // vs city average
  saferThanNational: boolean; // vs national average

  // Confidence and source
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CrimeSafetyInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  asOfDate?: Date;
}

export interface CrimeSafetyOutput extends CrimeSafetyMetrics {}

/**
 * Mock crime and safety data store.
 *
 * In production, this queries Supabase `economic_data.crime_safety_metrics` table
 * populated from Statistics Canada, FBI UCR, local police, and emergency services.
 * For now, realistic fixtures representing Aug 4, 2026 data.
 *
 * DISCLAIMER: All data is for informational purposes only.
 */
interface MockCrimeSafetyData {
  [neighborhoodId: string]: CrimeSafetyMetrics;
}

const MOCK_DATA: MockCrimeSafetyData = {
  // ===== TORONTO CRIME & SAFETY =====

  'toronto-yorkville-on': {
    neighborhoodId: 'toronto-yorkville-on',
    neighborhoodName: 'Yorkville',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 84,
    safetyCategory: 'Very Safe',
    violentCrimeRate: 45,
    propertyCrimeRate: 520,
    drugCrimeRate: 25,
    totalCrimeRate: 590,
    incidents: {
      homicide: 0.2,
      assault: 32,
      robbery: 8,
      sexualAssault: 5,
      burglary: 85,
      theft: 320,
      autoTheft: 65,
      arson: 5,
      drugOffenses: 25,
      other: 55,
    },
    crimeChange12m: -3.2,
    violentCrimeTrend: -5.1,
    propertyCrimeTrend: -2.8,
    policeOfficersPerCapita: 3.2,
    policeStations: 2,
    emergencyResponseTime: 4.8,
    saferThanCityAverage: true,
    saferThanNational: true,
    source: `${DATA_SOURCES.STATCAN}, Toronto Police Service`,
    confidence: 'high',
  },

  'toronto-downtown-on': {
    neighborhoodId: 'toronto-downtown-on',
    neighborhoodName: 'Downtown Toronto',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 82,
    safetyCategory: 'Very Safe',
    violentCrimeRate: 52,
    propertyCrimeRate: 580,
    drugCrimeRate: 35,
    totalCrimeRate: 667,
    incidents: {
      homicide: 0.3,
      assault: 38,
      robbery: 12,
      sexualAssault: 4,
      burglary: 95,
      theft: 380,
      autoTheft: 75,
      arson: 8,
      drugOffenses: 35,
      other: 70,
    },
    crimeChange12m: -1.8,
    violentCrimeTrend: -2.2,
    propertyCrimeTrend: -1.5,
    policeOfficersPerCapita: 3.5,
    policeStations: 3,
    emergencyResponseTime: 4.2,
    saferThanCityAverage: true,
    saferThanNational: true,
    source: `${DATA_SOURCES.STATCAN}, Toronto Police Service`,
    confidence: 'high',
  },

  'toronto-north-york-on': {
    neighborhoodId: 'toronto-north-york-on',
    neighborhoodName: 'North York',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 76,
    safetyCategory: 'Safe',
    violentCrimeRate: 78,
    propertyCrimeRate: 720,
    drugCrimeRate: 48,
    totalCrimeRate: 846,
    incidents: {
      homicide: 0.4,
      assault: 55,
      robbery: 18,
      sexualAssault: 8,
      burglary: 125,
      theft: 420,
      autoTheft: 125,
      arson: 12,
      drugOffenses: 48,
      other: 95,
    },
    crimeChange12m: 1.2,
    violentCrimeTrend: 2.1,
    propertyCrimeTrend: 0.8,
    policeOfficersPerCapita: 2.8,
    policeStations: 2,
    emergencyResponseTime: 6.2,
    saferThanCityAverage: false,
    saferThanNational: true,
    source: `${DATA_SOURCES.STATCAN}, Toronto Police Service`,
    confidence: 'high',
  },

  'toronto-scarborough-on': {
    neighborhoodId: 'toronto-scarborough-on',
    neighborhoodName: 'Scarborough',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 68,
    safetyCategory: 'Moderate Risk',
    violentCrimeRate: 125,
    propertyCrimeRate: 950,
    drugCrimeRate: 72,
    totalCrimeRate: 1147,
    incidents: {
      homicide: 0.6,
      assault: 85,
      robbery: 32,
      sexualAssault: 12,
      burglary: 185,
      theft: 580,
      autoTheft: 165,
      arson: 18,
      drugOffenses: 72,
      other: 142,
    },
    crimeChange12m: 3.8,
    violentCrimeTrend: 4.2,
    propertyCrimeTrend: 3.5,
    policeOfficersPerCapita: 2.5,
    policeStations: 2,
    emergencyResponseTime: 7.8,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.STATCAN}, Toronto Police Service`,
    confidence: 'high',
  },

  'toronto-etobicoke-on': {
    neighborhoodId: 'toronto-etobicoke-on',
    neighborhoodName: 'Etobicoke',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 70,
    safetyCategory: 'Moderate Risk',
    violentCrimeRate: 95,
    propertyCrimeRate: 820,
    drugCrimeRate: 55,
    totalCrimeRate: 970,
    incidents: {
      homicide: 0.5,
      assault: 68,
      robbery: 22,
      sexualAssault: 10,
      burglary: 150,
      theft: 520,
      autoTheft: 135,
      arson: 15,
      drugOffenses: 55,
      other: 115,
    },
    crimeChange12m: 2.5,
    violentCrimeTrend: 3.1,
    propertyCrimeTrend: 2.2,
    policeOfficersPerCapita: 2.6,
    policeStations: 1,
    emergencyResponseTime: 7.5,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.STATCAN}, Toronto Police Service`,
    confidence: 'high',
  },

  // ===== VANCOUVER CRIME & SAFETY =====

  'vancouver-west-side-bc': {
    neighborhoodId: 'vancouver-west-side-bc',
    neighborhoodName: 'West Side Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 80,
    safetyCategory: 'Very Safe',
    violentCrimeRate: 65,
    propertyCrimeRate: 650,
    drugCrimeRate: 40,
    totalCrimeRate: 755,
    incidents: {
      homicide: 0.3,
      assault: 45,
      robbery: 15,
      sexualAssault: 6,
      burglary: 110,
      theft: 400,
      autoTheft: 95,
      arson: 8,
      drugOffenses: 40,
      other: 85,
    },
    crimeChange12m: -2.1,
    violentCrimeTrend: -3.2,
    propertyCrimeTrend: -1.8,
    policeOfficersPerCapita: 3.1,
    policeStations: 2,
    emergencyResponseTime: 5.2,
    saferThanCityAverage: true,
    saferThanNational: true,
    source: `${DATA_SOURCES.STATCAN}, Vancouver Police Department`,
    confidence: 'high',
  },

  'vancouver-downtown-bc': {
    neighborhoodId: 'vancouver-downtown-bc',
    neighborhoodName: 'Downtown Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 72,
    safetyCategory: 'Safe',
    violentCrimeRate: 110,
    propertyCrimeRate: 920,
    drugCrimeRate: 85,
    totalCrimeRate: 1115,
    incidents: {
      homicide: 0.4,
      assault: 78,
      robbery: 28,
      sexualAssault: 8,
      burglary: 165,
      theft: 580,
      autoTheft: 145,
      arson: 12,
      drugOffenses: 85,
      other: 135,
    },
    crimeChange12m: 4.2,
    violentCrimeTrend: 5.8,
    propertyCrimeTrend: 3.9,
    policeOfficersPerCapita: 3.8,
    policeStations: 3,
    emergencyResponseTime: 4.5,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.STATCAN}, Vancouver Police Department`,
    confidence: 'high',
  },

  'vancouver-east-bc': {
    neighborhoodId: 'vancouver-east-bc',
    neighborhoodName: 'East Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 65,
    safetyCategory: 'Moderate Risk',
    violentCrimeRate: 155,
    propertyCrimeRate: 1180,
    drugCrimeRate: 125,
    totalCrimeRate: 1460,
    incidents: {
      homicide: 0.7,
      assault: 110,
      robbery: 38,
      sexualAssault: 12,
      burglary: 220,
      theft: 750,
      autoTheft: 180,
      arson: 18,
      drugOffenses: 125,
      other: 160,
    },
    crimeChange12m: 6.1,
    violentCrimeTrend: 7.2,
    propertyCrimeTrend: 5.8,
    policeOfficersPerCapita: 3.2,
    policeStations: 2,
    emergencyResponseTime: 6.8,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.STATCAN}, Vancouver Police Department`,
    confidence: 'high',
  },

  'vancouver-north-shore-bc': {
    neighborhoodId: 'vancouver-north-shore-bc',
    neighborhoodName: 'North Shore',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 82,
    safetyCategory: 'Very Safe',
    violentCrimeRate: 55,
    propertyCrimeRate: 580,
    drugCrimeRate: 32,
    totalCrimeRate: 667,
    incidents: {
      homicide: 0.2,
      assault: 38,
      robbery: 12,
      sexualAssault: 5,
      burglary: 95,
      theft: 360,
      autoTheft: 85,
      arson: 6,
      drugOffenses: 32,
      other: 72,
    },
    crimeChange12m: -1.5,
    violentCrimeTrend: -2.8,
    propertyCrimeTrend: -1.2,
    policeOfficersPerCapita: 2.9,
    policeStations: 1,
    emergencyResponseTime: 5.8,
    saferThanCityAverage: true,
    saferThanNational: true,
    source: `${DATA_SOURCES.STATCAN}, Vancouver Police Department`,
    confidence: 'high',
  },

  // ===== MONTREAL CRIME & SAFETY =====

  'montreal-downtown-qc': {
    neighborhoodId: 'montreal-downtown-qc',
    neighborhoodName: 'Downtown Montreal',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 75,
    safetyCategory: 'Safe',
    violentCrimeRate: 88,
    propertyCrimeRate: 750,
    drugCrimeRate: 62,
    totalCrimeRate: 900,
    incidents: {
      homicide: 0.3,
      assault: 62,
      robbery: 20,
      sexualAssault: 8,
      burglary: 135,
      theft: 520,
      autoTheft: 85,
      arson: 10,
      drugOffenses: 62,
      other: 118,
    },
    crimeChange12m: 1.5,
    violentCrimeTrend: 2.1,
    propertyCrimeTrend: 1.2,
    policeOfficersPerCapita: 3.3,
    policeStations: 2,
    emergencyResponseTime: 5.5,
    saferThanCityAverage: true,
    saferThanNational: true,
    source: `${DATA_SOURCES.STATCAN}, Montreal Police Service`,
    confidence: 'high',
  },

  'montreal-plateau-qc': {
    neighborhoodId: 'montreal-plateau-qc',
    neighborhoodName: 'Plateau-Mont-Royal',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 78,
    safetyCategory: 'Safe',
    violentCrimeRate: 72,
    propertyCrimeRate: 680,
    drugCrimeRate: 58,
    totalCrimeRate: 810,
    incidents: {
      homicide: 0.2,
      assault: 52,
      robbery: 15,
      sexualAssault: 7,
      burglary: 120,
      theft: 430,
      autoTheft: 75,
      arson: 8,
      drugOffenses: 58,
      other: 95,
    },
    crimeChange12m: -0.8,
    violentCrimeTrend: -1.2,
    propertyCrimeTrend: -0.5,
    policeOfficersPerCapita: 3.0,
    policeStations: 2,
    emergencyResponseTime: 5.8,
    saferThanCityAverage: true,
    saferThanNational: true,
    source: `${DATA_SOURCES.STATCAN}, Montreal Police Service`,
    confidence: 'high',
  },

  'montreal-west-island-qc': {
    neighborhoodId: 'montreal-west-island-qc',
    neighborhoodName: 'West Island',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 86,
    safetyCategory: 'Very Safe',
    violentCrimeRate: 38,
    propertyCrimeRate: 420,
    drugCrimeRate: 18,
    totalCrimeRate: 476,
    incidents: {
      homicide: 0.1,
      assault: 28,
      robbery: 6,
      sexualAssault: 4,
      burglary: 75,
      theft: 250,
      autoTheft: 65,
      arson: 3,
      drugOffenses: 18,
      other: 45,
    },
    crimeChange12m: -2.2,
    violentCrimeTrend: -3.5,
    propertyCrimeTrend: -1.8,
    policeOfficersPerCapita: 2.7,
    policeStations: 1,
    emergencyResponseTime: 6.5,
    saferThanCityAverage: true,
    saferThanNational: true,
    source: `${DATA_SOURCES.STATCAN}, Montreal Police Service`,
    confidence: 'high',
  },

  // ===== US CRIME & SAFETY (Sample) =====

  'new-york-manhattan-ny': {
    neighborhoodId: 'new-york-manhattan-ny',
    neighborhoodName: 'Manhattan',
    cityId: 'new-york-ny',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 74,
    safetyCategory: 'Safe',
    violentCrimeRate: 112,
    propertyCrimeRate: 920,
    drugCrimeRate: 95,
    totalCrimeRate: 1127,
    incidents: {
      homicide: 0.4,
      assault: 82,
      robbery: 25,
      sexualAssault: 10,
      burglary: 165,
      theft: 600,
      autoTheft: 135,
      arson: 15,
      drugOffenses: 95,
      other: 140,
    },
    crimeChange12m: 2.1,
    violentCrimeTrend: 3.2,
    propertyCrimeTrend: 1.8,
    policeOfficersPerCapita: 4.2,
    policeStations: 4,
    emergencyResponseTime: 4.8,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.FRED}, NYPD`,
    confidence: 'high',
  },

  'los-angeles-santa-monica-ca': {
    neighborhoodId: 'los-angeles-santa-monica-ca',
    neighborhoodName: 'Santa Monica',
    cityId: 'los-angeles-ca',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 77,
    safetyCategory: 'Safe',
    violentCrimeRate: 78,
    propertyCrimeRate: 680,
    drugCrimeRate: 45,
    totalCrimeRate: 803,
    incidents: {
      homicide: 0.2,
      assault: 55,
      robbery: 18,
      sexualAssault: 6,
      burglary: 125,
      theft: 420,
      autoTheft: 105,
      arson: 8,
      drugOffenses: 45,
      other: 95,
    },
    crimeChange12m: -1.5,
    violentCrimeTrend: -2.1,
    propertyCrimeTrend: -1.2,
    policeOfficersPerCapita: 3.5,
    policeStations: 2,
    emergencyResponseTime: 5.2,
    saferThanCityAverage: true,
    saferThanNational: true,
    source: `${DATA_SOURCES.FRED}, LAPD`,
    confidence: 'high',
  },

  'san-francisco-downtown-ca': {
    neighborhoodId: 'san-francisco-downtown-ca',
    neighborhoodName: 'SOMA / Downtown',
    cityId: 'san-francisco-ca',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 68,
    safetyCategory: 'Moderate Risk',
    violentCrimeRate: 135,
    propertyCrimeRate: 1050,
    drugCrimeRate: 110,
    totalCrimeRate: 1295,
    incidents: {
      homicide: 0.5,
      assault: 95,
      robbery: 32,
      sexualAssault: 12,
      burglary: 190,
      theft: 680,
      autoTheft: 160,
      arson: 18,
      drugOffenses: 110,
      other: 165,
    },
    crimeChange12m: 5.2,
    violentCrimeTrend: 6.8,
    propertyCrimeTrend: 4.5,
    policeOfficersPerCapita: 3.8,
    policeStations: 3,
    emergencyResponseTime: 5.5,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.FRED}, SFPD`,
    confidence: 'high',
  },

  'austin-downtown-tx': {
    neighborhoodId: 'austin-downtown-tx',
    neighborhoodName: 'Downtown Austin',
    cityId: 'austin-tx',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 73,
    safetyCategory: 'Safe',
    violentCrimeRate: 95,
    propertyCrimeRate: 820,
    drugCrimeRate: 68,
    totalCrimeRate: 983,
    incidents: {
      homicide: 0.3,
      assault: 68,
      robbery: 20,
      sexualAssault: 8,
      burglary: 155,
      theft: 520,
      autoTheft: 125,
      arson: 12,
      drugOffenses: 68,
      other: 130,
    },
    crimeChange12m: 3.8,
    violentCrimeTrend: 4.5,
    propertyCrimeTrend: 3.2,
    policeOfficersPerCapita: 3.2,
    policeStations: 2,
    emergencyResponseTime: 5.8,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.FRED}, APD`,
    confidence: 'high',
  },

  'denver-downtown-co': {
    neighborhoodId: 'denver-downtown-co',
    neighborhoodName: 'Downtown Denver',
    cityId: 'denver-co',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 71,
    safetyCategory: 'Safe',
    violentCrimeRate: 125,
    propertyCrimeRate: 950,
    drugCrimeRate: 88,
    totalCrimeRate: 1163,
    incidents: {
      homicide: 0.4,
      assault: 88,
      robbery: 28,
      sexualAssault: 10,
      burglary: 170,
      theft: 620,
      autoTheft: 140,
      arson: 15,
      drugOffenses: 88,
      other: 145,
    },
    crimeChange12m: 4.5,
    violentCrimeTrend: 5.2,
    propertyCrimeTrend: 4.1,
    policeOfficersPerCapita: 3.5,
    policeStations: 2,
    emergencyResponseTime: 5.2,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.FRED}, DPD`,
    confidence: 'high',
  },

  'miami-brickell-fl': {
    neighborhoodId: 'miami-brickell-fl',
    neighborhoodName: 'Brickell',
    cityId: 'miami-fl',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 70,
    safetyCategory: 'Moderate Risk',
    violentCrimeRate: 145,
    propertyCrimeRate: 1080,
    drugCrimeRate: 105,
    totalCrimeRate: 1330,
    incidents: {
      homicide: 0.5,
      assault: 102,
      robbery: 35,
      sexualAssault: 12,
      burglary: 195,
      theft: 700,
      autoTheft: 165,
      arson: 18,
      drugOffenses: 105,
      other: 155,
    },
    crimeChange12m: 3.2,
    violentCrimeTrend: 4.1,
    propertyCrimeTrend: 2.8,
    policeOfficersPerCapita: 3.6,
    policeStations: 2,
    emergencyResponseTime: 5.5,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.FRED}, MPD`,
    confidence: 'high',
  },

  'chicago-loop-il': {
    neighborhoodId: 'chicago-loop-il',
    neighborhoodName: 'The Loop',
    cityId: 'chicago-il',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 69,
    safetyCategory: 'Moderate Risk',
    violentCrimeRate: 168,
    propertyCrimeRate: 1240,
    drugCrimeRate: 125,
    totalCrimeRate: 1533,
    incidents: {
      homicide: 0.6,
      assault: 118,
      robbery: 42,
      sexualAssault: 14,
      burglary: 225,
      theft: 820,
      autoTheft: 175,
      arson: 22,
      drugOffenses: 125,
      other: 180,
    },
    crimeChange12m: 6.2,
    violentCrimeTrend: 7.1,
    propertyCrimeTrend: 5.8,
    policeOfficersPerCapita: 4.1,
    policeStations: 3,
    emergencyResponseTime: 4.8,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.FRED}, CPD`,
    confidence: 'high',
  },

  'seattle-capitol-hill-wa': {
    neighborhoodId: 'seattle-capitol-hill-wa',
    neighborhoodName: 'Capitol Hill',
    cityId: 'seattle-wa',
    asOfDate: new Date('2026-08-04'),
    safetyScore: 72,
    safetyCategory: 'Safe',
    violentCrimeRate: 105,
    propertyCrimeRate: 880,
    drugCrimeRate: 92,
    totalCrimeRate: 1077,
    incidents: {
      homicide: 0.3,
      assault: 75,
      robbery: 25,
      sexualAssault: 10,
      burglary: 160,
      theft: 580,
      autoTheft: 130,
      arson: 14,
      drugOffenses: 92,
      other: 135,
    },
    crimeChange12m: 4.8,
    violentCrimeTrend: 5.6,
    propertyCrimeTrend: 4.2,
    policeOfficersPerCapita: 3.3,
    policeStations: 2,
    emergencyResponseTime: 5.5,
    saferThanCityAverage: false,
    saferThanNational: false,
    source: `${DATA_SOURCES.FRED}, SPD`,
    confidence: 'high',
  },
};

/**
 * Fetch crime and safety metrics for a neighborhood
 *
 * DISCLAIMER: All metrics are informational only. Users should verify
 * current data with official law enforcement and government sources.
 *
 * @param input Neighborhood ID, city ID, and optional date
 * @returns Crime and safety metrics
 * @throws Error if neighborhood not found
 */
export function crimeSafetyEngine(input: CrimeSafetyInput): CrimeSafetyOutput {
  const { neighborhoodId, asOfDate } = input;

  const validatedDate = validateDateOrUseToday(asOfDate);

  const mockData = MOCK_DATA[neighborhoodId];
  if (!mockData) {
    throw new Error(`No crime and safety data available for neighborhood "${neighborhoodId}".`);
  }

  return {
    ...mockData,
    asOfDate: validatedDate,
  };
}

export default crimeSafetyEngine;
