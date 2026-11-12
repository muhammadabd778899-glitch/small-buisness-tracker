import { Invoice } from '../lib/database'
import { InvoiceLineItem } from '../lib/database'
import { Product } from '../lib/database'
import { Client } from '../lib/database'
import { demoClients, demoProducts } from './'

export const demoInvoices: Invoice[] = [
  {
    id: 'inv1',
    clientId: 'c1',
    invoiceNumber: 'INV-2024-001',
    issueDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili1',
        invoiceId: 'inv1',
        productId: 'p1',
        quantity: 2,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 25.98 + 2.08
      } as InvoiceLineItem
    ],
    subtotal: 25.98,
    taxAmount: 2.08,
    total: 28.06,
    paidAmount: 28.06,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'inv2',
    clientId: 'c2',
    invoiceNumber: 'INV-2024-002',
    issueDate: new Date('2024-01-20'),
    dueDate: new Date('2024-02-19'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili2',
        invoiceId: 'inv2',
        productId: 'p2',
        quantity: 1,
        unitPrice: 18.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 18.99 + 1.52
      } as InvoiceLineItem
    ],
    subtotal: 18.99,
    taxAmount: 1.52,
    total: 20.51,
    paidAmount: 20.51,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'inv3',
    clientId: 'c3',
    invoiceNumber: 'INV-2024-003',
    issueDate: new Date('2024-01-25'),
    dueDate: new Date('2024-02-22'),
    status: 'partial',
    lineItems: [
      {
        id: 'ili3',
        invoiceId: 'inv3',
        productId: 'p3',
        quantity: 1,
        unitPrice: 24.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 24.99 + 2.00
      } as InvoiceLineItem
    ],
    subtotal: 24.99,
    taxAmount: 2.00,
    total: 26.99,
    paidAmount: 14.99,
    balanceDue: 12.00,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: 'inv4',
    clientId: 'c4',
    invoiceNumber: 'INV-2024-004',
    issueDate: new Date('2024-02-01'),
    dueDate: new Date('2024-03-02'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili4',
        invoiceId: 'inv4',
        productId: 'p4',
        quantity: 3,
        unitPrice: 10.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 31.50 + 2.52
      } as InvoiceLineItem
    ],
    subtotal: 31.50,
    taxAmount: 2.52,
    total: 34.02,
    paidAmount: 34.02,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'inv5',
    clientId: 'c5',
    invoiceNumber: 'INV-2024-005',
    issueDate: new Date('2024-02-08'),
    dueDate: new Date('2024-03-09'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili5',
        invoiceId: 'inv5',
        productId: 'p5',
        quantity: 2,
        unitPrice: 14.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 29.98 + 2.40
      } as InvoiceLineItem
    ],
    subtotal: 29.98,
    taxAmount: 2.40,
    total: 32.38,
    paidAmount: 32.38,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-08')
  },
  {
    id: 'inv6',
    clientId: 'c6',
    invoiceNumber: 'INV-2024-006',
    issueDate: new Date('2024-02-15'),
    dueDate: new Date('2024-03-16'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili6',
        invoiceId: 'inv6',
        productId: 'p1',
        quantity: 3,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 38.97 + 3.12
      } as InvoiceLineItem
    ],
    subtotal: 38.97,
    taxAmount: 3.12,
    total: 42.09,
    paidAmount: 42.09,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: 'inv7',
    clientId: 'c7',
    invoiceNumber: 'INV-2024-007',
    issueDate: new Date('2024-02-20'),
    dueDate: new Date('2024-03-21'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili7',
        invoiceId: 'inv7',
        productId: 'p7',
        quantity: 1,
        unitPrice: 28.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 28.00 + 2.24
      } as InvoiceLineItem
    ],
    subtotal: 28.00,
    taxAmount: 2.24,
    total: 30.24,
    paidAmount: 30.24,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20')
  },
  {
    id: 'inv8',
    clientId: 'c8',
    invoiceNumber: 'INV-2024-008',
    issueDate: new Date('2024-02-25'),
    dueDate: new Date('2024-03-26'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili8',
        invoiceId: 'inv8',
        productId: 'p8',
        quantity: 2,
        unitPrice: 16.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 33.98 + 2.72
      } as InvoiceLineItem
    ],
    subtotal: 33.98,
    taxAmount: 2.72,
    total: 36.70,
    paidAmount: 36.70,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-02-25')
  },
  {
    id: 'inv9',
    clientId: 'c4',
    invoiceNumber: 'INV-2024-009',
    issueDate: new Date('2024-03-01'),
    dueDate: new Date('2024-03-31'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili9',
        invoiceId: 'inv9',
        productId: 'p1',
        quantity: 4,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 51.96 + 4.16
      } as InvoiceLineItem
    ],
    subtotal: 51.96,
    taxAmount: 4.16,
    total: 56.12,
    paidAmount: 56.12,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: 'inv10',
    clientId: 'c11',
    invoiceNumber: 'INV-2024-010',
    issueDate: new Date('2024-03-08'),
    dueDate: new Date('2024-04-07'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili10',
        invoiceId: 'inv10',
        productId: 'p10',
        quantity: 1,
        unitPrice: 32.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 32.00 + 2.56
      } as InvoiceLineItem
    ],
    subtotal: 32.00,
    taxAmount: 2.56,
    total: 34.56,
    paidAmount: 34.56,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-03-08')
  },
  {
    id: 'inv11',
    clientId: 'c12',
    invoiceNumber: 'INV-2024-011',
    issueDate: new Date('2024-03-15'),
    dueDate: new Date('2024-04-14'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili11',
        invoiceId: 'inv11',
        productId: 'p11',
        quantity: 3,
        unitPrice: 5.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 15.00 + 1.20
      } as InvoiceLineItem
    ],
    subtotal: 15.00,
    taxAmount: 1.20,
    total: 16.20,
    paidAmount: 16.20,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15')
  },
  {
    id: 'inv12',
    clientId: 'c13',
    invoiceNumber: 'INV-2024-012',
    issueDate: new Date('2024-03-20'),
    dueDate: new Date('2024-04-19'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili12',
        invoiceId: 'inv12',
        productId: 'p14',
        quantity: 1,
        unitPrice: 38.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 38.00 + 3.04
      } as InvoiceLineItem
    ],
    subtotal: 38.00,
    taxAmount: 3.04,
    total: 41.04,
    paidAmount: 41.04,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  },
  {
    id: 'inv13',
    clientId: 'c14',
    invoiceNumber: 'INV-2024-013',
    issueDate: new Date('2024-03-25'),
    dueDate: new Date('2024-04-24'),
    status: 'partial',
    lineItems: [
      {
        id: 'ili13',
        invoiceId: 'inv13',
        productId: 'p15',
        quantity: 2,
        unitPrice: 12.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 25.00 + 2.00
      } as InvoiceLineItem
    ],
    subtotal: 25.00,
    taxAmount: 2.00,
    total: 27.00,
    paidAmount: 14.50,
    balanceDue: 12.50,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-03-25'),
    updatedAt: new Date('2024-03-25')
  },
  {
    id: 'inv14',
    clientId: 'c16',
    invoiceNumber: 'INV-2024-014',
    issueDate: new Date('2024-04-01'),
    dueDate: new Date('2024-05-01'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili14',
        invoiceId: 'inv14',
        productId: 'p16',
        quantity: 1,
        unitPrice: 9.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 9.99 + 0.80
      } as InvoiceLineItem
    ],
    subtotal: 9.99,
    taxAmount: 0.80,
    total: 10.79,
    paidAmount: 10.79,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01')
  },
  {
    id: 'inv15',
    clientId: 'c17',
    invoiceNumber: 'INV-2024-015',
    issueDate: new Date('2024-04-08'),
    dueDate: new Date('2024-05-08'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili15',
        invoiceId: 'inv15',
        productId: 'p17',
        quantity: 1,
        unitPrice: 29.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 29.99 + 2.40
      } as InvoiceLineItem
    ],
    subtotal: 29.99,
    taxAmount: 2.40,
    total: 32.39,
    paidAmount: 32.39,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-04-08'),
    updatedAt: new Date('2024-04-08')
  },
  {
    id: 'inv16',
    clientId: 'c18',
    invoiceNumber: 'INV-2024-016',
    issueDate: new Date('2024-04-15'),
    dueDate: new Date('2024-05-15'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili16',
        invoiceId: 'inv16',
        productId: 'p18',
        quantity: 1,
        unitPrice: 28.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 28.00 + 2.24
      } as InvoiceLineItem
    ],
    subtotal: 28.00,
    taxAmount: 2.24,
    total: 30.24,
    paidAmount: 30.24,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-04-15')
  },
  {
    id: 'inv17',
    clientId: 'c19',
    invoiceNumber: 'INV-2024-017',
    issueDate: new Date('2024-04-20'),
    dueDate: new Date('2024-05-20'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili17',
        invoiceId: 'inv17',
        productId: 'p1',
        quantity: 1,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 12.99 + 1.04
      } as InvoiceLineItem
    ],
    subtotal: 12.99,
    taxAmount: 1.04,
    total: 14.03,
    paidAmount: 14.03,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-04-20'),
    updatedAt: new Date('2024-04-20')
  },
  {
    id: 'inv18',
    clientId: 'c20',
    invoiceNumber: 'INV-2024-018',
    issueDate: new Date('2024-04-25'),
    dueDate: new Date('2024-05-25'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili18',
        invoiceId: 'inv18',
        productId: 'p19',
        quantity: 1,
        unitPrice: 14.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 14.99 + 1.20
      } as InvoiceLineItem
    ],
    subtotal: 14.99,
    taxAmount: 1.20,
    total: 16.19,
    paidAmount: 16.19,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-04-25'),
    updatedAt: new Date('2024-04-25')
  },
  {
    id: 'inv19',
    clientId: 'c10',
    invoiceNumber: 'INV-2024-019',
    issueDate: new Date('2024-05-01'),
    dueDate: new Date('2024-05-31'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili19',
        invoiceId: 'inv19',
        productId: 'p1',
        quantity: 2,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 25.98 + 2.08
      } as InvoiceLineItem
    ],
    subtotal: 25.98,
    taxAmount: 2.08,
    total: 28.06,
    paidAmount: 28.06,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-01')
  },
  {
    id: 'inv20',
    clientId: 'c21',
    invoiceNumber: 'INV-2024-020',
    issueDate: new Date('2024-05-08'),
    dueDate: new Date('2024-06-07'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili20',
        invoiceId: 'inv20',
        productId: 'p9',
        quantity: 1,
        unitPrice: 7.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 7.50 + 0.60
      } as InvoiceLineItem
    ],
    subtotal: 7.50,
    taxAmount: 0.60,
    total: 8.10,
    paidAmount: 8.10,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-05-08'),
    updatedAt: new Date('2024-05-08')
  },
  {
    id: 'inv21',
    clientId: 'c22',
    invoiceNumber: 'INV-2024-021',
    issueDate: new Date('2024-05-15'),
    dueDate: new Date('2024-06-14'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili21',
        invoiceId: 'inv21',
        productId: 'p9',
        quantity: 2,
        unitPrice: 7.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 15.00 + 1.20
      } as InvoiceLineItem
    ],
    subtotal: 15.00,
    taxAmount: 1.20,
    total: 16.20,
    paidAmount: 16.20,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-05-15')
  },
  {
    id: 'inv22',
    clientId: 'c23',
    invoiceNumber: 'INV-2024-022',
    issueDate: new Date('2024-05-20'),
    dueDate: new Date('2024-06-19'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili22',
        invoiceId: 'inv22',
        productId: 'p6',
        quantity: 1,
        unitPrice: 22.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 22.00 + 1.76
      } as InvoiceLineItem
    ],
    subtotal: 22.00,
    taxAmount: 1.76,
    total: 23.76,
    paidAmount: 23.76,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-05-20')
  },
  {
    id: 'inv23',
    clientId: 'c24',
    invoiceNumber: 'INV-2024-023',
    issueDate: new Date('2024-05-25'),
    dueDate: new Date('2024-06-24'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili23',
        invoiceId: 'inv23',
        productId: 'p13',
        quantity: 1,
        unitPrice: 24.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 24.99 + 2.00
      } as InvoiceLineItem
    ],
    subtotal: 24.99,
    taxAmount: 2.00,
    total: 26.99,
    paidAmount: 26.99,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-05-25'),
    updatedAt: new Date('2024-05-25')
  },
  {
    id: 'inv24',
    clientId: 'c2',
    invoiceNumber: 'INV-2024-024',
    issueDate: new Date('2024-06-01'),
    dueDate: new Date('2024-07-01'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili24',
        invoiceId: 'inv24',
        productId: 'p1',
        quantity: 1,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 12.99 + 1.04
      } as InvoiceLineItem
    ],
    subtotal: 12.99,
    taxAmount: 1.04,
    total: 14.03,
    paidAmount: 14.03,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01')
  },
  {
    id: 'inv25',
    clientId: 'c12',
    invoiceNumber: 'INV-2024-025',
    issueDate: new Date('2024-06-08'),
    dueDate: new Date('2024-07-08'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili25',
        invoiceId: 'inv25',
        productId: 'p13',
        quantity: 1,
        unitPrice: 24.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 24.99 + 2.00
      } as InvoiceLineItem
    ],
    subtotal: 24.99,
    taxAmount: 2.00,
    total: 26.99,
    paidAmount: 26.99,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-06-08'),
    updatedAt: new Date('2024-06-08')
  },
  {
    id: 'inv26',
    clientId: 'c11',
    invoiceNumber: 'INV-2024-026',
    issueDate: new Date('2024-06-15'),
    dueDate: new Date('2024-07-15'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili26',
        invoiceId: 'inv26',
        productId: 'p4',
        quantity: 1,
        unitPrice: 10.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 10.50 + 0.84
      } as InvoiceLineItem
    ],
    subtotal: 10.50,
    taxAmount: 0.84,
    total: 11.34,
    paidAmount: 11.34,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-06-15')
  },
  {
    id: 'inv27',
    clientId: 'c15',
    invoiceNumber: 'INV-2024-027',
    issueDate: new Date('2024-06-20'),
    dueDate: new Date('2024-07-20'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili27',
        invoiceId: 'inv27',
        productId: 'p3',
        quantity: 1,
        unitPrice: 24.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 24.99 + 2.00
      } as InvoiceLineItem
    ],
    subtotal: 24.99,
    taxAmount: 2.00,
    total: 26.99,
    paidAmount: 26.99,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-20')
  },
  {
    id: 'inv28',
    clientId: 'c8',
    invoiceNumber: 'INV-2024-028',
    issueDate: new Date('2024-06-20'),
    dueDate: new Date('2024-07-20'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili28',
        invoiceId: 'inv28',
        productId: 'p9',
        quantity: 1,
        unitPrice: 7.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 7.50 + 0.60
      } as InvoiceLineItem
    ],
    subtotal: 7.50,
    taxAmount: 0.60,
    total: 8.10,
    paidAmount: 8.10,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-20')
  },
  {
    id: 'inv29',
    clientId: 'c4',
    invoiceNumber: 'INV-2024-029',
    issueDate: new Date('2024-07-01'),
    dueDate: new Date('2024-07-31'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili29',
        invoiceId: 'inv29',
        productId: 'p1',
        quantity: 6,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 77.94 + 6.24
      } as InvoiceLineItem
    ],
    subtotal: 77.94,
    taxAmount: 6.24,
    total: 84.18,
    paidAmount: 84.18,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-07-01')
  },
  {
    id: 'inv30',
    clientId: 'c14',
    invoiceNumber: 'INV-2024-030',
    issueDate: new Date('2024-07-08'),
    dueDate: new Date('2024-08-07'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili30',
        invoiceId: 'inv30',
        productId: 'p10',
        quantity: 1,
        unitPrice: 32.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 32.00 + 2.56
      } as InvoiceLineItem
    ],
    subtotal: 32.00,
    taxAmount: 2.56,
    total: 34.56,
    paidAmount: 34.56,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-07-08'),
    updatedAt: new Date('2024-07-08')
  },
  {
    id: 'inv31',
    clientId: 'c13',
    invoiceNumber: 'INV-2024-031',
    issueDate: new Date('2024-07-15'),
    dueDate: new Date('2024-08-14'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili31',
        invoiceId: 'inv31',
        productId: 'p11',
        quantity: 1,
        unitPrice: 5.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 5.00 + 0.40
      } as InvoiceLineItem
    ],
    subtotal: 5.00,
    taxAmount: 0.40,
    total: 5.40,
    paidAmount: 5.40,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date('2024-07-15')
  },
  {
    id: 'inv32',
    clientId: 'c16',
    invoiceNumber: 'INV-2024-032',
    issueDate: new Date('2024-07-20'),
    dueDate: new Date('2024-08-19'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili32',
        invoiceId: 'inv32',
        productId: 'p14',
        quantity: 1,
        unitPrice: 38.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 38.00 + 3.04
      } as InvoiceLineItem
    ],
    subtotal: 38.00,
    taxAmount: 3.04,
    total: 41.04,
    paidAmount: 41.04,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-07-20'),
    updatedAt: new Date('2024-07-20')
  },
  {
    id: 'inv33',
    clientId: 'c7',
    invoiceNumber: 'INV-2024-033',
    issueDate: new Date('2024-07-25'),
    dueDate: new Date('2024-08-24'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili33',
        invoiceId: 'inv33',
        productId: 'p15',
        quantity: 1,
        unitPrice: 12.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 12.50 + 1.00
      } as InvoiceLineItem
    ],
    subtotal: 12.50,
    taxAmount: 1.00,
    total: 13.50,
    paidAmount: 13.50,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-07-25'),
    updatedAt: new Date('2024-07-25')
  },
  {
    id: 'inv34',
    clientId: 'c9',
    invoiceNumber: 'INV-2024-034',
    issueDate: new Date('2024-08-01'),
    dueDate: new Date('2024-08-31'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili34',
        invoiceId: 'inv34',
        productId: 'p16',
        quantity: 1,
        unitPrice: 9.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 9.99 + 0.80
      } as InvoiceLineItem
    ],
    subtotal: 9.99,
    taxAmount: 0.80,
    total: 10.79,
    paidAmount: 10.79,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-08-01')
  },
  {
    id: 'inv35',
    clientId: 'c10',
    invoiceNumber: 'INV-2024-035',
    issueDate: new Date('2024-08-08'),
    dueDate: new Date('2024-09-07'),
    status: 'paid',
    lineItems: [
      {
        id: 'ili35',
        invoiceId: 'inv35',
        productId: 'p1',
        quantity: 1,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 12.99 + 1.04
      } as InvoiceLineItem
    ],
    subtotal: 12.99,
    taxAmount: 1.04,
    total: 14.03,
    paidAmount: 14.03,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ' ',
    createdAt: new Date('2024-08-08'),
    updatedAt: new Date('2024-08-08')
  }
]