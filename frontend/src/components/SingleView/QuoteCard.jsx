import styles from './QuoteCard.module.css'

const fmt = (n) => (n != null ? `$${n.toFixed(2)}` : '—')

function Change({ current, prevClose }) {
  if (current == null || prevClose == null || prevClose === 0) return null
  const diff = current - prevClose
  const pct = (diff / prevClose) * 100
  const positive = diff >= 0
  return (
    <span className={positive ? styles.positive : styles.negative}>
      {positive ? '+' : ''}${diff.toFixed(2)} ({positive ? '+' : ''}{pct.toFixed(2)}%)
    </span>
  )
}

export default function QuoteCard({ quote }) {
  return (
    <div>
      <div className={styles.symbolRow}>
        <span className={styles.symbol}>{quote.symbol}</span>
        <Change current={quote.current} prevClose={quote.prev_close} />
      </div>
      <div className={styles.card}>
        <div className={styles.item}>
          <span className={styles.label}>Current Price</span>
          <span className={styles.value}>{fmt(quote.current)}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>Prev Close</span>
          <span className={styles.value}>{fmt(quote.prev_close)}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>Day High</span>
          <span className={styles.value}>{fmt(quote.high)}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>Day Low</span>
          <span className={styles.value}>{fmt(quote.low)}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>Open</span>
          <span className={styles.value}>{fmt(quote.open)}</span>
        </div>
      </div>
    </div>
  )
}
