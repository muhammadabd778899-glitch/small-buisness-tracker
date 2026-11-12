import Papa from 'papaparse'

export function downloadFile(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export interface CSVColumn<T> {
  key: string
  label: string
  getValue: (row: T) => string | number | null | undefined
}

export function exportCSV<T>(filename: string, rows: T[], columns: CSVColumn<T>[]): void {
  const data = rows.map((row) => {
    const record: Record<string, string | number> = {}
    for (const column of columns) {
      const value = column.getValue(row)
      record[column.label] = value === null || value === undefined ? '' : value
    }
    return record
  })
  const csv = Papa.unparse(data)
  downloadFile(filename, csv, 'text/csv;charset=utf-8')
}

export interface ParsedCSV {
  rows: Record<string, string>[]
  headers: string[]
  errors: string[]
}

export function parseCSV(text: string): ParsedCSV {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim()
  })
  return {
    rows: result.data.filter((row) => Object.values(row).some((value) => String(value || '').trim())),
    headers: result.meta.fields || [],
    errors: result.errors.map((error) => `${error.type}: ${error.message}${error.row !== undefined ? ` (row ${error.row + 2})` : ''}`)
  }
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.readAsText(file)
  })
}

export function pickCSVField(row: Record<string, string>, candidates: string[]): string {
  const keys = Object.keys(row)
  for (const candidate of candidates) {
    const exact = keys.find((key) => key.toLowerCase() === candidate.toLowerCase())
    if (exact) return row[exact] || ''
    const partial = keys.find((key) => key.toLowerCase().includes(candidate.toLowerCase()))
    if (partial) return row[partial] || ''
  }
  return ''
}
