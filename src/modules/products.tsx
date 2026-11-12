import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, Pencil, Plus, Sparkles, Trash2, Upload } from 'lucide-react'
import type { Product } from '../lib/types'
import { useApp } from '../store/app'
import { useData, useQuickCreate } from '../components/hooks'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Field,
  FormGrid,
  IconButton,
  KpiCard,
  Modal,
  PageHeader,
  PageTabs,
  SectionTitle
} from '../components/ui'
import type { CsvField } from '../components/forms'
import { CsvImportModal } from '../components/forms'
import { calculatePricing, lowStockProducts } from '../lib/calc'
import type { PricingResult } from '../lib/calc'
import { formatCurrency, round2, safeNumber, sumBy } from '../lib/money'
import { exportCSV } from '../lib/csv'
import { downloadPriceListPdf } from '../lib/pdf'
import { nowISO, recomputeStock, uid } from '../lib/db'

export const PRODUCT_TABS = [
  { label: 'Product catalog', to: '/products/catalog' },
  { label: 'Pricing calculator', to: '/products/pricing' },
  { label: 'Raw materials', to: '/products/materials' },
  { label: 'Inventory', to: '/products/inventory' },
  { label: 'Suppliers & purchases', to: '/products/suppliers' }
]

/* -------------------------------------------------------------------------- */
/* Catalog                                                                    */
/* -------------------------------------------------------------------------- */

export function CatalogPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [category, setCategory] = useState('all')
  const [activeFilter, setActiveFilter] = useState('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  useQuickCreate(openCreate)

  const rows = useMemo(
    () =>
      data.products
        .filter((product) => category === 'all' || product.category === category)
        .filter((product) =>
          activeFilter === 'all' ? true : activeFilter === 'active' ? product.isActive : !product.isActive
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.products, category, activeFilter]
  )

  const low = lowStockProducts(data)

  const deleteProduct = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      for (const movement of data.inventoryMovements.filter(
        (row) => row.itemType === 'product' && row.itemId === deleting.id
      )) {
        await remove('inventoryMovements', movement.id)
      }
      await remove('products', deleting.id)
      await log('delete', `Deleted product "${deleting.name}"`, 'Product', deleting.id)
      notify('Product deleted. Historical invoice and order lines are kept.', 'success')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const importFields: CsvField[] = [
    { key: 'name', label: 'Product name', aliases: ['name', 'product'], required: true },
    { key: 'sku', label: 'SKU', aliases: ['code'] },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', aliases: ['sale price', 'selling price'], required: true },
    { key: 'cost', label: 'Cost', aliases: ['unit cost'] },
    { key: 'stock', label: 'Opening stock', aliases: ['quantity', 'stock'] },
    { key: 'reorder', label: 'Reorder threshold', aliases: ['reorder level', 'minimum stock'] },
    { key: 'unit', label: 'Unit' },
    { key: 'description', label: 'Description' }
  ]

  const runImport = async (importRows: Record<string, string>[]) => {
    const { putMany, reload } = useApp.getState()
    const products: Product[] = []
    const movements = []
    for (const row of importRows) {
      const price = round2(safeNumber(row.price))
      if (!row.name || price <= 0) continue
      const id = uid('product')
      products.push({
        id,
        name: row.name,
        sku: row.sku || '',
        category: row.category || data.settings.productCategories[0] || 'Other',
        description: row.description || '',
        unit: row.unit || 'piece',
        cost: round2(safeNumber(row.cost)),
        price,
        stockQuantity: 0,
        reorderThreshold: round2(safeNumber(row.reorder)),
        isActive: true,
        createdAt: nowISO(),
        updatedAt: nowISO()
      })
      const stock = round2(safeNumber(row.stock))
      if (stock > 0) {
        movements.push({
          id: uid('mv'),
          itemType: 'product' as const,
          itemId: id,
          date: nowISO().slice(0, 10),
          type: 'opening' as const,
          quantity: stock,
          unitCost: round2(safeNumber(row.cost)),
          reference: 'Opening stock (CSV import)',
          notes: '',
          createdAt: nowISO()
        })
      }
    }
    await putMany('products', products)
    await putMany('inventoryMovements', movements)
    for (const product of products) await recomputeStock('product', product.id)
    await reload()
    await log('import', `Imported ${products.length} products`, 'Product')
    notify(`${products.length} products imported.`, 'success')
    return products.length
  }

  const totalStockValue = sumBy(data.products, (product) => product.stockQuantity * product.cost)
  const retailValue = sumBy(data.products, (product) => product.stockQuantity * product.price)

  const columns = [
    {
      key: 'name',
      label: 'Product',
      sortValue: (row: Product) => row.name,
      render: (row: Product) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-[11px] text-muted">{row.sku || 'No SKU'} · {row.category}</p>
        </div>
      )
    },
    {
      key: 'cost',
      label: 'Cost',
      align: 'right' as const,
      sortValue: (row: Product) => row.cost,
      render: (row: Product) => formatCurrency(row.cost, data.settings)
    },
    {
      key: 'price',
      label: 'Price',
      align: 'right' as const,
      sortValue: (row: Product) => row.price,
      render: (row: Product) => <span className="font-semibold">{formatCurrency(row.price, data.settings)}</span>
    },
    {
      key: 'margin',
      label: 'Margin',
      align: 'right' as const,
      sortValue: (row: Product) => (row.price > 0 ? (row.price - row.cost) / row.price : 0),
      render: (row: Product) => {
        const margin = row.price > 0 ? ((row.price - row.cost) / row.price) * 100 : 0
        return <span className={margin < 20 ? 'text-warning' : 'text-success'}>{margin.toFixed(1)}%</span>
      }
    },
    {
      key: 'stock',
      label: 'Stock',
      align: 'right' as const,
      sortValue: (row: Product) => row.stockQuantity,
      render: (row: Product) => (
        <div className="flex items-center justify-end gap-1.5">
          <span className={row.stockQuantity <= row.reorderThreshold ? 'font-semibold text-warning' : ''}>
            {row.stockQuantity}
          </span>
          {row.stockQuantity <= row.reorderThreshold ? <Badge tone="warning">Low</Badge> : null}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Product) => <Badge tone={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
    },
    {
      key: 'actions',
      label: '',
      render: (row: Product) => (
        <div className="table-actions">
          <IconButton
            label="Edit product"
            onClick={() => {
              setEditing(row)
              setModalOpen(true)
            }}
          >
            <Pencil size={14} />
          </IconButton>
          <IconButton label="Delete product" onClick={() => setDeleting(row)}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Products"
        title="Product catalog"
        description="Your finished goods with cost, selling price, margin and stock on hand."
        actions={
          <>
            <Button onClick={() => setImportOpen(true)}><Upload size={15} /> Import</Button>
            <Button
              onClick={() => {
                exportCSV('products.csv', rows, [
                  { key: 'name', label: 'Product name', getValue: (row) => row.name },
                  { key: 'sku', label: 'SKU', getValue: (row) => row.sku },
                  { key: 'category', label: 'Category', getValue: (row) => row.category },
                  { key: 'cost', label: 'Cost', getValue: (row) => row.cost },
                  { key: 'price', label: 'Price', getValue: (row) => row.price },
                  { key: 'stock', label: 'Stock', getValue: (row) => row.stockQuantity },
                  { key: 'reorder', label: 'Reorder threshold', getValue: (row) => row.reorderThreshold },
                  { key: 'active', label: 'Active', getValue: (row) => (row.isActive ? 'yes' : 'no') }
                ])
                void log('export', 'Exported products CSV', 'Product')
              }}
            >
              <Download size={15} /> Export
            </Button>
            <Button
              onClick={() => {
                downloadPriceListPdf(data.products.filter((product) => product.isActive), data.settings)
                void log('export', 'Downloaded price list PDF', 'Product')
              }}
            >
              <FileText size={15} /> Price list PDF
            </Button>
            <Button variant="primary" onClick={openCreate}><Plus size={15} /> Add product</Button>
          </>
        }
      />
      <PageTabs tabs={PRODUCT_TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active products" value={String(data.products.filter((product) => product.isActive).length)} hint={`${data.products.length} total`} />
        <KpiCard label="Stock value at cost" value={formatCurrency(totalStockValue, data.settings)} />
        <KpiCard label="Stock value at retail" value={formatCurrency(retailValue, data.settings)} tone="success" />
        <KpiCard label="Low stock" value={String(low.length)} hint="At or below reorder level" tone={low.length ? 'warning' : 'success'} />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="label" htmlFor="catalog-category">Category</label>
            <select id="catalog-category" className="select min-w-[160px]" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {data.settings.productCategories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="catalog-active">Show</label>
            <select id="catalog-active" className="select min-w-[140px]" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
              <option value="active">Active only</option>
              <option value="all">All products</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          searchable={(row) => `${row.name} ${row.sku} ${row.category} ${row.description}`}
          emptyTitle="No products match this view"
          emptyDescription="Add a product manually, import a CSV, or save a recipe from the pricing calculator."
          emptyAction={<Button variant="primary" onClick={openCreate}><Plus size={15} /> Add product</Button>}
        />
      </Card>

      <ProductModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />

      <CsvImportModal
        open={importOpen}
        title="Import products from CSV"
        description="Opening stock becomes an inventory movement so stock stays auditable."
        fields={importFields}
        templateName="products-template.csv"
        onClose={() => setImportOpen(false)}
        onImport={runImport}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete product?"
        message={`"${deleting?.name || ''}" and its stock movements will be deleted. Existing order and invoice lines keep their description, but you will no longer be able to see this product in reports.`}
        confirmLabel="Delete product"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={deleteProduct}
      />
    </div>
  )
}

function ProductModal({ open, editing, onClose }: { open: boolean; editing: Product | null; onClose: () => void }) {
  const data = useData()
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [unit, setUnit] = useState('piece')
  const [cost, setCost] = useState(0)
  const [price, setPrice] = useState(0)
  const [stock, setStock] = useState(0)
  const [reorder, setReorder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(editing?.name || '')
    setSku(editing?.sku || '')
    setCategory(editing?.category || data.settings.productCategories[0] || 'Other')
    setDescription(editing?.description || '')
    setUnit(editing?.unit || 'piece')
    setCost(editing?.cost || 0)
    setPrice(editing?.price || 0)
    setStock(editing?.stockQuantity || 0)
    setReorder(editing?.reorderThreshold || 0)
    setIsActive(editing?.isActive ?? true)
    setError(null)
  }, [open, editing, data.settings.productCategories])

  const margin = price > 0 ? ((price - cost) / price) * 100 : 0

  const save = async () => {
    if (!name.trim()) return setError('Give the product a name.')
    if (!Number.isFinite(price) || price < 0) return setError('Price cannot be negative.')
    setBusy(true)
    setError(null)
    try {
      const productId = editing?.id || uid('product')
      const record: Product = {
        id: productId,
        name: name.trim(),
        sku,
        category,
        description,
        unit,
        cost: round2(Math.max(0, cost)),
        price: round2(Math.max(0, price)),
        stockQuantity: editing?.stockQuantity || 0,
        reorderThreshold: round2(Math.max(0, reorder)),
        isActive,
        createdAt: editing?.createdAt || nowISO(),
        updatedAt: nowISO()
      }
      await put('products', record)
      if (!editing && stock > 0) {
        await useApp.getState().put('inventoryMovements', {
          id: uid('mv'),
          itemType: 'product',
          itemId: productId,
          date: nowISO().slice(0, 10),
          type: 'opening',
          quantity: round2(stock),
          unitCost: record.cost,
          reference: 'Opening stock',
          notes: '',
          createdAt: nowISO()
        })
        await recomputeStock('product', productId)
        await useApp.getState().reload()
      }
      await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Added'} product "${record.name}"`, 'Product', productId)
      notify(editing ? 'Product updated.' : 'Product added.', 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Product could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit product' : 'Add product'}
      description="Cost and price drive margin reports. Stock changes are tracked as inventory movements."
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save product' : 'Add product'}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <FormGrid>
          <Field label="Product name">
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Speckled Stoneware Mug" />
          </Field>
          <Field label="SKU">
            <input className="input" value={sku} onChange={(event) => setSku(event.target.value)} placeholder="e.g. OOS-001" />
          </Field>
          <Field label="Category">
            <select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
              {data.settings.productCategories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="Unit">
            <select className="select" value={unit} onChange={(event) => setUnit(event.target.value)}>
              {data.settings.units.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="Unit cost">
            <input type="number" min="0" step="0.01" className="input" value={cost} onChange={(event) => setCost(Number(event.target.value))} />
          </Field>
          <Field label="Selling price" hint={`Margin ${margin.toFixed(1)}%`}>
            <input type="number" min="0" step="0.01" className="input" value={price} onChange={(event) => setPrice(Number(event.target.value))} />
          </Field>
          <Field
            label={editing ? 'Stock on hand' : 'Opening stock'}
            hint={editing ? 'Use Inventory to adjust stock after saving.' : 'Creates an opening movement.'}
          >
            <input type="number" min="0" step="0.01" className="input" value={stock} onChange={(event) => setStock(Number(event.target.value))} disabled={Boolean(editing)} />
          </Field>
          <Field label="Reorder threshold">
            <input type="number" min="0" step="0.01" className="input" value={reorder} onChange={(event) => setReorder(Number(event.target.value))} />
          </Field>
        </FormGrid>
        <Field label="Description">
          <textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          Active (available for new orders and invoices)
        </label>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Pricing calculator                                                         */
/* -------------------------------------------------------------------------- */

interface RecipeLine {
  id: string
  materialId: string
  name: string
  quantity: number
  unitCost: number
}

function newRecipeLine(): RecipeLine {
  return { id: uid('recipe'), materialId: '', name: '', quantity: 1, unitCost: 0 }
}

export function PricingPage() {
  const data = useData()
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [lines, setLines] = useState<RecipeLine[]>([newRecipeLine()])
  const [laborHours, setLaborHours] = useState(1)
  const [hourlyRate, setHourlyRate] = useState(20)
  const [packagingCost, setPackagingCost] = useState(0)
  const [overheadCost, setOverheadCost] = useState(0)
  const [otherCost, setOtherCost] = useState(0)
  const [batchYield, setBatchYield] = useState(1)
  const [sellingPrice, setSellingPrice] = useState(0)
  const [feePercent, setFeePercent] = useState(0)
  const [targetMargin, setTargetMargin] = useState(50)
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const result: PricingResult = calculatePricing({
    materials: lines.map((line) => ({ name: line.name, quantity: line.quantity, unitCost: line.unitCost })),
    laborHours,
    hourlyRate,
    packagingCost,
    overheadCost,
    otherCost,
    batchYield,
    sellingPrice,
    feePercent,
    targetMargin
  })

  const updateLine = (id: string, patch: Partial<RecipeLine>) => {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  const chooseMaterial = (line: RecipeLine, materialId: string) => {
    const material = data.materials.find((row) => row.id === materialId)
    if (!material) {
      updateLine(line.id, { materialId: '', name: '', unitCost: 0 })
      return
    }
    updateLine(line.id, { materialId, name: material.name, unitCost: material.unitCost })
  }

  const finalPrice = sellingPrice > 0 ? sellingPrice : result.suggestedPrice

  const saveProduct = async () => {
    if (!productName.trim()) return setError('Enter a product name before saving.')
    if (finalPrice <= 0) return setError('Add costs or a selling price so the product has a price.')
    setBusy(true)
    setError(null)
    try {
      const record: Product = {
        id: uid('product'),
        name: productName.trim(),
        sku: '',
        category: category || data.settings.productCategories[0] || 'Other',
        description: 'Created from the pricing calculator.',
        unit: 'piece',
        cost: result.unitCost,
        price: round2(finalPrice),
        stockQuantity: 0,
        reorderThreshold: 0,
        isActive: true,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }
      await put('products', record)
      await log('create', `Added product "${record.name}" from pricing calculator`, 'Product', record.id)
      notify(`Product "${record.name}" added to the catalog.`, 'success')
      setProductName('')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Product could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Products"
        title="Pricing calculator"
        description="Work out the true cost of a batch, then find a price that hits your target margin after fees."
      />
      <PageTabs tabs={PRODUCT_TABS} />

      <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <SectionTitle title="Batch ingredients & costs" description="Use your material list or type a custom cost per line." />
          <div className="table-wrap">
            <table className="data-table" style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Cost per unit</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Line cost</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <select className="select" value={line.materialId} onChange={(event) => chooseMaterial(line, event.target.value)} aria-label="Material">
                        <option value="">Custom line</option>
                        {data.materials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({formatCurrency(material.unitCost, data.settings)}/{material.unit})
                          </option>
                        ))}
                      </select>
                      {!line.materialId ? (
                        <input className="input mt-1" placeholder="Material name" value={line.name} onChange={(event) => updateLine(line.id, { name: event.target.value })} />
                      ) : null}
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01" className="input" value={line.unitCost} onChange={(event) => updateLine(line.id, { unitCost: Number(event.target.value) })} aria-label="Cost per unit" />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01" className="input" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })} aria-label="Quantity" />
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(line.quantity * line.unitCost, data.settings)}</td>
                    <td>
                      <IconButton label="Remove line" onClick={() => setLines((current) => current.filter((row) => row.id !== line.id))}>
                        <Trash2 size={14} />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button small className="mt-2" onClick={() => setLines((current) => [...current, newRecipeLine()])}>
            <Plus size={14} /> Add material line
          </Button>

          <div className="mt-4">
            <FormGrid columns={3}>
              <Field label="Labour hours">
                <input type="number" min="0" step="0.25" className="input" value={laborHours} onChange={(event) => setLaborHours(Number(event.target.value))} />
              </Field>
              <Field label="Hourly rate">
                <input type="number" min="0" step="0.5" className="input" value={hourlyRate} onChange={(event) => setHourlyRate(Number(event.target.value))} />
              </Field>
              <Field label="Packaging per batch">
                <input type="number" min="0" step="0.01" className="input" value={packagingCost} onChange={(event) => setPackagingCost(Number(event.target.value))} />
              </Field>
              <Field label="Overhead per batch">
                <input type="number" min="0" step="0.01" className="input" value={overheadCost} onChange={(event) => setOverheadCost(Number(event.target.value))} />
              </Field>
              <Field label="Other costs">
                <input type="number" min="0" step="0.01" className="input" value={otherCost} onChange={(event) => setOtherCost(Number(event.target.value))} />
              </Field>
              <Field label="Units in batch" hint="Divide total cost by this number.">
                <input type="number" min="1" step="1" className="input" value={batchYield} onChange={(event) => setBatchYield(Number(event.target.value))} />
              </Field>
              <Field label="Selling price per unit">
                <input type="number" min="0" step="0.01" className="input" value={sellingPrice} onChange={(event) => setSellingPrice(Number(event.target.value))} />
              </Field>
              <Field label="Marketplace / fee %">
                <input type="number" min="0" max="95" step="0.1" className="input" value={feePercent} onChange={(event) => setFeePercent(Number(event.target.value))} />
              </Field>
              <Field label="Target margin %">
                <input type="number" min="0" max="95" step="1" className="input" value={targetMargin} onChange={(event) => setTargetMargin(Number(event.target.value))} />
              </Field>
            </FormGrid>
          </div>
        </Card>

        <div className="grid content-start gap-3">
          <Card>
            <SectionTitle title="Result" description="Suggested price accounts for your target margin and fees." />
            <div className="grid gap-2 text-sm">
              <ResultRow label="Material cost" value={formatCurrency(result.materialCost, data.settings)} />
              <ResultRow label="Labour cost" value={formatCurrency(result.laborCost, data.settings)} />
              <ResultRow label="Total batch cost" value={formatCurrency(result.totalBatchCost, data.settings)} />
              <ResultRow label="Cost per unit" value={formatCurrency(result.unitCost, data.settings)} strong />
              <ResultRow label="Suggested price" value={formatCurrency(result.suggestedPrice, data.settings)} strong />
              <ResultRow label="Fee per unit" value={formatCurrency(result.feePerUnit, data.settings)} />
              <ResultRow label="Profit per unit" value={formatCurrency(result.profitPerUnit, data.settings)} tone={result.profitPerUnit >= 0 ? 'success' : 'danger'} />
              <ResultRow label="Margin" value={`${result.margin.toFixed(1)}%`} tone={result.margin >= 20 ? 'success' : 'warning'} />
              <ResultRow label="Markup" value={`${result.markup.toFixed(1)}%`} />
            </div>
            <Button className="mt-3 w-full" onClick={() => setSellingPrice(result.suggestedPrice)}>
              <Sparkles size={15} /> Use suggested price
            </Button>
          </Card>

          <Card>
            <SectionTitle title="Save as product" description="Adds the recipe result to your catalog at the final price." />
            <div className="grid gap-3">
              {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
              <Field label="Product name">
                <input className="input" value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="e.g. Speckled Mug" />
              </Field>
              <Field label="Category">
                <select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {data.settings.productCategories.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </Field>
              <p className="text-xs text-muted">
                Will save with cost {formatCurrency(result.unitCost, data.settings)} and price{' '}
                {formatCurrency(finalPrice, data.settings)}.
              </p>
              <Button variant="primary" onClick={saveProduct} disabled={busy}>{busy ? 'Saving…' : 'Save product'}</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ResultRow({
  label,
  value,
  strong,
  tone
}: {
  label: string
  value: string
  strong?: boolean
  tone?: 'success' | 'danger' | 'warning'
}) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : ''
  return (
    <div className={`flex items-center justify-between border-b border-line pb-1.5 ${strong ? 'font-bold' : ''}`}>
      <span className="text-muted">{label}</span>
      <span className={toneClass}>{value}</span>
    </div>
  )
}
