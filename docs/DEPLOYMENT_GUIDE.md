# Beer Tasting App - Production Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Database Setup (Neon)](#database-setup-neon)
4. [Vercel Deployment](#vercel-deployment)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Testing & Verification](#testing--verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] **GitHub Account** - Code repository hosting
- [ ] **Vercel Account** - Application hosting (free tier available)
- [ ] **Neon Account** - PostgreSQL database (free tier available)

### Local Requirements
- [ ] Node.js 24 installed (`node --version`)
- [ ] Git installed and configured
- [ ] Project committed to GitHub repository

---

## Pre-Deployment Checklist

### 1. Code Review & Cleanup

**Critical Issues to Fix:**
```bash
# Fix hardcoded userName in admin page
# File: src/app/t/[id]/admin/page.tsx:42
# Replace: const [userName, setUserName] = useState('skuli')
# With: Get userName from session/cookie
```

**Action Items:**
- [ ] Remove all `console.log` debug statements
- [ ] Remove test data from seed files
- [ ] Review all `TODO` comments
- [ ] Update environment variables

### 2. Security Review

- [ ] Change default admin password
- [ ] Review authentication logic
- [ ] Check for exposed secrets in code
- [ ] Ensure `.env` is in `.gitignore`

### 3. Performance Optimization

Already implemented:
- ✅ API caching (1 hour for beer catalog)
- ✅ N+1 query optimization (tasting endpoint)
- ✅ Proper database indexes via Prisma

### 4. Build Test

```bash
# Test production build locally
npm run build

# If successful, you'll see:
# ✓ Compiled successfully
# Route (app)                                Size     First Load JS
# ...
```

**Fix any build errors before proceeding!**

---

## Database Setup (Neon)

### Step 1: Create Neon Project

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up or log in
3. Click **"New Project"**
4. Configure:
   - **Name:** `beer-tasting-production`
   - **Region:** Choose closest to your users (Europe/US)
   - **PostgreSQL Version:** 16 (latest)
   - **Compute Size:** 0.25 vCPU (free tier)

### Step 2: Get Connection String

1. Once project is created, go to **Dashboard**
2. Copy the **Connection String** (looks like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
3. **Save this securely** - you'll need it for Vercel

### Step 3: Run Database Migrations

```bash
# Set DATABASE_URL temporarily in your terminal
export DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Run Prisma migrations
npx prisma migrate deploy

# Expected output:
# ✓ Applied migration(s)
```

### Step 4: Seed Beer Catalog

```bash
# Seed the 17 Icelandic Christmas beers
npm run seed:beers

# Expected output:
# 🍺 Seeding beer catalog...
# ✓ Jólabjór - Borg Brugghús
# ...
# 📊 Beer catalog seeding complete: Created/Updated: 17
```

### Step 5: Verify Database

```bash
# Open Prisma Studio to verify data
npx prisma studio

# Opens at http://localhost:5555
# Check: Beer table has 17 entries
```

---

## Vercel Deployment

### Step 1: Push Code to GitHub

```bash
# Ensure all changes are committed
git status

# Add any uncommitted files
git add .

# Commit
git commit -m "Prepare for production deployment"

# Push to main branch
git push origin main
```

### Step 2: Connect Vercel to GitHub

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your repository: `skuli/personal` (or your repo name)
5. Click **"Import"**

### Step 3: Configure Project Settings

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `.` (leave as default)

**Build Command:** `npm run build` (auto-filled)

**Output Directory:** `.next` (auto-filled)

**Install Command:** `npm install` (auto-filled)

### Step 4: Set Environment Variables

Click **"Environment Variables"** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` | Production |
| `NEXT_PUBLIC_APP_NAME` | `Beer Tasting` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `ADMIN_PASSWORD` | `your-secure-password` | Production |
| `REALTIME_MODE` | `sse` | Production |

**Important:**
- Use the Neon connection string from Step 2
- Change `ADMIN_PASSWORD` from default
- Update `NEXT_PUBLIC_APP_URL` after deployment (Step 6)

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Watch build logs for errors

**Expected Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
Route (app)                                Size     First Load JS
├ ○ /                                      142 B          87.1 kB
├ ○ /api/beers                             0 B                0 B
...
✓ Build completed in XXs
```

### Step 6: Get Deployment URL

1. Once deployed, Vercel shows: **"Your project is ready!"**
2. Copy the URL: `https://your-app-xxxxx.vercel.app`
3. Click **"Visit"** to open your live app

### Step 7: Update Environment Variable

1. Go to **Project Settings** → **Environment Variables**
2. Edit `NEXT_PUBLIC_APP_URL`
3. Change to your actual Vercel URL: `https://your-app-xxxxx.vercel.app`
4. Click **"Save"**
5. **Redeploy:** Go to **Deployments** → Click **"..."** → **"Redeploy"**

---

## Post-Deployment Configuration

### Step 1: Set Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain: `beerrating.app`
3. Follow Vercel's DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Redeploy

### Step 2: Configure Admin User

1. Visit: `https://your-app.vercel.app/admin`
2. Login with password you set in `ADMIN_PASSWORD`
3. Go to **Users** page
4. Promote yourself to Leader:
   - Enter your name (e.g., "Skuli")
   - System will auto-create user on first tasting join
   - Return to admin page and promote

### Step 3: Test Admin Functionality

1. Go to homepage: `https://your-app.vercel.app`
2. Click **"Create New Tasting"**
3. Enter details and create
4. Add beers from catalog
5. Share link with test participant

---

## Testing & Verification

### Step 1: Smoke Tests (Critical Paths)

#### Test 1: Admin Creates Tasting
- [ ] Visit homepage
- [ ] Click "Create New Tasting"
- [ ] Enter title and your name
- [ ] Redirected to admin page
- [ ] Add beer from catalog
- [ ] Click "Start Tasting"
- [ ] Set beer as current

#### Test 2: Participant Joins
- [ ] Open incognito/private window
- [ ] Visit tasting link
- [ ] Enter different name
- [ ] See current beer
- [ ] Submit rating
- [ ] See "Rating submitted!" message

#### Test 3: Leader Finishes Beer
- [ ] Go back to admin page
- [ ] Click "Finish This Beer"
- [ ] Confirm prompt
- [ ] Participant sees wrap-up overlay
- [ ] Leaderboard displays

#### Test 4: Export Results
- [ ] Set another beer as current
- [ ] Participants rate it
- [ ] Finish second beer
- [ ] Click "Export XLSX"
- [ ] File downloads successfully
- [ ] Open file - verify data

#### Test 5: Beer Catalog
- [ ] Visit `/beers`
- [ ] Search for "Jólabjór"
- [ ] Sort by price
- [ ] Click edit on a beer
- [ ] Change price
- [ ] Save changes
- [ ] Verify update

### Step 2: Real-time Sync Test

1. Open tasting in 2 browser windows
2. In window 1 (leader): Set beer as current
3. In window 2 (participant): Should see update within 2 seconds
4. Submit rating in window 2
5. In window 1: Should see rating count update

### Step 3: Mobile Testing

- [ ] Open on iPhone/Android
- [ ] Test responsive layout
- [ ] Submit rating with star interface
- [ ] Verify touch interactions work
- [ ] Test navigation

## Monitoring & Maintenance

### Daily Monitoring

**Vercel Dashboard:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Check **"Deployments"** - ensure green checkmarks
3. Review **"Analytics"** - page views, visitors
4. Check **"Functions"** - API response times

**Neon Dashboard:**
1. Go to [console.neon.tech](https://console.neon.tech)
2. Check **"Monitoring"** - database connections
3. Review **"Storage"** - ensure under 512MB (free tier limit)
4. Check **"Activity"** - recent queries

### Weekly Tasks

- [ ] Review error logs in Vercel
- [ ] Check database size (Neon dashboard)
- [ ] Review user feedback/issues
- [ ] Test critical paths still working
- [ ] Check for security updates: `npm audit`

### Monthly Tasks

- [ ] Update dependencies: `npm update`
- [ ] Review analytics - popular features
- [ ] Database cleanup - old tastings
- [ ] Backup production database

### Backup Strategy

**Database Backup:**
```bash
# Export production database
pg_dump postgresql://user:pass@ep-xxx.neon.tech/neondb > backup-$(date +%Y%m%d).sql

# Restore if needed
psql postgresql://user:pass@ep-xxx.neon.tech/neondb < backup-20250101.sql
```

**Code Backup:**
- Already backed up in GitHub
- Tag releases: `git tag v1.0.0 && git push --tags`

### Update Procedure

```bash
# 1. Make changes locally
git pull origin main
# ... make code changes ...
npm run build  # Test locally

# 2. Commit and push
git add .
git commit -m "Update: description of changes"
git push origin main

# 3. Vercel auto-deploys from main branch
# 4. Monitor deployment in Vercel dashboard
```

---

## Troubleshooting

### Issue: Build Fails on Vercel

**Symptoms:** Red X on deployment, build logs show errors

**Solutions:**

1. **Type errors:**
   ```bash
   # Run locally first
   npm run build

   # Fix all TypeScript errors
   # Then push to GitHub
   ```

2. **Missing dependencies:**
   ```bash
   # Ensure package.json is up to date
   npm install
   git add package.json package-lock.json
   git commit -m "Update dependencies"
   git push
   ```

3. **Environment variable issues:**
   - Check all required env vars are set in Vercel
   - Redeploy after adding variables

### Issue: Database Connection Fails

**Symptoms:** 500 errors, "Cannot connect to database"

**Solutions:**

1. **Check connection string:**
   - Go to Vercel → Settings → Environment Variables
   - Verify `DATABASE_URL` is correct
   - Ensure it has `?sslmode=require` at the end

2. **Check Neon status:**
   - Go to Neon dashboard
   - Ensure database is not suspended (free tier auto-suspends after inactivity)
   - Click "Resume" if suspended

3. **Prisma sync issues:**
   ```bash
   # Regenerate Prisma client
   npx prisma generate

   # Push schema changes
   npx prisma db push

   # Redeploy on Vercel
   ```

### Issue: Real-time Updates Not Working

**Symptoms:** Participants don't see beer changes immediately

**Solutions:**

1. **Check SSE connection:**
   - Open browser DevTools → Network
   - Filter by "stream"
   - Should see `/api/tastings/[id]/stream` with status 200

2. **Fallback to polling:**
   - SSE might be blocked by firewall/proxy
   - App auto-falls back to 1s polling
   - Check console for "SSE failed, using polling"

3. **Vercel function timeout:**
   - Free tier has 10s timeout for Serverless Functions
   - SSE might disconnect after 10s
   - Upgrade to Pro plan for longer timeouts

### Issue: Ratings Not Saving

**Symptoms:** "Error submitting rating" message

**Solutions:**

1. **Check participant session:**
   - Open DevTools → Application → Local Storage
   - Verify `participant_${tastingId}` exists
   - If missing, rejoin tasting

2. **Database constraints:**
   - Participant may be rating same beer twice
   - Check ratings API logs in Vercel

3. **Beer not current:**
   - Can only rate current beer
   - Leader must set beer as current first

### Issue: Export Downloads Fail

**Symptoms:** 500 error when clicking Export XLSX

**Solutions:**

1. **Check ExcelJS dependency:**
   ```bash
   npm install exceljs
   git add package.json package-lock.json
   git commit -m "Add exceljs"
   git push
   ```

2. **Memory limit:**
   - Large tastings (100+ ratings) may exceed memory
   - Upgrade Vercel plan for more memory

3. **Timeout:**
   - Export takes >10s on free tier
   - Reduce data size or upgrade plan

---

## Production Readiness Checklist

### Security ✅
- [ ] Admin password changed from default
- [ ] No secrets committed to GitHub
- [ ] Environment variables properly configured
- [ ] Database uses SSL connections

### Performance ✅
- [ ] API responses < 500ms average
- [ ] Real-time updates work within 2s
- [ ] Export downloads complete successfully
- [ ] Mobile experience is smooth

### Monitoring ✅
- [ ] Error tracking configured (Sentry/Vercel)
- [ ] Analytics enabled
- [ ] Database monitoring active
- [ ] Backup strategy in place

### Testing ✅
- [ ] All critical paths tested
- [ ] Real-time sync verified
- [ ] Mobile responsive
- [ ] Export functionality works

### Documentation ✅
- [ ] README.md updated
- [ ] Environment variables documented
- [ ] Deployment guide reviewed
- [ ] Troubleshooting section complete

---

## Next Steps After Launch

### Week 1: Monitor Closely
- Check Vercel dashboard daily
- Review error logs
- Monitor user feedback
- Fix critical bugs immediately

### Week 2-4: Iterate
- Gather user feedback
- Prioritize feature requests
- Fix non-critical bugs
- Optimize slow queries

### Month 2+: Scale
- Consider custom domain
- Upgrade to paid tier if needed
- Add more features from FUTURE_ENHANCEMENTS.md
- Set up automated backups

---

## Support & Resources

### Documentation
- **Next.js:** https://nextjs.org/docs
- **Vercel:** https://vercel.com/docs
- **Neon:** https://neon.tech/docs
- **Prisma:** https://www.prisma.io/docs

### Community
- **Next.js Discord:** https://nextjs.org/discord
- **Vercel Community:** https://vercel.com/community

### Estimated Costs

**Free Tier (Recommended for Start):**
- Vercel: Free (100GB bandwidth, 100 function invocations/day)
- Neon: Free (512MB storage, 0.25 vCPU)
- **Total: $0/month**

**Paid Tier (If Scaling):**
- Vercel Pro: $20/month (unlimited bandwidth)
- Neon Pro: $19/month (10GB storage, autoscaling)
- **Total: $39/month**

---

## Deployment Timeline

| Task | Duration | Responsible |
|------|----------|-------------|
| Pre-deployment checks | 1 hour | Developer |
| Database setup | 30 minutes | Developer |
| Vercel deployment | 15 minutes | Developer |
| Testing & verification | 2 hours | Developer + QA |
| Production monitoring | Ongoing | Developer |

**Total Time to Deploy:** ~4 hours

---

## Success Metrics

Track these KPIs after launch:

- **Uptime:** Target 99.9% (track via Vercel)
- **Response Time:** < 500ms average (track via Vercel Analytics)
- **Error Rate:** < 1% (track via error monitoring)
- **User Satisfaction:** Gather feedback via form/email

---

## 🎉 You're Ready to Deploy!

Follow this guide step-by-step and your beer tasting app will be live in production.

**Questions or issues?** Refer to the Troubleshooting section or check:
- Vercel Support: https://vercel.com/support
- Neon Support: https://neon.tech/docs/introduction/support

Good luck! 🍺
