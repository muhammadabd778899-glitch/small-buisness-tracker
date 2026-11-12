import type { BillFrequency, ISODate } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

export function toISODate(date: Date): ISODate {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(): ISODate {
  return toISODate(new Date())
}

export function parseISO(value: ISODate): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export function addDays(value: ISODate, days: number): ISODate {
  const date = parseISO(value)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function addMonths(value: ISODate, months: number): ISODate {
  const date = parseISO(value)
  const day = date.getDate()
  date.setMonth(date.getMonth() + months)
  if (date.getDate() < day) date.setDate(0)
  return toISODate(date)
}

export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / DAY_MS)
}

export function inRange(date: ISODate, start: ISODate, end: ISODate): boolean {
  return date >= start && date <= end
}

export function startOfMonth(value: ISODate = todayISO()): ISODate {
  const date = parseISO(value)
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function endOfMonth(value: ISODate = todayISO()): ISODate {
  const date = parseISO(value)
  return toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function startOfQuarter(value: ISODate = todayISO()): ISODate {
  const date = parseISO(value)
  const quarterStart = Math.floor(date.getMonth() / 3) * 3
  return toISODate(new Date(date.getFullYear(), quarterStart, 1))
}

export function endOfQuarter(value: ISODate = todayISO()): ISODate {
  return endOfMonth(addMonths(startOfQuarter(value), 2))
}

export function startOfYear(value: ISODate = todayISO()): ISODate {
  return `${parseISO(value).getFullYear()}-01-01`
}

export function endOfYear(value: ISODate = todayISO()): ISODate {
  return `${parseISO(value).getFullYear()}-12-31`
}

export type PeriodKind =
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'this-year'
  | 'last-year'
  | 'last-12'
  | 'custom'
  | 'all'

export interface PeriodRange {
  kind: PeriodKind
  start: ISODate
  end: ISODate
  label: string
}

export const PERIOD_OPTIONS: { value: PeriodKind; label: string }[] = [
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'this-quarter', label: 'This quarter' },
  { value: 'this-year', label: 'This year' },
  { value: 'last-year', label: 'Last year' },
  { value: 'last-12', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom range' },
  { value: 'all', label: 'All time' }
]

export function periodRange(
  kind: PeriodKind,
  customStart?: ISODate,
  customEnd?: ISODate,
  today: ISODate = todayISO()
): PeriodRange {
  const thisMonth = startOfMonth(today)
  switch (kind) {
    case 'this-month':
      return { kind, start: thisMonth, end: endOfMonth(today), label: 'This month' }
    case 'last-month': {
      const start = addMonths(thisMonth, -1)
      return { kind, start, end: endOfMonth(start), label: 'Last month' }
    }
    case 'this-quarter':
      return { kind, start: startOfQuarter(today), end: endOfQuarter(today), label: 'This quarter' }
    case 'this-year':
      return { kind, start: startOfYear(today), end: endOfYear(today), label: 'This year' }
    case 'last-year': {
      const year = parseISO(today).getFullYear() - 1
      return { kind, start: `${year}-01-01`, end: `${year}-12-31`, label: `${year}` }
    }
    case 'last-12':
      return { kind, start: addMonths(thisMonth, -11), end: endOfMonth(today), label: 'Last 12 months' }
    case 'custom':
      return {
        kind,
        start: customStart || addMonths(thisMonth, -11),
        end: customEnd || endOfMonth(today),
        label: 'Custom range'
      }
    case 'all':
      return { kind, start: '1900-01-01', end: '2999-12-31', label: 'All time' }
  }
}

export function monthKey(value: ISODate): string {
  return value.slice(0, 7)
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, (month || 1) - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: '2-digit'
  })
}

export function monthsInRange(start: ISODate, end: ISODate): string[] {
  const keys: string[] = []
  let cursor = startOfMonth(start)
  const last = startOfMonth(end)
  let guard = 0
  while (cursor <= last && guard < 400) {
    keys.push(monthKey(cursor))
    cursor = startOfMonth(addMonths(cursor, 1))
    guard += 1
  }
  return keys
}

export function formatDate(value: ISODate | null | undefined, format = 'MM/DD/YYYY'): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'YYYY-MM-DD':
      return value
    default:
      return `${month}/${day}/${year}`
  }
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function isOverdue(dueDate: ISODate | null, today: ISODate = todayISO()): boolean {
  return Boolean(dueDate) && (dueDate as string) < today
}

/**
 * Accepts the date formats people commonly paste into CSV files and returns a
 * canonical YYYY-MM-DD value.
 */
export function parseDateInput(value: string, fallback: ISODate = todayISO()): ISODate {
  const text = (value || '').trim()
  if (!text) return fallback
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number)
    return toISODate(new Date(year, month - 1, day))
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const [first, second, year] = text.split('/').map(Number)
    return toISODate(new Date(year, first - 1, second))
  }
  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) return toISODate(parsed)
  return fallback
}

export function daysUntil(value: ISODate, today: ISODate = todayISO()): number {
  return diffDays(today, value)
}

export function nextRecurringDate(value: ISODate, frequency: BillFrequency): ISODate {
  switch (frequency) {
    case 'weekly':
      return addDays(value, 7)
    case 'monthly':
      return addMonths(value, 1)
    case 'quarterly':
      return addMonths(value, 3)
    case 'yearly':
      return addMonths(value, 12)
    default:
      return value
  }
}

export function fiscalYearStartDate(year: number, fiscalYearStartMonth: number): ISODate {
  const month = Math.min(12, Math.max(1, fiscalYearStartMonth || 1))
  return `${year}-${String(month).padStart(2, '0')}-01`
}
