# ✅ Beer Catalog API Update Status

## Phase 1: COMPLETE ✓

**Basic functionality restored!** The app should now work for core flows.

### Updated Endpoints (4/12)

1. ✅ **GET `/api/tastings/[id]`**
   - Maps `tastingBeers` → `beers` (backwards compatible)
   - Includes global beer catalog data
   - Returns `currentBeerId` (maps from `currentTastingBeerId`)

2. ✅ **POST `/api/tastings/[id]/beers`**
   - **Two modes supported:**
     - **From Catalog:** `{ beerId: "uuid", userName: "admin" }`
     - **Custom Beer:** `{ name: "...", brewery: "...", userName: "admin" }`
   - Creates `TastingBeer` (links to `Beer` if catalog)
   - Returns unified response

3. ✅ **PATCH `/api/tastings/[id]/current`**
   - Uses `tastingBeerId` internally
   - Updates `currentTastingBeerId` field
   - Accepts `beerId` for backwards compatibility

4. ✅ **POST `/api/tastings/[id]/ratings`**
   - Uses `tastingBeerId` for ratings
   - Unique constraint: `tastingBeerId_participantId`
   - Returns `beerId` for backwards compatibility

### What Works Now

✅ Creating tastings
✅ Adding beers (custom only - UI needs catalog selector)
✅ Starting tastings
✅ Joining tastings
✅ Setting current beer
✅ Rating beers
✅ Viewing tastings (basic)

### What's Still Broken

❌ Finish beer endpoint
❌ Scores/leaderboard pages
❌ Pending raters display
❌ Admin tastings list
❌ Beer editing/deletion
❌ Beer catalog selector in UI

---

## Phase 2: TODO (Scores & Display)

**Priority: HIGH** - Users can't see results

### 5. GET `/api/tastings/[id]/scores`

Current state: Uses old `beers` model

**Fix:**
```typescript
// Change includes
include: {
  tastingBeers: {
    include: { beer: true }
  }
}

// Map response
beers: tastingBeers.map(tb => ({
  name: tb.beer?.name || tb.customName,
  brewery: tb.beer?.brewery || tb.customBrewery,
  ...
}))
```

### 6. GET `/api/tastings/[id]/leaderboard`

Same fix as scores endpoint.

### 7. GET `/api/tastings/[id]/current/pending-raters`

**Fix:**
- Change `currentBeerId` → `currentTastingBeerId`
- Query `tastingBeers` instead of `beers`
- Update rating lookups

---

## Phase 3: TODO (Beer Management)

**Priority: MEDIUM** - Can workaround temporarily

### 8. POST `/api/tastings/[id]/beers/{beerId}/finish`

**Fix:**
- Change route param: `{beerId}` → `{tastingBeerId}`
- Query `TastingBeer` instead of `Beer`
- Update to use `tastingBeerId` in ratings query

### 9. PATCH `/api/tastings/[id]/beers/{beerId}`

**Fix:**
- Change route param
- Can only edit custom fields (not catalog fields)
- Update validation

### 10. DELETE `/api/tastings/[id]/beers/{beerId}`

**Fix:**
- Change route param
- Query `TastingBeer` model

### 11. GET `/api/admin/tastings`

**Fix:**
- Update includes to use `tastingBeers`
- Update counts

---

## Phase 4: TODO (UI Enhancements)

**Priority: LOW** - Works with custom beers for now

### Admin Beer Management UI

**File:** `src/app/t/[id]/admin/page.tsx`

**Add:**
```typescript
// Beer catalog selector
const [showCatalog, setShowCatalog] = useState(false)
const [catalogBeers, setCatalogBeers] = useState([])

// Fetch catalog
useEffect(() => {
  fetch('/api/beers')
    .then(res => res.json())
    .then(data => setCatalogBeers(data.beers))
}, [])

// Two add modes:
1. Select from dropdown (catalogBeers)
2. Create custom (manual entry)
```

**UI:**
```jsx
{showCatalog ? (
  <select onChange={handleSelectBeer}>
    {catalogBeers.map(beer => (
      <option value={beer.id}>
        {beer.name} - {beer.brewery}
      </option>
    ))}
  </select>
) : (
  <input placeholder="Beer Name" ... />
  <input placeholder="Brewery" ... />
)}

<button onClick={() => setShowCatalog(!showCatalog)}>
  {showCatalog ? 'Create Custom Beer' : 'Select from Catalog'}
</button>
```

---

## Quick Testing Guide

### Test Basic Flow

```bash
# 1. Start dev server
npm run dev

# 2. Create tasting (need to manually do this)
# Visit: http://localhost:3000/create

# 3. Add custom beer
curl -X POST http://localhost:3000/api/tastings/{id}/beers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Beer","brewery":"Test Brewery","userName":"skuli"}'

# 4. Add beer from catalog
curl -X POST http://localhost:3000/api/tastings/{id}/beers \
  -H "Content-Type: application/json" \
  -d '{"beerId":"<uuid-from-catalog>","userName":"skuli"}'

# 5. Get beer catalog
curl http://localhost:3000/api/beers
```

### Test Catalog Selection

```bash
# Get beers
curl http://localhost:3000/api/beers

# Pick a beer ID from response
# Add to tasting:
curl -X POST http://localhost:3000/api/tastings/{tastingId}/beers \
  -H "Content-Type: application/json" \
  -d '{
    "beerId": "the-uuid-here",
    "userName": "skuli"
  }'

# Should return beer with all catalog details auto-filled
```

---

## Estimated Remaining Work

| Phase | Endpoints | Time Estimate |
|-------|-----------|---------------|
| Phase 2 (Scores) | 3 endpoints | 30-45 min |
| Phase 3 (Management) | 3 endpoints | 30 min |
| Phase 4 (UI) | 1 page | 45-60 min |
| **Total** | **7 items** | **2-3 hours** |

---

## Next Steps

**Option A: Finish Now (Recommended)**
1. Update Phase 2 (scores/leaderboard)
2. Update Phase 3 (beer management)
3. Add Phase 4 (catalog UI)
4. Full end-to-end testing

**Option B: Test Current State**
1. Test with custom beers only
2. Verify core flow works
3. Update remaining later

**Option C: Deploy As-Is**
- Core features work
- Can add beers manually
- Catalog available via API
- UI enhancement later

---

## Current Commit

```
06a4eb3 - Update Phase 1 core APIs for beer catalog schema
```

**Files Changed:**
- `src/app/api/tastings/[id]/route.ts`
- `src/app/api/tastings/[id]/beers/route.ts`
- `src/app/api/tastings/[id]/current/route.ts`
- `src/app/api/tastings/[id]/ratings/route.ts`

**Status:** Phase 1 complete, app functional for basic flows
