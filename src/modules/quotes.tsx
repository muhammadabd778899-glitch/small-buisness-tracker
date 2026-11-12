import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import { Quote, QuoteLineItem } from '../lib/database'

export const Quotes: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, quotes, quotes: quoteItems, addQuote, updateQuote, removeQuote, addQuoteItem, updateQuoteItem, removeQuoteItem } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Quote form state
  const [form, setForm] = useState<Partial<Quote>>({
    clientId: '',
    issueDate: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'draft',
    lineItems: [],
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    notes: ''
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Quotes already in store
  }, [quotes])

  const handleShowForm = (id?: string, quote?: Quote) => {
    if (id && quote) {
      // Calculate totals from line items
      const lineTotal = quote.lineItems?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0
      const tax = lineTotal * (quote.defaultTaxRate / 100 || 0.08)
      
      setForm({
        ...quote,
        issueDate: new Date(quote.issueDate),
        expiryDate: new Date(quote.expiryDate),
        lineItems: quote.lineItems || [],
        subtotal: lineTotal,
        taxAmount: tax,
        total: lineTotal + tax
      })
      setEditingId(id)
    } else {
      setForm({
        clientId: '',
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        lineItems: [],
        subtotal: 0,
        taxAmount: 0,
        total: 0,
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
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'draft',
      lineItems: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
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

  const handleSave = async () => {
    try {
      const quoteData = {
        ...form,
        id: editingId || `q-${Date.now()}`,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
        status: form.status,
        lineItems: form.lineItems,
        subtotal: form.subtotal,
        taxAmount: form.taxAmount,
        total: form.total,
        notes: form.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        await updateQuote(editingId, {
          clientId: form.clientId,
          issueDate: form.issueDate,
          expiryDate: form.expiryDate,
          status: form.status,
          lineItems: form.lineItems,
          subtotal: form.subtotal,
          taxAmount: form.taxAmount,
          total: form.total,
          notes: form.notes
        })
      } else {
        await addQuote(quoteData)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save quote:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Quotes</h2>

      {/* Quotes Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Total Quotes</h4>
          <p className="text-2xl font-bold">{quotes.length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Sent</h4>
          <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'sent').length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Accepted</h4>
          <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'accepted').length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Expired</h4>
          <p className="text-2xl font-bold">{quotes.filter(q => q.status === 'expired').length}</p>
        </div>
      </div>

      {/* Quotes List */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Quote List</h3>
        {quotes.map((quote) => {
          const client = businessData?.clients?.find(c => c.id === quote.clientId)
          return (
            <div key={quote.id} className="p-3 rounded bg-[var(--background)] mb-2">
              <p className="font-medium text-sm">{quote.invoiceNumber || quote.id}</p>
              <p className="text-xs text-[var(--muted)]">
                Client: {client?.name} | Issue: {new Date(quote.issueDate).toLocaleDateString()} | 
                Status: {quote.status} | Total: ${quote.total.toFixed(2)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Quote Form */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-2xl mx-auto">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingId ? 'Edit Quote' : 'Create New Quote'}
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
                <label className="block text-sm text-[var(--muted)] mb-1">Issue Date</label>
                <input
                  type="date"
                  value={form.issueDate.toISOString().split('T')[0]}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiryDate.toISOString().split('T')[0]}
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
                <option value="accepted">Accepted</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Subtotal</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.subtotal}
                  onChange={(e) => setForm({ ...form, subtotal: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]" disabled
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Tax</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.taxAmount}
                  onChange={(e) => setForm({ ...form, taxAmount: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]" disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Total</label>
              <input
                type="number"
                step="0.01"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]" disabled
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-24 resize-none"
                rows={3}
              ></textarea>
            </div>

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
                {editingId ? 'Update' : 'Create Quote'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}