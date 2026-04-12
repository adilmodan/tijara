# Tijara -- Technical Documentation & AI Context

> This file is the single source of truth for any AI agent working on this project.
> It covers architecture, algorithms, file purposes, code style, and conventions.

## What This Is

Tijara is a Shari'ah compliance engine built on AAOIFI Standards (2017 Edition). It screens public equities, computes Zakah obligations, and provides reference documentation for Islamic finance standards. Built by Modan Financial Group.

**Live:** https://tijara-five.vercel.app

---

## Repository Layout

```
tijara/
├── aaoifi/                        # Python package (batch scripts + tests)
│   ├── __init__.py                # Exports: screen_stock, screen_contract, compute_zakah
│   ├── constants.py               # AAOIFI thresholds & prohibited keyword lists
│   ├── models.py                  # Pydantic models (CompanyFinancials, Violation, etc.)
│   ├── qualitative.py             # Sector screening -- binary hard stop (Module I)
│   ├── quantitative.py            # Financial ratio screening (Module II)
│   ├── tangibility.py             # Asset composition check (Module III)
│   ├── contractual.py             # Musharakah/Mudarabah validation (SS 12/13)
│   ├── zakah.py                   # Zakah computation (SS 35/50)
│   ├── screener.py                # Pipeline orchestrator (screen_stock, screen_financials)
│   └── data.py                    # yfinance data fetcher + gold price API
├── web/                           # Next.js 14 App Router (deployed to Vercel)
│   ├── app/
│   │   ├── layout.tsx             # Root HTML shell, metadata, atmospheric layers
│   │   ├── page.tsx               # Main SPA -- 4 tabs: Screening, Zakah, Standards, About
│   │   ├── globals.css            # ALL styling -- CSS variables, dark/light theming, components
│   │   ├── fast/
│   │   │   └── page.tsx           # Hidden /fast route -- DB-only screening, no Yahoo calls
│   │   ├── api/
│   │   │   ├── screen/route.ts    # POST: 3-tier caching + Yahoo Finance auth + screening
│   │   │   └── subscribe/route.ts # POST: newsletter email signup
│   │   ├── components/
│   │   │   ├── StockScreener.tsx   # Ticker search + manual input, cooldown, results display
│   │   │   ├── ZakahCalculator.tsx # Zakah computation UI (gold/silver/agriculture)
│   │   │   ├── Standards.tsx       # 5 expandable AAOIFI standard cards with SVG diagrams
│   │   │   ├── About.tsx           # Algorithm explanation, data sources, contact
│   │   │   ├── NewsletterPopup.tsx # Email signup modal (8s delay, localStorage dismiss)
│   │   │   ├── ViolationList.tsx   # Shared violation row renderer
│   │   │   ├── ThemeToggle.tsx     # Dark/light toggle (localStorage: tijara-theme)
│   │   │   └── LegalLayout.tsx     # Shared layout for /privacy, /terms, /cookies
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   └── cookies/page.tsx
│   ├── lib/
│   │   ├── engine.ts              # Full screening + Zakah logic (TypeScript port of Python)
│   │   ├── types.ts               # TypeScript interfaces mirroring Python models
│   │   ├── constants.ts           # AAOIFI thresholds -- single source of truth for frontend
│   │   └── supabase.ts            # Supabase client (returns null if no credentials)
│   └── public/                    # logo.png, logo-sm.png, favicons
├── tests/                         # Python pytest suite (6 test files)
├── docs/
│   ├── DOCS.md                    # This file
│   └── Shariaa-Standards-ENG.pdf  # AAOIFI reference (local only, gitignored)
├── cache_all_screenings.py        # Batch: screen ~8000 US tickers into Supabase
├── refresh_quarterly.py           # Quarterly: re-screen stale tickers after earnings
├── pyproject.toml                 # Python package config
└── README.md
```

---

## Architecture

Two implementations producing identical compliance verdicts:

- **Python** (`aaoifi/`) -- used by batch screening scripts + tests
- **TypeScript** (`web/lib/engine.ts`) -- used by the Next.js web app

### Web App Data Flow

```
POST /api/screen(ticker)
  ├── Tier 1: screening_cache (< 24h) → return cached report, 0 Yahoo calls
  ├── Tier 2: stock_screenings DB + live price → 1 lightweight Yahoo call
  └── Tier 3: full Yahoo Finance fetch → 2 parallel API calls

Zakah & contract validation: computed client-side in browser (no API call)
```

### Key Decisions

- **Single API route** (`/api/screen`). Zakah runs client-side in `lib/engine.ts`.
- **3-tier caching** minimizes Yahoo Finance calls. Supabase optional -- app works without it.
- **Binary compliance** only: COMPLIANT or NON-COMPLIANT. No scoring or "maybe."
- **CSS variables** for theming (not Tailwind `dark:`). Theme controlled by `data-theme` attribute on `<html>`.
- **No component library**. Custom CSS classes defined in `globals.css`.
- **Lazy tab mounting** -- components unmount on tab switch (`{activeTab === 'stock' && <StockScreener />}`).
- **Fast mode** (`/fast`) -- hidden page, DB-only screening. Passes `fast: true` to API, skips Yahoo price fetch and Tier 3 fallback. Shows `screened_at` timestamp.
- **Prebuilt Vercel deploy** -- remote build fails on native modules.

---

## Screening Algorithm

### Module I: Qualitative Sector Screening (Hard Stop)

**Code:** `qualitative.py` / `engine.ts → screenSector()`

Sector/industry checked against prohibited keywords. Any match = immediate NON-COMPLIANT, no further screening.

**Prohibited categories:** Banking, insurance, mortgage, lending, consumer finance, asset management, capital markets, alcohol (brewery/distillery/winery), pork (swine/ham/bacon), gambling (casino/betting/lottery), tobacco.

- `PROHIBITED_INDUSTRY_KEYWORDS` -- exact match after `.toLowerCase()`
- `PROHIBITED_SECTOR_KEYWORDS` -- substring match

### Module II: Quantitative Ratios (SS 21)

**Code:** `quantitative.py` / `engine.ts → screenDebt(), screenInterestDeposits(), screenProhibitedIncome()`

All three checked independently (collect all violations, not short-circuit):

| Ratio | Formula | Threshold |
|-------|---------|-----------|
| Debt | Total Debt / Market Cap | <= 30% |
| Interest Deposits | Interest-Bearing Deposits / Market Cap | <= 30% |
| Prohibited Income | Prohibited Income / Total Income | <= 5% |

### Module III: Tangibility (SS 21)

**Code:** `tangibility.py` / `engine.ts → screenTangibility()`

```
Tangible Ratio = 1 - (Cash + Receivables) / Total Assets >= 30%
```

Prevents cash shells (de facto currency exchange = Riba).

### Zakah (SS 35/50)

**Code:** `zakah.py` / `engine.ts → computeZakah()`

- Nisab = 85g gold x gold price per gram
- Business/trade = 2.5%, Rain-fed agriculture = 10%, Mechanical irrigation = 5%

---

## Yahoo Finance Integration

**Auth flow (crumb system):**
1. GET `https://fc.yahoo.com` (redirect: manual) → extract `set-cookie`
2. GET `https://query2.finance.yahoo.com/v1/test/getcrumb` with cookie + UA → crumb string
3. Use crumb as query param on all subsequent calls

**Critical:** Crumb cached 10 min. Yahoo correlates UA + cookie -- same UA must be reused. On auth failure, cache cleared for NEXT request (never retry immediately).

**Tier 2 (price only):** `quoteSummary?modules=price` (~2-5KB response)
**Tier 3 (full):** `quoteSummary?modules=assetProfile,financialData,incomeStatementHistory,price` + `fundamentals-timeseries` (17 fields) in parallel

**Field mapping (Yahoo → CompanyFinancials):**
| Field | Primary Source | Fallback |
|-------|---------------|----------|
| `market_cap` | `price.marketCap.raw` | `financialData.marketCap.raw` |
| `total_debt` | `annualTotalDebt` | `financialData.totalDebt.raw` |
| `cash` | `annualCashAndCashEquivalents` | `financialData.totalCash.raw` |
| `total_assets` | `annualTotalAssets` | `quarterlyTotalAssets` |
| `receivables` | `annualAccountsReceivable` | `annualNetReceivables`, `quarterlyAccountsReceivable` |
| `interest_bearing_deposits` | `annualOtherShortTermInvestments + annualLongTermInvestments` | `annualShortTermInvestments + annualInvestmentsAndAdvances` |
| `prohibited_income` | `annualInterestIncome` | `annualInterestIncomeNonOperating`, `netInterestIncome + abs(interestExpense)`, `annualNetNonOperatingInterestIncomeExpense` |
| `total_income` | `incomeStatementHistory.totalRevenue.raw` | `annualTotalRevenue`, `financialData.totalRevenue.raw` |

**Rate limiting:** Host alternation (`query2` ↔ `query1`), 1.5s delay on retry, 3s client-side cooldown (skipped on cache hits).

---

## Database (Supabase -- Optional)

All Supabase queries guard with `if (!supabase) return null`. App works fully without it.

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `screening_cache` | Hot cache for API route (24h TTL) | `ticker PK, report JSONB, financials JSONB, cached_at` |
| `stock_screenings` | Batch-populated wide table | ~280 columns: `yf_*` (.info), `bs_*` (balance sheet), `is_*` (income), `cf_*` (cashflow), screening ratios, `raw_quarterly JSONB` |
| `mailing_list` | Newsletter email collection | `email UNIQUE, subscribed_at` |

---

## Type System (`lib/types.ts`)

```typescript
ComplianceStatus = 'COMPLIANT' | 'NON-COMPLIANT'

Violation { violated_standard, requirement, input_value, compliance_delta }
ScreeningResult { status, violations[] }

CompanyFinancials {
  ticker, sector, industry, market_cap, total_debt,
  interest_bearing_deposits, prohibited_income, prohibited_income_source,
  total_income, cash, receivables, total_assets
}

FullScreeningReport {
  ticker, status, financials,
  qualitative, quantitative, tangibility,  // ScreeningResult | null
  violations[]  // aggregated from all modules
}

ZakahInput { liquid_assets, gold_weight_grams, silver_weight_grams,
             gold_price_per_gram, silver_price_per_gram, asset_type, irrigation_type }
ZakahResult { eligible, nisab_value, net_assets, liquid_assets,
              gold_value, silver_value, rate, zakah_due }
```

---

## Constants (`lib/constants.ts` + `aaoifi/constants.py`)

All thresholds centralized. Components and engine import from these files -- never hardcode.

| Constant | Value | Standard |
|----------|-------|----------|
| DEBT_THRESHOLD | 0.30 | SS (21) |
| INTEREST_DEPOSIT_THRESHOLD | 0.30 | SS (21) |
| PROHIBITED_INCOME_CAP | 0.05 | SS (21) |
| MIN_TANGIBILITY | 0.30 | SS (21) |
| GOLD_NISAB_GRAMS | 85 | SS (35) |
| ZAKAH_RATE_BUSINESS | 0.025 | SS (35) |
| ZAKAH_RATE_RAIN_FED | 0.10 | SS (50) |
| ZAKAH_RATE_MECHANICAL | 0.05 | SS (50) |

---

## Design System & UI

**Brand:** Tijara (تجارة) = "trade." Authority through restraint. Binary gate, never "maybe."

**Dark theme (default):** Navy `#0a0f1a`, ivory text `#f5f0e8`, gold accent `#c9a84c`
**Light theme:** Cream `#f5f2ec`, dark text `#1a1610`, muted gold `#8a7230`
**Compliant:** Teal `#2a9d8f` / `#5eead4`
**Non-compliant:** Crimson `#c0392b` / `#fca5a5`

**Fonts:** Cormorant Garamond (display/headings) + Outfit (body/UI). Loaded via Google Fonts in globals.css.

**CSS variable groups:**
- `--bg-primary/secondary/tertiary/card/input` -- background hierarchy
- `--text-primary/secondary/muted/faint/ghost` -- text opacity hierarchy
- `--gold/gold-light/gold-dark` -- accent
- `--teal/teal-text`, `--crimson/crimson-text` -- status colors
- `--border-primary/hover` -- borders

**Themed utility classes (use these, not hardcoded colors):**
`.text-heading`, `.text-body`, `.text-label`, `.text-dim`, `.text-ghost`, `.text-accent`, `.text-pass`, `.text-fail`

**Component classes:**
`.card` (glassmorphism), `.input-field`, `.btn-primary`, `.btn-cooldown`, `.badge-compliant`, `.badge-non-compliant`, `.violation-row`, `.tab`, `.tab.active`, `.mode-btn-active`, `.mode-btn-inactive`

**Atmospheric layers:** `.geometric-bg` (octagonal pattern, 3% opacity) + `.grain-overlay` (noise texture). Both `position: fixed`, `pointer-events: none`.

**Animations:** `.animate-fade-in` (fadeIn 0.4s), `.standard-expand-content` (max-height transition), `@keyframes slideIn`, `@keyframes popupSlideIn`

---

## Deployment

```bash
cd web
npm run build
npx vercel build --yes --prod && vercel deploy --prebuilt --prod
```

**Vercel env vars** (both optional):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Batch Scripts

```bash
export SUPABASE_URL=... SUPABASE_KEY=...

# Initial: screen all ~8000 US tickers (~65 min)
uv run python cache_all_screenings.py

# Quarterly refresh (re-screen stale tickers)
uv run python refresh_quarterly.py --stale-days 90
uv run python refresh_quarterly.py --full
```

Both import from the `aaoifi` Python package. `refresh_quarterly.py` imports `screen_and_store()` from `cache_all_screenings.py`.

---

## Code Style

- No `any` types -- use `unknown` for catches, `Record<string, any>` only for Yahoo's untyped responses
- Error handling: `catch (err: unknown)` + `err instanceof Error ? err.message : 'fallback'`
- Comments explain **why**, not **what**
- CSS classes from `globals.css` over inline styles. No `style={{ }}` except dynamic values (animation delays)
- All thresholds from `lib/constants.ts`, never hardcoded
- `'use client'` on every component (all use hooks)
- No emojis in code or UI unless explicitly requested
