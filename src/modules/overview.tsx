import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  Package,
  Receipt,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet
} from 'lucide-react'
import { useApp } from '../store/app'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  KpiCard,
  PageHeader,
  PeriodPicker,
  ProgressBar,
  SectionTitle,
  StatusBadge
} from '../components/ui'
import { usePeriod } from '../components/hooks'
import {
  accountBalance,
  categoryBreakdown,
  clientSummary,
  financialSummary,
  invoiceBalance,
  lowStockProducts,
  monthlySeries,
  orderItemCount,
  productPerformance
} from '../lib/calc'
import { formatCurrency, formatPercent } from '../lib/money'
import { addDays, daysUntil, formatDate, todayISO } from '../lib/dates'
import type { BusinessSettings } from '../lib/types'

const CHART_COLORS = ['#F26A2C', '#D9531E', '#E5A12C', '#299D68', '#777777', '#F5A97F', '#B8B2AC', '#8C5A3C']

export function Overview() {
  const data = useApp((state) => state.data)
  const busy = useApp((state) => state.busy)
  const loadDemo = useApp((state) => state.loadDemo)
  const period = usePeriod('last-12')
  const [demoError, setDemoError] = useState<string | null>(null)

  const summary = useMemo(
    () => (data ? financialSummary(data, period.start, period.end) : null),
    [data, period.start, period.end]
  )
  const series = useMemo(
    () => (data ? monthlySeries(data, period.start, period.end) : []),
    [data, period.start, period.end]
  )
  const products = useMemo(
    () => (data ? productPerformance(data, period.start, period.end) : []),
    [data, period.start, period.end]
  )

  if (!data || !summary) {
    return <EmptyState title="Preparing your workspace" description="Your local database is loading." />
  }

  const settings = data.settings
  const hasData =
    data.incomeTransactions.length +
      data.expenseTransactions.length +
      data.orders.length +
      data.invoices.length +
      data.products.length >
    0

  if (!hasData) {
    return <WelcomeScreen busy={busy} error={demoError} onDemo={() => {
      setDemoError(null)
      void loadDemo().catch((error: unknown) => setDemoError(error instanceof Error ? error.message : 'Demo could not be loaded.'))
    }} />
  }

  const today = todayISO()
  const { income, expenses } = {
    income: data.incomeTransactions.filter((row) => row.date >= period.start && row.date <= period.end),
    expenses: data.expenseTransactions.filter((row) => row.date >= period.start && row.date <= period.end)
  }
  const lowStock = lowStockProducts(data)
  const upcomingBills = data.bills
    .filter((bill) => bill.status === 'unpaid' && bill.dueDate <= addDays(today, 14))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const openInvoices = data.invoices
    .filter((invoice) => invoice.status !== 'void' && invoiceBalance(invoice, data.payments, data.refunds, today).balance > 0.005)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const periodOrders = data.orders.filter((order) => order.date >= period.start && order.date <= period.end)
  const outstanding = openInvoices.reduce(
    (sum, invoice) => sum + invoiceBalance(invoice, data.payments, data.refunds, today).balance,
    0
  )
  const recentTransactions = [
    ...income.map((row) => ({ id: row.id, kind: 'Income' as const, date: row.date, description: row.description, amount: row.amount, category: row.category })),
    ...expenses.map((row) => ({ id: row.id, kind: 'Expense' as const, date: row.date, description: row.description, amount: row.amount, category: row.category }))
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
  const recentOrders = [...data.orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const topProducts = products.slice(0, 6)
  const incomeCategories = categoryBreakdown(income)
  const expenseCategories = categoryBreakdown(expenses)
  const hasChartData = series.some((point) => point.revenue > 0 || point.expenses > 0)
  const recentClients = [...data.clients]
    .map((client) => ({ client, summary: clientSummary(data, client.id) }))
    .sort((a, b) => (b.summary.lastActivity || '').localeCompare(a.summary.lastActivity || ''))
    .slice(0, 5)

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={settings.businessName || 'Business overview'}
        description="Live figures calculated from your local ledger. Nothing leaves this device."
        actions={<PeriodPicker kind={period.kind} start={period.start} end={period.end} onChange={period.onChange} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={formatCurrency(summary.revenue, settings)}
          hint={`${summary.transactions} transactions in ${period.label.toLowerCase()}`}
          tone="brand"
          icon={<ArrowUpRight size={17} />}
        />
        <KpiCard
          label="Expenses"
          value={formatCurrency(summary.expenses, settings)}
          hint={`${expenses.length} expense records`}
          tone="danger"
          icon={<ArrowDownRight size={17} />}
        />
        <KpiCard
          label="Net profit"
          value={formatCurrency(summary.netProfit, settings)}
          hint={`Profit margin ${formatPercent(summary.margin)}`}
          tone={summary.netProfit >= 0 ? 'success' : 'danger'}
          icon={<CircleDollarSign size={17} />}
        />
        <KpiCard
          label="Outstanding invoices"
          value={formatCurrency(outstanding, settings)}
          hint={`${openInvoices.length} unpaid or partly paid`}
          tone={outstanding > 0 ? 'warning' : 'success'}
          icon={<Receipt size={17} />}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Orders" value={String(periodOrders.length)} hint={`${data.orders.length} orders all time`} icon={<ShoppingCart size={17} />} />
        <KpiCard label="Low-stock products" value={String(lowStock.length)} hint={lowStock.length ? 'At or below reorder level' : 'Everything is stocked'} tone={lowStock.length ? 'warning' : 'success'} icon={<Package size={17} />} />
        <KpiCard label="Bills due in 14 days" value={formatCurrency(upcomingBills.reduce((sum, bill) => sum + bill.amount, 0), settings)} hint={`${upcomingBills.length} unpaid bills`} icon={<CalendarClock size={17} />} />
        <KpiCard label="Tax collected" value={formatCurrency(summary.taxCollected, settings)} hint={`Tax paid ${formatCurrency(summary.taxPaid, settings)}`} icon={<Wallet size={17} />} />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Revenue vs expenses" description="Monthly cash flow from your transaction ledger." />
          {hasChartData ? (
            <div aria-label="Bar chart of monthly revenue and expenses" role="img">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#F26A2C" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="expenses" name="Expenses" fill="#D9534F" radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No transactions in this period" description="Add income or expenses, or choose a wider reporting period." action={<Link className="btn btn-primary btn-sm" to="/finance/income?new=1">Add income</Link>} />
          )}
        </Card>

        <Card>
          <SectionTitle title="Profit trend" description="Net profit per month, after all recorded expenses." />
          {hasChartData ? (
            <div aria-label="Line chart of monthly net profit" role="img">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                  <Line type="monotone" dataKey="profit" name="Net profit" stroke="#299D68" strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Profit trend needs transactions" description="Once you record income and expenses, the trend appears here." />
          )}
        </Card>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Card>
          <SectionTitle title="Income by category" description="Where revenue came from." />
          {incomeCategories.length ? (
            <DonutChart data={incomeCategories} settings={settings} label="Income by category" />
          ) : (
            <EmptyState title="No income recorded" description="Income chart appears after your first sale." />
          )}
        </Card>
        <Card>
          <SectionTitle title="Expenses by category" description="Where money was spent." />
          {expenseCategories.length ? (
            <DonutChart data={expenseCategories} settings={settings} label="Expenses by category" />
          ) : (
            <EmptyState title="No expenses recorded" description="Expense chart appears after your first expense." />
          )}
        </Card>
        <Card>
          <SectionTitle title="Account balances" description="Calculated from opening balances, transactions and transfers." />
          <div className="grid gap-2.5">
            {data.accounts.map((account) => {
              const balance = accountBalance(data, account.id)
              return (
                <div key={account.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted">{account.type.replace('-', ' ')}</p>
                  </div>
                  <p className={`text-sm font-bold ${balance < 0 ? 'text-danger' : 'text-ink'}`}>
                    {formatCurrency(balance, settings)}
                  </p>
                </div>
              )
            })}
            {data.accounts.length === 0 ? <EmptyState title="No accounts yet" description="Add an account in Finance → Accounts." /> : null}
          </div>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Sales by product" description={`Revenue from invoiced products · ${period.label}`} />
          {topProducts.length ? (
            <div aria-label="Horizontal bar chart of sales by product" role="img">
              <ResponsiveContainer width="100%" height={Math.max(220, topProducts.length * 38)}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#5c5854' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                  <Bar dataKey="value" name="Sales" fill="#F26A2C" radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No product sales in this period" description="Issue an invoice with catalog products to see product performance." />
          )}
        </Card>

        <Card>
          <SectionTitle title="Sales by month" description="Invoiced sales (excluding void invoices)." />
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F26A2C" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#F26A2C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                <Area type="monotone" dataKey="sales" name="Invoiced sales" stroke="#F26A2C" strokeWidth={2} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No invoices yet" description="Create an invoice to populate sales analytics." />
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle title="Recent transactions" description="Latest income and expenses." action={<Link to="/finance/income" className="text-xs font-semibold text-brand-dark">View finance</Link>} />
          {recentTransactions.length ? (
            <div className="grid gap-1">
              {recentTransactions.map((row) => (
                <div key={`${row.kind}-${row.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-canvas">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${row.kind === 'Income' ? 'bg-[#e7f6ee] text-success' : 'bg-[#fbe9e8] text-danger'}`}>
                    {row.kind === 'Income' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.description}</p>
                    <p className="text-[11px] text-muted">{formatDate(row.date, settings.dateFormat)} · {row.category}</p>
                  </div>
                  <span className={`text-sm font-semibold ${row.kind === 'Income' ? 'text-success' : 'text-danger'}`}>
                    {row.kind === 'Income' ? '+' : '−'}{formatCurrency(row.amount, settings)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No transactions yet" description="Record income or an expense to start your ledger." action={<Link className="btn btn-primary btn-sm" to="/finance/income?new=1">Add income</Link>} />
          )}
        </Card>

        <Card>
          <SectionTitle title="Unpaid & overdue invoices" description="Balances derived from the payment ledger." action={<Link to="/sales/invoices" className="text-xs font-semibold text-brand-dark">All invoices</Link>} />
          {openInvoices.length ? (
            <div className="grid gap-2">
              {openInvoices.slice(0, 5).map((invoice) => {
                const balance = invoiceBalance(invoice, data.payments, data.refunds, today)
                const overdue = invoice.dueDate < today
                return (
                  <div key={invoice.id} className="rounded-lg border border-line px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{invoice.number}</span>
                      <StatusBadge status={overdue ? 'overdue' : balance.status} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted">
                      <span>{formatDate(invoice.dueDate, settings.dateFormat)}</span>
                      <span className="font-semibold text-ink">{formatCurrency(balance.balance, settings)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState title="No outstanding invoices" description="Every issued invoice is fully paid." />
          )}
        </Card>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Card>
          <SectionTitle title="Recent orders" description="Newest sales orders." action={<Link to="/sales/orders" className="text-xs font-semibold text-brand-dark">All orders</Link>} />
          {recentOrders.length ? (
            <div className="grid gap-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold">{order.number}</p>
                    <p className="text-[11px] text-muted">{formatDate(order.date, settings.dateFormat)} · {orderItemCount(data.orderItems.filter((item) => item.orderId === order.id))} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(order.total, settings)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No orders yet" description="Create your first order." action={<Link className="btn btn-primary btn-sm" to="/sales/orders?new=1">New order</Link>} />
          )}
        </Card>

        <Card>
          <SectionTitle title="Low-stock products" description="At or below the reorder threshold." action={<Link to="/products/inventory" className="text-xs font-semibold text-brand-dark">Inventory</Link>} />
          {lowStock.length ? (
            <div className="grid gap-2">
              {lowStock.slice(0, 6).map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0 text-warning" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-[11px] text-muted">Reorder at {product.reorderThreshold}</p>
                    </div>
                  </div>
                  <Badge tone="warning">{product.stockQuantity} left</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Stock levels look healthy" description="No products are below their reorder threshold." />
          )}
        </Card>

        <Card>
          <SectionTitle title="Upcoming bills" description="Unpaid bills due in the next 14 days." action={<Link to="/planning/bills" className="text-xs font-semibold text-brand-dark">Bill calendar</Link>} />
          {upcomingBills.length ? (
            <div className="grid gap-2">
              {upcomingBills.slice(0, 6).map((bill) => {
                const days = daysUntil(bill.dueDate)
                return (
                  <div key={bill.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{bill.name}</p>
                      <p className="text-[11px] text-muted">
                        {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `Due in ${days} days`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(bill.amount, settings)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState title="No bills due soon" description="You are clear for the next two weeks." />
          )}
        </Card>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Card>
          <SectionTitle title="Top-selling products" description={`By invoiced revenue · ${period.label}`} />
          {topProducts.length ? (
            <ol className="grid gap-2">
              {topProducts.slice(0, 5).map((product, index) => (
                <li key={product.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-dark">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{product.name}</span>
                  <span className="text-xs font-semibold text-muted">{product.quantity} sold</span>
                  <span className="text-sm font-semibold">{formatCurrency(product.value, settings)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No product sales" description="Product rankings appear after invoicing catalog items." />
          )}
        </Card>

        <Card>
          <SectionTitle title="Recent clients" description="Clients with the newest activity." action={<Link to="/clients/list" className="text-xs font-semibold text-brand-dark">Client CRM</Link>} />
          {recentClients.length ? (
            <div className="grid gap-2">
              {recentClients.map(({ client, summary: clientStats }) => (
                <div key={client.id} className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-dark">
                    {client.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{client.name}</p>
                    <p className="text-[11px] text-muted">{client.company || client.email || 'Individual'}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted">{clientStats.orders} orders</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No clients yet" description="Add clients to see relationship insights." />
          )}
        </Card>

        <Card>
          <SectionTitle title="Business goals" description="Progress for the current period." action={<Link to="/planning/budgets" className="text-xs font-semibold text-brand-dark">Planning</Link>} />
          {data.goals.length ? (
            <div className="grid gap-3">
              {data.goals.slice(0, 4).map((goal) => {
                const actual =
                  goal.type === 'revenue'
                    ? summary.revenue
                    : goal.type === 'profit'
                      ? summary.netProfit
                      : goal.currentAmount
                const percent = goal.targetAmount > 0 ? Math.min(100, (actual / goal.targetAmount) * 100) : 0
                return (
                  <div key={goal.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-ink">{goal.name}</span>
                      <span className="text-muted">{formatCurrency(actual, settings)} / {formatCurrency(goal.targetAmount, settings)}</span>
                    </div>
                    <ProgressBar value={percent} />
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState title="No goals yet" description="Set revenue or savings goals in Planning." />
          )}
        </Card>
      </div>
    </div>
  )
}

function DonutChart({
  data,
  settings,
  label
}: {
  data: { name: string; value: number }[]
  settings: BusinessSettings
  label: string
}) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0)
  return (
    <div aria-label={label} role="img">
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
          <Legend
            verticalAlign="bottom"
            height={54}
            formatter={(value) => <span className="text-[11px] text-[#5c5854]">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center text-[11px] text-muted">Total {formatCurrency(total, settings)}</p>
    </div>
  )
}

function WelcomeScreen({
  busy,
  error,
  onDemo
}: {
  busy: boolean
  error: string | null
  onDemo: () => void
}) {
  return (
    <div>
      <div className="card overflow-hidden">
        <div className="grid gap-6 p-6 sm:p-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <Badge tone="brand">Offline-first · No account required</Badge>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              Run your small business from one calm workspace.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              Track income and expenses, send invoices, manage products and stock, look after clients, plan bills and
              understand performance. Everything is stored locally in your browser, and you can export a full backup
              at any time.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" onClick={onDemo} disabled={busy}>
                <Sparkles size={16} /> {busy ? 'Preparing demo…' : 'Explore demo business'}
              </Button>
              <Link to="/finance/income?new=1" className="btn btn-secondary">
                Start with my own income
              </Link>
            </div>
            {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              The demo uses a fictional studio ("Orange & Oak Studio") with realistic, connected records. It is clearly
              labelled and can be removed from Settings without touching your own data.
            </p>
          </div>
          <div className="grid gap-2.5">
            {[
              ['Finance', 'Income, expenses, accounts, transfers and tax summaries.'],
              ['Sales', 'Orders, quotes, invoices, payments and refunds.'],
              ['Products', 'Catalog, pricing calculator, materials and stock ledger.'],
              ['Clients', 'CRM profiles, tasks and communication history.'],
              ['Planning', 'Bills, budgets and business goals.'],
              ['Reports', 'Period comparisons, product and client reports, CSV and PDF.']
            ].map(([title, description]) => (
              <div key={title} className="flex items-start gap-3 rounded-xl border border-line bg-brand-pale/50 p-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand-dark">
                  {title === 'Finance' ? <Wallet size={14} /> : title === 'Sales' ? <ShoppingCart size={14} /> : title === 'Products' ? <Package size={14} /> : title === 'Clients' ? <Users size={14} /> : title === 'Planning' ? <CalendarClock size={14} /> : <Receipt size={14} />}
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {[
          ['Your data stays here', 'Business records live in IndexedDB on this device. No cloud database, no mandatory login.'],
          ['Works offline after loading', 'The app installs its shell so you can keep working without a connection.'],
          ['Back up often', 'Browser storage can be cleared. Export a JSON backup from Settings to keep a safe copy.']
        ].map(([title, description]) => (
          <Card key={title}>
            <p className="text-sm font-bold">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
