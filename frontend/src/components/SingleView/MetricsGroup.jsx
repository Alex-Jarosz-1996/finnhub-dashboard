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

// Fields whose numeric value is a dollar amount
const DOLLAR_KEYS = new Set([
  '52WeekHigh', '52WeekLow', 'dividendPerShareTTM',
  'eps', 'bookValue', 'ebitPerShare', 'ebitdPerShareTTM',
  'bookValuePerShareAnnual', 'cashPerShareAnnual',
  'cashFlowPerShareAnnual', 'fcfPerShareTTM',
  'marketCap', 'enterpriseValue',
])

// Fields already expressed as a percentage (e.g. 45.96 = 45.96%)
const PERCENT_KEYS = new Set([
  'dividendYieldTTM', 'epsGrowthTTMYoy',
  'grossMarginTTM', 'netProfitMarginTTM', 'operatingMarginTTM', 'pretaxMarginTTM',
])

// Fields expressed as a decimal ratio (e.g. 0.28 = 28%)
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
  const entries = Object.entries(data).filter(([, v]) => {
    if (v === null || v === undefined) return false
    if (typeof v === 'object' && 'value' in v && v.value === null) return false
    return true
  })

  if (entries.length === 0) return null

  return (
    <div style={s.section}>
      <div style={s.title}>{title}</div>
      <table style={s.table}>
        <tbody>
          {entries.map(([key, val], i) => (
            <tr
              key={key}
              style={{ borderBottom: i < entries.length - 1 ? '1px solid #2d3348' : 'none' }}
            >
              <td style={s.labelCell}>{LABELS[key] || key}</td>
              <td style={s.valueCell}>{formatValue(val, key)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
