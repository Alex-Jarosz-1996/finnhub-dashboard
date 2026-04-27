import { useState, useRef, useEffect } from 'react'

// format: 'dollar' | 'percent' | 'percent_decimal' | null
const COLUMNS = [
  { key: 'symbol',             label: 'Symbol',          path: null,                                                                         format: null },
  { key: 'current',            label: 'Price',           path: ['quote', 'current'],                                                         format: 'dollar' },
  { key: 'high',               label: 'Day High',        path: ['quote', 'high'],                                                            format: 'dollar' },
  { key: 'low',                label: 'Day Low',         path: ['quote', 'low'],                                                             format: 'dollar' },
  { key: 'marketCap',          label: 'Market Cap',      path: ['financials', 'metrics', 'valuation', 'marketCap'],                          format: 'dollar' },
  { key: 'peTTM',              label: 'P/E (TTM)',       path: ['financials', 'metrics', 'valuation', 'peTTM', 'value'],                     format: null },
  { key: 'pb',                 label: 'P/B',             path: ['financials', 'metrics', 'valuation', 'pb', 'value'],                        format: null },
  { key: 'eps',                label: 'EPS',             path: ['financials', 'metrics', 'valuation', 'eps', 'value'],                       format: 'dollar' },
  { key: 'roeTTM',             label: 'ROE (TTM)',       path: ['financials', 'metrics', 'returns', 'roeTTM', 'value'],                      format: 'percent_decimal' },
  { key: 'roaTTM',             label: 'ROA (TTM)',       path: ['financials', 'metrics', 'returns', 'roaTTM', 'value'],                      format: 'percent_decimal' },
  { key: 'grossMarginTTM',     label: 'Gross Margin',    path: ['financials', 'metrics', 'margins', 'grossMarginTTM'],                       format: 'percent' },
  { key: 'netProfitMarginTTM', label: 'Net Margin',      path: ['financials', 'metrics', 'margins', 'netProfitMarginTTM'],                   format: 'percent' },
  { key: 'totalDebtToEquity',  label: 'D/E',             path: ['financials', 'metrics', 'debt', 'totalDebtToEquity', 'value'],              format: null },
  { key: 'fcfPerShareTTM',     label: 'FCF/Share (TTM)', path: ['financials', 'metrics', 'cashFlow', 'fcfPerShareTTM', 'value'],             format: 'dollar' },
]

const STORAGE_KEY = 'finnhub_hidden_columns'

function loadHidden() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []) }
  catch { return new Set() }
}

function dig(obj, path) {
  return path.reduce((acc, key) => (acc != null ? acc[key] : null), obj)
}

function fmtNum(n, format) {
  if (n === null || n === undefined) return '—'
  let value = format === 'percent_decimal' ? n * 100 : n
  let prefix = format === 'dollar' ? '$' : ''
  let suffix = (format === 'percent' || format === 'percent_decimal') ? '%' : ''
  let formatted
  if (Math.abs(value) >= 1e9) formatted = `${(value / 1e9).toFixed(2)}B`
  else if (Math.abs(value) >= 1e6) formatted = `${(value / 1e6).toFixed(2)}M`
  else formatted = typeof value === 'number' ? value.toFixed(2) : value
  return `${prefix}${formatted}${suffix}`
}

const s = {
  toolbar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', position: 'relative' },
  colBtn: {
    padding: '6px 12px',
    background: '#1e2130',
    border: '1px solid #2d3348',
    borderRadius: '6px',
    color: '#94a3b8',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 600,
  },
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
    minWidth: '180px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  panelLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#e2e8f0',
  },
  wrapper: { overflowX: 'auto' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#1e2130',
    border: '1px solid #2d3348',
    borderRadius: '10px',
    overflow: 'hidden',
    fontSize: '13px',
  },
  th: {
    padding: '10px 12px',
    color: '#94a3b8',
    textAlign: 'left',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #2d3348',
    userSelect: 'none',
  },
  thActive: { color: '#60a5fa' },
  td: { padding: '10px 12px', color: '#e2e8f0', whiteSpace: 'nowrap' },
  tdSymbol: { fontWeight: 700, color: '#60a5fa' },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
    padding: '0 4px',
  },
  loading: { color: '#64748b', fontStyle: 'italic' },
  error: { color: '#f87171' },
}

export default function CompareTable({ tickers, data, onRemove }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [hiddenCols, setHiddenCols] = useState(loadHidden)
  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false)
    }
    if (showPanel) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPanel])

  const toggleCol = (key) => {
    setHiddenCols((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const handleSort = (key) => {
    if (key === 'symbol') return
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  const visibleCols = COLUMNS.filter((c) => !hiddenCols.has(c.key))

  const sorted = [...tickers].sort((a, b) => {
    if (!sortKey) return 0
    const col = COLUMNS.find((c) => c.key === sortKey)
    if (!col?.path) return 0
    const va = dig(data[a], col.path) ?? -Infinity
    const vb = dig(data[b], col.path) ?? -Infinity
    return sortAsc ? va - vb : vb - va
  })

  const toggleableCols = COLUMNS.filter((c) => c.key !== 'symbol')

  return (
    <div>
      <div style={s.toolbar}>
        <div ref={panelRef} style={{ position: 'relative' }}>
          <button style={s.colBtn} onClick={() => setShowPanel((v) => !v)}>
            Columns {showPanel ? '▲' : '▼'}
          </button>
          {showPanel && (
            <div style={s.panel}>
              {toggleableCols.map((col) => (
                <label key={col.key} style={s.panelLabel}>
                  <input
                    type="checkbox"
                    checked={!hiddenCols.has(col.key)}
                    onChange={() => toggleCol(col.key)}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={s.wrapper}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th} />
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  style={{ ...s.th, ...(sortKey === col.key ? s.thActive : {}) }}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}{sortKey === col.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((symbol, i) => {
              const entry = data[symbol]
              const isLast = i === sorted.length - 1
              const rowBorder = isLast ? 'none' : '1px solid #2d3348'
              const td = { ...s.td, borderBottom: rowBorder }

              if (!entry) {
                return (
                  <tr key={symbol}>
                    <td style={td}><button style={s.removeBtn} onClick={() => onRemove(symbol)}>×</button></td>
                    <td style={{ ...td, ...s.tdSymbol }}>{symbol}</td>
                    <td colSpan={visibleCols.length - 1} style={{ ...td, ...s.loading }}>Loading...</td>
                  </tr>
                )
              }

              if (entry.error) {
                return (
                  <tr key={symbol}>
                    <td style={td}><button style={s.removeBtn} onClick={() => onRemove(symbol)}>×</button></td>
                    <td style={{ ...td, ...s.tdSymbol }}>{symbol}</td>
                    <td colSpan={visibleCols.length - 1} style={{ ...td, ...s.error }}>{entry.error}</td>
                  </tr>
                )
              }

              return (
                <tr key={symbol}>
                  <td style={td}><button style={s.removeBtn} onClick={() => onRemove(symbol)}>×</button></td>
                  {visibleCols.map((col) => (
                    <td key={col.key} style={{ ...td, ...(col.key === 'symbol' ? s.tdSymbol : {}) }}>
                      {col.key === 'symbol' ? symbol : fmtNum(dig(entry, col.path), col.format)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
