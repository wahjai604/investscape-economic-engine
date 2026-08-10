# InvestScape Economic Engine

**Repository:** https://github.com/wahjai604/investscape-economic-engine
**License:** Proprietary (Closed-Source) — see [LICENSE](LICENSE)
**Copyright:** © 2026 Lighthouse Research Ltd.

## Purpose

Economic and market-data engines for InvestScape: regional macro context, city-level market analysis, neighborhood demographics, comparable sales, rental comps, and forward-looking market/scenario models.

## Scope

17 engines, **E29–E45**:

| Engine | Description |
|---|---|
| E29 | Regional macro context |
| E30 | City-level market analysis |
| E31 | Neighborhood demographics |
| E32 | Comparable sales analysis |
| E33 | Rental comp engine |
| E34 | School rating & education |
| E35 | Walkability & transit scorer |
| E36 | Crime & safety engine |
| E37 | Market velocity analyzer |
| E38 | Macro-to-micro sensitivity |
| E39 | Mortgage rate forecast |
| E40 | Appreciation probability |
| E41 | Market cycle indicator |
| E42 | Neighborhood investment score |
| E43 | Portfolio geographic diversification |
| E44 | Currency risk exposure |
| E45 | Scenario batch processor |

All 17 engines are implemented, exported from `src/index.ts`, and covered by tests. Note: E36 is implemented here but is **not currently exposed** through `investscape-api`'s HTTP endpoints, pending legal review at the API layer.

**Jurisdictions:** Canada (all provinces/territories, grouped into 5 regions) and US (all four Census regions). City-level data (E30) includes specific hardcoded cities across both countries — see `src/E30-city-market-analysis.ts` for the exact list.

This package depends on `@investscape/calc-engine`.

## Testing

- **Test suites:** 17
- **Test cases:** 318
- **Passing:** 318/318 (100%)
- **Coverage** (via `npm run test:coverage`): 89.92% statements, 76.91% branches, 97.17% functions, 95.54% lines. `jest.config.js` sets an 80% coverage threshold on all four metrics; **branch coverage (76.91%) currently fails that gate**, so `npm run test:coverage` exits non-zero even though all tests pass. Weakest spots: `src/utils/formatters.ts` (0% covered) and lower branch coverage in E42–E45.

```bash
npm test
```

## Installation

For authorized users only. Usage requires a valid InvestScape tier (S1–S3).

```bash
npm install
npm test
```

## Architecture

This package is part of the InvestScape ecosystem:

- **investscape-calc-engine** — financial calculation engines, E1–E28
- **investscape-economic-engine** — economic data engines, E29–E45 (this repo)
- **investscape-api** — HTTP wrapper layer that orchestrates both

## Documentation

Reference documentation: https://github.com/wahjai604/investscape-docs

## License & Disclaimer

This software is closed-source proprietary code. Authorized users only.

For legal disclaimers, see [DISCLAIMER.md](DISCLAIMER.md).

---

© 2026 Lighthouse Research Ltd. All rights reserved.
