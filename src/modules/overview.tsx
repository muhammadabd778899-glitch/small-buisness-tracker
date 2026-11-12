import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useDemoStore } from '../store/demo'
import { Chart, BarChart, Bar, Cell, ResponsiveContainer, LineChart, Line, Area, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, ResponsiveContainer as RC } from 'recharts'
import { useNavigate } from 'react-router-dom'

export const Overview: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, incomeTransactions, expenseTransactions, products, clients, orders, invoices, payments, goals, budgets } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  useEffect(() => {
    if (!isLoaded) {
      // Initialize business
    }
  }, [isLoaded])

  // Calculate KPIs from actual data
  const totalRevenue = incomeTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = expenseTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // Count data
  const totalOrders = orders.length
  const outstandingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'partial').length
  const lowStockProducts = products.filter(p => p.stockQuantity <= p.reorderThreshold).length
  const upBills = businessData?.businessGoals?.length || 0

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Overview Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Revenue KPI */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold">{totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>

        {/* Expenses KPI */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-[var(--danger)]">{totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>

        {/* Net Profit KPI */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Net Profit</h3>
          <p className="text-2xl font-bold {netProfit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}">
            {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>

        {/* Profit Margin KPI */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Profit Margin</h3>
          <p className="text-2xl font-bold">{profitMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue vs Expenses Trend */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Revenue vs Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#848484" />
              <YAxis stroke="#848484" />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill={var(--accent)} />
              <Bar dataKey="expenses" name="Expenses" fill={var(--danger)} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Profit Trend */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Monthly Profit Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#848484" />
              <YAxis stroke="#848484" />
              <Tooltip />
              <Legend>
                <LegendItem cursor="#848484" />
              </Legend>
              <Area dataKey="profit" fill="var(--accent)" />
              <Line dataKey="profit" stroke={var(--accent)} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income by Category */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Income by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart data={[]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <Pie dataKey="label" fill="#848484" />
              <Pie dataKey="value" stroke="#ffffff" strokeWidth={2} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart data={[]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <Pie dataKey="label" fill="#848484" />
              <Pie dataKey="value" stroke="#ffffff" strokeWidth={2} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Product */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Sales by Product</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#848484" />
              <YAxis stroke="#848484" />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" name="Sales" fill={var(--accent)} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Recent Transactions */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Recent Transactions</h3>
          <p className="text-sm text-[var(--muted)]">8 transactions today</p>
        </div>

        {/* Recent Orders */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Recent Orders</h3>
          <p className="text-sm text-[var(--muted)]">5 orders this week</p>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Unpaid Invoices</h3>
          <p className="text-sm text-[var(--danger)]">3 outstanding</p>
        </div>

        {/* Upcoming Bills */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Upcoming Bills</h3>
          <p className="text-sm text-[var(--warning)]">7 bills due</p>
        </div>
      </div>

      {/* Business Goals Progress */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mt-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Business Goals Progress</h3>
        <div className="grid grid-cols-2 gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                {goal.currentAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount * 100, 100) : 0}%
              </div>
              <div>
                <p className="font-medium">{goal.name}</p>
                <p className="text-xs text-[var(--muted)]">{goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} {goal.unit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}