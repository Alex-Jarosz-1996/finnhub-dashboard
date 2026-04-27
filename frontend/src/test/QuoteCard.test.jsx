import { render, screen } from '@testing-library/react'
import QuoteCard from '../components/SingleView/QuoteCard'

const quote = { symbol: 'AAPL', current: 189.5, high: 191.0, low: 187.3, open: 188.0 }

describe('QuoteCard', () => {
  it('renders the ticker symbol', () => {
    render(<QuoteCard quote={quote} />)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
  })

  it('formats prices with dollar sign and two decimals', () => {
    render(<QuoteCard quote={quote} />)
    expect(screen.getByText('$189.50')).toBeInTheDocument()
    expect(screen.getByText('$191.00')).toBeInTheDocument()
    expect(screen.getByText('$187.30')).toBeInTheDocument()
    expect(screen.getByText('$188.00')).toBeInTheDocument()
  })

  it('renders em dash for null price fields', () => {
    render(<QuoteCard quote={{ symbol: 'TEST', current: null, high: null, low: null, open: null }} />)
    expect(screen.getAllByText('—')).toHaveLength(4)
  })

  it('renders all four labels', () => {
    render(<QuoteCard quote={quote} />)
    expect(screen.getByText(/current price/i)).toBeInTheDocument()
    expect(screen.getByText(/day high/i)).toBeInTheDocument()
    expect(screen.getByText(/day low/i)).toBeInTheDocument()
    expect(screen.getByText(/open/i)).toBeInTheDocument()
  })
})
