import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const TaxTracker: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, incomeTransactions, expenseTransactions, setIncomeTransactions, setExpenseTransactions } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Config
  const [taxRate, setTaxRateState] = useState(businessData?.defaultTaxRate || 0)
  const [taxInclusive, setTaxInclusiveState] = useState(businessData?.taxInclusive || false)

  // Calculate tax collected and paid
  const taxCollected = incomeTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + (t.taxAmount || 0), 0)

  const taxPaid = expenseTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + (t.taxAmount || 0), 0)

  // Taxable income and expenses (configurable)
  const taxableIncome = incomeTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const taxableExpenses = expenseTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  // Tax by month (simple aggregation)
  const taxByMonth: Record<string, number> = {}
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`

  // Initialize current month
  taxByMonth[currentMonth] = (taxByMonth[currentMonth] || 0) + taxCollected - taxPaid

  // For demo, show current month only
  const taxSummary = {
    taxCollected: taxCollected.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
    taxPaid: taxPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
    taxableIncome: taxableIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
    taxableExpenses: taxableExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
    netTaxOwed: (taxCollected - taxPaid).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
    taxRate: taxRate,
    taxInclusive: taxInclusive
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Tax Tracker</h2>

      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Tax Collected</h4>
          <p className="text-2xl font-bold text-[var(--success)]">{taxSummary.taxCollected}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Tax Paid</h4>
          <p className="text-2xl font-bold text-[var(--danger)]">{taxSummary.taxPaid}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Taxable Income</h4>
          <p className="text-2xl font-bold">{taxSummary.taxableIncome}</p>
        </div>

        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--muted)] mb-2">Taxable Expenses</h4>
          <p className="text-2xl font-bold">{taxSummary.taxableExpenses}</p>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Tax Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--muted)]">Tax Rate</p>
            <p className="text-lg font-bold">{taxRate}%</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Tax-Inclusive</p>
            <p className="text-lg font-bold {taxInclusive ? 'text-[var(--success)]' : 'text-[var(--danger)]'}">
              {taxInclusive ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-[var(--muted)]">Net Tax Owed</p>
          <p className="text-lg font-bold text-[var(--success)]">
            {taxSummary.netTaxOwed}
          </p>
        </div>
      </div>

      {/* Config Form */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Tax Configuration</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Default Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRateState(Number(e.target.value ))}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Tax Treatment</label>
            <select
              value={taxInclusive ? 'true' : 'false'}
              onChange={(e) => setTaxInclusiveState(e.target.value === 'true')}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="false">Tax-Exclusive Pricing</option>
              <option value="true">Tax-Inclusive Pricing</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-[var(--muted)] mt-4">
          Disclaimer: This application provides estimates for tracking purposes only. 
          Do not claim to calculate official tax liability or guarantee legal compliance. 
          Consult a qualified tax professional for official tax advice.
        </p>
      </div>
    </div>
  )
}