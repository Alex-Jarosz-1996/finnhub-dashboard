import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../theme.js'

function fmtNum(n) {
  if (n === null || n === undefined) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toFixed(2)
}

function ReportTable({ title, rows }) {
  const theme = useTheme()
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

  const s = {
    section: { marginBottom: '16px' },
    titleRow: { display: 'flex', alignItems: 'center', marginBottom: '6px' },
    collapseBtn: {
      display: 'flex', alignItems: 'center', gap: '6px',
      cursor: 'pointer', userSelect: 'none', flex: 1,
      background: 'none', border: 'none', padding: 0, textAlign: 'left',
    },
    title: {
      fontSize: '11px', fontWeight: 700, color: theme.textSecondary,
      textTransform: 'uppercase', letterSpacing: '0.08em',
    },
    chevron: { fontSize: '9px', color: theme.textMuted },
    filterBtn: {
      background: 'none', border: 'none', color: theme.textMuted,
      cursor: 'pointer', fontSize: '13px', padding: '0 2px', lineHeight: 1,
    },
    panelWrapper: { position: 'relative' },
    panel: {
      position: 'absolute', top: '100%', right: 0, marginTop: '4px',
      background: theme.bgCard, border: `1px solid ${theme.border}`,
      borderRadius: '8px', padding: '10px 14px', zIndex: 10,
      minWidth: '220px', maxHeight: '320px', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: '8px',
    },
    panelDivider: { borderTop: `1px solid ${theme.border}`, margin: '2px 0' },
    panelLabel: {
      display: 'flex', alignItems: 'center', gap: '8px',
      cursor: 'pointer', fontSize: '13px', color: theme.textPrimary,
    },
    panelLabelAll: {
      display: 'flex', alignItems: 'center', gap: '8px',
      cursor: 'pointer', fontSize: '12px', fontWeight: 700,
      color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em',
    },
    table: {
      width: '100%', borderCollapse: 'collapse',
      background: theme.bgCard, border: `1px solid ${theme.border}`,
      borderRadius: '10px', overflow: 'hidden',
    },
    labelCell: { padding: '9px 16px', color: theme.textSecondary, fontSize: '13px', width: '55%' },
    valueCell: {
      padding: '9px 16px', color: theme.textPrimary,
      fontSize: '13px', fontWeight: 600, textAlign: 'right',
    },
  }

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
                  onChange={() => toggleAll(allLabels)}
                />
                All
              </label>
              <div style={s.panelDivider} />
              {rows.map((row) => {
                const label = row.label || row.concept
                return (
                  <label key={label} style={s.panelLabel}>
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
        <table style={s.table}>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={i}
                style={{ borderBottom: i < visibleRows.length - 1 ? `1px solid ${theme.border}` : 'none' }}
              >
                <td style={s.labelCell}>{row.label || row.concept}</td>
                <td style={s.valueCell}>{fmtNum(row.value)}</td>
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
