import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import LoginPage from '../pages/LoginPage.jsx'
import * as api from '../api.js'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

test('renders password field and log in button', () => {
  render(<LoginPage onLogin={() => {}} />)
  expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
})

test('shows error message on wrong password', async () => {
  vi.spyOn(api, 'login').mockRejectedValue(new Error('Invalid password'))

  render(<LoginPage onLogin={() => {}} />)
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } })
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

  await waitFor(() => {
    expect(screen.getByText('Incorrect password.')).toBeInTheDocument()
  })
})

test('calls onLogin with token on correct password', async () => {
  vi.spyOn(api, 'login').mockResolvedValue({ access_token: 'test-token', token_type: 'bearer' })
  const onLogin = vi.fn()

  render(<LoginPage onLogin={onLogin} />)
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'correct' } })
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

  await waitFor(() => {
    expect(onLogin).toHaveBeenCalledWith('test-token')
  })
})

test('saves token to localStorage on success', async () => {
  vi.spyOn(api, 'login').mockResolvedValue({ access_token: 'saved-token', token_type: 'bearer' })

  render(<LoginPage onLogin={() => {}} />)
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'correct' } })
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

  await waitFor(() => {
    expect(localStorage.getItem('finnhub_token')).toBe('saved-token')
  })
})
