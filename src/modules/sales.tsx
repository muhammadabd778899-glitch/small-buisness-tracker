import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const Sales: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, sales, clients, products, isLoaded } = useBusinessStore()

  // Form state
  const [form, setForm] = useState<{
    id: string
    clientId: string
    clientName: string
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    total: number
    date: Date
    paymentMethod: string
    status: 'pending' | 'completed' | 'cancelled'
    notes: string
    createdAt: Date
    updatedAt: Date
  }>({
    id: '',
    clientId: '',
    clientName: '',
    productId: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    total: 0,
    date: new Date(),
    paymentMethod: 'bank-transfer',
    status: 'pending',
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Sales already in store
  }, [sales])

  const handleShowForm = (id?: string, sale?: any) => {
    if (id && sale) {
      setForm({
        id: sale.id,
        clientId: sale.clientId,
        clientName: sale.clientName,
        productId: sale.productId,
        productName: sale.productName,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        total: sale.total,
        date: sale.date ? new Date(sale.date) : new Date(),
        paymentMethod: sale.paymentMethod || 'bank-transfer',
        status: sale.status || 'pending',
        notes: sale.notes || '',
        createdAt: sale.createdAt ? new Date(sale.createdAt) : new Date(),
        updatedAt: sale.updatedAt ? new Date(sale.updatedAt) : new Date()
      })
      setEditingId(id)
    } else {
      setForm({
        id: '',
        clientId: '',
        clientName: '',
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        date: new Date(),
        paymentMethod: 'bank-transfer',
        status: 'pending',
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
    setEditingId(null)
    setForm({
      id: '',
      clientId: '',
      clientName: '',
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      date: new Date(),
      paymentMethod: 'bank-transfer',
      status: 'pending',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  const handleSave = async () => {
    try {
      const saleData: any = {
        id: form.id || `sale-${Date.now()}`,
        clientId: form.clientId,
        clientName: form.clientName,
        productId: form.productId,
        productName: form.productName,
        quantity: form.quantity,
        unitPrice: form.unitPrice,
        total: form.total,
        date: form.date,
        paymentMethod: form.paymentMethod,
        status: form.status,
        notes: form.notes,
        createdAt: form.updatedAt,
        updatedAt: new Date()
      }

      if (editingId) {
        // Would call updateSale
      } else {
        // Would call addSale
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save sale:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Sales</h2>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Total Sales</h4>
          <p className="text-2xl font-bold">{sales.length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Revenue</h4>
          <p className="text-2xl font-bold text-[var(--success)]">
            ${sales.reduce((sum, s) => sum + s.total, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Completed</h4>
          <p className="text-2xl font-bold text-[var(--success)]">
            {sales.filter(s => s.status === 'completed').length}
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Average Order</h4>
          <p className="text-2xl font-bold">
            ${(sales.reduce((sum, s) => sum + s.total, 0) / sales.length || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      {/* Add Sale Form */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-md mx-auto mb-8">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingId ? 'Edit Sale' : 'Record Sale'}
          </h3>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Client ID</label>
              <input
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Client Name</label>
              <input
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Product ID</label>
              <input
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Product Name</label>
              <input
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Date</label>
              <input
                type="date"
                value={form.date.toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, date: new Date(e.target.value) })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                {editingId ? 'Update' : 'Record Sale'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Sales History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[var(--soft-bg)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(sale.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{sale.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sale.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sale.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${sale.unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${sale.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={sale.status === 'pending' ? 'text-[var(--warning)] font-medium' : sale.status === 'completed' ? 'text-[var(--success)] font-medium' : 'text-[var(--danger)] font-medium'}>
                      {sale.status}
                    </span>
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