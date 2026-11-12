import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const IncomeTracker: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, incomeTransactions, addIncomeTransaction, removeIncomeTransaction } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state
  const [form, setForm] = useState<{
    date: Date
    description: string
    category: string
    subcategory: string
    amount: number
    accountId: string
    paymentMethod: string
    depositType: 'cash' | 'bank-transfer' | 'check' | 'credit-card'
    notes: string
    createdAt: Date
    updatedAt: Date
  }>({
    date: new Date(),
    description: '',
    category: 'Services',
    subcategory: '',
    amount: 0,
    accountId: '',
    paymentMethod: 'bank-transfer',
    depositType: 'bank-transfer',
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Income transactions already in store
  }, [incomeTransactions])

  const handleShowForm = (id?: string) => {
    if (id) {
      setForm({
        date: new Date(),
        description: '',
        category: 'Services',
        subcategory: '',
        amount: 0,
        accountId: '',
        paymentMethod: 'bank-transfer',
        depositType: 'bank-transfer',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setEditingId(id)
    } else {
      setForm({
        date: new Date(),
        description: '',
        category: 'Services',
        subcategory: '',
        amount: 0,
        accountId: '',
        paymentMethod: 'bank-transfer',
        depositType: 'bank-transfer',
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
      category: 'Services',
      subcategory: '',
      amount: 0,
      accountId: '',
      paymentMethod: 'bank-transfer',
      depositType: 'bank-transfer',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      const incomeData: any = {
        date: form.date,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory,
        amount: form.amount,
        accountId: form.accountId,
        paymentMethod: form.paymentMethod,
        depositType: form.depositType,
        notes: form.notes,
        createdAt: form.updatedAt,
        updatedAt: new Date()
      }

      if (editingId) {
        // Would call updateIncomeTransaction
      } else {
        await addIncomeTransaction(incomeData)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save income:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Income Tracker</h2>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Total Income</h4>
          <p className="text-2xl font-bold text-[var(--success)]">
            {incomeTransactions
              .filter(t => t.amount > 0)
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Transaction Count</h4>
          <p className="text-2xl font-bold">{incomeTransactions.length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Monthly Total</h4>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Top Category</h4>
          <p className="text-2xl font-bold">Services</p>
        </div>
      </div>

      {/* Add Income Button */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <button
          onClick={() => handleShowForm()}
          className="w-full py-3 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
        >
          + Add Income Transaction
        </button>
      </div>

      {/* Form when visible */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-2xl mx-auto">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
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
                  <option value="Services">Services</option>
                  <option value="Products">Products</option>
                  <option value="Interest">Interest</option>
                  <option value="Other">Other</option>
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

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Deposit Type</label>
              <select
                value={form.depositType}
                onChange={(e) => setForm({ ...form, depositType: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              >
                <option value="cash">Cash</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="credit-card">Credit Card</option>
              </select>
            </div>

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
                {editingId ? 'Update' : 'Add Income'}
              </button>
            </div>
          </form>
        </div>
      )}</div>
  )
}