import type { BusinessSettings } from './types'

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function safeNumber(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  return Number.isFinite(num) ? num : fallback
}

export function formatMoney(
  value: number,
  symbol = '$',
  precision = 2,
  withCode = false,
  currency = 'USD'
): string {
  const amount = (Number.isFinite(value) ? value : 0).toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  })
  return withCode ? `${symbol}${amount} ${currency}` : `${symbol}${amount}`
}

export function formatCurrency(value: number, settings: BusinessSettings): string {
  return formatMoney(
    value,
    settings.currencySymbol || '$',
    settings.currencyPrecision ?? 2,
    false,
    settings.currency
  )
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '0%'
  return `${value.toFixed(digits)}%`
}

export function sumBy<T>(rows: T[], getValue: (row: T) => number): number {
  return round2(rows.reduce((total, row) => total + getValue(row), 0))
}
