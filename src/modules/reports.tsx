import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  Download,
  FileText,
  Printer
} from 'lucide-react'
import { useApp } from '../store/app'
import { useData, usePeriod } from '../components/hooks'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  KpiCard,
  PageHeader,
  PeriodPicker,
  SectionTitle
} from '../components/ui'
import {
  accountBalance,
  categoryBreakdown,
  clientSummary,
  financialSummary,
  invoiceAging,
  invoiceBalance,
  lowStockMaterials,
  lowStockProducts,
  monthlySeries,
  productPerformance,
  taxSummary
} from '../lib/calc'
import type { MonthlyPoint } from '../lib/calc'
import { formatCurrency, formatPercent, round2, sumBy } from '../lib/money'
import { addDays, diffDays, formatDate, monthKey, todayISO } from '../lib/dates'
import { exportCSV } from '../lib/csv'
import type { CSVColumn } from '../lib/csv'
import { downloadReportPdf } from '../lib/pdf'

type ReportType =
  | 'overview'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'comparison'
  | 'category'
  | 'account'
  | 'tax'
  | 'product'
  | 'inventory'
  | 'client'
  | 'invoice'

const REPORTS: { value: ReportType; label: string; description: string }[] = [
  { value: 'overview', label: 'Financial overview', description: 'Revenue, expenses, profit and category mix.' },
  { value: 'monthly', label: 'Monthly report', description: 'Month-by-month revenue, expenses and profit.' },
  { value: 'quarterly', label: 'Quarterly report', description: 'Three-month totals across the period.' },
  { value: 'annual', label: 'Annual report', description: 'Year totals for longer comparisons.' },
  { value: 'comparison', label: 'Period comparison', description: 'This period against the one before it.' },
  { value: 'category', label: 'Category report', description: 'Where income came from and expenses went.' },
  { value: 'account', label: 'Account report', description: 'Money in, out and current balances per account.' },
  { value: 'tax', label: 'Tax report', description: 'Tax collected, tax paid and the net position.' },
  { value: 'product', label: 'Product report', description: 'Units sold, revenue, cost and profit per product.' },
  { value: 'inventory', label: 'Inventory report', description: 'Stock value, low stock and movement summary.' },
  { value: 'client', label: 'Client report', description: 'Invoiced value and outstanding balances per client.' },
  { value: 'invoice', label: 'Invoice report', description: 'Invoice status, ageing and outstanding amounts.' }
]

const CHART_COLORS = ['#F26A2C', '#D9531E', '#E5A12C', '#299D68', '#777777', '#F5A97F', '#B8B2AC', '#8C5A3C']

interface Kpi {
  label: string
  value: string
  hint?: string
  tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'brand'
}

interface AggRow {
  id: string
  label: string
  revenue: number
  expenses: number
  profit: number
  sales: number
  orders: number
}

export function ReportsPage() {
  const data = useData()
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const period = usePeriod('last-12')
  const [report, setReport] = useState<ReportType>('overview')
  const settings = data.settings

  const summary = useMemo(() => financialSummary(data, period.start, period.end), [data, period.start, period.end])
  const series = useMemo(() => monthlySeries(data, period.start, period.end), [data, period.start, period.end])
  const incomeRows = useMemo(
    () => data.incomeTransactions.filter((row) => row.date >= period.start && row.date <= period.end),
    [data.incomeTransactions, period.start, period.end]
  )
  const expenseRows = useMemo(
    () => data.expenseTransactions.filter((row) => row.date >= period.start && row.date <= period.end),
    [data.expenseTransactions, period.start, period.end]
  )
  const incomeCats = useMemo(() => categoryBreakdown(incomeRows), [incomeRows])
  const expenseCats = useMemo(() => categoryBreakdown(expenseRows), [expenseRows])
  const products = useMemo(
    () => productPerformance(data, period.start, period.end),
    [data, period.start, period.end]
  )
  const taxes = useMemo(() => taxSummary(data, period.start, period.end), [data, period.start, period.end])
  const aging = useMemo(() => invoiceAging(data), [data])

  const quarterly = useMemo(() => aggregateSeries(series, quarterLabel), [series])
  const annual = useMemo(() => aggregateSeries(series, (key) => key.slice(0, 4)), [series])

  const days = diffDays(period.start, period.end) + 1
  const previousEnd = addDays(period.start, -1)
  const previousStart = addDays(previousEnd, -(days - 1))
  const previous = useMemo(
    () => financialSummary(data, previousStart, previousEnd),
    [data, previousStart, previousEnd]
  )

  const accountRows = useMemo(
    () =>
      data.accounts.map((account) => {
        const income = sumBy(incomeRows.filter((row) => row.accountId === account.id), (row) => row.amount)
        const expenses = sumBy(expenseRows.filter((row) => row.accountId === account.id), (row) => row.amount)
        const transfersIn = sumBy(data.transfers.filter((row) => row.toAccountId === account.id), (row) => row.amount)
        const transfersOut = sumBy(data.transfers.filter((row) => row.fromAccountId === account.id), (row) => row.amount)
        return {
          id: account.id,
          name: account.name,
          type: account.type,
          income,
          expenses,
          transfersIn,
          transfersOut,
          balance: accountBalance(data, account.id)
        }
      }),
    [data, incomeRows, expenseRows]
  )
  const totalAccountBalance = sumBy(accountRows, (row) => row.balance)

  const stock = useMemo(
    () =>
      data.products.map((product) => ({
        ...product,
        costValue: round2(product.stockQuantity * product.cost),
        retailValue: round2(product.stockQuantity * product.price)
      })),
    [data.products]
  )
  const stockCost = sumBy(stock, (row) => row.costValue)
  const stockRetail = sumBy(stock, (row) => row.retailValue)
  const materialValue = sumBy(data.materials, (material) => round2(material.currentStock * material.unitCost))
  const lowProducts = lowStockProducts(data)
  const lowMaterials = lowStockMaterials(data)

  const clientRows = useMemo(
    () =>
      data.clients
        .map((client) => ({ id: client.id, name: client.name, company: client.company, ...clientSummary(data, client.id) }))
        .filter((row) => row.orders > 0 || row.totalSales > 0)
        .sort((a, b) => b.totalSales - a.totalSales),
    [data]
  )
  const totalClientSales = sumBy(clientRows, (row) => row.totalSales)
  const totalClientOutstanding = sumBy(clientRows, (row) => row.outstanding)

  const periodInvoices = useMemo(
    () => data.invoices.filter((invoice) => invoice.issueDate >= period.start && invoice.issueDate <= period.end),
    [data.invoices, period.start, period.end]
  )
  const invoiceRows = useMemo(
    () =>
      periodInvoices
        .slice()
        .sort((a, b) => a.issueDate.localeCompare(b.issueDate))
        .map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          clientId: invoice.clientId,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          total: invoice.total,
          balance: invoiceBalance(invoice, data.payments, data.refunds),
          status: invoice.status
        })),
    [periodInvoices, data.payments, data.refunds]
  )
  const invoiceTotal = sumBy(invoiceRows, (row) => row.total)
  const invoiceOutstanding = sumBy(invoiceRows, (row) => Math.max(0, row.balance.balance))
  const invoicePaid = round2(invoiceTotal - invoiceOutstanding)
  const overdueCount = invoiceRows.filter((row) => row.balance.status === 'overdue').length

  const taxRows = useMemo(
    () =>
      series.map((point) => ({
        id: point.key,
        month: point.month,
        collected: sumBy(
          data.incomeTransactions.filter((row) => monthKey(row.date) === point.key),
          (row) => row.taxAmount
        ),
        paid: sumBy(
          data.expenseTransactions.filter((row) => monthKey(row.date) === point.key),
          (row) => row.taxAmount
        )
      })),
    [series, data.incomeTransactions, data.expenseTransactions]
  )

  const meta = REPORTS.find((item) => item.value === report) || REPORTS[0]
  const subtitle = `${period.label} · ${formatDate(period.start, settings.dateFormat)} to ${formatDate(period.end, settings.dateFormat)}`
  const clientName = (clientId: string) => data.clients.find((client) => client.id === clientId)?.name || 'Walk-in'

  const kpis: Kpi[] = (() => {
    switch (report) {
      case 'category':
        return [
          { label: 'Income', value: formatCurrency(summary.revenue, settings), tone: 'brand' },
          { label: 'Expenses', value: formatCurrency(summary.expenses, settings), tone: 'danger' },
          {
            label: 'Top income category',
            value: incomeCats[0]?.name || '—',
            hint: incomeCats[0] ? formatCurrency(incomeCats[0].value, settings) : undefined
          },
          {
            label: 'Top expense category',
            value: expenseCats[0]?.name || '—',
            hint: expenseCats[0] ? formatCurrency(expenseCats[0].value, settings) : undefined
          }
        ]
      case 'account':
        return [
          { label: 'Total balance', value: formatCurrency(totalAccountBalance, settings), tone: 'brand' },
          { label: 'Money in', value: formatCurrency(sumBy(accountRows, (row) => row.income), settings), tone: 'success' },
          { label: 'Money out', value: formatCurrency(sumBy(accountRows, (row) => row.expenses), settings), tone: 'danger' },
          { label: 'Accounts', value: String(accountRows.length), hint: `${data.transfers.length} transfers recorded` }
        ]
      case 'tax':
        return [
          { label: 'Tax collected', value: formatCurrency(taxes.collected, settings), tone: 'brand' },
          { label: 'Tax paid', value: formatCurrency(taxes.paid, settings), tone: 'warning' },
          {
            label: 'Net tax position',
            value: formatCurrency(taxes.net, settings),
            tone: taxes.net >= 0 ? 'warning' : 'success'
          },
          { label: 'Taxable income', value: formatCurrency(taxes.taxableIncome, settings) }
        ]
      case 'product':
        return [
          { label: 'Product revenue', value: formatCurrency(sumBy(products, (row) => row.value), settings), tone: 'brand' },
          { label: 'Cost of goods', value: formatCurrency(sumBy(products, (row) => row.cost), settings) },
          {
            label: 'Gross profit',
            value: formatCurrency(sumBy(products, (row) => row.profit), settings),
            tone: 'success'
          },
          { label: 'Units sold', value: String(sumBy(products, (row) => row.quantity)) }
        ]
      case 'inventory':
        return [
          { label: 'Stock at cost', value: formatCurrency(stockCost, settings), tone: 'brand' },
          { label: 'Stock at retail', value: formatCurrency(stockRetail, settings) },
          { label: 'Low-stock products', value: String(lowProducts.length), tone: lowProducts.length ? 'warning' : 'success' },
          {
            label: 'Low-stock materials',
            value: String(lowMaterials.length),
            tone: lowMaterials.length ? 'warning' : 'success',
            hint: `Materials value ${formatCurrency(materialValue, settings)}`
          }
        ]
      case 'client':
        return [
          { label: 'Clients', value: String(clientRows.length) },
          { label: 'Invoiced', value: formatCurrency(totalClientSales, settings), tone: 'brand' },
          {
            label: 'Outstanding',
            value: formatCurrency(totalClientOutstanding, settings),
            tone: totalClientOutstanding > 0 ? 'warning' : 'success'
          },
          {
            label: 'Average per client',
            value: formatCurrency(clientRows.length ? totalClientSales / clientRows.length : 0, settings)
          }
        ]
      case 'invoice':
        return [
          { label: 'Invoiced', value: formatCurrency(invoiceTotal, settings), tone: 'brand' },
          { label: 'Paid', value: formatCurrency(invoicePaid, settings), tone: 'success' },
          {
            label: 'Outstanding',
            value: formatCurrency(invoiceOutstanding, settings),
            tone: invoiceOutstanding > 0 ? 'warning' : 'success'
          },
          { label: 'Overdue invoices', value: String(overdueCount), tone: overdueCount ? 'danger' : 'success' }
        ]
      case 'comparison':
        return [
          { label: 'Revenue', value: formatCurrency(summary.revenue, settings), hint: `Previous ${formatCurrency(previous.revenue, settings)}` },
          { label: 'Expenses', value: formatCurrency(summary.expenses, settings), hint: `Previous ${formatCurrency(previous.expenses, settings)}` },
          {
            label: 'Net profit',
            value: formatCurrency(summary.netProfit, settings),
            tone: summary.netProfit >= 0 ? 'success' : 'danger',
            hint: `Previous ${formatCurrency(previous.netProfit, settings)}`
          },
          { label: 'Margin', value: formatPercent(summary.margin), hint: `Previous ${formatPercent(previous.margin)}` }
        ]
      default:
        return [
          { label: 'Revenue', value: formatCurrency(summary.revenue, settings), tone: 'brand', hint: `${incomeRows.length} income records` },
          { label: 'Expenses', value: formatCurrency(summary.expenses, settings), tone: 'danger', hint: `${expenseRows.length} expense records` },
          {
            label: 'Net profit',
            value: formatCurrency(summary.netProfit, settings),
            tone: summary.netProfit >= 0 ? 'success' : 'danger',
            hint: `Margin ${formatPercent(summary.margin)}`
          },
          { label: 'Outstanding', value: formatCurrency(summary.outstanding, settings), tone: summary.outstanding > 0 ? 'warning' : 'success' }
        ]
    }
  })()

  const exportReport = () => {
    const stamp = `report-${report}-${todayISO()}.csv`
    switch (report) {
      case 'monthly':
        exportCSV(stamp, series.map(toAgg), monthColumns())
        break
      case 'quarterly':
        exportCSV(stamp, quarterly, monthColumns())
        break
      case 'annual':
        exportCSV(stamp, annual, monthColumns())
        break
      case 'comparison':
        exportCSV(stamp, comparisonRows(summary, previous), [
          { key: 'label', label: 'Metric', getValue: (row) => row.label },
          { key: 'current', label: 'Current', getValue: (row) => row.current },
          { key: 'previous', label: 'Previous', getValue: (row) => row.previous }
        ])
        break
      case 'category':
        exportCSV(stamp, [...incomeCats.map((slice) => ({ ...slice, type: 'Income' })), ...expenseCats.map((slice) => ({ ...slice, type: 'Expense' }))], [
          { key: 'type', label: 'Type', getValue: (row) => row.type },
          { key: 'name', label: 'Category', getValue: (row) => row.name },
          { key: 'value', label: 'Amount', getValue: (row) => row.value }
        ])
        break
      case 'account':
        exportCSV(stamp, accountRows, [
          { key: 'name', label: 'Account', getValue: (row) => row.name },
          { key: 'type', label: 'Type', getValue: (row) => row.type },
          { key: 'income', label: 'Money in', getValue: (row) => row.income },
          { key: 'expenses', label: 'Money out', getValue: (row) => row.expenses },
          { key: 'in', label: 'Transfers in', getValue: (row) => row.transfersIn },
          { key: 'out', label: 'Transfers out', getValue: (row) => row.transfersOut },
          { key: 'balance', label: 'Current balance', getValue: (row) => row.balance }
        ])
        break
      case 'tax':
        exportCSV(stamp, taxRows, [
          { key: 'month', label: 'Month', getValue: (row) => row.month },
          { key: 'collected', label: 'Tax collected', getValue: (row) => row.collected },
          { key: 'paid', label: 'Tax paid', getValue: (row) => row.paid },
          { key: 'net', label: 'Net', getValue: (row) => round2(row.collected - row.paid) }
        ])
        break
      case 'product':
        exportCSV(stamp, products, [
          { key: 'name', label: 'Product', getValue: (row) => row.name },
          { key: 'quantity', label: 'Units sold', getValue: (row) => row.quantity },
          { key: 'value', label: 'Revenue', getValue: (row) => row.value },
          { key: 'cost', label: 'Cost', getValue: (row) => row.cost },
          { key: 'profit', label: 'Profit', getValue: (row) => row.profit }
        ])
        break
      case 'inventory':
        exportCSV(stamp, stock, [
          { key: 'name', label: 'Product', getValue: (row) => row.name },
          { key: 'sku', label: 'SKU', getValue: (row) => row.sku },
          { key: 'quantity', label: 'Stock', getValue: (row) => row.stockQuantity },
          { key: 'cost', label: 'Unit cost', getValue: (row) => row.cost },
          { key: 'costValue', label: 'Stock value at cost', getValue: (row) => row.costValue },
          { key: 'retailValue', label: 'Stock value at retail', getValue: (row) => row.retailValue }
        ])
        break
      case 'client':
        exportCSV(stamp, clientRows, [
          { key: 'name', label: 'Client', getValue: (row) => row.name },
          { key: 'company', label: 'Company', getValue: (row) => row.company },
          { key: 'orders', label: 'Orders', getValue: (row) => row.orders },
          { key: 'sales', label: 'Invoiced', getValue: (row) => row.totalSales },
          { key: 'outstanding', label: 'Outstanding', getValue: (row) => row.outstanding },
          { key: 'last', label: 'Last activity', getValue: (row) => row.lastActivity || '' }
        ])
        break
      case 'invoice':
        exportCSV(stamp, invoiceRows, [
          { key: 'number', label: 'Invoice', getValue: (row) => row.number },
          { key: 'client', label: 'Client', getValue: (row) => clientName(row.clientId) },
          { key: 'issued', label: 'Issued', getValue: (row) => row.issueDate },
          { key: 'due', label: 'Due', getValue: (row) => row.dueDate },
          { key: 'total', label: 'Total', getValue: (row) => row.total },
          { key: 'balance', label: 'Balance', getValue: (row) => row.balance.balance },
          { key: 'status', label: 'Status', getValue: (row) => row.balance.status }
        ])
        break
      default:
        exportCSV(stamp, series.map(toAgg), monthColumns())
    }
    void log('export', `Exported ${meta.label}`, 'Report')
    notify('Report exported as CSV.', 'success')
  }

  const exportPdf = () => {
    downloadReportPdf(
      meta.label,
      subtitle,
      kpis.map((kpi) => ({ label: kpi.label, value: kpi.value })),
      series,
      settings
    )
    void log('export', `Downloaded ${meta.label} PDF`, 'Report')
    notify('Report PDF downloaded.', 'success')
  }

  return (
    <>
      <PageHeader
        eyebrow="Reporting center"
        title="Reports"
        description="Twelve ways to read your business — every figure comes from your local records."
        actions={<PeriodPicker kind={period.kind} start={period.start} end={period.end} onChange={period.onChange} />}
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-md">
            <label className="label" htmlFor="report-select">
              Report type
            </label>
            <select
              id="report-select"
              className="select"
              value={report}
              onChange={(event) => setReport(event.target.value as ReportType)}
            >
              {REPORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">{meta.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportReport}>
              <Download size={15} /> CSV
            </Button>
            <Button onClick={exportPdf}>
              <FileText size={15} /> PDF
            </Button>
            <Button onClick={() => window.print()}>
              <Printer size={15} /> Print
            </Button>
          </div>
        </div>
        <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-xs text-muted">{subtitle}</p>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} tone={kpi.tone} />
        ))}
      </div>

      {report === 'overview' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Card>
            <SectionTitle title="Monthly cash flow" description="Income and expenses recorded in each month." />
            {series.some((point) => point.revenue || point.expenses) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#F26A2C" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="expenses" name="Expenses" fill="#D9534F" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="profit" name="Profit" fill="#299D68" radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No transactions in this period" description="Choose a wider period or record some income and expenses." />
            )}
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <CategoryPie title="Income by category" slices={incomeCats} settings={settings} />
            <CategoryPie title="Expenses by category" slices={expenseCats} settings={settings} />
          </div>
          <Card className="xl:col-span-2">
            <SectionTitle title="Financial summary" description={`${period.label} compared with key ledger totals.`} />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Invoices issued', String(summary.invoicesIssued)],
                ['Invoice value', formatCurrency(summary.invoiceTotal, settings)],
                ['Payments received', formatCurrency(summary.paymentsReceived, settings)],
                ['Transactions', String(summary.transactions)],
                ['Tax collected', formatCurrency(summary.taxCollected, settings)],
                ['Tax paid', formatCurrency(summary.taxPaid, settings)],
                ['Profit margin', formatPercent(summary.margin)],
                ['Outstanding invoices', formatCurrency(summary.outstanding, settings)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {report === 'monthly' || report === 'quarterly' || report === 'annual' ? (
        <Card>
          <SectionTitle
            title={report === 'monthly' ? 'Monthly totals' : report === 'quarterly' ? 'Quarterly totals' : 'Annual totals'}
            description="Revenue, expenses and profit from recorded transactions; sales from issued invoices."
          />
          <AggregateChart rows={report === 'monthly' ? series.map(toAgg) : report === 'quarterly' ? quarterly : annual} settings={settings} />
          <AggregateTable rows={report === 'monthly' ? series.map(toAgg) : report === 'quarterly' ? quarterly : annual} settings={settings} />
        </Card>
      ) : null}

      {report === 'comparison' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Card>
            <SectionTitle
              title="Current vs previous period"
              description={`Current: ${formatDate(period.start, settings.dateFormat)} – ${formatDate(period.end, settings.dateFormat)} · Previous: ${formatDate(previousStart, settings.dateFormat)} – ${formatDate(previousEnd, settings.dateFormat)}`}
            />
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th style={{ textAlign: 'right' }}>Current</th>
                    <th style={{ textAlign: 'right' }}>Previous</th>
                    <th style={{ textAlign: 'right' }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows(summary, previous).map((row) => {
                    const change =
                      row.previous === 0 ? (row.current === 0 ? 0 : 100) : ((row.current - row.previous) / Math.abs(row.previous)) * 100
                    return (
                      <tr key={row.label}>
                        <td className="font-medium">{row.label}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(row.current, settings)}</td>
                        <td style={{ textAlign: 'right' }} className="text-muted">
                          {formatCurrency(row.previous, settings)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Badge tone={change >= 0 ? 'success' : 'danger'}>
                            {change >= 0 ? '+' : ''}
                            {change.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td className="font-medium">Profit margin</td>
                    <td style={{ textAlign: 'right' }}>{formatPercent(summary.margin)}</td>
                    <td style={{ textAlign: 'right' }} className="text-muted">
                      {formatPercent(previous.margin)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Badge tone={summary.margin >= previous.margin ? 'success' : 'danger'}>
                        {summary.margin >= previous.margin ? '+' : ''}
                        {(summary.margin - previous.margin).toFixed(1)} pts
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <SectionTitle title="Side by side" description="Revenue and expenses for both periods." />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[
                  { id: 'current', name: 'Current', revenue: summary.revenue, expenses: summary.expenses },
                  { id: 'previous', name: 'Previous', revenue: previous.revenue, expenses: previous.expenses }
                ]}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#F26A2C" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expenses" name="Expenses" fill="#D9534F" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : null}

      {report === 'category' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <CategoryPie title="Income categories" slices={incomeCats} settings={settings} />
          <CategoryPie title="Expense categories" slices={expenseCats} settings={settings} />
          <SliceTable title="Income detail" slices={incomeCats} total={summary.revenue} settings={settings} />
          <SliceTable title="Expense detail" slices={expenseCats} total={summary.expenses} settings={settings} />
        </div>
      ) : null}

      {report === 'account' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Card>
            <SectionTitle title="Current balances" description="All-time balance including openings and transfers." />
            {accountRows.length ? (
              <ResponsiveContainer width="100%" height={Math.max(220, accountRows.length * 54)}>
                <BarChart data={accountRows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#5c5854' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                  <Bar dataKey="balance" name="Balance" fill="#F26A2C" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No accounts yet" description="Add an account in Finance to start tracking balances." />
            )}
          </Card>
          <Card>
            <SectionTitle title="Account activity" description={`Transactions inside ${period.label.toLowerCase()}.`} />
            {accountRows.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th style={{ textAlign: 'right' }}>In</th>
                      <th style={{ textAlign: 'right' }}>Out</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-[11px] capitalize text-muted">{row.type.replace('-', ' ')}</p>
                        </td>
                        <td style={{ textAlign: 'right' }} className="text-success">
                          {formatCurrency(row.income + row.transfersIn, settings)}
                        </td>
                        <td style={{ textAlign: 'right' }} className="text-danger">
                          {formatCurrency(row.expenses + row.transfersOut, settings)}
                        </td>
                        <td style={{ textAlign: 'right' }} className="font-semibold">
                          {formatCurrency(row.balance, settings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Nothing to report" description="Accounts appear here once created." />
            )}
          </Card>
        </div>
      ) : null}

      {report === 'tax' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Card>
            <SectionTitle title="Tax collected vs paid" description="From the tax amounts stored on income and expense records." />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={taxRows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="collected" name="Collected" fill="#F26A2C" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="paid" name="Paid" fill="#777777" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionTitle title="Tax detail" description="Net position is collected minus paid." />
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
                  {taxRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.month}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(row.collected, settings)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(row.paid, settings)}</td>
                      <td style={{ textAlign: 'right' }} className={row.collected - row.paid >= 0 ? 'text-warning' : 'text-success'}>
                        {formatCurrency(round2(row.collected - row.paid), settings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[11px] text-muted">
              Informational only — confirm your tax obligations with a qualified adviser.
            </p>
          </Card>
        </div>
      ) : null}

      {report === 'product' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Card>
            <SectionTitle title="Revenue by product" description="Invoice lines inside the period." />
            {products.length ? (
              <ResponsiveContainer width="100%" height={Math.max(240, Math.min(products.length, 10) * 40)}>
                <BarChart data={products.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11, fill: '#5c5854' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                  <Bar dataKey="value" name="Revenue" fill="#F26A2C" radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No product sales in this period" description="Invoice catalog products to populate this report." />
            )}
          </Card>
          <Card>
            <SectionTitle title="Product performance" description="Cost uses the product's current unit cost." />
            {products.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'right' }}>Units</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                      <th style={{ textAlign: 'right' }}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((row) => (
                      <tr key={row.name}>
                        <td className="font-medium">{row.name}</td>
                        <td style={{ textAlign: 'right' }}>{row.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(row.value, settings)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(row.profit, settings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Nothing to show" description="Product performance appears after invoiced sales." />
            )}
          </Card>
        </div>
      ) : null}

      {report === 'inventory' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Card>
            <SectionTitle title="Product stock" description="Quantities come from the inventory movement ledger." />
            {stock.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'right' }}>Stock</th>
                      <th style={{ textAlign: 'right' }}>Cost value</th>
                      <th style={{ textAlign: 'right' }}>Retail value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-[11px] text-muted">{row.sku}</p>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={row.stockQuantity <= row.reorderThreshold ? 'font-semibold text-danger' : ''}>
                            {row.stockQuantity}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(row.costValue, settings)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(row.retailValue, settings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No products yet" description="Add products in the catalog to track stock value." />
            )}
          </Card>
          <div className="grid gap-3">
            <Card>
              <SectionTitle title="Materials" description="Value at current unit cost." />
              {data.materials.length ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th style={{ textAlign: 'right' }}>Stock</th>
                        <th style={{ textAlign: 'right' }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.materials.map((material) => (
                        <tr key={material.id}>
                          <td>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-[11px] text-muted">{material.unit}</p>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={material.currentStock <= material.minimumStock ? 'font-semibold text-danger' : ''}>
                              {material.currentStock}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(round2(material.currentStock * material.unitCost), settings)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No materials yet" description="Track raw materials to value your stock." />
              )}
            </Card>
            <Card>
              <SectionTitle title="Movement summary" description="Every stock change in the ledger." />
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Products', String(data.products.length)],
                  ['Materials', String(data.materials.length)],
                  ['Movements', String(data.inventoryMovements.length)],
                  ['Low stock items', String(lowProducts.length + lowMaterials.length)]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-line px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
                    <p className="text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {report === 'client' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Card>
            <SectionTitle title="Top clients by invoiced value" description="All-time invoiced totals, excluding void invoices." />
            {clientRows.length ? (
              <ResponsiveContainer width="100%" height={Math.max(220, Math.min(clientRows.length, 10) * 40)}>
                <BarChart data={clientRows.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11, fill: '#5c5854' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                  <Bar dataKey="totalSales" name="Invoiced" fill="#F26A2C" radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No client sales yet" description="Clients with invoices or orders appear here." />
            )}
          </Card>
          <Card>
            <SectionTitle title="Client balances" description="Orders, invoiced value and outstanding balance." />
            {clientRows.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th style={{ textAlign: 'right' }}>Orders</th>
                      <th style={{ textAlign: 'right' }}>Invoiced</th>
                      <th style={{ textAlign: 'right' }}>Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-[11px] text-muted">{row.company || '—'}</p>
                        </td>
                        <td style={{ textAlign: 'right' }}>{row.orders}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(row.totalSales, settings)}</td>
                        <td style={{ textAlign: 'right' }} className={row.outstanding > 0 ? 'font-semibold text-warning' : ''}>
                          {formatCurrency(row.outstanding, settings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Nothing to show" description="Add clients and invoices to build this report." />
            )}
          </Card>
        </div>
      ) : null}

      {report === 'invoice' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Card>
            <SectionTitle title="Invoice ageing" description="All open invoices by days past due." />
            {aging.some((bucket) => bucket.amount > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={aging} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
                  <Bar dataKey="amount" name="Outstanding" fill="#D9534F" radius={[4, 4, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No outstanding invoices" description="Every issued invoice is fully paid." />
            )}
          </Card>
          <Card>
            <SectionTitle title="Invoices in this period" description="Status is derived from payments and refunds." />
            {invoiceRows.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Client</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <p className="font-medium">{row.number}</p>
                          <p className="text-[11px] text-muted">
                            Due {formatDate(row.dueDate, settings.dateFormat)}
                          </p>
                        </td>
                        <td>{clientName(row.clientId)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(row.total, settings)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(Math.max(0, row.balance.balance), settings)}</td>
                        <td>
                          <Badge
                            tone={
                              row.balance.status === 'paid'
                                ? 'success'
                                : row.balance.status === 'overdue'
                                  ? 'danger'
                                  : row.balance.status === 'partial'
                                    ? 'warning'
                                    : 'neutral'
                            }
                          >
                            {row.balance.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No invoices in this period" description="Choose a wider period or issue an invoice." />
            )}
          </Card>
        </div>
      ) : null}
    </>
  )
}

function quarterLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return `${year} Q${Math.floor((month - 1) / 3) + 1}`
}

function aggregateSeries(series: MonthlyPoint[], mapKey: (key: string) => string): AggRow[] {
  const map = new Map<string, AggRow>()
  for (const point of series) {
    const id = mapKey(point.key)
    const row = map.get(id) || { id, label: id, revenue: 0, expenses: 0, profit: 0, sales: 0, orders: 0 }
    row.revenue = round2(row.revenue + point.revenue)
    row.expenses = round2(row.expenses + point.expenses)
    row.profit = round2(row.profit + point.profit)
    row.sales = round2(row.sales + point.sales)
    row.orders += point.orders
    map.set(id, row)
  }
  return [...map.values()]
}

function toAgg(point: MonthlyPoint): AggRow {
  return {
    id: point.key,
    label: point.month,
    revenue: point.revenue,
    expenses: point.expenses,
    profit: point.profit,
    sales: point.sales,
    orders: point.orders
  }
}

function monthColumns(): CSVColumn<AggRow>[] {
  return [
    { key: 'label', label: 'Period', getValue: (row) => row.label },
    { key: 'revenue', label: 'Revenue', getValue: (row) => row.revenue },
    { key: 'expenses', label: 'Expenses', getValue: (row) => row.expenses },
    { key: 'profit', label: 'Profit', getValue: (row) => row.profit },
    { key: 'sales', label: 'Invoiced sales', getValue: (row) => row.sales },
    { key: 'orders', label: 'Orders', getValue: (row) => row.orders }
  ]
}

function comparisonRows(current: ReturnType<typeof financialSummary>, previous: ReturnType<typeof financialSummary>) {
  return [
    { label: 'Revenue', current: current.revenue, previous: previous.revenue },
    { label: 'Expenses', current: current.expenses, previous: previous.expenses },
    { label: 'Net profit', current: current.netProfit, previous: previous.netProfit },
    { label: 'Invoices issued', current: current.invoicesIssued, previous: previous.invoicesIssued },
    { label: 'Invoice value', current: current.invoiceTotal, previous: previous.invoiceTotal },
    { label: 'Payments received', current: current.paymentsReceived, previous: previous.paymentsReceived }
  ]
}

function CategoryPie({
  title,
  slices,
  settings
}: {
  title: string
  slices: { name: string; value: number }[]
  settings: ReturnType<typeof useData>['settings']
}) {
  const total = sumBy(slices, (slice) => slice.value)
  return (
    <Card>
      <SectionTitle title={title} description={total > 0 ? `Total ${formatCurrency(total, settings)}` : 'No records in this period.'} />
      {slices.length ? (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={2}>
              {slices.map((slice, index) => (
                <Cell key={slice.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState title="Nothing recorded" description="This chart fills in as transactions are recorded." />
      )}
    </Card>
  )
}

function SliceTable({
  title,
  slices,
  total,
  settings
}: {
  title: string
  slices: { name: string; value: number }[]
  total: number
  settings: ReturnType<typeof useData>['settings']
}) {
  return (
    <Card>
      <SectionTitle title={title} />
      {slices.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {slices.map((slice) => (
                <tr key={slice.name}>
                  <td className="font-medium">{slice.name}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(slice.value, settings)}</td>
                  <td style={{ textAlign: 'right' }}>{total > 0 ? formatPercent((slice.value / total) * 100) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No categories" description="Records will appear here once transactions exist." />
      )}
    </Card>
  )
}

function AggregateChart({
  rows,
  settings
}: {
  rows: AggRow[]
  settings: ReturnType<typeof useData>['settings']
}) {
  if (!rows.some((row) => row.revenue || row.expenses)) {
    return <EmptyState title="No transactions in this period" description="Pick a period with recorded income or expenses." />
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0edea" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#8a8580' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(value: unknown) => formatCurrency(Number(value), settings)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenue" name="Revenue" fill="#F26A2C" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expenses" name="Expenses" fill="#D9534F" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="profit" name="Profit" fill="#299D68" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function AggregateTable({
  rows,
  settings
}: {
  rows: AggRow[]
  settings: ReturnType<typeof useData>['settings']
}) {
  if (!rows.length) return null
  return (
    <div className="mt-4 table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Period</th>
            <th style={{ textAlign: 'right' }}>Revenue</th>
            <th style={{ textAlign: 'right' }}>Expenses</th>
            <th style={{ textAlign: 'right' }}>Profit</th>
            <th style={{ textAlign: 'right' }}>Invoiced sales</th>
            <th style={{ textAlign: 'right' }}>Orders</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="font-medium">{row.label}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(row.revenue, settings)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(row.expenses, settings)}</td>
              <td style={{ textAlign: 'right' }} className={row.profit >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(row.profit, settings)}
              </td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(row.sales, settings)}</td>
              <td style={{ textAlign: 'right' }}>{row.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
