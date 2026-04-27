import { useState } from 'react'

const s = {
  wrapper: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  form: { display: 'flex', gap: '8px' },
  input: {
    padding: '8px 12px',
    background: '#1e2130',
    border: '1px solid #2d3348',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    textTransform: 'uppercase',
    width: '160px',
  },
  button: {
    padding: '8px 16px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  buttonDisabled: { background: '#374151', cursor: 'not-allowed' },
  counter: { fontSize: '13px', color: '#94a3b8' },
}

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
    <div style={s.wrapper}>
      <form onSubmit={submit} style={s.form}>
        <input
          style={s.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add ticker..."
          maxLength={10}
          disabled={full}
        />
        <button
          style={{ ...s.button, ...(full ? s.buttonDisabled : {}) }}
          type="submit"
          disabled={full}
        >
          Add
        </button>
      </form>
      <span style={s.counter}>{count}/{max} tickers</span>
    </div>
  )
}
