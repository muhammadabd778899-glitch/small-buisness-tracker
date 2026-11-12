import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import { Product, Client, Order, OrderLineItem } from '../lib/database'

export const OrderManagement: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, products, clients, orders, orderItems, addOrder, updateOrder, removeOrder, addOrderItem, updateOrderItem, removeOrderItem } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Order form state
  const [form, setForm] = useState<Partial<Order>>({
    clientId: null,
    orderDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    status: 'draft' as 'draft' | 'confirmed' | 'in-progress' | 'ready' | 'completed' | 'cancelled',
    lineItems: [],
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    discount: 0,
    paymentStatus: 'pending' as 'pending' | 'partial' | 'paid',
    notes: ''
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Orders already in store
  }, [orders, orderItems])

  const handleShowForm = (id?: string, order?: Order) => {
    if (id && order) {
      // Calculate totals from existing line items
      const lineTotal = order.lineItems?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0
      const taxRate = businessData?.defaultTaxRate / 100 || 0.08
      const tax = lineTotal * taxRate
      const total = lineTotal + tax
      
      setForm({
        ...order,
        orderDate: new Date(order.orderDate),
        dueDate: new Date(order.dueDate),
        lineItems: order.lineItems || [],
        status: order.status,
        subtotal: lineTotal,
        taxAmount: tax,
        total: total,
        discount: order.discount || 0,
        paymentStatus: order.paymentStatus
      })
      setEditingId(id)
    } else {
      setForm({
        clientId: null,
        orderDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'draft',
        lineItems: [],
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        discount: 0,
        paymentStatus: 'pending',
        notes: ''
      })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleHideForm = () => {
    setShowForm(false)
    setForm({
      clientId: null,
      orderDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'draft',
      lineItems: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      discount: 0,
      paymentStatus: 'pending',
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
    // Find product or create empty line item
    const newItem: OrderLineItem = {
      id: `oli-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: editingId || '',
      productId: null,
      materialId: null,
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 0.08,
      totalPrice: 0
    }
    
    setForm(prev => {
      const newItems = [...prev.lineItems, newItem]
      calculateTotals(newItems)
      return { ...prev, lineItems: newItems }
    })
  }

  const removeLineItem = (itemId: string) => {
    setForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((item: any) => item.id !== itemId),
      subtotal: 0,
      taxAmount: 0,
      total: 0
    }))
    // Recalculate
    calculateTotals(prev.lineItems.filter((item: any) => item.id !== itemId).map((item: any) => item))
  }

  const handleSave = async () => {
    try {
      const orderData: Order = {
        ...form,
        id: editingId || `order-${Date.now()}`,
        clientId: form.clientId,
        orderDate: form.orderDate,
        dueDate: form.dueDate,
        status: form.status,
        lineItems: form.lineItems,
        subtotal: form.subtotal,
        taxAmount: form.taxAmount,
        total: form.total,
        discount: form.discount,
        paymentStatus: form.paymentStatus,
        notes: form.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        await updateOrder(editingId, {
          clientId: form.clientId,
          orderDate: form.orderDate,
          dueDate: form.dueDate,
          status: form.status,
          lineItems: form.lineItems,
          subtotal: form.subtotal,
          taxAmount: form.taxAmount,
          total: form.total,
          discount: form.discount,
          paymentStatus: form.paymentStatus,
          notes: form.notes
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

      {/* Orders Summary */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Orders Overview</h3>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['draft', 'confirmed', 'in-progress', 'ready', 'completed', 'cancelled'].forEach(status => {
            const count = orders.filter(o => o.status === status).length
            if (count > 0) {
              const bgClass = status === 'completed' ? 'bg-[var(--success)]' : status === 'cancelled' ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'
              const textClass = status === 'completed' ? 'text-[var(--success)]' : status === 'cancelled' ? 'text-[var(--danger)]' : 'text-[var(--accent)]'
              const el = document.getElementById(`order-${status}`)
              if (el) {
                el.innerHTML = `
                  <div id="order-${status}" className="p-2 rounded ${bgClass}>
                    <span className="text-${textClass} font-medium">${status}: ${count}</span>
                  </div>
                `
              }
            }
          })
        }
      </div>

      {/* Add Order Form */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-2xl mx-auto">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingId ? 'Edit Order' : 'Create New Order'}
          </h3>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Client</label>
              <select
                value={form.clientId ? form.clientId : ''}
                onChange={(e) => setForm({ ...form, clientId: e.target.value === '' ? null : e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              >
                <option value="">Select Client</option>
                {isDemo ? clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                )) : (
                  '<option value="">Select Client</option>'
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Order Date</label>
                <input
                  type="date"
                  value={form.orderDate.toISOString().split('T')[0]}
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
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Discount %</label>
              <input
                type="number"
                step="0.1"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            {/* Line Items Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Discount %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {form.lineItems.map((item: any, index: number) => (
                    <tr key={item.id} className="hover:bg-[var(--soft-bg)]">
                      <td className="px-6 py-4">
                        <select
                          value={item.productId || ''}
                          onChange={(e) => {
                            const newItems = [...form.lineItems]
                            newItems[index] = { ...newItems[index], productId: e.target.value }
                            calculateTotals(newItems)
                            setForm(prev => ({ ...prev, lineItems: newItems }))
                          }}
                          className="w-full py-1 rounded border px-2 text-sm"
                        >
                          <option value="">Select Product</option>
                          {isDemo ? products.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.sellingPrice.toFixed(2)})
                            </option>
                          )) : (
                            '<option value="">Select Product</option>'
                          )}
                        </select>
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
                        <input
                          type="number"
                          step="0.1"
                          value={item.discount}
                          onChange={(e) => {
                            const newItems = [...form.lineItems]
                            newItems[index] = { ...newItems[index], discount: Number(e.target.value )}
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
                    <td colSpan="6">
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

            <div className="mt-3 flex justify-end gap-3">
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
                {editingId ? 'Update Order' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
    </div>
  )
}