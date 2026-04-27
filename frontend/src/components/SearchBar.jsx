import { useState } from 'react'
import styles from './SearchBar.module.css'

export default function SearchBar({ onSearch, placeholder = 'Enter ticker symbol...' }) {
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onSearch(trimmed.toUpperCase())
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      <input
        className={styles.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={10}
      />
      <button className={styles.button} type="submit">Search</button>
    </form>
  )
}
