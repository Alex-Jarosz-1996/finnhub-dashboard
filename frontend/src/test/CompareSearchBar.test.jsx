import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import CompareSearchBar from '../components/CompareView/CompareSearchBar'

describe('CompareSearchBar', () => {
  it('renders input, button, and counter', () => {
    render(<CompareSearchBar onAdd={() => {}} count={2} max={10} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
    expect(screen.getByText('2/10 tickers')).toBeInTheDocument()
  })

  it('calls onAdd with uppercased ticker and clears input', async () => {
    const onAdd = vi.fn()
    render(<CompareSearchBar onAdd={onAdd} count={1} max={10} />)
    await userEvent.type(screen.getByRole('textbox'), 'msft')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledWith('MSFT')
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('disables input and button when at max', () => {
    render(<CompareSearchBar onAdd={() => {}} count={10} max={10} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled()
  })

  it('does not call onAdd when input is blank', async () => {
    const onAdd = vi.fn()
    render(<CompareSearchBar onAdd={onAdd} count={0} max={10} />)
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).not.toHaveBeenCalled()
  })
})
