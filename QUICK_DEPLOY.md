# Quick Deployment Checklist

**Time Required:** ~30 minutes (experienced developers)

---

## ⚡ Pre-Flight

```bash
# 1. Test build locally
npm run build

# 2. Ensure all changes committed
git status
git add .
git commit -m "Ready for production"
git push origin main
```

---

## 🗄️ Database (Neon)

1. **Create project:** https://neon.tech
   - Name: `beer-tasting-production`
   - Region: Closest to users
   - Copy connection string

2. **Run migrations:**
   ```bash
   export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
   npx prisma migrate deploy
   npm run seed:beers
   ```

3. **Verify:** `npx prisma studio` → Check 17 beers exist

---

## 🚀 Vercel

1. **Import project:** https://vercel.com
   - Connect GitHub repo
   - Framework: Next.js (auto-detected)

2. **Environment variables:**
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   NEXT_PUBLIC_APP_NAME=Beer Tasting
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ADMIN_PASSWORD=your-secure-password
   REALTIME_MODE=sse
   ```

3. **Deploy:** Click "Deploy" button

4. **Update URL:**
   - After deployment, copy Vercel URL
   - Update `NEXT_PUBLIC_APP_URL` in environment variables
   - Redeploy

---

## ✅ Verify

- [ ] Homepage loads: `https://your-app.vercel.app`
- [ ] Create tasting works
- [ ] Add beer from catalog
- [ ] Participant can join and rate
- [ ] Leader can finish beer
- [ ] Export XLSX downloads
- [ ] Beer catalog editable at `/beers`

---

## 🎯 Critical Post-Deploy

1. **Set admin password** - Change from default
2. **Test on mobile** - Verify responsive design
3. **Monitor first hour** - Watch Vercel dashboard
4. **Backup database** - `pg_dump` connection string

---

## 📊 Monitoring URLs

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Neon Dashboard:** https://console.neon.tech
- **App:** https://your-app.vercel.app
- **Admin:** https://your-app.vercel.app/admin

---

## 🆘 Quick Fixes

**Build fails:**
```bash
npm run build  # Fix errors locally first
```

**Database connection fails:**
- Check `DATABASE_URL` has `?sslmode=require`
- Resume database in Neon if suspended

**Real-time not working:**
- Check browser console for SSE errors
- App auto-falls back to polling

---

**🎉 Done! App is live.**

See `DEPLOYMENT_GUIDE.md` for full details.
