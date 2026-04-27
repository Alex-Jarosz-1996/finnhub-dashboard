import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MetricsGroup from '../components/SingleView/MetricsGroup'

beforeEach(() => localStorage.clear())

const twoMetrics = { peTTM: { value: 28.4, asOf: '2024-09-28' }, pb: { value: 3.1 } }

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

  it('filters out null series values', () => {
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

  // collapse toggle
  it('collapses the table when the title button is clicked', async () => {
    render(<MetricsGroup title="Valuation" data={{ peTTM: { value: 28.4, asOf: '2024-09-28' } }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Toggle Valuation' }))
    expect(screen.queryByText('P/E (TTM)')).not.toBeInTheDocument()
  })

  it('re-expands when the title button is clicked again', async () => {
    render(<MetricsGroup title="Valuation" data={{ peTTM: { value: 28.4, asOf: '2024-09-28' } }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Toggle Valuation' }))
    await userEvent.click(screen.getByRole('button', { name: 'Toggle Valuation' }))
    expect(screen.getByText('P/E (TTM)')).toBeInTheDocument()
  })

  // filter panel — individual rows
  it('opens the filter panel when the settings button is clicked', async () => {
    render(<MetricsGroup title="Valuation" data={twoMetrics} />)
    await userEvent.click(screen.getByRole('button', { name: /filter valuation/i }))
    expect(screen.getByLabelText('P/E (TTM)')).toBeInTheDocument()
    expect(screen.getByLabelText('P/B')).toBeInTheDocument()
  })

  it('hides an individual metric when its checkbox is unchecked', async () => {
    render(<MetricsGroup title="Valuation" data={twoMetrics} />)
    await userEvent.click(screen.getByRole('button', { name: /filter valuation/i }))
    await userEvent.click(screen.getByLabelText('P/E (TTM)'))
    await userEvent.click(screen.getByRole('button', { name: /filter valuation/i })) // close panel
    expect(screen.queryByText('P/E (TTM)')).not.toBeInTheDocument()
    expect(screen.getByText('P/B')).toBeInTheDocument()
  })

  it('restores a hidden metric when its checkbox is rechecked', async () => {
    render(<MetricsGroup title="Valuation" data={twoMetrics} />)
    await userEvent.click(screen.getByRole('button', { name: /filter valuation/i }))
    await userEvent.click(screen.getByLabelText('P/E (TTM)'))
    await userEvent.click(screen.getByLabelText('P/E (TTM)'))
    await userEvent.click(screen.getByRole('button', { name: /filter valuation/i })) // close panel
    expect(screen.getByText('P/E (TTM)')).toBeInTheDocument()
  })

  // filter panel — All toggle
  it('hides all metrics when the All checkbox is unchecked', async () => {
    render(<MetricsGroup title="Valuation" data={twoMetrics} />)
    await userEvent.click(screen.getByRole('button', { name: /filter valuation/i }))
    await userEvent.click(screen.getByLabelText('All'))
    await userEvent.click(screen.getByRole('button', { name: /filter valuation/i })) // close panel
    expect(screen.queryByText('P/E (TTM)')).not.toBeInTheDocument()
    expect(screen.queryByText('P/B')).not.toBeInTheDocument()
  })

  it('restores all metrics when the All checkbox is rechecked', async () => {
    render(<MetricsGroup title="Valuation" data={twoMetrics} />)
    await userEvent.click(screen.getByRole('button', { name: /filter valuation/i }))
    await userEvent.click(screen.getByLabelText('All'))
    await userEvent.click(screen.getByLabelText('All'))
    await userEvent.click(screen.getByRole('button', { name: /filter valuation/i })) // close panel
    expect(screen.getByText('P/E (TTM)')).toBeInTheDocument()
    expect(screen.getByText('P/B')).toBeInTheDocument()
  })
})
