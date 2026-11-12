export type ISODate = string // YYYY-MM-DD
export type ISODateTime = string // ISO timestamp

export interface BusinessSettings {
  id: 'business'
  businessName: string
  logoDataUrl: string
  businessEmail: string
  phone: string
  address: string
  businessType: string
  currency: string
  currencySymbol: string
  currencyPrecision: number
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  fiscalYearStart: number
  defaultTaxRate: number
  taxInclusive: boolean
  invoicePrefix: string
  nextInvoiceNumber: number
  quotePrefix: string
  nextQuoteNumber: number
  orderPrefix: string
  nextOrderNumber: number
  defaultPaymentTerms: number
  incomeCategories: string[]
  expenseCategories: string[]
  subcategories: Record<string, string[]>
  productCategories: string[]
  units: string[]
  demoMode: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type AccountType = 'checking' | 'savings' | 'cash' | 'credit-card' | 'custom'

export interface Account {
  id: string
  name: string
  type: AccountType
  openingBalance: number
  isActive: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface IncomeTransaction {
  id: string
  date: ISODate
  description: string
  category: string
  subcategory: string
  amount: number
  taxAmount: number
  accountId: string
  paymentMethod: string
  clientId: string | null
  invoiceId: string | null
  orderId: string | null
  reference: string
  notes: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface ExpenseTransaction {
  id: string
  date: ISODate
  description: string
  category: string
  subcategory: string
  supplierId: string | null
  accountId: string
  amount: number
  taxAmount: number
  paymentMethod: string
  dueDate: ISODate | null
  receiptReference: string
  recurring: boolean
  notes: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface Transfer {
  id: string
  date: ISODate
  fromAccountId: string
  toAccountId: string
  amount: number
  notes: string
  createdAt: ISODateTime
}

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  description: string
  unit: string
  cost: number
  price: number
  stockQuantity: number
  reorderThreshold: number
  isActive: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
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
  minimumStock: number
  reorderQuantity: number
  expiryDate: ISODate | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type MovementType =
  | 'opening'
  | 'purchase'
  | 'production'
  | 'consumption'
  | 'sale'
  | 'return'
  | 'waste'
  | 'adjustment'
  | 'transfer'

export interface InventoryMovement {
  id: string
  itemType: 'material' | 'product'
  itemId: string
  date: ISODate
  type: MovementType
  quantity: number
  unitCost: number
  reference: string
  notes: string
  createdAt: ISODateTime
}

export interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  address: string
  materialsSupplied: string
  notes: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type PurchaseStatus = 'ordered' | 'partial' | 'received' | 'cancelled'

export interface Purchase {
  id: string
  supplierId: string
  purchaseDate: ISODate
  expectedDate: ISODate
  status: PurchaseStatus
  taxAmount: number
  total: number
  notes: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  materialId: string
  quantity: number
  receivedQuantity: number
  unitPrice: number
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  company: string
  clientType: 'individual' | 'business'
  notes: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type OrderStatus = 'draft' | 'confirmed' | 'in-progress' | 'ready' | 'completed' | 'cancelled'
export type FulfilmentStatus = 'unfulfilled' | 'partial' | 'fulfilled'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface Order {
  id: string
  number: string
  clientId: string
  date: ISODate
  dueDate: ISODate
  status: OrderStatus
  fulfilmentStatus: FulfilmentStatus
  paymentStatus: PaymentStatus
  discount: number
  taxAmount: number
  delivery: number
  total: number
  notes: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string | null
  description: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted'

export interface Quote {
  id: string
  number: string
  clientId: string
  issueDate: ISODate
  expiryDate: ISODate
  status: QuoteStatus
  discount: number
  taxAmount: number
  total: number
  notes: string
  convertedOrderId: string | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface QuoteItem {
  id: string
  quoteId: string
  productId: string | null
  description: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void'

export interface Invoice {
  id: string
  number: string
  clientId: string
  orderId: string | null
  quoteId: string | null
  issueDate: ISODate
  dueDate: ISODate
  status: InvoiceStatus
  subtotal: number
  discount: number
  taxAmount: number
  total: number
  notes: string
  terms: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  productId: string | null
  description: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
}

export interface Payment {
  id: string
  invoiceId: string
  clientId: string
  date: ISODate
  amount: number
  method: string
  accountId: string
  reference: string
  notes: string
  createdAt: ISODateTime
}

export interface Refund {
  id: string
  invoiceId: string
  paymentId: string | null
  clientId: string
  date: ISODate
  amount: number
  method: string
  accountId: string
  reason: string
  createdAt: ISODateTime
}

export type BillFrequency = 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type BillStatus = 'unpaid' | 'paid' | 'cancelled'

export interface Bill {
  id: string
  name: string
  category: string
  amount: number
  dueDate: ISODate
  frequency: BillFrequency
  accountId: string
  status: BillStatus
  paidDate: ISODate | null
  notes: string
  seriesId: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  clientId: string | null
  orderId: string | null
  invoiceId: string | null
  dueDate: ISODate | null
  priority: TaskPriority
  status: TaskStatus
  notes: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface Communication {
  id: string
  clientId: string
  date: ISODate
  method: 'email' | 'phone' | 'in-person' | 'other'
  subject: string
  summary: string
  followUpDate: ISODate | null
  createdAt: ISODateTime
}

export interface Budget {
  id: string
  name: string
  category: string
  amount: number
  period: 'monthly' | 'quarterly' | 'yearly'
  startDate: ISODate
  endDate: ISODate
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type GoalType = 'revenue' | 'profit' | 'savings' | 'custom'

export interface Goal {
  id: string
  name: string
  type: GoalType
  targetAmount: number
  currentAmount: number
  period: 'monthly' | 'quarterly' | 'yearly'
  targetDate: ISODate
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export type ActivityType =
  | 'create'
  | 'update'
  | 'delete'
  | 'transfer'
  | 'payment'
  | 'refund'
  | 'import'
  | 'export'
  | 'demo'
  | 'restore'

export interface ActivityLog {
  id: string
  type: ActivityType
  message: string
  entity: string
  entityId: string | null
  at: ISODateTime
}

export interface AppData {
  settings: BusinessSettings
  accounts: Account[]
  incomeTransactions: IncomeTransaction[]
  expenseTransactions: ExpenseTransaction[]
  transfers: Transfer[]
  products: Product[]
  materials: Material[]
  inventoryMovements: InventoryMovement[]
  suppliers: Supplier[]
  purchases: Purchase[]
  purchaseItems: PurchaseItem[]
  clients: Client[]
  orders: Order[]
  orderItems: OrderItem[]
  quotes: Quote[]
  quoteItems: QuoteItem[]
  invoices: Invoice[]
  invoiceItems: InvoiceItem[]
  payments: Payment[]
  refunds: Refund[]
  bills: Bill[]
  tasks: Task[]
  communications: Communication[]
  budgets: Budget[]
  goals: Goal[]
  activityLogs: ActivityLog[]
}

export type TableName = Exclude<keyof AppData, 'settings'>
