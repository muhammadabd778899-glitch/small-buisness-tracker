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
  InvoiceStatus,
  Material,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  Product,
  Purchase,
  PurchaseItem,
  Quote,
  QuoteItem,
  Refund,
  Supplier,
  Task,
  Transfer
} from './types'
import { addDays, addMonths, startOfMonth, todayISO, monthLabel } from './dates'
import { computeTotals } from './calc'
import { round2, sumBy } from './money'
import { nowISO } from './db'

export const DEMO_BUSINESS_NAME = 'Orange & Oak Studio'
const DEMO_ID = 'demo-'

function mulberry32(seed: number): () => number {
  let value = seed
  return () => {
    value |= 0
    value = (value + 0x6d2b79f5) | 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clampToToday(date: string, today: string): string {
  return date > today ? today : date
}

function stockFields(movements: InventoryMovement[]) {
  const total = (predicate: (m: InventoryMovement) => boolean) =>
    round2(movements.filter(predicate).reduce((sum, m) => sum + m.quantity, 0))
  return {
    openingStock: total((m) => m.type === 'opening'),
    stockReceived: total((m) => m.type === 'purchase' || m.type === 'return'),
    stockConsumed: Math.abs(total((m) => m.type === 'consumption' || m.type === 'sale')),
    waste: Math.abs(total((m) => m.type === 'waste')),
    adjustments: total((m) => m.type === 'adjustment'),
    currentStock: round2(movements.reduce((sum, m) => sum + m.quantity, 0))
  }
}

export function buildDemoData(): AppData {
  const rng = mulberry32(20251112)
  const at = nowISO()
  const today = todayISO()
  const start = addMonths(startOfMonth(today), -23)
  const rand = (min: number, max: number) => min + rng() * (max - min)
  const pick = <T,>(rows: T[]): T => rows[Math.floor(rng() * rows.length)]

  const settings: BusinessSettings = {
    id: 'business',
    businessName: DEMO_BUSINESS_NAME,
    logoDataUrl: '',
    businessEmail: 'hello@orangeandoak.example',
    phone: '(555) 010-2040',
    address: '128 Maple Avenue, Portland, OR 97205',
    businessType: 'Handmade & home goods studio',
    currency: 'USD',
    currencySymbol: '$',
    currencyPrecision: 2,
    dateFormat: 'MM/DD/YYYY',
    fiscalYearStart: 1,
    defaultTaxRate: 8.25,
    taxInclusive: false,
    invoicePrefix: 'INV',
    nextInvoiceNumber: 1101,
    quotePrefix: 'QTE',
    nextQuoteNumber: 608,
    orderPrefix: 'ORD',
    nextOrderNumber: 2101,
    defaultPaymentTerms: 30,
    incomeCategories: ['Product Sales', 'Service Income', 'Shipping Income', 'Workshop Income', 'Other Income'],
    expenseCategories: [
      'Materials',
      'Packaging',
      'Shipping',
      'Marketing',
      'Software & Fees',
      'Rent & Utilities',
      'Equipment',
      'Refunds & Returns',
      'Other Expenses'
    ],
    subcategories: {
      Materials: ['Clay', 'Wood', 'Leather', 'Resin', 'Fabric'],
      Packaging: ['Boxes', 'Labels', 'Tissue'],
      Marketing: ['Ads', 'Printing', 'Markets'],
      'Software & Fees': ['Software', 'Platform fees', 'Payment fees']
    },
    productCategories: ['Ceramics', 'Woodwork', 'Leather Goods', 'Home & Living', 'Accessories', 'Gift Sets'],
    units: ['piece', 'set', 'hour', 'kg', 'g', 'lb', 'oz', 'meter', 'liter', 'pack'],
    demoMode: true,
    createdAt: at,
    updatedAt: at
  }

  const accounts: Account[] = [
    { id: `${DEMO_ID}acc-1`, name: 'Business Checking', type: 'checking', openingBalance: 12400, isActive: true, createdAt: at, updatedAt: at },
    { id: `${DEMO_ID}acc-2`, name: 'Business Savings', type: 'savings', openingBalance: 8200, isActive: true, createdAt: at, updatedAt: at },
    { id: `${DEMO_ID}acc-3`, name: 'Cash Drawer', type: 'cash', openingBalance: 480, isActive: true, createdAt: at, updatedAt: at },
    { id: `${DEMO_ID}acc-4`, name: 'Studio Credit Card', type: 'credit-card', openingBalance: -1350, isActive: true, createdAt: at, updatedAt: at }
  ]
  const accountIds = accounts.map((account) => account.id)

  const suppliers: Supplier[] = [
    { id: `${DEMO_ID}sup-1`, name: 'Clay & Co. Supply', email: 'orders@clayco.example', phone: '(503) 555-0110', address: 'Portland, OR', materialsSupplied: 'Stoneware clay, glazes', notes: 'Weekly delivery on Tuesdays', createdAt: at, updatedAt: at },
    { id: `${DEMO_ID}sup-2`, name: 'Northwest Hardwoods', email: 'sales@nwhardwoods.example', phone: '(503) 555-0122', address: 'Beaverton, OR', materialsSupplied: 'Walnut and oak lumber', notes: 'Minimum order 20 board feet', createdAt: at, updatedAt: at },
    { id: `${DEMO_ID}sup-3`, name: 'Cascade Leather Works', email: 'supply@cascadeleather.example', phone: '(541) 555-0144', address: 'Eugene, OR', materialsSupplied: 'Full grain leather, hardware', notes: 'Vegetable-tanned hides only', createdAt: at, updatedAt: at },
    { id: `${DEMO_ID}sup-4`, name: 'Resin River Materials', email: 'hello@resinriver.example', phone: '(360) 555-0177', address: 'Vancouver, WA', materialsSupplied: 'Epoxy resin, pigments', notes: 'Two week lead time', createdAt: at, updatedAt: at },
    { id: `${DEMO_ID}sup-5`, name: 'Fiber & Flame', email: 'team@fiberandflame.example', phone: '(206) 555-0199', address: 'Seattle, WA', materialsSupplied: 'Linen, canvas, wool felt, soy wax', notes: 'Wholesale account #FF-2201', createdAt: at, updatedAt: at }
  ]
  const supplierIds = suppliers.map((supplier) => supplier.id)

  const materialSeeds: Array<[string, string, string, number, number, number, number, number]> = [
    ['Stoneware Clay', 'Clay', 'kg', 3.2, 120, 40, 60, 0],
    ['Walnut Lumber', 'Wood', 'piece', 8.5, 60, 20, 30, 1],
    ['Full Grain Leather', 'Leather', 'piece', 12, 45, 15, 25, 2],
    ['Epoxy Resin', 'Resin', 'liter', 18, 12, 10, 14, 3],
    ['Linen Fabric', 'Fabric', 'meter', 6.5, 80, 25, 40, 4],
    ['Macrame Cord', 'Fabric', 'pack', 4.2, 55, 20, 30, 4],
    ['Soy Wax', 'Wax', 'kg', 6.8, 70, 25, 35, 4],
    ['Amber Fragrance Oil', 'Wax', 'liter', 22, 8, 6, 8, 4],
    ['Brass Blanks', 'Metal', 'pack', 9, 40, 12, 20, 2],
    ['Canvas Fabric', 'Fabric', 'meter', 5.4, 65, 20, 30, 4],
    ['Wool Felt', 'Fabric', 'pack', 7.5, 50, 18, 25, 4],
    ['Kraft Gift Boxes', 'Packaging', 'pack', 3.6, 90, 30, 50, 4]
  ]

  const materials: Material[] = materialSeeds.map(([name, category, unit, unitCost, opening, minimum, reorder, supplierIndex], index) => ({
    id: `${DEMO_ID}mat-${index + 1}`,
    name,
    sku: `MAT-${String(index + 1).padStart(3, '0')}`,
    category,
    supplierId: supplierIds[supplierIndex],
    unit,
    openingStock: 0,
    stockReceived: 0,
    stockConsumed: 0,
    waste: 0,
    adjustments: 0,
    currentStock: opening,
    unitCost,
    minimumStock: minimum,
    reorderQuantity: reorder,
    expiryDate: null,
    createdAt: at,
    updatedAt: at
  }))

  const productSeeds: Array<[string, string, number, number, number]> = [
    ['Speckled Stoneware Mug', 'Ceramics', 8.5, 32, 10],
    ['Reactive Glaze Bowl', 'Ceramics', 9, 36, 10],
    ['Oak Serving Board', 'Woodwork', 14, 48, 8],
    ['Walnut Keyring', 'Accessories', 2.5, 14, 15],
    ['Leather Card Wallet', 'Leather Goods', 11, 42, 8],
    ['Resin Ocean Coaster Set', 'Home & Living', 6, 26, 10],
    ['Linen Table Runner', 'Home & Living', 12, 46, 6],
    ['Macrame Wall Hanging', 'Home & Living', 18, 68, 4],
    ['Soy Candle - Amber', 'Home & Living', 5.5, 24, 12],
    ['Ceramic Planter', 'Ceramics', 10, 38, 8],
    ['Canvas Tote', 'Accessories', 7, 28, 12],
    ['Brass Bookmark', 'Accessories', 1.8, 12, 20],
    ['Oak Photo Frame', 'Woodwork', 9, 34, 8],
    ['Wool Felt Coasters', 'Home & Living', 6, 22, 12],
    ['Handbound Journal', 'Home & Living', 8, 30, 10],
    ['Leather Passport Holder', 'Leather Goods', 10, 39, 8],
    ['Ceramic Pour-Over', 'Ceramics', 16, 58, 6],
    ['Studio Gift Box', 'Gift Sets', 22, 85, 4]
  ]

  const products: Product[] = productSeeds.map(([name, category, cost, price, threshold], index) => ({
    id: `${DEMO_ID}prod-${index + 1}`,
    name,
    sku: `OOS-${String(index + 1).padStart(3, '0')}`,
    category,
    description: `${name} handcrafted in the Orange & Oak studio.`,
    unit: 'piece',
    cost,
    price,
    stockQuantity: 0,
    reorderThreshold: threshold,
    isActive: true,
    createdAt: at,
    updatedAt: at
  }))

  const clientSeeds: Array<[string, string, string, 'individual' | 'business']> = [
    ['Sarah Chen', 'Studio Handmade', 'sarah.chen@example.com', 'business'],
    ['Michael Rodriguez', 'Rodriguez Designs', 'mike.r@example.com', 'business'],
    ['Emma Wright', 'Wright & Co.', 'emma.wright@example.com', 'business'],
    ['James Patel', '', 'james.patel@example.com', 'individual'],
    ['Olivia Bennett', 'Bennett Boutique', 'olivia@bennettboutique.example', 'business'],
    ['Noah Kim', '', 'noah.kim@example.com', 'individual'],
    ['Ava Thompson', 'Thompson Interiors', 'ava@thompsoninteriors.example', 'business'],
    ['Liam Walker', '', 'liam.walker@example.com', 'individual'],
    ['Sophia Nguyen', 'Nguyen Markets', 'sophia@nguyenmarkets.example', 'business'],
    ['Mason Brooks', '', 'mason.brooks@example.com', 'individual'],
    ['Isabella Rossi', 'Rossi Home', 'isabella@rossihome.example', 'business'],
    ['Ethan Hughes', '', 'ethan.hughes@example.com', 'individual'],
    ['Mia Foster', 'Foster Events', 'mia@fosterevents.example', 'business'],
    ['Lucas Gray', '', 'lucas.gray@example.com', 'individual'],
    ['Amelia Price', 'Price & Pine', 'amelia@priceandpine.example', 'business'],
    ['Henry Cole', '', 'henry.cole@example.com', 'individual'],
    ['Harper Diaz', 'Diaz Design Studio', 'harper@diazdesign.example', 'business'],
    ['Alexander Ward', '', 'alex.ward@example.com', 'individual'],
    ['Evelyn Bell', 'Bellwether Gifts', 'evelyn@bellwether.example', 'business'],
    ['Daniel Murphy', '', 'daniel.murphy@example.com', 'individual'],
    ['Abigail Reed', 'Reed Retreats', 'abigail@reedretreats.example', 'business'],
    ['Jack Turner', '', 'jack.turner@example.com', 'individual'],
    ['Luna Sanchez', 'Casa Luna', 'luna@casaluna.example', 'business'],
    ['Owen Phillips', '', 'owen.phillips@example.com', 'individual']
  ]

  const clients: Client[] = clientSeeds.map(([name, company, email, clientType], index) => ({
    id: `${DEMO_ID}client-${index + 1}`,
    name,
    email,
    phone: `(555) ${String(100 + index).padStart(3, '0')}-${String(2000 + index * 37).slice(-4)}`,
    address: index % 3 === 0 ? 'Portland, OR' : index % 3 === 1 ? 'Seattle, WA' : 'Vancouver, WA',
    company,
    clientType,
    notes: clientType === 'business' ? 'Wholesale / stockist account.' : 'Repeat retail customer.',
    createdAt: at,
    updatedAt: at
  }))

  const orders: Order[] = []
  const orderItems: OrderItem[] = []
  const orderStatusCycle: OrderStatus[] = [
    'completed', 'completed', 'completed', 'completed', 'in-progress', 'completed',
    'ready', 'completed', 'confirmed', 'cancelled'
  ]
  const soldByProduct = new Map<string, number>()
  const completedOrderIds: string[] = []

  for (let index = 0; index < 36; index += 1) {
    const monthOffset = index % 18
    const base = addMonths(startOfMonth(today), -monthOffset)
    let date = addDays(base, (index * 5) % 27)
    date = clampToToday(date, today)
    const client = clients[(index * 7) % clients.length]
    const status = index % 17 === 0 ? 'draft' : orderStatusCycle[index % orderStatusCycle.length]
    const itemCount = 1 + (index % 3)
    const items: OrderItem[] = []
    for (let k = 0; k < itemCount; k += 1) {
      const product = products[(index * 3 + k * 5) % products.length]
      const quantity = 1 + ((index + k) % 3)
      items.push({
        id: `${DEMO_ID}oi-${index + 1}-${k + 1}`,
        orderId: `${DEMO_ID}order-${index + 1}`,
        productId: product.id,
        description: product.name,
        quantity,
        unitPrice: product.price,
        discount: k === 1 && index % 4 === 0 ? 3 : 0,
        taxRate: settings.defaultTaxRate
      })
      if (status === 'completed') {
        soldByProduct.set(product.id, (soldByProduct.get(product.id) || 0) + quantity)
      }
    }
    const totals = computeTotals(items, 0, settings.taxInclusive)
    const delivery = index % 4 === 0 ? 6.5 : 0
    const order: Order = {
      id: `${DEMO_ID}order-${index + 1}`,
      number: `ORD-${date.slice(0, 4)}-${String(2001 + index)}`,
      clientId: client.id,
      date,
      dueDate: addDays(date, 14),
      status,
      fulfilmentStatus:
        status === 'completed' || status === 'ready'
          ? 'fulfilled'
          : status === 'in-progress'
            ? 'partial'
            : 'unfulfilled',
      paymentStatus: status === 'completed' ? 'paid' : status === 'draft' ? 'unpaid' : 'partial',
      discount: 0,
      taxAmount: totals.taxAmount,
      delivery,
      total: round2(totals.total + delivery),
      notes: status === 'cancelled' ? 'Cancelled by client.' : '',
      createdAt: at,
      updatedAt: at
    }
    orders.push(order)
    orderItems.push(...items)
    if (status === 'completed') completedOrderIds.push(order.id)
  }

  const invoices: Invoice[] = []
  const invoiceItems: InvoiceItem[] = []
  const payments: Payment[] = []
  const refunds: Refund[] = []
  const incomeFromPayments: IncomeTransaction[] = []

  const invoiceOrders = orders
    .filter((order) => ['completed', 'ready', 'in-progress', 'confirmed'].includes(order.status))
    .slice(0, 30)

  invoiceOrders.forEach((order, index) => {
    const issueDate = clampToToday(addDays(order.date, 2), today)
    const dueDate = addDays(issueDate, 30)
    const items = orderItems
      .filter((item) => item.orderId === order.id)
      .map((item) => ({
        id: `${DEMO_ID}ii-${index + 1}-${item.id.split('-').pop()}`,
        invoiceId: `${DEMO_ID}invoice-${index + 1}`,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate
      }))
    const totals = computeTotals(items, order.discount, settings.taxInclusive)
    const overdue = dueDate < today
    let status: InvoiceStatus
    let paidFactor = 0
    if (overdue) {
      if (index % 6 === 0) {
        status = 'overdue'
        paidFactor = 0
      } else if (index % 4 === 0) {
        status = 'partial'
        paidFactor = 0.5
      } else {
        status = 'paid'
        paidFactor = 1
      }
    } else if (index % 5 === 0) {
      status = 'sent'
      paidFactor = 0
    } else if (index % 3 === 0) {
      status = 'partial'
      paidFactor = 0.6
    } else {
      status = 'paid'
      paidFactor = 1
    }

    const invoice: Invoice = {
      id: `${DEMO_ID}invoice-${index + 1}`,
      number: `INV-${order.date.slice(0, 4)}-${String(1001 + index)}`,
      clientId: order.clientId,
      orderId: order.id,
      quoteId: null,
      issueDate,
      dueDate,
      status,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxAmount: totals.taxAmount,
      total: totals.total,
      notes: 'Thank you for supporting a small studio.',
      terms: 'Net 30',
      createdAt: at,
      updatedAt: at
    }
    invoices.push(invoice)
    invoiceItems.push(...items)

    if (paidFactor > 0) {
      const amount = round2(invoice.total * paidFactor)
      const paymentDate = clampToToday(addDays(issueDate, 6 + (index % 9)), today)
      const split = paidFactor === 1 && index % 3 === 0
      const installments = split ? [round2(amount / 2), round2(amount - round2(amount / 2))] : [amount]
      installments.forEach((installment, part) => {
        const id = `${DEMO_ID}pay-${index + 1}-${part + 1}`
        const date = clampToToday(addDays(paymentDate, part * 14), today)
        const method = pick(['credit-card', 'bank-transfer', 'cash', 'paypal', 'etsy'])
        const accountId = accountIds[index % 3]
        payments.push({
          id,
          invoiceId: invoice.id,
          clientId: invoice.clientId,
          date,
          amount: installment,
          method,
          accountId,
          reference: `PAY-${invoice.number}-${part + 1}`,
          notes: '',
          createdAt: at
        })
        incomeFromPayments.push({
          id: `${DEMO_ID}inc-${id}`,
          date,
          description: `Payment ${invoice.number} from ${clients.find((client) => client.id === invoice.clientId)?.name || 'client'}`,
          category: 'Product Sales',
          subcategory: '',
          amount: installment,
          taxAmount: round2(invoice.taxAmount * (installment / Math.max(1, invoice.total))),
          accountId,
          paymentMethod: method,
          clientId: invoice.clientId,
          invoiceId: invoice.id,
          orderId: order.id,
          reference: `PAY-${invoice.number}-${part + 1}`,
          notes: '',
          createdAt: at,
          updatedAt: at
        })
      })
    }

    if (index === 4 || index === 13) {
      const refundAmount = round2(invoice.total * 0.15)
      const date = clampToToday(addDays(issueDate, 21), today)
      refunds.push({
        id: `${DEMO_ID}refund-${index + 1}`,
        invoiceId: invoice.id,
        paymentId: payments.find((payment) => payment.invoiceId === invoice.id)?.id || null,
        clientId: invoice.clientId,
        date,
        amount: refundAmount,
        method: 'credit-card',
        accountId: accountIds[0],
        reason: 'Item returned in original condition.',
        createdAt: at
      })
    }
  })

  const transferIds = accountIds.slice(0, 3)
  const transfers: Transfer[] = [
    { id: `${DEMO_ID}transfer-1`, date: addDays(today, -120), fromAccountId: transferIds[0], toAccountId: transferIds[1], amount: 1500, notes: 'Monthly savings transfer', createdAt: at },
    { id: `${DEMO_ID}transfer-2`, date: addDays(today, -60), fromAccountId: transferIds[0], toAccountId: transferIds[1], amount: 1500, notes: 'Monthly savings transfer', createdAt: at },
    { id: `${DEMO_ID}transfer-3`, date: addDays(today, -15), fromAccountId: transferIds[0], toAccountId: transferIds[2], amount: 300, notes: 'Cash float for market day', createdAt: at }
  ]

  const manualIncome: IncomeTransaction[] = []
  const incomeCategories = ['Product Sales', 'Service Income', 'Shipping Income', 'Workshop Income', 'Other Income']
  for (let index = 0; index < 90; index += 1) {
    const monthOffset = index % 24
    const date = clampToToday(addDays(startOfMonth(addMonths(today, -monthOffset)), (index * 7) % 27), today)
    const category = incomeCategories[index % incomeCategories.length]
    const amount = round2(rand(45, category === 'Workshop Income' ? 780 : 460))
    const client = category === 'Service Income' || category === 'Workshop Income' ? clients[index % clients.length] : null
    manualIncome.push({
      id: `${DEMO_ID}inc-manual-${index + 1}`,
      date,
      description:
        category === 'Product Sales'
          ? pick(['Market stall sales', 'Etsy order payout', 'Studio pickup sale', 'Wholesale order deposit'])
          : category === 'Service Income'
            ? pick(['Custom commission', 'Interior styling consult', 'Corporate gifting project'])
            : category === 'Shipping Income'
              ? 'Shipping charged to customer'
              : category === 'Workshop Income'
                ? 'Pottery workshop ticket sales'
                : 'Miscellaneous income',
      category,
      subcategory: '',
      amount,
      taxAmount: category === 'Service Income' ? 0 : round2(amount * (settings.defaultTaxRate / 100)),
      accountId: accountIds[index % 2],
      paymentMethod: pick(['credit-card', 'cash', 'bank-transfer', 'etsy', 'paypal']),
      clientId: client ? client.id : null,
      invoiceId: null,
      orderId: null,
      reference: `RCPT-${2100 + index}`,
      notes: '',
      createdAt: at,
      updatedAt: at
    })
  }

  const expenses: ExpenseTransaction[] = []
  for (let index = 0; index < 100; index += 1) {
    const monthOffset = index % 24
    const date = clampToToday(addDays(startOfMonth(addMonths(today, -monthOffset)), (index * 11) % 27), today)
    const category = settings.expenseCategories[index % settings.expenseCategories.length]
    const amount =
      category === 'Rent & Utilities'
        ? round2(rand(650, 1350))
        : category === 'Equipment'
          ? round2(rand(80, 620))
          : round2(rand(18, 320))
    const supplier = category === 'Materials' || category === 'Packaging' ? suppliers[index % suppliers.length] : null
    expenses.push({
      id: `${DEMO_ID}exp-${index + 1}`,
      date,
      description:
        category === 'Materials'
          ? pick(['Clay restock', 'Leather hide order', 'Soy wax and wicks', 'Lumber delivery'])
          : category === 'Marketing'
            ? pick(['Market booth fee', 'Social media ads', 'Printed flyers'])
            : category === 'Software & Fees'
              ? pick(['Shop software subscription', 'Payment processing fees', 'Website hosting'])
              : category === 'Rent & Utilities'
                ? 'Studio rent and utilities'
                : category === 'Packaging'
                  ? 'Shipping boxes and labels'
                  : category === 'Equipment'
                    ? pick(['New kiln shelves', 'Studio tooling', 'Lighting equipment'])
                    : 'General studio expense',
      category,
      subcategory: '',
      supplierId: supplier ? supplier.id : null,
      accountId: accountIds[index % 4],
      amount,
      taxAmount: category === 'Materials' ? round2(amount * 0.08) : 0,
      paymentMethod: pick(['credit-card', 'bank-transfer', 'cash']),
      dueDate: null,
      receiptReference: `EXP-${3100 + index}`,
      recurring: category === 'Rent & Utilities' || category === 'Software & Fees',
      notes: '',
      createdAt: at,
      updatedAt: at
    })
  }

  refunds.forEach((refund, index) => {
    expenses.push({
      id: `${DEMO_ID}exp-refund-${index + 1}`,
      date: refund.date,
      description: `Refund for invoice ${refund.invoiceId.split('-').pop()}`,
      category: 'Refunds & Returns',
      subcategory: '',
      supplierId: null,
      accountId: refund.accountId,
      amount: refund.amount,
      taxAmount: 0,
      paymentMethod: refund.method,
      dueDate: null,
      receiptReference: refund.id,
      recurring: false,
      notes: refund.reason,
      createdAt: at,
      updatedAt: at
    })
  })

  const purchases: Purchase[] = []
  const purchaseItems: PurchaseItem[] = []
  const movementList: InventoryMovement[] = []
  const movementId = (() => {
    let counter = 0
    return () => {
      counter += 1
      return `${DEMO_ID}mv-${counter}`
    }
  })()

  materials.forEach((material, index) => {
    movementList.push({
      id: movementId(),
      itemType: 'material',
      itemId: material.id,
      date: start,
      type: 'opening',
      quantity: material.currentStock,
      unitCost: material.unitCost,
      reference: 'Opening stock',
      notes: '',
      createdAt: at
    })
    if (index % 3 === 0) {
      movementList.push({
        id: movementId(),
        itemType: 'material',
        itemId: material.id,
        date: addDays(start, 40 + index * 3),
        type: 'consumption',
        quantity: -Math.min(material.currentStock, 20 + index * 2),
        unitCost: material.unitCost,
        reference: 'Production batch',
        notes: '',
        createdAt: at
      })
    }
    if (index === 3 || index === 7) {
      movementList.push({
        id: movementId(),
        itemType: 'material',
        itemId: material.id,
        date: addDays(today, -45),
        type: 'consumption',
        quantity: -4,
        unitCost: material.unitCost,
        reference: 'Production batch',
        notes: '',
        createdAt: at
      })
    }
    if (index % 5 === 0) {
      movementList.push({
        id: movementId(),
        itemType: 'material',
        itemId: material.id,
        date: addDays(today, -30),
        type: 'waste',
        quantity: -2,
        unitCost: material.unitCost,
        reference: 'Damaged material',
        notes: '',
        createdAt: at
      })
    }
    if (index % 6 === 0) {
      movementList.push({
        id: movementId(),
        itemType: 'material',
        itemId: material.id,
        date: addDays(today, -12),
        type: 'adjustment',
        quantity: 3,
        unitCost: material.unitCost,
        reference: 'Cycle count adjustment',
        notes: '',
        createdAt: at
      })
    }
  })

  for (let index = 0; index < 8; index += 1) {
    const date = addDays(start, 60 + index * 55)
    const received = index < 6
    const purchase: Purchase = {
      id: `${DEMO_ID}purchase-${index + 1}`,
      supplierId: supplierIds[index % supplierIds.length],
      purchaseDate: date,
      expectedDate: addDays(date, 7),
      status: received ? 'received' : 'ordered',
      taxAmount: 0,
      total: 0,
      notes: received ? 'Received and checked in.' : 'Awaiting delivery.',
      createdAt: at,
      updatedAt: at
    }
    let subtotal = 0
    for (let k = 0; k < 2 + (index % 2); k += 1) {
      const material = materials[(index * 2 + k) % materials.length]
      const quantity = 20 + ((index + k) * 7) % 40
      const item: PurchaseItem = {
        id: `${DEMO_ID}pi-${index + 1}-${k + 1}`,
        purchaseId: purchase.id,
        materialId: material.id,
        quantity,
        receivedQuantity: received ? quantity : 0,
        unitPrice: material.unitCost
      }
      purchaseItems.push(item)
      subtotal += quantity * material.unitCost
      if (received) {
        movementList.push({
          id: movementId(),
          itemType: 'material',
          itemId: material.id,
          date: addDays(date, 5),
          type: 'purchase',
          quantity,
          unitCost: material.unitCost,
          reference: purchase.id,
          notes: 'Purchase received',
          createdAt: at
        })
      }
    }
    purchase.taxAmount = round2(subtotal * 0.08)
    purchase.total = round2(subtotal + purchase.taxAmount)
    purchases.push(purchase)
  }

  products.forEach((product, index) => {
    const sold = soldByProduct.get(product.id) || 0
    const lowStock = index === 4 || index === 13
    const produced = lowStock ? 0 : 10 + (index % 4) * 5
    const opening = sold + (lowStock ? 3 : 30)
    movementList.push({
      id: movementId(),
      itemType: 'product',
      itemId: product.id,
      date: start,
      type: 'opening',
      quantity: opening,
      unitCost: product.cost,
      reference: 'Opening stock',
      notes: '',
      createdAt: at
    })
    movementList.push({
      id: movementId(),
      itemType: 'product',
      itemId: product.id,
      date: addDays(start, 30 + index * 2),
      type: 'production',
      quantity: produced,
      unitCost: product.cost,
      reference: 'Studio production batch',
      notes: '',
      createdAt: at
    })
    const soldMovements = orderItems.filter(
      (item) => item.productId === product.id && completedOrderIds.includes(item.orderId)
    )
    soldMovements.forEach((item) => {
      movementList.push({
        id: movementId(),
        itemType: 'product',
        itemId: product.id,
        date: addDays(today, -20),
        type: 'sale',
        quantity: -item.quantity,
        unitCost: product.cost,
        reference: `Order ${item.orderId.split('-').pop()}`,
        notes: '',
        createdAt: at
      })
    })
    if (index % 4 === 0) {
      movementList.push({
        id: movementId(),
        itemType: 'product',
        itemId: product.id,
        date: addDays(today, -25),
        type: 'waste',
        quantity: -1,
        unitCost: product.cost,
        reference: 'Damaged in transit',
        notes: '',
        createdAt: at
      })
    }
    if (index % 5 === 0) {
      movementList.push({
        id: movementId(),
        itemType: 'product',
        itemId: product.id,
        date: addDays(today, -8),
        type: 'adjustment',
        quantity: 2,
        unitCost: product.cost,
        reference: 'Cycle count adjustment',
        notes: '',
        createdAt: at
      })
    }
  })

  const finalMaterials = materials.map((material) => {
    const movements = movementList.filter((m) => m.itemType === 'material' && m.itemId === material.id)
    return { ...material, ...stockFields(movements) }
  })
  const finalProducts = products.map((product) => {
    const movements = movementList.filter((m) => m.itemType === 'product' && m.itemId === product.id)
    return { ...product, stockQuantity: round2(movements.reduce((sum, m) => sum + m.quantity, 0)) }
  })

  const quotes: Quote[] = []
  const quoteItems: QuoteItem[] = []
  for (let index = 0; index < 8; index += 1) {
    const issueDate = clampToToday(addDays(today, -20 - index * 9), today)
    const quoteId = `${DEMO_ID}quote-${index + 1}`
    const items: QuoteItem[] = []
    for (let k = 0; k < 1 + (index % 3); k += 1) {
      const product = products[(index * 5 + k) % products.length]
      items.push({
        id: `${DEMO_ID}qi-${index + 1}-${k + 1}`,
        quoteId,
        productId: product.id,
        description: product.name,
        quantity: 2 + (index % 4),
        unitPrice: product.price,
        discount: 0,
        taxRate: settings.defaultTaxRate
      })
    }
    const totals = computeTotals(items, 0, settings.taxInclusive)
    const statuses: Quote['status'][] = ['accepted', 'converted', 'sent', 'declined', 'draft', 'converted', 'expired', 'sent']
    const status = statuses[index]
    quotes.push({
      id: quoteId,
      number: `QTE-${issueDate.slice(0, 4)}-${String(501 + index)}`,
      clientId: clients[(index * 3) % clients.length].id,
      issueDate,
      expiryDate: addDays(issueDate, 30),
      status,
      discount: 0,
      taxAmount: totals.taxAmount,
      total: totals.total,
      notes: status === 'converted' ? 'Converted to an order.' : '',
      convertedOrderId: status === 'converted' ? completedOrderIds[index % completedOrderIds.length] : null,
      createdAt: at,
      updatedAt: at
    })
    quoteItems.push(...items)
  }

  const bills: Bill[] = []
  const billSeeds: Array<[string, string, number, number, Bill['frequency']]> = [
    ['Studio rent', 'Rent & Utilities', 1200, -18, 'monthly'],
    ['Electricity', 'Rent & Utilities', 148, -6, 'monthly'],
    ['Internet', 'Software & Fees', 79, 4, 'monthly'],
    ['Adobe subscription', 'Software & Fees', 32, 9, 'monthly'],
    ['Market booth fee', 'Marketing', 185, 12, 'monthly'],
    ['Clay supplier invoice', 'Materials', 420, -30, 'once'],
    ['Packaging restock', 'Packaging', 240, 6, 'monthly'],
    ['Business insurance', 'Other Expenses', 310, 21, 'quarterly'],
    ['Payment processing fees', 'Software & Fees', 96, -2, 'monthly'],
    ['Shipping account top-up', 'Shipping', 150, 14, 'monthly'],
    ['Domain and hosting', 'Software & Fees', 45, 27, 'yearly'],
    ['Water bill', 'Rent & Utilities', 62, 3, 'quarterly'],
    ['Accountant retainer', 'Other Expenses', 220, 18, 'quarterly'],
    ['Studio equipment loan', 'Equipment', 275, -9, 'monthly']
  ]
  billSeeds.forEach(([name, category, amount, dayOffset, frequency], index) => {
    const dueDate = addDays(today, dayOffset)
    const paid = index < 6 && dayOffset < 0
    bills.push({
      id: `${DEMO_ID}bill-${index + 1}`,
      name,
      category,
      amount,
      dueDate,
      frequency,
      accountId: accountIds[index % 3],
      status: paid ? 'paid' : 'unpaid',
      paidDate: paid ? addDays(dueDate, -1) : null,
      notes: '',
      seriesId: `${DEMO_ID}bill-series-${index + 1}`,
      createdAt: at,
      updatedAt: at
    })
  })

  const tasks: Task[] = [
    ['Follow up with Wright & Co. on quote', 'sent quote and waiting for approval', clients[2].id, 'high', 'todo', 2],
    ['Photograph new ceramic collection', 'natural light, white background', null, 'medium', 'in-progress', 4],
    ['Order kraft boxes', 'reorder 100 kraft gift boxes', null, 'medium', 'todo', -2],
    ['Send invoice reminder to Rodriguez Designs', 'invoice is 5 days overdue', clients[1].id, 'high', 'todo', 0],
    ['Prepare market inventory list', 'check stock for Saturday market', null, 'medium', 'todo', 5],
    ['Update Etsy listings', 'new photos and pricing', null, 'low', 'in-progress', 7],
    ['Book accountant for quarterly review', '', null, 'medium', 'todo', 12],
    ['Restock full grain leather', 'Cascade Leather Works', null, 'high', 'todo', -1],
    ['Write newsletter', 'launch of the autumn collection', null, 'low', 'todo', 9],
    ['Reconcile business checking account', '', null, 'medium', 'done', -6],
    ['Plan pottery workshop schedule', '', null, 'low', 'todo', 15],
    ['Review wholesale pricing', '', null, 'medium', 'todo', 20]
  ].map(([title, description, clientId, priority, status, days], index) => ({
    id: `${DEMO_ID}task-${index + 1}`,
    title: title as string,
    description: description as string,
    clientId: clientId as string | null,
    orderId: null,
    invoiceId: index === 3 ? invoices[0].id : null,
    dueDate: addDays(today, days as number),
    priority: priority as Task['priority'],
    status: status as Task['status'],
    notes: '',
    createdAt: at,
    updatedAt: at
  }))

  const methods: Communication['method'][] = ['email', 'phone', 'in-person', 'email', 'other']
  const communications: Communication[] = Array.from({ length: 16 }).map((_, index) => {
    const client = clients[index % clients.length]
    const date = clampToToday(addDays(today, -3 - index * 4), today)
    return {
      id: `${DEMO_ID}comm-${index + 1}`,
      clientId: client.id,
      date,
      method: methods[index % methods.length],
      subject: pick(['Order update', 'Quote follow-up', 'Wholesale enquiry', 'Delivery question', 'Thank you note']),
      summary: 'Discussed order details and next steps. Client is happy with the timeline.',
      followUpDate: index % 4 === 0 ? addDays(date, 7) : null,
      createdAt: at
    }
  })

  const monthStart = startOfMonth(today)
  const budgets: Budget[] = [
    ['Materials', 900],
    ['Marketing', 350],
    ['Packaging', 300],
    ['Shipping', 250],
    ['Software & Fees', 220],
    ['Rent & Utilities', 1400]
  ].map(([category, amount], index) => ({
    id: `${DEMO_ID}budget-${index + 1}`,
    name: `${category} budget`,
    category: category as string,
    amount: amount as number,
    period: 'monthly',
    startDate: monthStart,
    endDate: addDays(addMonths(monthStart, 1), -1),
    createdAt: at,
    updatedAt: at
  }))

  const goals: Goal[] = [
    ['Monthly revenue target', 'revenue', 9000, 0, 'monthly', addDays(addMonths(monthStart, 1), -1)],
    ['Monthly profit target', 'profit', 3500, 0, 'monthly', addDays(addMonths(monthStart, 1), -1)],
    ['Studio savings fund', 'savings', 5000, 2200, 'yearly', addDays(today, 180)],
    ['New kiln fund', 'savings', 1800, 650, 'yearly', addDays(today, 240)],
    ['Holiday market sales', 'revenue', 12000, 0, 'quarterly', addDays(today, 90)]
  ].map(([name, type, targetAmount, currentAmount, period, targetDate], index) => ({
    id: `${DEMO_ID}goal-${index + 1}`,
    name: name as string,
    type: type as Goal['type'],
    targetAmount: targetAmount as number,
    currentAmount: currentAmount as number,
    period: period as Goal['period'],
    targetDate: targetDate as string,
    createdAt: at,
    updatedAt: at
  }))

  const activityLogs: ActivityLog[] = [
    ['demo', 'Demo workspace loaded', DEMO_BUSINESS_NAME],
    ['payment', 'Payment recorded for INV-2025-1004', 'Payment'],
    ['create', 'Order ORD-2025-2012 confirmed', 'Order'],
    ['update', 'Product prices reviewed', 'Product'],
    ['create', 'Bill "Studio rent" added', 'Bill'],
    ['payment', 'Partial payment recorded for INV-2025-1009', 'Payment'],
    ['update', 'Inventory adjustment posted for Stoneware Clay', 'Inventory'],
    ['create', 'Client Wright & Co. added', 'Client'],
    ['transfer', 'Transfer to Business Savings', 'Transfer'],
    ['refund', 'Refund issued for returned order', 'Refund']
  ].map(([type, message, entity], index) => ({
    id: `${DEMO_ID}log-${index + 1}`,
    type: type as ActivityLog['type'],
    message: message as string,
    entity: entity as string,
    entityId: null,
    at: new Date(Date.now() - index * 3600_000).toISOString()
  }))

  return {
    settings,
    accounts,
    incomeTransactions: [...incomeFromPayments, ...manualIncome],
    expenseTransactions: expenses,
    transfers,
    products: finalProducts,
    materials: finalMaterials,
    inventoryMovements: movementList,
    suppliers,
    purchases,
    purchaseItems,
    clients,
    orders,
    orderItems,
    quotes,
    quoteItems,
    invoices,
    invoiceItems,
    payments,
    refunds,
    bills,
    tasks,
    communications,
    budgets,
    goals,
    activityLogs
  }
}

export function demoMonths(): string[] {
  const today = todayISO()
  return Array.from({ length: 12 }).map((_, index) =>
    monthLabel(addMonths(startOfMonth(today), -11 + index).slice(0, 7))
  )
}

export const demoSummary = {
  clients: 24,
  products: 18,
  materials: 12,
  suppliers: 5,
  orders: 36,
  invoices: 30,
  bills: 14,
  transactions: 190,
  business: DEMO_BUSINESS_NAME
}

export function totalDemoRevenue(data: AppData): number {
  return sumBy(data.incomeTransactions, (row) => row.amount)
}
