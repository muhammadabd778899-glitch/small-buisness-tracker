import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import { Product } from '../lib/database'

export const ProductCatalog: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, products, addProduct, updateProduct, removeProduct } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state
  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: 'Ceramics',
    description: '',
    unit: 'piece',
    estimatedCost: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    reorderThreshold: 5,
    isActive: true
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Calculate profitability
  const productsWithProfit = products.map(product => ({
    ...product,
    profitPerUnit: product.sellingPrice - product.estimatedCost,
    profitMargin: product.sellingPrice > 0 ? ((product.sellingPrice - product.estimatedCost) / product.sellingPrice) * 100 : 0
  }))

  // Sort by profitability (highest first)
  const sortedProducts = [...productsWithProfit].sort((a, b) => b.profitMargin - a.profitMargin)

  useEffect(() => {
    // Products already in store
  }, [products])

  const handleShowForm = (id?: string, product?: Product) => {
    if (id && product) {
      setForm({
        ...product,
        estimatedCost: product.estimatedCost || 0,
        sellingPrice: product.sellingPrice || 0,
        stockQuantity: product.stockQuantity || 0
      })
      setEditingId(id)
    } else {
      setForm({
        name: '',
        sku: '',
        category: 'Ceramics',
        description: '',
        unit: 'piece',
        estimatedCost: 0,
        sellingPrice: 0,
        stockQuantity: 0,
        reorderThreshold: 5,
        isActive: true
      })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleHideForm = () => {
    setShowForm(false)
    setForm({
      name: '',
      sku: '',
      category: 'Ceramics',
      description: '',
      unit: 'piece',
      estimatedCost: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      reorderThreshold: 5,
      isActive: true
    })
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      const productData: Product = {
        ...form,
        id: editingId || `prod-${Date.now()}`,
        profitPerUnit: form.sellingPrice - form.estimatedCost,
        profitMargin: form.sellingPrice > 0 ? ((form.sellingPrice - form.estimatedCost) / form.sellingPrice) * 100 : 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        await updateProduct(editingId, {
          name: form.name,
          sku: form.sku,
          category: form.category,
          description: form.description,
          unit: form.unit,
          estimatedCost: form.estimatedCost,
          sellingPrice: form.sellingPrice,
          profitPerUnit: productData.profitPerUnit,
          profitMargin: productData.profitMargin,
          stockQuantity: form.stockQuantity,
          reorderThreshold: form.reorderThreshold,
          isActive: form.isActive
        })
      } else {
        await addProduct(productData)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save product:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Product Catalog</h2>

      {/* Product Grid with Profitability */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)] hover:shadow-md hover:transition-shadow"
          >
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <span className="font-medium text-[var(--muted)]">Cost:</span>
                <span>{product.estimatedCost.toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium text-[var(--muted)]">Price:</span>
                <span>{product.sellingPrice.toLocaleString()}</span>
              </div>
            </div>

            <h3 className="text-sm font-medium mb-2">{product.name}</h3>
            <p className="text-xs text-[var(--muted)]">{product.sku}</p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">Margin:</span>
                <span>{product.profitMargin.toFixed(1)}%</span>
              </div>
              <div>
                <span className="font-medium">Profit/Unit:</span>
                <span>${product.profitPerUnit.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t">
              <span className="text-xs text-[var(--muted)]">Stock: {product.stockQuantity}</span>
              {product.stockQuantity <= product.reorderThreshold && (
                <span className="text-xs text-[var(--danger)] ml-1">⚠️ Low</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Profitability Summary Top 5 */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {sortedProducts.slice(0, 5).map((product) => (
          <div key={product.id} className="p-3 rounded bg-[var(--background)]">
            <p className="font-medium text-sm">{product.name}</p>
            <p className="text-xs text-[var(--muted)]">Margin: {product.profitMargin.toFixed(1)}%</p>
            <p className="text-xs text-[var(--muted)]">Profit/Unit: ${product.profitPerUnit.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Product Form */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-2xl mx-auto">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h3>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Product Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">SKU</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="Ceramics">Ceramics</option>
                  <option value="Woodwork">Woodwork</option>
                  <option value="Leather Goods">Leather Goods</option>
                  <option value="Resin Art">Resin Art</option>
                  <option value="Textiles">Textiles</option>
                  <option value="Glassware">Glassware</option>
                  <option value="Metalwork">Metalwork</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Estimated Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.estimatedCost || 0}
                  onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Selling Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.sellingPrice || 0}
                  onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Description</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-24 resize-none"
                rows={3}
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="piece">piece</option>
                  <option value="set">set</option>
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
                  <option value="hour">hour</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Reorder Threshold</label>
                <input
                  type="number"
                  value={form.reorderThreshold || 5}
                  onChange={(e) => setForm({ ...form, reorderThreshold: Number(e.target.value )})}
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
                {editingId ? 'Update' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}