import { createContext, useContext } from 'react'

export const DARK = {
  bgApp:        '#0f1117',
  bgCard:       '#1e2130',
  border:       '#2d3348',
  textPrimary:  '#e2e8f0',
  textSecondary:'#94a3b8',
  textMuted:    '#64748b',
  accent:       '#60a5fa',
  btnPrimary:   '#3b82f6',
  btnDisabled:  '#374151',
  errorText:    '#f87171',
  errorBg:      '#1e1a2e',
  errorBorder:  '#7f1d1d',
}

export const LIGHT = {
  bgApp:        '#f1f5f9',
  bgCard:       '#ffffff',
  border:       '#e2e8f0',
  textPrimary:  '#0f172a',
  textSecondary:'#475569',
  textMuted:    '#94a3b8',
  accent:       '#2563eb',
  btnPrimary:   '#3b82f6',
  btnDisabled:  '#cbd5e1',
  errorText:    '#dc2626',
  errorBg:      '#fef2f2',
  errorBorder:  '#fecaca',
}

export const ThemeContext = createContext(DARK)
export const useTheme = () => useContext(ThemeContext)
