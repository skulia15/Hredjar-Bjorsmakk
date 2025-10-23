# 🚀 Future Enhancements

## Beer Catalog - Additional Fields from Vínbúðin

### Current Schema
```prisma
model Beer {
  id          String   @id @default(uuid())
  name        String   ✅
  brewery     String   ✅
  style       String?  ✅
  abv         Float?   ✅
  country     String?  ✅
  imageUrl    String?  ✅
  description String?  ✅
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Proposed Additional Fields

Based on data available on vinbudin.is:

```prisma
model Beer {
  // ... existing fields ...

  // Product Information
  productNumber   String?  // Vínbúðin product/SKU number
  barcode         String?  // EAN/UPC barcode

  // Container Details
  containerSize   Int?     // Volume in ml (330, 500, 750, etc.)
  containerType   String?  // "Can", "Bottle", "Keg"

  // Pricing (optional, may change frequently)
  priceISK        Float?   // Current price in ISK
  pricePerLiter   Float?   // Calculated price per liter

  // Classification
  category        String?  // "Beer", "Craft Beer", etc.
  subcategory     String?  // "IPA", "Lager", "Stout", etc.

  // Production Details
  vintage         Int?     // Year (for special/aged beers)
  manufacturer    String?  // Manufacturer/importer

  // Additional Info
  ingredients     String?  // List of ingredients
  tastingNotes    String?  // Professional tasting notes
  foodPairing     String?  // Suggested food pairings

  // Metadata
  vinbudinUrl     String?  // Direct link to product page
  lastScraped     DateTime? // When data was last updated
  isAvailable     Boolean  @default(true) // Stock availability
}
```

### Implementation Phases

#### Phase 1: Essential Fields (High Priority)
Add fields that enhance user experience without requiring frequent updates:

- ✅ `containerSize` - Important for comparison (330ml vs 500ml)
- ✅ `containerType` - Visual clarity (can vs bottle)
- ✅ `productNumber` - Unique identifier from Vínbúðin
- ✅ `vinbudinUrl` - Direct link to product page
- ✅ `ingredients` - Allergen/preference info

**Why:** Static data, won't change often, adds real value

#### Phase 2: Enhanced Details (Medium Priority)
Add fields for beer enthusiasts:

- ✅ `tastingNotes` - Professional descriptions
- ✅ `foodPairing` - Meal suggestions
- ✅ `vintage` - For special editions
- ✅ `subcategory` - More specific than "style"

**Why:** Enriches the experience but not critical

#### Phase 3: Dynamic Data (Low Priority)
Add fields that require regular updates:

- ⚠️ `priceISK` - Changes frequently
- ⚠️ `isAvailable` - Stock status
- ⚠️ `lastScraped` - Tracking freshness

**Why:** Needs automated scraping infrastructure

---

## Automatic Data Scraping

### Current State
- ✅ Manual seed script with 17 beers
- ✅ Data based on common knowledge of Icelandic beers

### Future: Automated Scraping

#### Option 1: Scheduled Scraper
```typescript
// prisma/scrape-vinbudin.ts
async function scrapeChristmasBeers() {
  const url = 'https://www.vinbudin.is/heim/vorur/vorur?season=JÓL&category=beer'

  // Use Playwright/Puppeteer for JS-rendered content
  // Parse product listings
  // Extract: name, brewery, ABV, price, image, etc.
  // Upsert to Beer catalog
}

// Run via cron or GitHub Actions
```

**Frequency:** Daily/Weekly during Christmas season

#### Option 2: API Integration
If Vínbúðin offers an API (currently doesn't appear to):
- Direct data fetch
- Real-time availability
- Price updates

#### Option 3: Hybrid Approach
- Manual curated list (like current)
- Optional automated enrichment
- Admin can review/approve scraped data

### Scraping Implementation Plan

**Step 1: Proof of Concept**
```bash
npm install playwright
# Create scraper for single product
# Test data extraction
```

**Step 2: Full Scraper**
```bash
# Scrape all Christmas beers
# Parse HTML/JS content
# Extract all available fields
# Handle pagination
```

**Step 3: Database Integration**
```typescript
// Upsert logic with conflict resolution
await prisma.beer.upsert({
  where: { productNumber: scraped.productNumber },
  update: {
    // Only update volatile fields (price, availability)
    // Keep manual overrides for name/description
  },
  create: { /* full data */ }
})
```

**Step 4: Automation**
```yaml
# .github/workflows/scrape-beers.yml
name: Update Beer Catalog
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch: # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run scrape:vinbudin
      - run: npm run seed:beers
```

---

## UI Enhancements for Additional Fields

### Beer Card Display
```tsx
<div className="beer-card">
  <img src={beer.imageUrl} alt={beer.name} />
  <h3>{beer.name}</h3>
  <p>{beer.brewery}</p>

  {/* NEW: Container info */}
  <span className="badge">{beer.containerSize}ml {beer.containerType}</span>

  {/* NEW: Price */}
  {beer.priceISK && <span>{beer.priceISK} kr</span>}

  {/* NEW: Tasting notes expandable */}
  {beer.tastingNotes && (
    <details>
      <summary>Tasting Notes</summary>
      <p>{beer.tastingNotes}</p>
    </details>
  )}

  {/* NEW: Food pairing */}
  {beer.foodPairing && <p>Pairs with: {beer.foodPairing}</p>}

  {/* NEW: Link to Vínbúðin */}
  {beer.vinbudinUrl && (
    <a href={beer.vinbudinUrl} target="_blank">
      View on Vínbúðin →
    </a>
  )}
</div>
```

### Advanced Search/Filtering
```tsx
<BeerCatalogSearch
  filters={{
    containerSize: [330, 500, 750],
    priceRange: [0, 5000],
    abvRange: [0, 12],
    availability: true,
    category: 'Christmas Beer'
  }}
/>
```

---

## Data Quality & Maintenance

### Manual Curation
Even with automated scraping:
- Admins can override scraped data
- Manual verification for new beers
- Community contributions for tasting notes

### Deduplication Strategy
```typescript
// Identify duplicates by:
1. productNumber (primary)
2. name + brewery combination
3. barcode/EAN

// Merge strategy:
- Keep newest data for volatile fields (price, availability)
- Prefer manual entries for descriptive fields
- Log conflicts for review
```

### Data Freshness
```sql
-- Add to Beer model
lastScraped    DateTime?
lastVerified   DateTime? -- Manual admin verification
dataSource     String?   -- "manual", "scraper", "api"
```

---

## Migration Path

### Phase 1: Schema Update
```bash
# Add new optional fields to Beer model
npx prisma migrate dev --name add-extended-beer-fields

# All existing beers continue to work (fields are optional)
```

### Phase 2: Backfill Existing Data
```typescript
// Enrich current 17 beers with additional data
// Either manual or initial scrape
```

### Phase 3: Enable Scraper
```bash
npm run scrape:vinbudin
# Adds new beers + enriches existing ones
```

### Phase 4: UI Updates
```typescript
// Update catalog selector to show new fields
// Add advanced filtering
// Display container info, prices, etc.
```

---

## Technical Considerations

### Storage
- Images: Consider CDN or local storage for `imageUrl`
- Text: `description` and `tastingNotes` could be long (use `TEXT` type)
- JSON fields: Consider JSON column for flexible metadata

### Performance
- Index on `productNumber`, `barcode` for fast lookups
- Full-text search on `name`, `brewery`, `tastingNotes`
- Cache catalog list (rarely changes)

### Legal/Ethical
- Respect Vínbúðin's robots.txt
- Rate limiting (max 1 request/second)
- User-Agent header identifying the scraper
- Consider reaching out for official data partnership

---

## Estimated Effort

| Task | Time | Priority |
|------|------|----------|
| Add schema fields | 30 min | High |
| Update seed script | 1 hour | High |
| Build scraper POC | 2-3 hours | Medium |
| Full scraper | 4-6 hours | Medium |
| UI enhancements | 3-4 hours | Low |
| Automation setup | 2 hours | Low |
| Testing & refinement | 4-6 hours | Medium |
| **Total** | **16-22 hours** | - |

---

## Quick Wins (Do These First)

1. **Add `containerSize` and `containerType`** (30 min)
   - Most useful immediately
   - Easy to add to current 17 beers
   - Shows in catalog selector

2. **Add `vinbudinUrl`** (15 min)
   - Direct link to product page
   - Easy to populate manually
   - High value for users

3. **Add `productNumber`** (15 min)
   - Unique identifier
   - Helps prevent duplicates
   - Future-proofs for scraping

**Total Quick Wins: ~1 hour, immediate value**

---

## References

- Vínbúðin Christmas Beers: https://www.vinbudin.is/heim/vorur/vorur?season=JÓL&category=beer
- Current Beer model: `prisma/schema.prisma`
- Current seed script: `prisma/seed-beers.ts`
- Beer catalog API: `src/app/api/beers/route.ts`

---

**Status:** Documented for future implementation
**Next Action:** Decide on Phase 1 fields to add
**Timeline:** To be determined based on priority
