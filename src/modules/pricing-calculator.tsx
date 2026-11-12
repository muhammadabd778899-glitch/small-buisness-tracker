import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const PricingCalculator: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, products, materials, addProduct } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state for pricing calculation
  const [form, setForm] = useState<{
    name: string
    materials: Array<{
      materialId: string
      quantity: number
      unitCost: number
    }>
    laborHours: number
    laborHourlyRate: number
    packaging: number
    overhead: number
    otherCosts: number
    paymentFeesPercent: number
    marketplaceFeesPercent: number
    desiredMarginPercent: number
  }>({
    name: '',
    materials: [],
    laborHours: 0,
    laborHourlyRate: 0,
    packaging: 0,
    overhead: 0,
    otherCosts: 0,
    paymentFeesPercent: 0,
    marketplaceFeesPercent: 0,
    desiredMarginPercent: 0
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Materials already in store
  }, [materials])

  const calculate = () => {
    const { materials, laborHours, laborHourlyRate, packaging, overhead, otherCosts, paymentFeesPercent, marketplaceFeesPercent, desiredMarginPercent } = form

    // Calculate material cost
    let materialCost = 0
    materials.forEach((m: any) => {
      materialCost += m.quantity * m.unitCost
    })

    // Calculate labor cost
    const laborCost = laborHours * laborHourlyRate

    // Calculate total production cost
    const totalProductionCost = materialCost + laborCost + packaging + overhead + otherCosts

    // Calculate unit cost (assuming 1 unit yield for simplicity)
    const unitCost = totalProductionCost

    // Calculate selling price based on desired margin
    // Margin = profit / selling price, so: selling price = cost / (1 - margin%)
    const marginFactor = 1 - (desiredMarginPercent / 100)
    const sellingPrice = marginFactor > 0 ? unitCost / marginFactor : unitCost * 2

    // Calculate fees
    const paymentFees = sellingPrice * (paymentFeesPercent / 100)
    const marketplaceFees = sellingPrice * (marketplaceFeesPercent / 100)
    const totalFees = paymentFees + marketplaceFees

    // Calculate net proceeds
    const grossProfit = sellingPrice - unitCost
    const netProceeds = sellingPrice - totalFees - unitCost

    // Calculate markup
    const markupPercent = unitCost > 0 ? ((sellingPrice - unitCost) / unitCost) * 100 : 0

    return {
      materialCost,
      laborCost,
      totalProductionCost: unitCost,
      sellingPrice,
      profitPerUnit: sellingPrice - unitCost,
      marginPercent: desiredMarginPercent,
      markupPercent,
      paymentFees,
      marketplaceFees,
      totalFees,
      netProceeds,
      // Display values formatted
      display: {
        materialCost: materialCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        laborCost: laborCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        totalProductionCost: unitCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        sellingPrice: sellingPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        profitPerUnit: (sellingPrice - unitCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        marginPercent: desiredMarginPercent,
        markupPercent: markupPercent.toFixed(1),
        paymentFees: paymentFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        marketplaceFees: marketplaceFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        netProceeds: netProceeds.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
      }
    }
  }

  const handleShowForm = (id?: string, calculation?: any) => {
    if (id && calculation) {
      setForm({
        name: calculation.name || '',
        materials: calculation.materials || [],
        laborHours: calculation.laborHours || 0,
        laborHourlyRate: calculation.laborHourlyRate || 0,
        packaging: calculation.packaging || 0,
        overhead: calculation.overhead || 0,
        otherCosts: calculation.otherCosts || 0,
        paymentFeesPercent: calculation.paymentFeesPercent || 0,
        marketplaceFeesPercent: calculation.marketplaceFeesPercent || 0,
        desiredMarginPercent: calculation.desiredMarginPercent || 20
      })
      setEditingId(id)
    } else {
      setForm({
        name: '',
        materials: [],
        laborHours: 0,
        laborHourlyRate: 0,
        packaging: 0,
        overhead: 0,
        otherCosts: 0,
        paymentFeesPercent: 0,
        marketplaceFeesPercent: 0,
        desiredMarginPercent: 20
      })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleHideForm = () => {
    setShowForm(false)
    setForm({
      name: '',
      materials: [],
      laborHours: 0,
      laborHourlyRate: 0,
      packaging: 0,
      overhead: 0,
      otherCosts: 0,
      paymentFeesPercent: 0,
      marketplaceFeesPercent: 0,
      desiredMarginPercent: 20
    })
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      const calculationResult = calculate()

      const productData = {
        name: form.name,
        sku: form.name.toUpperCase().replace(/[^A-Z0-9]/g, '') || `PKG-${Date.now()}`,
        category: 'Custom',
        description: `Pricing calculation: ${form.name}`,
        unit: 'piece',
        estimatedCost: form.materials.reduce((sum: number, (m: any) => sum + m.quantity * m.unitCost, 0),
          0) + form.laborHours * form.laborHourlyRate + form.packaging + form.overhead + form.otherCosts,
        sellingPrice: calculateResult.sellingPrice,
        profitPerUnit: calculateResult.profitPerUnit,
        profitMargin: calculateResult.marginPercent,
        stockQuantity: 0,
        reorderThreshold: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        await addProduct(productData)
      } else {
        await addProduct(productData)
      }

      setShowForm(false)
    } catch (error) {
      console.error('Failed to save pricing calculation:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Pricing Calculator</h2>

      {/* Calculation Results */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-3xl mx-auto">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingId ? 'Pricing Calculation' : 'New Pricing Calculation'}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-[var(--muted)]">Material Cost</p>
              <p className="text-2xl font-bold text-[var(--accent)]">{calculationResult.display.materialCost}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Labor Cost</p>
              <p className="text-2xl font-bold text-[var(--accent)]">{calculationResult.display.laborCost}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-[var(--muted)]">Total Production Cost</p>
              <p className="text-2xl font-bold text-[var(--danger)]">{calculationResult.display.totalProductionCost}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Selling Price</p>
              <p className="text-2xl font-bold text-[var(--success)]">{calculationResult.display.sellingPrice}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-[var(--muted)]">Profit per Unit</p>
              <p className="text-2xl font-bold text-[var(--success)]">{calculationResult.display.profitPerUnit}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Margin %</p>
              <p className="text-2xl font-bold">{calculationResult.marginPercent}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-[var(--muted)]">Markup %</p>
              <p className="text-2xl font-bold text-[var(--accent)]">{calculationResult.display.markupPercent}%</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Payment Fees</p>
              <p className="text-2xl font-bold text-[var(--muted)]">{calculationResult.display.paymentFees}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-[var(--muted)]">Marketplace Fees</p>
              <p className="text-2xl font-bold text-[var(--muted)]">{calculationResult.display.marketplaceFees}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Net Proceeds</p>
              <p className="text-2xl font-bold text-[var(--success)]">{calculationResult.display.netProceeds}</p>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Calculation Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Labor Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.laborHours}
                  onChange={(e) => setForm({ ...form, laborHours: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Labor Hourly Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.laborHourlyRate}
                  onChange={(e) => setForm({ ...form, laborHourlyRate: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Packaging Cost</label>
              <input
                type="number"
                step="0.01"
                value={form.packaging}
                onChange={(e) => setForm({ ...form, packaging: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Overhead</label>
              <input
                type="number"
                step="0.01"
                value={form.overhead}
                onChange={(e) => setForm({ ...form, overhead: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Other Costs</label>
              <input
                type="number"
                step="0.01"
                value={form.otherCosts}
                onChange={(e) => setForm({ ...form, otherCosts: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Payment Fees %</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.paymentFeesPercent}
                  onChange={(e) => setForm({ ...form, paymentFeesPercent: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Marketplace Fees %</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.marketplaceFeesPercent}
                  onChange={(e) => setForm({ ...form, marketplaceFeesPercent: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Desired Margin %</label>
              <input
                type="number"
                step="0.1"
                value={form.desiredMarginPercent}
                onChange={(e) => setForm({ ...form, desiredMarginPercent: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Material 1</label>
                <select
                  value={form.materials[0]?.materialId || ''}
                  onChange={(e) => {
                    const newMaterials = [...form.materials]
                    newMaterials[0] = { ...newMaterials[0], materialId: e.target.value }
                    setForm({ ...form, materials: newMaterials })
                  }}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="">Select Material</option>
                  {isDemo ? materials.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (${m.unitCost.toFixed(2)}/unit)
                    </option>
                  ) : (
                    '<option value="">Select Material</option>'
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Material 1 Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.materials[0]?.quantity || 1}
                  onChange={(e) => {
                    const newMaterials = [...form.materials]
                    newMaterials[0] = { ...newMaterials[0], quantity: Number(e.target.value )}
                    setForm({ ...form, materials: newMaterials })
                  }}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Material 2</label>
                <select
                  value={form.materials[1]?.materialId || ''}
                  onChange={(e) => {
                    const newMaterials = [...form.materials]
                    newMaterials[1] = { ...newMaterials[1], materialId: e.target.value }
                    setForm({ ...form, materials: newMaterials })
                  }}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="">Select Material</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Material 2 Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.materials[1]?.quantity || 0}
                  onChange={(e) => {
                    const newMaterials = [...form.materials]
                    newMaterials[1] = { ...newMaterials[1], quantity: Number(e.target.value )}
                    setForm({ ...form, materials: newMaterials })
                  }}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Material 3</label>
                <select
                  value={form.materials[2]?.materialId || ''}
                  onChange={(e) => {
                    const newMaterials = [...form.materials]
                    newMaterials[2] = { ...newMaterials[2], materialId: e.target.value }
                    setForm({ ...form, materials: newMaterials })
                  }}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="">Select Material</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Material 3 Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.materials[2]?.quantity || 0}
                  onChange={(e) => {
                    const newMaterials = [...form.materials]
                    newMaterials[2] = { ...newMaterials[2], quantity: Number(e.target.value )}
                    setForm({ ...form, materials: newMaterials })
                  }}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
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
                {editingId ? 'Save Calculation' : 'Calculate & Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Total Calculations</p>
          <p className="text-2xl font-bold">{isDemo ? 12 : 0}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Avg Margin</p>
          <p className="text-2xl font-bold text-[var(--success)]">{isDemo ? 73 : 0}%</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Highest Margin</p>
          <p className="text-2xl font-bold text-[var(--success)]">{isDemo ? 76 : 0}%</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Calculations Today</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  )
}