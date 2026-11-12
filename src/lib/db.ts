import Dexie, { type Table } from 'dexie'
import type {
  Account,
  ActivityLog,
  AppData,
  Bill,
  Budget,
  BusinessSettings,
  Client,
  Communication,
  ExpenseTransaction,
  Goal,
  IncomeTransaction,
  InventoryMovement,
  Invoice,
  InvoiceItem,
  Material,
  Material as MaterialEntity,
  Order,
  OrderItem,
  Payment,
  Product,
  Purchase,
  PurchaseItem,
  Quote,
  QuoteItem,
  Refund,
  Supplier,
  TableName,
  Task,
  Transfer
} from './types'

export const DB_NAME = 'ultimate-small-business-manager'
export const SETTINGS_ID = 'business' as const

class AppDatabase extends Dexie {
  settings!: Table<BusinessSettings, string>
  accounts!: Table<Account, string>
  incomeTransactions!: Table<IncomeTransaction, string>
  expenseTransactions!: Table<ExpenseTransaction, string>
  transfers!: Table<Transfer, string>
  products!: Table<Product, string>
  materials!: Table<MaterialEntity, string>
  inventoryMovements!: Table<InventoryMovement, string>
  suppliers!: Table<Supplier, string>
  purchases!: Table<Purchase, string>
  purchaseItems!: Table<PurchaseItem, string>
  clients!: Table<Client, string>
  orders!: Table<Order, string>
  orderItems!: Table<OrderItem, string>
  quotes!: Table<Quote, string>
  quoteItems!: Table<QuoteItem, string>
  invoices!: Table<Invoice, string>
  invoiceItems!: Table<InvoiceItem, string>
  payments!: Table<Payment, string>
  refunds!: Table<Refund, string>
  bills!: Table<Bill, string>
  tasks!: Table<Task, string>
  communications!: Table<Communication, string>
  budgets!: Table<Budget, string>
  goals!: Table<Goal, string>
  activityLogs!: Table<ActivityLog, string>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      settings: 'id',
      accounts: 'id, type, isActive',
      incomeTransactions: 'id, date, category, accountId, clientId, invoiceId',
      expenseTransactions: 'id, date, category, accountId, supplierId, dueDate',
      transfers: 'id, date, fromAccountId, toAccountId',
      products: 'id, sku, category, isActive',
      materials: 'id, sku, category, supplierId',
      inventoryMovements: 'id, itemId, itemType, date, type, reference',
      suppliers: 'id, name',
      purchases: 'id, supplierId, purchaseDate, status',
      purchaseItems: 'id, purchaseId, materialId',
      clients: 'id, name, clientType',
      orders: 'id, number, clientId, date, status',
      orderItems: 'id, orderId, productId',
      quotes: 'id, number, clientId, issueDate, status',
      quoteItems: 'id, quoteId, productId',
      invoices: 'id, number, clientId, issueDate, dueDate, status',
      invoiceItems: 'id, invoiceId, productId',
      payments: 'id, invoiceId, clientId, date, accountId',
      refunds: 'id, invoiceId, clientId, date',
      bills: 'id, dueDate, status, frequency',
      tasks: 'id, dueDate, status, clientId',
      communications: 'id, clientId, date',
      budgets: 'id, category',
      goals: 'id, type, targetDate',
      activityLogs: 'id, at, type'
    })
  }
}

export const db = new AppDatabase()

export const TABLE_NAMES: TableName[] = [
  'accounts',
  'incomeTransactions',
  'expenseTransactions',
  'transfers',
  'products',
  'materials',
  'inventoryMovements',
  'suppliers',
  'purchases',
  'purchaseItems',
  'clients',
  'orders',
  'orderItems',
  'quotes',
  'quoteItems',
  'invoices',
  'invoiceItems',
  'payments',
  'refunds',
  'bills',
  'tasks',
  'communications',
  'budgets',
  'goals',
  'activityLogs'
]

export function tableFor(name: TableName): Table<{ id: string }, string> {
  return db.table(name) as unknown as Table<{ id: string }, string>
}

export function uid(prefix = ''): string {
  const value =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return prefix ? `${prefix}-${value}` : value
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function defaultSettings(): BusinessSettings {
  const at = nowISO()
  return {
    id: SETTINGS_ID,
    businessName: 'My Business',
    logoDataUrl: '',
    businessEmail: '',
    phone: '',
    address: '',
    businessType: 'Handmade business',
    currency: 'USD',
    currencySymbol: '$',
    currencyPrecision: 2,
    dateFormat: 'MM/DD/YYYY',
    fiscalYearStart: 1,
    defaultTaxRate: 0,
    taxInclusive: false,
    invoicePrefix: 'INV',
    nextInvoiceNumber: 1001,
    quotePrefix: 'QTE',
    nextQuoteNumber: 501,
    orderPrefix: 'ORD',
    nextOrderNumber: 2001,
    defaultPaymentTerms: 30,
    incomeCategories: ['Product Sales', 'Service Income', 'Shipping Income', 'Other Income'],
    expenseCategories: [
      'Materials',
      'Packaging',
      'Shipping',
      'Marketing',
      'Software & Fees',
      'Rent & Utilities',
      'Equipment',
      'Other Expenses'
    ],
    subcategories: {
      Materials: ['Clay', 'Wood', 'Fabric', 'Resin', 'Leather'],
      Packaging: ['Boxes', 'Labels', 'Tissue'],
      Marketing: ['Ads', 'Printing', 'Events'],
      'Software & Fees': ['Software', 'Platform fees', 'Payment fees']
    },
    productCategories: ['Handmade', 'Digital', 'Apparel', 'Home & Living', 'Accessories', 'Other'],
    units: ['piece', 'set', 'hour', 'kg', 'g', 'lb', 'oz', 'meter', 'liter', 'pack'],
    demoMode: false,
    createdAt: at,
    updatedAt: at
  }
}

export async function ensureSettings(): Promise<BusinessSettings> {
  const existing = await db.settings.get(SETTINGS_ID)
  if (existing) return existing
  const settings = defaultSettings()
  await db.settings.put(settings)
  return settings
}

export async function readAll(): Promise<AppData> {
  const settings = await ensureSettings()
  const entries = await Promise.all(
    TABLE_NAMES.map(async (name) => [name, await tableFor(name).toArray()] as const)
  )
  const data = { settings } as AppData
  for (const [name, rows] of entries) {
    ;(data as unknown as Record<string, unknown>)[name] = rows
  }
  return data
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLE_NAMES) {
      await tableFor(name).clear()
    }
  })
}

export async function resetDatabase(): Promise<void> {
  await clearAllData()
  await db.settings.clear()
  await db.settings.put(defaultSettings())
}

/**
 * Rebuilds the cached stock fields from the movement ledger so the ledger is
 * always the source of truth.
 */
export async function recomputeStock(itemType: 'material' | 'product', itemId: string): Promise<void> {
  const movements = await db.inventoryMovements.where('itemId').equals(itemId).toArray()
  const forItem = movements.filter((m) => m.itemType === itemType)
  const total = round2(forItem.reduce((sum, m) => sum + m.quantity, 0))

  if (itemType === 'product') {
    const product = await db.products.get(itemId)
    if (product) {
      await db.products.update(itemId, { stockQuantity: total, updatedAt: nowISO() })
    }
    return
  }

  const material = await db.materials.get(itemId)
  if (!material) return
  const sumOf = (predicate: (m: InventoryMovement) => boolean) =>
    round2(forItem.filter(predicate).reduce((sum, m) => sum + m.quantity, 0))

  await db.materials.update(itemId, {
    openingStock: sumOf((m) => m.type === 'opening'),
    stockReceived: sumOf((m) => m.type === 'purchase' || m.type === 'return'),
    stockConsumed: Math.abs(sumOf((m) => m.type === 'consumption' || m.type === 'sale' || m.type === 'production')),
    waste: Math.abs(sumOf((m) => m.type === 'waste')),
    adjustments: sumOf((m) => m.type === 'adjustment'),
    currentStock: total,
    updatedAt: nowISO()
  })
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function idStartsWithDemo(id: string): boolean {
  return id.startsWith('demo-')
}

export type { Material }
