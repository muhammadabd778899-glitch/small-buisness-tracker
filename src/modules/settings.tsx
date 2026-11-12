import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Database,
  Download,
  HardDrive,
  ImagePlus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react'
import type { BusinessSettings } from '../lib/types'
import { useApp } from '../store/app'
import { useData } from '../components/hooks'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  FormGrid,
  Modal,
  PageHeader,
  SectionTitle
} from '../components/ui'
import { backupFileName, makeBackup, validateBackup } from '../lib/backup'
import type { ValidationSuccess } from '../lib/backup'
import { TABLE_NAMES, nowISO } from '../lib/db'
import { downloadFile, readFileText } from '../lib/csv'
import { formatDateTime } from '../lib/dates'

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'INR', symbol: '₹' },
  { code: 'NGN', symbol: '₦' },
  { code: 'ZAR', symbol: 'R' },
  { code: 'KES', symbol: 'KSh' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CNY', symbol: '¥' },
  { code: 'BRL', symbol: 'R$' }
]

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

interface ListsDraft {
  income: string
  expense: string
  product: string
  units: string
}

function splitList(text: string): string[] {
  return [...new Set(text.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean))]
}

function joinList(values: string[]): string {
  return values.join('\n')
}

function fileToLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file (PNG, JPG or SVG).'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Choose an image smaller than 5 MB.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const scale = Math.min(1, 320 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) {
          resolve(String(reader.result))
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      }
      image.onerror = () => reject(new Error('That image could not be read.'))
      image.src = String(reader.result)
    }
    reader.onerror = () => reject(new Error('The selected file could not be read.'))
    reader.readAsDataURL(file)
  })
}

export function SettingsPage() {
  const data = useData()
  const saveSettings = useApp((state) => state.saveSettings)
  const replaceAll = useApp((state) => state.replaceAll)
  const loadDemo = useApp((state) => state.loadDemo)
  const clearDemo = useApp((state) => state.clearDemo)
  const resetAll = useApp((state) => state.resetAll)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const busy = useApp((state) => state.busy)

  const [draft, setDraft] = useState<BusinessSettings>(data.settings)
  const [lists, setLists] = useState<ListsDraft>({
    income: joinList(data.settings.incomeCategories),
    expense: joinList(data.settings.expenseCategories),
    product: joinList(data.settings.productCategories),
    units: joinList(data.settings.units)
  })
  const [subcategories, setSubcategories] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(data.settings.subcategories).map(([key, values]) => [key, values.join(', ')]))
  )
  const [dirty, setDirty] = useState(false)
  const [importCandidate, setImportCandidate] = useState<ValidationSuccess | null>(null)
  const [demoConfirm, setDemoConfirm] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetText, setResetText] = useState('')
  const [logoBusy, setLogoBusy] = useState(false)
  const [usage, setUsage] = useState('')
  const logoInput = useRef<HTMLInputElement>(null)
  const backupInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(data.settings)
    setLists({
      income: joinList(data.settings.incomeCategories),
      expense: joinList(data.settings.expenseCategories),
      product: joinList(data.settings.productCategories),
      units: joinList(data.settings.units)
    })
    setSubcategories(
      Object.fromEntries(Object.entries(data.settings.subcategories).map(([key, values]) => [key, values.join(', ')]))
    )
    setDirty(false)
  }, [data.settings])

  useEffect(() => {
    let cancelled = false
    if (!navigator.storage?.estimate) return
    void navigator.storage
      .estimate()
      .then((estimate) => {
        if (cancelled || !estimate.usage) return
        setUsage(`${(estimate.usage / 1024 / 1024).toFixed(2)} MB used in this browser`)
      })
      .catch(() => setUsage(''))
    return () => {
      cancelled = true
    }
  }, [data])

  const update = (partial: Partial<BusinessSettings>) => {
    setDraft((current) => ({ ...current, ...partial }))
    setDirty(true)
  }

  const save = async () => {
    if (!draft.businessName.trim()) {
      notify('Enter a business name before saving.', 'error')
      return
    }
    const categoryMap: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(subcategories)) {
      const values = splitList(value)
      if (values.length) categoryMap[key] = values
    }
    await saveSettings({
      ...draft,
      businessName: draft.businessName.trim(),
      businessEmail: draft.businessEmail.trim(),
      phone: draft.phone.trim(),
      address: draft.address.trim(),
      businessType: draft.businessType.trim(),
      currency: draft.currency.trim().toUpperCase() || 'USD',
      currencySymbol: draft.currencySymbol || '$',
      incomeCategories: splitList(lists.income),
      expenseCategories: splitList(lists.expense),
      productCategories: splitList(lists.product),
      units: splitList(lists.units),
      subcategories: categoryMap,
      updatedAt: nowISO()
    })
    await log('update', 'Updated business settings', 'Settings')
    notify('Settings saved.', 'success')
    setDirty(false)
  }

  const currentCategories = [...new Set([...splitList(lists.income), ...splitList(lists.expense)])]

  const handleLogo = async (file: File) => {
    setLogoBusy(true)
    try {
      const logo = await fileToLogo(file)
      update({ logoDataUrl: logo })
      notify('Logo added. Save settings to keep it.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'The logo could not be added.', 'error')
    } finally {
      setLogoBusy(false)
    }
  }

  const downloadBackup = () => {
    const backup = makeBackup(data)
    downloadFile(backupFileName(), JSON.stringify(backup, null, 2), 'application/json')
    void log('export', 'Downloaded a full backup', 'Backup')
    notify('Backup downloaded. Keep it somewhere safe.', 'success')
  }

  const handleBackupFile = async (file: File) => {
    try {
      const text = await readFileText(file)
      const parsed = JSON.parse(text) as unknown
      const result = validateBackup(parsed)
      if (!result.ok) {
        notify(result.error, 'error')
        return
      }
      setImportCandidate(result)
    } catch {
      notify('That file is not valid JSON. Choose an Ultimate Small Business Manager backup.', 'error')
    }
  }

  const restore = async () => {
    if (!importCandidate) return
    await replaceAll(importCandidate.data)
    await log('restore', 'Restored a backup file', 'Backup')
    setImportCandidate(null)
  }

  const counts = TABLE_NAMES.map((name) => ({
    name,
    count: ((data[name] as unknown as { id: string }[]) || []).length
  }))
  const totalRecords = counts.reduce((sum, row) => sum + row.count, 0)

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Business settings"
        description="Profile, numbering, categories and the backup controls for your local workspace."
        actions={
          <>
            <Button onClick={downloadBackup}>
              <Download size={15} /> Download backup
            </Button>
            <Button variant="primary" onClick={() => void save()}>
              <Save size={15} /> Save settings
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
            <Database size={18} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Records stored</p>
            <p className="text-lg font-bold">{totalRecords}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
            <HardDrive size={18} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Device storage</p>
            <p className="text-sm font-semibold">{usage || 'IndexedDB · local only'}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
            <Sparkles size={18} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Workspace</p>
            <p className="text-sm font-semibold">{data.settings.demoMode ? 'Demo data' : 'Your own records'}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
            {dirty ? <AlertTriangle size={18} /> : <Check size={18} />}
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Unsaved changes</p>
            <p className={`text-sm font-semibold ${dirty ? 'text-warning' : 'text-success'}`}>
              {dirty ? 'Save before leaving' : 'All changes saved'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Business profile" description="Shown on invoices, quotes, statements and PDFs." />
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas">
              {draft.logoDataUrl ? (
                <img src={draft.logoDataUrl} alt="Business logo" className="h-full w-full object-contain" />
              ) : (
                <ImagePlus size={22} className="text-muted" />
              )}
            </span>
            <div className="flex flex-wrap gap-2">
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handleLogo(file)
                  event.target.value = ''
                }}
              />
              <Button small onClick={() => logoInput.current?.click()} disabled={logoBusy}>
                <Upload size={14} /> {logoBusy ? 'Processing…' : 'Upload logo'}
              </Button>
              {draft.logoDataUrl ? (
                <Button small variant="ghost" onClick={() => update({ logoDataUrl: '' })}>
                  <Trash2 size={14} /> Remove
                </Button>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3">
            <FormGrid>
              <Field label="Business name" htmlFor="settings-name">
                <input
                  id="settings-name"
                  className="input"
                  value={draft.businessName}
                  onChange={(event) => update({ businessName: event.target.value })}
                />
              </Field>
              <Field label="Business type">
                <input
                  className="input"
                  value={draft.businessType}
                  onChange={(event) => update({ businessType: event.target.value })}
                  placeholder="Handmade studio, consultancy, shop…"
                />
              </Field>
              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  value={draft.businessEmail}
                  onChange={(event) => update({ businessEmail: event.target.value })}
                />
              </Field>
              <Field label="Phone">
                <input
                  className="input"
                  value={draft.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                />
              </Field>
            </FormGrid>
            <Field label="Address">
              <textarea
                className="textarea"
                rows={2}
                value={draft.address}
                onChange={(event) => update({ address: event.target.value })}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Money & documents" description="Currency display, tax defaults and document numbering." />
          <div className="grid gap-3">
            <FormGrid>
              <Field label="Currency">
                <select
                  className="select"
                  value={draft.currency}
                  onChange={(event) => {
                    const currency = CURRENCIES.find((item) => item.code === event.target.value)
                    update({
                      currency: event.target.value,
                      currencySymbol: currency?.symbol || draft.currencySymbol
                    })
                  }}
                >
                  {!CURRENCIES.some((item) => item.code === draft.currency) ? (
                    <option value={draft.currency}>{draft.currency}</option>
                  ) : null}
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Currency symbol">
                <input
                  className="input"
                  value={draft.currencySymbol}
                  onChange={(event) => update({ currencySymbol: event.target.value })}
                />
              </Field>
              <Field label="Decimal places">
                <select
                  className="select"
                  value={String(draft.currencyPrecision)}
                  onChange={(event) => update({ currencyPrecision: Number(event.target.value) })}
                >
                  <option value="0">0</option>
                  <option value="2">2</option>
                </select>
              </Field>
              <Field label="Date format">
                <select
                  className="select"
                  value={draft.dateFormat}
                  onChange={(event) => update({ dateFormat: event.target.value as BusinessSettings['dateFormat'] })}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </Field>
              <Field label="Default tax rate (%)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={draft.defaultTaxRate}
                  onChange={(event) => update({ defaultTaxRate: Number(event.target.value) })}
                />
              </Field>
              <Field label="Tax mode">
                <select
                  className="select"
                  value={draft.taxInclusive ? 'inclusive' : 'exclusive'}
                  onChange={(event) => update({ taxInclusive: event.target.value === 'inclusive' })}
                >
                  <option value="exclusive">Tax added on top</option>
                  <option value="inclusive">Prices include tax</option>
                </select>
              </Field>
              <Field label="Fiscal year starts">
                <select
                  className="select"
                  value={String(draft.fiscalYearStart)}
                  onChange={(event) => update({ fiscalYearStart: Number(event.target.value) })}
                >
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Payment terms (days)">
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={draft.defaultPaymentTerms}
                  onChange={(event) => update({ defaultPaymentTerms: Number(event.target.value) })}
                />
              </Field>
            </FormGrid>

            <div className="rounded-xl bg-canvas p-3">
              <p className="mb-2 text-xs font-semibold text-ink">Document numbering</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <Field label="Invoice prefix">
                  <input className="input" value={draft.invoicePrefix} onChange={(event) => update({ invoicePrefix: event.target.value })} />
                </Field>
                <Field label="Next invoice #">
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={draft.nextInvoiceNumber}
                    onChange={(event) => update({ nextInvoiceNumber: Number(event.target.value) })}
                  />
                </Field>
                <div className="hidden sm:block" />
                <Field label="Quote prefix">
                  <input className="input" value={draft.quotePrefix} onChange={(event) => update({ quotePrefix: event.target.value })} />
                </Field>
                <Field label="Next quote #">
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={draft.nextQuoteNumber}
                    onChange={(event) => update({ nextQuoteNumber: Number(event.target.value) })}
                  />
                </Field>
                <div className="hidden sm:block" />
                <Field label="Order prefix">
                  <input className="input" value={draft.orderPrefix} onChange={(event) => update({ orderPrefix: event.target.value })} />
                </Field>
                <Field label="Next order #">
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={draft.nextOrderNumber}
                    onChange={(event) => update({ nextOrderNumber: Number(event.target.value) })}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <SectionTitle title="Categories & units" description="One item per line. These lists power the dropdowns across finance, products and bills." />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Income categories">
              <textarea
                className="textarea font-mono text-xs"
                rows={7}
                value={lists.income}
                onChange={(event) => {
                  setLists({ ...lists, income: event.target.value })
                  setDirty(true)
                }}
              />
            </Field>
            <Field label="Expense categories">
              <textarea
                className="textarea font-mono text-xs"
                rows={7}
                value={lists.expense}
                onChange={(event) => {
                  setLists({ ...lists, expense: event.target.value })
                  setDirty(true)
                }}
              />
            </Field>
            <Field label="Product categories">
              <textarea
                className="textarea font-mono text-xs"
                rows={7}
                value={lists.product}
                onChange={(event) => {
                  setLists({ ...lists, product: event.target.value })
                  setDirty(true)
                }}
              />
            </Field>
            <Field label="Units">
              <textarea
                className="textarea font-mono text-xs"
                rows={7}
                value={lists.units}
                onChange={(event) => {
                  setLists({ ...lists, units: event.target.value })
                  setDirty(true)
                }}
              />
            </Field>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-ink">Subcategories</p>
            {currentCategories.length === 0 ? (
              <p className="text-xs text-muted">Add income or expense categories above to configure subcategories.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {currentCategories.map((category) => (
                  <Field key={category} label={category}>
                    <input
                      className="input"
                      placeholder="Comma separated, optional"
                      value={subcategories[category] || ''}
                      onChange={(event) => {
                        setSubcategories({ ...subcategories, [category]: event.target.value })
                        setDirty(true)
                      }}
                    />
                  </Field>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Backup & restore"
            description="A backup is a single JSON file containing every record. Keep one outside this device."
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={downloadBackup}>
              <Download size={15} /> Download backup
            </Button>
            <Button onClick={() => backupInput.current?.click()}>
              <Upload size={15} /> Restore from file
            </Button>
            <input
              ref={backupInput}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleBackupFile(file)
                event.target.value = ''
              }}
            />
          </div>
          <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-xs leading-relaxed text-muted">
            Restoring replaces everything currently in this workspace. Your browser is the only place data lives, so
            download a backup before clearing site data or switching devices.
          </p>
          <p className="mt-3 text-xs text-muted">
            <span className="font-semibold text-ink">{totalRecords}</span> records across {counts.filter((row) => row.count > 0).length} collections.
          </p>
        </Card>

        <Card>
          <SectionTitle title="Demo workspace" description="Explore a complete sample business without touching your own records." />
          <div className="flex flex-wrap items-center gap-2">
            {data.settings.demoMode ? (
              <>
                <Badge tone="brand">Demo data is loaded</Badge>
                <Button variant="danger" onClick={() => setDemoConfirm(true)} disabled={busy}>
                  <Trash2 size={15} /> Remove demo data
                </Button>
              </>
            ) : (
              <>
                <Badge tone="neutral">Your own records</Badge>
                <Button onClick={() => void loadDemo()} disabled={busy}>
                  <Sparkles size={15} /> Load demo workspace
                </Button>
              </>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Demo data is tagged with <span className="font-mono">demo-</span> identifiers. Removing it deletes only
            those records and restores your previous business profile and categories.
          </p>
        </Card>

        <Card className="xl:col-span-2">
          <SectionTitle title="Recent activity" description="The last actions performed in this workspace." />
          {data.activityLogs.length === 0 ? (
            <p className="text-xs text-muted">No activity recorded yet.</p>
          ) : (
            <div className="grid gap-1">
              {data.activityLogs.slice(0, 20).map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-canvas">
                  <span className="flex items-center gap-2">
                    <Badge tone="neutral">{entry.entity}</Badge>
                    {entry.message}
                  </span>
                  <span className="text-[11px] text-muted">{formatDateTime(entry.at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="xl:col-span-2 border-danger/30">
          <SectionTitle
            title="Danger zone"
            description="These actions cannot be undone. Download a backup first."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="danger" onClick={() => setResetOpen(true)} disabled={busy}>
              <RotateCcw size={15} /> Reset entire workspace
            </Button>
            <span className="text-xs text-muted">Deletes all records and returns to a clean business with default settings.</span>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Changes stay on this device until you save them. Unsaved changes are not written to the database.
        </p>
        <Button variant="primary" onClick={() => void save()}>
          <Save size={15} /> Save settings
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(importCandidate)}
        title="Restore this backup?"
        message={
          importCandidate
            ? `This will replace all current records with the backup exported on ${formatDateTime(importCandidate.exportedAt)}. Download a backup of the current workspace first if you may need it.`
            : ''
        }
        confirmLabel="Restore backup"
        tone="primary"
        busy={busy}
        onCancel={() => setImportCandidate(null)}
        onConfirm={() => void restore()}
      />

      <ConfirmDialog
        open={demoConfirm}
        title="Remove demo data"
        message="All records tagged as demo data will be deleted and your previous business profile restored. Records you created yourself are kept."
        confirmLabel="Remove demo data"
        busy={busy}
        onCancel={() => setDemoConfirm(false)}
        onConfirm={() => {
          setDemoConfirm(false)
          void clearDemo()
        }}
      />

      <Modal
        open={resetOpen}
        title="Reset entire workspace"
        description="This permanently deletes every record on this device."
        onClose={() => {
          setResetOpen(false)
          setResetText('')
        }}
        footer={
          <>
            <Button
              onClick={() => {
                setResetOpen(false)
                setResetText('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={resetText !== 'RESET' || busy}
              onClick={() => {
                setResetOpen(false)
                setResetText('')
                void resetAll()
              }}
            >
              {busy ? 'Resetting…' : 'Reset workspace'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <div className="rounded-xl bg-danger-soft px-3 py-2 text-xs leading-relaxed text-danger">
            <span className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle size={14} /> This cannot be undone
            </span>
            <p className="mt-1">
              All clients, invoices, products, stock movements, bills and settings will be deleted from this browser.
              There is no cloud copy to recover from.
            </p>
          </div>
          <Field label='Type "RESET" to confirm' htmlFor="reset-confirm">
            <input
              id="reset-confirm"
              className="input"
              autoFocus
              value={resetText}
              onChange={(event) => setResetText(event.target.value)}
            />
          </Field>
          <Button onClick={downloadBackup}>
            <Download size={14} /> Download a backup first
          </Button>
        </div>
      </Modal>
    </>
  )
}
