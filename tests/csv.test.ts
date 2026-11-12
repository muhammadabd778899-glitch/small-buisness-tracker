import { describe, expect, it } from 'vitest'
import { parseCSV, pickCSVField } from '../src/lib/csv'

describe('parseCSV', () => {
  it('reads headers and rows, trimming header names', () => {
    const parsed = parseCSV(' Name , Amount \nAda, 12.50\nGrace, 20\n')
    expect(parsed.headers).toEqual(['Name', 'Amount'])
    expect(parsed.rows).toEqual([
      { Name: 'Ada', Amount: '12.50' },
      { Name: 'Grace', Amount: '20' }
    ])
  })

  it('drops blank lines', () => {
    const parsed = parseCSV('Name\nAda\n\n  \nGrace\n')
    expect(parsed.rows).toHaveLength(2)
  })

  it('supports quoted values with commas', () => {
    const parsed = parseCSV('Name,Notes\n"Acme, Inc","Net 30, prefer email"\n')
    expect(parsed.rows[0]).toEqual({ Name: 'Acme, Inc', Notes: 'Net 30, prefer email' })
  })
})

describe('pickCSVField', () => {
  const row = { 'Client Name': 'Ada', Amount: '42', Notes: 'Hello' }

  it('matches headings case-insensitively', () => {
    expect(pickCSVField(row, ['amount'])).toBe('42')
  })

  it('falls back to partial heading matches', () => {
    expect(pickCSVField(row, ['name'])).toBe('Ada')
  })

  it('respects candidate priority', () => {
    expect(pickCSVField(row, ['Notes', 'Amount'])).toBe('Hello')
  })

  it('returns an empty string when nothing matches', () => {
    expect(pickCSVField(row, ['missing'])).toBe('')
  })
})
