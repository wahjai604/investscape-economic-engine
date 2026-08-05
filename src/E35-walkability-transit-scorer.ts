/**
 * E35: Walkability & Transit Scorer
 *
 * Provides detailed transportation and urban accessibility metrics for neighborhoods.
 * Builds on E31 (neighborhood demographics) to deliver walkability context:
 * - Walkability score (0-100, pedestrian infrastructure)
 * - Transit score (0-100, public transportation access)
 * - Bike score (0-100, cycling infrastructure)
 * - Car dependency assessment
 * - Commute time estimates
 * - Transportation diversity metrics
 *
 * Data sources (locked per E29-E45 design spec):
 * - Walk Score API (pedestrian & transit scoring)
 * - Google Transit/local transit authority (commute times)
 * - Census commute patterns (car vs. transit usage)
 * - City cycling infrastructure databases
 */

import { validateDateOrUseToday } from './utils/validators';
import { DATA_SOURCES } from './utils/constants';

/**
 * Transit type presence in neighborhood
 */
export interface TransitTypes {
  subway: boolean;
  bus: boolean;
  streetcar: boolean;
  lightRail: boolean;
  commuter: boolean;
}

/**
 * Commute time estimates to major employment centers
 */
export interface CommuteEstimates {
  toCityCenter: number; // minutes by transit
  toDowntown: number; // minutes by transit
  toAirport: number; // minutes by transit
  byCarToCityCenter: number; // minutes by car
}

/**
 * Walkability and transit scoring data
 */
export interface WalkabilityMetrics {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  asOfDate: Date;

  // Core scores (0-100)
  walkScore: number; // Overall walkability
  transitScore: number; // Public transit access
  bikeScore: number; // Cycling infrastructure

  // Walkability breakdown
  walkabilityCategory: string; // Walker's Paradise, Very Walkable, Somewhat Walkable, Car-Dependent, Driving Only
  pedestrianInfrastructure: number; // 0-100 (sidewalks, crossings, etc.)
  streetConnectivity: number; // 0-100 (grid vs. sprawl)
  landUseMix: number; // 0-100 (residential vs. commercial/retail)

  // Transit breakdown
  transitCategory: string; // Excellent, Very Good, Good, Some Transit, Minimal Transit
  distanceToNearestTransit: number; // meters
  transitTypes: TransitTypes;
  transitFrequency: number; // 0-100 (headways: frequent = high score)

  // Bike infrastructure
  bikeInfrastructure: number; // 0-100 (lanes, trails, protection)
  bikeLaneKm: number; // total km of bike lanes
  bikeParkingSpots: number; // estimated available bike parking
  bikeShareStations: number; // nearby bike share stations

  // Car dependency
  carDependency: number; // 0-100 (0 = not needed, 100 = essential)
  driversPerHousehold: number; // avg
  transitUsageRate: number; // % of commutes by transit
  carCommutingRate: number; // % of commutes by car

  // Commute times
  commuteEstimates: CommuteEstimates;
  avgCommuteTime: number; // minutes (any mode)

  // Transportation diversity
  multimodalAccessibility: number; // 0-100 (options available)

  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface WalkabilityInput {
  neighborhoodId: string;
  neighborhoodName: string;
  cityId: string;
  asOfDate?: Date;
}

export interface WalkabilityOutput extends WalkabilityMetrics {}

/**
 * Mock walkability data store.
 *
 * In production, this queries Supabase `economic_data.walkability_metrics` table
 * populated from Walk Score API and local transit databases.
 * For now, realistic fixtures representing Aug 4, 2026 data.
 */
interface MockWalkabilityData {
  [neighborhoodId: string]: WalkabilityMetrics;
}

const MOCK_DATA: MockWalkabilityData = {
  // ===== TORONTO WALKABILITY =====

  'toronto-yorkville-on': {
    neighborhoodId: 'toronto-yorkville-on',
    neighborhoodName: 'Yorkville',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    walkScore: 94,
    transitScore: 96,
    bikeScore: 90,
    walkabilityCategory: "Walker's Paradise",
    pedestrianInfrastructure: 95,
    streetConnectivity: 92,
    landUseMix: 88,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 120,
    transitTypes: {
      subway: true,
      bus: true,
      streetcar: true,
      lightRail: false,
      commuter: false,
    },
    transitFrequency: 94,
    bikeInfrastructure: 88,
    bikeLaneKm: 12,
    bikeParkingSpots: 450,
    bikeShareStations: 8,
    carDependency: 8,
    driversPerHousehold: 0.6,
    transitUsageRate: 68,
    carCommutingRate: 18,
    commuteEstimates: {
      toCityCenter: 8,
      toDowntown: 10,
      toAirport: 28,
      byCarToCityCenter: 12,
    },
    avgCommuteTime: 32,
    multimodalAccessibility: 92,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  'toronto-downtown-on': {
    neighborhoodId: 'toronto-downtown-on',
    neighborhoodName: 'Downtown Toronto',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    walkScore: 92,
    transitScore: 95,
    bikeScore: 88,
    walkabilityCategory: "Walker's Paradise",
    pedestrianInfrastructure: 93,
    streetConnectivity: 90,
    landUseMix: 90,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 140,
    transitTypes: {
      subway: true,
      bus: true,
      streetcar: true,
      lightRail: false,
      commuter: false,
    },
    transitFrequency: 93,
    bikeInfrastructure: 85,
    bikeLaneKm: 15,
    bikeParkingSpots: 520,
    bikeShareStations: 12,
    carDependency: 10,
    driversPerHousehold: 0.5,
    transitUsageRate: 72,
    carCommutingRate: 15,
    commuteEstimates: {
      toCityCenter: 5,
      toDowntown: 8,
      toAirport: 30,
      byCarToCityCenter: 10,
    },
    avgCommuteTime: 28,
    multimodalAccessibility: 91,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  'toronto-north-york-on': {
    neighborhoodId: 'toronto-north-york-on',
    neighborhoodName: 'North York',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    walkScore: 75,
    transitScore: 82,
    bikeScore: 72,
    walkabilityCategory: 'Very Walkable',
    pedestrianInfrastructure: 78,
    streetConnectivity: 75,
    landUseMix: 70,
    transitCategory: 'Very Good',
    distanceToNearestTransit: 320,
    transitTypes: {
      subway: true,
      bus: true,
      streetcar: false,
      lightRail: true,
      commuter: false,
    },
    transitFrequency: 80,
    bikeInfrastructure: 68,
    bikeLaneKm: 8,
    bikeParkingSpots: 200,
    bikeShareStations: 3,
    carDependency: 28,
    driversPerHousehold: 1.2,
    transitUsageRate: 45,
    carCommutingRate: 45,
    commuteEstimates: {
      toCityCenter: 22,
      toDowntown: 25,
      toAirport: 35,
      byCarToCityCenter: 18,
    },
    avgCommuteTime: 38,
    multimodalAccessibility: 78,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  'toronto-scarborough-on': {
    neighborhoodId: 'toronto-scarborough-on',
    neighborhoodName: 'Scarborough',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    walkScore: 62,
    transitScore: 68,
    bikeScore: 55,
    walkabilityCategory: 'Somewhat Walkable',
    pedestrianInfrastructure: 65,
    streetConnectivity: 60,
    landUseMix: 58,
    transitCategory: 'Good',
    distanceToNearestTransit: 450,
    transitTypes: {
      subway: true,
      bus: true,
      streetcar: false,
      lightRail: false,
      commuter: false,
    },
    transitFrequency: 65,
    bikeInfrastructure: 50,
    bikeLaneKm: 4,
    bikeParkingSpots: 80,
    bikeShareStations: 1,
    carDependency: 55,
    driversPerHousehold: 1.6,
    transitUsageRate: 28,
    carCommutingRate: 65,
    commuteEstimates: {
      toCityCenter: 35,
      toDowntown: 40,
      toAirport: 45,
      byCarToCityCenter: 28,
    },
    avgCommuteTime: 48,
    multimodalAccessibility: 62,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  'toronto-etobicoke-on': {
    neighborhoodId: 'toronto-etobicoke-on',
    neighborhoodName: 'Etobicoke',
    cityId: 'toronto-on',
    asOfDate: new Date('2026-08-04'),
    walkScore: 58,
    transitScore: 65,
    bikeScore: 52,
    walkabilityCategory: 'Somewhat Walkable',
    pedestrianInfrastructure: 62,
    streetConnectivity: 58,
    landUseMix: 55,
    transitCategory: 'Good',
    distanceToNearestTransit: 500,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: false,
      commuter: false,
    },
    transitFrequency: 62,
    bikeInfrastructure: 48,
    bikeLaneKm: 3,
    bikeParkingSpots: 60,
    bikeShareStations: 0,
    carDependency: 62,
    driversPerHousehold: 1.8,
    transitUsageRate: 22,
    carCommutingRate: 72,
    commuteEstimates: {
      toCityCenter: 40,
      toDowntown: 45,
      toAirport: 35,
      byCarToCityCenter: 32,
    },
    avgCommuteTime: 52,
    multimodalAccessibility: 58,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  // ===== VANCOUVER WALKABILITY =====

  'vancouver-west-side-bc': {
    neighborhoodId: 'vancouver-west-side-bc',
    neighborhoodName: 'West Side Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    walkScore: 88,
    transitScore: 85,
    bikeScore: 82,
    walkabilityCategory: 'Very Walkable',
    pedestrianInfrastructure: 88,
    streetConnectivity: 85,
    landUseMix: 80,
    transitCategory: 'Very Good',
    distanceToNearestTransit: 250,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: true,
      commuter: false,
    },
    transitFrequency: 82,
    bikeInfrastructure: 80,
    bikeLaneKm: 22,
    bikeParkingSpots: 380,
    bikeShareStations: 6,
    carDependency: 18,
    driversPerHousehold: 0.95,
    transitUsageRate: 52,
    carCommutingRate: 38,
    commuteEstimates: {
      toCityCenter: 15,
      toDowntown: 18,
      toAirport: 25,
      byCarToCityCenter: 12,
    },
    avgCommuteTime: 35,
    multimodalAccessibility: 85,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  'vancouver-downtown-bc': {
    neighborhoodId: 'vancouver-downtown-bc',
    neighborhoodName: 'Downtown Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    walkScore: 95,
    transitScore: 92,
    bikeScore: 89,
    walkabilityCategory: "Walker's Paradise",
    pedestrianInfrastructure: 94,
    streetConnectivity: 92,
    landUseMix: 91,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 100,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: true,
      commuter: true,
    },
    transitFrequency: 94,
    bikeInfrastructure: 86,
    bikeLaneKm: 28,
    bikeParkingSpots: 620,
    bikeShareStations: 18,
    carDependency: 6,
    driversPerHousehold: 0.35,
    transitUsageRate: 78,
    carCommutingRate: 12,
    commuteEstimates: {
      toCityCenter: 8,
      toDowntown: 5,
      toAirport: 22,
      byCarToCityCenter: 8,
    },
    avgCommuteTime: 28,
    multimodalAccessibility: 93,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  'vancouver-east-bc': {
    neighborhoodId: 'vancouver-east-bc',
    neighborhoodName: 'East Vancouver',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    walkScore: 84,
    transitScore: 88,
    bikeScore: 85,
    walkabilityCategory: 'Very Walkable',
    pedestrianInfrastructure: 85,
    streetConnectivity: 83,
    landUseMix: 82,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 180,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: true,
      commuter: false,
    },
    transitFrequency: 86,
    bikeInfrastructure: 82,
    bikeLaneKm: 25,
    bikeParkingSpots: 320,
    bikeShareStations: 11,
    carDependency: 16,
    driversPerHousehold: 0.78,
    transitUsageRate: 58,
    carCommutingRate: 32,
    commuteEstimates: {
      toCityCenter: 12,
      toDowntown: 15,
      toAirport: 28,
      byCarToCityCenter: 10,
    },
    avgCommuteTime: 32,
    multimodalAccessibility: 87,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  'vancouver-north-shore-bc': {
    neighborhoodId: 'vancouver-north-shore-bc',
    neighborhoodName: 'North Shore',
    cityId: 'vancouver-bc',
    asOfDate: new Date('2026-08-04'),
    walkScore: 72,
    transitScore: 78,
    bikeScore: 75,
    walkabilityCategory: 'Very Walkable',
    pedestrianInfrastructure: 75,
    streetConnectivity: 72,
    landUseMix: 68,
    transitCategory: 'Very Good',
    distanceToNearestTransit: 350,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: false,
      commuter: false,
    },
    transitFrequency: 76,
    bikeInfrastructure: 72,
    bikeLaneKm: 18,
    bikeParkingSpots: 150,
    bikeShareStations: 2,
    carDependency: 35,
    driversPerHousehold: 1.3,
    transitUsageRate: 35,
    carCommutingRate: 55,
    commuteEstimates: {
      toCityCenter: 25,
      toDowntown: 28,
      toAirport: 35,
      byCarToCityCenter: 20,
    },
    avgCommuteTime: 42,
    multimodalAccessibility: 74,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  // ===== MONTREAL WALKABILITY =====

  'montreal-downtown-qc': {
    neighborhoodId: 'montreal-downtown-qc',
    neighborhoodName: 'Downtown Montreal',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    walkScore: 94,
    transitScore: 93,
    bikeScore: 91,
    walkabilityCategory: "Walker's Paradise",
    pedestrianInfrastructure: 93,
    streetConnectivity: 91,
    landUseMix: 89,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 130,
    transitTypes: {
      subway: true,
      bus: true,
      streetcar: false,
      lightRail: false,
      commuter: false,
    },
    transitFrequency: 92,
    bikeInfrastructure: 88,
    bikeLaneKm: 35,
    bikeParkingSpots: 480,
    bikeShareStations: 25,
    carDependency: 9,
    driversPerHousehold: 0.55,
    transitUsageRate: 70,
    carCommutingRate: 16,
    commuteEstimates: {
      toCityCenter: 8,
      toDowntown: 10,
      toAirport: 32,
      byCarToCityCenter: 12,
    },
    avgCommuteTime: 32,
    multimodalAccessibility: 92,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  'montreal-plateau-qc': {
    neighborhoodId: 'montreal-plateau-qc',
    neighborhoodName: 'Plateau-Mont-Royal',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    walkScore: 92,
    transitScore: 91,
    bikeScore: 93,
    walkabilityCategory: "Walker's Paradise",
    pedestrianInfrastructure: 91,
    streetConnectivity: 89,
    landUseMix: 87,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 150,
    transitTypes: {
      subway: true,
      bus: true,
      streetcar: false,
      lightRail: false,
      commuter: false,
    },
    transitFrequency: 90,
    bikeInfrastructure: 91,
    bikeLaneKm: 40,
    bikeParkingSpots: 520,
    bikeShareStations: 30,
    carDependency: 10,
    driversPerHousehold: 0.6,
    transitUsageRate: 68,
    carCommutingRate: 18,
    commuteEstimates: {
      toCityCenter: 12,
      toDowntown: 15,
      toAirport: 35,
      byCarToCityCenter: 14,
    },
    avgCommuteTime: 35,
    multimodalAccessibility: 91,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  'montreal-west-island-qc': {
    neighborhoodId: 'montreal-west-island-qc',
    neighborhoodName: 'West Island',
    cityId: 'montreal-qc',
    asOfDate: new Date('2026-08-04'),
    walkScore: 55,
    transitScore: 62,
    bikeScore: 58,
    walkabilityCategory: 'Somewhat Walkable',
    pedestrianInfrastructure: 58,
    streetConnectivity: 55,
    landUseMix: 52,
    transitCategory: 'Good',
    distanceToNearestTransit: 520,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: false,
      commuter: false,
    },
    transitFrequency: 60,
    bikeInfrastructure: 55,
    bikeLaneKm: 6,
    bikeParkingSpots: 80,
    bikeShareStations: 0,
    carDependency: 68,
    driversPerHousehold: 1.9,
    transitUsageRate: 18,
    carCommutingRate: 78,
    commuteEstimates: {
      toCityCenter: 45,
      toDowntown: 50,
      toAirport: 40,
      byCarToCityCenter: 38,
    },
    avgCommuteTime: 58,
    multimodalAccessibility: 58,
    source: `${DATA_SOURCES.STATCAN}, Walk Score`,
    confidence: 'high',
  },

  // ===== US WALKABILITY (Sample) =====

  'new-york-manhattan-ny': {
    neighborhoodId: 'new-york-manhattan-ny',
    neighborhoodName: 'Manhattan',
    cityId: 'new-york-ny',
    asOfDate: new Date('2026-08-04'),
    walkScore: 96,
    transitScore: 97,
    bikeScore: 92,
    walkabilityCategory: "Walker's Paradise",
    pedestrianInfrastructure: 95,
    streetConnectivity: 94,
    landUseMix: 93,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 100,
    transitTypes: {
      subway: true,
      bus: true,
      streetcar: false,
      lightRail: false,
      commuter: true,
    },
    transitFrequency: 96,
    bikeInfrastructure: 88,
    bikeLaneKm: 45,
    bikeParkingSpots: 1200,
    bikeShareStations: 350,
    carDependency: 4,
    driversPerHousehold: 0.2,
    transitUsageRate: 82,
    carCommutingRate: 8,
    commuteEstimates: {
      toCityCenter: 5,
      toDowntown: 8,
      toAirport: 35,
      byCarToCityCenter: 15,
    },
    avgCommuteTime: 32,
    multimodalAccessibility: 96,
    source: `${DATA_SOURCES.FRED}, Walk Score`,
    confidence: 'high',
  },

  'los-angeles-santa-monica-ca': {
    neighborhoodId: 'los-angeles-santa-monica-ca',
    neighborhoodName: 'Santa Monica',
    cityId: 'los-angeles-ca',
    asOfDate: new Date('2026-08-04'),
    walkScore: 91,
    transitScore: 82,
    bikeScore: 88,
    walkabilityCategory: 'Very Walkable',
    pedestrianInfrastructure: 89,
    streetConnectivity: 87,
    landUseMix: 85,
    transitCategory: 'Very Good',
    distanceToNearestTransit: 200,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: true,
      commuter: false,
    },
    transitFrequency: 80,
    bikeInfrastructure: 85,
    bikeLaneKm: 28,
    bikeParkingSpots: 350,
    bikeShareStations: 12,
    carDependency: 20,
    driversPerHousehold: 1.1,
    transitUsageRate: 42,
    carCommutingRate: 48,
    commuteEstimates: {
      toCityCenter: 22,
      toDowntown: 25,
      toAirport: 35,
      byCarToCityCenter: 18,
    },
    avgCommuteTime: 40,
    multimodalAccessibility: 84,
    source: `${DATA_SOURCES.FRED}, Walk Score`,
    confidence: 'high',
  },

  'san-francisco-downtown-ca': {
    neighborhoodId: 'san-francisco-downtown-ca',
    neighborhoodName: 'SOMA / Downtown',
    cityId: 'san-francisco-ca',
    asOfDate: new Date('2026-08-04'),
    walkScore: 94,
    transitScore: 93,
    bikeScore: 91,
    walkabilityCategory: "Walker's Paradise",
    pedestrianInfrastructure: 92,
    streetConnectivity: 90,
    landUseMix: 88,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 120,
    transitTypes: {
      subway: true,
      bus: true,
      streetcar: true,
      lightRail: false,
      commuter: true,
    },
    transitFrequency: 92,
    bikeInfrastructure: 89,
    bikeLaneKm: 32,
    bikeParkingSpots: 420,
    bikeShareStations: 28,
    carDependency: 8,
    driversPerHousehold: 0.45,
    transitUsageRate: 70,
    carCommutingRate: 14,
    commuteEstimates: {
      toCityCenter: 12,
      toDowntown: 8,
      toAirport: 28,
      byCarToCityCenter: 18,
    },
    avgCommuteTime: 32,
    multimodalAccessibility: 92,
    source: `${DATA_SOURCES.FRED}, Walk Score`,
    confidence: 'high',
  },

  'austin-downtown-tx': {
    neighborhoodId: 'austin-downtown-tx',
    neighborhoodName: 'Downtown Austin',
    cityId: 'austin-tx',
    asOfDate: new Date('2026-08-04'),
    walkScore: 91,
    transitScore: 82,
    bikeScore: 88,
    walkabilityCategory: 'Very Walkable',
    pedestrianInfrastructure: 88,
    streetConnectivity: 85,
    landUseMix: 84,
    transitCategory: 'Very Good',
    distanceToNearestTransit: 220,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: true,
      commuter: false,
    },
    transitFrequency: 80,
    bikeInfrastructure: 86,
    bikeLaneKm: 24,
    bikeParkingSpots: 280,
    bikeShareStations: 15,
    carDependency: 18,
    driversPerHousehold: 0.95,
    transitUsageRate: 48,
    carCommutingRate: 42,
    commuteEstimates: {
      toCityCenter: 10,
      toDowntown: 8,
      toAirport: 18,
      byCarToCityCenter: 8,
    },
    avgCommuteTime: 28,
    multimodalAccessibility: 86,
    source: `${DATA_SOURCES.FRED}, Walk Score`,
    confidence: 'high',
  },

  'denver-downtown-co': {
    neighborhoodId: 'denver-downtown-co',
    neighborhoodName: 'Downtown Denver',
    cityId: 'denver-co',
    asOfDate: new Date('2026-08-04'),
    walkScore: 90,
    transitScore: 88,
    bikeScore: 86,
    walkabilityCategory: 'Very Walkable',
    pedestrianInfrastructure: 88,
    streetConnectivity: 86,
    landUseMix: 83,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 180,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: true,
      commuter: true,
    },
    transitFrequency: 86,
    bikeInfrastructure: 84,
    bikeLaneKm: 22,
    bikeParkingSpots: 250,
    bikeShareStations: 20,
    carDependency: 14,
    driversPerHousehold: 0.85,
    transitUsageRate: 55,
    carCommutingRate: 35,
    commuteEstimates: {
      toCityCenter: 12,
      toDowntown: 8,
      toAirport: 45,
      byCarToCityCenter: 10,
    },
    avgCommuteTime: 32,
    multimodalAccessibility: 88,
    source: `${DATA_SOURCES.FRED}, Walk Score`,
    confidence: 'high',
  },

  'miami-brickell-fl': {
    neighborhoodId: 'miami-brickell-fl',
    neighborhoodName: 'Brickell',
    cityId: 'miami-fl',
    asOfDate: new Date('2026-08-04'),
    walkScore: 89,
    transitScore: 81,
    bikeScore: 78,
    walkabilityCategory: 'Very Walkable',
    pedestrianInfrastructure: 86,
    streetConnectivity: 84,
    landUseMix: 81,
    transitCategory: 'Very Good',
    distanceToNearestTransit: 250,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: true,
      commuter: false,
    },
    transitFrequency: 78,
    bikeInfrastructure: 75,
    bikeLaneKm: 16,
    bikeParkingSpots: 180,
    bikeShareStations: 8,
    carDependency: 22,
    driversPerHousehold: 1.05,
    transitUsageRate: 38,
    carCommutingRate: 52,
    commuteEstimates: {
      toCityCenter: 15,
      toDowntown: 12,
      toAirport: 25,
      byCarToCityCenter: 12,
    },
    avgCommuteTime: 32,
    multimodalAccessibility: 81,
    source: `${DATA_SOURCES.FRED}, Walk Score`,
    confidence: 'high',
  },

  'chicago-loop-il': {
    neighborhoodId: 'chicago-loop-il',
    neighborhoodName: 'The Loop',
    cityId: 'chicago-il',
    asOfDate: new Date('2026-08-04'),
    walkScore: 95,
    transitScore: 94,
    bikeScore: 89,
    walkabilityCategory: "Walker's Paradise",
    pedestrianInfrastructure: 93,
    streetConnectivity: 91,
    landUseMix: 90,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 110,
    transitTypes: {
      subway: true,
      bus: true,
      streetcar: false,
      lightRail: true,
      commuter: true,
    },
    transitFrequency: 93,
    bikeInfrastructure: 86,
    bikeLaneKm: 30,
    bikeParkingSpots: 380,
    bikeShareStations: 45,
    carDependency: 6,
    driversPerHousehold: 0.35,
    transitUsageRate: 75,
    carCommutingRate: 12,
    commuteEstimates: {
      toCityCenter: 5,
      toDowntown: 8,
      toAirport: 38,
      byCarToCityCenter: 12,
    },
    avgCommuteTime: 30,
    multimodalAccessibility: 94,
    source: `${DATA_SOURCES.FRED}, Walk Score`,
    confidence: 'high',
  },

  'seattle-capitol-hill-wa': {
    neighborhoodId: 'seattle-capitol-hill-wa',
    neighborhoodName: 'Capitol Hill',
    cityId: 'seattle-wa',
    asOfDate: new Date('2026-08-04'),
    walkScore: 92,
    transitScore: 90,
    bikeScore: 87,
    walkabilityCategory: "Walker's Paradise",
    pedestrianInfrastructure: 90,
    streetConnectivity: 88,
    landUseMix: 86,
    transitCategory: 'Excellent',
    distanceToNearestTransit: 140,
    transitTypes: {
      subway: false,
      bus: true,
      streetcar: false,
      lightRail: true,
      commuter: false,
    },
    transitFrequency: 88,
    bikeInfrastructure: 85,
    bikeLaneKm: 26,
    bikeParkingSpots: 320,
    bikeShareStations: 22,
    carDependency: 12,
    driversPerHousehold: 0.65,
    transitUsageRate: 60,
    carCommutingRate: 28,
    commuteEstimates: {
      toCityCenter: 15,
      toDowntown: 12,
      toAirport: 32,
      byCarToCityCenter: 14,
    },
    avgCommuteTime: 35,
    multimodalAccessibility: 90,
    source: `${DATA_SOURCES.FRED}, Walk Score`,
    confidence: 'high',
  },
};

/**
 * Fetch walkability and transit scores for a neighborhood
 *
 * @param input Neighborhood ID, city ID, and optional date
 * @returns Walkability and transit metrics
 * @throws Error if neighborhood not found
 */
export function walkabilityTransitScorer(input: WalkabilityInput): WalkabilityOutput {
  const { neighborhoodId, asOfDate } = input;

  const validatedDate = validateDateOrUseToday(asOfDate);

  const mockData = MOCK_DATA[neighborhoodId];
  if (!mockData) {
    throw new Error(`No walkability data available for neighborhood "${neighborhoodId}".`);
  }

  return {
    ...mockData,
    asOfDate: validatedDate,
  };
}

export default walkabilityTransitScorer;
