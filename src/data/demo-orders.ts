import { Order } from '../lib/database'
import { OrderLineItem } from '../lib/database'
import { Product } from '../lib/database'
import { Client } from '../lib/database'
import { demoProducts, demoClients } from './'

export const demoOrders: Order[] = [
  {
    id: 'o1',
    clientId: 'c1',
    orderDate: new Date('2024-01-15'),
    dueDate: new Date('2024-01-22'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli1',
        orderId: 'o1',
        productId: 'p1',
        quantity: 2,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 25.98 + 2.08
      } as OrderLineItem
    ],
    subtotal: 25.98,
    taxAmount: 2.08,
    total: 28.06,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'o2',
    clientId: 'c2',
    orderDate: new Date('2024-01-20'),
    dueDate: new Date('2024-01-27'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli2',
        orderId: 'o2',
        productId: 'p2',
        quantity: 1,
        unitPrice: 18.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 18.99 + 1.52
      } as OrderLineItem
    ],
    subtotal: 18.99,
    taxAmount: 1.52,
    total: 20.51,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'o3',
    clientId: 'c3',
    orderDate: new Date('2024-01-25'),
    dueDate: new Date('2024-02-01'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli3',
        orderId: 'o3',
        productId: 'p3',
        quantity: 1,
        unitPrice: 24.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 24.99 + 2.00
      } as OrderLineItem
    ],
    subtotal: 24.99,
    taxAmount: 2.00,
    total: 26.99,
    paymentStatus: 'partial',
    notes: ' ',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: 'o4',
    clientId: 'c4',
    orderDate: new Date('2024-02-01'),
    dueDate: new Date('2024-02-08'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli4',
        orderId: 'o4',
        productId: 'p4',
        quantity: 3,
        unitPrice: 10.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 31.50 + 2.52
      } as OrderLineItem
    ],
    subtotal: 31.50,
    taxAmount: 2.52,
    total: 34.02,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'o5',
    clientId: 'c5',
    orderDate: new Date('2024-02-08'),
    dueDate: new Date('2024-02-15'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli5',
        orderId: 'o5',
        productId: 'p5',
        quantity: 2,
        unitPrice: 14.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 29.98 + 2.40
      } as OrderLineItem
    ],
    subtotal: 29.98,
    taxAmount: 2.40,
    total: 32.38,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-08')
  },
  {
    id: 'o6',
    clientId: 'c6',
    orderDate: new Date('2024-02-15'),
    dueDate: new Date('2024-02-22'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli6',
        orderId: 'o6',
        productId: 'p1',
        quantity: 3,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 38.97 + 3.12
      } as OrderLineItem
    ],
    subtotal: 38.97,
    taxAmount: 3.12,
    total: 42.09,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: 'o7',
    clientId: 'c7',
    orderDate: new Date('2024-02-20'),
    dueDate: new Date('2024-02-27'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli7',
        orderId: 'o7',
        productId: 'p7',
        quantity: 1,
        unitPrice: 28.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 28.00 + 2.24
      } as OrderLineItem
    ],
    subtotal: 28.00,
    taxAmount: 2.24,
    total: 30.24,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20')
  },
  {
    id: 'o8',
    clientId: 'c8',
    orderDate: new Date('2024-02-25'),
    dueDate: new Date('2024-03-04'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli8',
        orderId: 'o8',
        productId: 'p8',
        quantity: 2,
        unitPrice: 16.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 33.98 + 2.72
      } as OrderLineItem
    ],
    subtotal: 33.98,
    taxAmount: 2.72,
    total: 36.70,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-02-25')
  },
  {
    id: 'o9',
    clientId: 'c4',
    orderDate: new Date('2024-03-01'),
    dueDate: new Date('2024-03-08'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli9',
        orderId: 'o9',
        productId: 'p1',
        quantity: 4,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 51.96 + 4.16
      } as OrderLineItem
    ],
    subtotal: 51.96,
    taxAmount: 4.16,
    total: 56.12,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: 'o10',
    clientId: 'c11',
    orderDate: new Date('2024-03-08'),
    dueDate: new Date('2024-03-15'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli10',
        orderId: 'o10',
        productId: 'p10',
        quantity: 1,
        unitPrice: 32.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 32.00 + 2.56
      } as OrderLineItem
    ],
    subtotal: 32.00,
    taxAmount: 2.56,
    total: 34.56,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-03-08')
  },
  {
    id: 'o11',
    clientId: 'c12',
    orderDate: new Date('2024-03-15'),
    dueDate: new Date('2024-03-22'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli11',
        orderId: 'o11',
        productId: 'p11',
        quantity: 3,
        unitPrice: 5.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 15.00 + 1.20
      } as OrderLineItem
    ],
    subtotal: 15.00,
    taxAmount: 1.20,
    total: 16.20,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15')
  },
  {
    id: 'o12',
    clientId: 'c13',
    orderDate: new Date('2024-03-20'),
    dueDate: new Date('2024-03-27'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli12',
        orderId: 'o12',
        productId: 'p14',
        quantity: 1,
        unitPrice: 38.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 38.00 + 3.04
      } as OrderLineItem
    ],
    subtotal: 38.00,
    taxAmount: 3.04,
    total: 41.04,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  },
  {
    id: 'o13',
    clientId: 'c14',
    orderDate: new Date('2024-03-25'),
    dueDate: new Date('2024-04-01'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli13',
        orderId: 'o13',
        productId: 'p15',
        quantity: 2,
        unitPrice: 12.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 25.00 + 2.00
      } as OrderLineItem
    ],
    subtotal: 25.00,
    taxAmount: 2.00,
    total: 27.00,
    paymentStatus: 'partial',
    notes: ' ',
    createdAt: new Date('2024-03-25'),
    updatedAt: new Date('2024-03-25')
  },
  {
    id: 'o14',
    clientId: 'c16',
    orderDate: new Date('2024-04-01'),
    dueDate: new Date('2024-04-08'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli14',
        orderId: 'o14',
        productId: 'p16',
        quantity: 1,
        unitPrice: 9.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 9.99 + 0.80
      } as OrderLineItem
    ],
    subtotal: 9.99,
    taxAmount: 0.80,
    total: 10.79,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01')
  },
  {
    id: 'o15',
    clientId: 'c17',
    orderDate: new Date('2024-04-08'),
    dueDate: new Date('2024-04-15'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli15',
        orderId: 'o15',
        productId: 'p17',
        quantity: 1,
        unitPrice: 29.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 29.99 + 2.40
      } as OrderLineItem
    ],
    subtotal: 29.99,
    taxAmount: 2.40,
    total: 32.39,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-04-08'),
    updatedAt: new Date('2024-04-08')
  },
  {
    id: 'o16',
    clientId: 'c18',
    orderDate: new Date('2024-04-15'),
    dueDate: new Date('2024-04-22'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli16',
        orderId: 'o16',
        productId: 'p18',
        quantity: 1,
        unitPrice: 28.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 28.00 + 2.24
      } as OrderLineItem
    ],
    subtotal: 28.00,
    taxAmount: 2.24,
    total: 30.24,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-04-15')
  },
  {
    id: 'o17',
    clientId: 'c19',
    orderDate: new Date('2024-04-20'),
    dueDate: new Date('2024-04-27'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli17',
        orderId: 'o17',
        productId: 'p1',
        quantity: 1,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 12.99 + 1.04
      } as OrderLineItem
    ],
    subtotal: 12.99,
    taxAmount: 1.04,
    total: 14.03,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-04-20'),
    updatedAt: new Date('2024-04-20')
  },
  {
    id: 'o18',
    clientId: 'c20',
    orderDate: new Date('2024-04-25'),
    dueDate: new Date('2024-05-02'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli18',
        orderId: 'o18',
        productId: 'p19',
        quantity: 1,
        unitPrice: 14.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 14.99 + 1.20
      } as OrderLineItem
    ],
    subtotal: 14.99,
    taxAmount: 1.20,
    total: 16.19,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-04-25'),
    updatedAt: new Date('2024-04-25')
  },
  {
    id: 'o19',
    clientId: 'c10',
    orderDate: new Date('2024-05-01'),
    dueDate: new Date('2024-05-08'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli19',
        orderId: 'o19',
        productId: 'p1',
        quantity: 2,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 25.98 + 2.08
      } as OrderLineItem
    ],
    subtotal: 25.98,
    taxAmount: 2.08,
    total: 28.06,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-01')
  },
  {
    id: 'o20',
    clientId: 'c21',
    orderDate: new Date('2024-05-08'),
    dueDate: new Date('2024-05-15'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli20',
        orderId: 'o20',
        productId: 'p9',
        quantity: 1,
        unitPrice: 7.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 7.50 + 0.60
      } as OrderLineItem
    ],
    subtotal: 7.50,
    taxAmount: 0.60,
    total: 8.10,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-05-08'),
    updatedAt: new Date('2024-05-08')
  },
  {
    id: 'o21',
    clientId: 'c22',
    orderDate: new Date('2024-05-15'),
    dueDate: new Date('2024-05-22'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli21',
        orderId: 'o21',
        productId: 'p9',
        quantity: 2,
        unitPrice: 7.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 15.00 + 1.20
      } as OrderLineItem
    ],
    subtotal: 15.00,
    taxAmount: 1.20,
    total: 16.20,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-05-15')
  },
  {
    id: 'o22',
    clientId: 'c23',
    orderDate: new Date('2024-05-20'),
    dueDate: new Date('2024-05-27'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli22',
        orderId: 'o22',
        productId: 'p6',
        quantity: 1,
        unitPrice: 22.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 22.00 + 1.76
      } as OrderLineItem
    ],
    subtotal: 22.00,
    taxAmount: 1.76,
    total: 23.76,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-05-20')
  },
  {
    id: 'o23',
    clientId: 'c24',
    orderDate: new Date('2024-05-25'),
    dueDate: new Date('2024-06-01'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli23',
        orderId: 'o23',
        productId: 'p13',
        quantity: 1,
        unitPrice: 24.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 24.99 + 2.00
      } as OrderLineItem
    ],
    subtotal: 24.99,
    taxAmount: 2.00,
    total: 26.99,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-05-25'),
    updatedAt: new Date('2024-05-25')
  },
  {
    id: 'o24',
    clientId: 'c2',
    orderDate: new Date('2024-06-01'),
    dueDate: new Date('2024-06-08'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli24',
        orderId: 'o24',
        productId: 'p1',
        quantity: 1,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 12.99 + 1.04
      } as OrderLineItem
    ],
    subtotal: 12.99,
    taxAmount: 1.04,
    total: 14.03,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01')
  },
  {
    id: 'o25',
    clientId: 'c12',
    orderDate: new Date('2024-06-08'),
    dueDate: new Date('2024-06-15'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli25',
        orderId: 'o25',
        productId: 'p13',
        quantity: 1,
        unitPrice: 24.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 24.99 + 2.00
      } as OrderLineItem
    ],
    subtotal: 24.99,
    taxAmount: 2.00,
    total: 26.99,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-06-08'),
    updatedAt: new Date('2024-06-08')
  },
  {
    id: 'o26',
    clientId: 'c11',
    orderDate: new Date('2024-06-15'),
    dueDate: new Date('2024-06-22'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli26',
        orderId: 'o26',
        productId: 'p4',
        quantity: 1,
        unitPrice: 10.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 10.50 + 0.84
      } as OrderLineItem
    ],
    subtotal: 10.50,
    taxAmount: 0.84,
    total: 11.34,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-06-15')
  },
  {
    id: 'o27',
    clientId: 'c15',
    orderDate: new Date('2024-06-20'),
    dueDate: new Date('2024-06-27'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli27',
        orderId: 'o27',
        productId: 'p3',
        quantity: 1,
        unitPrice: 24.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 24.99 + 2.00
      } as OrderLineItem
    ],
    subtotal: 24.99,
    taxAmount: 2.00,
    total: 26.99,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-20')
  },
  {
    id: 'o28',
    clientId: 'c8',
    orderDate: new Date('2024-06-20'),
    dueDate: new Date('2024-06-27'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli28',
        orderId: 'o28',
        productId: 'p9',
        quantity: 1,
        unitPrice: 7.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 7.50 + 0.60
      } as OrderLineItem
    ],
    subtotal: 7.50,
    taxAmount: 0.60,
    total: 8.10,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-20')
  },
  {
    id: 'o29',
    clientId: 'c4',
    orderDate: new Date('2024-07-01'),
    dueDate: new Date('2024-07-08'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli29',
        orderId: 'o29',
        productId: 'p1',
        quantity: 6,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 77.94 + 6.24
      } as OrderLineItem
    ],
    subtotal: 77.94,
    taxAmount: 6.24,
    total: 84.18,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-07-01')
  },
  {
    id: 'o30',
    clientId: 'c14',
    orderDate: new Date('2024-07-08'),
    dueDate: new Date('2024-07-15'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli30',
        orderId: 'o30',
        productId: 'p10',
        quantity: 1,
        unitPrice: 32.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 32.00 + 2.56
      } as OrderLineItem
    ],
    subtotal: 32.00,
    taxAmount: 2.56,
    total: 34.56,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-07-08'),
    updatedAt: new Date('2024-07-08')
  },
  {
    id: 'o31',
    clientId: 'c13',
    orderDate: new Date('2024-07-15'),
    dueDate: new Date('2024-07-22'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli31',
        orderId: 'o31',
        productId: 'p11',
        quantity: 1,
        unitPrice: 5.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 5.00 + 0.40
      } as OrderLineItem
    ],
    subtotal: 5.00,
    taxAmount: 0.40,
    total: 5.40,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date('2024-07-15')
  },
  {
    id: 'o32',
    clientId: 'c16',
    orderDate: new Date('2024-07-20'),
    dueDate: new Date('2024-07-27'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli32',
        orderId: 'o32',
        productId: 'p14',
        quantity: 1,
        unitPrice: 38.00,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 38.00 + 3.04
      } as OrderLineItem
    ],
    subtotal: 38.00,
    taxAmount: 3.04,
    total: 41.04,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-07-20'),
    updatedAt: new Date('2024-07-20')
  },
  {
    id: 'o33',
    clientId: 'c7',
    orderDate: new Date('2024-07-25'),
    dueDate: new Date('2024-08-01'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli33',
        orderId: 'o33',
        productId: 'p15',
        quantity: 1,
        unitPrice: 12.50,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 12.50 + 1.00
      } as OrderLineItem
    ],
    subtotal: 12.50,
    taxAmount: 1.00,
    total: 13.50,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-07-25'),
    updatedAt: new Date('2024-07-25')
  },
  {
    id: 'o34',
    clientId: 'c9',
    orderDate: new Date('2024-08-01'),
    dueDate: new Date('2024-08-08'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli34',
        orderId: 'o34',
        productId: 'p16',
        quantity: 1,
        unitPrice: 9.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 9.99 + 0.80
      } as OrderLineItem
    ],
    subtotal: 9.99,
    taxAmount: 0.80,
    total: 10.79,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-08-01')
  },
  {
    id: 'o35',
    clientId: 'c10',
    orderDate: new Date('2024-08-08'),
    dueDate: new Date('2024-08-15'),
    status: 'completed',
    lineItems: [
      {
        id: 'oli35',
        orderId: 'o35',
        productId: 'p1',
        quantity: 1,
        unitPrice: 12.99,
        discount: 0,
        taxRate: 0.08,
        totalPrice: 12.99 + 1.04
      } as OrderLineItem
    ],
    subtotal: 12.99,
    taxAmount: 1.04,
    total: 14.03,
    paymentStatus: 'paid',
    notes: ' ',
    createdAt: new Date('2024-08-08'),
    updatedAt: new Date('2024-08-08')
  }
]

// Add order line items with proper references
export const demoOrderLineItems: OrderLineItem[] = [
  {
    id: 'oli1',
    orderId: 'o1',
    productId: 'p1',
    quantity: 2,
    unitPrice: 12.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 25.98 + 2.08
  },
  {
    id: 'oli2',
    orderId: 'o2',
    productId: 'p2',
    quantity: 1,
    unitPrice: 18.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 18.99 + 1.52
  },
  {
    id: 'oli3',
    orderId: 'o3',
    productId: 'p3',
    quantity: 1,
    unitPrice: 24.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 24.99 + 2.00
  },
  {
    id: 'oli4',
    orderId: 'o4',
    productId: 'p4',
    quantity: 3,
    unitPrice: 10.50,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 31.50 + 2.52
  },
  {
    id: 'oli5',
    orderId: 'o5',
    productId: 'p5',
    quantity: 2,
    unitPrice: 14.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 29.98 + 2.40
  },
  {
    id: 'oli6',
    orderId: 'o6',
    productId: 'p1',
    quantity: 3,
    unitPrice: 12.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 38.97 + 3.12
  },
  {
    id: 'oli7',
    orderId: 'o7',
    productId: 'p7',
    quantity: 1,
    unitPrice: 28.00,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 28.00 + 2.24
  },
  {
    id: 'oli8',
    orderId: 'o8',
    productId: 'p8',
    quantity: 2,
    unitPrice: 16.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 33.98 + 2.72
  },
  {
    id: 'oli9',
    orderId: 'o9',
    productId: 'p1',
    quantity: 4,
    unitPrice: 12.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 51.96 + 4.16
  },
  {
    id: 'oli10',
    orderId: 'o10',
    productId: 'p10',
    quantity: 1,
    unitPrice: 32.00,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 32.00 + 2.56
  },
  {
    id: 'oli11',
    orderId: 'o11',
    productId: 'p11',
    quantity: 3,
    unitPrice: 5.00,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 15.00 + 1.20
  },
  {
    id: 'oli12',
    orderId: 'o12',
    productId: 'p14',
    quantity: 1,
    unitPrice: 38.00,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 38.00 + 3.04
  },
  {
    id: 'oli13',
    orderId: 'o13',
    productId: 'p15',
    quantity: 2,
    unitPrice: 12.50,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 25.00 + 2.00
  },
  {
    id: 'oli14',
    orderId: 'o14',
    productId: 'p16',
    quantity: 1,
    unitPrice: 9.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 9.99 + 0.80
  },
  {
    id: 'oli15',
    orderId: 'o15',
    productId: 'p17',
    quantity: 1,
    unitPrice: 29.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 29.99 + 2.40
  },
  {
    id: 'oli16',
    orderId: 'o16',
    productId: 'p18',
    quantity: 1,
    unitPrice: 28.00,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 28.00 + 2.24
  },
  {
    id: 'oli17',
    orderId: 'o17',
    productId: 'p1',
    quantity: 1,
    unitPrice: 12.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 12.99 + 1.04
  },
  {
    id: 'oli18',
    orderId: 'o18',
    productId: 'p19',
    quantity: 1,
    unitPrice: 14.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 14.99 + 1.20
  },
  {
    id: 'oli19',
    orderId: 'o19',
    productId: 'p1',
    quantity: 2,
    unitPrice: 12.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 25.98 + 2.08
  },
  {
    id: 'oli20',
    orderId: 'o20',
    productId: 'p9',
    quantity: 1,
    unitPrice: 7.50,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 7.50 + 0.60
  },
  {
    id: 'oli21',
    orderId: 'o21',
    productId: 'p9',
    quantity: 2,
    unitPrice: 7.50,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 15.00 + 1.20
  },
  {
    id: 'oli22',
    orderId: 'o22',
    productId: 'p6',
    quantity: 1,
    unitPrice: 22.00,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 22.00 + 1.76
  },
  {
    id: 'oli23',
    orderId: 'o23',
    productId: 'p13',
    quantity: 1,
    unitPrice: 24.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 24.99 + 2.00
  },
  {
    id: 'oli24',
    orderId: 'o24',
    productId: 'p1',
    quantity: 1,
    unitPrice: 12.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 12.99 + 1.04
  },
  {
    id: 'oli25',
    orderId: 'o25',
    productId: 'p13',
    quantity: 1,
    unitPrice: 24.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 24.99 + 2.00
  },
  {
    id: 'oli26',
    orderId: 'o26',
    productId: 'p4',
    quantity: 1,
    unitPrice: 10.50,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 10.50 + 0.84
  },
  {
    id: 'oli27',
    orderId: 'o27',
    productId: 'p3',
    quantity: 1,
    unitPrice: 24.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 24.99 + 2.00
  },
  {
    id: 'oli28',
    orderId: 'o28',
    productId: 'p9',
    quantity: 1,
    unitPrice: 7.50,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 7.50 + 0.60
  },
  {
    id: 'oli29',
    orderId: 'o29',
    productId: 'p1',
    quantity: 6,
    unitPrice: 12.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 77.94 + 6.24
  },
  {
    id: 'oli30',
    orderId: 'o30',
    productId: 'p10',
    quantity: 1,
    unitPrice: 32.00,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 32.00 + 2.56
  },
  {
    id: 'oli31',
    orderId: 'o31',
    productId: 'p11',
    quantity: 1,
    unitPrice: 5.00,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 5.00 + 0.40
  },
  {
    id: 'oli32',
    orderId: 'o32',
    productId: 'p14',
    quantity: 1,
    unitPrice: 38.00,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 38.00 + 3.04
  },
  {
    id: 'oli33',
    orderId: 'o33',
    productId: 'p15',
    quantity: 1,
    unitPrice: 12.50,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 12.50 + 1.00
  },
  {
    id: 'oli34',
    orderId: 'o34',
    productId: 'p16',
    quantity: 1,
    unitPrice: 9.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 9.99 + 0.80
  },
  {
    id: 'oli35',
    orderId: 'o35',
    productId: 'p1',
    quantity: 1,
    unitPrice: 12.99,
    discount: 0,
    taxRate: 0.08,
    totalPrice: 12.99 + 1.04
  }
]