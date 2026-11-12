import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const ExpenseTracker: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, expenseTransactions, addExpenseTransaction, removeExpenseTransaction } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state
  const [form, setForm] = useState<{
    date: Date
    description: string
    category: string
    subcategory: string
    amount: number
    taxAmount: number
    accountId: string
    paymentMethod: string
    supplierId: string | null
    dueDate: Date
    receiptReference: string
    recurring: boolean
    notes: string
    createdAt: Date
    updatedAt: Date
  }>({
    date: new Date(),
    description: '',
    category: 'Materials',
    subcategory: '',
    amount: 0,
    taxAmount: 0,
    accountId: '',
    paymentMethod: 'bank-transfer',
    supplierId: null,
    dueDate: new Date(),
    receiptReference: '',
    recurring: false,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Expenses already in store
  }, [expenseTransactions])

  const handleShowForm = (id?: string) => {
    if (id) {
      // Find the expense transaction - we'll just reset form for editing
      setForm({
        date: new Date(),
        description: '',
        category: 'Materials',
        subcategory: '',
        amount: 0,
        taxAmount: 0,
        accountId: '',
        paymentMethod: 'bank-transfer',
        supplierId: null,
        dueDate: new Date(),
        receiptReference: '',
        recurring: false,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setEditingId(id)
    } else {
      setForm({
        date: new Date(),
        description: '',
        category: 'Materials',
        subcategory: '',
        amount: 0,
        taxAmount: 0,
        accountId: '',
        paymentMethod: 'bank-transfer',
        supplierId: null,
        dueDate: new Date(),
        receiptReference: '',
        recurring: false,
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
      category: 'Materials',
      subcategory: '',
      amount: 0,
      taxAmount: 0,
      accountId: '',
      paymentMethod: 'bank-transfer',
      supplierId: null,
      dueDate: new Date(),
      receiptReference: '',
      recurring: false,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      // Build expense transaction object
      const expenseData: any = {
        date: form.date,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory,
        amount: form.amount,
        taxAmount: form.taxAmount,
        accountId: form.accountId,
        paymentMethod: form.paymentMethod,
        supplierId: form.supplierId,
        dueDate: form.dueDate,
        receiptReference: form.receiptReference,
        recurring: form.recurring,
        notes: form.notes,
        createdAt: form.updatedAt,
        updatedAt: new Date()
      }

      if (editingId) {
        // Would call updateExpenseTransaction
      } else {
        await addExpenseTransaction(expenseData)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save expense:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Expense Tracker</h2>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Total Expenses</h4>
          <p className="text-2xl font-bold text-[var(--danger)]">
            {expenseTransactions
              .filter(t => t.amount > 0)
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Transaction Count</h4>
          <p className="text-2xl font-bold">{expenseTransactions.length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Monthly Total</h4>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Top Category</h4>
          <p className="text-2xl font-bold">Materials</p>
        </div>
      </div>

      {/* Add Expense Button */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <button
          onClick={() => handleShowForm()}
          className="w-full py-3 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
        >
          + Add Expense Transaction
        </button>
      </div>

      {/* Form when visible */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-2xl mx-auto">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingId ? 'Edit Expense Transaction' : 'Add Expense Transaction'}
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
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="Materials">Materials</option>
                  <option value="Operating">Operating</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Subcategory</label>
                <input
                  value={form.subcategory}
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
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Tax Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.taxAmount}
                  onChange={(e) => setForm({ ...form, taxAmount: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Account</label>
                <select
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="">Select Account</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Supplier</label>
                <select
                  value={form.supplierId || ''}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="">No Supplier</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate.toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, dueDate: new Date(e.target.value) })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Receipt Reference</label>
              <input
                value={form.receiptReference}
                onChange={(e) => setForm({ ...form, receiptReference: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Recurring</label>
                <select
                  value={form.recurring ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, recurring: e.target.value === 'true' })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Waste</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.waste || 0}
                  onChange={(e) => setForm({ ...form, waste: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
              <textarea
                value={form.notes}
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
                {editingId ? 'Update' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      )}</div>
  )
}