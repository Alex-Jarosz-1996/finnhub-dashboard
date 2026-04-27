import { useState, useEffect } from 'react'
import { fetchAll } from './api.js'
import SearchBar from './components/SearchBar.jsx'
import QuoteCard from './components/SingleView/QuoteCard.jsx'
import MetricsGroup from './components/SingleView/MetricsGroup.jsx'
import ReportedFinancials from './components/SingleView/ReportedFinancials.jsx'
import CompareSearchBar from './components/CompareView/CompareSearchBar.jsx'
import CompareTable from './components/CompareView/CompareTable.jsx'

const STORAGE_KEY = 'finnhub_compare_tickers'
const MAX_COMPARE = 10

const GROUP_LABELS = {
  valuation: 'Valuation',
  returns: 'Returns',
  margins: 'Margins',
  ratios: 'Liquidity Ratios',
  debt: 'Debt',
  equity: 'Equity',
  ev: 'Enterprise Value',
  cashFlow: 'Cash Flow',
}

const s = {
  app: { maxWidth: '960px', margin: '0 auto', padding: '32px 20px' },
  title: { fontSize: '22px', fontWeight: 800, color: '#e2e8f0', marginBottom: '24px' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '28px' },
  tab: {
    padding: '8px 20px',
    border: '1px solid #2d3348',
    borderRadius: '8px',
    background: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  tabActive: { background: '#3b82f6', borderColor: '#3b82f6', color: '#fff' },
  error: {
    padding: '12px 16px',
    background: '#1e1a2e',
    border: '1px solid #7f1d1d',
    borderRadius: '8px',
    color: '#f87171',
    marginBottom: '20px',
    fontSize: '14px',
  },
  loading: { color: '#64748b', fontSize: '14px', marginBottom: '20px' },
  empty: { color: '#475569', fontSize: '14px', marginTop: '40px', textAlign: 'center' },
}

export default function App() {
  const [tab, setTab] = useState('single')

  const [singleLoading, setSingleLoading] = useState(false)
  const [singleError, setSingleError] = useState(null)
  const [quote, setQuote] = useState(null)
  const [financials, setFinancials] = useState(null)

  const [compareTickers, setCompareTickers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
    catch { return [] }
  })
  const [compareData, setCompareData] = useState({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareTickers))
  }, [compareTickers])

  useEffect(() => {
    compareTickers.forEach((sym) => {
      if (!compareData[sym]) loadCompareTicker(sym)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSingleSearch = async (symbol) => {
    setSingleLoading(true)
    setSingleError(null)
    setQuote(null)
    setFinancials(null)
    try {
      const [q, f] = await fetchAll(symbol)
      setQuote(q)
      setFinancials(f)
    } catch (e) {
      setSingleError(e.message)
    } finally {
      setSingleLoading(false)
    }
  }

  const loadCompareTicker = async (symbol) => {
    setCompareData((prev) => ({ ...prev, [symbol]: null }))
    try {
      const [q, f] = await fetchAll(symbol)
      setCompareData((prev) => ({ ...prev, [symbol]: { quote: q, financials: f } }))
    } catch (e) {
      setCompareData((prev) => ({ ...prev, [symbol]: { error: e.message } }))
    }
  }

  const handleCompareAdd = (symbol) => {
    if (compareTickers.includes(symbol) || compareTickers.length >= MAX_COMPARE) return
    setCompareTickers((prev) => [...prev, symbol])
    loadCompareTicker(symbol)
  }

  const handleCompareRemove = (symbol) => {
    setCompareTickers((prev) => prev.filter((s) => s !== symbol))
    setCompareData((prev) => { const next = { ...prev }; delete next[symbol]; return next })
  }

  return (
    <div style={s.app}>
      <div style={s.title}>Finnhub Dashboard</div>

      <div style={s.tabs}>
        {[['single', 'Single Ticker'], ['compare', 'Compare']].map(([key, label]) => (
          <button
            key={key}
            style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'single' && (
        <div>
          <SearchBar onSearch={handleSingleSearch} />
          {singleLoading && <div style={s.loading}>Loading...</div>}
          {singleError && <div style={s.error}>{singleError}</div>}
          {quote && <QuoteCard quote={quote} />}
          {financials && (
            <>
              {Object.entries(financials.metrics).map(([group, data]) => (
                <MetricsGroup key={group} title={GROUP_LABELS[group] || group} data={data} />
              ))}
              <ReportedFinancials reported={financials.reported} />
            </>
          )}
          {!singleLoading && !quote && !singleError && (
            <div style={s.empty}>Search for a ticker to get started.</div>
          )}
        </div>
      )}

      {tab === 'compare' && (
        <div>
          <CompareSearchBar onAdd={handleCompareAdd} count={compareTickers.length} max={MAX_COMPARE} />
          {compareTickers.length === 0 ? (
            <div style={s.empty}>Add up to {MAX_COMPARE} tickers to compare them.</div>
          ) : (
            <CompareTable tickers={compareTickers} data={compareData} onRemove={handleCompareRemove} />
          )}
        </div>
      )}
    </div>
  )
}
