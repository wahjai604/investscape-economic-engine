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
 * Shared cityId -> CBSA (Core Based Statistical Area) code map.
 *
 * These are the only metros in E30 whose price/rent/population figures come
 * from live public feeds (Zillow ZHVI/ZORI + Census ACS). The CBSA codes below
 * are the same ones already cited in src/E30-city-market-analysis.ts comments
 * and were used against the Census ACS API.
 *
 * NOTE ON CBSA NAMES: the OMB renamed several of these areas in the 2023
 * delineation (e.g. 26420 "Houston-The Woodlands-Sugar Land" ->
 * "Houston-Pasadena-The Woodlands"). Upstream providers adopt the new names on
 * their own schedules, so the *code* is the join key — never the name string.
 */
export const METRO_CBSA = Object.freeze({
  'houston-tx': '26420',
  'austin-tx': '12420',
  'phoenix-az': '38060',
  'dallas-tx': '19100',
  'san-antonio-tx': '41700',
  'tucson-az': '46060',
});

/** Metros in a stable, reportable order. */
export const METRO_IDS = Object.freeze(Object.keys(METRO_CBSA));

/**
 * cityId -> the region code Redfin actually publishes under, which is NOT
 * always the CBSA code above.
 *
 * Verified by streaming redfin_metro_market_tracker.tsv000.gz on 2026-09-09 and
 * listing every `REGION_TYPE = metro` row for these areas. Five of six match
 * their CBSA exactly. Dallas does not:
 *
 *   Redfin has no row for CBSA 19100 (Dallas-Fort Worth-Arlington). It splits
 *   DFW along the OMB Metropolitan Division boundary into two separate regions —
 *   "Dallas, TX metro area" (19124, Dallas-Plano-Irving MD) and "Fort Worth, TX
 *   metro area" (23104, Fort Worth-Arlington-Grapevine MD). We take 19124,
 *   because the E30 record is named Dallas and 19124 is what Redfin itself
 *   labels "Dallas". This is a genuine geographic narrowing versus the other
 *   fields on that record (Zillow price/rent and Census population are
 *   DFW-wide, 19100), and is called out in the E30 comment for dallas-tx.
 *   It is NOT silently papered over: the alternative was inventing a
 *   DFW-wide months-of-supply by blending two divisions, which Redfin does not
 *   publish and we will not synthesise.
 */
export const METRO_REDFIN_CODE = Object.freeze({
  'houston-tx': '26420',
  'austin-tx': '12420',
  'phoenix-az': '38060',
  'dallas-tx': '19124',
  'san-antonio-tx': '41700',
  'tucson-az': '46060',
});

/**
 * Write a JSON payload to stdout, and optionally to a file via `--out <path>`.
 * Keeps every script's output shape identical and machine-diffable.
 */
export async function emit(payload, argv) {
  const json = JSON.stringify(payload, null, 2);
  const outIndex = argv.indexOf('--out');
  if (outIndex !== -1 && argv[outIndex + 1]) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(argv[outIndex + 1], `${json}\n`, 'utf8');
  }
  process.stdout.write(`${json}\n`);
}
