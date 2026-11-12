import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  Download,
  Landmark,
  Pencil,
  Plus,
  Receipt,
  ShieldCheck,
  Trash2,
  Upload
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type {
  Account,
  AccountType,
  ExpenseTransaction,
  IncomeTransaction,
  Transfer
} from '../lib/types'
import { useApp } from '../store/app'
import { useData, usePeriod, useQuickCreate } from '../components/hooks'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Field,
  FormGrid,
  IconButton,
  KpiCard,
  Modal,
  PageHeader,
  PageTabs,
  PeriodPicker,
  SectionTitle
} from '../components/ui'
import type { CsvField } from '../components/forms'
import { CsvImportModal } from '../components/forms'
import { accountBalance, categoryBreakdown, monthlySeries, taxSummary } from '../lib/calc'
import { formatCurrency, round2, safeNumber, sumBy } from '../lib/money'
import {
  formatDate,
  monthsInRange,
  parseDateInput,
  todayISO
} from '../lib/dates'
import { exportCSV } from '../lib/csv'
import { nowISO, uid } from '../lib/db'

const TABS = [
  { label: 'Income', to: '/finance/income' },
  { label: 'Expenses', to: '/finance/expenses' },
  { label: 'Accounts & transfers', to: '/finance/accounts' },
  { label: 'Tax tracker', to: '/finance/tax' }
]

export const PAYMENT_METHODS = ['cash', 'credit-card', 'debit-card', 'bank-transfer', 'paypal', 'etsy', 'stripe', 'check', 'other']

/* -------------------------------------------------------------------------- */
/* Income                                                                     */
/* -------------------------------------------------------------------------- */

interface IncomeForm {
  date: string
  description: string
  category: string
  subcategory: string
  amount: number
  taxAmount: number
  accountId: string
  paymentMethod: string
  clientId: string
  reference: string
  notes: string
}

function blankIncome(data: ReturnType<typeof useData>): IncomeForm {
  return {
    date: todayISO(),
    description: '',
    category: data.settings.incomeCategories[0] || 'Other Income',
    subcategory: '',
    amount: 0,
    taxAmount: 0,
    accountId: data.accounts[0]?.id || '',
    paymentMethod: 'bank-transfer',
    clientId: '',
    reference: '',
    notes: ''
  }
}

export function IncomePage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const period = usePeriod('last-12')
  const [category, setCategory] = useState('all')
  const [accountId, setAccountId] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<IncomeTransaction | null>(null)
  const [deleting, setDeleting] = useState<IncomeTransaction | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  useQuickCreate(openCreate)

  const rows = useMemo(
    () =>
      data.incomeTransactions
        .filter((row) => row.date >= period.start && row.date <= period.end)
        .filter((row) => category === 'all' || row.category === category)
        .filter((row) => accountId === 'all' || row.accountId === accountId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.incomeTransactions, period.start, period.end, category, accountId]
  )

  const total = sumBy(rows, (row) => row.amount)
  const tax = sumBy(rows, (row) => row.taxAmount)

  const doDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await remove('incomeTransactions', deleting.id)
      await log('delete', `Deleted income "${deleting.description}"`, 'Income', deleting.id)
      notify('Income record deleted.', 'success')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const importFields: CsvField[] = [
    { key: 'date', label: 'Date', aliases: ['date received', 'transaction date'], required: true },
    { key: 'description', label: 'Description', aliases: ['details', 'memo', 'name'], required: true },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', aliases: ['total', 'gross'], required: true },
    { key: 'tax', label: 'Tax amount', aliases: ['tax'] },
    { key: 'account', label: 'Account' },
    { key: 'method', label: 'Payment method', aliases: ['method'] },
    { key: 'client', label: 'Client' },
    { key: 'reference', label: 'Reference', aliases: ['ref', 'receipt'] },
    { key: 'notes', label: 'Notes' }
  ]

  const runImport = async (importRows: Record<string, string>[]) => {
    const fallbackAccount = data.accounts[0]?.id || ''
    const records: IncomeTransaction[] = []
    for (const row of importRows) {
      const amount = round2(safeNumber(row.amount))
      if (!row.description || amount <= 0) continue
      const account =
        data.accounts.find(
          (item) => item.name.toLowerCase() === (row.account || '').toLowerCase()
        )?.id || fallbackAccount
      const client =
        data.clients.find((item) => item.name.toLowerCase() === (row.client || '').toLowerCase())?.id || null
      records.push({
        id: uid('income'),
        date: parseDateInput(row.date),
        description: row.description,
        category: row.category || data.settings.incomeCategories[0] || 'Other Income',
        subcategory: '',
        amount,
        taxAmount: round2(safeNumber(row.tax)),
        accountId: account,
        paymentMethod: row.method || 'bank-transfer',
        clientId: client,
        invoiceId: null,
        orderId: null,
        reference: row.reference || '',
        notes: row.notes || '',
        createdAt: nowISO(),
        updatedAt: nowISO()
      })
    }
    await useApp.getState().putMany('incomeTransactions', records)
    await log('import', `Imported ${records.length} income records`, 'Income')
    notify(`${records.length} income records imported.`, 'success')
    return records.length
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortValue: (row: IncomeTransaction) => row.date,
      render: (row: IncomeTransaction) => formatDate(row.date, data.settings.dateFormat)
    },
    {
      key: 'description',
      label: 'Description',
      sortValue: (row: IncomeTransaction) => row.description,
      render: (row: IncomeTransaction) => (
        <div>
          <p className="font-medium">{row.description}</p>
          <p className="text-[11px] text-muted">
            {row.category}
            {row.clientId ? ` · ${data.clients.find((client) => client.id === row.clientId)?.name || 'Client'}` : ''}
          </p>
        </div>
      )
    },
    {
      key: 'account',
      label: 'Account',
      sortValue: (row: IncomeTransaction) => row.accountId,
      render: (row: IncomeTransaction) =>
        data.accounts.find((account) => account.id === row.accountId)?.name || '—'
    },
    {
      key: 'method',
      label: 'Method',
      render: (row: IncomeTransaction) => <span className="capitalize">{row.paymentMethod.replace('-', ' ')}</span>
    },
    {
      key: 'tax',
      label: 'Tax',
      align: 'right' as const,
      render: (row: IncomeTransaction) => formatCurrency(row.taxAmount, data.settings)
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      sortValue: (row: IncomeTransaction) => row.amount,
      render: (row: IncomeTransaction) => (
        <span className="font-semibold text-success">{formatCurrency(row.amount, data.settings)}</span>
      )
    },
    {
      key: 'actions',
      label: '',
      className: 'w-1',
      render: (row: IncomeTransaction) => (
        <div className="table-actions">
          <IconButton
            label="Edit income"
            onClick={() => {
              setEditing(row)
              setModalOpen(true)
            }}
          >
            <Pencil size={14} />
          </IconButton>
          <IconButton label="Delete income" onClick={() => setDeleting(row)}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Income"
        description="Every payment you receive. Payments recorded against invoices are added here automatically."
        actions={
          <>
            <Button onClick={() => setImportOpen(true)}>
              <Upload size={15} /> Import
            </Button>
            <Button
              onClick={() => {
                exportCSV(`income-${period.start}-to-${period.end}.csv`, rows, [
                  { key: 'date', label: 'Date', getValue: (row) => row.date },
                  { key: 'description', label: 'Description', getValue: (row) => row.description },
                  { key: 'category', label: 'Category', getValue: (row) => row.category },
                  { key: 'amount', label: 'Amount', getValue: (row) => row.amount },
                  { key: 'tax', label: 'Tax amount', getValue: (row) => row.taxAmount },
                  {
                    key: 'account',
                    label: 'Account',
                    getValue: (row) => data.accounts.find((account) => account.id === row.accountId)?.name || ''
                  },
                  { key: 'method', label: 'Payment method', getValue: (row) => row.paymentMethod },
                  { key: 'reference', label: 'Reference', getValue: (row) => row.reference }
                ])
                void log('export', 'Exported income CSV', 'Income')
              }}
            >
              <Download size={15} /> Export
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add income
            </Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Income in period" value={formatCurrency(total, data.settings)} tone="success" icon={<Receipt size={16} />} />
        <KpiCard label="Transactions" value={String(rows.length)} hint={period.label} />
        <KpiCard label="Tax collected" value={formatCurrency(tax, data.settings)} />
        <KpiCard
          label="Average receipt"
          value={formatCurrency(rows.length ? total / rows.length : 0, data.settings)}
        />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <PeriodPicker kind={period.kind} start={period.start} end={period.end} onChange={period.onChange} />
          <div>
            <label className="label" htmlFor="income-category">Category</label>
            <select id="income-category" className="select min-w-[160px]" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {data.settings.incomeCategories.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="income-account">Account</label>
            <select id="income-account" className="select min-w-[160px]" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
              <option value="all">All accounts</option>
              {data.accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          rows={rows}
          columns={columns}
          searchable={(row) => `${row.description} ${row.category} ${row.reference} ${row.notes}`}
          emptyTitle="No income in this period"
          emptyDescription="Record a sale, a payment or any other money received. You can also import a CSV of past income."
          emptyAction={<Button variant="primary" onClick={openCreate}><Plus size={15} /> Add income</Button>}
        />
      </Card>

      <IncomeModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
      />

      <CsvImportModal
        open={importOpen}
        title="Import income from CSV"
        description="Dates can be YYYY-MM-DD or MM/DD/YYYY. Unknown accounts fall back to your first account."
        fields={importFields}
        templateName="income-template.csv"
        onClose={() => setImportOpen(false)}
        onImport={runImport}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete income record?"
        message={`"${deleting?.description || ''}" will be removed from your ledger. Invoice payment records are kept, so a linked payment will still show on its invoice.`}
        confirmLabel="Delete income"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={doDelete}
      />

      <p className="mt-3 text-[11px] text-muted">
        Income feeds revenue and profit reports. It does not update account balances twice: payments on invoices
        create the income entry for you.
      </p>
    </div>
  )
}

function IncomeModal({ open, editing, onClose }: { open: boolean; editing: IncomeTransaction | null; onClose: () => void }) {
  const data = useData()
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [form, setForm] = useState<IncomeForm>(() => blankIncome(data))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm(
      editing
        ? {
            date: editing.date,
            description: editing.description,
            category: editing.category,
            subcategory: editing.subcategory,
            amount: editing.amount,
            taxAmount: editing.taxAmount,
            accountId: editing.accountId,
            paymentMethod: editing.paymentMethod,
            clientId: editing.clientId || '',
            reference: editing.reference,
            notes: editing.notes
          }
        : blankIncome(data)
    )
  }, [open, editing, data])

  const set = (patch: Partial<IncomeForm>) => setForm((current) => ({ ...current, ...patch }))
  const subcategories = data.settings.subcategories[form.category] || []

  const save = async () => {
    if (!form.description.trim()) return setError('Add a short description so you can recognise this income.')
    if (!Number.isFinite(form.amount) || form.amount <= 0) return setError('Amount must be greater than zero.')
    if (!form.accountId) return setError('Choose the account that received the money.')
    setBusy(true)
    setError(null)
    try {
      const record: IncomeTransaction = {
        id: editing?.id || uid('income'),
        date: form.date,
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory,
        amount: round2(form.amount),
        taxAmount: round2(Math.max(0, form.taxAmount)),
        accountId: form.accountId,
        paymentMethod: form.paymentMethod,
        clientId: form.clientId || null,
        invoiceId: editing?.invoiceId || null,
        orderId: editing?.orderId || null,
        reference: form.reference,
        notes: form.notes,
        createdAt: editing?.createdAt || nowISO(),
        updatedAt: nowISO()
      }
      await put('incomeTransactions', record)
      await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Recorded'} income "${record.description}"`, 'Income', record.id)
      notify(editing ? 'Income updated.' : 'Income recorded.', 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Income could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit income' : 'Add income'}
      description="Use the gross amount you received. Enter tax separately if you collect it."
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add income'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <FormGrid>
          <Field label="Date" htmlFor="income-date">
            <input id="income-date" type="date" className="input" value={form.date} onChange={(event) => set({ date: event.target.value })} />
          </Field>
          <Field label="Amount received" htmlFor="income-amount">
            <input id="income-amount" type="number" min="0" step="0.01" className="input" value={form.amount} onChange={(event) => set({ amount: Number(event.target.value) })} />
          </Field>
          <Field label="Description" htmlFor="income-description" className="sm:col-span-2">
            <input id="income-description" className="input" placeholder="e.g. Market stall sales" value={form.description} onChange={(event) => set({ description: event.target.value })} />
          </Field>
          <Field label="Category" htmlFor="income-cat">
            <select id="income-cat" className="select" value={form.category} onChange={(event) => set({ category: event.target.value, subcategory: '' })}>
              {data.settings.incomeCategories.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Subcategory" htmlFor="income-sub" hint={subcategories.length ? undefined : 'No subcategories configured'}>
            <select id="income-sub" className="select" value={form.subcategory} onChange={(event) => set({ subcategory: event.target.value })} disabled={!subcategories.length}>
              <option value="">None</option>
              {subcategories.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Account" htmlFor="income-acc">
            <select id="income-acc" className="select" value={form.accountId} onChange={(event) => set({ accountId: event.target.value })}>
              <option value="">Choose an account</option>
              {data.accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Payment method" htmlFor="income-method">
            <select id="income-method" className="select" value={form.paymentMethod} onChange={(event) => set({ paymentMethod: event.target.value })}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{method.replace('-', ' ')}</option>
              ))}
            </select>
          </Field>
          <Field label="Tax amount" htmlFor="income-tax" hint="Leave zero if tax is not tracked.">
            <input id="income-tax" type="number" min="0" step="0.01" className="input" value={form.taxAmount} onChange={(event) => set({ taxAmount: Number(event.target.value) })} />
          </Field>
          <Field label="Client" htmlFor="income-client">
            <select id="income-client" className="select" value={form.clientId} onChange={(event) => set({ clientId: event.target.value })}>
              <option value="">No client</option>
              {data.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Reference" htmlFor="income-ref">
            <input id="income-ref" className="input" value={form.reference} onChange={(event) => set({ reference: event.target.value })} />
          </Field>
          <Field label="Notes" htmlFor="income-notes" className="sm:col-span-2">
            <textarea id="income-notes" className="textarea" value={form.notes} onChange={(event) => set({ notes: event.target.value })} />
          </Field>
        </FormGrid>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Expenses                                                                   */
/* -------------------------------------------------------------------------- */

interface ExpenseForm {
  date: string
  description: string
  category: string
  subcategory: string
  supplierId: string
  accountId: string
  amount: number
  taxAmount: number
  paymentMethod: string
  dueDate: string
  receiptReference: string
  recurring: boolean
  notes: string
}

function blankExpense(data: ReturnType<typeof useData>): ExpenseForm {
  return {
    date: todayISO(),
    description: '',
    category: data.settings.expenseCategories[0] || 'Other Expenses',
    subcategory: '',
    supplierId: '',
    accountId: data.accounts[0]?.id || '',
    amount: 0,
    taxAmount: 0,
    paymentMethod: 'credit-card',
    dueDate: '',
    receiptReference: '',
    recurring: false,
    notes: ''
  }
}

export function ExpensesPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const period = usePeriod('last-12')
  const [category, setCategory] = useState('all')
  const [accountId, setAccountId] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseTransaction | null>(null)
  const [deleting, setDeleting] = useState<ExpenseTransaction | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  useQuickCreate(openCreate)

  const rows = useMemo(
    () =>
      data.expenseTransactions
        .filter((row) => row.date >= period.start && row.date <= period.end)
        .filter((row) => category === 'all' || row.category === category)
        .filter((row) => accountId === 'all' || row.accountId === accountId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.expenseTransactions, period.start, period.end, category, accountId]
  )

  const total = sumBy(rows, (row) => row.amount)
  const tax = sumBy(rows, (row) => row.taxAmount)
  const breakdown = categoryBreakdown(rows)

  const doDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await remove('expenseTransactions', deleting.id)
      await log('delete', `Deleted expense "${deleting.description}"`, 'Expense', deleting.id)
      notify('Expense deleted.', 'success')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const importFields: CsvField[] = [
    { key: 'date', label: 'Date', aliases: ['paid date', 'transaction date'], required: true },
    { key: 'description', label: 'Description', aliases: ['details', 'vendor', 'memo'], required: true },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', aliases: ['total', 'cost'], required: true },
    { key: 'tax', label: 'Tax amount' },
    { key: 'account', label: 'Account' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'method', label: 'Payment method' },
    { key: 'reference', label: 'Reference', aliases: ['receipt'] },
    { key: 'notes', label: 'Notes' }
  ]

  const runImport = async (importRows: Record<string, string>[]) => {
    const fallbackAccount = data.accounts[0]?.id || ''
    const records: ExpenseTransaction[] = []
    for (const row of importRows) {
      const amount = round2(safeNumber(row.amount))
      if (!row.description || amount <= 0) continue
      records.push({
        id: uid('expense'),
        date: parseDateInput(row.date),
        description: row.description,
        category: row.category || data.settings.expenseCategories[0] || 'Other Expenses',
        subcategory: '',
        supplierId:
          data.suppliers.find((item) => item.name.toLowerCase() === (row.supplier || '').toLowerCase())?.id || null,
        accountId:
          data.accounts.find((item) => item.name.toLowerCase() === (row.account || '').toLowerCase())?.id ||
          fallbackAccount,
        amount,
        taxAmount: round2(safeNumber(row.tax)),
        paymentMethod: row.method || 'credit-card',
        dueDate: null,
        receiptReference: row.reference || '',
        recurring: false,
        notes: row.notes || '',
        createdAt: nowISO(),
        updatedAt: nowISO()
      })
    }
    await useApp.getState().putMany('expenseTransactions', records)
    await log('import', `Imported ${records.length} expense records`, 'Expense')
    notify(`${records.length} expenses imported.`, 'success')
    return records.length
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortValue: (row: ExpenseTransaction) => row.date,
      render: (row: ExpenseTransaction) => formatDate(row.date, data.settings.dateFormat)
    },
    {
      key: 'description',
      label: 'Description',
      sortValue: (row: ExpenseTransaction) => row.description,
      render: (row: ExpenseTransaction) => (
        <div>
          <p className="font-medium">{row.description}</p>
          <p className="text-[11px] text-muted">
            {row.category}
            {row.supplierId ? ` · ${data.suppliers.find((supplier) => supplier.id === row.supplierId)?.name || ''}` : ''}
          </p>
        </div>
      )
    },
    {
      key: 'account',
      label: 'Account',
      render: (row: ExpenseTransaction) => data.accounts.find((account) => account.id === row.accountId)?.name || '—'
    },
    {
      key: 'method',
      label: 'Method',
      render: (row: ExpenseTransaction) => <span className="capitalize">{row.paymentMethod.replace('-', ' ')}</span>
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      sortValue: (row: ExpenseTransaction) => row.amount,
      render: (row: ExpenseTransaction) => (
        <span className="font-semibold text-danger">{formatCurrency(row.amount, data.settings)}</span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row: ExpenseTransaction) => (
        <div className="table-actions">
          <IconButton
            label="Edit expense"
            onClick={() => {
              setEditing(row)
              setModalOpen(true)
            }}
          >
            <Pencil size={14} />
          </IconButton>
          <IconButton label="Delete expense" onClick={() => setDeleting(row)}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Expenses"
        description="Every business cost, grouped by category so you can see where the money goes."
        actions={
          <>
            <Button onClick={() => setImportOpen(true)}><Upload size={15} /> Import</Button>
            <Button
              onClick={() => {
                exportCSV(`expenses-${period.start}-to-${period.end}.csv`, rows, [
                  { key: 'date', label: 'Date', getValue: (row) => row.date },
                  { key: 'description', label: 'Description', getValue: (row) => row.description },
                  { key: 'category', label: 'Category', getValue: (row) => row.category },
                  { key: 'amount', label: 'Amount', getValue: (row) => row.amount },
                  { key: 'tax', label: 'Tax amount', getValue: (row) => row.taxAmount },
                  {
                    key: 'account',
                    label: 'Account',
                    getValue: (row) => data.accounts.find((account) => account.id === row.accountId)?.name || ''
                  },
                  { key: 'method', label: 'Payment method', getValue: (row) => row.paymentMethod },
                  { key: 'reference', label: 'Reference', getValue: (row) => row.receiptReference }
                ])
                void log('export', 'Exported expense CSV', 'Expense')
              }}
            >
              <Download size={15} /> Export
            </Button>
            <Button variant="primary" onClick={openCreate}><Plus size={15} /> Add expense</Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Expenses in period" value={formatCurrency(total, data.settings)} tone="danger" icon={<Receipt size={16} />} />
        <KpiCard label="Records" value={String(rows.length)} hint={period.label} />
        <KpiCard label="Largest category" value={breakdown[0]?.name || '—'} hint={breakdown[0] ? formatCurrency(breakdown[0].value, data.settings) : undefined} />
        <KpiCard label="Tax paid" value={formatCurrency(tax, data.settings)} />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <PeriodPicker kind={period.kind} start={period.start} end={period.end} onChange={period.onChange} />
          <div>
            <label className="label" htmlFor="expense-category">Category</label>
            <select id="expense-category" className="select min-w-[160px]" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {data.settings.expenseCategories.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="expense-account">Account</label>
            <select id="expense-account" className="select min-w-[160px]" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
              <option value="all">All accounts</option>
              {data.accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          rows={rows}
          columns={columns}
          searchable={(row) => `${row.description} ${row.category} ${row.receiptReference} ${row.notes}`}
          emptyTitle="No expenses in this period"
          emptyDescription="Record a cost such as materials, shipping or software, or import past expenses from a CSV file."
          emptyAction={<Button variant="primary" onClick={openCreate}><Plus size={15} /> Add expense</Button>}
        />
      </Card>

      <ExpenseModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />

      <CsvImportModal
        open={importOpen}
        title="Import expenses from CSV"
        description="Dates can be YYYY-MM-DD or MM/DD/YYYY. Unknown accounts fall back to your first account."
        fields={importFields}
        templateName="expenses-template.csv"
        onClose={() => setImportOpen(false)}
        onImport={runImport}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete expense?"
        message={`"${deleting?.description || ''}" will be removed from your ledger and from expense reports.`}
        confirmLabel="Delete expense"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={doDelete}
      />
    </div>
  )
}

function ExpenseModal({ open, editing, onClose }: { open: boolean; editing: ExpenseTransaction | null; onClose: () => void }) {
  const data = useData()
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [form, setForm] = useState<ExpenseForm>(() => blankExpense(data))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm(
      editing
        ? {
            date: editing.date,
            description: editing.description,
            category: editing.category,
            subcategory: editing.subcategory,
            supplierId: editing.supplierId || '',
            accountId: editing.accountId,
            amount: editing.amount,
            taxAmount: editing.taxAmount,
            paymentMethod: editing.paymentMethod,
            dueDate: editing.dueDate || '',
            receiptReference: editing.receiptReference,
            recurring: editing.recurring,
            notes: editing.notes
          }
        : blankExpense(data)
    )
  }, [open, editing, data])

  const set = (patch: Partial<ExpenseForm>) => setForm((current) => ({ ...current, ...patch }))
  const subcategories = data.settings.subcategories[form.category] || []

  const save = async () => {
    if (!form.description.trim()) return setError('Add a short description for this expense.')
    if (!Number.isFinite(form.amount) || form.amount <= 0) return setError('Amount must be greater than zero.')
    if (!form.accountId) return setError('Choose the account the money was paid from.')
    setBusy(true)
    setError(null)
    try {
      const record: ExpenseTransaction = {
        id: editing?.id || uid('expense'),
        date: form.date,
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory,
        supplierId: form.supplierId || null,
        accountId: form.accountId,
        amount: round2(form.amount),
        taxAmount: round2(Math.max(0, form.taxAmount)),
        paymentMethod: form.paymentMethod,
        dueDate: form.dueDate || null,
        receiptReference: form.receiptReference,
        recurring: form.recurring,
        notes: form.notes,
        createdAt: editing?.createdAt || nowISO(),
        updatedAt: nowISO()
      }
      await put('expenseTransactions', record)
      await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Recorded'} expense "${record.description}"`, 'Expense', record.id)
      notify(editing ? 'Expense updated.' : 'Expense recorded.', 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Expense could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit expense' : 'Add expense'}
      description="Enter the total paid. Keep receipts in your own files and store the reference here."
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add expense'}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <FormGrid>
          <Field label="Date" htmlFor="expense-date">
            <input id="expense-date" type="date" className="input" value={form.date} onChange={(event) => set({ date: event.target.value })} />
          </Field>
          <Field label="Amount paid" htmlFor="expense-amount">
            <input id="expense-amount" type="number" min="0" step="0.01" className="input" value={form.amount} onChange={(event) => set({ amount: Number(event.target.value) })} />
          </Field>
          <Field label="Description" htmlFor="expense-description" className="sm:col-span-2">
            <input id="expense-description" className="input" placeholder="e.g. Clay restock" value={form.description} onChange={(event) => set({ description: event.target.value })} />
          </Field>
          <Field label="Category" htmlFor="expense-cat">
            <select id="expense-cat" className="select" value={form.category} onChange={(event) => set({ category: event.target.value, subcategory: '' })}>
              {data.settings.expenseCategories.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Subcategory" htmlFor="expense-sub">
            <select id="expense-sub" className="select" value={form.subcategory} onChange={(event) => set({ subcategory: event.target.value })} disabled={!subcategories.length}>
              <option value="">None</option>
              {subcategories.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Account" htmlFor="expense-acc">
            <select id="expense-acc" className="select" value={form.accountId} onChange={(event) => set({ accountId: event.target.value })}>
              <option value="">Choose an account</option>
              {data.accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Supplier" htmlFor="expense-supplier">
            <select id="expense-supplier" className="select" value={form.supplierId} onChange={(event) => set({ supplierId: event.target.value })}>
              <option value="">No supplier</option>
              {data.suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Payment method" htmlFor="expense-method">
            <select id="expense-method" className="select" value={form.paymentMethod} onChange={(event) => set({ paymentMethod: event.target.value })}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{method.replace('-', ' ')}</option>
              ))}
            </select>
          </Field>
          <Field label="Tax amount" htmlFor="expense-tax">
            <input id="expense-tax" type="number" min="0" step="0.01" className="input" value={form.taxAmount} onChange={(event) => set({ taxAmount: Number(event.target.value) })} />
          </Field>
          <Field label="Due date" htmlFor="expense-due" hint="Optional — if this cost is not paid yet.">
            <input id="expense-due" type="date" className="input" value={form.dueDate} onChange={(event) => set({ dueDate: event.target.value })} />
          </Field>
          <Field label="Receipt reference" htmlFor="expense-ref">
            <input id="expense-ref" className="input" value={form.receiptReference} onChange={(event) => set({ receiptReference: event.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.recurring} onChange={(event) => set({ recurring: event.target.checked })} />
            This is a recurring expense
          </label>
          <Field label="Notes" htmlFor="expense-notes" className="sm:col-span-2">
            <textarea id="expense-notes" className="textarea" value={form.notes} onChange={(event) => set({ notes: event.target.value })} />
          </Field>
        </FormGrid>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Accounts                                                                   */
/* -------------------------------------------------------------------------- */

const ACCOUNT_TYPES: AccountType[] = ['checking', 'savings', 'cash', 'credit-card', 'custom']

export function AccountsPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [accountOpen, setAccountOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const [deletingTransfer, setDeletingTransfer] = useState<Transfer | null>(null)
  const [statementAccount, setStatementAccount] = useState<Account | null>(null)
  const [busy, setBusy] = useState(false)

  const total = data.accounts.reduce((sum, account) => sum + accountBalance(data, account.id), 0)
  const transfers = [...data.transfers].sort((a, b) => b.date.localeCompare(a.date))

  const deleteAccount = async () => {
    if (!deletingAccount) return
    setBusy(true)
    try {
      await remove('accounts', deletingAccount.id)
      await log('delete', `Deleted account "${deletingAccount.name}"`, 'Account', deletingAccount.id)
      notify('Account deleted. Existing transactions keep their history.', 'success')
      setDeletingAccount(null)
    } finally {
      setBusy(false)
    }
  }

  const deleteTransfer = async () => {
    if (!deletingTransfer) return
    setBusy(true)
    try {
      await remove('transfers', deletingTransfer.id)
      notify('Transfer deleted.', 'success')
      setDeletingTransfer(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Accounts & transfers"
        description="Balances are calculated from opening balances, every income and expense, and transfers between accounts."
        actions={
          <>
            <Button onClick={() => setTransferOpen(true)} disabled={data.accounts.length < 2}>
              <ArrowLeftRight size={15} /> Transfer
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null)
                setAccountOpen(true)
              }}
            >
              <Plus size={15} /> Add account
            </Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <KpiCard label="Combined balance" value={formatCurrency(total, data.settings)} tone={total < 0 ? 'danger' : 'success'} icon={<Landmark size={16} />} />
        <KpiCard label="Accounts" value={String(data.accounts.length)} hint={`${data.accounts.filter((account) => account.isActive).length} active`} />
        <KpiCard label="Transfers recorded" value={String(data.transfers.length)} hint="Never counted as income or expenses" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Accounts" description="Opening balance plus all activity." />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Opening</th>
                  <th style={{ textAlign: 'right' }}>Current</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((account) => {
                  const balance = accountBalance(data, account.id)
                  return (
                    <tr key={account.id}>
                      <td>
                        <p className="font-medium">{account.name}</p>
                        {!account.isActive ? <Badge tone="neutral">Inactive</Badge> : null}
                      </td>
                      <td className="capitalize">{account.type.replace('-', ' ')}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(account.openingBalance, data.settings)}</td>
                      <td style={{ textAlign: 'right' }} className={balance < 0 ? 'font-semibold text-danger' : 'font-semibold'}>
                        {formatCurrency(balance, data.settings)}
                      </td>
                      <td>
                        <div className="table-actions">
                          <Button small variant="ghost" onClick={() => setStatementAccount(account)}>Statement</Button>
                          <IconButton
                            label="Edit account"
                            onClick={() => {
                              setEditing(account)
                              setAccountOpen(true)
                            }}
                          >
                            <Pencil size={14} />
                          </IconButton>
                          <IconButton label="Delete account" onClick={() => setDeletingAccount(account)}>
                            <Trash2 size={14} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Transfers" description="Moving money between your own accounts." action={<Button small onClick={() => setTransferOpen(true)} disabled={data.accounts.length < 2}><Plus size={14} /> Transfer</Button>} />
          {transfers.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>From → To</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {transfers.slice(0, 12).map((transfer) => (
                    <tr key={transfer.id}>
                      <td>{formatDate(transfer.date, data.settings.dateFormat)}</td>
                      <td className="text-xs">
                        {data.accounts.find((account) => account.id === transfer.fromAccountId)?.name || '—'} →{' '}
                        {data.accounts.find((account) => account.id === transfer.toAccountId)?.name || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }} className="font-semibold">
                        {formatCurrency(transfer.amount, data.settings)}
                      </td>
                      <td>
                        <IconButton label="Delete transfer" onClick={() => setDeletingTransfer(transfer)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">No transfers yet.</p>
          )}
        </Card>
      </div>

      <AccountModal open={accountOpen} editing={editing} onClose={() => setAccountOpen(false)} />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />

      <ConfirmDialog
        open={Boolean(deletingAccount)}
        title="Delete account?"
        message={`"${deletingAccount?.name || ''}" will be removed. Transactions and payments that reference it remain in your records but will show an unknown account.`}
        confirmLabel="Delete account"
        busy={busy}
        onCancel={() => setDeletingAccount(null)}
        onConfirm={deleteAccount}
      />
      <ConfirmDialog
        open={Boolean(deletingTransfer)}
        title="Delete transfer?"
        message="The transfer will be removed and both account balances will update. This does not affect income or expenses."
        confirmLabel="Delete transfer"
        busy={busy}
        onCancel={() => setDeletingTransfer(null)}
        onConfirm={deleteTransfer}
      />

      <Modal
        open={Boolean(statementAccount)}
        title={statementAccount ? `${statementAccount.name} statement` : 'Account statement'}
        description="Opening balance, then the most recent activity."
        onClose={() => setStatementAccount(null)}
        wide
      >
        {statementAccount ? <AccountStatement account={statementAccount} /> : null}
      </Modal>

      <p className="mt-3 text-[11px] text-muted">
        <ShieldCheck size={12} className="mr-1 inline" />
        Transfers never count as revenue or expenses, so profit reports stay accurate.
      </p>
    </div>
  )
}

function AccountStatement({ account }: { account: Account }) {
  const data = useData()
  const entries = useMemo(() => {
    const rows = [
      ...data.incomeTransactions
        .filter((row) => row.accountId === account.id)
        .map((row) => ({ id: row.id, date: row.date, label: row.description, kind: 'Income', amount: row.amount })),
      ...data.expenseTransactions
        .filter((row) => row.accountId === account.id)
        .map((row) => ({ id: row.id, date: row.date, label: row.description, kind: 'Expense', amount: -row.amount })),
      ...data.transfers
        .filter((row) => row.fromAccountId === account.id)
        .map((row) => ({
          id: row.id,
          date: row.date,
          label: `Transfer to ${data.accounts.find((item) => item.id === row.toAccountId)?.name || 'account'}`,
          kind: 'Transfer out',
          amount: -row.amount
        })),
      ...data.transfers
        .filter((row) => row.toAccountId === account.id)
        .map((row) => ({
          id: row.id,
          date: row.date,
          label: `Transfer from ${data.accounts.find((item) => item.id === row.fromAccountId)?.name || 'account'}`,
          kind: 'Transfer in',
          amount: row.amount
        }))
    ]
    return rows.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60)
  }, [account, data])

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-2 text-sm">
        <span className="text-muted">Opening balance</span>
        <span className="font-semibold">{formatCurrency(account.openingBalance, data.settings)}</span>
        <span className="text-muted">Current balance</span>
        <span className="font-bold">{formatCurrency(accountBalance(data, account.id), data.settings)}</span>
      </div>
      {entries.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Detail</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={`${entry.kind}-${entry.id}`}>
                  <td>{formatDate(entry.date, data.settings.dateFormat)}</td>
                  <td>{entry.label}</td>
                  <td>{entry.kind}</td>
                  <td style={{ textAlign: 'right' }} className={entry.amount < 0 ? 'text-danger' : 'text-success'}>
                    {entry.amount < 0 ? '−' : '+'}
                    {formatCurrency(Math.abs(entry.amount), data.settings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted">No activity on this account yet.</p>
      )}
      <p className="mt-2 text-[11px] text-muted">Showing the 60 most recent entries.</p>
    </div>
  )
}

function AccountModal({ open, editing, onClose }: { open: boolean; editing: Account | null; onClose: () => void }) {
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('checking')
  const [openingBalance, setOpeningBalance] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(editing?.name || '')
    setType(editing?.type || 'checking')
    setOpeningBalance(editing?.openingBalance || 0)
    setIsActive(editing?.isActive ?? true)
    setError(null)
  }, [open, editing])

  const save = async () => {
    if (!name.trim()) return setError('Give the account a name.')
    setBusy(true)
    try {
      const record: Account = {
        id: editing?.id || uid('account'),
        name: name.trim(),
        type,
        openingBalance: round2(openingBalance),
        isActive,
        createdAt: editing?.createdAt || nowISO(),
        updatedAt: nowISO()
      }
      await put('accounts', record)
      await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Added'} account "${record.name}"`, 'Account', record.id)
      notify(editing ? 'Account updated.' : 'Account added.', 'success')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit account' : 'Add account'}
      description="Add each place your business keeps money."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save account'}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <Field label="Account name" htmlFor="account-name">
          <input id="account-name" className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Business Checking" />
        </Field>
        <FormGrid>
          <Field label="Type" htmlFor="account-type">
            <select id="account-type" className="select" value={type} onChange={(event) => setType(event.target.value as AccountType)}>
              {ACCOUNT_TYPES.map((value) => (
                <option key={value} value={value}>{value.replace('-', ' ')}</option>
              ))}
            </select>
          </Field>
          <Field label="Opening balance" htmlFor="account-opening" hint="The balance when you started using this app.">
            <input id="account-opening" type="number" step="0.01" className="input" value={openingBalance} onChange={(event) => setOpeningBalance(Number(event.target.value))} />
          </Field>
        </FormGrid>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          Active account
        </label>
      </div>
    </Modal>
  )
}

function TransferModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useData()
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setFrom(data.accounts[0]?.id || '')
    setTo(data.accounts[1]?.id || '')
    setAmount(0)
    setDate(todayISO())
    setNotes('')
    setError(null)
  }, [open, data.accounts])

  const save = async () => {
    if (!from || !to) return setError('Choose both accounts.')
    if (from === to) return setError('Choose two different accounts.')
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter a transfer amount greater than zero.')
    setBusy(true)
    try {
      const record: Transfer = {
        id: uid('transfer'),
        date,
        fromAccountId: from,
        toAccountId: to,
        amount: round2(amount),
        notes,
        createdAt: nowISO()
      }
      await put('transfers', record)
      await log('transfer', `Transferred ${formatCurrency(record.amount, data.settings)} between accounts`, 'Transfer', record.id)
      notify('Transfer recorded.', 'success')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Record a transfer"
      description="Transfers move money between your own accounts and never count as income or expenses."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Record transfer'}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <FormGrid>
          <Field label="From account" htmlFor="transfer-from">
            <select id="transfer-from" className="select" value={from} onChange={(event) => setFrom(event.target.value)}>
              {data.accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="To account" htmlFor="transfer-to">
            <select id="transfer-to" className="select" value={to} onChange={(event) => setTo(event.target.value)}>
              {data.accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount" htmlFor="transfer-amount">
            <input id="transfer-amount" type="number" min="0" step="0.01" className="input" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          </Field>
          <Field label="Date" htmlFor="transfer-date">
            <input id="transfer-date" type="date" className="input" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
        </FormGrid>
        <Field label="Notes" htmlFor="transfer-notes">
          <textarea id="transfer-notes" className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Tax tracker                                                                */
/* -------------------------------------------------------------------------- */

export function TaxPage() {
  const data = useData()
  const period = usePeriod('this-year')
  const summary = useMemo(() => taxSummary(data, period.start, period.end), [data, period.start, period.end])
  const series = useMemo(() => monthlySeries(data, period.start, period.end), [data, period.start, period.end])

  const rows = useMemo(() => {
    return monthsInRange(period.start, period.end).map((key) => {
      const income = data.incomeTransactions.filter((row) => row.date.startsWith(key))
      const expenses = data.expenseTransactions.filter((row) => row.date.startsWith(key))
      const collected = sumBy(income, (row) => row.taxAmount)
      const paid = sumBy(expenses, (row) => row.taxAmount)
      return {
        id: key,
        key,
        month: series.find((point) => point.key === key)?.month || key,
        collected,
        paid,
        net: round2(collected - paid)
      }
    })
  }, [data, period.start, period.end, series])

  const hasData = rows.some((row) => row.collected || row.paid)

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Tax tracker"
        description="An informational summary of the tax you recorded on income and expenses. It is not tax advice."
        actions={
          <>
            <Button
              onClick={() => {
                exportCSV(`tax-summary-${period.start}-to-${period.end}.csv`, rows, [
                  { key: 'month', label: 'Month', getValue: (row) => row.month },
                  { key: 'collected', label: 'Tax collected', getValue: (row) => row.collected },
                  { key: 'paid', label: 'Tax paid', getValue: (row) => row.paid },
                  { key: 'net', label: 'Net tax', getValue: (row) => row.net }
                ])
                void useApp.getState().log('export', 'Exported tax summary CSV', 'Tax')
              }}
            >
              <Download size={15} /> Export tax summary
            </Button>
            <Button onClick={() => window.print()}>Print</Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-3">
        <PeriodPicker kind={period.kind} start={period.start} end={period.end} onChange={period.onChange} />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tax collected" value={formatCurrency(summary.collected, data.settings)} tone="warning" />
        <KpiCard label="Tax paid" value={formatCurrency(summary.paid, data.settings)} />
        <KpiCard label="Net tax position" value={formatCurrency(summary.net, data.settings)} tone={summary.net > 0 ? 'warning' : 'success'} hint="Collected minus paid" />
        <KpiCard label="Taxable income" value={formatCurrency(summary.taxableIncome, data.settings)} hint="Income excluding recorded tax" />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Tax collected vs paid" description="Monthly, based on tax amounts entered on transactions." />
          {hasData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), data.settings)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="collected" name="Collected" fill="#E5A12C" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="paid" name="Paid" fill="#299D68" radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted">No tax amounts recorded in this period.</p>
          )}
        </Card>

        <Card>
          <SectionTitle title="Monthly breakdown" description="Useful when filing or setting money aside." />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ textAlign: 'right' }}>Collected</th>
                  <th style={{ textAlign: 'right' }}>Paid</th>
                  <th style={{ textAlign: 'right' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.month}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(row.collected, data.settings)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(row.paid, data.settings)}</td>
                    <td style={{ textAlign: 'right' }} className={row.net > 0 ? 'font-semibold text-warning' : 'font-semibold'}>
                      {formatCurrency(row.net, data.settings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mt-3">
        <SectionTitle title="What counts here" />
        <p className="text-xs leading-relaxed text-muted">
          Tax collected comes from the tax amount on income records and invoice payments. Tax paid comes from the tax
          amount on expenses. If you set your business to tax-inclusive pricing, document tax is back-calculated from
          the inclusive price. Always confirm your obligations with a qualified accountant.
        </p>
      </Card>
    </div>
  )
}
