import { useState, useRef, useEffect } from 'react'
import styles from './ReportedFinancials.module.css'

function fmtNum(n) {
  if (n === null || n === undefined) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toFixed(2)
}

function ReportTable({ title, rows }) {
  const collapseKey = `finnhub_group_collapsed_${title}`
  const hiddenKey = `finnhub_hidden_metrics_${title}`

  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(collapseKey)) ?? false }
    catch { return false }
  })

  const [hiddenLabels, setHiddenLabels] = useState(() => {
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

  if (!rows || rows.length === 0) return null

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(collapseKey, JSON.stringify(next))
  }

  const toggleLabel = (label) => {
    setHiddenLabels((prev) => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      localStorage.setItem(hiddenKey, JSON.stringify([...next]))
      return next
    })
  }

  const toggleAll = (allLabels) => {
    const allHidden = allLabels.every((l) => hiddenLabels.has(l))
    setHiddenLabels((prev) => {
      const next = new Set(prev)
      if (allHidden) allLabels.forEach((l) => next.delete(l))
      else allLabels.forEach((l) => next.add(l))
      localStorage.setItem(hiddenKey, JSON.stringify([...next]))
      return next
    })
  }

  const allLabels = rows.map((r) => r.label || r.concept)
  const visibleRows = rows.filter((r) => !hiddenLabels.has(r.label || r.concept))
  const allHidden = allLabels.every((l) => hiddenLabels.has(l))
  const someHidden = allLabels.some((l) => hiddenLabels.has(l))

  return (
    <div className={styles.section}>
      <div className={styles.titleRow}>
        <button
          className={styles.collapseBtn}
          onClick={toggleCollapse}
          aria-expanded={!collapsed}
          aria-label={`Toggle ${title}`}
        >
          <span className={styles.chevron}>{collapsed ? '▶' : '▼'}</span>
          <span className={styles.title}>{title}</span>
        </button>
        <div ref={panelRef} className={styles.panelWrapper}>
          <button
            className={styles.filterBtn}
            onClick={() => setShowPanel((v) => !v)}
            aria-label={`Filter ${title} metrics`}
          >
            ⚙
          </button>
          {showPanel && (
            <div className={styles.panel}>
              <label className={styles.panelLabelAll}>
                <input
                  type="checkbox"
                  checked={!allHidden}
                  ref={(el) => { if (el) el.indeterminate = someHidden && !allHidden }}
                  onChange={() => toggleAll(allLabels)}
                />
                All
              </label>
              <div className={styles.panelDivider} />
              {rows.map((row) => {
                const label = row.label || row.concept
                return (
                  <label key={label} className={styles.panelLabel}>
                    <input
                      type="checkbox"
                      checked={!hiddenLabels.has(label)}
                      onChange={() => toggleLabel(label)}
                    />
                    {label}
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {!collapsed && visibleRows.length > 0 && (
        <table className={styles.table}>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr key={i}>
                <td className={styles.labelCell}>{row.label || row.concept}</td>
                <td className={styles.valueCell}>{fmtNum(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function ReportedFinancials({ reported }) {
  return (
    <>
      <ReportTable title="Balance Sheet" rows={reported.balanceSheet} />
      <ReportTable title="Income Statement" rows={reported.incomeStatement} />
      <ReportTable title="Cash Flow Statement" rows={reported.cashFlowStatement} />
    </>
  )
}
