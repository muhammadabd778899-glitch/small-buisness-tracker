import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import { Material } from '../lib/database'

export const RawMaterialInventory: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, materials, addMaterial, updateMaterial, removeMaterial, db } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Form state
  const [form, setForm] = useState<Partial<Material>>({
    name: '',
    sku: '',
    category: 'Clay',
    supplierId: '',
    unit: 'bag',
    openingStock: 0,
    stockReceived: 0,
    stockConsumed: 0,
    waste: 0,
    adjustments: 0,
    currentStock: 0,
    unitCost: 0,
    stockValue: 0,
    minimumStock: 0,
    reorderQuantity: 10,
    expiryDate: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Materials already in store
  }, [materials])

  const handleShowForm = (id?: string, material?: Material) => {
    if (id && material) {
      setForm({
        ...material,
        expiryDate: material.expiryDate ? new Date(material.expiryDate) : null
      })
      setEditingId(id)
    } else {
      setForm({
        name: '',
        sku: '',
        category: 'Clay',
        supplierId: '',
        unit: 'bag',
        openingStock: 0,
        stockReceived: 0,
        stockConsumed: 0,
        waste: 0,
        adjustments: 0,
        currentStock: 0,
        unitCost: 0,
        stockValue: 0,
        minimumStock: 0,
        reorderQuantity: 10,
        expiryDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
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
      category: 'Clay',
      supplierId: '',
      unit: 'bag',
      openingStock: 0,
      stockReceived: 0,
      stockConsumed: 0,
      waste: 0,
      adjustments: 0,
      currentStock: 0,
      unitCost: 0,
      stockValue: 0,
      minimumStock: 0,
      reorderQuantity: 10,
      expiryDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      // Calculate current stock
      const currentStock = (
        (form.openingStock || 0) +
        (form.stockReceived || 0) -
        (form.stockConsumed || 0) -
        (form.waste || 0) +
        (form.adjustments || 0)
      )

      // Calculate stock value
      const stockValue = (currentStock * (form.unitCost || 0))

      const materialData: Material = {
        ...form,
        id: editingId || `mat-${Date.now()}`,
        currentStock,
        stockValue,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        await updateMaterial(editingId, {
          name: form.name,
          sku: form.sku,
          category: form.category,
          supplierId: form.supplierId,
          unit: form.unit,
          openingStock: form.openingStock,
          stockReceived: form.stockReceived,
          stockConsumed: form.stockConsumed,
          waste: form.waste,
          adjustments: form.adjustments,
          currentStock,
          unitCost: form.unitCost,
          stockValue,
          minimumStock: form.minimumStock,
          reorderQuantity: form.reorderQuantity,
          expiryDate: form.expiryDate?.toISOString().split('T')[0] || null
        })
      } else {
        await addMaterial(materialData)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save material:', error)
    }
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Raw Material Inventory</h2>

      {/* Materials Table */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Material Stock Levels</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Unit Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Stock Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Min Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Reorder Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-[var(--soft-bg)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {material.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {material.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {material.currentStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {material.unitCost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {material.stockValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {material.minimumStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {material.reorderQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="text-[var(--muted)] text-sm hover:text-[var(--accent)]"
                      onClick={() => handleShowForm(material.id, material)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Material Form */}
      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-2xl mx-auto">
          <h3 className={editingId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingId ? 'Edit Material' : 'Add New Material'}
          </h3>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Name</label>
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
                  <option value="Clay">Clay</option>
                  <option value="Wood">Wood</option>
                  <option value="Leather">Leather</option>
                  <option value="Resin">Resin</option>
                  <option value="Fabric">Fabric</option>
                  <option value="Metal">Metal</option>
                  <option value="Paints">Paints</option>
                  <option value="Finishes">Finishes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="bag">bag</option>
                  <option value="plank">plank</option>
                  <option value="sheet">sheet</option>
                  <option value="kit">kit</option>
                  <option value="yard">yard</option>
                  <option value="roll">roll</option>
                  <option value="set">set</option>
                  <option value="bottle">bottle</option>
                  <option value="can">can</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Supplier</label>
                <select
                  value={form.supplierId || ''}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                >
                  <option value="">No Supplier</option>
                  {/* Suppliers would be populated here */}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Opening Stock</label>
                <input
                  type="number"
                  step="1"
                  value={form.openingStock || 0}
                  onChange={(e) => setForm({ ...form, openingStock: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Minimum Stock</label>
                <input
                  type="number"
                  step="1"
                  value={form.minimumStock || 0}
                  onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Reorder Quantity</label>
                <input
                  type="number"
                  step="1"
                  value={form.reorderQuantity || 10}
                  onChange={(e) => setForm({ ...form, reorderQuantity: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Unit Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.unitCost || 0}
                  onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value )})}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Expiry Date</label>
              <input
                type="date"
                value={form.expiryDate ? form.expiryDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value ? new Date(e.target.value) : null })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-24 resize-none"
                rows={3}
              ></textarea>
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
                {editingId ? 'Update' : 'Add Material'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}