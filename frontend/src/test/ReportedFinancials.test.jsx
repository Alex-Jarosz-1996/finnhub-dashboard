import { render, screen } from '@testing-library/react'
import ReportedFinancials from '../components/SingleView/ReportedFinancials'

const reported = {
  balanceSheet: [{ label: 'Total Assets', value: 364_980_000_000 }],
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
})
