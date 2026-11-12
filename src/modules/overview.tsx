import React from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate, useLocation } from 'react-router-dom'

export const Overview: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDemo, businessData, clients, products, expenses, income, bills, tasks, goals, budgets, isLoaded } = useBusinessStore()

  // Calculate totals
  const totalRevenue = income.reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
  const netProfit = totalRevenue - totalExpenses
  const totalClients = clients.length
  const totalProducts = products.length
  const totalBills = bills.length

  // Recent activity
  const recentClients = clients
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const recentInvoices = income
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  // Active goals
  const activeGoals = goals.filter(g => g.status === 'active')

  // Current month budget
  const currentMonthBudget = budgets.find(
    b => new Date(b.periodStart).getMonth() === new Date().getMonth() && new Date(b.periodEnd).getMonth() === new Date().getMonth()
  )

  const spentThisMonth = expenses
    .filter(e => {
      const date = new Date(e.date)
      return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()
    })
    .reduce((sum, e) => sum + e.amount, 0)

  const earnedThisMonth = income
    .filter(i => {
      const date = new Date(i.date)
      return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()
    })
    .reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Overview</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-[var(--success)]">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Expenses</h3>
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
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Products</h3>
          <p className="text-3xl font-bold">{totalProducts}</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">This Month</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--muted)]">Expenses</p>
              <p className="text-2xl font-bold text-[var(--danger)]">${spentThisMonth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Income</p>
              <p className="text-2xl font-bold text-[var(--success)]">${earnedThisMonth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
          </div>
          {currentMonthBudget && (
            <div className="mt-4 p-3 rounded bg-[var(--background)]">
              <p className="text-xs text-[var(--muted)]">Budget: ${currentMonthBudget.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              <p className="text-xs text-[var(--muted)]">Spent: ${spentThisMonth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              <div className="mt-2 h-2 rounded-full bg-[var(--background)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent)] transition-width" style={{width: spentThisMonth > 0 ? Math.min((spentThisMonth / currentMonthBudget.amount) * 100, 100) : 0}}></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Active Goals</h3>
          <p className="text-sm text-[var(--muted)]">{activeGoals.length} active</p>
          <ul className="mt-3 space-y-2">
            {activeGoals.map((goal) => (
              <li key={goal.id} className="text-sm">
                <span className="font-medium">{goal.title}</span>: ${goal.targetAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} of ${goal.currentAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentClients.map((client) => (
              <div key={client.id} className="d-flex align-items-center gap-3 px-3 py-2 rounded bg-[var(--background)]">
                <div className="w-3 h-3 rounded-full bg-[var(--accent)]"></div>
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-[var(--muted)]">New client registered</p>
                </div>
              </div>
            ))}
            {recentTasks.map((task) => (
              <div key={task.id} className="d-flex align-items-center gap-3 px-3 py-2 rounded bg-[var(--background)]">
                <div className="w-3 h-3 rounded-full bg-[var(--danger)]"></div>
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-[var(--muted)]">Task due</p>
                </div>
              </div>
            ))}
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="d-flex align-items-center gap-3 px-3 py-2 rounded bg-[var(--background)]">
                <div className="w-3 h-3 rounded-full bg-[var(--success)]"></div>
                <div>
                  <p className="text-sm font-medium">Invoice #{invoice.invoiceNumber}</p>
                  <p className="text-xs text-[var(--muted)]">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue by Category */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Revenue by Category</h3>
          <div className="h-64">
            {/* Revenue chart placeholder */}
            <p className="text-sm text-[var(--muted)] text-center py-16">Revenue chart will appear here</p>
          </div>
        </div>

        {/* Sales Trend */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Sales Trend</h3>
          <div className="h-64">
            {/* Sales trend chart placeholder */}
            <p className="text-sm text-[var(--muted)] text-center py-16">Sales trend chart will appear here</p>
          </div>
        </div>

        {/* Client Growth */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Client Growth</h3>
          <div className="h-64">
            {/* Client growth chart placeholder */}
            <p className="text-sm text-[var(--muted)] text-center py-16">Client growth chart will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}