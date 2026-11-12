import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import { Invoice, InvoiceLineItem } from '../lib/database'
import { jsPDF } from 'jspdf'
import autoTable from 'auto-table'

export const InvoiceGenerator: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, invoices, clients, products, addInvoice, updateInvoice, removeInvoice } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Invoice form state
  const [form, setForm] = useState<Partial<Invoice>>({
    clientId: '',
    invoiceNumber: '',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'draft',
    lineItems: [],
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    paidAmount: 0,
    balanceDue: 0,
    paymentTerms: 'Net 30',
    notes: ''
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Invoices already in store
  }, [invoices])

  const handleShowForm = (id?: string, invoice?: Invoice) => {
    if (id && invoice) {
      // Calculate totals from line items
      const lineTotal = invoice.lineItems?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0
      const taxRate = invoice.defaultTaxRate / 100 || 0.08
      const tax = lineTotal * taxRate
      const total = lineTotal + tax
      
      // Calculate paid amount from payments
      const paymentsForInvoice = businessData?.payments?.filter((p: any) => p.invoiceId === invoice.id) || []
      const paidAmount = paymentsForInvoice.reduce((sum: number, p: any) => sum + p.amount, 0)
      const balanceDue = total - paidAmount
      
      setForm({
        ...invoice,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        lineItems: invoice.lineItems || [],
        subtotal: lineTotal,
        taxAmount: tax,
        total: total,
        paidAmount: paidAmount,
        balanceDue: balanceDue
      })
      setEditingId(id)
    } else {
      setForm({
        clientId: '',
        invoiceNumber: 'INV-' + Date.now(),
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        lineItems: [],
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        paidAmount: 0,
        balanceDue: 0,
        paymentTerms: 'Net 30',
        notes: ''
      })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleHideForm = () => {
    setShowForm(false)
    setForm({
      clientId: '',
      invoiceNumber: '',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'draft',
      lineItems: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      paidAmount: 0,
      balanceDue: 0,
      paymentTerms: 'Net 30',
      notes: ''
    })
    setEditingId(null)
  }

  const calculateTotals = (lineItems: any[]) => {
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
    const taxRate = form.defaultTaxRate / 100 || 0.08
    const taxAmount = subtotal * taxRate
    const total = subtotal + taxAmount
    
    setForm(prev => ({ ...prev, subtotal, taxAmount, total }))
  }

  const addLineItem = () => {
    // Add empty line item
    const newItem: InvoiceLineItem = {
      id: `ili-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      invoiceId: editingId || '',
      productId: null,
      materialId: null,
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 0.08,
      totalPrice: 0
    }
    
    setForm(prev => ({ ...prev, lineItems: [...prev.lineItems, newItem] }))
  }

  const removeLineItem = (itemId: string) => {
    setForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((item: any) => item.id !== itemId)
    }))
  }

  const handleSave = async () => {
    try {
      const invoiceData: Invoice = {
        ...form,
        id: editingId || `inv-${Date.now()}`,
        clientId: form.clientId,
        invoiceNumber: form.invoiceNumber,
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        status: form.status,
        lineItems: form.lineItems,
        subtotal: form.subtotal,
        taxAmount: form.taxAmount,
        total: form.total,
        paidAmount: form.paidAmount,
        balanceDue: form.balanceDue,
        paymentTerms: form.paymentTerms,
        notes: form.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        await updateInvoice(editingId, {
          clientId: form.clientId,
          invoiceNumber: form.invoiceNumber,
          issueDate: form.issueDate,
          dueDate: form.dueDate,
          status: form.status,
          lineItems: form.lineItems,
          subtotal: form.subtotal,
          taxAmount: form.taxAmount,
          total: form.total,
          paidAmount: form.paidAmount,
          balanceDue: form.balanceDue,
          paymentTerms: form.paymentTerms,
          notes: form.notes
        })
      } else {
        await addInvoice(invoiceData)
      }

      // Generate PDF
      try {
        generateInvoicePDF(invoiceData)
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError)
        // Continue even if PDF fails
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save invoice:', error)
    }
  }

  const generateInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF()
    
    // Header with business info
    const business = businessData?.businessSettings || {}
    const currencySymbol = business.currencySymbol || '$'
    
    doc.setFontSize(18)
    doc.setTextColor(242, 106, 44) // Orange color
    doc.text('INVOICE', doc.getPageWidth() / 2, 20, { align: 'center' })
    
    // Business details
    doc.setFontSize(10)
    doc.setTextColor(41, 41, 41) // Dark gray
    doc.text(`${business.businessName || 'Ultimate Small Business Manager'}`, 10, 30)
    if (business.address) doc.text(business.address, 10, 38)
    if (business.phone) doc.text(business.phone, 10, 44)
    if (business.email) doc.text(business.email, 10, 50)
    
    // Invoice details
    doc.setTextColor(41, 41, 41)
    doc.setFontSize(10)
    const invoiceInfo = [
      `Invoice #: ${invoice.invoiceNumber}`,
      `Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`,
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
      `Payment Terms: ${invoice.paymentTerms}`
    ]
    invoiceInfo.forEach((line: string, index: number) => {
      doc.text(line, 10, 60 + index * 8)
    })
    
    // Client info
    const client = businessData?.clients?.find((c: any) => c.id === invoice.clientId)
    let yPos = 60 + invoiceInfo.length * 8 + 10
    doc.setFontSize(10)
    if (client) {
      doc.setTextColor(41, 41, 41)
      doc.text(`Bill To:`, 10, yPos)
      yPos += 5
      doc.text(client.name || '', 10, yPos)
      yPos += 5
      if (client.email) { doc.text(client.email, 10, yPos); yPos += 5 }
      if (client.phone) { doc.text(client.phone, 10, yPos); yPos += 5 }
      if (client.company) { doc.text(client.company, 10, yPos); yPos += 8 }
    }
    
    // Table headers
    const columns = [['Description', 80], ['Qty', 30], ['Unit Price', 40], ['Amount', 40]]
    const rows = invoice.lineItems?.map((item: any) => [
      item.description || item.product?.name || '',
      item.quantity.toString(),
      `${currencySymbol}${item.unitPrice.toFixed(2)}`,
      `${currencySymbol}${item.totalPrice.toFixed(2)}`
    ]]) || []
    
    // Add totals row
    rows.push([ 'Total', '', `${currencySymbol}${invoice.subtotal.toFixed(2)}`, `${currencySymbol}${invoice.total.toFixed(2)}` ])
    
    autoTable(doc, {
      startY: yPos + 10,
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: rows,
      theme: 'striped',
      headStyles: { fill: [242, 106, 44], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 30 }, 2: { cellWidth: 40 }, 3: { cellWidth: 40 } }
    })
    
    // Summary section
    const finalY = (doc as any).lastAutoTable.finalY + 10
    
    doc.setFontSize(10)
    doc.setTextColor(41, 41, 41)
    doc.text(`Subtotal: ${currencySymbol}${invoice.subtotal.toFixed(2)}`, 10, finalY)
    doc.text(`Tax (${invoice.defaultTaxRate}%): ${currencySymbol}${invoice.taxAmount.toFixed(2)}`, 10, finalY + 5)
    doc.text(`Total: ${currencySymbol}${invoice.total.toFixed(2)}`, 10, finalY + 10, { fontStyle: 'bold' })
    doc.text(`Paid: ${currencySymbol}${invoice.paidAmount.toFixed(2)}`, 10, finalY + 15)
    doc.text(`Balance Due: ${currencySymbol}${invoice.balanceDue.toFixed(2)}`, 10, finalY + 20, { fontStyle: 'bold' })
    doc.text(`Payment Terms: ${invoice.paymentTerms}`, 10, finalY + 25)
    if (invoice.notes) {
      doc.text(`Notes: ${invoice.notes}`, 10, finalY + 30)
    }
    
    // Download
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`)
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Invoice Generator</h2>

      {/* Invoice Form */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-2xl mx-auto">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingId ? 'Edit Invoice' : 'Create New Invoice'}
          </h3>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Client</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              >
                <option value="">Select Client</option>
                {/* Clients would be populated here */}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Invoice Number</label>
                <input
                  value={form.invoiceNumber}
                  onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate.toISOString().split('T')[0]}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Payment Terms</label>
                <select
                  value={form.paymentTerms}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="Net 30">Net 30</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 45">Net 45</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.defaultTaxRate}
                  onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-32 resize-none"
                rows={3}
              ></textarea>
            </div>

            {/* Line Items Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {form.lineItems.map((item: any, index: number) => (
                    <tr key={item.id} className="hover:bg-[var(--soft-bg)]">
                      <td className="px-6 py-4">
                        <input
                          value={item.description || ''}
                          onChange={(e) => {
                            const newItems = [...form.lineItems]
                            newItems[index] = { ...newItems[index], description: e.target.value }
                            calculateTotals(newItems)
                            setForm(prev => ({ ...prev, lineItems: newItems }))
                          }}
                          className="w-full py-1 rounded border px-2 text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...form.lineItems]
                            newItems[index] = { ...newItems[index], quantity: Number(e.target.value )}
                            calculateTotals(newItems)
                            setForm(prev => ({ ...prev, lineItems: newItems }))
                          }}
                          className="w-full py-1 rounded border px-2 text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newItems = [...form.lineItems]
                            newItems[index] = { ...newItems[index], unitPrice: Number(e.target.value )}
                            calculateTotals(newItems)
                            setForm(prev => ({ ...prev, lineItems: newItems }))
                          }}
                          className="w-full py-1 rounded border px-2 text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        {item.totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="text-[var(--danger)] text-sm hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="5">
                      <button
                        onClick={addLineItem}
                        className="text-[var(--accent)] text-sm hover:underline"
                      >
                        + Add Line Item
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-[var(--muted)]">Subtotal</p>
                <p className="text-lg font-bold">{form.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Tax</p>
                <p className="text-lg font-bold text-[var(--success)]">{form.taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
            </div>

            <div className="mt-3 flex justify-between">
              <p className="text-lg font-bold">Total</p>
              <p className="text-lg font-bold text-[var(--accent)]">{form.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>

            {/* Paid/Balance Section */}
            {editingId && (
              <div className="mt-6 pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--muted)]">Payments</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-[var(--muted)]">Paid Amount</p>
                    <p className="text-xl font-bold text-[var(--success)]">{form.paidAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)]">Balance Due</p>
                    <p className="text-xl font-bold text-[var(--danger)]">{form.balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleHideForm}
                className="px-4 py-2 rounded text-sm text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
              >
                {editingId ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}