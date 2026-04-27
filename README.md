# finnhub-dashboard

A stock financial dashboard SPA. FastAPI backend + React frontend.

## Backend

### Setup

```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements-dev.txt
```

Add your Finnhub API key to `.env`:

```
FINNHUB_API_KEY=your_api_key_here
REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
```

### Run

```bash
cd backend
venv/bin/uvicorn main:app --reload --port 8000
```

Interactive docs: `http://localhost:8000/docs`

### Tests

```bash
cd backend
venv/bin/pytest tests/ -v
```

19 tests across three files — no real Finnhub API calls are made:

| File | What it tests |
|------|--------------|
| `tests/test_quote.py` | `GET /api/quote/{symbol}` — happy path, 404, 502 |
| `tests/test_financials.py` | `GET /api/financials/{symbol}` — shape, groups, 404, 502 |
| `tests/test_finnhub_service.py` | Service functions and TTL cache behaviour |

### Kill a stale process on port 8000

```bash
fuser -k 8000/tcp
```

---

## Frontend

### Setup

```bash
cd frontend
npm install
```

### Run

```bash
cd frontend
npm run dev
```

App: `http://localhost:5173`

> The backend must also be running on port 8000 for API calls to work.

### Tests

```bash
cd frontend
npm test
```

36 tests across six files — no backend connection required:

| File | What it tests |
|------|--------------|
| `src/test/SearchBar.test.jsx` | Submit uppercases and trims input, blank input guard, custom placeholder |
| `src/test/QuoteCard.test.jsx` | Symbol display, `$` prefix and two decimals, null fields show `—` |
| `src/test/MetricsGroup.test.jsx` | Dollar/percent/percent_decimal formatting, series `asOf` date, null filtering |
| `src/test/ReportedFinancials.test.jsx` | Section titles, B/M number suffixes, empty sections skipped |
| `src/test/CompareSearchBar.test.jsx` | Uppercase and clear on add, disabled at max, blank input guard |
| `src/test/CompareTable.test.jsx` | Formatting, loading/error states, remove button, ascending/descending sort |

To run in watch mode during development:

```bash
cd frontend
npm run test:watch
```

---

## API Reference

### `GET /api/quote/{symbol}`

Returns the current day's price data for a given ticker.

```bash
curl http://localhost:8000/api/quote/AAPL
```

```json
{
  "symbol": "AAPL",
  "current": 189.50,
  "high": 191.00,
  "low": 187.30,
  "open": 188.00
}
```

---

### `GET /api/financials/{symbol}`

Returns grouped financial metrics and reported financials (balance sheet, income statement, cash flow statement) for a given ticker.

```bash
curl http://localhost:8000/api/financials/AAPL
```

```json
{
  "symbol": "AAPL",
  "metrics": {
    "valuation": {
      "52WeekHigh": 199.62,
      "52WeekLow": 164.08,
      "marketCap": 2950000,
      "peTTM": { "value": 28.4, "asOf": "2024-09-28" },
      "eps":   { "value": 6.57, "asOf": "2024-09-28" }
    },
    "returns": {
      "roeTTM":  { "value": 1.47, "asOf": "2024-09-28" },
      "roaTTM":  { "value": 0.28, "asOf": "2024-09-28" }
    },
    "margins": {
      "grossMarginTTM":     45.96,
      "netProfitMarginTTM": 26.44,
      "operatingMarginTTM": 31.51
    },
    "ratios":   { ... },
    "debt":     { ... },
    "equity":   { ... },
    "ev":       { ... },
    "cashFlow": { ... }
  },
  "reported": {
    "balanceSheet":      [ { "label": "Total Assets", "value": 364980000000 }, ... ],
    "incomeStatement":   [ { "label": "Gross Profit",  "value": 180683000000 }, ... ],
    "cashFlowStatement": [ { "label": "Net Income",    "value": 93736000000 },  ... ]
  }
}
```

**Series fields** (e.g. `peTTM`, `roeTTM`) return an object with the most recent quarterly value and the date it was recorded:
```json
{ "value": 28.4, "asOf": "2024-09-28" }
```

**Metric fields** (e.g. `grossMarginTTM`, `marketCap`) return a plain number.

---

### Error responses

| Status | Meaning |
|--------|---------|
| 404 | Symbol not found or no data available |
| 502 | Upstream Finnhub API error |
