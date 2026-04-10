# AAOIFI Stock Screening Engine

**Live at [tijara-five.vercel.app](https://tijara-five.vercel.app/)**

A Shari'ah compliance screening engine for stocks, built to validate financial instruments and contracts against [AAOIFI](https://aaoifi.com/) (Accounting and Auditing Organization for Islamic Financial Institutions) standards.

## What It Does

The engine evaluates whether stocks and financial contracts comply with Islamic finance principles through a multi-stage pipeline:

1. **Qualitative screening** — filters prohibited sectors (hard stop)
2. **Quantitative screening** — analyzes debt ratios, interest-bearing deposits, and forbidden income
3. **Tangibility checks** — validates asset composition
4. **Contract validation** — reviews Musharakah/Mudarabah partnership agreements
5. **Zakah computation** — calculates Islamic charitable tax obligations

## Project Structure

```
aaoifi/          # Core Python screening engine
  screener.py    # Orchestration layer
  qualitative.py # Sector-based screening
  quantitative.py# Financial ratio screening
  tangibility.py # Asset composition checks
  contractual.py # Contract validation
  zakah.py       # Zakah calculations
  data.py        # Financial data fetching (yfinance)
  models.py      # Pydantic data models
  report.py      # Reporting utilities
web/             # Next.js frontend
tests/           # pytest test suite
```

## Tech Stack

- **Backend:** Python 3.10+, Pydantic, yfinance
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Testing:** pytest

## Getting Started

### Backend

```bash
uv sync
uv run python -m aaoifi
```

### Frontend

```bash
cd web
npm install
npm run dev
```

## License

MIT
