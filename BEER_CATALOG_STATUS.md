# 🍺 Beer Catalog Implementation Status

## ✅ What's Complete

### 1. Data Model Redesign
**New Schema Structure:**
```
Beer (Global Catalog)
  ├── id, name, brewery, style, abv, country, imageUrl, description
  └── tastingBeers[] (many TastingBeer instances)

TastingBeer (Instance in a Tasting)
  ├── id, tastingId, beerId (optional reference to Beer)
  ├── customName, customBrewery, customStyle, customAbv (for custom beers)
  ├── status, orderIndex
  └── ratings[]

Rating
  ├── tastingBeerId (changed from beerId)
  └── participantId
```

**Key Changes:**
- Beers are now global entities reusable across tastings
- TastingBeer represents a beer instance in a specific tasting
- Can select from catalog OR create custom beer on-the-fly
- Ratings link to TastingBeer (not global Beer)
- Tasting.currentBeerId renamed to currentTastingBeerId

### 2. Beer Catalog Seed Data
**Created:** `prisma/seed-beers.ts`
- 20 authentic Icelandic beers
- Christmas beers (Jólabjór) from multiple breweries
- Craft beers from Borg Brugghús, Gæðingur, Einstök, Kaldi, Bríó
- Popular classics (Gull, Thule)
- International beers available in Iceland

**Run with:** `npm run seed:beers`

### 3. Beer Listing API
**Created:** `GET /api/beers`
- Search by name or brewery
- Filter by style or country
- Returns unique styles and countries for UI filters
- Limit parameter (default 100)

Example:
```bash
GET /api/beers?search=jóla&style=Christmas%20Ale&limit=10
```

### 4. Package Script
Added to package.json:
```json
"seed:beers": "tsx prisma/seed-beers.ts"
```

---

## ⚠️ Breaking Changes - Requires Migration

### Database Schema Changes
The schema has been fundamentally restructured. **This is a breaking change.**

**What Happens:**
1. Existing `Beer` table will be renamed to `TastingBeer`
2. New `Beer` table created for global catalog
3. Foreign key `beerId` in Rating changes to `tastingBeerId`
4. Field `Tasting.currentBeerId` renames to `currentTastingBeerId`

**Impact:**
- All existing tastings will lose beer associations (if any exist)
- All existing ratings will be deleted
- Fresh start required

**Migration Steps:**
```bash
# 1. Generate Prisma client with new schema
npx prisma generate

# 2. Create and apply migration (destructive!)
npx prisma migrate dev --name add-beer-catalog

# 3. Seed the beer catalog
npm run seed:beers

# 4. Optionally seed dev data (will use new schema)
npm run seed:dev
```

---

## 🚧 What Needs to Be Updated

### API Endpoints (All references to Beer → TastingBeer)
**Priority: HIGH - App will break without these**

1. ✅ `GET /api/beers` - Already created
2. ❌ `POST /api/tastings/{id}/beers` - Update to:
   - Accept `beerId` (from catalog) OR custom fields
   - Create TastingBeer referencing Beer if beerId provided
   - Create TastingBeer with custom fields if no beerId
3. ❌ `PATCH /api/tastings/{id}/beers/{beerId}` - Change to `{tastingBeerId}`
4. ❌ `DELETE /api/tastings/{id}/beers/{beerId}` - Change to `{tastingBeerId}`
5. ❌ `PATCH /api/tastings/{id}/current` - Update to use `currentTastingBeerId`
6. ❌ `POST /api/tastings/{id}/beers/{beerId}/finish` - Change to `{tastingBeerId}`
7. ❌ `GET /api/tastings/{id}` - Update includes to use `tastingBeers`
8. ❌ `GET /api/tastings/{id}/scores` - Update to use `tastingBeers`
9. ❌ `GET /api/tastings/{id}/leaderboard` - Update to use `tastingBeers`
10. ❌ `POST /api/tastings/{id}/ratings` - Update to use `tastingBeerId`
11. ❌ `GET /api/tastings/{id}/current/pending-raters` - Update references
12. ❌ `GET /api/admin/tastings` - Update to use `tastingBeers`

### UI Components & Pages
1. ❌ `/t/{id}/admin` - Admin UI:
   - Add beer selector (dropdown/autocomplete from catalog)
   - "Or create custom beer" option
   - Update all beer management to use tastingBeerId
2. ❌ `/t/{id}/rate` - Update beer display
3. ❌ `/t/{id}/scores` - Update beer references
4. ❌ All components using beer data

### Validation Schemas
1. ❌ `src/lib/validation.ts` - Update schemas:
   - Add `addTastingBeerSchema` (with beerId OR custom fields)
   - Update rating schema to use `tastingBeerId`

---

## 📋 Recommended Implementation Order

### Phase 1: Database Migration (Now)
```bash
npx prisma generate
npx prisma migrate dev --name add-beer-catalog
npm run seed:beers
```

### Phase 2: Core API Updates
1. Update validation schemas
2. Update `POST /api/tastings/{id}/beers` endpoint
3. Update `GET /api/tastings/{id}` endpoint
4. Update `PATCH /api/tastings/{id}/current` endpoint
5. Update `POST /api/tastings/{id}/ratings` endpoint

### Phase 3: Secondary API Updates
6. Update beer finish endpoint
7. Update scores/leaderboard endpoints
8. Update pending raters endpoint
9. Update admin tastings endpoint

### Phase 4: UI Updates
10. Update admin beer management UI
11. Add beer catalog selector
12. Update rating page
13. Update scores page

### Phase 5: Additional Changes (User Request)
14. Make tasting creation admin-only
15. Remove name entry from tasting creation
16. Auto-link admin user as creator

---

## 🎯 New User Flow: Adding Beers

### Before (Old System):
1. Leader enters beer name, brewery, style, ABV manually
2. Beer created unique to that tasting

### After (New System):
1. Leader opens "Add Beer" interface
2. Sees autocomplete dropdown with 20+ beers from catalog
3. Options:
   - **Option A:** Select existing beer (e.g., "Jólabjór - Borg Brugghús")
     - One click, all details auto-filled
   - **Option B:** Create custom beer
     - Enter name, brewery, style, ABV manually
     - Stored as custom TastingBeer (not added to global catalog)

### Benefits:
- Faster beer entry (select from catalog)
- Consistent naming across tastings
- Same beer can be rated in multiple tastings
- Still allows custom/rare beers

---

## 📊 Current Statistics

**Schema:**
- 6 models → 7 models (added Beer catalog)
- New unique constraint: `@@unique([name, brewery])` on Beer
- TastingBeer can be custom OR reference catalog

**Beer Catalog:**
- 20 Icelandic beers seeded
- Covers major breweries
- Includes Christmas specialties
- Mix of craft and mainstream

**API Endpoints:**
- 1 new endpoint: `GET /api/beers`
- 12 endpoints need updates

---

## ⚡ Quick Start (After Migration)

```bash
# 1. Apply migration
npx prisma generate
npx prisma migrate dev --name add-beer-catalog

# 2. Seed beer catalog
npm run seed:beers

# 3. Verify
npx prisma studio
# Check "Beer" table - should have 20 beers

# 4. Test API
curl http://localhost:3000/api/beers?search=jóla

# Output: All Christmas beers (Jólabjór, Jólasúð, etc.)
```

---

## 🚨 Important Notes

1. **Migration is destructive** - Existing tastings/ratings will be lost
2. **All API endpoints must be updated** before app works again
3. **Beer catalog is Iceland-focused** - aligned with vinbudin.is
4. **Custom beers still supported** - not forced to use catalog
5. **Automatic scraping postponed** - manual seed for now, automated scraping in future versions

---

## 📝 Next Steps

**Immediate:**
1. Run migration (destructive)
2. Update API endpoints (required for app to work)
3. Update UI components

**Future Enhancements:**
1. Web scraper for vinbudin.is Christmas beers
2. Automatic catalog updates
3. Image uploads for beers
4. User-contributed beers to catalog
5. Rating aggregation across all tastings for same beer

---

**Status:** Schema ready, migration pending, API updates required
**Estimated Work:** ~2-3 hours for all API and UI updates
**Risk Level:** Medium (breaking changes, but dev environment)
