import React, { useState } from 'react'
import { useBusinessStore } from '../store/business'

export const PricingCalculator: React.FC = () => {
  const { businessData } = useBusinessStore()

  // Calculator state
  const [inputs, setInputs] = useState<{
    baseCost: number
    materialCost: number
    laborCost: number
    overhead: number
    profitMargin: number
    quantity: number
    discount: number
  }>({
    baseCost: 0,
    materialCost: 0,
    laborCost: 0,
    overhead: 0,
    profitMargin: 0.2,
    quantity: 1,
    discount: 0
  })

  // Calculated results
  const calculate = () => {
    const { baseCost, materialCost, laborCost, overhead, profitMargin, quantity, discount } = inputs

    const totalMaterialCost = materialCost * quantity
    const totalLaborCost = laborCost * quantity
    const totalOverhead = overhead * quantity
    const subtotal = baseCost + totalMaterialCost + totalLaborCost + totalOverhead
    const profitAmount = subtotal * profitMargin
    const discountAmount = subtotal * (discount / 100)
    const total = subtotal + profitAmount - discountAmount

    return {
      subtotal,
      profitAmount,
      discountAmount,
      total
    }
  }

  const { subtotal, profitAmount, discountAmount, total } = calculate()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target
    const numValue = Number(value)

    setInputs({
      ...inputs,
      [name]: isNaN(numValue) ? 0 : numValue
    })
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Pricing Calculator</h2>

      {/* Calculator Form */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8 max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-[var(--dark)] mb-6">Cost Inputs</h3>

        <form>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Base Cost</label>
              <input
                type="number"
                step="0.01"
                name="baseCost"
                value={inputs.baseCost}
                onChange={handleInputChange}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Material Cost</label>
              <input
                type="number"
                step="0.01"
                name="materialCost"
                value={inputs.materialCost}
                onChange={handleInputChange}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Labor Cost</label>
              <input
                type="number"
                step="0.01"
                name="laborCost"
                value={inputs.laborCost}
                onChange={handleInputChange}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Overhead</label>
              <input
                type="number"
                step="0.01"
                name="overhead"
                value={inputs.overhead}
                onChange={handleInputChange}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Profit Margin (%)</label>
            <input
              type="number"
              step="0.1"
              name="profitMargin"
              value={inputs.profitMargin * 100}
              onChange={(e) => setInputs({ ...inputs, profitMargin: Number(e.target.value) / 100 })}
              className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={inputs.quantity}
                onChange={(e) => setInputs({ ...inputs, quantity: Number(e.target.value )})}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Discount (%)</label>
              <input
                type="number"
                step="0.1"
                name="discount"
                value={inputs.discount}
                onChange={handleInputChange}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Results Summary */}
      <div className="bg-[var(--card)] rounded-lg p-8 border border-[var(--border)] max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-[var(--dark)] mb-6">Pricing Summary</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-[var(--muted)]">Subtotal</p>
            <p className="text-2xl font-bold text-[var(--accent)]">{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted)]">Profit</p>
            <p className="text-2xl font-bold text-[var(--success)]">{profitAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-[var(--muted)]">Discount</p>
            <p className="text-2xl font-bold text-[var(--warning)]">-${discountAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted)]">Total</p>
            <p className="text-3xl font-bold text-[var(--danger)]">{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-[var(--muted)]">Profit Margin</p>
          <p className="text-lg font-medium {total > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}">
            {(profitAmount / total * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}