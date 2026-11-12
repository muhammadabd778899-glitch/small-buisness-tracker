import { Plus, Trash2 } from 'lucide-react'
import type { BusinessSettings, Product } from '../lib/types'
import { computeTotals } from '../lib/calc'
import { formatCurrency, round2 } from '../lib/money'
import { uid } from '../lib/db'
import { Button, Field } from './ui'

export interface LineDraft {
  id: string
  productId: string | null
  description: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
}

export function emptyLine(taxRate = 0): LineDraft {
  return {
    id: uid('line'),
    productId: null,
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    taxRate
  }
}

export interface LineItemsEditorProps {
  items: LineDraft[]
  onChange: (items: LineDraft[]) => void
  products: Product[]
  settings: BusinessSettings
  discount: number
  onDiscountChange: (value: number) => void
  delivery?: number
  onDeliveryChange?: (value: number) => void
}

export function LineItemsEditor({
  items,
  onChange,
  products,
  settings,
  discount,
  onDiscountChange,
  delivery,
  onDeliveryChange
}: LineItemsEditorProps) {
  const totals = computeTotals(items, discount, settings.taxInclusive)
  const grandTotal = round2(totals.total + Math.max(0, delivery || 0))

  const update = (id: string, patch: Partial<LineDraft>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const chooseProduct = (id: string, productId: string) => {
    const product = products.find((row) => row.id === productId)
    if (!product) {
      update(id, { productId: null })
      return
    }
    update(id, {
      productId: product.id,
      description: product.name,
      unitPrice: product.price,
      taxRate: settings.defaultTaxRate
    })
  }

  return (
    <div>
      <div className="table-wrap">
        <table className="data-table" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 170 }}>Product</th>
              <th style={{ minWidth: 180 }}>Description</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Line discount</th>
              <th>Tax %</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <select
                    className="select"
                    value={item.productId || ''}
                    onChange={(event) => chooseProduct(item.id, event.target.value)}
                    aria-label="Product"
                  >
                    <option value="">Custom item</option>
                    {products
                      .filter((product) => product.isActive)
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <input
                    className="input"
                    value={item.description}
                    onChange={(event) => update(item.id, { description: event.target.value })}
                    placeholder="What are you charging for?"
                    aria-label="Description"
                  />
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => update(item.id, { quantity: Number(event.target.value) })}
                    aria-label="Quantity"
                  />
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) => update(item.id, { unitPrice: Number(event.target.value) })}
                    aria-label="Unit price"
                  />
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.discount}
                    onChange={(event) => update(item.id, { discount: Number(event.target.value) })}
                    aria-label="Line discount"
                  />
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.taxRate}
                    onChange={(event) => update(item.id, { taxRate: Number(event.target.value) })}
                    aria-label="Tax rate"
                  />
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {formatCurrency(
                    Math.max(0, item.quantity * item.unitPrice - Math.max(0, item.discount)),
                    settings
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Button
                    small
                    variant="ghost"
                    onClick={() => onChange(items.filter((row) => row.id !== item.id))}
                    aria-label="Remove line"
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button small onClick={() => onChange([...items, emptyLine(settings.defaultTaxRate)])}>
          <Plus size={14} /> Add line item
        </Button>
        {!items.length ? <span className="text-xs text-muted">Add at least one line to save the document.</span> : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-3">
          <Field label="Document discount" hint="Applied before tax. Cannot exceed the subtotal.">
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(event) => onDiscountChange(Number(event.target.value))}
            />
          </Field>
          {onDeliveryChange ? (
            <Field label="Delivery / shipping charged">
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={delivery || 0}
                onChange={(event) => onDeliveryChange(Number(event.target.value))}
              />
            </Field>
          ) : null}
        </div>
        <div className="rounded-xl border border-line bg-canvas p-3 text-sm">
          <div className="flex justify-between py-0.5">
            <span className="text-muted">Subtotal</span>
            <span>{formatCurrency(totals.subtotal, settings)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-muted">Discount</span>
            <span>−{formatCurrency(totals.discount, settings)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-muted">Tax {settings.taxInclusive ? '(included)' : ''}</span>
            <span>{formatCurrency(totals.taxAmount, settings)}</span>
          </div>
          {delivery ? (
            <div className="flex justify-between py-0.5">
              <span className="text-muted">Delivery</span>
              <span>{formatCurrency(delivery, settings)}</span>
            </div>
          ) : null}
          <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(grandTotal, settings)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
