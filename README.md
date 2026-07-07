# Soko Terminal 🇰🇪

**Kenya's first M-Pesa trading terminal for NSE stocks, treasury bonds & crypto.**

Soko Terminal brings the power of a professional trading desk — think Bloomberg, but built for Kenya — to every phone. Track the Nairobi Securities Exchange (NSE), buy treasury bonds, trade crypto around the clock, and fund it all with **M-Pesa** (Lipa Na M-Pesa / Daraja STK Push).

![Dark mode terminal UI](https://img.shields.io/badge/theme-dark%20mode-05070a?style=flat-square)

---

## ✨ Features

- **📊 Equities** — 34 NSE-listed counters across every sector, with candlestick charts, fundamentals (P/E, P/B, EPS, dividend yield) and sortable screening.
- **🏦 Treasury Bonds** — FXD & tax-free infrastructure bonds (IFB), a sovereign yield curve, coupon schedules, and clean/dirty pricing.
- **₿ Crypto** — 20 assets (BTC, ETH, USDT & more), KES-denominated, tradable 24/7 from your wallet.
- **📈 Indices** — NSE 20, NSE 25, NASI & NSE 10 with historical charts.
- **⏰ Optimal Trading Hours** — liquidity intensity by hour (EAT), market session status, and trading windows tuned to East Africa.
- **💼 Portfolio** — live mark-to-market P&L, allocation analytics (by holding & sector), holdings across all asset classes, and a full transaction history.
- **📱 M-Pesa Wallet** — fund your account with M-Pesa (Daraja STK Push), then buy/sell stocks, bonds and crypto with instant settlement.
- **🔎 Command Palette** (⌘K) — search every equity, bond, index and crypto.
- **📰 News Wire** — Kenyan market headlines from the East African press.
- **💱 FX Desk** — KES rates vs USD, EUR, GBP, UGX, TZS.

---

## 🛠 Tech Stack

- **Next.js 16** (App Router, React Server Components)
- **PostgreSQL** + **Drizzle ORM**
- **Tailwind CSS v4** (custom dark terminal theme)
- **Safaricom Daraja API** (M-Pesa STK Push)
- Custom SVG charts (no heavy charting libraries)

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example and point it at your Postgres instance:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

### 3. Set up the database

```bash
# create the schema
npx drizzle-kit push

# seed NSE equities, bonds, crypto, indices, FX & news
npx tsx src/db/run.ts
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📱 M-Pesa Integration (Daraja STK Push)

The wallet runs in **simulation mode** by default (payments auto-confirm for demo purposes). To go **live** with real Safaricom Daraja payments, add these to `.env`:

```env
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

Get these credentials from the [Safaricom Daraja Portal](https://developer.safaricom.co.ke/). The terminal automatically switches from simulation → live mode when credentials are present.

---

## 📂 Project Structure

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── api/mpesa/callback/   # Daraja STK Push callback handler
│   ├── stocks/  bonds/  crypto/  indices/
│   ├── markets/  portfolio/  watchlist/  news/
│   ├── trading-hours/  about/
│   └── actions.ts  mpesa-actions.ts   # server actions
├── components/           # UI: charts, nav, trade tickets, panels
├── db/
│   ├── schema.ts         # Drizzle schema (stocks, bonds, crypto, mpesa…)
│   ├── queries.ts        # data-access layer
│   ├── seed.ts           # market data generator
│   └── ensure.ts         # auto-seed safety net
└── lib/
    ├── mpesa.ts          # Daraja STK Push client
    ├── trading-hours.ts  # EAT liquidity model
    └── format.ts         # KES / number formatters
```

---

## ⚠️ Disclaimer

Soko Terminal uses **simulated market data** for demonstration. It is for educational and informational purposes only and does **not** constitute investment advice or executed brokerage orders. Always do your own research.

---

## 📄 License

MIT
