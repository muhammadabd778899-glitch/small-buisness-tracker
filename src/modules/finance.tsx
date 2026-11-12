import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const Finance: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, incomeTransactions, expenseTransactions, accounts, goals, budgets } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Calculate finances from actual database
  const totalRevenue = incomeTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = expenseTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // Account balances
  const accountBalances = accounts.map(account => ({
    name: account.name,
    type: account.type,
    balance: account.currentBalance,
    openingBalance: account.openingBalance
  }))

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Finance Management</h2>

      {/* Revenue & Expenses Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold">{totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-[var(--danger)]">{totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Net Profit</h3>
          <p className="text-2xl font-bold {netProfit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}">
            {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
          <p className="text-sm text-[var(--muted)]">Profit Margin: {profitMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Accounts Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Account Management</h3>
        <div className="space-y-4">
          {accountBalances.map((acc) => (
            <div key={acc.name} className="p-4 rounded bg-[var(--background)]">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{acc.name}</span>
                <span className="text-[var(--muted)]">{acc.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Current Balance:</span>
                <span className="text-[var(--accent)]">{acc.balance.toLocaleString()}</span>
              </div>
              <div className="text-xs text-[var(--muted)]">Opening: {acc.openingBalance.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Budgets vs Actual */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Budgets vs Actual</h3>
        <div className="space-y-4">
          {budgets.map((budget) => {
            const spentPercent = budget.allocatedAmount > 0 ? (budget.spentAmount / budget.allocatedAmount) * 100 : 0
            return (
              <div key={budget.id} className="p-3 rounded bg-[var(--background)]">
                <div className="flex justify-between items-center mb-2">
                  <span>{budget.name}</span>
                  <span className="text-[var(--muted)]">{budget.spentAmount.toLocaleString()} / {budget.allocatedAmount.toLocaleString()}</span>
                </div>
                <div>
                  <div className="h-2 rounded-full bg-[var(--border)]">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(spentPercent, 100)}%` }}></div>
                  </div>
                  <span className="text-xs text-[var(--muted)]">{spentPercent.toFixed(1)}% spent</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Goals Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Financial Goals</h3>
        <div className="grid grid-cols-2 gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className="p-3 rounded bg-[var(--background)]">
              <p className="font-medium">{goal.name}</p>
              <div className="h-2 rounded-full bg-[var(--border)] my-2">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(goal.currentAmount / goal.targetAmount * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-[var(--muted)]">{goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} {goal.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Transactions */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Income Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)]">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Category</th>
                </tr>
              </thead>
              <tbody>
                {incomeTransactions
                  .filter(t => t.amount > 0)
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .slice(0, 10)
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-[var(--soft-bg)]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {t.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {t.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {t.category}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Transactions */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Expense Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)]">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Category</th>
                </tr>
              </thead>
              <tbody>
                {expenseTransactions
                  .filter(t => t.amount > 0)
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .slice(0, 10)
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-[var(--soft-bg)]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {t.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {t.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {t.category}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}