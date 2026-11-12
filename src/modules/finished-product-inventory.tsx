import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const FinishedProductInventory: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, products, orders, invoices } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Inventory tracking state
  const [inventory, setInventory] = useState<Map<string, any>>(new Map())

  // Initialize inventory from products and orders
  useEffect(() => {
    const inventoryMap = new Map<string, any>()

    products.forEach(product => {
      inventoryMap.set(product.id, {
        productId: product.id,
        productName: product.name,
        openingStock: product.stockQuantity,
        producedQuantity: 0,
        soldQuantity: 0,
        reservedQuantity: 0,
        returnedQuantity: 0,
        damagedQuantity: 0,
        availableStock: product.stockQuantity,
        reorderLevel: product.reorderThreshold
      })
    })

    // Calculate sold quantity from orders/invoices
    const soldItems = [...orders, ...invoices].reduce((acc, item) => {
      // This is simplified - real implementation would parse line items
      return acc
    }, 0 as number)

    setInventory(inventoryMap)
  }, [products, orders, invoices])

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Finished Product Inventory</h2>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {products.map((product) => {
          const stock = inventory.get(product.id) || {
            availableStock: product.stockQuantity,
            producedQuantity: 0,
            soldQuantity: 0
          }

          return (
            <div
              key={product.id}
              className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]"
            >
              <h3 className="text-sm font-medium mb-2">{product.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[var(--muted)]">Opening:</p>
                  <p className="font-bold">{stock.openingStock}</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Available:</p>
                  <p className="font-bold text-[var(--success)]">{stock.availableStock}</p>
                </div>
              </div>
              <div>
                <p className="text-[var(--muted)]">Sold:</p>
                <p className="font-bold text-[var(--danger)]">{stock.soldQuantity}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Inventory Actions */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Inventory Movements</h3>
        <p className="text-sm text-[var(--muted)]">
          Track product movements: production, sales, returns, and adjustments.
        </p>

        {/* Production */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Produce</label>
            <input
              type="number"
              step="1"
              placeholder="Quantity"
              className="w-full py-1 rounded border px-2 text-sm"
            />
            <button
              className="mt-2 btn btn-small px-2 py-1 text-xs text-[var(--accent)] hover:bg-[var(--soft-bg)]"
            >
              Record Production
            </button>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Sell</label>
            <input
              type="number"
              step="1"
              placeholder="Quantity"
              className="w-full py-1 rounded border px-2 text-sm"
            />
            <button
              className="mt-2 btn btn-small px-2 py-1 text-xs text-[var(--danger)] hover:bg-[var(--soft-bg)]"
            >
              Record Sale
            </button>
          </div>
        </div>

        {/* Returns and Adjustments */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Returns</label>
            <input
              type="number"
              step="1"
              placeholder="Quantity"
              className="w-full py-1 rounded border px-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Damaged</label>
            <input
              type="number"
              step="1"
              placeholder="Quantity"
              className="w-full py-1 rounded border px-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
          <textarea
            className="w-full py-2 rounded border bg-[var(--soft-bg)] text-[var(--fg)] h-24 resize-none"
            rows={3}
          ></textarea>
        </div>

        <button
          className="w-full py-3 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors mt-4"
        >
          Record Movement
        </button>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Low Stock Alerts</h3>
        {products.filter(p => p.stockQuantity <= p.reorderThreshold).length > 0 && (
          <div>
            <p className="text-sm text-[var(--danger)]">
              {products.filter(p => p.stockQuantity <= p.reorderThreshold).length} product(s) 
              below reorder threshold
            </p>
            <ul className="list-disc pl-3 mt-2 text-sm text-[var(--muted)]">
              {products
                .filter(p => p.stockQuantity <= p.reorderThreshold)
                .map((p) => (
                  <li key={p.id} className="mb-1">
                    {p.name}: {p.stockQuantity} in stock (threshold: {p.reorderThreshold})
                  </li>
                ))}
            </ul>
          </div>
        ) || (
          <p className="text-sm text-[var(--muted)]">All products above reorder threshold</p>
        )}
      </div>
    </div>
  )
}