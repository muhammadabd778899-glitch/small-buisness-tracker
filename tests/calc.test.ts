import { describe, expect, it } from 'vitest'
import {
  accountBalance,
  calculatePricing,
  categoryBreakdown,
  clientSummary,
  computeTotals,
  financialSummary,
  invoiceAging,
  invoiceBalance,
  lineNet,
  lowStockProducts,
  monthlySeries,
  nextDocumentNumber,
  orderExpectedTotal,
  productPerformance,
  reservedQuantity,
  taxSummary
} from '../src/lib/calc'
import {
  emptyData,
  makeAccount,
  makeClient,
  makeCommunication,
  makeExpense,
  makeIncome,
  makeInvoice,
  makeInvoiceItem,
  makeOrder,
  makeOrderItem,
  makePayment,
  makeProduct,
  makeRefund,
  makeTransfer,
  SETTINGS
} from './fixtures'

describe('lineNet', () => {
  it('applies discounts and never goes negative', () => {
    expect(lineNet({ quantity: 2, unitPrice: 100, discount: 20 })).toBe(180)
    expect(lineNet({ quantity: 1, unitPrice: 10, discount: 50 })).toBe(0)
    expect(lineNet({ quantity: 1, unitPrice: 10, discount: -5 })).toBe(10)
  })
})

describe('computeTotals', () => {
  it('adds exclusive tax per line', () => {
    const totals = computeTotals([
      { id: 'a', description: 'A', quantity: 1, unitPrice: 100, discount: 0, taxRate: 10 },
      { id: 'b', description: 'B', quantity: 1, unitPrice: 50, discount: 0, taxRate: 0 }
    ])
    expect(totals).toEqual({ subtotal: 150, discount: 0, taxAmount: 10, total: 160 })
  })

  it('prorates a document discount across taxable lines', () => {
    const totals = computeTotals(
      [{ id: 'a', description: 'A', quantity: 2, unitPrice: 100, discount: 20, taxRate: 10 }],
      10
    )
    expect(totals).toEqual({ subtotal: 180, discount: 10, taxAmount: 17, total: 187 })
  })

  it('extracts tax from inclusive prices', () => {
    const totals = computeTotals(
      [{ id: 'a', description: 'A', quantity: 1, unitPrice: 110, discount: 0, taxRate: 10 }],
      0,
      true
    )
    expect(totals).toEqual({ subtotal: 110, discount: 0, taxAmount: 10, total: 110 })
  })

  it('caps discounts at the subtotal', () => {
    const totals = computeTotals(
      [{ id: 'a', description: 'A', quantity: 1, unitPrice: 100, discount: 0, taxRate: 10 }],
      500
    )
    expect(totals).toEqual({ subtotal: 100, discount: 100, taxAmount: 0, total: 0 })
  })
})

describe('invoiceBalance', () => {
  const invoice = makeInvoice({ total: 100, dueDate: '2026-01-31' })

  it('marks unpaid past-due invoices as overdue', () => {
    const result = invoiceBalance(invoice, [], [], '2026-02-15')
    expect(result).toMatchObject({ paid: 0, refunded: 0, netPaid: 0, balance: 100, status: 'overdue' })
  })

  it('marks partial payments', () => {
    const result = invoiceBalance(invoice, [makePayment({ amount: 40 })], [], '2026-01-20')
    expect(result).toMatchObject({ netPaid: 40, balance: 60, status: 'partial' })
  })

  it('marks fully paid invoices', () => {
    const result = invoiceBalance(invoice, [makePayment({ amount: 100 })], [], '2026-03-01')
    expect(result).toMatchObject({ balance: 0, status: 'paid' })
  })

  it('subtracts refunds from payments', () => {
    const result = invoiceBalance(
      invoice,
      [makePayment({ amount: 100 })],
      [makeRefund({ amount: 30 })],
      '2026-02-01'
    )
    expect(result).toMatchObject({ netPaid: 70, balance: 30, status: 'partial' })
  })

  it('never rewrites draft or void statuses', () => {
    expect(invoiceBalance(makeInvoice({ status: 'draft' }), [makePayment({ amount: 100 })], []).status).toBe('draft')
    expect(invoiceBalance(makeInvoice({ status: 'void' }), [], []).status).toBe('void')
  })
})

describe('accountBalance', () => {
  it('combines opening balance, transactions and transfers', () => {
    const data = emptyData({
      accounts: [makeAccount({ id: 'acc-1', openingBalance: 100 }), makeAccount({ id: 'acc-2', name: 'Savings' })],
      incomeTransactions: [makeIncome({ amount: 50 })],
      expenseTransactions: [makeExpense({ amount: 20 })],
      transfers: [makeTransfer({ fromAccountId: 'acc-1', toAccountId: 'acc-2', amount: 30 })]
    })
    expect(accountBalance(data, 'acc-1')).toBe(100)
    expect(accountBalance(data, 'acc-2')).toBe(30)
    expect(accountBalance(data, 'missing')).toBe(0)
  })
})

describe('financialSummary', () => {
  it('derives revenue, profit, tax and outstanding balances', () => {
    const data = emptyData({
      incomeTransactions: [
        makeIncome({ id: 'inc-1', amount: 100, taxAmount: 10 }),
        makeIncome({ id: 'inc-2', amount: 50 })
      ],
      expenseTransactions: [makeExpense({ amount: 30, taxAmount: 3 })],
      invoices: [makeInvoice({ total: 200 })],
      payments: [makePayment({ amount: 80 })]
    })
    const summary = financialSummary(data, '2026-01-01', '2026-01-31')
    expect(summary.revenue).toBe(150)
    expect(summary.expenses).toBe(30)
    expect(summary.netProfit).toBe(120)
    expect(summary.margin).toBe(80)
    expect(summary.taxCollected).toBe(10)
    expect(summary.taxPaid).toBe(3)
    expect(summary.invoicesIssued).toBe(1)
    expect(summary.invoiceTotal).toBe(200)
    expect(summary.paymentsReceived).toBe(80)
    expect(summary.outstanding).toBe(120)
    expect(summary.transactions).toBe(3)
  })

  it('ignores void invoices and out-of-range rows', () => {
    const data = emptyData({
      incomeTransactions: [makeIncome({ date: '2026-02-01' })],
      invoices: [makeInvoice({ total: 500, status: 'void' })]
    })
    const summary = financialSummary(data, '2026-01-01', '2026-01-31')
    expect(summary.revenue).toBe(0)
    expect(summary.invoicesIssued).toBe(0)
    expect(summary.outstanding).toBe(0)
    expect(summary.margin).toBe(0)
  })
})

describe('monthlySeries', () => {
  it('buckets income, expenses, invoices and orders per month', () => {
    const data = emptyData({
      incomeTransactions: [makeIncome({ date: '2026-01-10', amount: 120 })],
      expenseTransactions: [makeExpense({ date: '2026-01-12', amount: 20 })],
      invoices: [
        makeInvoice({ id: 'inv-1', issueDate: '2026-01-05', total: 200 }),
        makeInvoice({ id: 'inv-2', issueDate: '2026-02-05', total: 300 })
      ],
      orders: [
        makeOrder({ id: 'ord-1', date: '2026-01-05' }),
        makeOrder({ id: 'ord-2', date: '2026-01-20', status: 'cancelled' }),
        makeOrder({ id: 'ord-3', date: '2026-02-05' })
      ]
    })
    const series = monthlySeries(data, '2026-01-01', '2026-02-28')
    expect(series).toHaveLength(2)
    expect(series[0]).toMatchObject({ key: '2026-01', revenue: 120, expenses: 20, profit: 100, sales: 200, orders: 1 })
    expect(series[1]).toMatchObject({ key: '2026-02', revenue: 0, expenses: 0, profit: 0, sales: 300, orders: 1 })
  })
})

describe('categoryBreakdown', () => {
  it('totals and sorts categories, keeping uncategorised rows', () => {
    const slices = categoryBreakdown([
      { category: 'Sales', amount: 100 },
      { category: 'Sales', amount: 50 },
      { category: 'Other', amount: 20 },
      { category: '', amount: 5 }
    ])
    expect(slices).toEqual([
      { name: 'Sales', value: 150 },
      { name: 'Other', value: 20 },
      { name: 'Uncategorised', value: 5 }
    ])
  })
})

describe('productPerformance', () => {
  it('calculates revenue, quantity, cost and profit from invoice items', () => {
    const product = makeProduct({ id: 'prod-1', cost: 10 })
    const data = emptyData({
      products: [product],
      invoices: [makeInvoice({ id: 'inv-1' })],
      invoiceItems: [
        makeInvoiceItem({ id: 'item-1', invoiceId: 'inv-1', productId: 'prod-1', quantity: 2, unitPrice: 50 }),
        makeInvoiceItem({ id: 'item-2', invoiceId: 'void-inv', productId: 'prod-1', quantity: 5, unitPrice: 50 })
      ]
    })
    const rows = productPerformance(data, '2026-01-01', '2026-01-31')
    expect(rows).toEqual([{ name: 'Candle', value: 100, quantity: 2, cost: 20, profit: 80 }])
  })
})

describe('clientSummary', () => {
  it('summarises orders, sales, outstanding balance and last activity', () => {
    const data = emptyData({
      clients: [makeClient()],
      orders: [makeOrder({ id: 'ord-1', clientId: 'cli-1' }), makeOrder({ id: 'ord-2', clientId: 'cli-1', status: 'cancelled' })],
      invoices: [makeInvoice({ id: 'inv-1', clientId: 'cli-1', total: 200 })],
      payments: [makePayment({ amount: 50, date: '2026-01-10' })],
      communications: [makeCommunication({ date: '2026-02-02' })]
    })
    const summary = clientSummary(data, 'cli-1')
    expect(summary).toEqual({ orders: 1, totalSales: 200, outstanding: 150, lastActivity: '2026-02-02' })
    expect(clientSummary(data, 'missing')).toEqual({ orders: 0, totalSales: 0, outstanding: 0, lastActivity: null })
  })
})

describe('reservedQuantity', () => {
  it('counts quantities on open orders only', () => {
    const data = emptyData({
      orders: [
        makeOrder({ id: 'ord-1', status: 'confirmed' }),
        makeOrder({ id: 'ord-2', status: 'completed' }),
        makeOrder({ id: 'ord-3', status: 'cancelled' }),
        makeOrder({ id: 'ord-4', status: 'in-progress' })
      ],
      orderItems: [
        makeOrderItem({ id: 'i1', orderId: 'ord-1', quantity: 3 }),
        makeOrderItem({ id: 'i2', orderId: 'ord-2', quantity: 5 }),
        makeOrderItem({ id: 'i3', orderId: 'ord-3', quantity: 7 }),
        makeOrderItem({ id: 'i4', orderId: 'ord-4', quantity: 2 })
      ]
    })
    expect(reservedQuantity(data, 'prod-1')).toBe(5)
  })
})

describe('lowStockProducts', () => {
  it('returns active products at or below the reorder threshold', () => {
    const data = emptyData({
      products: [
        makeProduct({ id: 'p1', stockQuantity: 2, reorderThreshold: 5 }),
        makeProduct({ id: 'p2', stockQuantity: 5, reorderThreshold: 5 }),
        makeProduct({ id: 'p3', stockQuantity: 6, reorderThreshold: 5 }),
        makeProduct({ id: 'p4', stockQuantity: 0, reorderThreshold: 5, isActive: false })
      ]
    })
    expect(lowStockProducts(data).map((product) => product.id)).toEqual(['p1', 'p2'])
  })
})

describe('calculatePricing', () => {
  it('derives unit cost, fees, profit and a suggested price', () => {
    const result = calculatePricing({
      materials: [
        { name: 'Wax', quantity: 2, unitCost: 5 },
        { name: 'Wick', quantity: 1, unitCost: 10 }
      ],
      laborHours: 2,
      hourlyRate: 15,
      packagingCost: 5,
      overheadCost: 5,
      otherCost: 0,
      batchYield: 3,
      sellingPrice: 40,
      feePercent: 10,
      targetMargin: 30
    })
    expect(result.materialCost).toBe(20)
    expect(result.laborCost).toBe(30)
    expect(result.totalBatchCost).toBe(60)
    expect(result.unitCost).toBe(20)
    expect(result.feePerUnit).toBe(4)
    expect(result.profitPerUnit).toBe(16)
    expect(result.margin).toBe(40)
    expect(result.markup).toBe(80)
    expect(result.suggestedPrice).toBe(33.33)
  })

  it('guards against impossible targets and zero yield', () => {
    const result = calculatePricing({
      materials: [],
      laborHours: 0,
      hourlyRate: 0,
      packagingCost: 10,
      overheadCost: 0,
      otherCost: 0,
      batchYield: 0,
      sellingPrice: 0,
      feePercent: 100,
      targetMargin: 100
    })
    expect(result.unitCost).toBe(10)
    expect(result.suggestedPrice).toBe(0)
    expect(result.margin).toBe(0)
  })
})

describe('taxSummary', () => {
  it('separates collected and paid tax from taxable amounts', () => {
    const data = emptyData({
      incomeTransactions: [makeIncome({ amount: 110, taxAmount: 10 })],
      expenseTransactions: [makeExpense({ amount: 55, taxAmount: 5 })]
    })
    const summary = taxSummary(data, '2026-01-01', '2026-01-31')
    expect(summary).toEqual({ collected: 10, paid: 5, taxableIncome: 100, taxableExpenses: 50, net: 5 })
  })
})

describe('invoiceAging', () => {
  it('buckets outstanding balances by days past due', () => {
    const data = emptyData({
      invoices: [
        makeInvoice({ id: 'a', dueDate: '2026-07-15', total: 100 }),
        makeInvoice({ id: 'b', dueDate: '2026-06-15', total: 100 }),
        makeInvoice({ id: 'c', dueDate: '2026-05-01', total: 100 }),
        makeInvoice({ id: 'd', dueDate: '2026-03-01', total: 100 }),
        makeInvoice({ id: 'e', dueDate: '2026-03-01', total: 100, status: 'void' }),
        makeInvoice({ id: 'f', dueDate: '2026-03-01', total: 100, status: 'draft' }),
        makeInvoice({ id: 'g', dueDate: '2026-03-01', total: 100 })
      ],
      payments: [makePayment({ invoiceId: 'g', amount: 100 })]
    })
    const buckets = invoiceAging(data, '2026-06-30')
    expect(buckets).toEqual([
      { bucket: 'current', amount: 100 },
      { bucket: '1-30', amount: 100 },
      { bucket: '31-60', amount: 100 },
      { bucket: '61-90', amount: 0 },
      { bucket: '90+', amount: 100 }
    ])
  })
})

describe('orderExpectedTotal', () => {
  it('adds tax and delivery to the order total', () => {
    const totals = orderExpectedTotal(
      [{ id: 'a', description: 'Item', quantity: 1, unitPrice: 100, discount: 0, taxRate: 10 }],
      0,
      15,
      SETTINGS
    )
    expect(totals).toMatchObject({ subtotal: 100, taxAmount: 10, total: 125, delivery: 15 })
  })
})

describe('nextDocumentNumber', () => {
  it('pads sequence numbers and prefixes', () => {
    const year = new Date().getFullYear()
    expect(nextDocumentNumber(SETTINGS, 'invoice')).toBe(`INV-${year}-0001`)
    expect(nextDocumentNumber({ ...SETTINGS, nextQuoteNumber: 42 }, 'quote')).toBe(`QUO-${year}-0042`)
  })
})
