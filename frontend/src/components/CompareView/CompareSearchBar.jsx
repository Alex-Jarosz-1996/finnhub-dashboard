import { useState } from 'react'
import styles from './CompareSearchBar.module.css'

export default function CompareSearchBar({ onAdd, count, max = 10 }) {
  const [value, setValue] = useState('')
  const full = count >= max

  const submit = (e) => {
    e.preventDefault()
    const trimmed = value.trim().toUpperCase()
    if (trimmed && !full) {
      onAdd(trimmed)
      setValue('')
    }
  }

  return (
    <div className={styles.wrapper}>
      <form onSubmit={submit} className={styles.form}>
        <input
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add ticker..."
          maxLength={10}
          disabled={full}
        />
        <button className={styles.button} type="submit" disabled={full}>
          Add
        </button>
      </form>
      <span className={styles.counter}>{count}/{max} tickers</span>
    </div>
  )
}
