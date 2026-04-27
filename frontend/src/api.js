const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

const handle = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const fetchQuote = (symbol) =>
  fetch(`${BASE}/quote/${symbol.toUpperCase()}`).then(handle)

export const fetchFinancials = (symbol) =>
  fetch(`${BASE}/financials/${symbol.toUpperCase()}`).then(handle)

export const fetchAll = (symbol) =>
  Promise.all([fetchQuote(symbol), fetchFinancials(symbol)])
