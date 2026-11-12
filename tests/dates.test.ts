import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  daysUntil,
  diffDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  formatDate,
  inRange,
  isOverdue,
  monthKey,
  monthsInRange,
  nextRecurringDate,
  parseDateInput,
  periodRange,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  toISODate
} from '../src/lib/dates'

describe('ISO date helpers', () => {
  it('formats a local date without timezone drift', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('adds days across month boundaries', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
  })

  it('clamps month-end when adding months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2026-03-15', -1)).toBe('2026-02-15')
  })

  it('calculates day differences and days until', () => {
    expect(diffDays('2026-01-01', '2026-01-31')).toBe(30)
    expect(daysUntil('2026-01-15', '2026-01-10')).toBe(5)
  })

  it('checks inclusive ranges', () => {
    expect(inRange('2026-01-01', '2026-01-01', '2026-01-31')).toBe(true)
    expect(inRange('2026-02-01', '2026-01-01', '2026-01-31')).toBe(false)
  })
})

describe('period boundaries', () => {
  it('finds month start and end', () => {
    expect(startOfMonth('2026-02-17')).toBe('2026-02-01')
    expect(endOfMonth('2026-02-17')).toBe('2026-02-28')
    expect(endOfMonth('2024-02-10')).toBe('2024-02-29')
  })

  it('finds quarter boundaries', () => {
    expect(startOfQuarter('2026-05-20')).toBe('2026-04-01')
    expect(endOfQuarter('2026-05-20')).toBe('2026-06-30')
    expect(startOfQuarter('2026-12-31')).toBe('2026-10-01')
    expect(endOfQuarter('2026-12-31')).toBe('2026-12-31')
  })

  it('finds year boundaries', () => {
    expect(startOfYear('2026-07-04')).toBe('2026-01-01')
    expect(endOfYear('2026-07-04')).toBe('2026-12-31')
  })

  it('lists month keys inclusively', () => {
    expect(monthsInRange('2025-11-15', '2026-02-02')).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02'
    ])
    expect(monthKey('2026-03-09')).toBe('2026-03')
  })
})

describe('periodRange', () => {
  const today = '2026-05-20'

  it('builds common reporting ranges', () => {
    expect(periodRange('this-month', undefined, undefined, today)).toMatchObject({
      start: '2026-05-01',
      end: '2026-05-31'
    })
    expect(periodRange('last-month', undefined, undefined, today)).toMatchObject({
      start: '2026-04-01',
      end: '2026-04-30'
    })
    expect(periodRange('this-quarter', undefined, undefined, today)).toMatchObject({
      start: '2026-04-01',
      end: '2026-06-30'
    })
    expect(periodRange('this-year', undefined, undefined, today)).toMatchObject({
      start: '2026-01-01',
      end: '2026-12-31'
    })
    expect(periodRange('last-year', undefined, undefined, today)).toMatchObject({
      start: '2025-01-01',
      end: '2025-12-31'
    })
    expect(periodRange('last-12', undefined, undefined, today)).toMatchObject({
      start: '2025-06-01',
      end: '2026-05-31'
    })
  })

  it('falls back to sensible custom and all-time ranges', () => {
    expect(periodRange('custom', '2026-02-01', '2026-02-28', today)).toMatchObject({
      start: '2026-02-01',
      end: '2026-02-28'
    })
    expect(periodRange('all', undefined, undefined, today)).toMatchObject({
      start: '1900-01-01',
      end: '2999-12-31'
    })
  })
})

describe('formatting and parsing', () => {
  it('formats dates in the configured style', () => {
    expect(formatDate('2026-03-09')).toBe('03/09/2026')
    expect(formatDate('2026-03-09', 'DD/MM/YYYY')).toBe('09/03/2026')
    expect(formatDate('2026-03-09', 'YYYY-MM-DD')).toBe('2026-03-09')
    expect(formatDate(null)).toBe('—')
  })

  it('parses pasted CSV dates', () => {
    expect(parseDateInput('2026-3-9')).toBe('2026-03-09')
    expect(parseDateInput('9/3/2026')).toBe('2026-09-03')
    expect(parseDateInput('', '2026-01-05')).toBe('2026-01-05')
    expect(parseDateInput('not a date', '2026-01-01')).toBe('2026-01-01')
  })

  it('flags overdue dates', () => {
    expect(isOverdue('2026-01-01', '2026-01-02')).toBe(true)
    expect(isOverdue('2026-01-02', '2026-01-02')).toBe(false)
    expect(isOverdue(null, '2026-01-02')).toBe(false)
  })
})

describe('nextRecurringDate', () => {
  it('advances each frequency', () => {
    expect(nextRecurringDate('2026-01-10', 'weekly')).toBe('2026-01-17')
    expect(nextRecurringDate('2026-01-31', 'monthly')).toBe('2026-02-28')
    expect(nextRecurringDate('2026-01-31', 'quarterly')).toBe('2026-04-30')
    expect(nextRecurringDate('2026-01-31', 'yearly')).toBe('2027-01-31')
    expect(nextRecurringDate('2026-01-31', 'once')).toBe('2026-01-31')
  })
})
