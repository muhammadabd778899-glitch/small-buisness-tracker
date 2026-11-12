import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const Planning: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, goals, budgets } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Calculate budget utilization
  const totalBudgetAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0)
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0)
  const budgetUtilization = totalBudgetAllocated > 0 ? (totalBudgetSpent / totalBudgetAllocated) * 100 : 0

  // Goals progress
  const totalGoals = goals.length
  const achievedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length
  const goalsProgress = totalGoals > 0 ? (achievedGoals / totalGoals) * 100 : 0

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Business Planning</h2>

      {/* Goals & Budgets Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Goals Overview */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Goals Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            {goals.map((goal) => (
              <div key={goal.id} className="p-3 rounded bg-[var(--background)]">
                <p className="font-medium text-sm">{goal.name}</p>
                <div className="h-2 rounded-full bg-[var(--border)] my-2">
                  <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(goal.currentAmount / goal.targetAmount * 100, 100)}%` }}></div>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} {goal.unit}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-[var(--muted)] mt-4">
            {achievedGoals}/{totalGoals} goals achieved ({goalsProgress.toFixed(1)}%)
          </p>
        </div>

        {/* Budgets Overview */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Budgets Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="p-3 rounded bg-[var(--background)]">
                <p className="font-medium text-sm">{budget.name}</p>
                <div className="h-2 rounded-full bg-[var(--border)] my-2">
                  <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(budget.spentAmount / budget.allocatedAmount * 100, 100)}%` }}></div>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Spent: {budget.spentAmount.toLocaleString()} / {budget.allocatedAmount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-[var(--muted)] mt-4">
            {totalBudgetSpent.toLocaleString()} / {totalBudgetAllocated.toLocaleString()} total budget utilized ({budgetUtilization.toFixed(1)}%)
          </p>
        </div>

        {/* Expense Budgets */}
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Expense Budgets</h3>
          <p className="text-sm text-[var(--muted)]">
            Budgets help track spending against allocated amounts for different business categories.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            {budgets.map((budget) => (
              <li key={budget.id} className="text-sm">
                {budget.name}: {budget.spentAmount.toLocaleString()} / {budget.allocatedAmount.toLocaleString()} ({budget.period})
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Savings & Sinking Funds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Savings Goals</h3>
          <p className="text-sm text-[var(--muted)]">
            Set aside funds for future business needs and opportunities.
          </p>
          {/* Savings goal cards would go here */}
        </div>

        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Sinking Funds</h3>
          <p className="text-sm text-[var(--muted)]">
            Reserve funds for known future expenses like equipment replacement or tax payments.
          </p>
          {/* Sinking fund cards would go here */}
        </div>
      </div>

      {/* Debt Payoff Planner */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Debt Payoff Planner</h3>
        <p className="text-sm text-[var(--muted)]">
          Track and plan debt repayment for business loans, credit lines, or other obligations.
        </p>
        {/* Debt tracker would go here */}
      </div>

      {/* Net Worth Tracker (Optional - separated from business) */}
      <div className="mt-8 bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Note: Personal Planning Separate</h3>
        <p className="text-sm text-[var(--muted)]">
          Keep optional personal financial planning separate from business financial reports as per product specification.
        </p>
      </div>
    </div>
  )
}