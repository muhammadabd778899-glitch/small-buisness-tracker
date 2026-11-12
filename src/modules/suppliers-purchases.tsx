import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import { Supplier, Material } from '../lib/database'

export const SuppliersAndPurchases: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, suppliers, materials, purchases, addPurchase, updatePurchase, removePurchase, addPurchaseItem, removePurchaseItem } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    materialsSupplied: [],
    notes: ''
  })

  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState<{
    supplierId: string
    purchaseDate: Date
    expectedDate: Date
    status: 'pending'
    lineItems: any[]
    notes: string
  }>({
    supplierId: '',
    purchaseDate: new Date(),
    expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    status: 'pending',
    lineItems: [],
    notes: ''
  })

  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null)

  useEffect(() => {
    // Data already in store
  }, [suppliers, materials, purchases])

  // Add supplier
  const handleAddSupplier = () => {
    setSupplierForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      materialsSupplied: [],
      notes: ''
    })
    setShowSupplierForm(true)
  }

  const handleEditSupplier = (id: string, supplier: Supplier) => {
    setSupplierForm({
      ...supplier,
      materialsSupplied: supplier.materialsSupplied || []
    })
    setEditingSupplierId(id)
    setShowSupplierForm(true)
  }

  const handleSaveSupplier = async () => {
    try {
      if (editingSupplierId) {
        // Update existing
        await updateSupplier ?.() // Would call store update
      } else {
        // Add new - would use store
      }
      setShowSupplierForm(false)
    } catch (error) {
      console.error('Failed to save supplier:', error)
    }
  }

  const handleCancelSupplier = () => {
    setShowSupplierForm(false)
    setSupplierForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      materialsSupplied: [],
      notes: ''
    })
  }

  // Add purchase
  const handleAddPurchase = () => {
    setPurchaseForm({
      supplierId: '',
      purchaseDate: new Date(),
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      lineItems: [],
      notes: ''
    })
    setShowPurchaseForm(true)
  }

  const handleEditPurchase = (id: string, purchase: any) => {
    setPurchaseForm({
      ...purchase,
      lineItems: purchase.lineItems || []
    })
    setEditingPurchaseId(id)
    setShowPurchaseForm(true)
  }

  const handleSavePurchase = async () => {
    try {
      if (editingPurchaseId) {
        // Update existing purchase
      } else {
        // Add new purchase
        // Would also update inventory through material stock received
      }
      setShowPurchaseForm(false)
    } catch (error) {
      console.error('Failed to save purchase:', error)
    }
  }

  const handleCancelPurchase = () => {
    setShowPurchaseForm(false)
    setPurchaseForm({
      supplierId: '',
      purchaseDate: new Date(),
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      lineItems: [],
      notes: ''
    })
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Suppliers and Purchases</h2>

      {/* Suppliers Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Suppliers</h3>
        
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="p-3 rounded bg-[var(--background)] mb-2 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
              {supplier.name?.substring(0, 1)}
            </div>
            <div>
              <p className="font-medium text-sm">{supplier.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {supplier.materialsSupplied?.length || 0} materials
              </p>
            </div>
          </div>
        ))}

        <button
          onClick={handleAddSupplier}
          className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors mb-3"
        >
          + Add Supplier
        </button>
      </div>

      {/* Purchases Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Recent Purchases</h3>
        
        {purchases.map((purchase) => (
          <div
            key={purchase.id}
            className="p-3 rounded bg-[var(--background)] mb-2 text-sm"
          >
            <p className="font-medium">{suppliers.find(s => s.id === purchase.supplierId)?.name || 'Unknown Supplier'}</p>
            <p className="text-xs text-[var(--muted)]">
              {new Date(purchase.purchaseDate).toLocaleDateString()} - 
              {purchase.status}
            </p>
          </div>
        ))}

        <button
          onClick={handleAddPurchase}
          className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors mb-3"
        >
          + Create Purchase Order
        </button>
      </div>

      {/* Add Supplier Form */}
      {showSupplierForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-sm">
          <h3 className={editingSupplierId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingSupplierId ? 'Edit Supplier' : 'Add New Supplier'}
          </h3>

          <form>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Name</label>
              <input
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Email</label>
                <input
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Phone</label>
                <input
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Address</label>
              <input
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
              <textarea
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-24 resize-none"
                rows={3}
              ></textarea>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelSupplier}
                className="px-3 py-1 rounded text-xs text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSupplier}
                className="px-3 py-1 rounded bg-[var(--accent)] text-white text-xs hover:bg-[var(--deeporange)] transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Purchase Form */}
      {showPurchaseForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] max-w-md">
          <h3 className={editingPurchaseId ? 'text-sm font-medium text-[var(--dark)] mb-3' : 'text-sm font-medium text-[var(--muted)] mb-3'}>
            {editingPurchaseId ? 'Edit Purchase' : 'Create Purchase Order'}
          </h3>

          <form>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Supplier</label>
              <select
                value={purchaseForm.supplierId}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseForm.purchaseDate.toISOString().split('T')[0]}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Expected Date</label>
                <input
                  type="date"
                  value={purchaseForm.expectedDate.toISOString().split('T')[0]}
                  className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Status</label>
              <select
                value={purchaseForm.status}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, status: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)]"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
              <textarea
                value={purchaseForm.notes}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-32 resize-none"
                rows={3}
              ></textarea>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelPurchase}
                className="px-3 py-1 rounded text-xs text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePurchase}
                className="px-3 py-1 rounded bg-[var(--accent)] text-white text-xs hover:bg-[var(--deeporange)] transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}