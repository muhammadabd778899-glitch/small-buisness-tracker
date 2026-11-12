import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const AccountManagement: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, accounts, addAccount, updateAccount, removeAccount, getAccountBalance } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state for add/edit
  const [form, setForm] = useState<{
    id: string
    name: string
    type: 'checking' | 'savings' | 'cash' | 'credit-card' | 'custom'
    currency: string
    openingBalance: number
    currentBalance: number
    taxRate: number
    isActive: boolean
  }>({
    id: '',
    name: '',
    type: 'checking',
    currency: 'USD',
    openingBalance: 0,
    currentBalance: 0,
    taxRate: 0,
    isActive: true
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [balances, setBalances] = useState<Record<string, number>>({})

  // Load accounts and calculate balances
  useEffect(() => {
    // Balances are calculated from the store
    const balanceMap: Record<string, number> = {}
    accounts.forEach(account => {
      balanceMap[account.id] = account.currentBalance
    })
    setBalances(balanceMap)
  }, [accounts])

  const handleShowForm = (id?: string, account?: any) => {
    if (id && account) {
      setForm({
        id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency,
        openingBalance: account.openingBalance,
        currentBalance: account.currentBalance,
        taxRate: account.taxRate,
        isActive: account.isActive
      })
      setEditingId(id)
    } else {
      setForm({
        id: `acc-${Date.now()}`,
        name: 'New Account',
        type: 'checking',
        currency: 'USD',
        openingBalance: 0,
        currentBalance: 0,
        taxRate: 0,
        isActive: true
      })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleHideForm = () => {
    setShowForm(false)
    setForm({
      id: '',
      name: '',
      type: 'checking',
      currency: 'USD',
      openingBalance: 0,
      currentBalance: 0,
      taxRate: 0,
      isActive: true
    })
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateAccount(editingId, {
          name: form.name,
          type: form.type,
          currency: form.currency,
          openingBalance: form.openingBalance,
          currentBalance: form.currentBalance,
          taxRate: form.taxRate,
          isActive: form.isActive
        })
      } else {
        await addAccount({
          ...form,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save account:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Account Management</h2>

      {/* Accounts Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)] flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{account.name}</p>
              <p className="text-sm text-[var(--muted)]">{account.type}</p>
            </div>
            <div className="font-bold text-[var(--accent)]">
              {account.currentBalance.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Account Form */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8 max-w-md">
        <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
          {editingId ? 'Edit Account' : 'Add New Account'}
        </h3>

        <form className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Account Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="cash">Cash</option>
                <option value="credit-card">Credit Card</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Currency</label>
              <input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Opening Balance</label>
              <input
                type="number"
                step="0.01"
                value={form.openingBalance}
                onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Is Active</label>
            <select
              value={form.isActive ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleHideForm}
              className="px-4 py-2 rounded text-sm text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
            >
              {editingId ? 'Update' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>

      {/* Balance Calculations Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Account Balances</h3>
        <p className="text-sm text-[var(--muted)]">
          Current balances calculated from underlying records. Transfers between accounts 
          are not classified as income or expenses.
        </p>
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="flex justify-between text-sm">
              <span className="font-medium">{account.name}</span>
              <span className="text-[var(--accent)]">{account.currentBalance.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div>
          <span className="font-medium text-bold">Total:</span>
          <span className="text-[var(--accent)] font-bold">
            {accounts.reduce((sum, acc) => sum + acc.currentBalance, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}