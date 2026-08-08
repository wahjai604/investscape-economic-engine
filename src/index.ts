/**
 * InvestScape™ Calculation Engine
 * © 2026 Lighthouse Research Ltd. All rights reserved.
 *
 * InvestScape™ is a registered trademark of Lighthouse Research Ltd.
 * This software is proprietary and confidential.
 *
 * LICENSING:
 * - Personal/Educational Use: Permitted (see LICENSE)
 * - Commercial Use: Requires written Commercial License Agreement
 * Contact: wahjai604@gmail.com
 *
 * DISCLAIMER:
 * This software is provided "as-is" for informational purposes only.
 * Not investment advice, tax advice, or financial advice.
 * Use at your own risk.
 */

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
export { macroMicroSensitivity } from './E38-macro-micro-sensitivity';
export { mortgageRateForecast } from './E39-mortgage-rate-forecast';
export { appreciationProbability } from './E40-appreciation-probability';
export { marketCycleIndicator } from './E41-market-cycle-indicator';
export { neighborhoodInvestmentScore } from './E42-neighborhood-investment-score';
export { portfolioGeographicDiversification } from './E43-portfolio-geographic-diversification';
export { currencyRiskExposure } from './E44-currency-risk-exposure';
export { scenarioBatchProcessor } from './E45-scenario-batch-processor';

// Re-export utilities
export { isValidRegionId, validateRegionId, validateDateOrUseToday } from './utils/validators';
export { formatPercentage, formatCurrency, formatNumber, formatDate } from './utils/formatters';
export { REGIONS, REGION_NAMES, REGION_DETAILS, CONFIDENCE_LEVELS, DATA_FRESHNESS_TTL, DATA_SOURCES, CANADIAN_REGIONS, US_REGIONS } from './utils/constants';
