import { render, screen } from '@testing-library/react'
import MetricsGroup from '../components/SingleView/MetricsGroup'

describe('MetricsGroup', () => {
  it('renders title and rows', () => {
    render(<MetricsGroup title="Valuation" data={{ peTTM: { value: 28.4, asOf: '2024-09-28' } }} />)
    expect(screen.getByText('Valuation')).toBeInTheDocument()
    expect(screen.getByText('P/E (TTM)')).toBeInTheDocument()
  })

  it('formats plain dollar values with $ prefix', () => {
    render(<MetricsGroup title="Valuation" data={{ marketCap: 2_950_000_000 }} />)
    expect(screen.getByText('$2.95B')).toBeInTheDocument()
  })

  it('formats percent fields with % suffix', () => {
    render(<MetricsGroup title="Margins" data={{ grossMarginTTM: 45.96 }} />)
    expect(screen.getByText('45.96%')).toBeInTheDocument()
  })

  it('converts percent_decimal fields (* 100) and appends %', () => {
    render(<MetricsGroup title="Returns" data={{ roeTTM: { value: 1.47, asOf: '2024-09-28' } }} />)
    expect(screen.getByText('147.00% (2024-09-28)')).toBeInTheDocument()
  })

  it('formats series object values with asOf date', () => {
    render(<MetricsGroup title="Valuation" data={{ eps: { value: 6.57, asOf: '2024-09-28' } }} />)
    expect(screen.getByText('$6.57 (2024-09-28)')).toBeInTheDocument()
  })

  it('renders em dash for null series value', () => {
    render(<MetricsGroup title="Valuation" data={{ peTTM: { value: null, asOf: '2024-09-28' } }} />)
    expect(screen.queryByText('P/E (TTM)')).not.toBeInTheDocument()
  })

  it('returns null when all values are null', () => {
    const { container } = render(<MetricsGroup title="Empty" data={{ peTTM: null }} />)
    expect(container.firstChild).toBeNull()
  })

  it('formats large dollar numbers with B/M suffix', () => {
    render(<MetricsGroup title="Valuation" data={{ enterpriseValue: 3_100_000_000 }} />)
    expect(screen.getByText('$3.10B')).toBeInTheDocument()
  })
})
