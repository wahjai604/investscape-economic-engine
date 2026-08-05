/**
 * InvestScape Economic Engine (E29-E45)
 *
 * This is the public API for all economic data engines.
 * Engines provide regional macro context, city analysis, neighborhood demographics,
 * comparable sales, rental data, and predictive models.
 *
 * Built on: Statistics Canada, Federal Reserve FRED, CMHC, CREA, Zillow, Google Places
 */

// Re-export types
export * from './types';

// Export engines (as we build them)
export { regionalMacroContext } from './E29-regional-macro-context';
export { cityMarketAnalysis } from './E30-city-market-analysis';
export { neighborhoodDemographics } from './E31-neighborhood-demographics';
export { comparableSalesAnalysis } from './E32-comparable-sales-analysis';
export { rentalCompEngine } from './E33-rental-comp-engine';
export { schoolRatingEngine } from './E34-school-rating-engine';
export { walkabilityTransitScorer } from './E35-walkability-transit-scorer';
export { crimeSafetyEngine } from './E36-crime-safety-engine';
export { marketVelocityAnalyzer } from './E37-market-velocity-analyzer';
// ... E38-E45 will be exported here as built

// Re-export utilities
export { isValidRegionId, validateRegionId, validateDateOrUseToday } from './utils/validators';
export { formatPercentage, formatCurrency, formatNumber, formatDate } from './utils/formatters';
export { REGIONS, REGION_NAMES, REGION_DETAILS, CONFIDENCE_LEVELS, DATA_FRESHNESS_TTL, DATA_SOURCES, CANADIAN_REGIONS, US_REGIONS } from './utils/constants';
