import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CompareTable from '../components/CompareView/CompareTable'

beforeEach(() => localStorage.clear())

const makeData = (overrides = {}) => ({
  AAPL: {
    quote: { current: 189.5, high: 191.0, low: 187.3 },
    financials: {
      metrics: {
        valuation: {
          marketCap: 2_950_000_000,
          peTTM: { value: 28.4 },
          pb: { value: 3.1 },
          eps: { value: 6.57 },
        },
        returns: {
          roeTTM: { value: 1.47 },
          roaTTM: { value: 0.28 },
        },
        margins: { grossMarginTTM: 45.96, netProfitMarginTTM: 26.44 },
        debt: { totalDebtToEquity: { value: 1.77 } },
        cashFlow: { fcfPerShareTTM: { value: 7.3 } },
      },
    },
    ...overrides,
  },
})

describe('CompareTable', () => {
  it('renders column headers', () => {
    render(<CompareTable tickers={['AAPL']} data={makeData()} onRemove={() => {}} />)
    expect(screen.getByText('Symbol')).toBeInTheDocument()
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('Market Cap')).toBeInTheDocument()
  })

  it('renders ticker symbol in the row', () => {
    render(<CompareTable tickers={['AAPL']} data={makeData()} onRemove={() => {}} />)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
  })

  it('formats dollar values with $ prefix', () => {
    render(<CompareTable tickers={['AAPL']} data={makeData()} onRemove={() => {}} />)
    expect(screen.getByText('$189.50')).toBeInTheDocument()
    expect(screen.getByText('$6.57')).toBeInTheDocument()
  })

  it('formats marketCap with B suffix', () => {
    render(<CompareTable tickers={['AAPL']} data={makeData()} onRemove={() => {}} />)
    expect(screen.getByText('$2.95B')).toBeInTheDocument()
  })

  it('formats percent_decimal ROE with % suffix', () => {
    render(<CompareTable tickers={['AAPL']} data={makeData()} onRemove={() => {}} />)
    expect(screen.getByText('147.00%')).toBeInTheDocument()
  })

  it('formats percent gross margin with % suffix', () => {
    render(<CompareTable tickers={['AAPL']} data={makeData()} onRemove={() => {}} />)
    expect(screen.getByText('45.96%')).toBeInTheDocument()
  })

  it('shows Loading... for ticker with no data', () => {
    render(<CompareTable tickers={['AAPL']} data={{}} onRemove={() => {}} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows error message for ticker with error', () => {
    render(<CompareTable tickers={['AAPL']} data={{ AAPL: { error: 'Not found' } }} onRemove={() => {}} />)
    expect(screen.getByText('Not found')).toBeInTheDocument()
  })

  it('calls onRemove when × button is clicked', async () => {
    const onRemove = vi.fn()
    render(<CompareTable tickers={['AAPL']} data={makeData()} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: '×' }))
    expect(onRemove).toHaveBeenCalledWith('AAPL')
  })

  it('sorts rows ascending by Price when Price header is clicked', async () => {
    const data = {
      ...makeData(),
      MSFT: {
        quote: { current: 420.0, high: 425.0, low: 415.0 },
        financials: { metrics: { valuation: { marketCap: 3_100_000_000, peTTM: { value: 35 }, pb: { value: 12 }, eps: { value: 12 } }, returns: { roeTTM: { value: 0.4 }, roaTTM: { value: 0.15 } }, margins: { grossMarginTTM: 69, netProfitMarginTTM: 35 }, debt: { totalDebtToEquity: { value: 0.5 } }, cashFlow: { fcfPerShareTTM: { value: 15 } } } },
      },
    }
    render(<CompareTable tickers={['AAPL', 'MSFT']} data={data} onRemove={() => {}} />)
    await userEvent.click(screen.getByText('Price'))
    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('AAPL')).toBeInTheDocument()
  })

  it('toggles to descending sort on second click', async () => {
    const data = {
      ...makeData(),
      MSFT: {
        quote: { current: 420.0, high: 425.0, low: 415.0 },
        financials: { metrics: { valuation: { marketCap: 3_100_000_000, peTTM: { value: 35 }, pb: { value: 12 }, eps: { value: 12 } }, returns: { roeTTM: { value: 0.4 }, roaTTM: { value: 0.15 } }, margins: { grossMarginTTM: 69, netProfitMarginTTM: 35 }, debt: { totalDebtToEquity: { value: 0.5 } }, cashFlow: { fcfPerShareTTM: { value: 15 } } } },
      },
    }
    render(<CompareTable tickers={['AAPL', 'MSFT']} data={data} onRemove={() => {}} />)
    await userEvent.click(screen.getByText('Price'))
    await userEvent.click(screen.getByText('Price ▲'))
    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('MSFT')).toBeInTheDocument()
  })

  it('opens the Columns panel when the Columns button is clicked', async () => {
    render(<CompareTable tickers={['AAPL']} data={makeData()} onRemove={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    expect(screen.getByLabelText('Price')).toBeInTheDocument()
    expect(screen.getByLabelText('Market Cap')).toBeInTheDocument()
  })

  it('hides a column when its checkbox is unchecked', async () => {
    render(<CompareTable tickers={['AAPL']} data={makeData()} onRemove={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    await userEvent.click(screen.getByLabelText('Price'))
    // panel closed; "Price" should not appear as a table header
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    const headers = screen.getAllByRole('columnheader')
    expect(headers.every((h) => h.textContent !== 'Price')).toBe(true)
  })

  it('restores a hidden column when its checkbox is rechecked', async () => {
    render(<CompareTable tickers={['AAPL']} data={makeData()} onRemove={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /columns/i }))
    await userEvent.click(screen.getByLabelText('Price'))
    await userEvent.click(screen.getByLabelText('Price'))
    const headers = screen.getAllByRole('columnheader')
    expect(headers.some((h) => h.textContent === 'Price')).toBe(true)
  })
})
