import React from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const Reports: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, clients, products, expenses, income, bills, tasks, goals, budgets, isLoaded } = useBusinessStore()

  // Calculate totals
  const totalRevenue = income.reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
  const netProfit = totalRevenue - totalExpenses
  const totalClients = clients.length
  const totalProducts = products.length
  const totalBills = bills.length

  // Revenue by category
  const revenueByCategory = [
    { name: 'Services', amount: 0 },
    { name: 'Products', amount: 0 },
    { name: 'Materials', amount: 0 },
  ]

  // Expenses by category
  const expensesByCategory = [
    { name: 'Materials', amount: 0 },
    { name: 'Operating', amount: 0 },
    { name: 'Rent', amount: 0 },
  ]

  // Monthly trends (last 6 months)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const monthlyRevenue = months.map((_, i) => 0)
  const monthlyExpenses = months.map((_, i) => 0)

  // Top clients
  const topClients = clients
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5)

  // Goal progress
  const goalProgress = goals.map((goal) => ({
    title: goal.title,
    progress: goal.currentAmount,
    target: goal.targetAmount,
    status: goal.status,
  }))

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Reports</h2>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-[var(--success)]">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-[var(--danger)]">${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Net Profit</h3>
          <p className="text-3xl font-bold {netProfit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}">
            ${netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Clients</h3>
          <p className="text-3xl font-bold">{totalClients}</p>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Revenue by Category</h3>
        <div className="grid grid-cols-3 gap-2">
          {revenueByCategory.map((item, idx) => (
            <div key={idx} className="bg-[var(--background)] rounded-md h-8 flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">{item.name}</span>
              <span className="text-xs font-medium">{item.amount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses by Category */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Expenses by Category</h3>
        <div className="grid grid-cols-3 gap-2">
          {expensesByCategory.map((item, idx) => (
            <div key={idx} className="bg-[var(--background)] rounded-md h-8 flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">{item.name}</span>
              <span className="text-xs font-medium">{item.amount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Progress */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Goal Progress</h3>
        <div className="space-y-3">
          {goalProgress.map((goal, idx) => (
            <div key={goal.title} className="p-3 rounded bg-[var(--background)]">
              <div className="flex justify-between align-items-center mb-1">
                <span className="font-medium text-sm">{goal.title}</span>
                <span className="text-sm font-medium text-[var(--accent)]">
                  ${goal.progress.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} / ${goal.target.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--background)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent)] transition-width" style={{width: goal.target > 0 ? Math.min((goal.progress / goal.target) * 100, 100) : 0}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Top Clients</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Total Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map((client) => (
                <tr key={client.id} className="hover:bg-[var(--soft-bg)]">
                  <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${client.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${(client.outstandingBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget vs Actual */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Budget vs Actual</h3>
        {budgets.length > 0 ? (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const spent = expenses
                .filter((e) => {
                  const date = new Date(e.date)
                  return new Date(date.setHours(0, 0, 0, 0)).getTime() >= new Date(budget.periodStart).getTime() &&
                         new Date(date.setHours(0, 0, 0, 0)).getTime() <= new Date(budget.periodEnd).getTime()
                })
                .reduce((sum, e) => sum + e.amount, 0)

              return (
                <div key={budget.id} className="d-flex justify-between align-items-start p-2 rounded bg-[var(--background)]">
                  <div>
                    <p className="font-medium text-sm">{budget.title}</p>
                    <p className="text-xs text-[var(--muted)]">Period: {new Date(budget.periodStart).toLocaleDateString()} - {new Date(budget.periodEnd).toLocaleDateString()}</p>
                  </div>
                  <div className="w-24 h-2 rounded-full bg-[var(--background)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent)] transition-width" style={{width: budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0}}></div>
                  </div>
                  <div className="ml-3 text-sm">
                    <p>{spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} / {budget.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">No budgets configured</p>
        )}
      </div>
    </div>
  )
}