import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Wallet
} from 'lucide-react'
import type { Bill, BillFrequency, Budget, ExpenseTransaction, Goal, GoalType } from '../lib/types'
import { useApp } from '../store/app'
import { useData, useQuickCreate } from '../components/hooks'
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
  ProgressBar,
  SectionTitle,
  StatusBadge,
  labelize
} from '../components/ui'
import { financialSummary } from '../lib/calc'
import { formatCurrency, round2, safeNumber, sumBy } from '../lib/money'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  formatDate,
  nextRecurringDate,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  toISODate,
  todayISO
} from '../lib/dates'
import { exportCSV } from '../lib/csv'
import { nowISO, uid } from '../lib/db'

const TABS = [
  { label: 'Bills & calendar', to: '/planning/bills' },
  { label: 'Budgets & goals', to: '/planning/budgets' }
]

const FREQUENCIES: BillFrequency[] = ['once', 'weekly', 'monthly', 'quarterly', 'yearly']
const BUDGET_PERIODS: Budget['period'][] = ['monthly', 'quarterly', 'yearly']
const GOAL_TYPES: GoalType[] = ['revenue', 'profit', 'savings', 'custom']

/* -------------------------------------------------------------------------- */
/* Bills                                                                      */
/* -------------------------------------------------------------------------- */

interface BillForm {
  name: string
  category: string
  amount: number
  dueDate: string
  frequency: BillFrequency
  accountId: string
  notes: string
}

export function BillsPage() {
  const data = useData()
  const put = useApp((state) => state.put)
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)

  const [statusFilter, setStatusFilter] = useState<'all' | Bill['status']>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Bill | null>(null)
  const [deleting, setDeleting] = useState<Bill | null>(null)
  const [paying, setPaying] = useState<string | null>(null)
  const [month, setMonth] = useState(() => todayISO().slice(0, 7))

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  useQuickCreate(openCreate)

  const today = todayISO()
  const rows = useMemo(
    () =>
      data.bills
        .filter((bill) => statusFilter === 'all' || bill.status === statusFilter)
        .slice()
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [data.bills, statusFilter]
  )

  const unpaid = data.bills.filter((bill) => bill.status === 'unpaid')
  const overdue = unpaid.filter((bill) => bill.dueDate < today)
  const dueSoon = unpaid.filter((bill) => bill.dueDate >= today && bill.dueDate <= addDays(today, 7))
  const paidThisMonth = data.bills.filter(
    (bill) => bill.status === 'paid' && bill.paidDate?.slice(0, 7) === today.slice(0, 7)
  )

  const payBill = async (bill: Bill) => {
    setPaying(bill.id)
    try {
      const timestamp = nowISO()
      const expense: ExpenseTransaction = {
        id: uid('exp'),
        date: today,
        description: `${bill.name} (bill)`,
        category: bill.category,
        subcategory: '',
        supplierId: null,
        accountId: bill.accountId,
        amount: bill.amount,
        taxAmount: 0,
        paymentMethod: 'bank-transfer',
        dueDate: bill.dueDate,
        receiptReference: bill.id,
        recurring: bill.frequency !== 'once',
        notes: 'Created automatically when the bill was marked paid.',
        createdAt: timestamp,
        updatedAt: timestamp
      }
      await put('expenseTransactions', expense)
      await put('bills', { ...bill, status: 'paid', paidDate: today, updatedAt: timestamp })
      if (bill.frequency !== 'once') {
        const nextDue = nextRecurringDate(bill.dueDate, bill.frequency)
        const next: Bill = {
          ...bill,
          id: uid('bill'),
          dueDate: nextDue,
          status: 'unpaid',
          paidDate: null,
          notes: bill.notes,
          createdAt: timestamp,
          updatedAt: timestamp
        }
        await put('bills', next)
        notify(`${bill.name} paid. Next ${bill.frequency} bill scheduled for ${formatDate(nextDue, data.settings.dateFormat)}.`, 'success')
      } else {
        notify(`${bill.name} marked paid and recorded as an expense.`, 'success')
      }
      await log('payment', `Paid bill ${bill.name}`, 'Bill', bill.id)
    } finally {
      setPaying(null)
    }
  }

  const deleteBill = async () => {
    if (!deleting) return
    await remove('bills', deleting.id)
    await log('delete', `Deleted bill ${deleting.name}`, 'Bill', deleting.id)
    notify('Bill deleted. Any expense already recorded for it stays in your books.', 'success')
    setDeleting(null)
  }

  const exportBills = () => {
    exportCSV(`bills-${today}.csv`, rows, [
      { key: 'name', label: 'Bill', getValue: (row) => row.name },
      { key: 'category', label: 'Category', getValue: (row) => row.category },
      { key: 'amount', label: 'Amount', getValue: (row) => row.amount },
      { key: 'dueDate', label: 'Due date', getValue: (row) => row.dueDate },
      { key: 'frequency', label: 'Frequency', getValue: (row) => row.frequency },
      { key: 'status', label: 'Status', getValue: (row) => row.status },
      { key: 'paidDate', label: 'Paid date', getValue: (row) => row.paidDate || '' }
    ])
    void log('export', `Exported ${rows.length} bills to CSV`, 'Bill')
    notify('Bill list exported.', 'success')
  }

  const monthBills = data.bills.filter((bill) => bill.dueDate.slice(0, 7) === month)
  const monthLabel = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1).toLocaleDateString(
    undefined,
    { month: 'long', year: 'numeric' }
  )

  const shiftMonth = (delta: number) => {
    setMonth(addMonths(`${month}-01`, delta).slice(0, 7))
  }

  return (
    <>
      <PageHeader
        eyebrow="Planning"
        title="Bills & calendar"
        description="See what is due, pay bills in one click and let recurring bills reschedule themselves."
        actions={
          <>
            <Button onClick={exportBills} disabled={!rows.length}>
              <Download size={15} /> Export
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add bill
            </Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Unpaid bills"
          value={formatCurrency(sumBy(unpaid, (bill) => bill.amount), data.settings)}
          hint={`${unpaid.length} bill${unpaid.length === 1 ? '' : 's'} outstanding`}
          tone="warning"
          icon={<Wallet size={17} />}
        />
        <KpiCard
          label="Overdue"
          value={String(overdue.length)}
          hint={formatCurrency(sumBy(overdue, (bill) => bill.amount), data.settings)}
          tone={overdue.length ? 'danger' : 'success'}
        />
        <KpiCard label="Due in 7 days" value={String(dueSoon.length)} tone={dueSoon.length ? 'warning' : 'neutral'} />
        <KpiCard
          label="Paid this month"
          value={formatCurrency(sumBy(paidThisMonth, (bill) => bill.amount), data.settings)}
          tone="success"
          icon={<CheckCircle2 size={17} />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">All bills</p>
              <p className="text-xs text-muted">Marking a bill paid records an expense in the selected account.</p>
            </div>
            <select
              className="select w-auto min-w-[150px]"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              aria-label="Filter bills by status"
            >
              <option value="all">All statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <DataTable
            rows={rows}
            searchable={(row) => `${row.name} ${row.category} ${row.notes}`}
            pageSize={10}
            emptyTitle="No bills yet"
            emptyDescription="Add rent, subscriptions, supplier invoices and other recurring costs."
            emptyAction={
              <Button variant="primary" onClick={openCreate}>
                <Plus size={15} /> Add bill
              </Button>
            }
            initialSort={{ key: 'dueDate', direction: 'asc' }}
            columns={[
              {
                key: 'name',
                label: 'Bill',
                sortValue: (row) => row.name,
                render: (row) => (
                  <div>
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-[11px] text-muted">{row.category}</p>
                  </div>
                )
              },
              {
                key: 'dueDate',
                label: 'Due',
                sortValue: (row) => row.dueDate,
                render: (row) => (
                  <span
                    className={
                      row.status === 'unpaid' && row.dueDate < today ? 'font-semibold text-danger' : ''
                    }
                  >
                    {formatDate(row.dueDate, data.settings.dateFormat)}
                  </span>
                )
              },
              {
                key: 'amount',
                label: 'Amount',
                align: 'right',
                sortValue: (row) => row.amount,
                render: (row) => formatCurrency(row.amount, data.settings)
              },
              {
                key: 'frequency',
                label: 'Repeats',
                sortValue: (row) => row.frequency,
                render: (row) => <Badge tone="neutral">{labelize(row.frequency)}</Badge>
              },
              {
                key: 'status',
                label: 'Status',
                sortValue: (row) => row.status,
                render: (row) => <StatusBadge status={row.status} />
              },
              {
                key: 'actions',
                label: '',
                align: 'right',
                render: (row) => (
                  <div className="flex justify-end gap-1">
                    {row.status === 'unpaid' ? (
                      <Button small variant="primary" disabled={paying === row.id} onClick={() => void payBill(row)}>
                        {paying === row.id ? 'Paying…' : 'Mark paid'}
                      </Button>
                    ) : null}
                    <IconButton
                      label={`Edit ${row.name}`}
                      onClick={() => {
                        setEditing(row)
                        setModalOpen(true)
                      }}
                    >
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton label={`Delete ${row.name}`} onClick={() => setDeleting(row)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                )
              }
            ]}
          />
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Calendar</p>
              <p className="text-xs text-muted">{monthLabel}</p>
            </div>
            <div className="flex gap-1">
              <IconButton label="Previous month" onClick={() => shiftMonth(-1)}>
                <ArrowLeft size={15} />
              </IconButton>
              <IconButton label="Next month" onClick={() => shiftMonth(1)}>
                <ArrowRight size={15} />
              </IconButton>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-muted">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays(month).map((day, index) => {
              const bills = day ? monthBills.filter((bill) => bill.dueDate === day) : []
              const isToday = day === today
              return (
                <div
                  key={day || `blank-${index}`}
                  className={`min-h-[62px] rounded-lg border p-1 text-left ${
                    day ? 'border-line bg-white' : 'border-transparent'
                  } ${isToday ? 'ring-1 ring-brand' : ''}`}
                >
                  {day ? (
                    <>
                      <span className={`text-[10px] font-semibold ${isToday ? 'text-brand' : 'text-muted'}`}>
                        {Number(day.slice(8, 10))}
                      </span>
                      <div className="mt-0.5 grid gap-0.5">
                        {bills.slice(0, 2).map((bill) => (
                          <button
                            key={bill.id}
                            type="button"
                            title={`${bill.name} · ${formatCurrency(bill.amount, data.settings)}`}
                            className={`truncate rounded px-1 text-left text-[9px] leading-[14px] ${
                              bill.status === 'paid'
                                ? 'bg-success-soft text-success'
                                : bill.dueDate < today
                                  ? 'bg-danger-soft text-danger'
                                  : 'bg-brand-soft text-brand-dark'
                            }`}
                            onClick={() => {
                              setEditing(bill)
                              setModalOpen(true)
                            }}
                          >
                            {bill.name}
                          </button>
                        ))}
                        {bills.length > 2 ? (
                          <span className="px-1 text-[9px] text-muted">+{bills.length - 2} more</span>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand" /> Unpaid
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-danger" /> Overdue
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success" /> Paid
            </span>
          </div>
        </Card>
      </div>

      <BillModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete bill"
        message={`Delete "${deleting?.name || ''}"? Expenses already recorded for it will stay in your books.`}
        confirmLabel="Delete bill"
        onCancel={() => setDeleting(null)}
        onConfirm={() => void deleteBill()}
      />
    </>
  )
}

function calendarDays(month: string): (string | null)[] {
  const [year, monthNumber] = month.split('-').map(Number)
  const offset = new Date(year, monthNumber - 1, 1).getDay()
  const total = new Date(year, monthNumber, 0).getDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < offset; i += 1) cells.push(null)
  for (let day = 1; day <= total; day += 1) {
    cells.push(toISODate(new Date(year, monthNumber - 1, day)))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function BillModal({
  open,
  editing,
  onClose
}: {
  open: boolean
  editing: Bill | null
  onClose: () => void
}) {
  const data = useData()
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [form, setForm] = useState<BillForm>({
    name: '',
    category: '',
    amount: 0,
    dueDate: todayISO(),
    frequency: 'monthly',
    accountId: '',
    notes: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      editing
        ? {
            name: editing.name,
            category: editing.category,
            amount: editing.amount,
            dueDate: editing.dueDate,
            frequency: editing.frequency,
            accountId: editing.accountId,
            notes: editing.notes
          }
        : {
            name: '',
            category: data.settings.expenseCategories[0] || 'Other Expenses',
            amount: 0,
            dueDate: todayISO(),
            frequency: 'monthly',
            accountId: data.accounts[0]?.id || '',
            notes: ''
          }
    )
    setError('')
  }, [open, editing, data.settings.expenseCategories, data.accounts])

  const save = async () => {
    if (!form.name.trim()) {
      setError('Enter a bill name.')
      return
    }
    if (form.amount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (!form.accountId) {
      setError('Create an account in Finance before adding bills.')
      return
    }
    const timestamp = nowISO()
    const record: Bill = {
      id: editing?.id || uid('bill'),
      name: form.name.trim(),
      category: form.category,
      amount: round2(form.amount),
      dueDate: form.dueDate || todayISO(),
      frequency: form.frequency,
      accountId: form.accountId,
      status: editing?.status || 'unpaid',
      paidDate: editing?.paidDate || null,
      notes: form.notes.trim(),
      seriesId: editing?.seriesId || uid('bill-series'),
      createdAt: editing?.createdAt || timestamp,
      updatedAt: timestamp
    }
    await put('bills', record)
    await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Added'} bill ${record.name}`, 'Bill', record.id)
    notify(editing ? 'Bill updated.' : 'Bill added.', 'success')
    onClose()
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit bill' : 'Add bill'}
      description="Recurring bills create the next due date automatically when you mark them paid."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void save()}>
            {editing ? 'Save changes' : 'Add bill'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <FormGrid>
          <Field label="Bill name" htmlFor="bill-name">
            <input
              id="bill-name"
              className="input"
              value={form.name}
              autoFocus
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Category">
            <select
              className="select"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {data.settings.expenseCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount">
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: safeNumber(event.target.value) })}
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </Field>
          <Field label="Repeats">
            <select
              className="select"
              value={form.frequency}
              onChange={(event) => setForm({ ...form, frequency: event.target.value as BillFrequency })}
            >
              {FREQUENCIES.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {labelize(frequency)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pay from account">
            <select
              className="select"
              value={form.accountId}
              onChange={(event) => setForm({ ...form, accountId: event.target.value })}
            >
              {data.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Field>
        </FormGrid>
        <Field label="Notes">
          <textarea
            className="textarea"
            rows={2}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </Field>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Budgets and goals                                                          */
/* -------------------------------------------------------------------------- */

interface BudgetForm {
  name: string
  category: string
  amount: number
  period: Budget['period']
  startDate: string
}

export function BudgetsPage() {
  const data = useData()
  const put = useApp((state) => state.put)
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)

  const [budgetOpen, setBudgetOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)

  const today = todayISO()

  const budgetRows = useMemo(
    () =>
      data.budgets.map((budget) => {
        const spent = sumBy(
          data.expenseTransactions.filter(
            (row) => row.category === budget.category && row.date >= budget.startDate && row.date <= budget.endDate
          ),
          (row) => row.amount
        )
        return {
          ...budget,
          spent,
          remaining: round2(budget.amount - spent),
          percent: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        }
      }),
    [data.budgets, data.expenseTransactions]
  )

  const totalBudgeted = sumBy(budgetRows, (row) => row.amount)
  const totalSpent = sumBy(budgetRows, (row) => row.spent)
  const overBudget = budgetRows.filter((row) => row.spent > row.amount)

  const goalRows = useMemo(
    () =>
      data.goals.map((goal) => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
        const actual = goalActuals(data, goal)
        return { ...goal, progress, actual }
      }),
    [data]
  )

  const syncGoal = async (goal: Goal) => {
    const actual = goalActuals(data, goal)
    if (actual === null) {
      notify('Savings and custom goals are updated manually.', 'info')
      return
    }
    await put('goals', { ...goal, currentAmount: actual, updatedAt: nowISO() })
    await log('update', `Updated goal ${goal.name} from actuals`, 'Goal', goal.id)
    notify('Goal progress updated from your books.', 'success')
  }

  const deleteBudget = async () => {
    if (!deletingBudget) return
    await remove('budgets', deletingBudget.id)
    await log('delete', `Deleted budget ${deletingBudget.name}`, 'Budget', deletingBudget.id)
    notify('Budget deleted.', 'success')
    setDeletingBudget(null)
  }

  const deleteGoal = async () => {
    if (!deletingGoal) return
    await remove('goals', deletingGoal.id)
    await log('delete', `Deleted goal ${deletingGoal.name}`, 'Goal', deletingGoal.id)
    notify('Goal deleted.', 'success')
    setDeletingGoal(null)
  }

  return (
    <>
      <PageHeader
        eyebrow="Planning"
        title="Budgets & goals"
        description="Compare planned spending with real expenses and track the targets that matter."
        actions={
          <>
            <Button
              onClick={() => {
                setEditingGoal(null)
                setGoalOpen(true)
              }}
            >
              <Target size={15} /> Add goal
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditingBudget(null)
                setBudgetOpen(true)
              }}
            >
              <Plus size={15} /> Add budget
            </Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Budgeted" value={formatCurrency(totalBudgeted, data.settings)} icon={<Wallet size={17} />} />
        <KpiCard label="Spent" value={formatCurrency(totalSpent, data.settings)} tone="warning" />
        <KpiCard
          label="Remaining"
          value={formatCurrency(round2(totalBudgeted - totalSpent), data.settings)}
          tone={totalBudgeted - totalSpent < 0 ? 'danger' : 'success'}
        />
        <KpiCard
          label="Over budget"
          value={String(overBudget.length)}
          tone={overBudget.length ? 'danger' : 'success'}
          hint={overBudget.length ? overBudget.map((row) => row.category).slice(0, 2).join(', ') : 'All budgets on track'}
        />
      </div>

      <Card className="mb-4">
        <SectionTitle
          title="Budgets"
          description="Actual spending uses expense transactions inside each budget period."
          action={
            <Button
              small
              onClick={() => {
                setEditingBudget(null)
                setBudgetOpen(true)
              }}
            >
              <Plus size={14} /> New budget
            </Button>
          }
        />
        {budgetRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No budgets yet. Add one to start tracking spending.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {budgetRows.map((budget) => (
              <div key={budget.id} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{budget.name}</p>
                    <p className="text-[11px] text-muted">
                      {budget.category} · {labelize(budget.period)} · {formatDate(budget.startDate, data.settings.dateFormat)} –{' '}
                      {formatDate(budget.endDate, data.settings.dateFormat)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <IconButton
                      label={`Edit ${budget.name}`}
                      onClick={() => {
                        setEditingBudget(budget)
                        setBudgetOpen(true)
                      }}
                    >
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton label={`Delete ${budget.name}`} onClick={() => setDeletingBudget(budget)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </div>
                <div className="mt-2 flex items-end justify-between text-sm">
                  <span className="font-semibold">{formatCurrency(budget.spent, data.settings)}</span>
                  <span className="text-xs text-muted">of {formatCurrency(budget.amount, data.settings)}</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={budget.spent} max={budget.amount || 1} />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className={budget.remaining < 0 ? 'text-danger' : 'text-muted'}>
                    {budget.remaining < 0
                      ? `${formatCurrency(Math.abs(budget.remaining), data.settings)} over budget`
                      : `${formatCurrency(budget.remaining, data.settings)} left`}
                  </span>
                  <Badge tone={budget.percent > 100 ? 'danger' : budget.percent > 85 ? 'warning' : 'success'}>
                    {budget.percent.toFixed(0)}% used
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle
          title="Goals"
          description="Revenue and profit goals can sync with your actual income and expenses."
          action={
            <Button
              small
              onClick={() => {
                setEditingGoal(null)
                setGoalOpen(true)
              }}
            >
              <Plus size={14} /> New goal
            </Button>
          }
        />
        {goalRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No goals yet. Add a revenue, profit or savings target.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {goalRows.map((goal) => (
              <div key={goal.id} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{goal.name}</p>
                    <p className="text-[11px] text-muted">
                      {labelize(goal.type)} · {labelize(goal.period)} · target {formatDate(goal.targetDate, data.settings.dateFormat)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <IconButton
                      label={`Edit ${goal.name}`}
                      onClick={() => {
                        setEditingGoal(goal)
                        setGoalOpen(true)
                      }}
                    >
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton label={`Delete ${goal.name}`} onClick={() => setDeletingGoal(goal)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </div>
                <div className="mt-2 flex items-end justify-between text-sm">
                  <span className="font-semibold">{formatCurrency(goal.currentAmount, data.settings)}</span>
                  <span className="text-xs text-muted">of {formatCurrency(goal.targetAmount, data.settings)}</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={goal.currentAmount} max={goal.targetAmount || 1} />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                  <Badge tone={goal.progress >= 100 ? 'success' : goal.progress >= 60 ? 'brand' : 'neutral'}>
                    {goal.progress.toFixed(0)}%
                  </Badge>
                  {goal.actual !== null ? (
                    <Button small variant="ghost" onClick={() => void syncGoal(goal)}>
                      <TrendingUp size={13} /> Sync actual ({formatCurrency(goal.actual, data.settings)})
                    </Button>
                  ) : (
                    <span className="text-muted">Update progress manually</span>
                  )}
                </div>
                {goal.targetDate < today && goal.progress < 100 ? (
                  <p className="mt-1 text-[11px] text-danger">Target date has passed.</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <BudgetModal
        open={budgetOpen}
        editing={editingBudget}
        onClose={() => setBudgetOpen(false)}
        onSave={async (record, isEditing) => {
          await put('budgets', record)
          await log(isEditing ? 'update' : 'create', `${isEditing ? 'Updated' : 'Added'} budget ${record.name}`, 'Budget', record.id)
          notify(isEditing ? 'Budget updated.' : 'Budget added.', 'success')
        }}
      />
      <GoalModal
        open={goalOpen}
        editing={editingGoal}
        onClose={() => setGoalOpen(false)}
        onSave={async (record, isEditing) => {
          await put('goals', record)
          await log(isEditing ? 'update' : 'create', `${isEditing ? 'Updated' : 'Added'} goal ${record.name}`, 'Goal', record.id)
          notify(isEditing ? 'Goal updated.' : 'Goal added.', 'success')
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingBudget)}
        title="Delete budget"
        message={`Delete "${deletingBudget?.name || ''}"? Expense transactions are not affected.`}
        confirmLabel="Delete budget"
        onCancel={() => setDeletingBudget(null)}
        onConfirm={() => void deleteBudget()}
      />
      <ConfirmDialog
        open={Boolean(deletingGoal)}
        title="Delete goal"
        message={`Delete "${deletingGoal?.name || ''}"?`}
        confirmLabel="Delete goal"
        onCancel={() => setDeletingGoal(null)}
        onConfirm={() => void deleteGoal()}
      />
    </>
  )
}

function goalActuals(data: ReturnType<typeof useData>, goal: Goal): number | null {
  if (goal.type !== 'revenue' && goal.type !== 'profit') return null
  const start =
    goal.period === 'monthly'
      ? startOfMonth(goal.targetDate)
      : goal.period === 'quarterly'
        ? startOfQuarter(goal.targetDate)
        : startOfYear(goal.targetDate)
  const end = goal.targetDate < todayISO() ? goal.targetDate : todayISO()
  const summary = financialSummary(data, start, end)
  return goal.type === 'revenue' ? summary.revenue : summary.netProfit
}

function budgetEndDate(start: string, period: Budget['period']): string {
  if (period === 'monthly') return endOfMonth(start)
  if (period === 'quarterly') return endOfQuarter(start)
  return endOfYear(start)
}

function BudgetModal({
  open,
  editing,
  onClose,
  onSave
}: {
  open: boolean
  editing: Budget | null
  onClose: () => void
  onSave: (record: Budget, isEditing: boolean) => Promise<void>
}) {
  const data = useData()
  const [form, setForm] = useState<BudgetForm>({
    name: '',
    category: '',
    amount: 0,
    period: 'monthly',
    startDate: startOfMonth()
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      editing
        ? {
            name: editing.name,
            category: editing.category,
            amount: editing.amount,
            period: editing.period,
            startDate: editing.startDate
          }
        : {
            name: '',
            category: data.settings.expenseCategories[0] || 'Other Expenses',
            amount: 0,
            period: 'monthly',
            startDate: startOfMonth()
          }
    )
    setError('')
  }, [open, editing, data.settings.expenseCategories])

  const save = async () => {
    if (!form.name.trim()) {
      setError('Enter a budget name.')
      return
    }
    if (form.amount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    const startDate = form.startDate || startOfMonth()
    const record: Budget = {
      id: editing?.id || uid('budget'),
      name: form.name.trim(),
      category: form.category,
      amount: round2(form.amount),
      period: form.period,
      startDate,
      endDate: budgetEndDate(startDate, form.period),
      createdAt: editing?.createdAt || nowISO(),
      updatedAt: nowISO()
    }
    await onSave(record, Boolean(editing))
    onClose()
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit budget' : 'Add budget'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void save()}>
            {editing ? 'Save changes' : 'Add budget'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field label="Budget name" htmlFor="budget-name">
          <input
            id="budget-name"
            className="input"
            value={form.name}
            autoFocus
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </Field>
        <FormGrid>
          <Field label="Expense category">
            <select
              className="select"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {data.settings.expenseCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount">
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: safeNumber(event.target.value) })}
            />
          </Field>
          <Field label="Period">
            <select
              className="select"
              value={form.period}
              onChange={(event) => setForm({ ...form, period: event.target.value as Budget['period'] })}
            >
              {BUDGET_PERIODS.map((period) => (
                <option key={period} value={period}>
                  {labelize(period)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start date" hint={`Ends ${formatDate(budgetEndDate(form.startDate || startOfMonth(), form.period), data.settings.dateFormat)}`}>
            <input
              type="date"
              className="input"
              value={form.startDate}
              onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            />
          </Field>
        </FormGrid>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  )
}

interface GoalForm {
  name: string
  type: GoalType
  targetAmount: number
  currentAmount: number
  period: Goal['period']
  targetDate: string
}

function GoalModal({
  open,
  editing,
  onClose,
  onSave
}: {
  open: boolean
  editing: Goal | null
  onClose: () => void
  onSave: (record: Goal, isEditing: boolean) => Promise<void>
}) {
  const [form, setForm] = useState<GoalForm>({
    name: '',
    type: 'revenue',
    targetAmount: 0,
    currentAmount: 0,
    period: 'monthly',
    targetDate: addDays(todayISO(), 30)
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      editing
        ? {
            name: editing.name,
            type: editing.type,
            targetAmount: editing.targetAmount,
            currentAmount: editing.currentAmount,
            period: editing.period,
            targetDate: editing.targetDate
          }
        : {
            name: '',
            type: 'revenue',
            targetAmount: 0,
            currentAmount: 0,
            period: 'monthly',
            targetDate: addDays(todayISO(), 30)
          }
    )
    setError('')
  }, [open, editing])

  const save = async () => {
    if (!form.name.trim()) {
      setError('Enter a goal name.')
      return
    }
    if (form.targetAmount <= 0) {
      setError('Enter a target amount greater than zero.')
      return
    }
    const record: Goal = {
      id: editing?.id || uid('goal'),
      name: form.name.trim(),
      type: form.type,
      targetAmount: round2(form.targetAmount),
      currentAmount: round2(Math.max(0, form.currentAmount)),
      period: form.period,
      targetDate: form.targetDate || addDays(todayISO(), 30),
      createdAt: editing?.createdAt || nowISO(),
      updatedAt: nowISO()
    }
    await onSave(record, Boolean(editing))
    onClose()
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit goal' : 'Add goal'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void save()}>
            {editing ? 'Save changes' : 'Add goal'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field label="Goal name" htmlFor="goal-name">
          <input
            id="goal-name"
            className="input"
            value={form.name}
            autoFocus
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </Field>
        <FormGrid>
          <Field label="Goal type">
            <select
              className="select"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as GoalType })}
            >
              {GOAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {labelize(type)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Period">
            <select
              className="select"
              value={form.period}
              onChange={(event) => setForm({ ...form, period: event.target.value as Goal['period'] })}
            >
              {BUDGET_PERIODS.map((period) => (
                <option key={period} value={period}>
                  {labelize(period)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Target amount">
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={form.targetAmount}
              onChange={(event) => setForm({ ...form, targetAmount: safeNumber(event.target.value) })}
            />
          </Field>
          <Field label="Current amount" hint="Manual value; revenue and profit goals can be synced later.">
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={form.currentAmount}
              onChange={(event) => setForm({ ...form, currentAmount: safeNumber(event.target.value) })}
            />
          </Field>
          <Field label="Target date">
            <input
              type="date"
              className="input"
              value={form.targetDate}
              onChange={(event) => setForm({ ...form, targetDate: event.target.value })}
            />
          </Field>
        </FormGrid>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  )
}
