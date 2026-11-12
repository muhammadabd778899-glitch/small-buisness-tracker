import React, { useState } from 'react'
import { useBusinessStore } from '../store/business'

export const GlobalSearchAndQuickActions: React.FC = () => {
  const { clients, products, invoices, orders, payments, bills, tasks } = useBusinessStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense' | 'client' | 'product' | 'order' | 'invoice' | 'bill' | 'task'>('income')

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const lowercaseQuery = query.toLowerCase()
    
    const results: any[] = []
    
    // Search clients
    clients.forEach((client: any) => {
      if (client.name.toLowerCase().includes(lowercaseQuery) || 
          client.company?.toLowerCase().includes(lowercaseQuery) ||
          client.email.toLowerCase().includes(lowercaseQuery)) {
        results.push({ ...client, type: 'client' })
      }
    })
    
    // Search products
    products.forEach((product: any) => {
      if (product.name.toLowerCase().includes(lowercaseQuery) ||
          product.sku.toLowerCase().includes(lowercaseQuery) ||
          product.category.toLowerCase().includes(lowercaseQuery)) {
        results.push({ ...product, type: 'product' })
      }
    })
    
    // Search invoices
    invoices.forEach((invoice: any) => {
      if (invoice.invoiceNumber.toLowerCase().includes(lowercaseQuery) ||
          invoice.client?.name?.toLowerCase().includes(lowercaseQuery)) {
        results.push({ ...invoice, type: 'invoice' })
      }
    })
    
    // Search orders
    orders.forEach((order: any) => {
      if (order.id.toLowerCase().includes(lowercaseQuery) ||
          order.client?.name?.toLowerCase().includes(lowercaseQuery)) {
        results.push({ ...order, type: 'order' })
      }
    })
    
    // Search payments
    payments.forEach((payment: any) => {
      if (payment.reference?.toLowerCase().includes(lowercaseQuery) ||
          payment.invoice?.invoiceNumber?.toLowerCase().includes(lowercaseQuery)) {
        results.push({ ...payment, type: 'payment' })
      }
    })
    
    // Search bills
    bills.forEach((bill: any) => {
      if (bill.name.toLowerCase().includes(lowercaseQuery)) {
        results.push({ ...bill, type: 'bill' })
      }
    })
    
    // Search tasks
    tasks.forEach((task: any) => {
      if (task.title.toLowerCase().includes(lowercaseQuery)) {
        results.push({ ...task, type: 'task' })
      }
    })
    
    setSearchResults(results)
  }

  // Quick add actions
  const handleQuickAdd = (type: string) => {
    setQuickAddType(type as any)
    setShowQuickAdd(true)
  }

  const closeQuickAdd = () => {
    setShowQuickAdd(false)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <div className="mt-4">
      {/* Global Search */}
      <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)] mb-6">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-3">Global Search</h3>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 21l-3.8-3.8c-.3-.3-.3-.8 0-.9l3.1-3.1c.2-.2.2-.5 0-.7l-5.3-5.3c-.2-.2-.5-.2-.7 0l-3 3c-.2.2-.5.2-.7 0L3 3c-.5.5-.5.9 0 1.4l1.7 1.7c.2.2.5.2.7 0l5.3-5.3c.2-.2.2-.5 0-.7l-3.8-3.8c-.3-.3-.8-.3-1.1 0zM3 14l1.4 1.4c.2.2.5.2.7 0l3.1-3.1c.2-.2.2-.5 0-.7l-1.4-1.4c-.2-.2-.2-.5 0-.7l1.4-1.4c.2-.2.5-.2.7 0L5 13c.3.3.8.3 1.1 0l3.1 3.1c.2.2.5.2.7 0l1.4 1.4c.2.2.2.5 0 .7z"/>
          </svg>
          <input
            type="text"
            placeholder="Search clients, products, invoices..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded border bg-transparent text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="mt-3 max-h-40 overflow-y-auto text-sm">
          {searchResults.length > 0 ? (
            <div>
              {searchResults.slice(0, 10).map((result: any) => (
                <div
                  key={result.id}
                  className="p-2 rounded bg-[var(--background)] hover:bg-[var(--soft-bg)] cursor-pointer mb-1"
                  onClick={() => {
                    // Navigate to the result
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                >
                  <span className="font-medium">{result.name || result.id}</span>
                  <span className="text-[var(--muted)] text-xs">{result.type || ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--muted)] text-xs py-2">No results found</p>
          )}
        </div>
      </div>

      {/* Quick Add Actions */}
      <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-3">Quick Add</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleQuickAdd('income')}
            className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors">
            Income
          </button>
          <button
            onClick={() => handleQuickAdd('expense')}
            className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors">
            Expense
          </button>
          <button
            onClick={() => handleQuickAdd('client')}
            className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors">
            Client
          </button>
          <button
            onClick={() => handleQuickAdd('product')}
            className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors">
            Product
          </button>
          <button
            onClick={() => handleQuickAdd('order')}
            className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors">
            Order
          </button>
          <button
            onClick={() => handleQuickAdd('invoice')}
            className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors">
            Invoice
          </button>
          <button
            onClick={() => handleQuickAdd('bill')}
            className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors">
            Bill
          </button>
          <button
            onClick={() => handleQuickAdd('task')}
            className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors">
            Task
          </button>
        </div>
      </div>
    </div>
  )
}