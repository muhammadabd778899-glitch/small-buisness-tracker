import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const PaymentsRefunds: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, payments, refunds, addPayment, addRefund, removePayment, removeRefund } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state for payment
  const [paymentForm, setPaymentForm] = useState<Partial<{
    id: string
    clientId: string
    clientName: string
    clientCompany: string
    date: Date
    amount: number
    paymentMethod: string
    transactionId: string
    notes: string
    type: 'payment' | 'refund'
    status: 'pending' | 'completed' | 'failed'
    invoiceId: string | null
    orderId: string | null
    createdAt: Date
    updatedAt: Date
  }>>({
    id: '',
    clientId: '',
    clientName: '',
    clientCompany: '',
    date: new Date(),
    amount: 0,
    paymentMethod: 'bank-transfer',
    transactionId: '',
    notes: '',
    type: 'payment',
    status: 'pending',
    invoiceId: null,
    orderId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  // Form state for refund
  const [refundForm, setRefundForm] = useState<Partial<{
    id: string
    clientId: string
    clientName: string
    clientCompany: string
    date: Date
    amount: number
    paymentMethod: string
    transactionId: string
    notes: string
    type: 'refund'
    status: 'pending' | 'completed'
    invoiceId: string
    orderId: string | null
    createdAt: Date
    updatedAt: Date
  }>>({
    id: '',
    clientId: '',
    clientName: '',
    clientCompany: '',
    date: new Date(),
    amount: 0,
    paymentMethod: 'bank-transfer',
    transactionId: '',
    notes: '',
    type: 'refund',
    status: 'pending',
    invoiceId: '',
    orderId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showRefundForm, setShowRefundForm] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editingRefundId, setEditingRefundId] = useState<string | null>(null)

  useEffect(() => {
    // Payments and refunds already in store
  }, [payments, refunds])

  const handleShowPaymentForm = (id?: string, payment?: any) => {
    if (id && payment) {
      setPaymentForm({
        id: payment.id,
        clientId: payment.clientId,
        clientName: payment.clientName,
        clientCompany: payment.clientCompany,
        date: payment.date ? new Date(payment.date) : new Date(),
        amount: payment.amount,
        paymentMethod: payment.paymentMethod || 'bank-transfer',
        transactionId: payment.transactionId || '',
        notes: payment.notes || '',
        type: payment.type || 'payment',
        status: payment.status || 'pending',
        invoiceId: payment.invoiceId || null,
        orderId: payment.orderId || null,
        createdAt: payment.createdAt ? new Date(payment.createdAt) : new Date(),
        updatedAt: payment.updatedAt ? new Date(payment.updatedAt) : new Date()
      })
      setEditingPaymentId(id)
    } else {
      setPaymentForm({
        id: '',
        clientId: '',
        clientName: '',
        clientCompany: '',
        date: new Date(),
        amount: 0,
        paymentMethod: 'bank-transfer',
        transactionId: '',
        notes: '',
        type: 'payment',
        status: 'pending',
        invoiceId: null,
        orderId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setEditingPaymentId(null)
    }
    setShowPaymentForm(true)
  }

  const handleHidePaymentForm = () => {
    setShowPaymentForm(false)
    setEditingPaymentId(null)
    setPaymentForm({
      id: '',
      clientId: '',
      clientName: '',
      clientCompany: '',
      date: new Date(),
      amount: 0,
      paymentMethod: 'bank-transfer',
      transactionId: '',
      notes: '',
      type: 'payment',
      status: 'pending',
      invoiceId: null,
      orderId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  const handleShowRefundForm = (id?: string, refund?: any) => {
    if (id && refund) {
      setRefundForm({
        id: refund.id,
        clientId: refund.clientId,
        clientName: refund.clientName,
        clientCompany: refund.clientCompany,
        date: refund.date ? new Date(refund.date) : new Date(),
        amount: refund.amount,
        paymentMethod: refund.paymentMethod || 'bank-transfer',
        transactionId: refund.transactionId || '',
        notes: refund.notes || '',
        type: 'refund',
        status: refund.status || 'pending',
        invoiceId: refund.invoiceId || '',
        orderId: refund.orderId || null,
        createdAt: refund.createdAt ? new Date(refund.createdAt) : new Date(),
        updatedAt: refund.updatedAt ? new Date(refund.updatedAt) : new Date()
      })
      setEditingRefundId(id)
    } else {
      setRefundForm({
        id: '',
        clientId: '',
        clientName: '',
        clientCompany: '',
        date: new Date(),
        amount: 0,
        paymentMethod: 'bank-transfer',
        transactionId: '',
        notes: '',
        type: 'refund',
        status: 'pending',
        invoiceId: '',
        orderId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setEditingRefundId(null)
    }
    setShowRefundForm(true)
  }

  const handleHideRefundForm = () => {
    setShowRefundForm(false)
    setEditingRefundId(null)
    setRefundForm({
      id: '',
      clientId: '',
      clientName: '',
      clientCompany: '',
      date: new Date(),
      amount: 0,
      paymentMethod: 'bank-transfer',
      transactionId: '',
      notes: '',
      type: 'refund',
      status: 'pending',
      invoiceId: '',
      orderId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  const handleSavePayment = async () => {
    try {
      const paymentData: any = {
        id: editingPaymentId || `payment-${Date.now()}`,
        clientId: paymentForm.clientId,
        clientName: paymentForm.clientName,
        clientCompany: paymentForm.clientCompany,
        date: paymentForm.date,
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod,
        transactionId: paymentForm.transactionId,
        notes: paymentForm.notes,
        type: paymentForm.type || 'payment',
        status: paymentForm.status || 'pending',
        invoiceId: paymentForm.invoiceId,
        orderId: paymentForm.orderId,
        createdAt: paymentForm.updatedAt,
        updatedAt: new Date()
      }

      if (editingPaymentId) {
        // Would call updatePayment
      } else {
        await addPayment(paymentData)
      }

      handleHidePaymentForm()
    } catch (error) {
      console.error('Failed to save payment:', error)
    }
  }

  const handleSaveRefund = async () => {
    try {
      const refundData: any = {
        id: editingRefundId || `refund-${Date.now()}`,
        clientId: refundForm.clientId,
        clientName: refundForm.clientName,
        clientCompany: refundForm.clientCompany,
        date: refundForm.date,
        amount: refundForm.amount,
        paymentMethod: refundForm.paymentMethod,
        transactionId: refundForm.transactionId,
        notes: refundForm.notes,
        type: 'refund',
        status: refundForm.status || 'pending',
        invoiceId: refundForm.invoiceId,
        orderId: refundForm.orderId,
        createdAt: refundForm.updatedAt,
        updatedAt: new Date()
      }

      if (editingRefundId) {
        // Would call updateRefund
      } else {
        await addRefund(refundData)
      }

      handleHideRefundForm()
    } catch (error) {
      console.error('Failed to save refund:', error)
    }
  }

  const handleRemovePayment = async (id: string) => {
    try {
      await removePayment(id)
    } catch (error) {
      console.error('Failed to remove payment:', error)
    }
  }

  const handleRemoveRefund = async (id: string) => {
    try {
      await removeRefund(id)
    } catch (error) {
      console.error('Failed to remove refund:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Payments and Refunds</h2>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Total Payments</h4>
          <p className="text-2xl font-bold">{payments.length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Total Refunded</h4>
          <p className="text-2xl font-bold text-[var(--warning)]">
            ${refunds.reduce((sum, r) => sum + r.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Pending</h4>
          <p className="text-2xl font-bold text-[var(--warning)]">
            {payments.filter(p => p.status === 'pending').length}
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Net</h4>
          <p className="text-2xl font-bold">
            ${(payments.reduce((sum, p) => sum + p.amount, 0) - refunds.reduce((sum, r) => sum + r.amount, 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      {/* Add Payment Form */}
      {showPaymentForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-md mx-auto mb-8">
          <h3 className={editingPaymentId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingPaymentId ? 'Edit Payment' : 'Record Payment'}
          </h3>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Client ID</label>
              <input
                value={paymentForm.clientId}
                onChange={(e) => setPaymentForm({ ...paymentForm, clientId: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Client Name</label>
              <input
                value={paymentForm.clientName}
                onChange={(e) => setPaymentForm({ ...paymentForm, clientName: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Date</label>
                <input
                  type="date"
                  value={paymentForm.date.toISOString().split('T')[0]}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: new Date(e.target.value) })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
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
              <label className="block text-sm text-[var(--muted)] mb-1">Transaction ID</label>
              <input
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Invoice ID</label>
              <input
                value={paymentForm.invoiceId || ''}
                onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-24 resize-none"
                rows={3}
              ></textarea>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleHidePaymentForm}
                className="px-4 py-2 rounded text-sm text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                className="px-4 py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
              >
                {editingPaymentId ? 'Update' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Refund Form */}
      {showRefundForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-md mx-auto mb-8">
          <h3 className={editingRefundId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingRefundId ? 'Edit Refund' : 'Record Refund'}
          </h3>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Client ID</label>
              <input
                value={refundForm.clientId}
                onChange={(e) => setRefundForm({ ...refundForm, clientId: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Client Name</label>
              <input
                value={refundForm.clientName}
                onChange={(e) => setRefundForm({ ...refundForm, clientName: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Date</label>
                <input
                  type="date"
                  value={refundForm.date.toISOString().split('T')[0]}
                  onChange={(e) => setRefundForm({ ...refundForm, date: new Date(e.target.value) })}
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
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Invoice ID</label>
              <input
                value={refundForm.invoiceId}
                onChange={(e) => setRefundForm({ ...refundForm, invoiceId: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
              <textarea
                value={refundForm.notes}
                onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-24 resize-none"
                rows={3}
              ></textarea>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleHideRefundForm}
                className="px-4 py-2 rounded text-sm text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRefund}
                className="px-4 py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
              >
                {editingRefundId ? 'Update' : 'Record Refund'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Payment History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Type</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-[var(--soft-bg)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={payment.status === 'pending' ? 'text-[var(--warning)] font-medium' : payment.status === 'completed' ? 'text-[var(--success)] font-medium' : 'text-[var(--danger)] font-medium'}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.type === 'payment' ? 'Payment' : 'Refund'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Refund History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-[var(--soft-bg)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(refund.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {refund.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${refund.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {refund.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={refund.status === 'pending' ? 'text-[var(--warning)] font-medium' : 'text-[var(--success)] font-medium'}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {refund.invoiceId ? '#' + refund.invoiceId : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}