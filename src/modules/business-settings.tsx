import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const BusinessSettings: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, settings, updateBusinessSettings, accounts, addAccount, removeAccount } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state
  const [form, setForm] = useState<Partial<any>>({
    businessName: businessData?.businessName || '',
    businessEmail: businessData?.businessEmail || '',
    phone: businessData?.phone || '',
    address: businessData?.address || '',
    businessType: businessData?.businessType || 'handmade',
    currency: businessData?.currency || 'USD',
    currencySymbol: businessData?.currencySymbol || '$',
    currencyPrecision: businessData?.currencyPrecision || 2,
    dateFormat: businessData?.dateFormat || 'MM/DD/YYYY',
    fiscalYearStart: businessData?.fiscalYearStart || 1,
    defaultTaxRate: businessData?.defaultTaxRate || 0,
    taxInclusive: businessData?.taxInclusive !== undefined ? businessData.taxInclusive : false,
    invoicePrefix: businessData?.invoicePrefix || 'INV',
    invoiceNumbering: businessData?.invoiceNumbering || 1,
    quotePrefix: businessData?.quotePrefix || 'QTE',
    defaultPaymentTerms: businessData?.defaultPaymentTerms || 'Net 30',
    incomeCategories: businessData?.incomeCategories || ['Product Sales', 'Service Fees', 'Interest Income'],
    expenseCategories: businessData?.expenseCategories || ['Materials', 'Operating', 'Marketing', 'Equipment'],
    subcategories: businessData?.subcategories || {
      'Materials': ['Clay', 'Wood', 'Leather', 'Resin', 'Fabric'],
      'Operating': ['Rent', 'Utilities', 'Shipping', 'Software'],
      'Marketing': ['Ads', 'Printing', 'Events', 'Social Media']
    },
    productCategories: businessData?.productCategories || ['Ceramics', 'Woodwork', 'Leather Goods', 'Resin Art', 'Textiles'],
    accounts: accounts,
    unitsOfMeasurement: businessData?.unitsOfMeasurement || ['piece', 'set', 'kg', 'liter', 'hour'],
    businessGoals: businessData?.businessGoals || []
  })

  const [showSettings, setShowSettings] = useState(false)

  // Load initial data
  useEffect(() => {
    if (businessData) {
      setForm({
        businessName: businessData.businessName || '',
        businessEmail: businessData.businessEmail || '',
        phone: businessData.phone || '',
        address: businessData.address || '',
        businessType: businessData.businessType || 'handmade',
        currency: businessData.currency || 'USD',
        currencySymbol: businessData.currencySymbol || '$',
        currencyPrecision: businessData.currencyPrecision || 2,
        dateFormat: businessData.dateFormat || 'MM/DD/YYYY',
        fiscalYearStart: businessData.fiscalYearStart || 1,
        defaultTaxRate: businessData.defaultTaxRate || 0,
        taxInclusive: businessData.taxInclusive !== undefined ? businessData.taxInclusive : false,
        invoicePrefix: businessData.invoicePrefix || 'INV',
        invoiceNumbering: businessData.invoiceNumbering || 1,
        quotePrefix: businessData.quotePrefix || 'QTE',
        defaultPaymentTerms: businessData.defaultPaymentTerms || 'Net 30',
        incomeCategories: businessData.incomeCategories || ['Product Sales'],
        expenseCategories: businessData.expenseCategories || ['Materials', 'Operating'],
        subcategories: businessData.subcategories || {},
        productCategories: businessData.productCategories || [],
        accounts: accounts || [],
        unitsOfMeasurement: businessData.unitsOfMeasurement || ['piece'],
        businessGoals: businessData.businessGoals || []
      })
    }
  }, [businessData])

  const handleSave = async () => {
    try {
      const updatedSettings: any = {
        ...form,
        updatedAt: new Date()
      }
      
      // Save to store
      updateBusinessSettings(updatedSettings as any)
      
      // Save to IndexedDB
      await db.businessSettings.put(updatedSettings as any)
      
      setShowSettings(false)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handleCancel = () => {
    setShowSettings(false)
    // Reload from DB
    // form = { ...initialForm }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Business Settings</h2>

      {/* Settings Form */}
      <div className="bg-[var(--card)] rounded-lg p-8 border border-[var(--border)] max-w-2xl mx-auto mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-6">Business Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Business Name</label>
            <input
              value={form.businessName || ''}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Business Email</label>
            <input
              value={form.businessEmail || ''}
              onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Phone</label>
            <input
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Address</label>
            <input
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Business Type</label>
            <select
              value={form.businessType || ''}
              onChange={(e) => setForm({ ...form, businessType: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="handmade">Handmade Business</option>
              <option value="etsy">Etsy Seller</option>
              <option value="retail">Small Retail</option>
              <option value="service">Service Provider</option>
              <option value="freelance">Freelancer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Currency</label>
            <select
              value={form.currency || ''}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - Pound Sterling</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Currency Symbol</label>
            <input
              value={form.currencySymbol || ''}
              onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Currency Precision</label>
            <select
              value={form.currencyPrecision || ''}
              onChange={(e) => setForm({ ...form, currencyPrecision: Number(e.target.value )})}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="2">2 decimal places</option>
              <option value="0">0 decimal places</option>
              <option value="3">3 decimal places</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Date Format</label>
            <select
              value={form.dateFormat || ''}
              onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Fiscal Year Start</label>
            <select
              value={form.fiscalYearStart || ''}
              onChange={(e) => setForm({ ...form, fiscalYearStart: Number(e.target.value )})}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="1">January (1)</option>
              <option value="4">April (4)</option>
              <option value="7">July (7)</option>
              <option value="10">October (10)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Default Tax Rate (%)</label>
            <input
              value={form.defaultTaxRate || ''}
              onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value )})}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Tax-Inclusive Pricing</label>
            <select
              value={form.taxInclusive !== undefined ? (form.taxInclusive ? 'true' : 'false') : 'false'}
              onChange={(e) => setForm({ ...form, taxInclusive: e.target.value === 'true' })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="true">Yes - Prices include tax</option>
              <option value="false">No - Prices exclude tax</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Invoice Prefix</label>
            <input
              value={form.invoicePrefix || ''}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Invoice Numbering</label>
            <input
              value={form.invoiceNumbering || ''}
              onChange={(e) => setForm({ ...form, invoiceNumbering: Number(e.target.value )})}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Quote Prefix</label>
            <input
              value={form.quotePrefix || ''}
              onChange={(e) => setForm({ ...form, quotePrefix: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Default Payment Terms</label>
            <select
              value={form.defaultPaymentTerms || ''}
              onChange={(e) => setForm({ ...form, defaultPaymentTerms: e.target.value })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            >
              <option value="Net 30">Net 30</option>
              <option value="Net 15">Net 15</option>
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Net 45">Net 45</option>
            </select>
          </div>
        </div>

        {/* Categories Sections */}
        <div className="mt-8 pt-8 border-t border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Income Categories</h3>
          <p className="text-xs text-[var(--muted)] mb-2">Comma-separated list</p>
          <input
            value={form.incomeCategories.join(', ')}
            onChange={(e) => setForm({ ...form, incomeCategories: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
            className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-20 resize-none"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Expense Categories</h3>
          <p className="text-xs text-[var(--muted)] mb-2">Comma-separated list</p>
          <input
            value={form.expenseCategories.join(', ')}
            onChange={(e) => setForm({ ...form, expenseCategories: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
            className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-20 resize-none"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Product Categories</h3>
          <p className="text-xs text-[var(--muted)] mb-2">Comma-separated list</p>
          <input
            value={form.productCategories.join(', ')}
            onChange={(e) => setForm({ ...form, productCategories: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
            className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-20 resize-none"
          />
        </div>

        {/* Units of Measurement */}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Units of Measurement</h3>
          <p className="text-xs text-[var(--muted)] mb-2">One per line</p>
          <input
            value={form.unitsOfMeasurement.join('\n')}
            onChange={(e) => setForm({ ...form, unitsOfMeasurement: e.target.value.split('\n').map(s => s.trim()).filter(s => s) })}
            className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-32 resize-none"
          />
        </div>

        {/* Accounts Management */}
        <div className="mt-8 pt-8 border-t border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Account Management</h3>
          <p className="text-xs text-[var(--muted)] mb-4">Add, edit, or remove accounts</p>
          
          {/* Account list */}
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {form.accounts.map((acc: any) => (
              <div key={acc.id} className="p-3 rounded bg-[var(--background)] flex items-center justify-between">
                <span className="font-medium">{acc.name}</span>
                <span className="text-xs text-[var(--muted)]">{acc.type}</span>
                <button
                  onClick={() => removeAccount(acc.id)}
                  className="text-[var(--danger)] text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Add new account form */}
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Account name"
              className="py-1 rounded border px-2 text-sm flex-1"
            />
            <select className="py-1 rounded border px-2 text-sm">
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="cash">Cash</option>
              <option value="credit-card">Credit Card</option>
              <option value="custom">Custom</option>
            </select>
            <button
              onClick={() => addAccount({
                id: `acc-${Date.now()}`,
                name: 'New Account',
                type: 'checking',
                currency: 'USD',
                openingBalance: 0,
                currentBalance: 0,
                taxRate: 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              }) as any}
              className="btn btn-small px-3 py-1 text-sm text-[var(--accent)] hover:bg-[var(--soft-bg)]"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={handleCancel}
          className="px-6 py-2 rounded text-sm text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}