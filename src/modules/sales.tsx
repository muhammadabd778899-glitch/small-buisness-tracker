import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Wallet
} from 'lucide-react'
import type {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  Quote,
  QuoteItem,
  QuoteStatus,
  Refund
} from '../lib/types'
import { useApp } from '../store/app'
import { useData, usePeriod, useQuickCreate } from '../components/hooks'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Field,
  FormGrid,
  IconButton,
  KpiCard,
  Modal,
  PageHeader,
  PageTabs,
  PeriodPicker,
  SectionTitle,
  StatusBadge
} from '../components/ui'
import type { LineDraft } from '../components/line-items'
import { LineItemsEditor } from '../components/line-items'
import {
  computeTotals,
  invoiceBalance,
  nextDocumentNumber,
  orderItemCount
} from '../lib/calc'
import { formatCurrency, round2, sumBy } from '../lib/money'
import { addDays, formatDate, todayISO } from '../lib/dates'
import { exportCSV } from '../lib/csv'
import { nowISO, recomputeStock, uid } from '../lib/db'
import { downloadInvoicePdf, downloadQuotePdf } from '../lib/pdf'
import { PAYMENT_METHODS } from './finance'

const TABS = [
  { label: 'Orders', to: '/sales/orders' },
  { label: 'Quotes', to: '/sales/quotes' },
  { label: 'Invoices', to: '/sales/invoices' },
  { label: 'Payments & refunds', to: '/sales/payments' }
]

const ORDER_STATUSES: OrderStatus[] = ['draft', 'confirmed', 'in-progress', 'ready', 'completed', 'cancelled']
const QUOTE_STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted', 'declined', 'expired', 'converted']
const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'partial', 'paid', 'overdue', 'void']

function toDrafts<T extends { id: string; productId: string | null; description: string; quantity: number; unitPrice: number; discount: number; taxRate: number }>(
  items: T[]
): LineDraft[] {
  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
    taxRate: item.taxRate
  }))
}

function clientName(data: ReturnType<typeof useData>, clientId: string): string {
  return data.clients.find((client) => client.id === clientId)?.name || 'Unknown client'
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export function OrdersPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const log = useApp((state) => state.log)
  const notify = useApp((state) => state.notify)
  const period = usePeriod('last-12')
  const [status, setStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState<Order | null>(null)
  const [busy, setBusy] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  useQuickCreate(openCreate)

  const rows = useMemo(
    () =>
      data.orders
        .filter((order) => order.date >= period.start && order.date <= period.end)
        .filter((order) => status === 'all' || order.status === status)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.orders, period.start, period.end, status]
  )

  const periodOrders = data.orders.filter((order) => order.date >= period.start && order.date <= period.end)
  const open = periodOrders.filter((order) => ['confirmed', 'in-progress', 'ready'].includes(order.status))

  const deleteOrder = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      const items = data.orderItems.filter((item) => item.orderId === deleting.id)
      const saleMovements = data.inventoryMovements.filter(
        (movement) => movement.reference === deleting.id && movement.type === 'sale'
      )
      for (const movement of saleMovements) await remove('inventoryMovements', movement.id)
      for (const item of items) await remove('orderItems', item.id)
      await remove('orders', deleting.id)
      for (const productId of new Set(items.map((item) => item.productId).filter(Boolean))) {
        await recomputeStock('product', productId as string)
      }
      await useApp.getState().reload()
      await log('delete', `Deleted order ${deleting.number}`, 'Order', deleting.id)
      notify('Order deleted.', 'success')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'number',
      label: 'Order',
      sortValue: (row: Order) => row.number,
      render: (row: Order) => (
        <div>
          <p className="font-semibold">{row.number}</p>
          <p className="text-[11px] text-muted">{formatDate(row.date, data.settings.dateFormat)}</p>
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      sortValue: (row: Order) => clientName(data, row.clientId),
      render: (row: Order) => clientName(data, row.clientId)
    },
    {
      key: 'items',
      label: 'Items',
      render: (row: Order) => String(orderItemCount(data.orderItems.filter((item) => item.orderId === row.id)))
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Order) => <StatusBadge status={row.status} />
    },
    {
      key: 'fulfilment',
      label: 'Fulfilment',
      render: (row: Order) => <Badge tone={row.fulfilmentStatus === 'fulfilled' ? 'success' : row.fulfilmentStatus === 'partial' ? 'warning' : 'neutral'}>{row.fulfilmentStatus}</Badge>
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right' as const,
      sortValue: (row: Order) => row.total,
      render: (row: Order) => <span className="font-semibold">{formatCurrency(row.total, data.settings)}</span>
    },
    {
      key: 'actions',
      label: '',
      render: (row: Order) => {
        const invoice = data.invoices.find((item) => item.orderId === row.id && item.status !== 'void')
        return (
          <div className="table-actions">
            <Button
              small
              variant="ghost"
              disabled={Boolean(invoice)}
              title={invoice ? `Already invoiced as ${invoice.number}` : 'Create an invoice from this order'}
              onClick={() => void convertOrderToInvoice(row, data, notify, log)}
            >
              {invoice ? 'Invoiced' : 'Invoice'}
            </Button>
            <IconButton
              label="Edit order"
              onClick={() => {
                setEditing(row)
                setModalOpen(true)
              }}
            >
              <Pencil size={14} />
            </IconButton>
            <IconButton label="Delete order" onClick={() => setDeleting(row)}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        )
      }
    }
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Track work from first enquiry to delivery. Completing an order records the stock that left the studio."
        actions={
          <>
            <Button
              onClick={() => {
                exportCSV(`orders-${period.start}-to-${period.end}.csv`, rows, [
                  { key: 'number', label: 'Order', getValue: (row) => row.number },
                  { key: 'date', label: 'Date', getValue: (row) => row.date },
                  { key: 'client', label: 'Client', getValue: (row) => clientName(data, row.clientId) },
                  { key: 'status', label: 'Status', getValue: (row) => row.status },
                  { key: 'fulfilment', label: 'Fulfilment', getValue: (row) => row.fulfilmentStatus },
                  { key: 'payment', label: 'Payment status', getValue: (row) => row.paymentStatus },
                  { key: 'total', label: 'Total', getValue: (row) => row.total }
                ])
                void log('export', 'Exported orders CSV', 'Order')
              }}
            >
              <Download size={15} /> Export
            </Button>
            <Button variant="primary" onClick={openCreate}><Plus size={15} /> New order</Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Orders in period" value={String(periodOrders.length)} hint={period.label} />
        <KpiCard label="Open orders" value={String(open.length)} hint="Confirmed, in progress or ready" tone={open.length ? 'warning' : 'success'} />
        <KpiCard label="Order value" value={formatCurrency(sumBy(periodOrders.filter((order) => order.status !== 'cancelled'), (order) => order.total), data.settings)} />
        <KpiCard label="Completed" value={String(periodOrders.filter((order) => order.status === 'completed').length)} tone="success" />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <PeriodPicker kind={period.kind} start={period.start} end={period.end} onChange={period.onChange} />
          <div>
            <label className="label" htmlFor="order-status">Status</label>
            <select id="order-status" className="select min-w-[150px]" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((value) => (
                <option key={value} value={value}>{value.replace('-', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          searchable={(row) => `${row.number} ${clientName(data, row.clientId)} ${row.notes}`}
          emptyTitle="No orders in this period"
          emptyDescription="Create an order from a client request, or start from an accepted quote."
          emptyAction={<Button variant="primary" onClick={openCreate}><Plus size={15} /> New order</Button>}
        />
      </Card>

      <OrderModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete order?"
        message={`Order ${deleting?.number || ''} and its line items will be deleted. Any stock recorded when it completed will be returned to inventory. Linked invoices are kept.`}
        confirmLabel="Delete order"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={deleteOrder}
      />
    </div>
  )
}

async function convertOrderToInvoice(
  order: Order,
  data: ReturnType<typeof useData>,
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void,
  log: (type: 'create' | 'update' | 'delete' | 'transfer' | 'payment' | 'refund' | 'import' | 'export' | 'demo' | 'restore', message: string, entity: string, entityId?: string | null) => Promise<void>
) {
  const existing = data.invoices.find((invoice) => invoice.orderId === order.id && invoice.status !== 'void')
  if (existing) {
    notify(`This order is already invoiced as ${existing.number}.`, 'error')
    return
  }
  const number = await useApp.getState().allocateNumber('invoice')
  const today = todayISO()
  const items: InvoiceItem[] = data.orderItems
    .filter((item) => item.orderId === order.id)
    .map((item) => ({
      id: uid('ii'),
      invoiceId: 'pending',
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate
    }))
  if (order.delivery > 0) {
    items.push({
      id: uid('ii'),
      invoiceId: 'pending',
      productId: null,
      description: 'Delivery / shipping',
      quantity: 1,
      unitPrice: order.delivery,
      discount: 0,
      taxRate: 0
    })
  }
  const invoiceId = uid('invoice')
  const totals = computeTotals(items, order.discount, data.settings.taxInclusive)
  const invoice: Invoice = {
    id: invoiceId,
    number: number || nextDocumentNumber(data.settings, 'invoice'),
    clientId: order.clientId,
    orderId: order.id,
    quoteId: null,
    issueDate: today,
    dueDate: addDays(today, data.settings.defaultPaymentTerms),
    status: 'sent',
    subtotal: totals.subtotal,
    discount: totals.discount,
    taxAmount: totals.taxAmount,
    total: totals.total,
    notes: order.notes,
    terms: `Net ${data.settings.defaultPaymentTerms}`,
    createdAt: nowISO(),
    updatedAt: nowISO()
  }
  await useApp.getState().putMany('invoiceItems', items.map((item) => ({ ...item, invoiceId })))
  await useApp.getState().put('invoices', invoice)
  await log('create', `Created invoice ${invoice.number} from order ${order.number}`, 'Invoice', invoice.id)
  notify(`Invoice ${invoice.number} created from ${order.number}.`, 'success')
}

function OrderModal({ open, editing, onClose }: { open: boolean; editing: Order | null; onClose: () => void }) {
  const data = useData()
  const put = useApp((state) => state.put)
  const putMany = useApp((state) => state.putMany)
  const remove = useApp((state) => state.remove)
  const allocateNumber = useApp((state) => state.allocateNumber)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [dueDate, setDueDate] = useState(todayISO())
  const [status, setStatus] = useState<OrderStatus>('draft')
  const [fulfilmentStatus, setFulfilmentStatus] = useState<Order['fulfilmentStatus']>('unfulfilled')
  const [paymentStatus, setPaymentStatus] = useState<Order['paymentStatus']>('unpaid')
  const [discount, setDiscount] = useState(0)
  const [delivery, setDelivery] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setClientId(editing?.clientId || data.clients[0]?.id || '')
    setDate(editing?.date || todayISO())
    setDueDate(editing?.dueDate || addDays(todayISO(), data.settings.defaultPaymentTerms))
    setStatus(editing?.status || 'draft')
    setFulfilmentStatus(editing?.fulfilmentStatus || 'unfulfilled')
    setPaymentStatus(editing?.paymentStatus || 'unpaid')
    setDiscount(editing?.discount || 0)
    setDelivery(editing?.delivery || 0)
    setNotes(editing?.notes || '')
    setItems(
      editing
        ? toDrafts(data.orderItems.filter((item) => item.orderId === editing.id))
        : [
            {
              id: uid('line'),
              productId: data.products[0]?.id || null,
              description: data.products[0]?.name || '',
              quantity: 1,
              unitPrice: data.products[0]?.price || 0,
              discount: 0,
              taxRate: data.settings.defaultTaxRate
            }
          ]
    )
    setError(null)
  }, [open, editing, data])

  const save = async () => {
    if (!clientId) return setError('Choose a client for this order.')
    if (!items.length || items.every((item) => !item.description.trim())) {
      return setError('Add at least one line item with a description.')
    }
    setBusy(true)
    setError(null)
    try {
      const orderId = editing?.id || uid('order')
      const number = editing?.number || (await allocateNumber('order'))
      const totals = computeTotals(items, discount, data.settings.taxInclusive)
      const record: Order = {
        id: orderId,
        number,
        clientId,
        date,
        dueDate,
        status,
        fulfilmentStatus,
        paymentStatus,
        discount: totals.discount,
        taxAmount: totals.taxAmount,
        delivery: round2(Math.max(0, delivery)),
        total: round2(totals.total + Math.max(0, delivery)),
        notes,
        createdAt: editing?.createdAt || nowISO(),
        updatedAt: nowISO()
      }
      const lineRecords: OrderItem[] = items
        .filter((item) => item.description.trim())
        .map((item) => ({
          id: item.id,
          orderId,
          productId: item.productId,
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate
        }))

      if (editing) {
        for (const item of data.orderItems.filter((row) => row.orderId === editing.id)) {
          await remove('orderItems', item.id)
        }
      }
      await put('orders', record)
      await putMany('orderItems', lineRecords)

      await syncOrderStock(record, editing?.status, lineRecords, data)

      await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Created'} order ${record.number}`, 'Order', record.id)
      notify(editing ? 'Order updated.' : `Order ${record.number} created.`, 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Order could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? `Edit ${editing.number}` : 'New order'}
      description="Add products or custom lines. Marking an order completed removes its products from stock."
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save order' : 'Create order'}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <FormGrid columns={3}>
          <Field label="Client">
            <select className="select" value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Choose a client</option>
              {data.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Order date">
            <input type="date" className="input" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Due date">
            <input type="date" className="input" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </Field>
          <Field label="Status">
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)}>
              {ORDER_STATUSES.map((value) => <option key={value} value={value}>{value.replace('-', ' ')}</option>)}
            </select>
          </Field>
          <Field label="Fulfilment">
            <select className="select" value={fulfilmentStatus} onChange={(event) => setFulfilmentStatus(event.target.value as Order['fulfilmentStatus'])}>
              {['unfulfilled', 'partial', 'fulfilled'].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="Payment status">
            <select className="select" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as Order['paymentStatus'])}>
              {['unpaid', 'partial', 'paid'].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
        </FormGrid>

        <div>
          <p className="mb-2 text-sm font-bold">Line items</p>
          <LineItemsEditor
            items={items}
            onChange={setItems}
            products={data.products}
            settings={data.settings}
            discount={discount}
            onDiscountChange={setDiscount}
            delivery={delivery}
            onDeliveryChange={setDelivery}
          />
        </div>

        <Field label="Notes">
          <textarea className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        <p className="text-[11px] text-muted">
          {editing ? `Order ${editing.number}` : `Order number ${nextDocumentNumber(data.settings, 'order')} will be assigned when saved.`}
        </p>
      </div>
    </Modal>
  )
}

async function syncOrderStock(
  order: Order,
  previousStatus: OrderStatus | undefined,
  items: OrderItem[],
  data: ReturnType<typeof useData>
) {
  const wasCompleted = previousStatus === 'completed'
  const isCompleted = order.status === 'completed'
  if (!wasCompleted && !isCompleted) return
  const { putMany, remove } = useApp.getState()
  const existing = data.inventoryMovements.filter(
    (movement) => movement.reference === order.id && movement.type === 'sale'
  )
  for (const movement of existing) await remove('inventoryMovements', movement.id)
  const affected = new Set(existing.map((movement) => movement.itemId))
  if (isCompleted) {
    const movements = items
      .filter((item) => item.productId)
      .map((item) => ({
        id: uid('mv'),
        itemType: 'product' as const,
        itemId: item.productId as string,
        date: order.date,
        type: 'sale' as const,
        quantity: -item.quantity,
        unitCost: data.products.find((product) => product.id === item.productId)?.cost || 0,
        reference: order.id,
        notes: `Order ${order.number}`,
        createdAt: nowISO()
      }))
    await putMany('inventoryMovements', movements)
    for (const movement of movements) affected.add(movement.itemId)
  }
  for (const productId of affected) {
    await recomputeStock('product', productId)
  }
  await useApp.getState().reload()
}

/* -------------------------------------------------------------------------- */
/* Quotes                                                                     */
/* -------------------------------------------------------------------------- */

export function QuotesPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const period = usePeriod('last-12')
  const [status, setStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [deleting, setDeleting] = useState<Quote | null>(null)
  const [busy, setBusy] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  useQuickCreate(openCreate)

  const rows = useMemo(
    () =>
      data.quotes
        .filter((quote) => quote.issueDate >= period.start && quote.issueDate <= period.end)
        .filter((quote) => status === 'all' || quote.status === status)
        .sort((a, b) => b.issueDate.localeCompare(a.issueDate)),
    [data.quotes, period.start, period.end, status]
  )

  const deleteQuote = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      for (const item of data.quoteItems.filter((row) => row.quoteId === deleting.id)) {
        await remove('quoteItems', item.id)
      }
      await remove('quotes', deleting.id)
      await log('delete', `Deleted quote ${deleting.number}`, 'Quote', deleting.id)
      notify('Quote deleted.', 'success')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'number',
      label: 'Quote',
      sortValue: (row: Quote) => row.number,
      render: (row: Quote) => (
        <div>
          <p className="font-semibold">{row.number}</p>
          <p className="text-[11px] text-muted">Expires {formatDate(row.expiryDate, data.settings.dateFormat)}</p>
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      render: (row: Quote) => clientName(data, row.clientId)
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Quote) => <StatusBadge status={row.status} />
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right' as const,
      sortValue: (row: Quote) => row.total,
      render: (row: Quote) => <span className="font-semibold">{formatCurrency(row.total, data.settings)}</span>
    },
    {
      key: 'actions',
      label: '',
      render: (row: Quote) => (
        <div className="table-actions">
          <IconButton
            label="Download quote PDF"
            onClick={() => {
              downloadQuotePdf(row, data.quoteItems.filter((item) => item.quoteId === row.id), data.clients.find((client) => client.id === row.clientId), data.settings)
              void log('export', `Downloaded PDF for ${row.number}`, 'Quote', row.id)
            }}
          >
            <FileText size={14} />
          </IconButton>
          <Button
            small
            variant="ghost"
            disabled={row.status === 'converted'}
            onClick={() => void convertQuoteToOrder(row, data, notify, log)}
          >
            Convert
          </Button>
          <IconButton
            label="Edit quote"
            onClick={() => {
              setEditing(row)
              setModalOpen(true)
            }}
          >
            <Pencil size={14} />
          </IconButton>
          <IconButton label="Delete quote" onClick={() => setDeleting(row)}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Quotes"
        description="Send a professional quote, then convert it into an order when the client accepts."
        actions={
          <>
            <Button
              onClick={() => {
                exportCSV(`quotes-${period.start}-to-${period.end}.csv`, rows, [
                  { key: 'number', label: 'Quote', getValue: (row) => row.number },
                  { key: 'issueDate', label: 'Issued', getValue: (row) => row.issueDate },
                  { key: 'expiryDate', label: 'Expires', getValue: (row) => row.expiryDate },
                  { key: 'client', label: 'Client', getValue: (row) => clientName(data, row.clientId) },
                  { key: 'status', label: 'Status', getValue: (row) => row.status },
                  { key: 'total', label: 'Total', getValue: (row) => row.total }
                ])
                void log('export', 'Exported quotes CSV', 'Quote')
              }}
            >
              <Download size={15} /> Export
            </Button>
            <Button variant="primary" onClick={openCreate}><Plus size={15} /> New quote</Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Quotes in period" value={String(rows.length)} hint={period.label} />
        <KpiCard label="Accepted" value={String(rows.filter((quote) => quote.status === 'accepted' || quote.status === 'converted').length)} tone="success" />
        <KpiCard label="Awaiting reply" value={String(rows.filter((quote) => quote.status === 'sent').length)} tone="warning" />
        <KpiCard label="Quote value" value={formatCurrency(sumBy(rows.filter((quote) => quote.status !== 'declined' && quote.status !== 'expired'), (quote) => quote.total), data.settings)} />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <PeriodPicker kind={period.kind} start={period.start} end={period.end} onChange={period.onChange} />
          <div>
            <label className="label" htmlFor="quote-status">Status</label>
            <select id="quote-status" className="select min-w-[150px]" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              {QUOTE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          searchable={(row) => `${row.number} ${clientName(data, row.clientId)} ${row.notes}`}
          emptyTitle="No quotes in this period"
          emptyDescription="Create a quote for a client enquiry, then convert it when accepted."
          emptyAction={<Button variant="primary" onClick={openCreate}><Plus size={15} /> New quote</Button>}
        />
      </Card>

      <QuoteModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete quote?"
        message={`Quote ${deleting?.number || ''} and its line items will be deleted. Orders already created from it are kept.`}
        confirmLabel="Delete quote"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={deleteQuote}
      />
    </div>
  )
}

async function convertQuoteToOrder(
  quote: Quote,
  data: ReturnType<typeof useData>,
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void,
  log: (type: 'create' | 'update' | 'delete' | 'transfer' | 'payment' | 'refund' | 'import' | 'export' | 'demo' | 'restore', message: string, entity: string, entityId?: string | null) => Promise<void>
) {
  if (quote.status === 'converted') {
    notify('This quote has already been converted.', 'error')
    return
  }
  const number = await useApp.getState().allocateNumber('order')
  if (!number) {
    notify('Order numbering is not ready. Open Settings and try again.', 'error')
    return
  }
  const orderId = uid('order')
  const today = todayISO()
  const items: OrderItem[] = data.quoteItems
    .filter((item) => item.quoteId === quote.id)
    .map((item) => ({
      id: uid('oi'),
      orderId,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate
    }))
  const totals = computeTotals(items, quote.discount, data.settings.taxInclusive)
  const order: Order = {
    id: orderId,
    number,
    clientId: quote.clientId,
    date: today,
    dueDate: addDays(today, data.settings.defaultPaymentTerms),
    status: 'confirmed',
    fulfilmentStatus: 'unfulfilled',
    paymentStatus: 'unpaid',
    discount: totals.discount,
    taxAmount: totals.taxAmount,
    delivery: 0,
    total: totals.total,
    notes: quote.notes,
    createdAt: nowISO(),
    updatedAt: nowISO()
  }
  await useApp.getState().putMany('orderItems', items)
  await useApp.getState().put('orders', order)
  await useApp.getState().put('quotes', {
    ...quote,
    status: 'converted',
    convertedOrderId: orderId,
    updatedAt: nowISO()
  })
  await log('create', `Converted quote ${quote.number} to order ${number}`, 'Order', orderId)
  notify(`Quote ${quote.number} converted to order ${number}.`, 'success')
}

function QuoteModal({ open, editing, onClose }: { open: boolean; editing: Quote | null; onClose: () => void }) {
  const data = useData()
  const put = useApp((state) => state.put)
  const putMany = useApp((state) => state.putMany)
  const remove = useApp((state) => state.remove)
  const allocateNumber = useApp((state) => state.allocateNumber)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState(todayISO())
  const [expiryDate, setExpiryDate] = useState(todayISO())
  const [status, setStatus] = useState<QuoteStatus>('draft')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setClientId(editing?.clientId || data.clients[0]?.id || '')
    setIssueDate(editing?.issueDate || todayISO())
    setExpiryDate(editing?.expiryDate || addDays(todayISO(), 30))
    setStatus(editing?.status || 'draft')
    setDiscount(editing?.discount || 0)
    setNotes(editing?.notes || '')
    setItems(
      editing
        ? toDrafts(data.quoteItems.filter((item) => item.quoteId === editing.id))
        : [
            {
              id: uid('line'),
              productId: data.products[0]?.id || null,
              description: data.products[0]?.name || '',
              quantity: 1,
              unitPrice: data.products[0]?.price || 0,
              discount: 0,
              taxRate: data.settings.defaultTaxRate
            }
          ]
    )
    setError(null)
  }, [open, editing, data])

  const save = async () => {
    if (!clientId) return setError('Choose a client for this quote.')
    if (!items.length || items.every((item) => !item.description.trim())) {
      return setError('Add at least one line item with a description.')
    }
    setBusy(true)
    setError(null)
    try {
      const quoteId = editing?.id || uid('quote')
      const number = editing?.number || (await allocateNumber('quote'))
      const totals = computeTotals(items, discount, data.settings.taxInclusive)
      const record: Quote = {
        id: quoteId,
        number,
        clientId,
        issueDate,
        expiryDate,
        status,
        discount: totals.discount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        notes,
        convertedOrderId: editing?.convertedOrderId || null,
        createdAt: editing?.createdAt || nowISO(),
        updatedAt: nowISO()
      }
      const lineRecords: QuoteItem[] = items
        .filter((item) => item.description.trim())
        .map((item) => ({
          id: item.id,
          quoteId,
          productId: item.productId,
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate
        }))
      if (editing) {
        for (const item of data.quoteItems.filter((row) => row.quoteId === editing.id)) {
          await remove('quoteItems', item.id)
        }
      }
      await put('quotes', record)
      await putMany('quoteItems', lineRecords)
      await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Created'} quote ${record.number}`, 'Quote', record.id)
      notify(editing ? 'Quote updated.' : `Quote ${record.number} created.`, 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Quote could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? `Edit ${editing.number}` : 'New quote'}
      description="Quotes do not affect income or stock. Convert one to an order when the client accepts."
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save quote' : 'Create quote'}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <FormGrid columns={3}>
          <Field label="Client">
            <select className="select" value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Choose a client</option>
              {data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </Field>
          <Field label="Issue date">
            <input type="date" className="input" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
          </Field>
          <Field label="Expiry date">
            <input type="date" className="input" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
          </Field>
          <Field label="Status">
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value as QuoteStatus)}>
              {QUOTE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
        </FormGrid>
        <div>
          <p className="mb-2 text-sm font-bold">Line items</p>
          <LineItemsEditor
            items={items}
            onChange={setItems}
            products={data.products}
            settings={data.settings}
            discount={discount}
            onDiscountChange={setDiscount}
          />
        </div>
        <Field label="Notes / terms">
          <textarea className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        <p className="text-[11px] text-muted">
          {editing ? `Quote ${editing.number}` : `Quote number ${nextDocumentNumber(data.settings, 'quote')} will be assigned when saved.`}
        </p>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Invoices                                                                   */
/* -------------------------------------------------------------------------- */

export function InvoicesPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const period = usePeriod('last-12')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState<Invoice | null>(null)
  const [paying, setPaying] = useState<Invoice | null>(null)
  const [busy, setBusy] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  useQuickCreate(openCreate)

  const today = todayISO()
  const all = useMemo(
    () =>
      data.invoices
        .filter((invoice) => invoice.issueDate >= period.start && invoice.issueDate <= period.end)
        .map((invoice) => ({
          id: invoice.id,
          invoice,
          balance: invoiceBalance(invoice, data.payments, data.refunds, today)
        }))
        .sort((a, b) => b.invoice.issueDate.localeCompare(a.invoice.issueDate)),
    [data.invoices, data.payments, data.refunds, period.start, period.end, today]
  )

  const rows = all.filter(({ invoice, balance }) => {
    if (filter === 'all') return true
    if (filter === 'unpaid') return balance.balance > 0.005
    if (filter === 'overdue') return balance.balance > 0.005 && invoice.dueDate < today
    if (filter === 'paid') return balance.balance <= 0.005
    if (filter === 'draft') return invoice.status === 'draft'
    if (filter === 'void') return invoice.status === 'void'
    return true
  })

  const issued = sumBy(all.filter(({ invoice }) => invoice.status !== 'void'), ({ invoice }) => invoice.total)
  const outstanding = sumBy(all, ({ balance }) => Math.max(0, balance.balance))
  const overdue = all.filter(({ invoice, balance }) => balance.balance > 0.005 && invoice.dueDate < today)
  const paid = issued - outstanding

  const deleteInvoice = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      const payments = data.payments.filter((payment) => payment.invoiceId === deleting.id)
      const refunds = data.refunds.filter((refund) => refund.invoiceId === deleting.id)
      for (const income of data.incomeTransactions.filter((row) => row.invoiceId === deleting.id)) {
        await remove('incomeTransactions', income.id)
      }
      for (const payment of payments) {
        await remove('payments', payment.id)
      }
      for (const refund of refunds) {
        for (const expense of data.expenseTransactions.filter(
          (row) => row.receiptReference === refund.id || row.id === `exp-${refund.id}`
        )) {
          await remove('expenseTransactions', expense.id)
        }
        await remove('refunds', refund.id)
      }
      for (const item of data.invoiceItems.filter((item) => item.invoiceId === deleting.id)) {
        await remove('invoiceItems', item.id)
      }
      await remove('invoices', deleting.id)
      await log('delete', `Deleted invoice ${deleting.number}`, 'Invoice', deleting.id)
      notify('Invoice and its payment records deleted.', 'success')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'number',
      label: 'Invoice',
      sortValue: (row: (typeof rows)[number]) => row.invoice.number,
      render: ({ invoice }: (typeof rows)[number]) => (
        <div>
          <p className="font-semibold">{invoice.number}</p>
          <p className="text-[11px] text-muted">Issued {formatDate(invoice.issueDate, data.settings.dateFormat)}</p>
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      sortValue: ({ invoice }: (typeof rows)[number]) => clientName(data, invoice.clientId),
      render: ({ invoice }: (typeof rows)[number]) => clientName(data, invoice.clientId)
    },
    {
      key: 'due',
      label: 'Due',
      sortValue: ({ invoice }: (typeof rows)[number]) => invoice.dueDate,
      render: ({ invoice }: (typeof rows)[number]) => (
        <span className={invoice.dueDate < today && invoice.status !== 'paid' ? 'text-danger' : ''}>
          {formatDate(invoice.dueDate, data.settings.dateFormat)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: ({ invoice, balance }: (typeof rows)[number]) => (
        <StatusBadge status={invoice.status === 'void' || invoice.status === 'draft' ? invoice.status : invoice.dueDate < today && balance.balance > 0.005 ? 'overdue' : balance.status} />
      )
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right' as const,
      sortValue: ({ invoice }: (typeof rows)[number]) => invoice.total,
      render: ({ invoice }: (typeof rows)[number]) => formatCurrency(invoice.total, data.settings)
    },
    {
      key: 'paid',
      label: 'Paid',
      align: 'right' as const,
      render: ({ balance }: (typeof rows)[number]) => formatCurrency(balance.netPaid, data.settings)
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right' as const,
      sortValue: ({ balance }: (typeof rows)[number]) => balance.balance,
      render: ({ balance }: (typeof rows)[number]) => (
        <span className={balance.balance > 0.005 ? 'font-semibold text-danger' : 'font-semibold text-success'}>
          {formatCurrency(balance.balance, data.settings)}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: ({ invoice, balance }: (typeof rows)[number]) => (
        <div className="table-actions">
          <IconButton
            label="Download invoice PDF"
            onClick={() => {
              downloadInvoicePdf(invoice, data.invoiceItems.filter((item) => item.invoiceId === invoice.id), data.clients.find((client) => client.id === invoice.clientId), data.payments, data.refunds, data.settings)
              void log('export', `Downloaded PDF for ${invoice.number}`, 'Invoice', invoice.id)
            }}
          >
            <FileText size={14} />
          </IconButton>
          <Button small variant="ghost" disabled={invoice.status === 'void' || balance.balance <= 0.005} onClick={() => setPaying(invoice)}>
            Pay
          </Button>
          <IconButton
            label="Edit invoice"
            onClick={() => {
              setEditing(invoice)
              setModalOpen(true)
            }}
          >
            <Pencil size={14} />
          </IconButton>
          <IconButton label="Delete invoice" onClick={() => setDeleting(invoice)}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Invoices"
        description="Issue invoices, record payments and track what is still owed. Invoices alone do not count as income — payments do."
        actions={
          <>
            <Button
              onClick={() => {
                exportCSV(`invoices-${period.start}-to-${period.end}.csv`, all, [
                  { key: 'number', label: 'Invoice', getValue: ({ invoice }) => invoice.number },
                  { key: 'issued', label: 'Issued', getValue: ({ invoice }) => invoice.issueDate },
                  { key: 'due', label: 'Due', getValue: ({ invoice }) => invoice.dueDate },
                  { key: 'client', label: 'Client', getValue: ({ invoice }) => clientName(data, invoice.clientId) },
                  { key: 'status', label: 'Status', getValue: ({ balance }) => balance.status },
                  { key: 'total', label: 'Total', getValue: ({ invoice }) => invoice.total },
                  { key: 'paid', label: 'Paid', getValue: ({ balance }) => balance.netPaid },
                  { key: 'balance', label: 'Balance', getValue: ({ balance }) => balance.balance }
                ])
                void log('export', 'Exported invoices CSV', 'Invoice')
              }}
            >
              <Download size={15} /> Export
            </Button>
            <Button variant="primary" onClick={openCreate}><Plus size={15} /> New invoice</Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Invoiced in period" value={formatCurrency(issued, data.settings)} hint={`${all.length} invoices`} />
        <KpiCard label="Paid" value={formatCurrency(paid, data.settings)} tone="success" />
        <KpiCard label="Outstanding" value={formatCurrency(outstanding, data.settings)} tone="warning" />
        <KpiCard label="Overdue" value={String(overdue.length)} hint={formatCurrency(sumBy(overdue, ({ balance }) => balance.balance), data.settings)} tone={overdue.length ? 'danger' : 'success'} />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <PeriodPicker kind={period.kind} start={period.start} end={period.end} onChange={period.onChange} />
          <div>
            <label className="label" htmlFor="invoice-filter">Show</label>
            <select id="invoice-filter" className="select min-w-[160px]" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All invoices</option>
              <option value="unpaid">Unpaid & partial</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="draft">Drafts</option>
              <option value="void">Void</option>
            </select>
          </div>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          searchable={({ invoice }) => `${invoice.number} ${clientName(data, invoice.clientId)} ${invoice.notes}`}
          emptyTitle="No invoices match this view"
          emptyDescription="Create an invoice for a client, or convert an order into an invoice."
          emptyAction={<Button variant="primary" onClick={openCreate}><Plus size={15} /> New invoice</Button>}
        />
      </Card>

      <InvoiceModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
      <PaymentModal open={Boolean(paying)} invoiceId={paying?.id} onClose={() => setPaying(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete invoice?"
        message={`Invoice ${deleting?.number || ''}, its line items, payments, refunds and the linked income/expense entries will be deleted. This changes your reported revenue.`}
        confirmLabel="Delete invoice"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={deleteInvoice}
      />
    </div>
  )
}

function InvoiceModal({ open, editing, onClose }: { open: boolean; editing: Invoice | null; onClose: () => void }) {
  const data = useData()
  const put = useApp((state) => state.put)
  const putMany = useApp((state) => state.putMany)
  const remove = useApp((state) => state.remove)
  const allocateNumber = useApp((state) => state.allocateNumber)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState(todayISO())
  const [dueDate, setDueDate] = useState(todayISO())
  const [status, setStatus] = useState<InvoiceStatus>('sent')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [items, setItems] = useState<LineDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setClientId(editing?.clientId || data.clients[0]?.id || '')
    setIssueDate(editing?.issueDate || todayISO())
    setDueDate(editing?.dueDate || addDays(todayISO(), data.settings.defaultPaymentTerms))
    setStatus(editing?.status || 'sent')
    setDiscount(editing?.discount || 0)
    setNotes(editing?.notes || '')
    setTerms(editing?.terms || `Net ${data.settings.defaultPaymentTerms}`)
    setItems(
      editing
        ? toDrafts(data.invoiceItems.filter((item) => item.invoiceId === editing.id))
        : [
            {
              id: uid('line'),
              productId: data.products[0]?.id || null,
              description: data.products[0]?.name || '',
              quantity: 1,
              unitPrice: data.products[0]?.price || 0,
              discount: 0,
              taxRate: data.settings.defaultTaxRate
            }
          ]
    )
    setError(null)
  }, [open, editing, data])

  const save = async () => {
    if (!clientId) return setError('Choose a client for this invoice.')
    if (!items.length || items.every((item) => !item.description.trim())) {
      return setError('Add at least one line item with a description.')
    }
    setBusy(true)
    setError(null)
    try {
      const invoiceId = editing?.id || uid('invoice')
      const number = editing?.number || (await allocateNumber('invoice'))
      const totals = computeTotals(items, discount, data.settings.taxInclusive)
      const record: Invoice = {
        id: invoiceId,
        number,
        clientId,
        orderId: editing?.orderId || null,
        quoteId: editing?.quoteId || null,
        issueDate,
        dueDate,
        status,
        subtotal: totals.subtotal,
        discount: totals.discount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        notes,
        terms,
        createdAt: editing?.createdAt || nowISO(),
        updatedAt: nowISO()
      }
      const lineRecords: InvoiceItem[] = items
        .filter((item) => item.description.trim())
        .map((item) => ({
          id: item.id,
          invoiceId,
          productId: item.productId,
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate
        }))
      if (editing) {
        for (const item of data.invoiceItems.filter((row) => row.invoiceId === editing.id)) {
          await remove('invoiceItems', item.id)
        }
      }
      await put('invoices', record)
      await putMany('invoiceItems', lineRecords)
      await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Issued'} invoice ${record.number}`, 'Invoice', record.id)
      notify(editing ? 'Invoice updated.' : `Invoice ${record.number} created.`, 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Invoice could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? `Edit ${editing.number}` : 'New invoice'}
      description="Payments are recorded separately so outstanding balances always match your ledger."
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save invoice' : 'Create invoice'}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <FormGrid columns={3}>
          <Field label="Client">
            <select className="select" value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Choose a client</option>
              {data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </Field>
          <Field label="Issue date">
            <input type="date" className="input" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
          </Field>
          <Field label="Due date">
            <input type="date" className="input" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </Field>
          <Field label="Status">
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus)}>
              {INVOICE_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
        </FormGrid>
        <div>
          <p className="mb-2 text-sm font-bold">Line items</p>
          <LineItemsEditor
            items={items}
            onChange={setItems}
            products={data.products}
            settings={data.settings}
            discount={discount}
            onDiscountChange={setDiscount}
          />
        </div>
        <FormGrid>
          <Field label="Notes">
            <textarea className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
          <Field label="Terms">
            <input className="input" value={terms} onChange={(event) => setTerms(event.target.value)} placeholder="e.g. Net 30" />
          </Field>
        </FormGrid>
        <p className="text-[11px] text-muted">
          {editing ? `Invoice ${editing.number}` : `Invoice number ${nextDocumentNumber(data.settings, 'invoice')} will be assigned when saved.`}
        </p>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Payments & refunds                                                         */
/* -------------------------------------------------------------------------- */

export function PaymentsPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const period = usePeriod('last-12')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null)
  const [deletingRefund, setDeletingRefund] = useState<Refund | null>(null)
  const [busy, setBusy] = useState(false)

  const payments = data.payments
    .filter((payment) => payment.date >= period.start && payment.date <= period.end)
    .sort((a, b) => b.date.localeCompare(a.date))
  const refunds = data.refunds
    .filter((refund) => refund.date >= period.start && refund.date <= period.end)
    .sort((a, b) => b.date.localeCompare(a.date))
  const received = sumBy(payments, (payment) => payment.amount)
  const refunded = sumBy(refunds, (refund) => refund.amount)

  const invoiceNumber = (invoiceId: string) => data.invoices.find((invoice) => invoice.id === invoiceId)?.number || '—'

  const deletePayment = async () => {
    if (!deletingPayment) return
    setBusy(true)
    try {
      const linkedIncome = data.incomeTransactions.filter(
        (row) =>
          row.invoiceId === deletingPayment.invoiceId &&
          (row.id === `inc-${deletingPayment.id}` ||
            row.id === `demo-inc-${deletingPayment.id}` ||
            (row.reference === deletingPayment.reference &&
              row.amount === deletingPayment.amount &&
              row.date === deletingPayment.date))
      )
      for (const income of linkedIncome) await remove('incomeTransactions', income.id)
      await remove('payments', deletingPayment.id)
      const remaining = data.payments.filter((payment) => payment.id !== deletingPayment.id)
      const invoice = data.invoices.find((row) => row.id === deletingPayment.invoiceId)
      if (invoice && invoice.status !== 'draft' && invoice.status !== 'void') {
        const balance = invoiceBalance(invoice, remaining, data.refunds)
        await put('invoices', { ...invoice, status: balance.status, updatedAt: nowISO() })
      }
      await log('delete', `Deleted payment for ${invoiceNumber(deletingPayment.invoiceId)}`, 'Payment', deletingPayment.id)
      notify('Payment deleted and invoice balance updated.', 'success')
      setDeletingPayment(null)
    } finally {
      setBusy(false)
    }
  }

  const deleteRefund = async () => {
    if (!deletingRefund) return
    setBusy(true)
    try {
      await remove('expenseTransactions', `exp-${deletingRefund.id}`)
      await remove('refunds', deletingRefund.id)
      const remaining = data.refunds.filter((refund) => refund.id !== deletingRefund.id)
      const invoice = data.invoices.find((row) => row.id === deletingRefund.invoiceId)
      if (invoice && invoice.status !== 'draft' && invoice.status !== 'void') {
        const balance = invoiceBalance(invoice, data.payments, remaining)
        await put('invoices', { ...invoice, status: balance.status, updatedAt: nowISO() })
      }
      await log('delete', `Deleted refund for ${invoiceNumber(deletingRefund.invoiceId)}`, 'Refund', deletingRefund.id)
      notify('Refund deleted.', 'success')
      setDeletingRefund(null)
    } finally {
      setBusy(false)
    }
  }

  const paymentColumns = [
    {
      key: 'date',
      label: 'Date',
      sortValue: (row: Payment) => row.date,
      render: (row: Payment) => formatDate(row.date, data.settings.dateFormat)
    },
    {
      key: 'invoice',
      label: 'Invoice',
      sortValue: (row: Payment) => invoiceNumber(row.invoiceId),
      render: (row: Payment) => (
        <div>
          <p className="font-medium">{invoiceNumber(row.invoiceId)}</p>
          <p className="text-[11px] text-muted">{clientName(data, row.clientId)}</p>
        </div>
      )
    },
    {
      key: 'method',
      label: 'Method',
      render: (row: Payment) => <span className="capitalize">{row.method.replace('-', ' ')}</span>
    },
    {
      key: 'account',
      label: 'Account',
      render: (row: Payment) => data.accounts.find((account) => account.id === row.accountId)?.name || '—'
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      sortValue: (row: Payment) => row.amount,
      render: (row: Payment) => <span className="font-semibold text-success">{formatCurrency(row.amount, data.settings)}</span>
    },
    {
      key: 'actions',
      label: '',
      render: (row: Payment) => (
        <div className="table-actions">
          <IconButton label="Delete payment" onClick={() => setDeletingPayment(row)}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      )
    }
  ]

  const refundColumns = [
    {
      key: 'date',
      label: 'Date',
      sortValue: (row: Refund) => row.date,
      render: (row: Refund) => formatDate(row.date, data.settings.dateFormat)
    },
    {
      key: 'invoice',
      label: 'Invoice',
      render: (row: Refund) => (
        <div>
          <p className="font-medium">{invoiceNumber(row.invoiceId)}</p>
          <p className="text-[11px] text-muted">{clientName(data, row.clientId)}</p>
        </div>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row: Refund) => row.reason || '—'
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      sortValue: (row: Refund) => row.amount,
      render: (row: Refund) => <span className="font-semibold text-danger">−{formatCurrency(row.amount, data.settings)}</span>
    },
    {
      key: 'actions',
      label: '',
      render: (row: Refund) => (
        <div className="table-actions">
          <IconButton label="Delete refund" onClick={() => setDeletingRefund(row)}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Payments & refunds"
        description="Every payment creates a matching income entry, and every refund creates an expense, so reports stay consistent."
        actions={
          <>
            <Button
              onClick={() => {
                exportCSV(`payments-${period.start}-to-${period.end}.csv`, payments, [
                  { key: 'date', label: 'Date', getValue: (row) => row.date },
                  { key: 'invoice', label: 'Invoice', getValue: (row) => invoiceNumber(row.invoiceId) },
                  { key: 'client', label: 'Client', getValue: (row) => clientName(data, row.clientId) },
                  { key: 'amount', label: 'Amount', getValue: (row) => row.amount },
                  { key: 'method', label: 'Method', getValue: (row) => row.method },
                  { key: 'reference', label: 'Reference', getValue: (row) => row.reference }
                ])
                void log('export', 'Exported payments CSV', 'Payment')
              }}
            >
              <Download size={15} /> Export payments
            </Button>
            <Button onClick={() => setRefundOpen(true)}><RotateCcw size={15} /> Record refund</Button>
            <Button variant="primary" onClick={() => setPaymentOpen(true)}><Wallet size={15} /> Record payment</Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Payments received" value={formatCurrency(received, data.settings)} tone="success" hint={`${payments.length} payments`} />
        <KpiCard label="Refunds issued" value={formatCurrency(refunded, data.settings)} tone="danger" hint={`${refunds.length} refunds`} />
        <KpiCard label="Net received" value={formatCurrency(received - refunded, data.settings)} hint={period.label} />
        <KpiCard label="Average payment" value={formatCurrency(payments.length ? received / payments.length : 0, data.settings)} />
      </div>

      <div className="mb-3">
        <PeriodPicker kind={period.kind} start={period.start} end={period.end} onChange={period.onChange} />
      </div>

      <Card className="mb-3">
        <SectionTitle title="Payments received" description="Each payment also appears in income." />
        <DataTable
          rows={payments}
          columns={paymentColumns}
          searchable={(row) => `${invoiceNumber(row.invoiceId)} ${clientName(data, row.clientId)} ${row.reference} ${row.method}`}
          emptyTitle="No payments in this period"
          emptyDescription="Record a payment against an invoice to reduce its balance."
          emptyAction={<Button variant="primary" onClick={() => setPaymentOpen(true)}><Wallet size={15} /> Record payment</Button>}
        />
      </Card>

      <Card>
        <SectionTitle title="Refunds" description="Refunds reduce net paid on an invoice and appear as expenses." />
        <DataTable
          rows={refunds}
          columns={refundColumns}
          searchable={(row) => `${invoiceNumber(row.invoiceId)} ${clientName(data, row.clientId)} ${row.reason}`}
          emptyTitle="No refunds in this period"
          emptyDescription="If a client returns an item or you issue a goodwill refund, record it here."
          emptyAction={<Button variant="primary" onClick={() => setRefundOpen(true)}><RotateCcw size={15} /> Record refund</Button>}
        />
      </Card>

      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} />
      <RefundModal open={refundOpen} onClose={() => setRefundOpen(false)} />

      <ConfirmDialog
        open={Boolean(deletingPayment)}
        title="Delete payment?"
        message="The payment and its linked income entry will be removed, and the invoice balance will go back up."
        confirmLabel="Delete payment"
        busy={busy}
        onCancel={() => setDeletingPayment(null)}
        onConfirm={deletePayment}
      />
      <ConfirmDialog
        open={Boolean(deletingRefund)}
        title="Delete refund?"
        message="The refund and its linked expense entry will be removed. The invoice balance will be recalculated."
        confirmLabel="Delete refund"
        busy={busy}
        onCancel={() => setDeletingRefund(null)}
        onConfirm={deleteRefund}
      />
    </div>
  )
}

export function PaymentModal({
  open,
  invoiceId,
  onClose
}: {
  open: boolean
  invoiceId?: string
  onClose: () => void
}) {
  const data = useData()
  const put = useApp((state) => state.put)
  const putMany = useApp((state) => state.putMany)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [selected, setSelected] = useState('')
  const [date, setDate] = useState(todayISO())
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState('bank-transfer')
  const [accountId, setAccountId] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const openInvoices = data.invoices
    .filter((invoice) => invoice.status !== 'void' && invoice.status !== 'draft')
    .map((invoice) => ({ invoice, balance: invoiceBalance(invoice, data.payments, data.refunds) }))
    .filter((entry) => entry.balance.balance > 0.005)

  const current = openInvoices.find((entry) => entry.invoice.id === selected)

  useEffect(() => {
    if (!open) return
    const first = invoiceId
      ? openInvoices.find((entry) => entry.invoice.id === invoiceId)
      : openInvoices[0]
    setSelected(first?.invoice.id || '')
    setAmount(first ? Math.max(0, first.balance.balance) : 0)
    setDate(todayISO())
    setMethod('bank-transfer')
    setAccountId(data.accounts[0]?.id || '')
    setReference('')
    setNotes('')
    setError(null)
    // Only re-run when the dialog opens or its target invoice changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceId])

  const pickInvoice = (id: string) => {
    setSelected(id)
    const entry = openInvoices.find((invoice) => invoice.invoice.id === id)
    setAmount(entry ? Math.max(0, round2(entry.balance.balance)) : 0)
  }

  const save = async () => {
    if (!current) return setError('Choose an invoice with an outstanding balance.')
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter a payment amount greater than zero.')
    if (!accountId) return setError('Choose the account that received the payment.')
    if (amount > current.balance.balance + 0.005) return setError('The payment cannot be more than the outstanding balance.')
    setBusy(true)
    setError(null)
    try {
      const paymentId = uid('pay')
      const payment: Payment = {
        id: paymentId,
        invoiceId: current.invoice.id,
        clientId: current.invoice.clientId,
        date,
        amount: round2(amount),
        method,
        accountId,
        reference,
        notes,
        createdAt: nowISO()
      }
      const taxShare = current.invoice.total > 0 ? round2(current.invoice.taxAmount * (amount / current.invoice.total)) : 0
      const income = {
        id: `inc-${paymentId}`,
        date,
        description: `Payment ${current.invoice.number} from ${clientName(data, current.invoice.clientId)}`,
        category: data.settings.incomeCategories[0] || 'Product Sales',
        subcategory: '',
        amount: round2(amount),
        taxAmount: taxShare,
        accountId,
        paymentMethod: method,
        clientId: current.invoice.clientId,
        invoiceId: current.invoice.id,
        orderId: current.invoice.orderId,
        reference: reference || `PAY-${current.invoice.number}`,
        notes,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }
      await useApp.getState().putMany('payments', [payment])
      await putMany('incomeTransactions', [income])
      const nextBalance = invoiceBalance(
        current.invoice,
        [...data.payments, payment],
        data.refunds
      )
      await put('invoices', { ...current.invoice, status: nextBalance.status, updatedAt: nowISO() })
      await log('payment', `Payment of ${formatCurrency(payment.amount, data.settings)} recorded for ${current.invoice.number}`, 'Payment', payment.id)
      notify('Payment recorded and added to income.', 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Payment could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Record a payment"
      description="Payments reduce the invoice balance and create an income entry automatically."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy || !openInvoices.length}>
            {busy ? 'Saving…' : 'Record payment'}
          </Button>
        </>
      }
    >
      {openInvoices.length ? (
        <div className="grid gap-3">
          {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
          <Field label="Invoice" hint={current ? `Outstanding ${formatCurrency(current.balance.balance, data.settings)}` : undefined}>
            <select className="select" value={selected} onChange={(event) => pickInvoice(event.target.value)}>
              {openInvoices.map((entry) => (
                <option key={entry.invoice.id} value={entry.invoice.id}>
                  {entry.invoice.number} — {clientName(data, entry.invoice.clientId)} — {formatCurrency(entry.balance.balance, data.settings)} due
                </option>
              ))}
            </select>
          </Field>
          <FormGrid>
            <Field label="Amount">
              <input type="number" min="0" step="0.01" className="input" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
            </Field>
            <Field label="Date">
              <input type="date" className="input" value={date} onChange={(event) => setDate(event.target.value)} />
            </Field>
            <Field label="Method">
              <select className="select" value={method} onChange={(event) => setMethod(event.target.value)}>
                {PAYMENT_METHODS.map((value) => <option key={value} value={value}>{value.replace('-', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Account">
              <select className="select" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                <option value="">Choose an account</option>
                {data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </Field>
          </FormGrid>
          <Field label="Reference">
            <input className="input" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="e.g. bank reference" />
          </Field>
          <Field label="Notes">
            <textarea className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-sm font-semibold">No invoices are awaiting payment</p>
          <p className="mt-1 text-xs text-muted">Create an invoice first, or record general income in Finance → Income.</p>
        </div>
      )}
    </Modal>
  )
}

export function RefundModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useData()
  const put = useApp((state) => state.put)
  const putMany = useApp((state) => state.putMany)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [selected, setSelected] = useState('')
  const [date, setDate] = useState(todayISO())
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState('credit-card')
  const [accountId, setAccountId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const eligible = data.invoices
    .filter((invoice) => invoice.status !== 'void')
    .map((invoice) => ({ invoice, balance: invoiceBalance(invoice, data.payments, data.refunds) }))
    .filter((entry) => entry.balance.netPaid > 0.005)

  const current = eligible.find((entry) => entry.invoice.id === selected)

  useEffect(() => {
    if (!open) return
    setSelected(eligible[0]?.invoice.id || '')
    setAmount(eligible[0] ? round2(eligible[0].balance.netPaid) : 0)
    setDate(todayISO())
    setMethod('credit-card')
    setAccountId(data.accounts[0]?.id || '')
    setReason('')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const pickInvoice = (id: string) => {
    setSelected(id)
    const entry = eligible.find((invoice) => invoice.invoice.id === id)
    setAmount(entry ? round2(entry.balance.netPaid) : 0)
  }

  const save = async () => {
    if (!current) return setError('Choose an invoice that has payments to refund.')
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter a refund amount greater than zero.')
    if (amount > current.balance.netPaid + 0.005) return setError('The refund cannot be more than the net amount paid.')
    if (!accountId) return setError('Choose the account the refund was paid from.')
    setBusy(true)
    setError(null)
    try {
      const refundId = uid('refund')
      const refund: Refund = {
        id: refundId,
        invoiceId: current.invoice.id,
        paymentId: data.payments.find((payment) => payment.invoiceId === current.invoice.id)?.id || null,
        clientId: current.invoice.clientId,
        date,
        amount: round2(amount),
        method,
        accountId,
        reason,
        createdAt: nowISO()
      }
      const expense = {
        id: `exp-${refundId}`,
        date,
        description: `Refund for ${current.invoice.number} — ${clientName(data, current.invoice.clientId)}`,
        category: data.settings.expenseCategories.includes('Refunds & Returns') ? 'Refunds & Returns' : data.settings.expenseCategories[0] || 'Other Expenses',
        subcategory: '',
        supplierId: null,
        accountId,
        amount: round2(amount),
        taxAmount: 0,
        paymentMethod: method,
        dueDate: null,
        receiptReference: refundId,
        recurring: false,
        notes: reason,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }
      await putMany('refunds', [refund])
      await putMany('expenseTransactions', [expense])
      const nextBalance = invoiceBalance(current.invoice, data.payments, [...data.refunds, refund])
      if (current.invoice.status !== 'draft' && current.invoice.status !== 'void') {
        await put('invoices', { ...current.invoice, status: nextBalance.status, updatedAt: nowISO() })
      }
      await log('refund', `Refund of ${formatCurrency(refund.amount, data.settings)} issued for ${current.invoice.number}`, 'Refund', refund.id)
      notify('Refund recorded and added to expenses.', 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Refund could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Record a refund"
      description="Refunds increase the invoice balance again and are recorded as a business expense."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy || !eligible.length}>{busy ? 'Saving…' : 'Record refund'}</Button>
        </>
      }
    >
      {eligible.length ? (
        <div className="grid gap-3">
          {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
          <Field label="Invoice" hint={current ? `Net paid ${formatCurrency(current.balance.netPaid, data.settings)}` : undefined}>
            <select className="select" value={selected} onChange={(event) => pickInvoice(event.target.value)}>
              {eligible.map((entry) => (
                <option key={entry.invoice.id} value={entry.invoice.id}>
                  {entry.invoice.number} — {clientName(data, entry.invoice.clientId)} — {formatCurrency(entry.balance.netPaid, data.settings)} paid
                </option>
              ))}
            </select>
          </Field>
          <FormGrid>
            <Field label="Refund amount">
              <input type="number" min="0" step="0.01" className="input" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
            </Field>
            <Field label="Date">
              <input type="date" className="input" value={date} onChange={(event) => setDate(event.target.value)} />
            </Field>
            <Field label="Method">
              <select className="select" value={method} onChange={(event) => setMethod(event.target.value)}>
                {PAYMENT_METHODS.map((value) => <option key={value} value={value}>{value.replace('-', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Account">
              <select className="select" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                <option value="">Choose an account</option>
                {data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </Field>
          </FormGrid>
          <Field label="Reason">
            <textarea className="textarea" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. item returned in original condition" />
          </Field>
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-sm font-semibold">No paid invoices to refund</p>
          <p className="mt-1 text-xs text-muted">Record a payment on an invoice first.</p>
        </div>
      )}
    </Modal>
  )
}

/* Kept as a named helper so other modules can trigger the same workflow. */
export { convertOrderToInvoice, convertQuoteToOrder }
