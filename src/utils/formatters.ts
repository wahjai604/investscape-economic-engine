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
 * Formatting utilities for economic data
 */

export function formatPercentage(value: number | null, decimals = 1): string {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatCurrency(value: number, currency = 'CAD'): string {
  const formatter = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
