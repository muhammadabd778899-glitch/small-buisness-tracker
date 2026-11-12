import type {
  AppData,
  BusinessSettings,
  ExpenseTransaction,
  IncomeTransaction,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Payment,
  Product,
  Refund
} from './types'
import { clamp, round2, sumBy } from './money'
import { inRange, monthKey, monthLabel, monthsInRange, todayISO } from './dates'

export interface LineLike {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
}

export function lineNet(item: Pick<LineLike, 'quantity' | 'unitPrice' | 'discount'>): number {
  return round2(Math.max(0, item.quantity * item.unitPrice - Math.max(0, item.discount)))
}

export interface DocumentTotals {
  subtotal: number
  discount: number
  taxAmount: number
  total: number
}

export function computeTotals(
  items: LineLike[],
  discount = 0,
  taxInclusive = false
): DocumentTotals {
  const subtotal = round2(items.reduce((sum, item) => sum + lineNet(item), 0))
  const appliedDiscount = round2(clamp(discount, 0, subtotal))
  const taxableTotal = round2(subtotal - appliedDiscount)
  const ratio = subtotal > 0 ? taxableTotal / subtotal : 0
  let taxAmount = 0

  for (const item of items) {
    const net = lineNet(item) * ratio
    const rate = Math.max(0, item.taxRate) / 100
    if (rate === 0) continue
    taxAmount += taxInclusive ? net - net / (1 + rate) : net * rate
  }

  const total = taxInclusive ? taxableTotal : round2(taxableTotal + taxAmount)
  return {
    subtotal,
    discount: appliedDiscount,
    taxAmount: round2(taxAmount),
    total: round2(total)
  }
}

export function invoicePayments(invoiceId: string, payments: Payment[]): number {
  return sumBy(
    payments.filter((payment) => payment.invoiceId === invoiceId),
    (payment) => payment.amount
  )
}

export function invoiceRefunds(invoiceId: string, refunds: Refund[]): number {
  return sumBy(
    refunds.filter((refund) => refund.invoiceId === invoiceId),
    (refund) => refund.amount
  )
}

export interface InvoiceBalance {
  paid: number
  refunded: number
  netPaid: number
  balance: number
  status: InvoiceStatus
}

export function invoiceBalance(
  invoice: Invoice,
  payments: Payment[],
  refunds: Refund[],
  today: string = todayISO()
): InvoiceBalance {
  const paid = invoicePayments(invoice.id, payments)
  const refunded = invoiceRefunds(invoice.id, refunds)
  const netPaid = round2(paid - refunded)
  const balance = round2(invoice.total - netPaid)

  let status: InvoiceStatus = invoice.status
  if (invoice.status !== 'draft' && invoice.status !== 'void') {
    if (balance <= 0.005) status = 'paid'
    else if (netPaid > 0) status = 'partial'
    else if (invoice.dueDate < today) status = 'overdue'
    else status = 'sent'
  }

  return { paid, refunded, netPaid, balance, status }
}

export function accountBalance(data: AppData, accountId: string): number {
  const account = data.accounts.find((row) => row.id === accountId)
  if (!account) return 0
  const income = sumBy(
    data.incomeTransactions.filter((row) => row.accountId === accountId),
    (row) => row.amount
  )
  const expenses = sumBy(
    data.expenseTransactions.filter((row) => row.accountId === accountId),
    (row) => row.amount
  )
  const inTransfers = sumBy(
    data.transfers.filter((row) => row.toAccountId === accountId),
    (row) => row.amount
  )
  const outTransfers = sumBy(
    data.transfers.filter((row) => row.fromAccountId === accountId),
    (row) => row.amount
  )
  return round2(account.openingBalance + income - expenses + inTransfers - outTransfers)
}

export function transactionsInRange(
  data: AppData,
  start: string,
  end: string
): { income: IncomeTransaction[]; expenses: ExpenseTransaction[] } {
  return {
    income: data.incomeTransactions.filter((row) => inRange(row.date, start, end)),
    expenses: data.expenseTransactions.filter((row) => inRange(row.date, start, end))
  }
}

export interface FinancialSummary {
  revenue: number
  expenses: number
  netProfit: number
  margin: number
  taxCollected: number
  taxPaid: number
  invoicesIssued: number
  invoiceTotal: number
  paymentsReceived: number
  outstanding: number
  transactions: number
}

export function financialSummary(data: AppData, start: string, end: string): FinancialSummary {
  const { income, expenses } = transactionsInRange(data, start, end)
  const revenue = sumBy(income, (row) => row.amount)
  const expenseTotal = sumBy(expenses, (row) => row.amount)
  const netProfit = round2(revenue - expenseTotal)
  const relevantInvoices = data.invoices.filter(
    (invoice) => inRange(invoice.issueDate, start, end) && invoice.status !== 'void'
  )
  const invoiceTotal = sumBy(relevantInvoices, (invoice) => invoice.total)
  const paymentsReceived = sumBy(
    data.payments.filter((payment) => inRange(payment.date, start, end)),
    (payment) => payment.amount
  )
  const outstanding = sumBy(relevantInvoices, (invoice) => {
    const balance = invoiceBalance(invoice, data.payments, data.refunds)
    return Math.max(0, balance.balance)
  })

  return {
    revenue,
    expenses: expenseTotal,
    netProfit,
    margin: revenue > 0 ? round2((netProfit / revenue) * 100) : 0,
    taxCollected: sumBy(income, (row) => row.taxAmount),
    taxPaid: sumBy(expenses, (row) => row.taxAmount),
    invoicesIssued: relevantInvoices.length,
    invoiceTotal,
    paymentsReceived,
    outstanding,
    transactions: income.length + expenses.length
  }
}

export interface MonthlyPoint {
  key: string
  month: string
  revenue: number
  expenses: number
  profit: number
  sales: number
  orders: number
}

export function monthlySeries(data: AppData, start: string, end: string): MonthlyPoint[] {
  const keys = monthsInRange(start, end)
  return keys.map((key) => {
    const revenue = sumBy(
      data.incomeTransactions.filter((row) => monthKey(row.date) === key),
      (row) => row.amount
    )
    const expenses = sumBy(
      data.expenseTransactions.filter((row) => monthKey(row.date) === key),
      (row) => row.amount
    )
    const sales = sumBy(
      data.invoices.filter(
        (invoice) => monthKey(invoice.issueDate) === key && invoice.status !== 'void'
      ),
      (invoice) => invoice.total
    )
    const orders = data.orders.filter(
      (order) => monthKey(order.date) === key && order.status !== 'cancelled'
    ).length
    return {
      key,
      month: monthLabel(key),
      revenue,
      expenses,
      profit: round2(revenue - expenses),
      sales,
      orders
    }
  })
}

export interface CategorySlice {
  name: string
  value: number
}

export function categoryBreakdown(
  rows: { category: string; amount: number }[]
): CategorySlice[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const category = row.category || 'Uncategorised'
    totals.set(category, round2((totals.get(category) || 0) + row.amount))
  }
  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export interface ProductPerformance extends CategorySlice {
  quantity: number
  cost: number
  profit: number
}

export function productPerformance(
  data: AppData,
  start: string,
  end: string
): ProductPerformance[] {
  const invoices = new Map(
    data.invoices
      .filter((invoice) => inRange(invoice.issueDate, start, end) && invoice.status !== 'void')
      .map((invoice) => [invoice.id, invoice])
  )
  const products = new Map(data.products.map((product) => [product.id, product]))
  const rows = new Map<string, ProductPerformance>()

  for (const item of data.invoiceItems) {
    if (!invoices.has(item.invoiceId)) continue
    const product = item.productId ? products.get(item.productId) : undefined
    const key = product?.id || item.description || 'Custom item'
    const label = product?.name || item.description || 'Custom item'
    const current = rows.get(key) || {
      name: label,
      value: 0,
      quantity: 0,
      cost: 0,
      profit: 0
    }
    const revenue = lineNet(item)
    const cost = round2((product?.cost || 0) * item.quantity)
    current.value = round2(current.value + revenue)
    current.quantity += item.quantity
    current.cost = round2(current.cost + cost)
    current.profit = round2(current.profit + revenue - cost)
    rows.set(key, current)
  }

  return [...rows.values()].sort((a, b) => b.value - a.value)
}

export interface ClientSummary {
  orders: number
  totalSales: number
  outstanding: number
  lastActivity: string | null
}

export function clientSummary(data: AppData, clientId: string): ClientSummary {
  const orders = data.orders.filter((order) => order.clientId === clientId && order.status !== 'cancelled')
  const invoices = data.invoices.filter((invoice) => invoice.clientId === clientId && invoice.status !== 'void')
  const payments = data.payments.filter((payment) => payment.clientId === clientId)
  const communications = data.communications.filter((comm) => comm.clientId === clientId)
  const dates = [
    ...orders.map((order) => order.date),
    ...payments.map((payment) => payment.date),
    ...communications.map((comm) => comm.date)
  ].sort()

  return {
    orders: orders.length,
    totalSales: sumBy(invoices, (invoice) => invoice.total),
    outstanding: sumBy(invoices, (invoice) => Math.max(0, invoiceBalance(invoice, data.payments, data.refunds).balance)),
    lastActivity: dates.length ? dates[dates.length - 1] : null
  }
}

export function reservedQuantity(data: AppData, productId: string): number {
  const openOrders = new Set(
    data.orders
      .filter((order) => ['confirmed', 'in-progress', 'ready'].includes(order.status))
      .map((order) => order.id)
  )
  return data.orderItems
    .filter((item) => item.productId === productId && openOrders.has(item.orderId))
    .reduce((sum, item) => sum + item.quantity, 0)
}

export function lowStockProducts(data: AppData): Product[] {
  return data.products.filter(
    (product) => product.isActive && product.stockQuantity <= product.reorderThreshold
  )
}

export function lowStockMaterials(data: AppData): { id: string; name: string; currentStock: number; minimumStock: number }[] {
  return data.materials
    .filter((material) => material.currentStock <= material.minimumStock)
    .map((material) => ({
      id: material.id,
      name: material.name,
      currentStock: material.currentStock,
      minimumStock: material.minimumStock
    }))
}

export function invoiceItemCount(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function orderItemCount(items: { quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function orderExpectedTotal(
  items: LineLike[],
  discount: number,
  delivery: number,
  settings: BusinessSettings
): DocumentTotals & { delivery: number } {
  const totals = computeTotals(items, discount, settings.taxInclusive)
  return { ...totals, total: round2(totals.total + Math.max(0, delivery)), delivery }
}

export function nextDocumentNumber(settings: BusinessSettings, kind: 'invoice' | 'quote' | 'order'): string {
  const year = new Date().getFullYear()
  if (kind === 'invoice') return `${settings.invoicePrefix}-${year}-${String(settings.nextInvoiceNumber).padStart(4, '0')}`
  if (kind === 'quote') return `${settings.quotePrefix}-${year}-${String(settings.nextQuoteNumber).padStart(4, '0')}`
  return `${settings.orderPrefix}-${year}-${String(settings.nextOrderNumber).padStart(4, '0')}`
}

export interface PricingInput {
  materials: { name: string; quantity: number; unitCost: number }[]
  laborHours: number
  hourlyRate: number
  packagingCost: number
  overheadCost: number
  otherCost: number
  batchYield: number
  sellingPrice: number
  feePercent: number
  targetMargin: number
}

export interface PricingResult {
  materialCost: number
  laborCost: number
  totalBatchCost: number
  unitCost: number
  feePerUnit: number
  profitPerUnit: number
  margin: number
  markup: number
  netProceeds: number
  suggestedPrice: number
}

export function calculatePricing(input: PricingInput): PricingResult {
  const materialCost = round2(
    input.materials.reduce((sum, material) => sum + material.quantity * material.unitCost, 0)
  )
  const laborCost = round2(input.laborHours * input.hourlyRate)
  const totalBatchCost = round2(
    materialCost + laborCost + input.packagingCost + input.overheadCost + input.otherCost
  )
  const batchYield = Math.max(1, input.batchYield || 1)
  const unitCost = round2(totalBatchCost / batchYield)
  const feePercent = clamp(input.feePercent || 0, 0, 95) / 100
  const targetMargin = clamp(input.targetMargin || 0, 0, 95) / 100
  const sellingPrice = Math.max(0, input.sellingPrice)
  const feePerUnit = round2(sellingPrice * feePercent)
  const netProceeds = round2(sellingPrice - feePerUnit)
  const profitPerUnit = round2(netProceeds - unitCost)
  const margin = sellingPrice > 0 ? round2((profitPerUnit / sellingPrice) * 100) : 0
  const markup = unitCost > 0 ? round2((profitPerUnit / unitCost) * 100) : 0
  const denominator = 1 - targetMargin - feePercent
  const suggestedPrice = denominator > 0 ? round2(unitCost / denominator) : 0

  return {
    materialCost,
    laborCost,
    totalBatchCost,
    unitCost,
    feePerUnit,
    profitPerUnit,
    margin,
    markup,
    netProceeds,
    suggestedPrice
  }
}

export interface TaxSummary {
  collected: number
  paid: number
  taxableIncome: number
  taxableExpenses: number
  net: number
}

export function taxSummary(data: AppData, start: string, end: string): TaxSummary {
  const { income, expenses } = transactionsInRange(data, start, end)
  const collected = sumBy(income, (row) => row.taxAmount)
  const paid = sumBy(expenses, (row) => row.taxAmount)
  const taxableIncome = sumBy(income, (row) => row.amount - row.taxAmount)
  const taxableExpenses = sumBy(expenses, (row) => row.amount - row.taxAmount)
  return {
    collected,
    paid,
    taxableIncome,
    taxableExpenses,
    net: round2(collected - paid)
  }
}

export function invoiceAging(data: AppData, today = todayISO()): { bucket: string; amount: number }[] {
  const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
  for (const invoice of data.invoices) {
    if (invoice.status === 'void' || invoice.status === 'draft') continue
    const { balance } = invoiceBalance(invoice, data.payments, data.refunds, today)
    if (balance <= 0.005) continue
    const days = Math.floor(
      (new Date(today).getTime() - new Date(invoice.dueDate).getTime()) / (24 * 60 * 60 * 1000)
    )
    if (days <= 0) buckets.current += balance
    else if (days <= 30) buckets['1-30'] += balance
    else if (days <= 60) buckets['31-60'] += balance
    else if (days <= 90) buckets['61-90'] += balance
    else buckets['90+'] += balance
  }
  return Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount: round2(amount) }))
}

export function paymentMethods(data: AppData): CategorySlice[] {
  return categoryBreakdown(
    data.payments.map((payment) => ({ category: payment.method || 'Other', amount: payment.amount }))
  )
}
