# Tijara

**Live at [tijara-five.vercel.app](https://tijara-five.vercel.app/)**

A Shari'ah compliance screening engine built on [AAOIFI](https://aaoifi.com/) Standards (2017 Edition). Screens public equities, computes Zakah obligations, and provides reference documentation for Islamic finance standards.

Built by **Modan Financial Group**.

## What It Does

### Equity Screening
Evaluates whether a stock complies with Islamic finance principles through a multi-stage pipeline:

1. **Qualitative screening** -- filters prohibited sectors like banking, alcohol, gambling, pork (hard stop)
2. **Quantitative screening** -- checks debt ratio (<=30%), interest-bearing deposits (<=30%), prohibited income (<=5%)
3. **Tangibility check** -- validates tangible assets >= 30% of total assets

### Zakah Calculator
Computes Islamic charitable tax obligations based on liquid assets, gold/silver holdings, and asset type (business, agriculture).

### Standards Reference
Interactive cards explaining each AAOIFI standard enforced: SS (12), SS (13), SS (21), SS (35), SS (50).

## Architecture

```
tijara/
├── aaoifi/                     # Python screening engine (library + CLI)
│   ├── models.py               # Pydantic data models
│   ├── constants.py            # AAOIFI thresholds & prohibited keywords
│   ├── qualitative.py          # Sector screening (Module I)
│   ├── quantitative.py         # Financial ratio screening (Module II)
│   ├── tangibility.py          # Asset composition check (Module III)
│   ├── contractual.py          # Musharakah/Mudarabah validation (SS 12/13)
│   ├── zakah.py                # Zakah computation (SS 35/50)
│   ├── screener.py             # Pipeline orchestrator
│   └── data.py                 # yfinance + gold price data fetcher
├── web/                        # Next.js 14 frontend (deployed to Vercel)
│   ├── app/
│   │   ├── page.tsx            # Main SPA with tab navigation
│   │   ├── api/screen/route.ts # Yahoo Finance auth + 3-tier caching + screening
│   │   ├── api/subscribe/      # Newsletter signup endpoint
│   │   └── components/         # StockScreener, ZakahCalculator, Standards, About, etc.
│   └── lib/
│       ├── engine.ts           # Full screening logic (TypeScript port)
│       ├── types.ts            # TypeScript interfaces
│       ├── constants.ts        # AAOIFI thresholds
│       └── supabase.ts         # Supabase client (optional)
├── tests/                      # Python pytest suite
├── docs/                       # Project documentation
├── cache_all_screenings.py     # Batch: screen all ~8000 US tickers into Supabase
└── refresh_quarterly.py        # Quarterly: re-screen stale tickers after earnings
```

## Data Pipeline

### 3-Tier Caching (Web App)

When a user searches a ticker, the API route checks three sources in order:

| Tier | Source | TTL | Yahoo API Calls | Speed |
|------|--------|-----|-----------------|-------|
| 1 | `screening_cache` (hot cache) | 24 hours | 0 | Instant |
| 2 | `stock_screenings` (batch DB) | -- | 1 (price only) | Fast |
| 3 | Full Yahoo Finance fetch | -- | 2 (full) | Slow |

**Tier 2** uses stored fundamentals (debt, cash, assets, etc.) from the batch database, fetches only the live market cap from Yahoo, and re-runs the screening engine. This means the compliance status reflects current market conditions while avoiding expensive full API calls.

### Batch Scripts

**`cache_all_screenings.py`** -- Pre-screens all ~8000 US public equities from SEC EDGAR. Stores ~280 individual columns per ticker (yfinance `.info`, balance sheet, income statement, cash flow, plus AAOIFI screening results). Designed to run unattended; resumable after interruption.

**`refresh_quarterly.py`** -- Re-screens stale tickers after earnings reports. Three modes:
```bash
# Re-screen tickers older than 90 days (default)
uv run python refresh_quarterly.py

# Custom threshold
uv run python refresh_quarterly.py --stale-days 45

# Re-screen everything
uv run python refresh_quarterly.py --full
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.4, Python 3.10+ |
| Styling | Tailwind CSS + CSS custom properties (dark/light themes) |
| Data Source | Yahoo Finance (crumb-authenticated) |
| Database | Supabase (PostgreSQL) -- caching + newsletter |
| Python Libs | Pydantic, yfinance, requests |
| Hosting | Vercel (prebuilt deploy) |
| Fonts | Cormorant Garamond (display) + Outfit (body) |

## Getting Started

### Web App (Frontend)

```bash
cd web
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

### Python Engine

```bash
uv sync
uv run pytest           # Run tests
uv run python -m aaoifi # CLI usage
```

### Supabase Setup (Optional)

The web app works without Supabase -- it falls back to direct Yahoo Finance calls. To enable caching:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create a `screening_cache` table:
   ```sql
   CREATE TABLE screening_cache (
     ticker TEXT PRIMARY KEY,
     report JSONB NOT NULL,
     financials JSONB NOT NULL,
     cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```
3. Create a `mailing_list` table (for newsletter):
   ```sql
   CREATE TABLE mailing_list (
     id BIGSERIAL PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     subscribed_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
4. Copy your project URL and service role key into `web/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Batch Screening

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_KEY=your-service-role-key

# Initial full run (~65 min for ~8000 tickers)
uv run python cache_all_screenings.py

# Quarterly refresh after earnings season
uv run python refresh_quarterly.py --stale-days 90
```

## AAOIFI Standards Reference

| Standard | Topic | What Tijara Enforces |
|----------|-------|---------------------|
| SS (12) | Musharakah | Profit = % of net profit; loss = capital ratio |
| SS (13) | Mudarabah | Profit = % of net profit (not fixed sum or % of capital) |
| SS (21) | Financial Paper | Sector filter + debt <=30% + deposits <=30% + prohibited income <=5% + tangibility >=30% |
| SS (35) | Zakah | Nisab = 85g gold; business rate = 2.5% |
| SS (50) | Agricultural Zakah | Rain-fed = 10%; mechanical irrigation = 5% |

## Deployment

The app deploys to Vercel via prebuilt output (remote builds fail on native module compilation):

```bash
cd web
npm run build
npx vercel build --yes --prod
npx vercel deploy --prebuilt --prod
```

See `docs/deployment.md` for details.

## License

MIT
