import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import {
  Chart, BarChart, Bar, Cell, ResponsiveContainer, LineChart, Line, Area, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, ResponsiveContainer as RC2
} from 'recharts'

export const Reports: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, incomeTransactions, expenseTransactions, products, clients, orders, invoices, payments, goals, budgets } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Report period filter state
  const [period, setPeriod] = useState<'this-month' | 'last-month' | 'this-quarter' | 'this-year' | 'last-year' | 'last-12-months' | 'custom'>('this-month')
  const [customStart, setCustomStart] = useState<Date | null>(null)
  const [customEnd, setCustomEnd] = useState<Date | null>(null)

  // Calculate date range based on period
  const today = new Date()
  const getDateRange = (): { start: Date; end: Date } => {
    const start = new Date()
    const end = new Date(today)
    
    switch (period) {
      case 'this-month':
        start.setDate(1)
        break
      case 'last-month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
        return { start: lastMonth, end: lastMonthEnd }
      case 'this-quarter':
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3
        start.setMonth(quarterMonth, 1)
        break
      case 'this-year':
        start.setFullYear(today.getFullYear(), 0, 1)
        break
      case 'last-year':
        start.setFullYear(today.getFullYear() - 1, 0, 1)
        end.setFullYear(today.getFullYear() - 1, 11, 31)
        break
      case 'last-12-months':
        start.setMonth(today.getMonth() - 11)
        break
      case 'custom':
        if (customStart && customEnd) {
          return { start: customStart, end: customEnd }
        }
        return { start: new Date(0), end: today }
      default:
        start.setDate(1)
    }
    
    return { start, end: end }
  }

  const { startDate, endDate } = getDateRange()

  // Filter transactions by date range
  const filteredIncome = incomeTransactions.filter(t => {
    const txDate = new Date(t.date)
    return txDate >= startDate && txDate <= endDate
  })

  const filteredExpenses = expenseTransactions.filter(t => {
    const txDate = new Date(t.date)
    return txDate >= startDate && txDate <= endDate
  })

  // Calculate KPIs for the period
  const periodRevenue = filteredIncome.reduce((sum, t) => sum + t.amount, 0)
  const periodExpenses = filteredExpenses.reduce((sum, t) => sum + t.amount, 0)
  const periodNetProfit = periodRevenue - periodExpenses
  const periodProfitMargin = periodRevenue > 0 ? (periodNetProfit / periodRevenue) * 100 : 0

  // Revenue and expenses over time (for charts)
  const revenueOverTime = []
  const expensesOverTime = []

  // Category breakdowns
  const incomeByCategory: any[] = []
  const expensesByCategory: any[] = []

  // Product sales
  const salesByProduct: any[] = []

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Report Center</h2>

      {/* Report Period Filter */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Report Period</h3>
        <div className="grid grid-cols-6 gap-2">
          <button
            onClick={() => setPeriod('this-month')}
            className={`px-4 py-2 rounded text-sm font-medium ${period === 'this-month' ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg)] hover:bg-[var(--soft-bg)]'}}>
            This Month
          </button>
          <button
            onClick={() => setPeriod('last-month')}
            className={`px-4 py-2 rounded text-sm font-medium ${period === 'last-month' ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg)] hover:bg-[var(--soft-bg)]'}}>
            Last Month
          </button>
          <button
            onClick={() => setPeriod('this-quarter')}
            className={`px-4 py-2 rounded text-sm font-medium ${period === 'this-quarter' ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg)] hover:bg-[var(--soft-bg)]'}}>
            This Quarter
          </button>
          <button
            onClick={() => setPeriod('this-year')}
            className={`px-4 py-2 rounded text-sm font-medium ${period === 'this-year' ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg)] hover:bg-[var(--soft-bg)]'}}>
            This Year
          </button>
          <button
            onClick={() => setPeriod('last-year')}
            className={`px-4 py-2 rounded text-sm font-medium ${period === 'last-year' ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg)] hover:bg-[var(--soft-bg)]'}}>
            Last Year
          </button>
          <button
            onClick={() => setPeriod('last-12-months')}
            className={`px-4 py-2 rounded text-sm font-medium ${period === 'last-12-months' ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg)] hover:bg-[var(--soft-bg)]'}}>
            Last 12 Months
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`px-4 py-2 rounded text-sm font-medium ${period === 'custom' ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg)] hover:bg-[var(--soft-bg)]'}}>
            Custom Range
          </button>
        </div>

        {/* Custom date range (conditionally shown) */}
        {period === 'custom' && customStart && customEnd && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={customStart.toLocaleDateString()}
              onChange={(e) => setCustomStart(new Date(e.target.value))}
              className="border rounded p-1 text-sm"
            />
            <input
              type="date"
              value={customEnd.toLocaleDateString()}
              onChange={(e) => setCustomEnd(new Date(e.target.value))}
              className="border rounded p-1 text-sm"
            />
            <button
              onClick={() => setPeriod('this-month')}
              className="mt-2 col-span-2 px-4 py-2 rounded text-sm text-[var(--accent)] hover:bg-[var(--soft-bg)]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards for Selected Period */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Revenue</h3>
          <p className="text-2xl font-bold">{periodRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Expenses</h3>
          <p className="text-2xl font-bold text-[var(--danger)]">{periodExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Net Profit</h3>
          <p className="text-2xl font-bold {periodNetProfit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}">
            {periodNetProfit >= 0 ? '+' : ''}{periodNetProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Profit Margin</h3>
          <p className="text-2xl font-bold">{periodProfitMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Financial Report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Monthly Financial Report</h3>
          <p className="text-sm text-[var(--muted)]">
            Comprehensive monthly report with revenue, expenses, profit margins and key performance indicators.
          </p>
          <div className="mt-4">
            <button className="btn btn-outline text-sm hover:text-[var(--accent)] transition-colors">
              Generate Report
            </button>
            <button className="btn btn-outline text-sm ml-2 hover:text-[var(--accent)] transition-colors">
              Export CSV
            </button>
          </div>
        </div>

        {/* Quarterly Report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Quarterly Report</h3>
          <p className="text-sm text-[var(--muted)]">
            Quarterly overview with trend analysis and comparison to previous quarters.
          </p>
          <div className="mt-4">
            <button className="btn btn-outline text-sm hover:text-[var(--accent)] transition-colors">
              Generate Report
            </button>
          </div>
        </div>

        {/* Annual Report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Annual Report</h3>
          <p className="text-sm text-[var(--muted)]">
            Full year overview with annual summaries, trend analysis and future projections.
          </p>
          <div className="mt-4">
            <button className="btn btn-outline text-sm hover-text-[var(--accent)] transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Additional Report Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Category Report</h3>
          <p className="text-sm text-[var(--muted)]">
            Breakdown of income and expenses by category with comparative analysis.
          </p>
        </div>

        {/* Account Balance Report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Account Balance Report</h3>
          <p className="text-sm text-[var(--muted)]">
            Current balances across all business accounts with transaction history.
          </p>
        </div>

        {/* Tax Report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Tax Report</h3>
          <p className="text-sm text-[var(--muted)]">
            Tax collected, tax paid, and taxable income/expenses summary with disclaimers.
          </p>
        </div>

        {/* Product Performance Report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Product Performance Report</h3>
          <p className="text-sm text-[var(--muted)]">
            Profitability analysis, sales trends and inventory turnover by product.
          </p>
        </div>

        {/* Inventory Report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Inventory Report</h3>
          <p className="text-sm text-[var(--muted)]>
            Current stock levels, movements, valuation and reorder analysis.
          </p>
        </div>

        {/* Client Report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Client Report</h3>
          <p className="text-sm text-[var(--muted)]>
            Client lifetime value, order history and outstanding balances.
          </p>
        </div>

        {/* Invoice Report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Invoice Report</h3>
          <p className="text-sm text-[var(--muted)]>
            Invoice status, payment status and aging analysis.
          </p>
        </div>

        {/* Custom metrics report */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Custom Metrics Report</h3>
          <p className="text-sm text-[var(--muted)]>
            Define custom KPIs and metrics for specific business needs.
          </p>
        </div>
      </div>

      {/* CSV Export Section */}
      <div className="mt-8 bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">CSV Export</h3>
        <p className="text-sm text-[var(--muted)]">
          Export any report data to CSV format for external analysis or backup.
        </p>
        <div className="mt-4">
          <button className="btn btn-outline text-sm hover-text-[var(--accent)] transition-colors">
            Export Selected Data
          </button>
        </div>
      </div>
    </div>
  )
}