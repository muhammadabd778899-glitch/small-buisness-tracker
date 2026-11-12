import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const Clients: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, clients } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Client metrics
  const totalClients = clients.length
  const topSpendingClients = [...clients]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5)

  // Render client rows
  const clientRows = clients
    .sort((a, b) => b.totalSales - a.totalSales)
    .map((client) => {
      const outstanding = client.outstandingBalance || 0
      return (
        <tr key={client.id} className="hover:bg-[var(--soft-bg)]">
          <td className="px-6 py-4 whitespace-nowrap">
            {client.name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {client.company || 'N/A'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {client.email}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {client.phone}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {client.totalOrders}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {client.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {outstanding.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </td>
        </tr>
      )
    })

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Client CRM</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Clients</h3>
          <p className="text-2xl font-bold">{totalClients}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Top Spending</h3>
          <p className="text-2xl font-bold">{topSpendingClients[0]?.name || 'N/A'}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Outstanding Balance</h3>
          <p className="text-2xl font-bold text-[var(--danger)]">
            ${businessData?.businessSettings?.currencySymbol || '$'}{
              businessData?.businessSettings?.currencyPrecision !== undefined
                ? (businessData?.businessSettings?.currencyPrecision || 2)
                : 2
            }
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Active Clients</h3>
          <p className="text-2xl font-bold">{clients.filter(c => c.isActive).length}</p>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Client List</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Total Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Total Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {clientRows}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Spending Clients */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Top Spending Clients</h3>
          {topSpendingClients.length > 0 ? (
            <div className="space-y-3">
              {topSpendingClients.map((client) => (
                <div key={client.id} className="p-3 rounded bg-[var(--background)]">
                  <p className="font-medium text-sm">{client.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Orders: {client.totalOrders} | Sales: ${client.totalSales.toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Outstanding: ${(client.outstandingBalance || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No client data available</p>
          )}
        </div>

        {/* Client Type Distribution */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Client Type Distribution</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--accent)]"></span>
              <span className="text-sm text-[var(--muted)]">Business</span>
              <span className="text-sm font-medium">{clients.filter(c => c.clientType === 'business').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--danger)]"></span>
              <span className="text-sm text-[var(--muted)]">Individual</span>
              <span className="text-sm font-medium">{clients.filter(c => c.clientType === 'individual').length}</span>
            </div>
          </div>
        </div>

        {/* Recent Communications */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Recent Communications</h3>
          <div className="space-y-2">
            {/* Demo communications preview */}
            <div className="p-2 rounded bg-[var(--background)] text-xs">
              <p className="text-[var(--muted)]">See communications log for full history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}