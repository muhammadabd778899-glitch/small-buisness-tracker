import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { Button, Modal } from './ui'
import { downloadFile, parseCSV, pickCSVField, readFileText } from '../lib/csv'

export interface CsvField {
  key: string
  label: string
  aliases?: string[]
  required?: boolean
  hint?: string
}

export interface CsvImportModalProps {
  open: boolean
  title: string
  description?: string
  fields: CsvField[]
  templateName: string
  onClose: () => void
  onImport: (rows: Record<string, string>[]) => Promise<number>
}

export function CsvImportModal({
  open,
  title,
  description,
  fields,
  templateName,
  onClose,
  onImport
}: CsvImportModalProps) {
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) return
    setRows([])
    setFileName('')
    setError(null)
    setBusy(false)
  }, [open])

  const preview = useMemo(() => rows.slice(0, 5), [rows])

  const downloadTemplate = () => {
    const header = fields.map((field) => field.label).join(',')
    downloadFile(templateName, `${header}\n`, 'text/csv;charset=utf-8')
  }

  const handleFile = async (file: File) => {
    setError(null)
    try {
      const text = await readFileText(file)
      const parsed = parseCSV(text)
      if (!parsed.rows.length) {
        setRows([])
        setError('The file has no data rows. Check that the first line contains column headings.')
        return
      }
      const mapped: Record<string, string>[] = []
      const missing: string[] = []
      parsed.rows.forEach((row, index) => {
        const record: Record<string, string> = {}
        for (const field of fields) {
          const value = pickCSVField(row, [field.label, field.key, ...(field.aliases || [])]).trim()
          if (!value && field.required) missing.push(`row ${index + 2}: ${field.label}`)
          record[field.key] = value
        }
        mapped.push(record)
      })
      setFileName(file.name)
      setRows(mapped)
      if (missing.length) {
        setError(`Some required values are missing — ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}. Empty required fields will be skipped.`)
      }
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'The file could not be read.')
    }
  }

  const runImport = async () => {
    setBusy(true)
    try {
      await onImport(rows)
      onClose()
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={runImport} disabled={!rows.length || busy}>
            {busy ? 'Importing…' : `Import ${rows.length} row${rows.length === 1 ? '' : 's'}`}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
              event.target.value = ''
            }}
          />
          <Button variant="primary" onClick={() => inputRef.current?.click()}>
            <Upload size={15} /> Choose CSV file
          </Button>
          <Button onClick={downloadTemplate}>
            <Download size={15} /> Download template
          </Button>
          {fileName ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <FileSpreadsheet size={14} /> {fileName}
            </span>
          ) : null}
        </div>

        <div className="rounded-xl bg-canvas p-3 text-xs text-muted">
          <p className="font-semibold text-ink">Expected columns</p>
          <p className="mt-1 leading-relaxed">
            {fields.map((field) => (
              <span key={field.key} className="mr-2 inline-block">
                <strong className="text-ink">{field.label}</strong>
                {field.required ? <span className="text-danger">*</span> : null}
                {field.hint ? <span> — {field.hint}</span> : null}
              </span>
            ))}
          </p>
          <p className="mt-1">Column order does not matter and common alternative headings are detected automatically.</p>
        </div>

        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}

        {preview.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {fields.map((field) => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index}>
                    {fields.map((field) => (
                      <td key={field.key}>{row[field.key] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > preview.length ? (
              <p className="mt-2 text-xs text-muted">Previewing 5 of {rows.length} rows.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
