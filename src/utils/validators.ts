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

import { REGIONS, CONFIDENCE_LEVELS } from './constants';

export function isValidRegionId(regionId: string): boolean {
  return Object.values(REGIONS).includes(regionId as any);
}

export function isValidConfidence(confidence: string): boolean {
  return Object.values(CONFIDENCE_LEVELS).includes(confidence as any);
}

export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function validateRegionId(regionId: string): void {
  if (!isValidRegionId(regionId)) {
    throw new Error(`Invalid region ID: "${regionId}". Must be one of: ${Object.values(REGIONS).join(', ')}`);
  }
}

export function validateDateOrUseToday(date?: Date): Date {
  if (!date) {
    return new Date();
  }
  if (!isValidDate(date)) {
    throw new Error(`Invalid date: ${date}`);
  }
  return date;
}
