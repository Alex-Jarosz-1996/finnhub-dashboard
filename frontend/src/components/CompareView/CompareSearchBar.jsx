import { useState } from 'react'
import { useTheme } from '../../theme.js'

export default function CompareSearchBar({ onAdd, count, max = 10 }) {
  const theme = useTheme()
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

  const s = {
    wrapper: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
    form: { display: 'flex', gap: '8px' },
    input: {
      padding: '8px 12px',
      background: theme.bgCard,
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      color: theme.textPrimary,
      fontSize: '14px',
      outline: 'none',
      textTransform: 'uppercase',
      width: '160px',
    },
    button: {
      padding: '8px 16px',
      background: theme.btnPrimary,
      border: 'none',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '14px',
      cursor: 'pointer',
      fontWeight: 600,
    },
    buttonDisabled: { background: theme.btnDisabled, cursor: 'not-allowed' },
    counter: { fontSize: '13px', color: theme.textSecondary },
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
