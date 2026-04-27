const s = {
  section: { marginBottom: '16px' },
  title: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
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

function fmtNum(n) {
  if (n === null || n === undefined) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toFixed(2)
}

function ReportTable({ title, rows }) {
  if (!rows || rows.length === 0) return null
  return (
    <div style={s.section}>
      <div style={s.title}>{title}</div>
      <table style={s.table}>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: i < rows.length - 1 ? '1px solid #2d3348' : 'none' }}
            >
              <td style={s.labelCell}>{row.label || row.concept}</td>
              <td style={s.valueCell}>{fmtNum(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
