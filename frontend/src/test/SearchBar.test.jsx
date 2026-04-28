import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import SearchBar from '../components/SearchBar'

describe('SearchBar', () => {
  it('renders input and button', () => {
    render(<SearchBar onSearch={() => {}} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('calls onSearch with uppercased trimmed value on submit', async () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    await userEvent.type(screen.getByRole('textbox'), '  aapl  ')
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(onSearch).toHaveBeenCalledWith('AAPL')
  })

  it('does not call onSearch when input is blank', async () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    await userEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('renders custom placeholder', () => {
    render(<SearchBar onSearch={() => {}} placeholder="Type here..." />)
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument()
  })
})
