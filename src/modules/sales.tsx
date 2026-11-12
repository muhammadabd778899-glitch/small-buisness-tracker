import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const Sales: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, orders, clients, invoices, payments } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Calculate sales metrics from actual data
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
  const averageOrderValue = orders.length > 0 ? totalSales / orders.length : 0

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Sales Management</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Sales</h3>
          <p className="text-2xl font-bold">{totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Average Order Value</h3>
          <p className="text-2xl font-bold">{averageOrderValue.toFixed(2)}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Orders</h3>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Conversion Rate</h3>
          <p className="text-2xl font-bold">{((invoices.length / orders.length) * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime())
                .slice(0, 10)
                .map((order) => {
                  const client = businessData?.clients?.find(c => c.id === order.clientId)
                  return (
                    <tr key={order.id} className="hover:bg-[var(--soft-bg)]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.paymentStatus}
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clients Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Clients */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Top Clients by Sales</h3>
          <div className="space-y-3">
            {clients
              .sort((a, b) => b.totalSales - a.totalSales)
              .slice(0, 5)
              .map((client) => (
                <div key={client.id} className="flex items-center gap-3 p-2 rounded bg-[var(--background)]">
                  <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    {client.name?.substring(0, 1)}
                  </div>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-[var(--muted)]">${client.totalSales.toFixed(2)}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Orders by Status */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Orders by Status</h3>
          <div className="space-y-3">
            ['draft', 'confirmed', 'in-progress', 'ready', 'completed', 'cancelled'].forEach(status => {
              const count = orders.filter(o => o.status === status).length
              if (count > 0) {
                return (
                  <div key={status} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
                    <span className="text-sm text-[var(--muted)]">{status}: {count}</span>
                  </div>
                )
              }
            })
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Payment Status</h3>
          <div className="space-y-3">
            ['pending', 'partial', 'paid'].forEach(status => {
              const count = invoices.filter(i => i.paymentStatus === status).length
              if (count > 0) {
                return (
                  <div key={status} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full {status === 'paid' ? 'bg-[var(--success)]' : status === 'partial' ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'}"></span>
                    <span className="text-sm text-[var(--muted)]">{status}: {count}</span>
                  </div>
                )
              }
            })
          </div>
        </div>
      </div>
    </div>
  )
}