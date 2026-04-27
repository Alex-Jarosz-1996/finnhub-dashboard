import styles from './QuoteCard.module.css'

const fmt = (n) => (n != null ? `$${n.toFixed(2)}` : '—')

export default function QuoteCard({ quote }) {
  return (
    <div>
      <div className={styles.symbol}>{quote.symbol}</div>
      <div className={styles.card}>
        <div className={styles.item}>
          <span className={styles.label}>Current Price</span>
          <span className={styles.value}>{fmt(quote.current)}</span>
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
