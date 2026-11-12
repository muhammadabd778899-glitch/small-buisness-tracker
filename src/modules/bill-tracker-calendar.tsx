import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import { Bill } from '../lib/database'

export const BillTrackerCalendar: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, bills, addBill, updateBill, removeBill } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state
  const [form, setForm] = useState<Partial<Bill>>({
    name: '',
    category: 'Operating',
    amount: 0,
    dueDate: new Date(),
    frequency: 'one-time' as 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    accountId: '',
    status: 'pending' as 'pending' | 'paid' | 'overdue',
    paidDate: null as Date | null,
    notes: ''
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Bills already in store
  }, [bills])

  const handleShowForm = (id?: string, bill?: Bill) => {
    if (id && bill) {
      setForm({
        ...bill,
        dueDate: new Date(bill.dueDate),
        paidDate: bill.paidDate ? new Date(bill.paidDate) : null,
        frequency: bill.frequency
      })
      setEditingId(id)
    } else {
      setForm({
        name: '',
        category: 'Operating',
        amount: 0,
        dueDate: new Date(),
        frequency: 'one-time',
        accountId: '',
        status: 'pending',
        paidDate: null,
        notes: ''
      })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleHideForm = () => {
    setShowForm(false)
    setForm({
      name: '',
      category: 'Operating',
      amount: 0,
      dueDate: new Date(),
      frequency: 'one-time',
      accountId: '',
      status: 'pending',
      paidDate: null,
      notes: ''
    })
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      const billData: Bill = {
        ...form,
        id: editingId || `bill-${Date.now()}`,
        name: form.name,
        category: form.category,
        amount: form.amount,
        dueDate: form.dueDate,
        frequency: form.frequency,
        accountId: form.accountId,
        status: form.status,
        paidDate: form.paidDate,
        notes: form.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        await updateBill(editingId, {
          name: form.name,
          category: form.category,
          amount: form.amount,
          dueDate: form.dueDate,
          frequency: form.frequency,
          accountId: form.accountId,
          status: form.status,
          paidDate: form.paidDate,
          notes: form.notes
        })
      } else {
        await addBill(billData)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save bill:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Bill Tracker and Calendar</h2>

      {/* Bills List */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Bills Overview</h3>
        
        {/* Bills status breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          ['pending', 'paid', 'overdue'].forEach(status => {
            const count = bills.filter(b => b.status === status).length
            if (count > 0) {
              const bgClass = status === 'paid' ? 'bg-[var(--success)]' : status === 'overdue' ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]'
              const textClass = status === 'paid' ? 'text-[var(--success)]' : status === 'overdue' ? 'text-[var(--danger)]' : 'text-[var(--warning)]'
              ;(document.getElementById(`bill-${status}`) as HTMLElement | null)?.innerHTML = `
                <div id="bill-${status}" className="p-2 rounded ${bgClass}">
                  <span className="text-${textClass} font-medium">${status}: ${count}</span>
                </div>
              `
            }
          })
        }
      </div>

      {/* Add/Edit Bill Form */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-md">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingId ? 'Edit Bill' : 'Add New Bill'}
          </h3>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Bill Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                <label className="block text-sm text-[var(--muted)] mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate.toISOString().split('T')[0]}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              >
                <option value="Operating">Operating</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Marketing">Marketing</option>
                <option value="Equipment">Equipment</option>
                <option value="Materials">Materials</option>
                <option value="Loan">Loan</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="one-time">One-Time</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
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
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Paid Date</label>
              <input
                type="date"
                value={form.paidDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setForm({ ...form, paidDate: e.target.value ? new Date(e.target.value) : null })}
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
                {editingId ? 'Update' : 'Add Bill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Paid/Overdue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Pending</p>
          <p className="text-2xl font-bold text-[var(--warning)]">{bills.filter(b => b.status === 'pending').length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Paid</p>
          <p className="text-2xl font-bold text-[var(--success)]">{bills.filter(b => b.status === 'paid').length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Overdue</p>
          <p className="text-2xl font-bold text-[var(--danger)]">{bills.filter(b => b.status === 'overdue').length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Total</p>
          <p className="text-2xl font-bold">
            {bills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}