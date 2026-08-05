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
