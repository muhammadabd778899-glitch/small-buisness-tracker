import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import { Payment, Refund } from '../lib/database'

export const PaymentsAndRefunds: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, payments, invoices, clients, addPayment, updatePayment, removePayment, addRefund, updateRefund, removeRefund } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Payment form state
  const [form, setForm] = useState<Partial<Payment>>({
    invoiceId: null,
    clientId: '',
    date: new Date(),
    amount: 0,
    paymentMethod: 'credit-card',
    accountId: '',
    reference: '',
    notes: ''
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Payments already in store
  }, [payments])

  const handleShowForm = (id?: string, payment?: Payment) => {
    if (id && payment) {
      setForm({
        ...payment,
        date: new Date(payment.date)
      })
      setEditingId(id)
    } else {
      setForm({
        invoiceId: null,
        clientId: '',
        date: new Date(),
        amount: 0,
        paymentMethod: 'credit-card',
        accountId: '',
        reference: '',
        notes: ''
      })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleHideForm = () => {
    setShowForm(false)
    setForm({
      invoiceId: null,
      clientId: '',
      date: new Date(),
      amount: 0,
      paymentMethod: 'credit-card',
      accountId: '',
      reference: '',
      notes: ''
    })
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      const paymentData: Payment = {
        ...form,
        id: editingId || `pay-${Date.now()}`,
        invoiceId: form.invoiceId,
        clientId: form.clientId,
        date: form.date,
        amount: form.amount,
        paymentMethod: form.paymentMethod,
        accountId: form.accountId,
        reference: form.reference,
        notes: form.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        await updatePayment(editingId, {
          invoiceId: form.invoiceId,
          clientId: form.clientId,
          date: form.date,
          amount: form.amount,
          paymentMethod: form.paymentMethod,
          accountId: form.accountId,
          reference: form.reference,
          notes: form.notes
        })
      } else {
        await addPayment(paymentData)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save payment:', error)
    }
  }

  // Refund form
  const [refundForm, setRefundForm] = useState<Partial<Refund>>({
    invoiceId: '',
    clientId: '',
    date: new Date(),
    amount: 0,
    paymentMethod: 'cash',
    notes: ''
  })

  const [showRefundForm, setShowRefundForm] = useState(false)

  const handleShowRefundForm = (invoiceId: string, clientId: string) => {
    setRefundForm({
      invoiceId,
      clientId,
      date: new Date(),
      amount: 0,
      paymentMethod: 'cash',
      notes: ''
    })
    setShowRefundForm(true)
  }

  const handleHideRefundForm = () => {
    setShowRefundForm(false)
    setRefundForm({
      invoiceId: '',
      clientId: '',
      date: new Date(),
      amount: 0,
      paymentMethod: 'cash',
      notes: ''
    })
  }

  const handleSaveRefund = async () => {
    try {
      const refundData: Refund = {
        ...refundForm,
        id: `ref-${Date.now()}`,
        invoiceId: refundForm.invoiceId,
        clientId: refundForm.clientId,
        date: refundForm.date,
        amount: refundForm.amount,
        paymentMethod: refundForm.paymentMethod,
        notes: refundForm.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await addRefund(refundData)
      handleHideRefundForm()
    } catch (error) {
      console.error('Failed to save refund:', error)
    }
  }

  const handleCancelRefund = () => {
    setShowRefundForm(false)
    setRefundForm({
      invoiceId: '',
      clientId: '',
      date: new Date(),
      amount: 0,
      paymentMethod: 'cash',
      notes: ''
    })
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Payments and Refunds</h2>

      {/* Payments Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Add Payment</h3>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Client</label>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="">Select Client</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Invoice</label>
            <select
              value={form.invoiceId ? 'has-invoice' : 'no-invoice'}
              onChange={(e) => setForm({ ...form, invoiceId: e.target.value === 'has-invoice' ? 'INV-' + Date.now() : null })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="no-invoice">No Invoice (Unallocated)</option>
              <option value="has-invoice">Existing Invoice</option>
            </select>
          </div>
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
            <label className="block text-sm text-[var(--muted)] mb-1">Payment Method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="credit-card">Credit Card</option>
              <option value="bank-transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="paypal">PayPal</option>
              <option value="check">Check</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">Reference</label>
          <input
            value={form.reference || ''}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
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

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleHideForm}
            className="px-3 py-1 rounded text-sm text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
          >
            Add Payment
          </button>
        </div>
      </div>

      {/* Refunds Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Record Refund</h3>
        
        {showRefundForm ? (
          <div>
            <p className="text-sm text-[var(--muted)] mb-2">
              Refund for invoice: {refundForm.invoiceId}
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Payment Method</label>
                <select
                  value={refundForm.paymentMethod}
                  onChange={(e) => setRefundForm({ ...refundForm, paymentMethod: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="cash">Cash</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="bank-transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
              <textarea
                value={refundForm.notes || ''}
                onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-32 resize-none"
                rows={3}
              ></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelRefund}
                className="px-3 py-1 rounded text-sm text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRefund}
                className="px-3 py-1 rounded bg-[var(--danger)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
              >
                Record Refund
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => handleShowRefundForm('', '')}
              className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors mb-3"
            >
              + Record Refund
            </button>
          </div>
        )}

        {/* Refunds List */}
        <p className="text-sm text-[var(--muted)] mb-2">Recent Refunds</p>
        {/* Would list refunds from store */}
      </div>

      {/* Payment Summary */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Payment Summary</h3>
        <p className="text-sm text-[var(--muted)]">
          Track all payments linked to invoices and unallocated payments.
        </p>
        {/* Would show payment totals from store */}
      </div>
    </div>
  )
}