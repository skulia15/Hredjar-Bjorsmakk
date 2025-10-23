# ✅ Beer Catalog Migration Complete

## What Just Happened

### Database Schema Updated
- **Beer Model:** Now global catalog (17 Icelandic beers)
- **TastingBeer Model:** Instance of beer in a specific tasting
- **Rating Model:** Now links to TastingBeer instead of Beer
- **Tasting Model:** `currentBeerId` → `currentTastingBeerId`

### Migration Applied
```bash
✓ Database reset
✓ New schema pushed with prisma db push
✓ 17 beers seeded into catalog
```

### Beers in Catalog
```
Borg Brugghús: Jólabjór, Úlfur IPA, Garún nr. 19
Gæðingur: Jólasúð, Beljandi IPA
Einstök: Icelandic White Ale, Arctic Pale Ale, Toasted Porter
Kaldi: Jólaöl, Móri
Bríó: Jólahefð, Austri
International: Julebryg (Tuborg), Nisseøl (Nøgne Ø), Juleøl (Mikkeller)
Craft: Lava (Ölvisholt), Bruggsmiðjan Jólabjór
```

---

## ⚠️ Current Status: APP IS BROKEN

**Why:** All API endpoints still reference the old `Beer` model and `beerId` fields.

**What Works:**
- ✅ Database with new schema
- ✅ Beer catalog seeded
- ✅ `GET /api/beers` endpoint (new)
- ✅ Frontend components (unchanged)

**What's Broken:**
- ❌ All tasting APIs (reference old Beer model)
- ❌ All rating APIs (use `beerId` instead of `tastingBeerId`)
- ❌ Admin beer management
- ❌ Beer selection/creation
- ❌ Current beer tracking
- ❌ Beer finish flow
- ❌ Scores/leaderboard

---

## 🔧 Required API Updates

### High Priority (App won't work without these)

**1. POST `/api/tastings/{id}/beers`**
```typescript
// OLD: Accept name, brewery, style, abv → Create Beer
// NEW: Accept beerId OR custom fields → Create TastingBeer

Request (Option A - From Catalog):
{
  "beerId": "uuid-from-beer-catalog",
  "userName": "admin"
}

Request (Option B - Custom Beer):
{
  "customName": "My Custom Beer",
  "customBrewery": "Local Brewery",
  "customStyle": "IPA",
  "customAbv": 6.5,
  "userName": "admin"
}

Response:
{
  "id": "tastingbeer-uuid",
  "beer": { ...beer details... } // if beerId provided
  "customName": "..." // if custom
  ...
}
```

**2. GET `/api/tastings/{id}`**
```typescript
// Update includes
include: {
  tastingBeers: {  // Changed from 'beers'
    include: {
      beer: true  // Include global beer if referenced
    }
  }
}

// Update response mapping
beers: tasting.tastingBeers.map(tb => ({
  id: tb.id,
  name: tb.beer?.name || tb.customName,
  brewery: tb.beer?.brewery || tb.customBrewery,
  style: tb.beer?.style || tb.customStyle,
  abv: tb.beer?.abv || tb.customAbv,
  status: tb.status,
  orderIndex: tb.orderIndex
}))
```

**3. PATCH `/api/tastings/{id}/current`**
```typescript
// Change field name
await prisma.tasting.update({
  where: { id },
  data: {
    currentTastingBeerId: tastingBeerId  // Changed from currentBeerId
  }
})
```

**4. POST `/api/tastings/{id}/ratings`**
```typescript
// Change request/validation
const { tastingBeerId, participantId, score } = validated  // Changed from beerId

await prisma.rating.upsert({
  where: {
    tastingBeerId_participantId: {  // Changed unique constraint
      tastingBeerId,  // Changed field
      participantId
    }
  }
})
```

### Medium Priority (Scores/Leaderboard)

**5. GET `/api/tastings/{id}/scores`**
- Update to use `tastingBeers` instead of `beers`
- Map beer data from `beer` or `custom*` fields

**6. GET `/api/tastings/{id}/leaderboard`**
- Same as scores endpoint

**7. GET `/api/tastings/{id}/current/pending-raters`**
- Update `currentBeerId` reference to `currentTastingBeerId`
- Query `tastingBeers` instead of `beers`

### Low Priority (Beer Management)

**8. POST `/api/tastings/{id}/beers/{tastingBeerId}/finish`**
- Change route param from `beerId` to `tastingBeerId`
- Update queries

**9. PATCH `/api/tastings/{id}/beers/{tastingBeerId}`**
- Change route param
- Update edit logic (can only edit custom fields if no beerId)

**10. DELETE `/api/tastings/{id}/beers/{tastingBeerId}`**
- Change route param
- Update delete logic

**11. GET `/api/admin/tastings`**
- Update includes to use `tastingBeers`

---

## 📋 Update Checklist

### Phase 1: Core Functionality (Required to run app)
- [ ] Update `POST /api/tastings/{id}/beers`
- [ ] Update `GET /api/tastings/{id}`
- [ ] Update `PATCH /api/tastings/{id}/current`
- [ ] Update `POST /api/tastings/{id}/ratings`
- [ ] Update validation schemas in `src/lib/validation.ts`

### Phase 2: Scores & Leaderboard
- [ ] Update `GET /api/tastings/{id}/scores`
- [ ] Update `GET /api/tastings/{id}/leaderboard`
- [ ] Update `GET /api/tastings/{id}/current/pending-raters`

### Phase 3: Beer Management
- [ ] Update `POST /api/tastings/{id}/beers/{id}/finish`
- [ ] Update `PATCH /api/tastings/{id}/beers/{id}`
- [ ] Update `DELETE /api/tastings/{id}/beers/{id}`

### Phase 4: Admin & UI
- [ ] Update admin beer management UI
- [ ] Add beer selector dropdown (from catalog)
- [ ] Add "create custom beer" option
- [ ] Update all components using beer data

---

## 🎯 Recommended Approach

### Option 1: Fix Everything Now (2-3 hours)
Update all endpoints and UI in one go. App will be fully functional with beer catalog.

### Option 2: Minimum Viable Fix (30 minutes)
Only update Phase 1 endpoints to get basic functionality working:
- Can create tastings
- Can add beers (custom only for now)
- Can rate beers
- Add catalog selector UI later

### Option 3: Revert Changes (5 minutes)
```bash
git revert HEAD~3  # Revert last 3 commits
npx prisma db push
```
Go back to old schema, add beer catalog later.

---

## 🚀 Next Steps

**Immediate:**
1. Decide on approach (fix now, minimum fix, or revert)
2. If fixing: Start with Phase 1 (validation + 4 core endpoints)
3. Test with dev server
4. Iterate through phases

**After API Updates:**
1. Update admin UI for beer selection
2. Test end-to-end beer creation flow
3. Test rating flow
4. Deploy

---

## 📊 Migration Summary

**Changed:**
- Database schema (Beer → global catalog)
- 12 API endpoints need updates
- Admin UI needs beer selector

**Added:**
- 17 beers in catalog
- `GET /api/beers` endpoint
- Support for custom beers

**Unchanged:**
- Frontend components (mostly)
- User auth/sessions
- Real-time sync
- Export functionality (will work after API updates)

---

## 🔍 Testing the Beer Catalog

```bash
# Start dev server
npm run dev

# In another terminal:
curl http://localhost:3000/api/beers

# Should return:
{
  "beers": [...17 beers...],
  "total": 17,
  "filters": {
    "styles": ["Christmas Ale", "IPA", "Pilsner", ...],
    "countries": ["Iceland", "Denmark", "Norway"]
  }
}

# Search for Christmas beers:
curl http://localhost:3000/api/beers?search=jóla

# Filter by style:
curl http://localhost:3000/api/beers?style=IPA
```

---

**Current State:** Schema migrated, catalog seeded, waiting for API updates
**Estimated Work:** Phase 1 = 30-60 min, Full implementation = 2-3 hours
