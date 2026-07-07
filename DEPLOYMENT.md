# 🚀 Soko Terminal — Deployment Guide

## Option A: Vercel (Recommended, Easiest)

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Import on Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Import your `soko-terminal` repo
3. Framework preset: **Next.js** (auto-detected)
4. Region: ** Frankfurt (fra1)** or **Bom1 (Mumbai)** — closest to Kenya

### 3. Add Environment Variables
In Vercel → Settings → Environment Variables, add:

| Variable | Required | Value |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/db` |
| `SOKO_SESSION_SECRET` | ✅ | [generate](https://generate-secret.vercel.app/) |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://your-app.vercel.app` |
| `SENDGRID_API_KEY` | Optional | `SG.xxx` |
| `REDIS_URL` | Optional | `redis://...` |
| `SENTRY_DSN` | Optional | `https://xxx@sentry.io/xxx` |
| `MPESA_*` | Optional | Daraja credentials |

### 4. Set Up Database
Use **Neon**, **Supabase**, or **Vercel Postgres** (free tiers available):

```bash
# After first deploy, run migrations:
npx drizzle-kit generate   # (already done, files in /drizzle)
npx tsx src/db/migrate.ts  # apply to production DB
npx tsx src/db/run.ts      # seed market data
```

Or use Vercel's build hook to run `migrate` automatically.

### 5. Deploy
Click **Deploy** — Vercel handles the rest. Auto-deploys on every `git push`.

---

## Option B: Docker (Self-Hosted)

### One command:
```bash
# Create a .env file with your secrets (copy from .env.example)
docker-compose up -d
```

This spins up:
- **Next.js app** (port 3000)
- **PostgreSQL 16** (auto-created, with volume)
- **Redis 7** (for sessions + rate limiting)

### Run migrations + seed:
```bash
docker-compose exec app npx tsx src/db/migrate.ts
docker-compose exec app npx tsx src/db/run.ts
```

### Behind a reverse proxy (nginx/caddy):
The Dockerfile exposes port 3000. Use Caddy for automatic HTTPS:
```
sokoterminal.ke {
  reverse_proxy localhost:3000
}
```

---

## Option C: VPS (Manual)

```bash
# 1. Clone & install
git clone https://github.com/jaysonwanyeki-glitch/Soko-Terminal-2.0.git
cd Soko-Terminal-2.0
npm ci

# 2. Set up env
cp .env.example .env  # edit with real values

# 3. Build & migrate
npm run build
npx tsx src/db/migrate.ts
npx tsx src/db/run.ts

# 4. Run with PM2 (process manager)
npm i -g pm2
pm2 start "npm run start" --name soko
pm2 save && pm2 startup

# 5. Nginx reverse proxy + Let's Encrypt
sudo certbot --nginx -d sokoterminal.ke
```

---

## Post-Deployment Checklist

- [ ] Health check: visit `/api/health` → `{"ok":true}`
- [ ] Status check: visit `/api/status` → all services reporting
- [ ] Database seeded: visit `/stocks` → 34 equities shown
- [ ] Crypto live: visit `/crypto` → shows "● LIVE"
- [ ] Register works: create a test account
- [ ] M-Pesa test: deposit KSh 100 in simulation mode
- [ ] Set `SOKO_SESSION_SECRET` to a strong random string
- [ ] Set `NEXT_PUBLIC_APP_URL` to your real domain
- [ ] Add M-Pesa Daraja credentials for live payments
- [ ] Configure SendGrid for email delivery
- [ ] Set up Sentry DSN for error monitoring

---

## Environment Variables Reference

See `.env.example` for the full list with descriptions.
All services have **graceful fallbacks** — the app runs without any optional keys.
