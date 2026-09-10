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
 */

/**
 * Fetch real median days-on-market per metro from FRED.
 *
 * Source series: MEDDAYONMAR<CBSA> — "Housing Inventory: Median Days on Market
 * in <CBSA name>", monthly, not seasonally adjusted. FRED republishes this from
 * Realtor.com's residential listings database; each month is published in the
 * first week of the following month.
 *
 * This populates `CityMetrics.daysOnMarket` in src/E30-city-market-analysis.ts.
 *
 * The script VERIFIES the series exists (via /fred/series) before reading any
 * observation, and reports per-metro failures instead of substituting a guess.
 * A metro that errors out contributes nothing — an empty field is correct, a
 * plausible-looking number is a defect.
 *
 * USAGE
 *   node scripts/fetch-fred-days-on-market.mjs [--out path.json]
 *
 * REQUIRES
 *   FRED_API_KEY, from the process environment or from `.env` at the repo root.
 *   `.env` is gitignored. The key is NEVER printed: request URLs are redacted
 *   before they reach stdout/stderr, and the key is not part of the output.
 *   Get a free key at https://fredaccount.stlouisfed.org/apikeys
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { METRO_CBSA, METRO_IDS, emit } from './metro-cbsa-map.mjs';

const FRED_BASE = 'https://api.stlouisfed.org/fred';
const REPO_ROOT = join(import.meta.dirname, '..');

/**
 * Resolve the FRED key from the environment, falling back to a `.env` file.
 * Never logs or returns the key as part of any report payload.
 */
async function resolveApiKey() {
  if (process.env.FRED_API_KEY) return process.env.FRED_API_KEY.trim();

  let envFile;
  try {
    envFile = await readFile(join(REPO_ROOT, '.env'), 'utf8');
  } catch {
    throw new Error(
      'FRED_API_KEY not set and no .env file found at the repo root. ' +
        'Get a free key at https://fredaccount.stlouisfed.org/apikeys and add ' +
        'FRED_API_KEY=... to .env (which is gitignored).'
    );
  }

  for (const line of envFile.split(/\r?\n/)) {
    const match = /^\s*FRED_API_KEY\s*=\s*(.+?)\s*$/.exec(line);
    if (match) return match[1].replace(/^["']|["']$/g, '');
  }
  throw new Error('FRED_API_KEY not present in .env.');
}

/** Strip the API key out of anything that might be surfaced to a human. */
function redact(text, apiKey) {
  return String(text).split(apiKey).join('[REDACTED]');
}

async function fredGet(path, params, apiKey) {
  const url = new URL(`${FRED_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('file_type', 'json');

  const response = await fetch(url);
  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `FRED ${path} returned HTTP ${response.status}: ${redact(body, apiKey).slice(0, 300)}`
    );
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`FRED ${path} returned non-JSON: ${redact(body, apiKey).slice(0, 300)}`);
  }
}

/**
 * Confirm MEDDAYONMAR<cbsa> exists, then read its most recent real observation.
 * FRED encodes missing observations as "." — those are skipped, never coerced
 * to 0.
 */
async function fetchMetro(cityId, cbsa, apiKey) {
  const seriesId = `MEDDAYONMAR${cbsa}`;
  const base = { cityId, cbsa, seriesId };

  const meta = await fredGet('series', { series_id: seriesId }, apiKey);
  const series = meta?.seriess?.[0];
  if (!series) {
    return { ...base, ok: false, error: 'series does not exist on FRED' };
  }

  const observations = await fredGet(
    'series/observations',
    { series_id: seriesId, sort_order: 'desc', limit: '24' },
    apiKey
  );

  const latest = (observations?.observations ?? []).find((row) => row.value !== '.');
  if (!latest) {
    return { ...base, ok: false, error: 'series exists but has no non-missing observations' };
  }

  const value = Number(latest.value);
  if (!Number.isFinite(value)) {
    return { ...base, ok: false, error: `unparseable observation value ${JSON.stringify(latest.value)}` };
  }

  return {
    ...base,
    ok: true,
    seriesTitle: series.title,
    units: series.units,
    seasonalAdjustment: series.seasonal_adjustment,
    frequency: series.frequency,
    // The observation date is the FIRST day of the month the value describes.
    observationPeriod: latest.date,
    seriesLastUpdated: series.last_updated,
    daysOnMarket: value,
  };
}

async function main() {
  const apiKey = await resolveApiKey();

  const results = [];
  for (const cityId of METRO_IDS) {
    const cbsa = METRO_CBSA[cityId];
    try {
      results.push(await fetchMetro(cityId, cbsa, apiKey));
    } catch (error) {
      results.push({
        cityId,
        cbsa,
        seriesId: `MEDDAYONMAR${cbsa}`,
        ok: false,
        error: redact(error.message, apiKey),
      });
    }
  }

  await emit(
    {
      dataset: 'FRED Housing Inventory: Median Days on Market (MEDDAYONMAR<CBSA>)',
      provider: 'Federal Reserve Bank of St. Louis (FRED), sourced from Realtor.com',
      endpoint: `${FRED_BASE}/series/observations`,
      retrievedAt: new Date().toISOString(),
      metros: results,
    },
    process.argv
  );

  if (results.some((row) => !row.ok)) process.exitCode = 1;
}

await main();
