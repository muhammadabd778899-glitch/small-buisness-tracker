import create from 'zustand'
import { db } from '../lib/database'
import { 
  BusinessSettings, 
  Account, 
  IncomeExpenseTransaction, 
  Product, 
  Material, 
  Supplier, 
  Purchase, 
  PurchaseItem, 
  Client, 
  Order, 
  OrderLineItem, 
  Quote, 
  QuoteLineItem, 
  Invoice, 
  InvoiceLineItem, 
  Payment, 
  Refund, 
  Bill, 
  Task, 
  Communication, 
  Budget, 
  Goal, 
  ActivityLog 
} from '../lib/database'

interface BusinessState {
  // Business settings
  businessSettings: BusinessSettings | null
  setBusinessSettings: (settings: BusinessSettings) => void
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => void
  
  // Accounts
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
  addAccount: (account: Account) => void
  updateAccount: (id: string, account: Partial<Account>) => void
  removeAccount: (id: string) => void
  getAccountBalance: (accountId: string) => Promise<number>
  
  // Income transactions
  incomeTransactions: IncomeExpenseTransaction[]
  setIncomeTransactions: (transactions: IncomeExpenseTransaction[]) => void
  addIncomeTransaction: (transaction: IncomeExpenseTransaction) => void
  updateIncomeTransaction: (id: string, transaction: Partial<IncomeExpenseTransaction>) => void
  removeIncomeTransaction: (id: string) => void
  
  // Expense transactions
  expenseTransactions: IncomeExpenseTransaction[]
  setExpenseTransactions: (transactions: IncomeExpenseTransaction[]) => void
  addExpenseTransaction: (transaction: IncomeExpenseTransaction) => void
  updateExpenseTransaction: (id: string, transaction: Partial<IncomeExpenseTransaction>) => void
  removeExpenseTransaction: (id: string) => void
  
  // Products
  products: Product[]
  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  removeProduct: (id: string) => void
  
  // Materials
  materials: Material[]
  setMaterials: (materials: Material[]) => void
  addMaterial: (material: Material) => void
  updateMaterial: (id: string, material: Partial<Material>) => void
  removeMaterial: (id: string) => void
  
  // Suppliers
  suppliers: Supplier[]
  setSuppliers: (suppliers: Supplier[]) => void
  addSupplier: (supplier: Supplier) => void
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void
  removeSupplier: (id: string) => void
  
  // Purchases
  purchases: Purchase[]
  setPurchases: (purchases: Purchase[]) => void
  addPurchase: (purchase: Purchase) => void
  updatePurchase: (id: string, purchase: Partial<Purchase>) => void
  removePurchase: (id: string) => void
  
  // Purchase items
  purchaseItems: PurchaseItem[]
  setPurchaseItems: (items: PurchaseItem[]) => void
  addPurchaseItem: (item: PurchaseItem) => void
  updatePurchaseItem: (id: string, item: Partial<PurchaseItem>) => void
  removePurchaseItem: (id: string) => void
  
  // Clients
  clients: Client[]
  setClients: (clients: Client[]) => void
  addClient: (client: Client) => void
  updateClient: (id: string, client: Partial<Client>) => void
  removeClient: (id: string) => void
  
  // Orders
  orders: Order[]
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrder: (id: string, order: Partial<Order>) => void
  removeOrder: (id: string) => void
  
  // Order items
  orderItems: OrderLineItem[]
  setOrderItems: (items: OrderLineItem[]) => void
  addOrderItem: (item: OrderLineItem) => void
  updateOrderItem: (id: string, item: Partial<OrderLineItem>) => void
  removeOrderItem: (id: string) => void
  
  // Quotes
  quotes: Quote[]
  setQuotes: (quotes: Quote[]) => void
  addQuote: (quote: Quote) => void
  updateQuote: (id: string, quote: Partial<Quote>) => void
  removeQuote: (id: string) => void
  
  // Quote items
  quoteItems: QuoteLineItem[]
  setQuoteItems: (items: QuoteLineItem[]) => void
  addQuoteItem: (item: QuoteLineItem) => void
  updateQuoteItem: (id: string, item: Partial<QuoteLineItem>) => void
  removeQuoteItem: (id: string) => void
  
  // Invoices
  invoices: Invoice[]
  setInvoices: (invoices: Invoice[]) => void
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void
  removeInvoice: (id: string) => void
  
  // Invoice items
  invoiceItems: InvoiceLineItem[]
  setInvoiceItems: (items: InvoiceLineItem[]) => void
  addInvoiceItem: (item: InvoiceLineItem) => void
  updateInvoiceItem: (id: string, item: Partial<InvoiceLineItem>) => void
  removeInvoiceItem: (id: string) => void
  
  // Payments
  payments: Payment[]
  setPayments: (payments: Payment[]) => void
  addPayment: (payment: Payment) => void
  updatePayment: (id: string, payment: Partial<Payment>) => void
  removePayment: (id: string) => void
  
  // Refunds
  refunds: Refund[]
  setRefunds: (refunds: Refund[]) => void
  addRefund: (refund: Refund) => void
  updateRefund: (id: string, refund: Partial<Refund>) => void
  removeRefund: (id: string) => void
  
  // Bills
  bills: Bill[]
  setBills: (bills: Bill[]) => void
  addBill: (bill: Bill) => void
  updateBill: (id: string, bill: Partial<Bill>) => void
  removeBill: (id: string) => void
  
  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, task: Partial<Task>) => void
  removeTask: (id: string) => void
  
  // Communications
  communications: Communication[]
  setCommunications: (communications: Communication[]) => void
  addCommunication: (comm: Communication) => void
  updateCommunication: (id: string, comm: Partial<Communication>) => void
  removeCommunication: (id: string) => void
  
  // Budgets
  budgets: Budget[]
  setBudgets: (budgets: Budget[]) => void
  addBudget: (budget: Budget) => void
  updateBudget: (id: string, budget: Partial<Budget>) => void
  removeBudget: (id: string) => void
  
  // Goals
  goals: Goal[]
  setGoals: (goals: Goal[]) => void
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  removeGoal: (id: string) => void
  
  // Activity logs
  activityLogs: ActivityLog[]
  setActivityLogs: (logs: ActivityLog[]) => void
  addActivityLog: (log: ActivityLog) => void
  
  // UI state
  isDemo: boolean
  setIsDemo: (demo: boolean) => void
  isDataLoaded: boolean
  setIsDataLoaded: (loaded: boolean) => void
  
  // Demo data management
  loadDemoData: () => Promise<void>
  clearDemoData: () => Promise<void>
  resetBusiness: () => Promise<void>
}

const useBusinessStore = create<BusinessState>((set, get) => ({
  // Initial state - load from IndexedDB on first load
  businessSettings: null,
  accounts: [],
  incomeTransactions: [],
  expenseTransactions: [],
  products: [],
  materials: [],
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
  isDemo: false,
  isDataLoaded: false,
  
  setBusinessSettings: (settings) => set({ businessSettings: settings }),
  
  updateBusinessSettings: (partial) => {
    const current = get().businessSettings
    if (current) {
      const updated = { ...current, ...partial, updatedAt: new Date() }
      set({ businessSettings: updated })
      // Save to DB
      db.businessSettings.put(updated)
    }
  },
  
  setAccounts: (accounts) => set({ accounts }),
  
  addAccount: (account) => {
    set(state => ({ accounts: [...state.accounts, account] }))
    db.accounts.put(account)
  },
  
  updateAccount: (id, partial) => {
    set(state => ({
      accounts: state.accounts.map(a => a.id === id ? { ...a, ...partial } : a)
    }))
    db.accounts.update(id, partial as any)
  },
  
  removeAccount: (id) => {
    set(state => ({
      accounts: state.accounts.filter(a => a.id !== id)
    }))
    db.accounts.delete(id)
  },
  
  getAccountBalance: async (accountId) => {
    return db.getCurrentBalance(accountId)
  },
  
  setIncomeTransactions: (transactions) => set({ incomeTransactions: transactions }),
  
  addIncomeTransaction: (transaction) => {
    set(state => ({ incomeTransactions: [...state.incomeTransactions, transaction] }))
    db.incomeTransactions.put(transaction)
  },
  
  updateIncomeTransaction: (id, partial) => {
    set(state => ({
      incomeTransactions: state.incomeTransactions.map(t => t.id === id ? { ...t, ...partial } : t)
    }))
    db.incomeTransactions.update(id, partial as any)
  },
  
  removeIncomeTransaction: (id) => {
    set(state => ({
      incomeTransactions: state.incomeTransactions.filter(t => t.id !== id)
    }))
    db.incomeTransactions.delete(id)
  },
  
  setExpenseTransactions: (transactions) => set({ expenseTransactions: transactions }),
  
  addExpenseTransaction: (transaction) => {
    set(state => ({ expenseTransactions: [...state.expenseTransactions, transaction] }))
    db.expenseTransactions.put(transaction)
  },
  
  updateExpenseTransaction: (id, partial) => {
    set(state => ({
      expenseTransactions: state.expenseTransactions.map(t => t.id === id ? { ...t, ...partial } : t)
    }))
    db.expenseTransactions.update(id, partial as any)
  },
  
  removeExpenseTransaction: (id) => {
    set(state => ({
      expenseTransactions: state.expenseTransactions.filter(t => t.id !== id)
    }))
    db.expenseTransactions.delete(id)
  },
  
  setProducts: (products) => set({ products }),
  
  addProduct: (product) => {
    set(state => ({ products: [...state.products, product] }))
    db.products.put(product)
  },
  
  updateProduct: (id, partial) => {
    set(state => ({
      products: state.products.map(p => p.id === id ? { ...p, ...partial } : p)
    }))
    db.products.update(id, partial as any)
  },
  
  removeProduct: (id) => {
    set(state => ({
      products: state.products.filter(p => p.id !== id)
    }))
    db.products.delete(id)
  },
  
  setMaterials: (materials) => set({ materials }),
  
  addMaterial: (material) => {
    set(state => ({ materials: [...state.materials, material] }))
    db.materials.put(material)
  },
  
  updateMaterial: (id, partial) => {
    set(state => ({
      materials: state.materials.map(m => m.id === id ? { ...m, ...partial } : m)
    }))
    db.materials.update(id, partial as any)
  },
  
  removeMaterial: (id) => {
    set(state => ({
      materials: state.materials.filter(m => m.id !== id)
    }))
    db.materials.delete(id)
  },
  
  setSuppliers: (suppliers) => set({ suppliers }),
  
  addSupplier: (supplier) => {
    set(state => ({ suppliers: [...state.suppliers, supplier] }))
    db.suppliers.put(supplier)
  },
  
  updateSupplier: (id, partial) => {
    set(state => ({
      suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...partial } : s)
    }))
    db.suppliers.update(id, partial as any)
  },
  
  removeSupplier: (id) => {
    set(state => ({
      suppliers: state.suppliers.filter(s => s.id !== id)
    }))
    db.suppliers.delete(id)
  },
  
  setPurchases: (purchases) => set({ purchases }),
  
  addPurchase: (purchase) => {
    set(state => ({ purchases: [...state.purchases, purchase] }))
    db.purchases.put(purchase)
  },
  
  updatePurchase: (id, partial) => {
    set(state => ({
      purchases: state.purchases.map(p => p.id === id ? { ...p, ...partial } : p)
    }))
    db.purchases.update(id, partial as any)
  },
  
  removePurchase: (id) => {
    set(state => ({
      purchases: state.purchases.filter(p => p.id !== id)
    }))
    db.purchases.delete(id)
  },
  
  setPurchaseItems: (items) => set({ purchaseItems: items }),
  
  addPurchaseItem: (item) => {
    set(state => ({ purchaseItems: [...state.purchaseItems, item] }))
    db.purchaseItems.put(item)
  },
  
  updatePurchaseItem: (id, partial) => {
    set(state => ({
      purchaseItems: state.purchaseItems.map(i => i.id === id ? { ...i, ...partial } : i)
    }))
    db.purchaseItems.update(id, partial as any)
  },
  
  removePurchaseItem: (id) => {
    set(state => ({
      purchaseItems: state.purchaseItems.filter(i => i.id !== id)
    }))
    db.purchaseItems.delete(id)
  },
  
  setClients: (clients) => set({ clients }),
  
  addClient: (client) => {
    set(state => ({ clients: [...state.clients, client] }))
    db.clients.put(client)
  },
  
  updateClient: (id, partial) => {
    set(state => ({
      clients: state.clients.map(c => c.id === id ? { ...c, ...partial } : c)
    }))
    db.clients.update(id, partial as any)
  },
  
  removeClient: (id) => {
    set(state => ({
      clients: state.clients.filter(c => c.id !== id)
    }))
    db.clients.delete(id)
  },
  
  setOrders: (orders) => set({ orders }),
  
  addOrder: (order) => {
    set(state => ({ orders: [...state.orders, order] }))
    db.orders.put(order)
  },
  
  updateOrder: (id, partial) => {
    set(state => ({
      orders: state.orders.map(o => o.id === id ? { ...o, ...partial } : o)
    }))
    db.orders.update(id, partial as any)
  },
  
  removeOrder: (id) => {
    set(state => ({
      orders: state.orders.filter(o => o.id !== id)
    }))
    db.orders.delete(id)
  },
  
  setOrderItems: (items) => set({ orderItems: items }),
  
  addOrderItem: (item) => {
    set(state => ({ orderItems: [...state.orderItems, item] }))
    db.orderItems.put(item)
  },
  
  updateOrderItem: (id, partial) => {
    set(state => ({
      orderItems: state.orderItems.map(i => i.id === id ? { ...i, ...partial } : i)
    }))
    db.orderItems.update(id, partial as any)
  },
  
  removeOrderItem: (id) => {
    set(state => ({
      orderItems: state.orderItems.filter(i => i.id !== id)
    }))
    db.orderItems.delete(id)
  },
  
  setQuotes: (quotes) => set({ quotes }),
  
  addQuote: (quote) => {
    set(state => ({ quotes: [...state.quotes, quote] }))
    db.quotes.put(quote)
  },
  
  updateQuote: (id, partial) => {
    set(state => ({
      quotes: state.quotes.map(q => q.id === id ? { ...q, ...partial } : q)
    }))
    db.quotes.update(id, partial as any)
  },
  
  removeQuote: (id) => {
    set(state => ({
      quotes: state.quotes.filter(q => q.id !== id)
    }))
    db.quotes.delete(id)
  },
  
  setQuoteItems: (items) => set({ quoteItems: items }),
  
  addQuoteItem: (item) => {
    set(state => ({ quoteItems: [...state.quoteItems, item] }))
    db.quoteItems.put(item)
  },
  
  updateQuoteItem: (id, partial) => {
    set(state => ({
      quoteItems: state.quoteItems.map(i => i.id === id ? { ...i, ...partial } : i)
    }))
    db.quoteItems.update(id, partial as any)
  },
  
  removeQuoteItem: (id) => {
    set(state => ({
      quoteItems: state.quoteItems.filter(i => i.id !== id)
    }))
    db.quoteItems.delete(id)
  },
  
  setInvoices: (invoices) => set({ invoices }),
  
  addInvoice: (invoice) => {
    set(state => ({ invoices: [...state.invoices, invoice] }))
    db.invoices.put(invoice)
  },
  
  updateInvoice: (id, partial) => {
    set(state => ({
      invoices: state.invoices.map(i => i.id === id ? { ...i, ...partial } : i)
    }))
    db.invoices.update(id, partial as any)
  },
  
  removeInvoice: (id) => {
    set(state => ({
      invoices: state.invoices.filter(i => i.id !== id)
    }))
    db.invoices.delete(id)
  },
  
  setInvoiceItems: (items) => set({ invoiceItems: items }),
  
  addInvoiceItem: (item) => {
    set(state => ({ invoiceItems: [...state.invoiceItems, item] }))
    db.invoiceItems.put(item)
  },
  
  updateInvoiceItem: (id, partial) => {
    set(state => ({
      invoiceItems: state.invoiceItems.map(i => i.id === id ? { ...i, ...partial } : i)
    }))
    db.invoiceItems.update(id, partial as any)
  },
  
  removeInvoiceItem: (id) => {
    set(state => ({
      invoiceItems: state.invoiceItems.filter(i => i.id !== id)
    }))
    db.invoiceItems.delete(id)
  },
  
  setPayments: (payments) => set({ payments }),
  
  addPayment: (payment) => {
    set(state => ({ payments: [...state.payments, payment] }))
    db.payments.put(payment)
  },
  
  updatePayment: (id, partial) => {
    set(state => ({
      payments: state.payments.map(p => p.id === id ? { ...p, ...partial } : p)
    }))
    db.payments.update(id, partial as any)
  },
  
  removePayment: (id) => {
    set(state => ({
      payments: state.payments.filter(p => p.id !== id)
    }))
    db.payments.delete(id)
  },
  
  setRefunds: (refunds) => set({ refunds }),
  
  addRefund: (refund) => {
    set(state => ({ refunds: [...state.refunds, refund] }))
    db.refunds.put(refund)
  },
  
  updateRefund: (id, partial) => {
    set(state => ({
      refunds: state.refunds.map(r => r.id === id ? { ...r, ...partial } : r)
    }))
    db.refunds.update(id, partial as any)
  },
  
  removeRefund: (id) => {
    set(state => ({
      refunds: state.refunds.filter(r => r.id !== id)
    }))
    db.refunds.delete(id)
  },
  
  setBills: (bills) => set({ bills }),
  
  addBill: (bill) => {
    set(state => ({ bills: [...state.bills, bill] }))
    db.bills.put(bill)
  },
  
  updateBill: (id, partial) => {
    set(state => ({
      bills: state.bills.map(b => b.id === id ? { ...b, ...partial } : b)
    }))
    db.bills.update(id, partial as any)
  },
  
  removeBill: (id) => {
    set(state => ({
      bills: state.bills.filter(b => b.id !== id)
    }))
    db.bills.delete(id)
  },
  
  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => {
    set(state => ({ tasks: [...state.tasks, task] }))
    db.tasks.put(task)
  },
  
  updateTask: (id, partial) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...partial } : t)
    }))
    db.tasks.update(id, partial as any)
  },
  
  removeTask: (id) => {
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }))
    db.tasks.delete(id)
  },
  
  setCommunications: (communications) => set({ communications }),
  
  addCommunication: (comm) => {
    set(state => ({ communications: [...state.communications, comm] }))
    db.communications.put(comm)
  },
  
  updateCommunication: (id, partial) => {
    set(state => ({
      communications: state.communications.map(c => c.id === id ? { ...c, ...partial } : c)
    }))
    db.communications.update(id, partial as any)
  },
  
  removeCommunication: (id) => {
    set(state => ({
      communications: state.communications.filter(c => c.id !== id)
    }))
    db.communications.delete(id)
  },
  
  setBudgets: (budgets) => set({ budgets }),
  
  addBudget: (budget) => {
    set(state => ({ budgets: [...state.budgets, budget] }))
    db.budgets.put(budget)
  },
  
  updateBudget: (id, partial) => {
    set(state => ({
      budgets: state.budgets.map(b => b.id === id ? { ...b, ...partial } : b)
    }))
    db.budgets.update(id, partial as any)
  },
  
  removeBudget: (id) => {
    set(state => ({
      budgets: state.budgets.filter(b => b.id !== id)
    }))
    db.budgets.delete(id)
  },
  
  setGoals: (goals) => set({ goals }),
  
  addGoal: (goal) => {
    set(state => ({ goals: [...state.goals, goal] }))
    db.goals.put(goal)
  },
  
  updateGoal: (id, partial) => {
    set(state => ({
      goals: state.goals.map(g => g.id === id ? { ...g, ...partial } : g)
    }))
    db.goals.update(id, partial as any)
  },
  
  removeGoal: (id) => {
    set(state => ({
      goals: state.goals.filter(g => g.id !== id)
    }))
    db.goals.delete(id)
  },
  
  setActivityLogs: (logs) => set({ activityLogs: logs }),
  
  addActivityLog: (log) => {
    set(state => ({ activityLogs: [...state.activityLogs, log] }))
    db.activityLogs.put(log)
  },
  
  setIsDemo: (demo) => set({ isDemo: demo }),
  
  setIsDataLoaded: (loaded) => set({ isDataLoaded: loaded }),
  
  loadDemoData: async () => {
    // Demo data will be loaded in seed function
    // This is a placeholder for now
    const demoClients = await import('../data/demo-clients').then(m => m.default)
    const demoProducts = await import('../data/demo-products').then(m => m.default)
    const demoTransactions = await import('../data/demo-transactions').then(m => m.default)
    const demoOrders = await import('../data/demo-orders').then(m => m.default)
    const demoInvoices = await import('../data/demo-invoices').then(m => m.default)
    const demoPayments = await import('../data/demo-payments').then(m => m.default)
    const demoBills = await import('../data/demo-bills').then(m => m.default)
    const demoTasks = await import('../data/demo-tasks').then(m => m.default)
    const demoCommunications = await import('../data/demo-communications').then(m => m.default)
    const demoBudgets = await import('../data/demo-budgets').then(m => m.default)
    const demoGoals = await import('../data/demo-goals').then(m => m.default)
    
    // Clear existing data
    await get().clearDemoData()
    
    // Add demo clients
    if (demoClients) {
      demoClients.forEach((client: Client) => {
        get().addClient(client)
      })
    }
    
    // Add demo products
    if (demoProducts) {
      demoProducts.forEach((product: Product) => {
        get().addProduct(product)
      })
    }
    
    // Add demo transactions
    if (demoTransactions) {
      demoTransactions.forEach((tx: IncomeExpenseTransaction) => {
        get().addIncomeTransaction({ ...tx, type: 'income' })
        get().addExpenseTransaction({ ...tx, type: 'expense' })
      })
    }
    
    // Add demo orders
    if (demoOrders) {
      demoOrders.forEach((order: Order) => {
        get().addOrder(order)
      })
    }
    
    // Add demo invoices
    if (demoInvoices) {
      demoInvoices.forEach((invoice: Invoice) => {
        get().addInvoice(invoice)
      })
    }
    
    // Add demo payments
    if (demoPayments) {
      demoPayments.forEach((payment: Payment) => {
        get().addPayment(payment)
      })
    }
    
    // Add demo bills
    if (demoBills) {
      demoBills.forEach((bill: Bill) => {
        get().addBill(bill)
      })
    }
    
    // Add demo tasks
    if (demoTasks) {
      demoTasks.forEach((task: Task) => {
        get().addTask(task)
      })
    }
    
    // Add demo communications
    if (demoCommunications) {
      demoCommunications.forEach((comm: Communication) => {
        get().addCommunication(comm)
      })
    }
    
    // Add demo budgets
    if (demoBudgets) {
      demoBudgets.forEach((budget: Budget) => {
        get().addBudget(budget)
      })
    }
    
    // Add demo goals
    if (demoGoals) {
      demoGoals.forEach((goal: Goal) => {
        get().addGoal(goal)
      })
    }
    
    set({ isDataLoaded: true })
  },
  
  clearDemoData: async () => {
    // Clear all demo-related data from store and DB
    const demoIds = {
      clients: get().clients.map(c => c.id),
      products: get().products.map(p => p.id),
      transactions: [...get().incomeTransactions, ...get().expenseTransactions].map(t => t.id),
      orders: get().orders.map(o => o.id),
      orderItems: get().orderItems.map(o => o.id),
      quotes: get().quotes.map(q => q.id),
      quoteItems: get().quoteItems.map(q => q.id),
      invoices: get().invoices.map(i => i.id),
      invoiceItems: get().invoiceItems.map(i => i.id),
      payments: get().payments.map(p => p.id),
      refunds: get().refunds.map(r => r.id),
      bills: get().bills.map(b => b.id),
      tasks: get().tasks.map(t => t.id),
      communications: get().communications.map(c => c.id),
      budgets: get().budgets.map(b => b.id),
      goals: get().goals.map(g => g.id),
    }
    
    // Clear from store
    set({
      clients: [],
      products: [],
      incomeTransactions: [],
      expenseTransactions: [],
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
    })
    
    // Clear from Dexie
    await Promise.all([
      db.clients.clear(),
      db.products.clear(),
      db.incomeTransactions.clear(),
      db.expenseTransactions.clear(),
      db.orders.clear(),
      db.orderItems.clear(),
      db.quotes.clear(),
      db.quoteItems.clear(),
      db.invoices.clear(),
      db.invoiceItems.clear(),
      db.payments.clear(),
      db.refunds.clear(),
      db.bills.clear(),
      db.tasks.clear(),
      db.communications.clear(),
      db.budgets.clear(),
      db.goals.clear(),
    ])
  },
  
  resetBusiness: async () => {
    await get().clearDemoData()
    set({
      businessSettings: null,
      isDemo: false,
      isDataLoaded: false,
    })
    await db.accounts.clear()
    await db.incomeTransactions.clear()
    await db.expenseTransactions.clear()
    await db.products.clear()
    await db.materials.clear()
    await db.suppliers.clear()
    await db.purchases.clear()
    await db.purchaseItems.clear()
    await db.clients.clear()
    await db.orders.clear()
    await db.orderItems.clear()
    await db.quotes.clear()
    await db.quoteItems.clear()
    await db.invoices.clear()
    await db.invoiceItems.clear()
    await db.payments.clear()
    await db.refunds.clear()
    await db.bills.clear()
    await db.tasks.clear()
    await db.communications.clear()
    await db.budgets.clear()
    await db.goals.clear()
    await db.activityLogs.clear()
  },
}))

export default useBusinessStore