# 🍺 Beer Tasting App

A mobile-first web application for synchronized beer tastings where groups can rate beers together in real-time, see live results, and export data.

## 🎯 Overview

**Problem:** Beer tastings are messy and unstructured — people forget which beer they're on, ratings get lost, and results aren't collected consistently.

**Solution:** Simple web app where everyone joins via link, rates beers in sync, and sees instant averages. Leaders manage the flow, participants rate, everyone stays aligned.

## ✨ Key Features

- 🎯 **Real-time synchronization** — everyone sees the same current beer (≤5s latency)
- 👥 **Global user system** — users identified by name, leaders have global privileges
- 🍺 **Beer catalog** — global catalog with Vínbúðin integration, styles, pricing, and images
- 📊 **Live leaderboard** — see top beers as ratings come in
- 📱 **Mobile-first** — responsive design for iOS/Android browsers
- 📤 **Export results** — CSV/XLSX with individual ratings and summaries
- 🔄 **Session persistence** — never lose your session across refreshes
- 🎨 **No accounts** — join with just your name, no passwords

## 👥 User Roles

| Role | Access | Capabilities |
|------|--------|--------------|
| **Admin** | `/admin` (name: "admin" or "skúli") | Manage users, promote/demote leaders and admins, manage beer catalog, view all tastings |
| **Leader** | Global flag (`User.isLeader`) | Create tastings, manage beers, see pending raters, export, **also rate** |
| **Participant** | Join via link | Rate beers, view scores |

**Note:** Anyone named "skúli" is automatically granted admin privileges. Admins can also promote other users to admin status via the user management interface.

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **React:** 19
- **Language:** TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **Forms:** React Hook Form
- **State:** TanStack Query (React Query)
- **Real-time:** Polling

### Backend
- **API:** Next.js API Routes
- **Database:** PostgreSQL (Neon or Supabase)
- **ORM:** Prisma
- **Auth:** Simple name-based + httpOnly cookies
- **Export:** exceljs

### Infrastructure
- **Hosting:** Vercel
- **Database:** Neon (serverless Postgres)
- **Monitoring:** Sentry
- **Testing:** Vitest, Playwright

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database (local or Neon/Supabase)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd beer-tasting-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Run database migrations
npx prisma migrate dev

# Seed development data (optional)
npm run seed:dev

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## 🛠️ Scripts & Tools

### Vínbúðin Beer Fetching

Automatically fetch Christmas beers from Vínbúðin (Icelandic state liquor store) and add them to your beer catalog.

```bash
# Install Playwright browser (one time setup)
npx playwright install chromium

# Dry run - preview what will be imported (recommended first)
npx tsx scripts/fetch-vinbudin-beers.ts --dry-run

# Import beers to database
npx tsx scripts/fetch-vinbudin-beers.ts

# Use with production database
DATABASE_URL="postgresql://..." npx tsx scripts/fetch-vinbudin-beers.ts --dry-run
DATABASE_URL="postgresql://..." npx tsx scripts/fetch-vinbudin-beers.ts
```

**Features:**
- ✅ Fetches all pages of Christmas beers automatically
- ✅ Extracts beer details (name, brewery, price, ABV, images, product numbers)
- ✅ Handles beer styles as arrays (e.g., ["Ljós lager", "Amber", "Vínar"])
- ✅ Properly detects container types (Bottle vs Can) from Umbúðir label
- ✅ Extracts ABV for both decimal (5.7%) and whole number (5%) values
- ✅ Avoids duplicates by checking existing beers (name + brewery + container variant)
- ✅ Dry-run mode to preview changes before importing
- ✅ Works locally only (requires Playwright browser)
- ✅ Handles pagination (currently ~43 beers across 2 pages)

**Collected Data:**
- Beer name and brewery
- Vínbúðin product ID (numeric)
- Price in ISK
- ABV percentage (including whole numbers)
- Container size and type (Bottle/Can distinction)
- Beer styles as array (multiple styles per beer)
- Product images
- Beer description
- Direct link to Vínbúðin product page

See [`scripts/README.md`](scripts/README.md) for detailed documentation in Icelandic and English.

**Note:** This script uses Playwright to handle JavaScript-rendered content and only works in local development. The web API endpoint `/api/beers/fetch-vinbudin` is disabled in production.

### Environment Setup

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# App
NEXT_PUBLIC_APP_NAME=BeerTasting
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional
ADMIN_PASSWORD=admin
```

See [`.env.example`](.env.example) for complete configuration.

## 📖 Documentation

- **[PRD.md](PRD.md)** — Complete product requirements document
- **API Documentation** — See PRD Section 8
- **Data Model** — See PRD Section 5

## 🗄️ Data Model (Core Entities)

```
User (global)
  ├── name (unique, case-insensitive)
  ├── isLeader (boolean)
  ├── isAdmin (boolean, auto-true for "skúli")
  └── participations (many Participants)

Participant (per-tasting)
  ├── userId → User
  ├── tastingId → Tasting
  ├── code (4-char alphanumeric)
  ├── rejoinToken (session persistence)
  └── ratings (many Ratings)

Tasting
  ├── title
  ├── status (draft | active | closed)
  ├── currentBeerId → Beer
  ├── version (for optimistic concurrency)
  ├── beers (many)
  └── ratings (many)

TastingBeer (instance in a tasting)
  ├── tastingId → Tasting
  ├── beerId → Beer (optional, can be custom)
  ├── name, brewery
  ├── status (untasted | current | finished)
  └── orderIndex

Beer (global catalog)
  ├── name, brewery
  ├── styles (array, e.g., ["Ljós lager", "Amber"])
  ├── abv, country
  ├── containerSize, containerType
  ├── productNumber, vinbudinUrl, priceISK
  ├── imageUrl, description
  └── @@unique([name, brewery, containerSize, containerType])

Rating
  ├── beerId → Beer
  ├── participantId → Participant
  ├── score (1.0 - 10.0, step 0.5)
  └── @@unique([beerId, participantId])
```

## 🔑 Key Workflows

### Admin: Manage Users & Beer Catalog

```typescript
// User Management (/admin/users)
// 1. Admin authenticates at /admin (name: "admin" or "skúli")
// 2. Navigate to /admin/users
// 3. Toggle "Leader" or "Admin" status on any user
// 4. User.isLeader = true or User.isAdmin = true
// 5. Next time they join any tasting, they see appropriate controls

// Beer Catalog Management (/beers)
// 1. Navigate to /beers
// 2. Add beers manually or fetch from Vínbúðin
// 3. Edit beer details (name, styles, ABV, price, etc.)
// 4. Delete beers from catalog (caution: affects tastings using them)
// 5. Search and filter by name, brewery, style, or price
```

### Leader: Create & Manage Tasting

```typescript
// 1. Visit homepage → "Create New Tasting"
// 2. Enter tasting name + your name
// 3. System creates Tasting (draft) + links to your User
// 4. Add beers (name + brewery)
// 5. Click "Start Tasting" (draft → active)
// 6. Select first beer as current
// 7. Participants can now rate
// 8. When done, mark beer as "Finished"
// 9. Select next beer
// 10. Repeat until all beers finished
// 11. Click "Complete Tasting" (active → closed)
// 12. Export results (CSV/XLSX)
```

### Participant: Join & Rate

```typescript
// 1. Receive link: beerrating.app/t/{id}
// 2. Enter your name
// 3. System:
//    - Checks if User exists (case-insensitive)
//    - Creates Participant record
//    - Stores rejoinToken in cookie
// 4. See current beer
// 5. Rate it (1.0-10.0 via numeric input)
// 6. Submit (upsert to database)
// 7. Can edit until beer marked "Finished"
// 8. See wrap-up screen (5s minimum)
// 9. See leaderboard while waiting for next beer
// 10. Repeat for all beers
```

## 🔄 Real-time Synchronization

### Architecture

**Polling** — stateless, so it works across Vercel's serverless instances (an in-memory SSE broadcast only reaches clients connected to the same instance).
- Pages poll their data endpoints every 3–5s (`GET /api/tastings/{id}`, `/scores`, `/current/pending-raters`, …)
- Nudges are persisted on `Tasting.nudgedAt` / `Tasting.nudgedParticipantIds`; `useNudge` polls `GET /api/tastings/{id}/nudge` every 2s and fires when `nudgedAt` changes

### Consistency Target
- All clients sync within **≤5 seconds**; nudges within **≤2 seconds**

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests (requires running dev server)
npm run test:e2e

# All tests
npm run test:all

# Coverage report
npm run test:coverage
```

### E2E Test Scenarios

1. Admin promotes leader
2. Leader creates tasting → adds beers → starts
3. Participant joins → rates → sees wrap-up
4. Leader finishes beer → selects next
5. Export CSV/XLSX

## 📦 Database Management

### Migrations

```bash
# Create new migration (after schema changes)
npx prisma migrate dev --name description_of_change

# Apply migrations to production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (visual DB editor)
npx prisma studio
```

### Database Cleanup

Remove test/development data while preserving beer catalog and admin users:

```bash
# Clean development database
npm run db:cleanup

# Clean production database (BE CAREFUL!)
DATABASE_URL="postgresql://..." npm run db:cleanup
```

**What gets deleted:**
- ✅ All ratings
- ✅ All tasting beers
- ✅ All participants
- ✅ All tastings
- ✅ All non-admin users

**What is preserved:**
- ✅ Beer catalog
- ✅ Admin users
- ✅ Admin authentication

**To also delete beer catalog:**
Edit `prisma/cleanup.ts` and uncomment the beer deletion code.

**⚠️ PRODUCTION WARNING:**
- **ALWAYS backup production database first!**
- Create backup: Use your database provider's backup tools (Neon, Supabase, etc.)
- Verify DATABASE_URL before running cleanup
- This operation is **irreversible**
- Test with dry-run first if possible

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect GitHub repo** to Vercel
2. **Set environment variables:**
   - `DATABASE_URL` (Neon connection string)
   - `NEXT_PUBLIC_APP_URL` (production URL)
   - Optional: `SENTRY_DSN`, `ADMIN_PASSWORD`
3. **Deploy:** Push to `main` branch
4. **Run migrations:**
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

### Database (Neon)

1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string
3. Add to Vercel environment variables
4. Run migrations (see above)

## 🔐 Security Notes (MVP)

- **Admin auth:** Name-only ("admin") — simple for friend groups
- **Leader auth:** Global `User.isLeader` flag
- **Participant auth:** Rejoin token in httpOnly cookie
- **Rating spam:** Prevented by unique constraint (one rating per beer per participant)
- **Trust model:** Designed for small, trusted friend groups
- **Future:** Add bcrypt password for admin, email recovery

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| Mobile LCP | < 2.0s |
| API p95 (POST /ratings) | < 200ms |
| API p95 (GET queries) | < 300ms |
| Real-time sync | ≤5s (polling) |
| Export generation | ≤5s (10k ratings) |

## 🐛 Troubleshooting

### Database connection issues?
- Verify `DATABASE_URL` in `.env`
- Check connection pooling limits (max 20 for Vercel)
- Consider using Prisma Data Proxy

### Session lost on refresh?
- Check if `participant_token` cookie exists
- Verify `rejoinToken` in database
- Check `SESSION_COOKIE_NAME` in environment

### Real-time lag?
- Polling syncs within ≤5s
- Check network tab for failing poll requests

## 🛣️ Roadmap

### MVP (Current)
- ✅ Global admin + leader system
- ✅ Admin user management (promote to admin/leader)
- ✅ Beer catalog with Vínbúðin integration
- ✅ Beer styles as arrays for statistics
- ✅ Beer catalog CRUD operations
- ✅ Real-time synchronization
- ✅ Session persistence
- ✅ CSV/XLSX export
- ✅ Mobile-first design

### v1.1 (Next)
- [ ] Tappable star rating UI
- [ ] Notes field on ratings
- [ ] QR code join links
- [ ] Email admin recovery
- [ ] PWA offline support
- [ ] Beer style statistics and analytics

### v2.0 (Future)
- [ ] Beer catalog with vintages
- [ ] Live median/distribution stats
- [ ] Push-based real-time (e.g. Redis pub/sub) if polling latency becomes a problem
- [ ] Multi-language support (Icelandic)
- [ ] Advanced analytics per style/brewery

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style

- Use TypeScript strict mode
- Follow Airbnb style guide
- Run `npm run lint` before committing
- Write tests for new features

## 📄 License

[MIT](LICENSE)

## 📞 Support

- **Issues:** [GitHub Issues](link-to-issues)
- **Email:** support@beerrating.app
- **Docs:** [PRD.md](PRD.md)

---

Built with ❤️ for beer lovers everywhere 🍺
