import { useState, useRef, useEffect } from 'react'

const s = {
  section: { marginBottom: '16px' },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '6px',
  },
  collapseBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    userSelect: 'none',
    flex: 1,
    background: 'none',
    border: 'none',
    padding: 0,
    textAlign: 'left',
  },
  title: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  chevron: { fontSize: '9px', color: '#64748b' },
  filterBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '0 2px',
    lineHeight: 1,
  },
  panelWrapper: { position: 'relative' },
  panel: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
    background: '#1e2130',
    border: '1px solid #2d3348',
    borderRadius: '8px',
    padding: '10px 14px',
    zIndex: 10,
    minWidth: '200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  panelDivider: { borderTop: '1px solid #2d3348', margin: '2px 0' },
  panelLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#e2e8f0',
  },
  panelLabelAll: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#1e2130',
    border: '1px solid #2d3348',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  labelCell: { padding: '9px 16px', color: '#94a3b8', fontSize: '13px', width: '55%' },
  valueCell: {
    padding: '9px 16px',
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: 600,
    textAlign: 'right',
  },
}

const LABELS = {
  '52WeekHigh': '52-Week High',
  '52WeekLow': '52-Week Low',
  marketCap: 'Market Cap',
  dividendYieldTTM: 'Dividend Yield (TTM)',
  dividendPerShareTTM: 'Dividend Per Share (TTM)',
  epsGrowthTTMYoy: 'EPS Growth TTM YoY',
  peTTM: 'P/E (TTM)',
  psTTM: 'P/S (TTM)',
  pb: 'P/B',
  eps: 'EPS',
  roaTTM: 'ROA (TTM)',
  roeTTM: 'ROE (TTM)',
  roicTTM: 'ROIC (TTM)',
  rotcTTM: 'ROTC (TTM)',
  grossMarginTTM: 'Gross Margin (TTM)',
  netProfitMarginTTM: 'Net Profit Margin (TTM)',
  operatingMarginTTM: 'Operating Margin (TTM)',
  pretaxMarginTTM: 'Pretax Margin (TTM)',
  currentRatio: 'Current Ratio',
  quickRatio: 'Quick Ratio',
  totalDebtToEquity: 'Total Debt / Equity',
  totalDebtToTotalAsset: 'Total Debt / Total Assets',
  totalDebtToTotalCapital: 'Total Debt / Total Capital',
  bookValue: 'Book Value',
  ebitPerShare: 'EBIT Per Share',
  ebitdPerShareTTM: 'EBITD Per Share (TTM)',
  bookValuePerShareAnnual: 'Book Value Per Share (Annual)',
  cashPerShareAnnual: 'Cash Per Share (Annual)',
  enterpriseValue: 'Enterprise Value',
  evEbitdaTTM: 'EV / EBITDA (TTM)',
  evRevenueTTM: 'EV / Revenue (TTM)',
  evFreeCashFlowTTM: 'EV / Free Cash Flow (TTM)',
  cashFlowPerShareAnnual: 'Cash Flow Per Share (Annual)',
  fcfPerShareTTM: 'FCF Per Share (TTM)',
  pfcfTTM: 'P/FCF (TTM)',
  pcfShareTTM: 'P/CF Per Share (TTM)',
  pfcfShareTTM: 'P/FCF Per Share (TTM)',
}

const DOLLAR_KEYS = new Set([
  '52WeekHigh', '52WeekLow', 'dividendPerShareTTM',
  'eps', 'bookValue', 'ebitPerShare', 'ebitdPerShareTTM',
  'bookValuePerShareAnnual', 'cashPerShareAnnual',
  'cashFlowPerShareAnnual', 'fcfPerShareTTM',
  'marketCap', 'enterpriseValue',
])

const PERCENT_KEYS = new Set([
  'dividendYieldTTM', 'epsGrowthTTMYoy',
  'grossMarginTTM', 'netProfitMarginTTM', 'operatingMarginTTM', 'pretaxMarginTTM',
])

const PERCENT_DECIMAL_KEYS = new Set(['roaTTM', 'roeTTM', 'roicTTM', 'rotcTTM'])

function fmtNum(n, key) {
  if (n === null || n === undefined) return '—'
  let value = n
  let suffix = ''
  let prefix = ''

  if (PERCENT_DECIMAL_KEYS.has(key)) {
    value = n * 100
    suffix = '%'
  } else if (PERCENT_KEYS.has(key)) {
    suffix = '%'
  } else if (DOLLAR_KEYS.has(key)) {
    prefix = '$'
  }

  let formatted
  if (Math.abs(value) >= 1e9) formatted = `${(value / 1e9).toFixed(2)}B`
  else if (Math.abs(value) >= 1e6) formatted = `${(value / 1e6).toFixed(2)}M`
  else formatted = value.toFixed(2)

  return `${prefix}${formatted}${suffix}`
}

function formatValue(val, key) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'object' && 'value' in val) {
    const v = val.value
    if (v === null || v === undefined) return '—'
    const formatted = typeof v === 'number' ? fmtNum(v, key) : v
    return val.asOf ? `${formatted} (${val.asOf})` : formatted
  }
  if (typeof val === 'number') return fmtNum(val, key)
  return String(val)
}

export default function MetricsGroup({ title, data }) {
  const collapseKey = `finnhub_group_collapsed_${title}`
  const hiddenKey = `finnhub_hidden_metrics_${title}`

  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(collapseKey)) ?? false }
    catch { return false }
  })

  const [hiddenKeys, setHiddenKeys] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(hiddenKey)) || []) }
    catch { return new Set() }
  })

  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false)
    }
    if (showPanel) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPanel])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(collapseKey, JSON.stringify(next))
  }

  const toggleKey = (key) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      localStorage.setItem(hiddenKey, JSON.stringify([...next]))
      return next
    })
  }

  const toggleAll = (allKeys) => {
    const allHidden = allKeys.every((k) => hiddenKeys.has(k))
    setHiddenKeys((prev) => {
      const next = new Set(prev)
      if (allHidden) allKeys.forEach((k) => next.delete(k))
      else allKeys.forEach((k) => next.add(k))
      localStorage.setItem(hiddenKey, JSON.stringify([...next]))
      return next
    })
  }

  const entries = Object.entries(data).filter(([, v]) => {
    if (v === null || v === undefined) return false
    if (typeof v === 'object' && 'value' in v && v.value === null) return false
    return true
  })

  if (entries.length === 0) return null

  const allKeys = entries.map(([k]) => k)
  const visibleEntries = entries.filter(([k]) => !hiddenKeys.has(k))
  const allHidden = allKeys.every((k) => hiddenKeys.has(k))
  const someHidden = allKeys.some((k) => hiddenKeys.has(k))

  return (
    <div style={s.section}>
      <div style={s.titleRow}>
        <button style={s.collapseBtn} onClick={toggleCollapse} aria-expanded={!collapsed} aria-label={`Toggle ${title}`}>
          <span style={s.chevron}>{collapsed ? '▶' : '▼'}</span>
          <span style={s.title}>{title}</span>
        </button>
        <div ref={panelRef} style={s.panelWrapper}>
          <button
            style={s.filterBtn}
            onClick={() => setShowPanel((v) => !v)}
            aria-label={`Filter ${title} metrics`}
          >
            ⚙
          </button>
          {showPanel && (
            <div style={s.panel}>
              <label style={s.panelLabelAll}>
                <input
                  type="checkbox"
                  checked={!allHidden}
                  ref={(el) => { if (el) el.indeterminate = someHidden && !allHidden }}
                  onChange={() => toggleAll(allKeys)}
                />
                All
              </label>
              <div style={s.panelDivider} />
              {entries.map(([key]) => (
                <label key={key} style={s.panelLabel}>
                  <input
                    type="checkbox"
                    checked={!hiddenKeys.has(key)}
                    onChange={() => toggleKey(key)}
                  />
                  {LABELS[key] || key}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      {!collapsed && visibleEntries.length > 0 && (
        <table style={s.table}>
          <tbody>
            {visibleEntries.map(([key, val], i) => (
              <tr
                key={key}
                style={{ borderBottom: i < visibleEntries.length - 1 ? '1px solid #2d3348' : 'none' }}
              >
                <td style={s.labelCell}>{LABELS[key] || key}</td>
                <td style={s.valueCell}>{formatValue(val, key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
