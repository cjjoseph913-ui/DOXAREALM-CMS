# 🚀 How To Make DoxaRealm Work For EVERYONE (Permanent Link)

The preview link you got from arena.ai (`*.e2b.app`) is **session-only** and locked to arena.ai.
It will show "Preview Unavailable" to anyone outside this platform.

To share DoxaRealm with all your churches, pastors, and youth leaders, deploy it once to a
**free permanent host**. Then you share ONE link and everyone opens it in their browser/phone.

This takes ~10 minutes. No coding needed.

---

## ⭐ FASTEST PATH: Vercel + Neon (FREE, ~10 min)

### Step 1 — Get a free database (Neon)
1. Go to **https://neon.tech** → Sign up (free).
2. Click **"New Project"** → name it `doxarealm` → Create.
3. On the dashboard, find **"Connection String"** → copy the full `postgresql://...` URL.
   (It looks like: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb`)

### Step 2 — Put your code on GitHub
1. Go to **https://github.com** → Sign up (free) → **New repository** → name `doxarealm` → Create.
2. On your computer, upload ALL the project files into that repo (drag & drop, or use GitHub Desktop).

### Step 3 — Deploy on Vercel (reads your database automatically)
1. Go to **https://vercel.com** → Sign up with GitHub.
2. Click **"Add New" → "Project"** → import the `doxarealm` repo.
3. In the config, expand **"Environment Variables"** and add:
   - **Key:** `DATABASE_URL`
   - **Value:** paste the Neon connection string from Step 1
4. Click **Deploy**.
5. Wait ~1 minute. Vercel runs `npm run build` → which auto-runs `drizzle-kit push` to create all tables.
6. You get a permanent link like **`https://doxarealm.vercel.app`** 🎉

### Step 4 — Share it
Send that link to everyone. They open it on phone/PC → works instantly.
On a phone, tap browser menu → **"Add to Home Screen"** to install it like an app.

---

## 🐳 OPTION 2: Self-Hosted (Docker, fully offline)
If a church wants to run it on their own server/computer with no cloud:
```bash
docker-compose up -d --build
```
This starts both PostgreSQL and the app. Opens at `http://localhost:3000`.

---

## 🔧 What was already prepared for you in this repo
- `Dockerfile` — optimized production container
- `start.sh` — runs DB migrations then starts the server
- `render.yaml` — one-click Render.com Blueprint
- `drizzle.config.ts` — reads `DATABASE_URL` from the host (not hardcoded)
- `package.json` `postbuild` — auto-creates database tables on every deploy
- `public/manifest.json` + icons — PWA install support
- `src/db/schema.ts` — all tables (members, churches, youth, attendance, etc.)

## Environment Variable needed on ANY host:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
```

That's it. Deploy once, share the link, everyone uses the same live church database.
