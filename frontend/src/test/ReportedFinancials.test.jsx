import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportedFinancials from '../components/SingleView/ReportedFinancials'

beforeEach(() => localStorage.clear())

const reported = {
  balanceSheet: [
    { label: 'Total Assets', value: 364_980_000_000 },
    { label: 'Total Liabilities', value: 308_030_000_000 },
  ],
  incomeStatement: [{ label: 'Gross Profit', value: 180_683_000_000 }],
  cashFlowStatement: [{ label: 'Net Income', value: 93_736_000_000 }],
}

describe('ReportedFinancials', () => {
  it('renders all three section titles', () => {
    render(<ReportedFinancials reported={reported} />)
    expect(screen.getByText(/balance sheet/i)).toBeInTheDocument()
    expect(screen.getByText(/income statement/i)).toBeInTheDocument()
    expect(screen.getByText(/cash flow statement/i)).toBeInTheDocument()
  })

  it('renders row labels', () => {
    render(<ReportedFinancials reported={reported} />)
    expect(screen.getByText('Total Assets')).toBeInTheDocument()
    expect(screen.getByText('Gross Profit')).toBeInTheDocument()
    expect(screen.getByText('Net Income')).toBeInTheDocument()
  })

  it('formats large values with B suffix', () => {
    render(<ReportedFinancials reported={reported} />)
    expect(screen.getByText('364.98B')).toBeInTheDocument()
    expect(screen.getByText('180.68B')).toBeInTheDocument()
    expect(screen.getByText('93.74B')).toBeInTheDocument()
  })

  it('skips a section when its rows array is empty', () => {
    render(<ReportedFinancials reported={{ ...reported, incomeStatement: [] }} />)
    expect(screen.queryByText(/income statement/i)).not.toBeInTheDocument()
  })

  it('formats millions with M suffix', () => {
    render(<ReportedFinancials reported={{
      balanceSheet: [{ label: 'Cash', value: 25_500_000 }],
      incomeStatement: [],
      cashFlowStatement: [],
    }} />)
    expect(screen.getByText('25.50M')).toBeInTheDocument()
  })

  // collapse toggle
  it('collapses a section when its title is clicked', async () => {
    render(<ReportedFinancials reported={reported} />)
    await userEvent.click(screen.getByRole('button', { name: 'Toggle Balance Sheet' }))
    expect(screen.queryByText('Total Assets')).not.toBeInTheDocument()
  })

  it('re-expands a section when clicked again', async () => {
    render(<ReportedFinancials reported={reported} />)
    await userEvent.click(screen.getByRole('button', { name: 'Toggle Balance Sheet' }))
    await userEvent.click(screen.getByRole('button', { name: 'Toggle Balance Sheet' }))
    expect(screen.getByText('Total Assets')).toBeInTheDocument()
  })

  it('collapses sections independently', async () => {
    render(<ReportedFinancials reported={reported} />)
    await userEvent.click(screen.getByRole('button', { name: 'Toggle Balance Sheet' }))
    expect(screen.queryByText('Total Assets')).not.toBeInTheDocument()
    expect(screen.getByText('Gross Profit')).toBeInTheDocument()
    expect(screen.getByText('Net Income')).toBeInTheDocument()
  })

  // filter panel
  it('opens the filter panel when the settings button is clicked', async () => {
    render(<ReportedFinancials reported={reported} />)
    await userEvent.click(screen.getByRole('button', { name: /filter balance sheet/i }))
    expect(screen.getByLabelText('Total Assets')).toBeInTheDocument()
    expect(screen.getByLabelText('Total Liabilities')).toBeInTheDocument()
  })

  it('hides an individual row when its checkbox is unchecked', async () => {
    render(<ReportedFinancials reported={reported} />)
    await userEvent.click(screen.getByRole('button', { name: /filter balance sheet/i }))
    await userEvent.click(screen.getByLabelText('Total Assets'))
    await userEvent.click(screen.getByRole('button', { name: /filter balance sheet/i })) // close panel
    expect(screen.queryByText('Total Assets')).not.toBeInTheDocument()
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument()
  })

  it('restores a hidden row when its checkbox is rechecked', async () => {
    render(<ReportedFinancials reported={reported} />)
    await userEvent.click(screen.getByRole('button', { name: /filter balance sheet/i }))
    await userEvent.click(screen.getByLabelText('Total Assets'))
    await userEvent.click(screen.getByLabelText('Total Assets'))
    await userEvent.click(screen.getByRole('button', { name: /filter balance sheet/i })) // close panel
    expect(screen.getByText('Total Assets')).toBeInTheDocument()
  })

  it('hides all rows when the All checkbox is unchecked', async () => {
    render(<ReportedFinancials reported={reported} />)
    await userEvent.click(screen.getByRole('button', { name: /filter balance sheet/i }))
    await userEvent.click(screen.getByLabelText('All'))
    await userEvent.click(screen.getByRole('button', { name: /filter balance sheet/i })) // close panel
    expect(screen.queryByText('Total Assets')).not.toBeInTheDocument()
    expect(screen.queryByText('Total Liabilities')).not.toBeInTheDocument()
  })

  it('restores all rows when the All checkbox is rechecked', async () => {
    render(<ReportedFinancials reported={reported} />)
    await userEvent.click(screen.getByRole('button', { name: /filter balance sheet/i }))
    await userEvent.click(screen.getByLabelText('All'))
    await userEvent.click(screen.getByLabelText('All'))
    await userEvent.click(screen.getByRole('button', { name: /filter balance sheet/i })) // close panel
    expect(screen.getByText('Total Assets')).toBeInTheDocument()
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument()
  })
})
