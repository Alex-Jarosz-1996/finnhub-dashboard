import { useEffect, useState } from 'react'
import { fetchOptionsChain } from '../../api.js'
import styles from './OptionsChain.module.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Parses OCC ticker format: O:AAPL260513C00200000
// → "AAPL May 13 2026 200 Call"
function formatTicker(ticker) {
  const raw = ticker.startsWith('O:') ? ticker.slice(2) : ticker
  const m = raw.match(/^([A-Z.]+)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/)
  if (!m) return ticker
  const [, underlying, yy, mm, dd, type, strikeRaw] = m
  const month = MONTHS[parseInt(mm, 10) - 1]
  const day = parseInt(dd, 10)
  const year = `20${yy}`
  const strike = parseInt(strikeRaw, 10) / 1000
  const strikeStr = strike % 1 === 0 ? `$${String(strike)}` : `$${strike.toFixed(2)}`
  const contractType = type === 'C' ? 'Call' : 'Put'
  return `${underlying} ${month} ${day} ${year} ${strikeStr} ${contractType}`
}

export default function OptionsChain({ symbol, token, onUnauthorized }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setData(null)
    setError(null)
    fetchOptionsChain(symbol, token)
      .then(setData)
      .catch((e) => {
        if (e.message === 'Unauthorized' || e.message.includes('401')) {
          onUnauthorized()
          return
        }
        setError(e.message)
      })
      .finally(() => setLoading(false))
  }, [symbol, token, onUnauthorized])

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>
  if (!data) return null

  return (
    <div className={styles.grid}>
      <ContractTable title="Calls" contracts={data.calls} />
      <ContractTable title="Puts" contracts={data.puts} />
    </div>
  )
}

function ContractTable({ title, contracts }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {contracts.length === 0 ? (
        <div className={styles.empty}>No {title.toLowerCase()} found.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Contract Ticker</th>
              <th>Expiration Date</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.ticker}>
                <td>{formatTicker(c.ticker)}</td>
                <td>{c.expiration_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
