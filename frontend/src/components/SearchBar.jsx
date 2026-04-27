import { useState } from 'react'
import { useTheme } from '../theme.js'

export default function SearchBar({ onSearch, placeholder = 'Enter ticker symbol...' }) {
  const theme = useTheme()
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onSearch(trimmed.toUpperCase())
  }

  const s = {
    form: { display: 'flex', gap: '8px', marginBottom: '24px' },
    input: {
      flex: 1,
      maxWidth: '320px',
      padding: '10px 14px',
      background: theme.bgCard,
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      color: theme.textPrimary,
      fontSize: '15px',
      outline: 'none',
      textTransform: 'uppercase',
    },
    button: {
      padding: '10px 20px',
      background: theme.btnPrimary,
      border: 'none',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '15px',
      cursor: 'pointer',
      fontWeight: 600,
    },
  }

  return (
    <form onSubmit={submit} style={s.form}>
      <input
        style={s.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={10}
      />
      <button style={s.button} type="submit">Search</button>
    </form>
  )
}
