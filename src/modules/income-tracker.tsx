import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import { IncomeExpenseTransaction } from '../lib/database'

export const IncomeTracker: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, incomeTransactions, addIncomeTransaction, removeIncomeTransaction, updateIncomeTransaction, setIncomeTransactions } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state
  const [form, setForm] = useState<Partial<IncomeExpenseTransaction>>({
    date: new Date(),
    description: '',
    category: 'Product Sales',
    subcategory: '',
    amount: 0,
    taxAmount: 0,
    accountId: '',
    paymentMethod: 'credit-card',
    clientId: null,
    relatedInvoiceId: null,
    relatedOrderId: null,
    referenceNumber: '',
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Load initial transactions
  useEffect(() => {
    // Transactions are already in store state
  }, [incomeTransactions])

  const handleShowForm = (id?: string) => {
    if (id) {
      // Edit mode
      const transaction = incomeTransactions.find(t => t.id === id)
      if (transaction) {
        setForm({
          ...transaction,
          date: new Date(transaction.date),
          amount: transaction.amount,
          taxAmount: transaction.taxAmount || 0
        })
        setEditingId(id)
      }
    } else {
      // Add mode
      setForm({
        date: new Date(),
        description: '',
        category: 'Product Sales',
        subcategory: '',
        amount: 0,
        taxAmount: 0,
        accountId: '',
        paymentMethod: 'credit-card',
        clientId: null,
        relatedInvoiceId: null,
        relatedOrderId: null,
        referenceNumber: '',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleHideForm = () => {
    setShowForm(false)
    setForm({
      date: new Date(),
      description: '',
      category: 'Product Sales',
      subcategory: '',
      amount: 0,
      taxAmount: 0,
      accountId: '',
      paymentMethod: 'credit-card',
      clientId: null,
      relatedInvoiceId: null,
      relatedOrderId: null,
      referenceNumber: '',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      const transaction: IncomeExpenseTransaction = {
        ...form,
        id: editingId || `inc-${Date.now()}`,
        date: form.date,
        taxAmount: form.taxAmount || 0,
        createdAt: form.createdAt || new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        // Update existing
        await updateIncomeTransaction(editingId, {
          ...transaction,
          date: form.date,
          description: form.description,
          category: form.category,
          subcategory: form.subcategory,
          amount: form.amount,
          taxAmount: form.taxAmount,
          accountId: form.accountId,
          paymentMethod: form.paymentMethod,
          clientId: form.clientId,
          relatedInvoiceId: form.relatedInvoiceId,
          relatedOrderId: form.relatedOrderId,
          referenceNumber: form.referenceNumber,
          notes: form.notes
        })
      } else {
        // Add new
        await addIncomeTransaction(transaction)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save transaction:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Income Tracker</h2>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Total Income</h4>
          <p className="text-2xl font-bold">{incomeTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0)
            .toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Transaction Count</h4>
          <p className="text-2xl font-bold">{incomeTransactions.length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">This Month</h4>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Avg per Transaction</h4>
          <p className="text-2xl font-bold">0.00</p>
        </div>
      </div>

      {/* Add Transaction Button */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-3">Add Income Transaction</h3>
        <button
          onClick={() => handleShowForm()}
          className="w-full py-3 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors">
          + Add Income Transaction
        </button>
      </div>

      {/* Form when visible */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-2xl mx-auto">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3 text-update' : 'text-sm font-medium text-[var(--muted)] mb-3 text-add'}">
            {editingId ? 'Edit Income Transaction' : 'Add Income Transaction'}
          </h3>

          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Date</label>
                <input
                  type="date"
                  value={form.date.toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, date: new Date(e.target.value) })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Description</label>
                <input
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Category</label>
                <select
                  value={form.category || ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="Product Sales">Product Sales</option>
                  <option value="Service Fees">Service Fees</option>
                  <option value="Interest Income">Interest Income</option>
                  <option value="Other Income">Other Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Subcategory</label>
                <input
                  value={form.subcategory || ''}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount || 0}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Tax Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.taxAmount || 0}
                  onChange={(e) => setForm({ ...form, taxAmount: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Account</label>
                <select
                  value={form.accountId || ''}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="">Select Account</option>
                  {/* Accounts would be populated here */}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod || ''}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="credit-card">Credit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Client</label>
                <select
                  value={form.clientId || ''}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="">No Client</option>
                  {/* Clients would be populated here */}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Related Invoice</label>
                <select
                  value={form.relatedInvoiceId || ''}
                  onChange={(e) => setForm({ ...form, relatedInvoiceId: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="">No Invoice</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Reference Number</label>
              <input
                value={form.referenceNumber || ''}
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
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
                {editingId ? 'Update' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}