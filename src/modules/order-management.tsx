import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const OrderManagement: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, orders, addOrder, removeOrder, updateOrder } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state
  const [form, setForm] = useState<Partial<{
    id: string
    clientId: string
    clientName: string
    clientCompany: string
    date: Date
    dueDate: Date
    items: Array<{
      description: string
      quantity: number
      unitPrice: number
      total: number
    }>
    subtotal: number
    taxAmount: number
    total: number
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    paymentMethod: string
    notes: string
    createdAt: Date
    updatedAt: Date
  }>>({
    id: '',
    clientId: '',
    clientName: '',
    clientCompany: '',
    date: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    items: [],
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    status: 'pending',
    paymentMethod: 'bank-transfer',
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Orders already in store
  }, [orders])

  const handleShowForm = (id?: string, order?: any) => {
    if (id && order) {
      setForm({
        id: order.id,
        clientId: order.clientId,
        clientName: order.clientName,
        clientCompany: order.clientCompany,
        date: new Date(order.date),
        dueDate: new Date(order.dueDate),
        items: order.items || [],
        subtotal: order.subtotal || 0,
        taxAmount: order.taxAmount || 0,
        total: order.total || 0,
        status: order.status || 'pending',
        paymentMethod: order.paymentMethod || 'bank-transfer',
        notes: order.notes || '',
        createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date()
      })
      setEditingId(id)
    } else {
      setForm({
        id: '',
        clientId: '',
        clientName: '',
        clientCompany: '',
        date: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [],
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        status: 'pending',
        paymentMethod: 'bank-transfer',
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
      clientCompany: '',
      date: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      status: 'pending',
      paymentMethod: 'bank-transfer',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  const handleAddItem = () => {
    const newItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
    setForm({
      ...form,
      items: [...form.items, newItem]
    })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...form.items]
    newItems.splice(index, 1)
    setForm({ ...form, items: newItems })
  }

  const handleItemChange = (index: number, field: keyof typeof newItem, value: any) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setForm({ ...form, items: newItems })
  }

  const handleCalculate = () => {
    const subtotal = form.items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * 0.13
    const total = subtotal + taxAmount

    setForm({
      ...form,
      subtotal,
      taxAmount,
      total
    })
  }

  const handleSave = async () => {
    try {
      const orderData: any = {
        id: form.id || `order-${Date.now()}`,
        clientId: form.clientId,
        clientName: form.clientName,
        clientCompany: form.clientCompany,
        date: form.date,
        dueDate: form.dueDate,
        items: form.items,
        subtotal: form.subtotal,
        taxAmount: form.taxAmount,
        total: form.total,
        status: form.status,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        createdAt: form.updatedAt,
        updatedAt: new Date()
      }

      if (editingId) {
        await updateOrder(editingId, {
          clientId: form.clientId,
          clientName: form.clientName,
          clientCompany: form.clientCompany,
          date: form.date,
          dueDate: form.dueDate,
          items: form.items,
          subtotal: form.subtotal,
          taxAmount: form.taxAmount,
          total: form.total,
          status: form.status,
          paymentMethod: form.paymentMethod,
          notes: form.notes,
          updatedAt: new Date()
        })
      } else {
        await addOrder(orderData)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save order:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Order Management</h2>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Total Orders</h4>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Total Sales</h4>
          <p className="text-2xl font-bold text-[var(--success)]">
            ${orders.reduce((sum, ord) => sum + ord.total, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Processing</h4>
          <p className="text-2xl font-bold text-[var(--warning)]">
            {orders.filter(o => o.status === 'processing').length}
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Delivered</h4>
          <p className="text-2xl font-bold text-[var(--success)]">
            {orders.filter(o => o.status === 'delivered').length}
          </p>
        </div>
      </div>

      {/* New Order Form */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-3xl mx-auto mb-8">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingId ? 'Edit Order' : 'Create New Order'}
          </h3>

          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm text-[var(--muted)] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
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
                <option value="stripe">Stripe</option>
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

            {/* Items Table */}
            <div>
              <label className="block text-sm text-[var(--muted)] mb-3">Order Items</label>
              <div className="bg-[var(--background)] rounded-lg p-4 mb-4">
                <div className="grid grid-cols-4 gap-2 mb-3" style={{borderBottom: '1px solid var(--border)'}}>
                  <div>Description</div>
                  <div className="text-sm text-[var(--muted)]">Qty</div>
                  <div className="text-sm text-[var(--muted)]">Price</div>
                  <div className="text-sm text-[var(--muted)]">Total</div>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 p-2 border-t border-[var(--border)]">
                    <input
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full py-1 rounded bg-[var(--soft-bg)] text-[var(--fg)]"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value ))}
                      className="w-full py-1 rounded bg-[var(--soft-bg)] text-[var(--fg)]"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value ))}
                      className="w-full py-1 rounded bg-[var(--soft-bg)] text-[var(--fg)]"
                    />
                    <span className="w-full py-1 rounded bg-[var(--soft-bg)] text-[var(--fg)]" onClick={() => handleRemoveItem(idx)}>
                      ✕
                    </span>
                  </div>
                ))}
                <button
                  onClick={handleAddItem}
                  className="col-span-4 py-1 rounded bg-[var(--accent)] text-white text-xs hover:bg-[var(--deeporange)] transition-colors mt-2"
                >
                  + Add Item
                </button>
              </div>

              {/* Item totals summary */}
              {form.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-end gap-2">
                  <span>Subtotal:</span>
                  <span className="font-medium">${form.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  <span>Tax (13%):</span>
                  <span className="font-medium text-[var(--success)]">${form.taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  <span>Total:</span>
                  <span className="font-bold text-[var(--danger)]">${form.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Action buttons */}
      <div className="mb-8">
        <button
          onClick={() => handleShowForm()}
          className="px-4 py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
        >
          + Create Order
        </button>
      </div>
    </div>
  )
}