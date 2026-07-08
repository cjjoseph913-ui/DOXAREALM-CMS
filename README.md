# DoxaRealm CMS - Deployment & Sharing Guide

DoxaRealm is a Next.js + PostgreSQL + Drizzle Church Management System.

## WILL IT WORK IF I DOWNLOAD AND SHARE?

### ❌ If you just download the ZIP:
**NO**, it won't work automatically for everyone because:
- It needs Node.js 18+
- It needs PostgreSQL database
- It needs `DATABASE_URL` env variable
- The person you share with must run `npm install && npx drizzle-kit push && npm run build && npm start`

### ✅ How to make it work for EVERYONE you share with:

## OPTION 1: Deploy Once, Share a Link (RECOMMENDED - Works for Everyone Instantly)

Deploy to Vercel / Render / Railway. Then just share the URL.

1. Push code to GitHub
2. Go to vercel.com -> Import project
3. Add Environment Variable: `DATABASE_URL = postgresql://...` (use Neon, Supabase, or Vercel Postgres - FREE)
4. Deploy -> You get https://doxarealm.vercel.app
5. Share that link - ANYONE in the world can open and use it, no install needed. Works on phone, tablet, laptop.

**This is how WhatsApp Web, Google Docs work. One deployment, everyone uses same database.**

Data is shared: All churches see same regional hierarchy (you can filter by church). If you want isolation, add roles.

## OPTION 2: PWA Installable App (Already Enabled!)

The app now includes manifest.json + icons. Users can:

1. Open your deployed link on phone
2. Browser will show "Install App" or "Add to Home Screen"
3. It installs like a native app with its own icon, splash screen, standalone window
4. Works offline for Sunday Ledger (queues when offline)

No Play Store needed.

## OPTION 3: Docker - One-Command Self Hosting

For churches that want their own server:

```bash
docker-compose up -d
```

We provide docker-compose.yml that starts both Postgres and App.

## OPTION 4: Mobile APK (if you want Play Store)

We can wrap with Capacitor:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init DoxaRealm com.doxarealm.cms
npx cap add android
npm run build
npx cap copy
npx cap open android
```

Then build APK in Android Studio and share .apk file.

---

## Current Features Ready for Sharing:

- Churches, Zones, Cell Groups registration with cascading selects
- Member directory with Water Baptism + Holy Spirit Baptism
- Youth Hub strict 13-45 yrs with stages (Teens, Young Adults, Adult Youth, Senior Youth)
- TZS-first stewardship: Tithe, Offering, Seed, First Fruit, Gospel, Youth, Other per church
- Quarterly Reports: Click Q1-Q4 cards for instant direct reports, Print & Export JSON
- Offline queue for Sunday Ledger
- Dashboard with youth counts, giving totals

## What you should do now:

1. Deploy to Vercel (15 mins) - then share link to all pastors/leaders
2. Or tell me you want a standalone .exe or .apk and I'll bundle it

Would you like me to prepare the APK/Desktop build now?
