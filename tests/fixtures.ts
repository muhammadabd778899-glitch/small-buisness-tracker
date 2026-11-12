import type {
  Account,
  AppData,
  BusinessSettings,
  Client,
  Communication,
  ExpenseTransaction,
  IncomeTransaction,
  Invoice,
  InvoiceItem,
  Order,
  OrderItem,
  Payment,
  Product,
  Refund,
  Transfer
} from '../src/lib/types'

const stamp = '2026-01-01T00:00:00.000Z'

export const SETTINGS: BusinessSettings = {
  id: 'business',
  businessName: 'Test Studio',
  logoDataUrl: '',
  businessEmail: 'hello@example.com',
  phone: '',
  address: '',
  businessType: 'Retail',
  currency: 'USD',
  currencySymbol: '$',
  currencyPrecision: 2,
  dateFormat: 'MM/DD/YYYY',
  fiscalYearStart: 1,
  defaultTaxRate: 10,
  taxInclusive: false,
  invoicePrefix: 'INV',
  nextInvoiceNumber: 1,
  quotePrefix: 'QUO',
  nextQuoteNumber: 1,
  orderPrefix: 'ORD',
  nextOrderNumber: 1,
  defaultPaymentTerms: 14,
  incomeCategories: ['Sales'],
  expenseCategories: ['Supplies'],
  subcategories: {},
  productCategories: ['General'],
  units: ['piece'],
  demoMode: false,
  createdAt: stamp,
  updatedAt: stamp
}

export function emptyData(overrides: Partial<AppData> = {}): AppData {
  return {
    settings: SETTINGS,
    accounts: [],
    incomeTransactions: [],
    expenseTransactions: [],
    transfers: [],
    products: [],
    materials: [],
    inventoryMovements: [],
    suppliers: [],
    purchases: [],
    purchaseItems: [],
    clients: [],
    orders: [],
    orderItems: [],
    quotes: [],
    quoteItems: [],
    invoices: [],
    invoiceItems: [],
    payments: [],
    refunds: [],
    bills: [],
    tasks: [],
    communications: [],
    budgets: [],
    goals: [],
    activityLogs: [],
    ...overrides
  }
}

export const makeAccount = (patch: Partial<Account> = {}): Account => ({
  id: 'acc-1',
  name: 'Checking',
  type: 'checking',
  openingBalance: 0,
  isActive: true,
  createdAt: stamp,
  updatedAt: stamp,
  ...patch
})

export const makeIncome = (patch: Partial<IncomeTransaction> = {}): IncomeTransaction => ({
  id: 'inc-1',
  date: '2026-01-10',
  description: 'Sale',
  category: 'Sales',
  subcategory: '',
  amount: 100,
  taxAmount: 0,
  accountId: 'acc-1',
  paymentMethod: 'Cash',
  clientId: null,
  invoiceId: null,
  orderId: null,
  reference: '',
  notes: '',
  createdAt: stamp,
  updatedAt: stamp,
  ...patch
})

export const makeExpense = (patch: Partial<ExpenseTransaction> = {}): ExpenseTransaction => ({
  id: 'exp-1',
  date: '2026-01-12',
  description: 'Supplies',
  category: 'Supplies',
  subcategory: '',
  supplierId: null,
  accountId: 'acc-1',
  amount: 50,
  taxAmount: 0,
  paymentMethod: 'Cash',
  dueDate: null,
  receiptReference: '',
  recurring: false,
  notes: '',
  createdAt: stamp,
  updatedAt: stamp,
  ...patch
})

export const makeProduct = (patch: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  name: 'Candle',
  sku: 'SKU-1',
  category: 'General',
  description: '',
  unit: 'piece',
  cost: 10,
  price: 30,
  stockQuantity: 20,
  reorderThreshold: 5,
  isActive: true,
  createdAt: stamp,
  updatedAt: stamp,
  ...patch
})

export const makeInvoice = (patch: Partial<Invoice> = {}): Invoice => ({
  id: 'inv-1',
  number: 'INV-2026-0001',
  clientId: 'cli-1',
  orderId: null,
  quoteId: null,
  issueDate: '2026-01-05',
  dueDate: '2026-01-19',
  status: 'sent',
  subtotal: 100,
  discount: 0,
  taxAmount: 0,
  total: 100,
  notes: '',
  terms: '',
  createdAt: stamp,
  updatedAt: stamp,
  ...patch
})

export const makeInvoiceItem = (patch: Partial<InvoiceItem> = {}): InvoiceItem => ({
  id: 'item-1',
  invoiceId: 'inv-1',
  productId: null,
  description: 'Custom work',
  quantity: 1,
  unitPrice: 100,
  discount: 0,
  taxRate: 0,
  ...patch
})

export const makePayment = (patch: Partial<Payment> = {}): Payment => ({
  id: 'pay-1',
  invoiceId: 'inv-1',
  clientId: 'cli-1',
  date: '2026-01-10',
  amount: 100,
  method: 'Cash',
  accountId: 'acc-1',
  reference: '',
  notes: '',
  createdAt: stamp,
  ...patch
})

export const makeRefund = (patch: Partial<Refund> = {}): Refund => ({
  id: 'ref-1',
  invoiceId: 'inv-1',
  paymentId: null,
  clientId: 'cli-1',
  date: '2026-01-11',
  amount: 100,
  method: 'Cash',
  accountId: 'acc-1',
  reason: 'Returned',
  createdAt: stamp,
  ...patch
})

export const makeOrder = (patch: Partial<Order> = {}): Order => ({
  id: 'ord-1',
  number: 'ORD-2026-0001',
  clientId: 'cli-1',
  date: '2026-01-08',
  dueDate: '2026-01-20',
  status: 'confirmed',
  fulfilmentStatus: 'unfulfilled',
  paymentStatus: 'unpaid',
  discount: 0,
  taxAmount: 0,
  delivery: 0,
  total: 100,
  notes: '',
  createdAt: stamp,
  updatedAt: stamp,
  ...patch
})

export const makeOrderItem = (patch: Partial<OrderItem> = {}): OrderItem => ({
  id: 'orditem-1',
  orderId: 'ord-1',
  productId: 'prod-1',
  description: 'Candle',
  quantity: 1,
  unitPrice: 30,
  discount: 0,
  taxRate: 0,
  ...patch
})

export const makeClient = (patch: Partial<Client> = {}): Client => ({
  id: 'cli-1',
  name: 'Ada Lovelace',
  clientType: 'individual',
  email: '',
  phone: '',
  address: '',
  company: '',
  notes: '',
  createdAt: stamp,
  updatedAt: stamp,
  ...patch
})

export const makeTransfer = (patch: Partial<Transfer> = {}): Transfer => ({
  id: 'trn-1',
  date: '2026-01-15',
  fromAccountId: 'acc-1',
  toAccountId: 'acc-2',
  amount: 100,
  notes: '',
  createdAt: stamp,
  ...patch
})

export const makeCommunication = (patch: Partial<Communication> = {}): Communication => ({
  id: 'com-1',
  clientId: 'cli-1',
  date: '2026-01-09',
  method: 'email',
  subject: 'Hello',
  summary: '',
  followUpDate: null,
  createdAt: stamp,
  ...patch
})
