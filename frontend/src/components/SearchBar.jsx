import { useState } from 'react'

const s = {
  form: { display: 'flex', gap: '8px', marginBottom: '24px' },
  input: {
    flex: 1,
    maxWidth: '320px',
    padding: '10px 14px',
    background: '#1e2130',
    border: '1px solid #2d3348',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '15px',
    outline: 'none',
    textTransform: 'uppercase',
  },
  button: {
    padding: '10px 20px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    cursor: 'pointer',
    fontWeight: 600,
  },
}

export default function SearchBar({ onSearch, placeholder = 'Enter ticker symbol...' }) {
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onSearch(trimmed.toUpperCase())
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
