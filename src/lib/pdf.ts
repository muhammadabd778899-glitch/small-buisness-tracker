import { jsPDF } from 'jspdf'
import type {
  BusinessSettings,
  Client,
  Invoice,
  InvoiceItem,
  Payment,
  Product,
  Quote,
  QuoteItem,
  Refund
} from './types'
import type { MonthlyPoint } from './calc'
import { computeTotals, invoiceBalance, lineNet } from './calc'
import { formatCurrency } from './money'
import { formatDate } from './dates'

const MARGIN = 16
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

function createDoc(): jsPDF {
  return new jsPDF({ unit: 'mm', format: 'a4', compress: true })
}

function addLogo(doc: jsPDF, logo?: string): void {
  if (!logo || !logo.startsWith('data:image/')) return
  try {
    doc.addImage(logo, 'PNG', MARGIN, 12, 18, 18)
  } catch {
    // Unsupported image format: skip the logo instead of failing the PDF.
  }
}

function drawBusinessHeader(doc: jsPDF, settings: BusinessSettings, title: string, subtitle: string): number {
  addLogo(doc, settings.logoDataUrl)
  const textX = settings.logoDataUrl ? MARGIN + 22 : MARGIN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(41, 41, 41)
  doc.text(settings.businessName || 'My Business', textX, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(110, 110, 110)
  const details = [settings.address, [settings.businessEmail, settings.phone].filter(Boolean).join(' · ')]
    .filter(Boolean)
    .join('\n')
  if (details) doc.text(doc.splitTextToSize(details, 100), textX, 23)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(242, 106, 44)
  doc.text(title, PAGE_WIDTH - MARGIN, 20, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(110, 110, 110)
  doc.text(subtitle, PAGE_WIDTH - MARGIN, 26, { align: 'right' })
  doc.setDrawColor(236, 233, 230)
  doc.line(MARGIN, 33, PAGE_WIDTH - MARGIN, 33)
  return 40
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - 20) {
    doc.addPage()
    return MARGIN
  }
  return y
}

function drawTableHeader(doc: jsPDF, y: number, columns: { label: string; x: number; align?: 'left' | 'right' }[]): number {
  doc.setFillColor(250, 249, 247)
  doc.rect(MARGIN, y - 5, CONTENT_WIDTH, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(90, 90, 90)
  for (const column of columns) {
    doc.text(column.label, column.x, y, { align: column.align || 'left' })
  }
  doc.setDrawColor(236, 233, 230)
  doc.line(MARGIN, y + 3, PAGE_WIDTH - MARGIN, y + 3)
  return y + 9
}

function drawFooter(doc: jsPDF, settings: BusinessSettings): void {
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `${settings.businessName || 'My Business'} · Generated offline by Ultimate Small Business Manager`,
      MARGIN,
      PAGE_HEIGHT - 10
    )
    doc.text(`Page ${page} of ${pages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' })
  }
}

function clientBlock(doc: jsPDF, client: Client | undefined, y: number, label = 'Bill to'): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(label.toUpperCase(), MARGIN, y)
  doc.setFontSize(10)
  doc.setTextColor(41, 41, 41)
  doc.text(client?.name || 'Walk-in customer', MARGIN, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(110, 110, 110)
  const lines = [
    client?.company,
    client?.email,
    client?.phone,
    client?.address
  ].filter(Boolean) as string[]
  if (lines.length) doc.text(lines.join('\n'), MARGIN, y + 10)
  return y + 10 + lines.length * 4
}

function itemRows<T extends { description: string; quantity: number; unitPrice: number; discount: number; taxRate: number }>(
  doc: jsPDF,
  items: T[],
  y: number,
  settings: BusinessSettings
): number {
  const columns = [
    { label: 'Description', x: MARGIN },
    { label: 'Qty', x: 120, align: 'right' as const },
    { label: 'Unit price', x: 145, align: 'right' as const },
    { label: 'Tax', x: 168, align: 'right' as const },
    { label: 'Amount', x: PAGE_WIDTH - MARGIN, align: 'right' as const }
  ]
  let cursor = drawTableHeader(doc, y, columns)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(41, 41, 41)
  for (const item of items) {
    cursor = ensureSpace(doc, cursor, 10)
    doc.setFontSize(9)
    const description = doc.splitTextToSize(item.description || 'Item', 85) as string[]
    doc.text(description, MARGIN, cursor)
    doc.text(String(item.quantity), 120, cursor, { align: 'right' })
    doc.text(formatCurrency(item.unitPrice, settings), 145, cursor, { align: 'right' })
    doc.text(`${item.taxRate}%`, 168, cursor, { align: 'right' })
    doc.text(formatCurrency(lineNet(item), settings), PAGE_WIDTH - MARGIN, cursor, { align: 'right' })
    cursor += Math.max(6, description.length * 4.5)
    doc.setDrawColor(245, 243, 241)
    doc.line(MARGIN, cursor - 2, PAGE_WIDTH - MARGIN, cursor - 2)
  }
  return cursor + 4
}

function totalsBlock(
  doc: jsPDF,
  y: number,
  rows: { label: string; value: string; bold?: boolean }[],
  settings: BusinessSettings
): number {
  let cursor = y
  for (const row of rows) {
    cursor = ensureSpace(doc, cursor, 7)
    doc.setFont('helvetica', row.bold ? 'bold' : 'normal')
    doc.setFontSize(row.bold ? 11 : 9)
    doc.setTextColor(row.bold ? 41 : 110, row.bold ? 41 : 110, row.bold ? 41 : 110)
    doc.text(row.label, PAGE_WIDTH - 70, cursor, { align: 'right' })
    doc.setTextColor(41, 41, 41)
    doc.text(row.value, PAGE_WIDTH - MARGIN, cursor, { align: 'right' })
    cursor += row.bold ? 8 : 6
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(`Currency: ${settings.currency}`, PAGE_WIDTH - MARGIN, cursor + 2, { align: 'right' })
  return cursor + 8
}

function saveOrOpen(doc: jsPDF, filename: string, open: boolean): void {
  if (open) {
    const url = doc.output('bloburl')
    window.open(url, '_blank', 'noopener,noreferrer')
  } else {
    doc.save(filename)
  }
}

export function createInvoicePdf(
  invoice: Invoice,
  items: InvoiceItem[],
  client: Client | undefined,
  payments: Payment[],
  refunds: Refund[],
  settings: BusinessSettings
): jsPDF {
  const doc = createDoc()
  let y = drawBusinessHeader(doc, settings, 'INVOICE', invoice.number)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(110, 110, 110)
  doc.text(`Issued ${formatDate(invoice.issueDate, settings.dateFormat)}`, MARGIN, y)
  doc.text(`Due ${formatDate(invoice.dueDate, settings.dateFormat)}`, 90, y)
  y += 10
  y = clientBlock(doc, client, y)
  y += 6
  y = itemRows(doc, items, y, settings)
  const totals = computeTotals(items, invoice.discount, settings.taxInclusive)
  const balance = invoiceBalance(invoice, payments, refunds)
  y = totalsBlock(
    doc,
    y,
    [
      { label: 'Subtotal', value: formatCurrency(totals.subtotal, settings) },
      ...(totals.discount > 0 ? [{ label: 'Discount', value: `−${formatCurrency(totals.discount, settings)}` }] : []),
      { label: 'Tax', value: formatCurrency(totals.taxAmount, settings) },
      { label: 'Total', value: formatCurrency(invoice.total, settings), bold: true },
      { label: 'Paid', value: formatCurrency(balance.netPaid, settings) },
      { label: 'Balance due', value: formatCurrency(balance.balance, settings), bold: true }
    ],
    settings
  )
  if (invoice.notes) {
    y = ensureSpace(doc, y + 4, 16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('NOTES', MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(41, 41, 41)
    doc.text(doc.splitTextToSize(invoice.notes, CONTENT_WIDTH) as string[], MARGIN, y + 5)
  }
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(`Payment terms: ${invoice.terms || `Net ${settings.defaultPaymentTerms}`}`, MARGIN, PAGE_HEIGHT - 20)
  drawFooter(doc, settings)
  return doc
}

export function downloadInvoicePdf(
  invoice: Invoice,
  items: InvoiceItem[],
  client: Client | undefined,
  payments: Payment[],
  refunds: Refund[],
  settings: BusinessSettings,
  open = false
): void {
  saveOrOpen(
    createInvoicePdf(invoice, items, client, payments, refunds, settings),
    `${invoice.number}.pdf`,
    open
  )
}

export function createQuotePdf(
  quote: Quote,
  items: QuoteItem[],
  client: Client | undefined,
  settings: BusinessSettings
): jsPDF {
  const doc = createDoc()
  let y = drawBusinessHeader(doc, settings, 'QUOTE', quote.number)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(110, 110, 110)
  doc.text(`Issued ${formatDate(quote.issueDate, settings.dateFormat)}`, MARGIN, y)
  doc.text(`Valid until ${formatDate(quote.expiryDate, settings.dateFormat)}`, 90, y)
  y += 10
  y = clientBlock(doc, client, y)
  y += 6
  y = itemRows(doc, items, y, settings)
  const totals = computeTotals(items, quote.discount, settings.taxInclusive)
  y = totalsBlock(
    doc,
    y,
    [
      { label: 'Subtotal', value: formatCurrency(totals.subtotal, settings) },
      ...(totals.discount > 0 ? [{ label: 'Discount', value: `−${formatCurrency(totals.discount, settings)}` }] : []),
      { label: 'Tax', value: formatCurrency(totals.taxAmount, settings) },
      { label: 'Total', value: formatCurrency(quote.total, settings), bold: true }
    ],
    settings
  )
  if (quote.notes) {
    y = ensureSpace(doc, y + 4, 16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('NOTES', MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(41, 41, 41)
    doc.text(doc.splitTextToSize(quote.notes, CONTENT_WIDTH) as string[], MARGIN, y + 5)
  }
  drawFooter(doc, settings)
  return doc
}

export function downloadQuotePdf(
  quote: Quote,
  items: QuoteItem[],
  client: Client | undefined,
  settings: BusinessSettings,
  open = false
): void {
  saveOrOpen(createQuotePdf(quote, items, client, settings), `${quote.number}.pdf`, open)
}

export function downloadPriceListPdf(products: Product[], settings: BusinessSettings): void {
  const doc = createDoc()
  let y = drawBusinessHeader(doc, settings, 'PRICE LIST', `Updated ${formatDate(new Date().toISOString().slice(0, 10), settings.dateFormat)}`)
  y = drawTableHeader(doc, y, [
    { label: 'Product', x: MARGIN },
    { label: 'SKU', x: 95 },
    { label: 'Cost', x: 132, align: 'right' },
    { label: 'Price', x: 158, align: 'right' },
    { label: 'Margin', x: PAGE_WIDTH - MARGIN, align: 'right' }
  ])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  for (const product of products) {
    y = ensureSpace(doc, y, 8)
    const margin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0
    doc.setTextColor(41, 41, 41)
    doc.text(doc.splitTextToSize(product.name, 70) as string[], MARGIN, y)
    doc.text(product.sku || '—', 95, y)
    doc.text(formatCurrency(product.cost, settings), 132, y, { align: 'right' })
    doc.text(formatCurrency(product.price, settings), 158, y, { align: 'right' })
    doc.text(`${margin.toFixed(1)}%`, PAGE_WIDTH - MARGIN, y, { align: 'right' })
    y += 7
  }
  drawFooter(doc, settings)
  saveOrOpen(doc, 'price-list.pdf', false)
}

export function downloadReportPdf(
  title: string,
  subtitle: string,
  kpis: { label: string; value: string }[],
  points: MonthlyPoint[],
  settings: BusinessSettings
): void {
  const doc = createDoc()
  let y = drawBusinessHeader(doc, settings, 'REPORT', `${title} · ${subtitle}`)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(41, 41, 41)
  y += 4
  for (const kpi of kpis) {
    doc.text(`${kpi.label}: ${kpi.value}`, MARGIN, y)
    y += 6
  }
  y += 4
  y = drawTableHeader(doc, y, [
    { label: 'Month', x: MARGIN },
    { label: 'Revenue', x: 90, align: 'right' },
    { label: 'Expenses', x: 130, align: 'right' },
    { label: 'Profit', x: PAGE_WIDTH - MARGIN, align: 'right' }
  ])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  for (const point of points) {
    y = ensureSpace(doc, y, 8)
    doc.setTextColor(41, 41, 41)
    doc.text(point.month, MARGIN, y)
    doc.text(formatCurrency(point.revenue, settings), 90, y, { align: 'right' })
    doc.text(formatCurrency(point.expenses, settings), 130, y, { align: 'right' })
    doc.text(formatCurrency(point.profit, settings), PAGE_WIDTH - MARGIN, y, { align: 'right' })
    y += 6
  }
  drawFooter(doc, settings)
  saveOrOpen(doc, `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`, false)
}

export function downloadClientStatementPdf(
  client: Client,
  invoices: Invoice[],
  payments: Payment[],
  refunds: Refund[],
  settings: BusinessSettings
): void {
  const doc = createDoc()
  let y = drawBusinessHeader(doc, settings, 'STATEMENT', formatDate(new Date().toISOString().slice(0, 10), settings.dateFormat))
  y = clientBlock(doc, client, y, 'Statement for')
  y += 6
  y = drawTableHeader(doc, y, [
    { label: 'Invoice', x: MARGIN },
    { label: 'Issued', x: 70 },
    { label: 'Total', x: 120, align: 'right' },
    { label: 'Paid', x: 155, align: 'right' },
    { label: 'Balance', x: PAGE_WIDTH - MARGIN, align: 'right' }
  ])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  let outstanding = 0
  for (const invoice of invoices) {
    y = ensureSpace(doc, y, 8)
    const balance = invoiceBalance(invoice, payments, refunds)
    outstanding += Math.max(0, balance.balance)
    doc.setTextColor(41, 41, 41)
    doc.text(invoice.number, MARGIN, y)
    doc.text(formatDate(invoice.issueDate, settings.dateFormat), 70, y)
    doc.text(formatCurrency(invoice.total, settings), 120, y, { align: 'right' })
    doc.text(formatCurrency(balance.netPaid, settings), 155, y, { align: 'right' })
    doc.text(formatCurrency(balance.balance, settings), PAGE_WIDTH - MARGIN, y, { align: 'right' })
    y += 6
  }
  y = totalsBlock(doc, y + 4, [{ label: 'Outstanding balance', value: formatCurrency(outstanding, settings), bold: true }], settings)
  drawFooter(doc, settings)
  saveOrOpen(doc, `statement-${client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`, false)
}
