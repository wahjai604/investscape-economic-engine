# @investscape/economic-engine

## 🔒 Licensing & Intellectual Property

**InvestScape™ Economic Engine** is proprietary software © 2026 Lighthouse Research Ltd.  
**InvestScape™** is a registered trademark of Lighthouse Research Ltd.

### License Summary

| Use Case | Status | License | Fee |
|----------|--------|---------|-----|
| **Personal real estate analysis** | ✅ Allowed | Proprietary License | None |
| **Educational/learning** | ✅ Allowed | Proprietary License | None |
| **Internal business analysis** | ✅ Allowed | Proprietary License | None |
| **Commercial product embedding** | ❌ Prohibited | Requires Commercial License | Case-by-case negotiation |
| **SaaS/service offering** | ❌ Prohibited | Requires Commercial License | Case-by-case negotiation |
| **Redistribution/resale** | ❌ Prohibited | Not permitted | N/A |

**For full license terms, see `LICENSE` and `CONTRIBUTING.md`.**

### Commercial Licensing

If your organization wishes to use InvestScape™ Calculation Engines in a commercial product or service:

1. **Contact:** eric@lighthouseresearch.ca
2. **Subject line:** `[COMMERCIAL LICENSE INQUIRY] — [Your Organization Name]`
3. **Include:**
   - Organization name and industry
   - Intended commercial use
   - Target customer base
   - Estimated revenue/impact
   - Timeline for implementation

**Note:** Commercial licensing is evaluated **case-by-case.** No standard pricing. Substantial business justification required.

### Trademark Use

The name **InvestScape™** and associated trademark symbols (™, ®) are protected intellectual property. You may:
- ✅ Refer to "InvestScape™" when describing the software in non-commercial contexts
- ✅ Use the trademark when attributing calculation results (e.g., "Powered by InvestScape™")

You may NOT:
- ❌ Use the InvestScape™ name or logo to suggest endorsement or partnership
- ❌ Register similar domains or social media accounts using "InvestScape"
- ❌ Use the trademark in a commercial product without permission

---

Economic data engines (E29-E45) for InvestScape. Provides regional macro context, city market analysis, neighborhood demographics, comparable sales, rental data, and predictive models.

## Installation

```bash
npm install @investscape/economic-engine
```

## Engines (E29-E45)

### Build Status
- [ ] E29: Regional Macro Context
- [ ] E30: City-Level Market Analysis
- [ ] E31: Neighborhood Demographics
- [ ] E32: Comparable Sales Analysis
- [ ] E33: Rental Comp Engine
- [ ] E34: School Rating & Education
- [ ] E35: Walkability & Transit Scorer
- [ ] E36: Crime & Safety (TBD — pending legal review)
- [ ] E37: Market Velocity Analyzer
- [ ] E38: Macro-to-Micro Sensitivity
- [ ] E39: Mortgage Rate Forecast
- [ ] E40: Appreciation Probability
- [ ] E41: Market Cycle Indicator
- [ ] E42: Neighborhood Investment Score
- [ ] E43: Portfolio Geographic Diversification
- [ ] E44: Currency Risk Exposure
- [ ] E45: Scenario Batch Processor

## Usage

```typescript
import { regionalMacroContext } from '@investscape/economic-engine';

const metrics = regionalMacroContext({
  regionId: 'western-canada',
  regionName: 'Western Canada',
});

console.log(metrics.gdpGrowth, metrics.avgCapRate);
```

## Data Sources

- **Statistics Canada**: GDP, inflation, employment, construction starts, demographics
- **Federal Reserve FRED**: US economic indicators
- **Bank of Canada**: Mortgage rates
- **CMHC**: Housing data, rental market
- **CREA**: Canadian real estate market data
- **Zillow API**: US home values, rental estimates
- **Google Places API**: Schools, amenities, walkability
- **Walk Score**: Pedestrian/transit/bike scores

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch

# Build
npm run build

# Coverage
npm run test:coverage
```

## Architecture

This package is part of the InvestScape ecosystem:

- **investscape-calc-engine**: Financial calculation engines (E1-E28)
- **investscape-economic-engine**: Economic data engines (E29-E45) ← YOU ARE HERE
- **investscape-api**: Gateway layer that orchestrates both

## Status

- ✅ Phase: Bootstrap complete
- 🔄 Phase: E29-E45 build sequence (Week 3-8)
- 🚀 Phase: API integration (Week 9+)

## License

MIT
