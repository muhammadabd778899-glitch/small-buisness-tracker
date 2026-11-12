import { describe, expect, it } from 'vitest'
import { clamp, formatMoney, formatPercent, round2, safeNumber, sumBy } from '../src/lib/money'
import { formatCurrency } from '../src/lib/money'
import { SETTINGS } from './fixtures'

describe('round2', () => {
  it('rounds to two decimals', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(2.675)).toBe(2.68)
    expect(round2(-3.456)).toBe(-3.46)
  })
})

describe('clamp', () => {
  it('limits values to the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-2, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })
})

describe('safeNumber', () => {
  it('parses numbers and falls back for invalid input', () => {
    expect(safeNumber('12.5')).toBe(12.5)
    expect(safeNumber(7)).toBe(7)
    expect(safeNumber('abc', 3)).toBe(3)
    expect(safeNumber(undefined, 1)).toBe(1)
    expect(safeNumber('', 9)).toBe(9)
  })
})

describe('formatMoney', () => {
  it('formats with symbols and precision', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50')
    expect(formatMoney(10, '€', 0)).toBe('€10')
    expect(formatMoney(10, '$', 2, true, 'USD')).toBe('$10.00 USD')
  })

  it('handles invalid values', () => {
    expect(formatMoney(Number.NaN)).toBe('$0.00')
  })
})

describe('formatCurrency', () => {
  it('uses business settings', () => {
    expect(formatCurrency(99, SETTINGS)).toBe('$99.00')
    expect(formatCurrency(99, { ...SETTINGS, currencySymbol: '£', currencyPrecision: 0 })).toBe('£99')
  })
})

describe('formatPercent', () => {
  it('formats percentages and guards invalid numbers', () => {
    expect(formatPercent(12.345)).toBe('12.3%')
    expect(formatPercent(50, 0)).toBe('50%')
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('0%')
  })
})

describe('sumBy', () => {
  it('sums rounded values', () => {
    const rows = [{ amount: 0.1 }, { amount: 0.2 }]
    expect(sumBy(rows, (row) => row.amount)).toBe(0.3)
    expect(sumBy([], (row: { amount: number }) => row.amount)).toBe(0)
  })
})
