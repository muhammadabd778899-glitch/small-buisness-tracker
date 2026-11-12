import Dexie, { type Table } from 'dexie'

export interface BusinessSettings {
  businessName: string
  businessEmail: string
  phone: string
  address: string
  businessType: string
  currency: string
  currencySymbol: string
  currencyPrecision: number
  dateFormat: string
  fiscalYearStart: number
  defaultTaxRate: number
  taxInclusive: boolean
  invoicePrefix: string
  invoiceNumbering: number
  quotePrefix: string
  defaultPaymentTerms: string
  incomeCategories: string[]
  expenseCategories: string[]
  subcategories: Record<string, string[]>
  productCategories: string[]
  accounts: Account[]
  unitsOfMeasurement: string[]
  businessGoals: Goal[]
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'cash' | 'credit-card' | 'custom'
  currency: string
  openingBalance: number
  currentBalance: number
  taxRate: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IncomeExpenseTransaction {
  id: string
  date: Date
  description: string
  category: string
  subcategory: string
  amount: number
  taxAmount: number
  accountId: string
  paymentMethod: string
  clientId: string | null
  relatedInvoiceId: string | null
  relatedOrderId: string | null
  referenceNumber: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  sku: string
  imageUrl: string | null
  category: string
  description: string
  unit: string
  estimatedCost: number
  sellingPrice: number
  profitPerUnit: number
  profitMargin: number
  stockQuantity: number
  reorderThreshold: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Material {
  id: string
  name: string
  sku: string
  category: string
  supplierId: string | null
  unit: string
  openingStock: number
  stockReceived: number
  stockConsumed: number
  waste: number
  adjustments: number
  currentStock: number
  unitCost: number
  stockValue: number
  minimumStock: number
  reorderQuantity: number
  expiryDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  address: string
  materialsSupplied: string[]
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface Purchase {
  id: string
  supplierId: string
  purchaseDate: Date
  expectedDate: Date
  status: 'pending' | 'partial' | 'received' | 'cancelled'
  totalAmount: number
  taxAmount: number
  paymentStatus: 'pending' | 'partial' | 'paid'
  receiptStatus: 'pending' | 'received'
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  productId: string | null
  materialId: string | null
  quantity: number
  unitPrice: number
  taxRate: number
  totalPrice: number
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  company: string
  clientType: 'individual' | 'business'
  dateAdded: Date
  notes: string
  lastContact: Date
  outstandingBalance: number
  totalOrders: number
  totalSales: number
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  clientId: string | null
  orderDate: Date
  dueDate: Date
  status: 'draft' | 'confirmed' | 'in-progress' | 'ready' | 'completed' | 'cancelled'
  lineItems: OrderLineItem[]
  subtotal: number
  taxAmount: number
  total: number
  paymentStatus: 'pending' | 'partial' | 'paid'
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface OrderLineItem {
  id: string
  orderId: string
  productId: string | null
  materialId: string | null
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  totalPrice: number
}

export interface Quote {
  id: string
  clientId: string
  issueDate: Date
  expiryDate: Date
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'cancelled'
  lineItems: QuoteLineItem[]
  subtotal: number
  taxAmount: number
  total: number
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface QuoteLineItem {
  id: string
  quoteId: string
  productId: string | null
  materialId: string | null
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  totalPrice: number
}

export interface Invoice {
  id: string
  clientId: string
  invoiceNumber: string
  issueDate: Date
  dueDate: Date
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxAmount: number
  total: number
  paidAmount: number
  balanceDue: number
  paymentTerms: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceLineItem {
  id: string
  invoiceId: string
  productId: string | null
  materialId: string | null
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  totalPrice: number
}

export interface Payment {
  id: string
  invoiceId: string | null
  clientId: string
  date: Date
  amount: number
  paymentMethod: string
  accountId: string | null
  reference: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface Refund {
  id: string
  invoiceId: string
  clientId: string
  date: Date
  amount: number
  paymentMethod: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface Bill {
  id: string
  name: string
  category: string
  amount: number
  dueDate: Date
  frequency: 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  accountId: string
  status: 'pending' | 'paid' | 'overdue'
  paidDate: Date | null
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  title: string
  description: string | null
  clientId: string | null
  orderId: string | null
  invoiceId: string | null
  dueDate: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface Communication {
  id: string
  clientId: string | null
  date: Date
  method: 'email' | 'phone' | 'in-person' | 'other'
  subject: string
  summary: string
  followUpDate: Date | null
  createdAt: Date
}

export interface Budget {
  id: string
  name: string
  category: string
  allocatedAmount: number
  spentAmount: number
  period: 'monthly' | 'quarterly' | 'yearly'
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  unit: string
  period: 'monthly' | 'quarterly' | 'yearly'
  targetDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface ActivityLog {
  id: string
  type: 'create' | 'update' | 'delete' | 'transfer' | 'payment' | 'refund' | 'import' | 'export'
  message: string
  relatedId: string | null
  timestamp: Date
}

export class UltimateBusinessDB extends Dexie {
  businessSettings!: Table<BusinessSettings, string>
  accounts!: Table<Account, string>
  incomeTransactions!: Table<IncomeExpenseTransaction, string>
  expenseTransactions!: Table<IncomeExpenseTransaction, string>
  products!: Table<Product, string>
  materials!: Table<Material, string>
  suppliers!: Table<Supplier, string>
  purchases!: Table<Purchase, string>
  purchaseItems!: Table<PurchaseItem, string>
  clients!: Table<Client, string>
  orders!: Table<Order, string>
  orderItems!: Table<OrderLineItem, string>
  quotes!: Table<Quote, string>
  quoteItems!: Table<QuoteLineItem, string>
  invoices!: Table<Invoice, string>
  invoiceItems!: Table<InvoiceLineItem, string>
  payments!: Table<Payment, string>
  refunds!: Table<Refund, string>
  bills!: Table<Bill, string>
  tasks!: Table<Task, string>
  communications!: Table<Communication, string>
  budgets!: Table<Budget, string>
  goals!: Table<Goal, string>
  activityLogs!: Table<ActivityLog, string>

  constructor() {
    super('UltimateBusinessDB')
    this.version(1).stores({
      businessSettings: '++id',
      accounts: '++id',
      incomeTransactions: '++id',
      expenseTransactions: '++id',
      products: '++id',
      materials: '++id',
      suppliers: '++id',
      purchases: '++id',
      purchaseItems: '++id',
      clients: '++id',
      orders: '++id',
      orderItems: '++id',
      quotes: '++id',
      quoteItems: '++id',
      invoices: '++id',
      invoiceItems: '++id',
      payments: '++id',
      refunds: '++id',
      bills: '++id',
      tasks: '++id',
      communications: '++id',
      budgets: '++id',
      goals: '++id',
      activityLogs: '++id'
    })
  }

  // Business logic methods
  async getCurrentBalance(accountId: string): Promise<number> {
    const account = await this.accounts.get(accountId)
    if (!account) return 0

    // Get all deposits and withdrawals for this account
    const transactions = await this.incomeTransactions
      .where('accountId').equals(accountId)
      .toArray()
    
    const withdrawals = await this.expenseTransactions
      .where('accountId').equals(accountId)
      .toArray()

    let balance = account.openingBalance
    
    // Add deposits (income)
    transactions.forEach(t => {
      balance += t.amount
    })
    
    // Subtract withdrawals (expenses)
    withdrawals.forEach(t => {
      balance -= t.amount
    })

    return balance
  }

  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    const query: any = {}
    if (startDate) query.date = { $gte: startDate }
    if (endDate) {
      if (!query.date) query.date = {}
      query.date.$lte = endDate
    }

    const transactions = await this.incomeTransactions
      .where(query)
      .toArray()

    return transactions.reduce((sum, t) => sum + t.amount, 0)
  }

  async getTotalExpenses(startDate?: Date, endDate?: Date): Promise<number> {
    const query: any = {}
    if (startDate) query.date = { $gte: startDate }
    if (endDate) {
      if (!query.date) query.date = {}
      query.date.$lte = endDate
    }

    const transactions = await this.expenseTransactions
      .where(query)
      .toArray()

    return transactions.reduce((sum, t) => sum + t.amount, 0)
  }

  async getNetProfit(startDate?: Date, endDate?: Date): Promise<number> {
    const revenue = await this.getTotalRevenue(startDate, endDate)
    const expenses = await this.getTotalExpenses(startDate, endDate)
    return revenue - expenses
  }

  async getProfitMargin(startDate?: Date, endDate?: Date): Promise<number> {
    const netProfit = await this.getNetProfit(startDate, endDate)
    const revenue = await this.getTotalRevenue(startDate, endDate)
    if (revenue === 0) return 0
    return (netProfit / revenue) * 100
  }
}

export const db = new UltimateBusinessDB()