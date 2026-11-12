import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'

export const Products: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, products, materials, suppliers } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Product profitability calculation
  const productsWithProfit = products.map(product => ({
    ...product,
    profitPerUnit: product.sellingPrice - product.estimatedCost,
    profitMargin: product.sellingPrice > 0 ? ((product.sellingPrice - product.estimatedCost) / product.sellingPrice) * 100 : 0
  }))

  // Sort by profitability (highest first)
  const sortedProducts = productsWithProfit.sort((a, b) => b.profitMargin - a.profitMargin)

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Product Catalog</h2>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)] hover:shadow-md hover:transition-shadow"
          >
            <h3 className="text-sm font-medium mb-2">{product.name}</h3>
            <p className="text-xs text-[var(--muted)] mb-2">{product.sku}</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">Cost:</span>
                <span>{product.estimatedCost.toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">Price:</span>
                <span>{product.sellingPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Margin:</span>
                  <span>{product.profitMargin.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="font-medium">Stock:</span>
                  <span>{product.stockQuantity}</span>
                </div>
              </div>

              {product.stockQuantity <= product.reorderThreshold && (
                <p className="text-xs text-[var(--danger)] mt-1">⚠️ Low stock</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Profitability Summary */}
      <div className="mt-8 bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Product Profitability Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          {sortedProducts.slice(0, 5).map((product) => (
            <div key={product.id} className="p-3 rounded bg-[var(--background)]">
              <p className="font-medium text-sm">{product.name}</p>
              <p className="text-xs text-[var(--muted)]">Margin: {product.profitMargin.toFixed(1)}%</p>
              <p className="text-xs text-[var(--muted)]">Profit/Unit: ${product.profitPerUnit.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Materials Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {materials.map((material) => (
          <div
            key={material.id}
            className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]"
          >
            <h3 className="text-sm font-medium mb-2">{material.name}</h3>
            <p className="text-xs text-[var(--muted)]">SKU: {material.sku}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">Stock:</span>
                <span>{material.currentStock}</span>
              </div>
              <div>
                <span className="font-medium">Unit Cost:</span>
                <span>{material.unitCost.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t">
              <span className="text-xs text-[var(--muted)]">Value: {material.stockValue.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Suppliers Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]"
          >
            <h3 className="text-sm font-medium mb-2">{supplier.name}</h3>
            <p className="text-xs text-[var(--muted)]">{supplier.materialsSupplied?.length || 0} materials</p>
            <p className="text-[var(--muted)] text-xs">{supplier.notes || ''}</p>
          </div>
        ))}
      </div>
    </div>
  )
}