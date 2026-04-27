import { useState, useRef, useEffect } from 'react'
import styles from './CompareTable.module.css'

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
      <div className={styles.toolbar}>
        <div ref={panelRef} className={styles.panelWrapper}>
          <button className={styles.colBtn} onClick={() => setShowPanel((v) => !v)}>
            Columns {showPanel ? '▲' : '▼'}
          </button>
          {showPanel && (
            <div className={styles.panel}>
              {toggleableCols.map((col) => (
                <label key={col.key} className={styles.panelLabel}>
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

      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} />
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  className={`${styles.th} ${sortKey === col.key ? styles.thActive : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}{sortKey === col.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((symbol) => {
              const entry = data[symbol]

              if (!entry) {
                return (
                  <tr key={symbol}>
                    <td className={styles.td}><button className={styles.removeBtn} onClick={() => onRemove(symbol)}>×</button></td>
                    <td className={`${styles.td} ${styles.tdSymbol}`}>{symbol}</td>
                    <td colSpan={visibleCols.length - 1} className={`${styles.td} ${styles.loading}`}>Loading...</td>
                  </tr>
                )
              }

              if (entry.error) {
                return (
                  <tr key={symbol}>
                    <td className={styles.td}><button className={styles.removeBtn} onClick={() => onRemove(symbol)}>×</button></td>
                    <td className={`${styles.td} ${styles.tdSymbol}`}>{symbol}</td>
                    <td colSpan={visibleCols.length - 1} className={`${styles.td} ${styles.error}`}>{entry.error}</td>
                  </tr>
                )
              }

              return (
                <tr key={symbol}>
                  <td className={styles.td}><button className={styles.removeBtn} onClick={() => onRemove(symbol)}>×</button></td>
                  {visibleCols.map((col) => (
                    <td
                      key={col.key}
                      className={`${styles.td} ${col.key === 'symbol' ? styles.tdSymbol : ''}`}
                    >
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
