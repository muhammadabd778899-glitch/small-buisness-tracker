import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const BusinessPlanning: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, goals, budgets, addGoal, updateGoal, removeGoal, addBudget, updateBudget, removeBudget } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Goals form state
  const [goalForm, setGoalForm] = useState<{
    name: string
    targetAmount: number
    currentAmount: number
    unit: string
    period: 'monthly' | 'quarterly' | 'yearly'
    targetDate: Date
  }>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    unit: 'USD',
    period: 'monthly',
    targetDate: new Date()
  })

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)

  // Budgets form state
  const [budgetForm, setBudgetForm] = useState<{
    name: string
    category: string
    allocatedAmount: number
    spentAmount: number
    period: 'monthly' | 'quarterly' | 'yearly'
    startDate: Date
    endDate: Date
  }>({
    name: '',
    category: 'Operating',
    allocatedAmount: 0,
    spentAmount: 0,
    period: 'monthly',
    startDate: new Date(),
    endDate: new Date()
  })

  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)

  useEffect(() => {
    // Data already in store
  }, [goals, budgets])

  // Add Goal
  const handleAddGoal = () => {
    setGoalForm({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      unit: 'USD',
      period: 'monthly',
      targetDate: new Date()
    })
    setShowGoalForm(true)
  }

  const handleEditGoal = (id: string, goal: any) => {
    setGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      unit: goal.unit || 'USD',
      period: goal.period || 'monthly',
      targetDate: goal.targetDate ? new Date(goal.targetDate) : new Date()
    })
    setEditingGoalId(id)
    setShowGoalForm(true)
  }

  const handleSaveGoal = async () => {
    try {
      if (editingGoalId) {
        await updateGoal(editingGoalId, {
          name: goalForm.name,
          targetAmount: goalForm.targetAmount,
          currentAmount: goalForm.currentAmount,
          unit: goalForm.unit,
          period: goalForm.period,
          targetDate: goalForm.targetDate
        })
      } else {
        await addGoal(goalForm as any)
      }
      setShowGoalForm(false)
    } catch (error) {
      console.error('Failed to save goal:', error)
    }
  }

  const handleCancelGoal = () => {
    setShowGoalForm(false)
    setGoalForm({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      unit: 'USD',
      period: 'monthly',
      targetDate: new Date()
    })
  }

  // Add Budget
  const handleAddBudget = () => {
    setBudgetForm({
      name: '',
      category: 'Operating',
      allocatedAmount: 0,
      spentAmount: 0,
      period: 'monthly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    setShowBudgetForm(true)
  }

  const handleEditBudget = (id: string, budget: any) => {
    setBudgetForm({
      name: budget.name,
      category: budget.category,
      allocatedAmount: budget.allocatedAmount,
      spentAmount: budget.spentAmount,
      period: budget.period,
      startDate: budget.startDate ? new Date(budget.startDate) : new Date(),
      endDate: budget.endDate ? new Date(budget.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    setEditingBudgetId(id)
    setShowBudgetForm(true)
  }

  const handleSaveBudget = async () => {
    try {
      if (editingBudgetId) {
        await updateBudget(editingBudgetId, {
          name: budgetForm.name,
          category: budgetForm.category,
          allocatedAmount: budgetForm.allocatedAmount,
          spentAmount: budgetForm.spentAmount,
          period: budgetForm.period,
          startDate: budgetForm.startDate,
          endDate: budgetForm.endDate
        })
      } else {
        await addBudget(budgetForm as any)
      }
      setShowBudgetForm(false)
    } catch (error) {
      console.error('Failed to save budget:', error)
    }
  }

  const handleCancelBudget = () => {
    setShowBudgetForm(false)
    setBudgetForm({
      name: '',
      category: 'Operating',
      allocatedAmount: 0,
      spentAmount: 0,
      period: 'monthly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Business Planning</h2>

      {/* Goals Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Goals</h3>
        <button
          onClick={handleAddGoal}
          className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors mb-3"
        >
          + Add Goal
        </button>
        {/* Would display goals list */}
      </div>

      {/* Budgets Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Budgets</h3>
        <button
          onClick={handleAddBudget}
          className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors mb-3"
        >
          + Add Budget
        </button>
        {/* Would display budgets list */}
      </div>

      {/* Goal Form */}
      {showGoalForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-md">
          <h3 className={editingGoalId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingGoalId ? 'Edit Goal' : 'Add New Goal'}
          </h3>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Goal Name</label>
              <input
                value={goalForm.name}
                onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Target Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, targetAmount: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Current Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={goalForm.currentAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, currentAmount: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Unit</label>
              <input
                value={goalForm.unit}
                onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Period</label>
                <select
                  value={goalForm.period}
                  onChange={(e) => setGoalForm({ ...goalForm, period: e.target.value as any })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Target Date</label>
                <input
                  type="date"
                  value={goalForm.targetDate.toISOString().split('T')[0]}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelGoal}
                className="px-3 py-1 rounded text-sm text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="px-3 py-1 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
              >
                {editingGoalId ? 'Update' : 'Add Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Form */}
      {showBudgetForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-md">
          <h3 className={editingBudgetId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingBudgetId ? 'Edit Budget' : 'Add New Budget'}
          </h3>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Budget Name</label>
              <input
                value={budgetForm.name}
                onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Category</label>
                <select
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="Operating">Operating</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Materials">Materials</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Rent">Rent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Allocated Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={budgetForm.allocatedAmount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, allocatedAmount: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Spent Amount</label>
              <input
                type="number"
                step="0.01"
                value={budgetForm.spentAmount}
                onChange={(e) => setBudgetForm({ ...budgetForm, spentAmount: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Period</label>
                <select
                  value={budgetForm.period}
                  onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value as any })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">End Date</label>
                <input
                  type="date"
                  value={budgetForm.endDate.toISOString().split('T')[0]}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelBudget}
                className="px-3 py-1 rounded text-sm text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBudget}
                className="px-3 py-1 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
              >
                {editingBudgetId ? 'Update' : 'Add Budget'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}