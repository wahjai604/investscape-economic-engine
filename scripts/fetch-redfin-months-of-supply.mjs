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
 * Fetch real months-of-supply (absorption) per metro from Redfin Data Center.
 *
 * This populates `CityMetrics.absorptionRate` in src/E30-city-market-analysis.ts,
 * whose documented unit is "Months of inventory" — a direct match for Redfin's
 * MONTHS_OF_SUPPLY column. No conversion, no derivation.
 *
 * WHY THIS FILE, AND WHY STREAMING
 * --------------------------------
 * Redfin publishes no per-metro API and no per-metro file. Everything is one
 * bulk gzipped TSV per geography level. Two are relevant:
 *
 *   redfin_covid19/weekly_housing_market_data_most_recent.tsv000.gz  ~830 MB gz
 *   redfin_market_tracker/redfin_metro_market_tracker.tsv000.gz      ~111 MB gz
 *
 * The weekly file is the one to avoid: it is the full historical WEEKLY series
 * for every US region, and downloading it whole reliably times out. The metro
 * market tracker used here is monthly, already aggregated to metro (CBSA)
 * grain, and ~7.4x smaller.
 *
 * Even so, this script never materialises the file. It streams the HTTP
 * response through gunzip, splits lines as they decompress, and keeps only rows
 * matching the 6 target CBSA codes. Peak memory is the decompression buffer
 * plus a few hundred retained rows; peak disk is zero.
 *
 * ROW SELECTION — ALL FOUR FILTERS MATTER
 * ---------------------------------------
 * Redfin publishes many rows per metro per month. Verified against the live
 * file on 2026-09-09, a single metro-month carries rows for 5 property types,
 * AND a seasonally-adjusted twin of each. Selecting on region alone returns
 * whichever duplicate happens to appear first in the file. So we pin all of:
 *   REGION_TYPE = metro, PERIOD_DURATION = 30, PROPERTY_TYPE = All Residential,
 *   IS_SEASONALLY_ADJUSTED = false
 * Dropping the last one is not cosmetic — for Austin it is the difference
 * between the published 5.2 and the adjusted 5.522011601.
 *
 * USAGE
 *   node scripts/fetch-redfin-months-of-supply.mjs [--out path.json]
 *
 * No API key and no account are required — the bucket is public.
 */

import { createGunzip } from 'node:zlib';
import { Readable } from 'node:stream';
import { createInterface } from 'node:readline';
import { METRO_CBSA, METRO_REDFIN_CODE, METRO_IDS, emit } from './metro-cbsa-map.mjs';

const REDFIN_METRO_TSV =
  'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/redfin_metro_market_tracker.tsv000.gz';

// Redfin splits every metro into property-type slices. "All Residential" is the
// headline series Redfin's own Data Center charts use; the others (Single
// Family Residential, Condo/Co-op, Townhouse, Multi-Family) are subsets and
// would each give a different months-of-supply for the same metro.
const PROPERTY_TYPE = 'All Residential';

// Monthly grain. Redfin uses PERIOD_DURATION to mix 30/90/365-day rollups into
// one file; every row is a different denominator, so mixing them would silently
// compare a month against a year. All current target rows are 30, but this is
// asserted rather than assumed so a future rollup can't corrupt the result.
const PERIOD_DURATION = '30';

// Redfin publishes each metric twice: the raw series and a seasonally-adjusted
// one. Both carry the same REGION/PERIOD_END/PROPERTY_TYPE, so without this
// filter the "latest row wins" logic below picks whichever happened to appear
// first in the file — for Austin that is the difference between 5.2 and
// 5.522011601. The raw (non-seasonally-adjusted) series is the one Redfin's own
// Data Center UI reports, so that is what we take.
const IS_SEASONALLY_ADJUSTED = 'false';

/** Redfin quotes text columns; numeric columns are bare. Unquote uniformly. */
function unquote(field) {
  return field.startsWith('"') && field.endsWith('"') ? field.slice(1, -1) : field;
}

/** Redfin encodes missing numerics as an empty field or "NA". */
function parseNumeric(field) {
  const raw = unquote(field).trim();
  if (raw === '' || raw.toUpperCase() === 'NA') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

async function main() {
  // Keyed by Redfin's own region code, which diverges from the CBSA for Dallas
  // (see METRO_REDFIN_CODE). Using METRO_CBSA here would find no Dallas row at
  // all, because Redfin publishes no CBSA-19100 record.
  const wantedCodes = new Set(Object.values(METRO_REDFIN_CODE));

  const response = await fetch(REDFIN_METRO_TSV);
  if (!response.ok || !response.body) {
    throw new Error(`Redfin returned HTTP ${response.status} for ${REDFIN_METRO_TSV}`);
  }
  const fileLastModified = response.headers.get('last-modified');
  const compressedBytes = Number(response.headers.get('content-length')) || null;

  const lines = createInterface({
    input: Readable.fromWeb(response.body).pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  let header = null;
  let col = null;
  let scannedRows = 0;
  let matchedRows = 0;
  // Redfin region code -> best (latest period) row seen so far. Only matched
  // rows are kept, so this stays at a handful of entries regardless of file
  // size. Verified 2026-09-09: 579,544 rows scanned, 1,038 matched
  // (6 metros x 173 months), peak disk zero.
  const best = new Map();

  for await (const line of lines) {
    if (!line) continue;

    if (header === null) {
      header = line.split('\t').map(unquote);
      col = Object.fromEntries(header.map((name, index) => [name, index]));
      const required = [
        'PERIOD_BEGIN',
        'PERIOD_END',
        'PERIOD_DURATION',
        'REGION_TYPE',
        'REGION',
        'IS_SEASONALLY_ADJUSTED',
        'PROPERTY_TYPE',
        'MONTHS_OF_SUPPLY',
        'MEDIAN_DOM',
        'PARENT_METRO_REGION_METRO_CODE',
        'LAST_UPDATED',
      ];
      const missing = required.filter((name) => !(name in col));
      if (missing.length) {
        throw new Error(
          `Redfin schema changed — missing column(s): ${missing.join(', ')}. ` +
            'Refusing to guess column positions.'
        );
      }
      continue;
    }

    scannedRows += 1;

    // Cheap pre-filter before the split: skip the ~99.9% of rows that cannot
    // match. Every target CBSA code appears verbatim in a matching row.
    let candidate = false;
    for (const code of wantedCodes) {
      if (line.includes(code)) {
        candidate = true;
        break;
      }
    }
    if (!candidate) continue;

    const fields = line.split('\t');
    const code = unquote(fields[col.PARENT_METRO_REGION_METRO_CODE] ?? '').trim();
    // Exact match on the code column — the substring pre-filter above is only a
    // superset (e.g. Austin, MN is region 12380, which is not Austin, TX 12420).
    if (!wantedCodes.has(code)) continue;
    if (unquote(fields[col.REGION_TYPE] ?? '') !== 'metro') continue;
    if (unquote(fields[col.PERIOD_DURATION] ?? '').trim() !== PERIOD_DURATION) continue;
    if (
      unquote(fields[col.IS_SEASONALLY_ADJUSTED] ?? '').trim().toLowerCase() !==
      IS_SEASONALLY_ADJUSTED
    ) {
      continue;
    }
    if (unquote(fields[col.PROPERTY_TYPE] ?? '') !== PROPERTY_TYPE) continue;

    matchedRows += 1;

    const periodEnd = unquote(fields[col.PERIOD_END] ?? '');
    const monthsOfSupply = parseNumeric(fields[col.MONTHS_OF_SUPPLY] ?? '');
    if (monthsOfSupply === null) continue;

    const previous = best.get(code);
    if (previous && previous.periodEnd >= periodEnd) continue;

    best.set(code, {
      periodBegin: unquote(fields[col.PERIOD_BEGIN] ?? ''),
      periodEnd,
      region: unquote(fields[col.REGION] ?? ''),
      propertyType: PROPERTY_TYPE,
      periodDuration: Number(PERIOD_DURATION),
      seasonallyAdjusted: false,
      monthsOfSupply,
      // Carried for cross-checking against the FRED days-on-market figure.
      // Redfin's MEDIAN_DOM is a different vendor's measure of a different
      // month; it is intentionally NOT used to populate daysOnMarket.
      redfinMedianDom: parseNumeric(fields[col.MEDIAN_DOM] ?? ''),
      lastUpdated: unquote(fields[col.LAST_UPDATED] ?? ''),
    });
  }

  const metros = METRO_IDS.map((cityId) => {
    const cbsa = METRO_CBSA[cityId];
    const redfinCode = METRO_REDFIN_CODE[cityId];
    const row = best.get(redfinCode);
    if (!row) {
      return {
        cityId,
        cbsa,
        redfinCode,
        ok: false,
        error:
          `no non-seasonally-adjusted 30-day "${PROPERTY_TYPE}" metro row with a ` +
          `MONTHS_OF_SUPPLY value found for Redfin region code ${redfinCode}`,
      };
    }
    return {
      cityId,
      cbsa,
      redfinCode,
      // Flags the Dallas case, where Redfin's region is narrower than the CBSA
      // the rest of the E30 record is built from.
      matchesCbsa: redfinCode === cbsa,
      ok: true,
      ...row,
    };
  });

  await emit(
    {
      dataset: 'Redfin Data Center — metro market tracker (MONTHS_OF_SUPPLY)',
      provider: 'Redfin Corporation',
      endpoint: REDFIN_METRO_TSV,
      fileLastModified,
      compressedBytes,
      retrievedAt: new Date().toISOString(),
      scannedRows,
      matchedRows,
      metros,
    },
    process.argv
  );

  if (metros.some((row) => !row.ok)) process.exitCode = 1;
}

await main();
