import { useTheme } from '../../theme.js'

const fmt = (n) => (n != null ? `$${n.toFixed(2)}` : '—')

export default function QuoteCard({ quote }) {
  const theme = useTheme()

  const s = {
    symbol: { fontSize: '28px', fontWeight: 800, color: theme.accent, marginBottom: '16px' },
    card: {
      display: 'flex',
      gap: '32px',
      flexWrap: 'wrap',
      background: theme.bgCard,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '24px',
    },
    item: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: {
      fontSize: '11px',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    value: { fontSize: '22px', fontWeight: 700, color: theme.textPrimary },
  }

  return (
    <div>
      <div style={s.symbol}>{quote.symbol}</div>
      <div style={s.card}>
        <div style={s.item}>
          <span style={s.label}>Current Price</span>
          <span style={s.value}>{fmt(quote.current)}</span>
        </div>
        <div style={s.item}>
          <span style={s.label}>Day High</span>
          <span style={s.value}>{fmt(quote.high)}</span>
        </div>
        <div style={s.item}>
          <span style={s.label}>Day Low</span>
          <span style={s.value}>{fmt(quote.low)}</span>
        </div>
        <div style={s.item}>
          <span style={s.label}>Open</span>
          <span style={s.value}>{fmt(quote.open)}</span>
        </div>
      </div>
    </div>
  )
}
