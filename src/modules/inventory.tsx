import { useEffect, useMemo, useState } from 'react'
import { Download, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import type {
  InventoryMovement,
  Material,
  MovementType,
  Product,
  Purchase,
  PurchaseItem,
  Supplier
} from '../lib/types'
import { useApp } from '../store/app'
import { useData } from '../components/hooks'
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
import { lowStockMaterials } from '../lib/calc'
import { formatCurrency, round2, safeNumber, sumBy } from '../lib/money'
import { formatDate, todayISO } from '../lib/dates'
import { exportCSV } from '../lib/csv'
import { nowISO, recomputeStock, uid } from '../lib/db'
import { PRODUCT_TABS } from './products'

const MATERIAL_MOVEMENTS: MovementType[] = ['purchase', 'consumption', 'waste', 'adjustment', 'return', 'opening']
const PRODUCT_MOVEMENTS: MovementType[] = ['production', 'sale', 'waste', 'adjustment', 'return', 'opening']
const NEGATIVE_TYPES: MovementType[] = ['consumption', 'waste', 'sale', 'production']

/* -------------------------------------------------------------------------- */
/* Materials                                                                  */
/* -------------------------------------------------------------------------- */

export function MaterialsPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [movementFor, setMovementFor] = useState<Material | null>(null)
  const [deleting, setDeleting] = useState<Material | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const low = lowStockMaterials(data)
  const stockValue = sumBy(data.materials, (material) => material.currentStock * material.unitCost)

  const deleteMaterial = async () => {
    if (!deleting) return
    const used = data.purchaseItems.some((item) => item.materialId === deleting.id)
    if (used) {
      notify('This material is used in a purchase. Delete the purchase first or keep the material for your records.', 'error')
      setDeleting(null)
      return
    }
    setBusy(true)
    try {
      for (const movement of data.inventoryMovements.filter(
        (row) => row.itemType === 'material' && row.itemId === deleting.id
      )) {
        await remove('inventoryMovements', movement.id)
      }
      await remove('materials', deleting.id)
      await log('delete', `Deleted material "${deleting.name}"`, 'Material', deleting.id)
      notify('Material deleted.', 'success')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const importFields: CsvField[] = [
    { key: 'name', label: 'Material name', aliases: ['name', 'material'], required: true },
    { key: 'sku', label: 'SKU', aliases: ['code'] },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    { key: 'cost', label: 'Unit cost', aliases: ['cost'], required: true },
    { key: 'opening', label: 'Opening stock', aliases: ['stock', 'quantity'] },
    { key: 'minimum', label: 'Minimum stock', aliases: ['reorder level'] },
    { key: 'reorder', label: 'Reorder quantity' },
    { key: 'supplier', label: 'Supplier' }
  ]

  const runImport = async (importRows: Record<string, string>[]) => {
    const { putMany, reload } = useApp.getState()
    const materials: Material[] = []
    const movements: InventoryMovement[] = []
    for (const row of importRows) {
      const cost = round2(safeNumber(row.cost))
      if (!row.name) continue
      const id = uid('material')
      materials.push({
        id,
        name: row.name,
        sku: row.sku || '',
        category: row.category || 'Materials',
        supplierId: data.suppliers.find((supplier) => supplier.name.toLowerCase() === (row.supplier || '').toLowerCase())?.id || null,
        unit: row.unit || 'piece',
        openingStock: 0,
        stockReceived: 0,
        stockConsumed: 0,
        waste: 0,
        adjustments: 0,
        currentStock: 0,
        unitCost: cost,
        minimumStock: round2(safeNumber(row.minimum)),
        reorderQuantity: round2(safeNumber(row.reorder)),
        expiryDate: null,
        createdAt: nowISO(),
        updatedAt: nowISO()
      })
      const opening = round2(safeNumber(row.opening))
      if (opening > 0) {
        movements.push({
          id: uid('mv'),
          itemType: 'material',
          itemId: id,
          date: todayISO(),
          type: 'opening',
          quantity: opening,
          unitCost: cost,
          reference: 'Opening stock (CSV import)',
          notes: '',
          createdAt: nowISO()
        })
      }
    }
    await putMany('materials', materials)
    await putMany('inventoryMovements', movements)
    for (const material of materials) await recomputeStock('material', material.id)
    await reload()
    await log('import', `Imported ${materials.length} materials`, 'Material')
    notify(`${materials.length} materials imported.`, 'success')
    return materials.length
  }

  const columns = [
    {
      key: 'name',
      label: 'Material',
      sortValue: (row: Material) => row.name,
      render: (row: Material) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-[11px] text-muted">
            {row.sku || 'No SKU'} · {row.category}
            {row.supplierId ? ` · ${data.suppliers.find((supplier) => supplier.id === row.supplierId)?.name || ''}` : ''}
          </p>
        </div>
      )
    },
    {
      key: 'unitCost',
      label: 'Unit cost',
      align: 'right' as const,
      sortValue: (row: Material) => row.unitCost,
      render: (row: Material) => `${formatCurrency(row.unitCost, data.settings)} / ${row.unit}`
    },
    {
      key: 'current',
      label: 'In stock',
      align: 'right' as const,
      sortValue: (row: Material) => row.currentStock,
      render: (row: Material) => (
        <span className={row.currentStock <= row.minimumStock ? 'font-semibold text-warning' : ''}>
          {row.currentStock}
        </span>
      )
    },
    {
      key: 'minimum',
      label: 'Minimum',
      align: 'right' as const,
      render: (row: Material) => String(row.minimumStock)
    },
    {
      key: 'value',
      label: 'Stock value',
      align: 'right' as const,
      sortValue: (row: Material) => row.currentStock * row.unitCost,
      render: (row: Material) => formatCurrency(row.currentStock * row.unitCost, data.settings)
    },
    {
      key: 'actions',
      label: '',
      render: (row: Material) => (
        <div className="table-actions">
          <Button small variant="ghost" onClick={() => setMovementFor(row)}>Stock</Button>
          <IconButton
            label="Edit material"
            onClick={() => {
              setEditing(row)
              setModalOpen(true)
            }}
          >
            <Pencil size={14} />
          </IconButton>
          <IconButton label="Delete material" onClick={() => setDeleting(row)}>
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
        title="Raw materials"
        description="Track what you buy, how much is on hand and what each batch consumes."
        actions={
          <>
            <Button onClick={() => setImportOpen(true)}><Upload size={15} /> Import</Button>
            <Button
              onClick={() => {
                exportCSV('materials.csv', data.materials, [
                  { key: 'name', label: 'Material name', getValue: (row) => row.name },
                  { key: 'sku', label: 'SKU', getValue: (row) => row.sku },
                  { key: 'category', label: 'Category', getValue: (row) => row.category },
                  { key: 'unit', label: 'Unit', getValue: (row) => row.unit },
                  { key: 'cost', label: 'Unit cost', getValue: (row) => row.unitCost },
                  { key: 'opening', label: 'Opening stock', getValue: (row) => row.openingStock },
                  { key: 'received', label: 'Received', getValue: (row) => row.stockReceived },
                  { key: 'consumed', label: 'Consumed', getValue: (row) => row.stockConsumed },
                  { key: 'waste', label: 'Waste', getValue: (row) => row.waste },
                  { key: 'current', label: 'Current stock', getValue: (row) => row.currentStock },
                  { key: 'minimum', label: 'Minimum stock', getValue: (row) => row.minimumStock }
                ])
                void log('export', 'Exported materials CSV', 'Material')
              }}
            >
              <Download size={15} /> Export
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
            >
              <Plus size={15} /> Add material
            </Button>
          </>
        }
      />
      <PageTabs tabs={PRODUCT_TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Materials" value={String(data.materials.length)} />
        <KpiCard label="Low stock" value={String(low.length)} tone={low.length ? 'warning' : 'success'} hint="At or below minimum" />
        <KpiCard label="Materials value" value={formatCurrency(stockValue, data.settings)} />
        <KpiCard label="Recorded waste" value={String(round2(sumBy(data.materials, (material) => material.waste)))} hint="Total units written off" />
      </div>

      <Card>
        <DataTable
          rows={data.materials}
          columns={columns}
          searchable={(row) => `${row.name} ${row.sku} ${row.category}`}
          emptyTitle="No materials yet"
          emptyDescription="Add clay, fabric, lumber or any input you buy, then record purchases and consumption."
          emptyAction={
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
            >
              <Plus size={15} /> Add material
            </Button>
          }
        />
      </Card>

      <MaterialModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
      <StockMovementModal
        open={Boolean(movementFor)}
        itemType="material"
        fixedItemId={movementFor?.id}
        onClose={() => setMovementFor(null)}
      />

      <CsvImportModal
        open={importOpen}
        title="Import raw materials from CSV"
        description="Opening stock becomes an inventory movement so stock stays auditable."
        fields={importFields}
        templateName="materials-template.csv"
        onClose={() => setImportOpen(false)}
        onImport={runImport}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete material?"
        message={`"${deleting?.name || ''}" and its stock movements will be removed.`}
        confirmLabel="Delete material"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={deleteMaterial}
      />
    </div>
  )
}

function MaterialModal({ open, editing, onClose }: { open: boolean; editing: Material | null; onClose: () => void }) {
  const data = useData()
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('Materials')
  const [unit, setUnit] = useState('piece')
  const [supplierId, setSupplierId] = useState('')
  const [unitCost, setUnitCost] = useState(0)
  const [openingStock, setOpeningStock] = useState(0)
  const [minimumStock, setMinimumStock] = useState(0)
  const [reorderQuantity, setReorderQuantity] = useState(0)
  const [expiryDate, setExpiryDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(editing?.name || '')
    setSku(editing?.sku || '')
    setCategory(editing?.category || 'Materials')
    setUnit(editing?.unit || 'piece')
    setSupplierId(editing?.supplierId || '')
    setUnitCost(editing?.unitCost || 0)
    setOpeningStock(editing?.currentStock || 0)
    setMinimumStock(editing?.minimumStock || 0)
    setReorderQuantity(editing?.reorderQuantity || 0)
    setExpiryDate(editing?.expiryDate || '')
    setError(null)
  }, [open, editing])

  const save = async () => {
    if (!name.trim()) return setError('Give the material a name.')
    setBusy(true)
    setError(null)
    try {
      const materialId = editing?.id || uid('material')
      const record: Material = {
        id: materialId,
        name: name.trim(),
        sku,
        category,
        supplierId: supplierId || null,
        unit,
        openingStock: editing?.openingStock || 0,
        stockReceived: editing?.stockReceived || 0,
        stockConsumed: editing?.stockConsumed || 0,
        waste: editing?.waste || 0,
        adjustments: editing?.adjustments || 0,
        currentStock: editing?.currentStock || 0,
        unitCost: round2(Math.max(0, unitCost)),
        minimumStock: round2(Math.max(0, minimumStock)),
        reorderQuantity: round2(Math.max(0, reorderQuantity)),
        expiryDate: expiryDate || null,
        createdAt: editing?.createdAt || nowISO(),
        updatedAt: nowISO()
      }
      await put('materials', record)
      if (!editing && openingStock > 0) {
        await useApp.getState().put('inventoryMovements', {
          id: uid('mv'),
          itemType: 'material',
          itemId: materialId,
          date: todayISO(),
          type: 'opening',
          quantity: round2(openingStock),
          unitCost: record.unitCost,
          reference: 'Opening stock',
          notes: '',
          createdAt: nowISO()
        })
        await recomputeStock('material', materialId)
        await useApp.getState().reload()
      }
      await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Added'} material "${record.name}"`, 'Material', materialId)
      notify(editing ? 'Material updated.' : 'Material added.', 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Material could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit material' : 'Add material'}
      description="Set the minimum stock level so the app can warn you before you run out."
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save material' : 'Add material'}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <FormGrid>
          <Field label="Material name">
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="SKU">
            <input className="input" value={sku} onChange={(event) => setSku(event.target.value)} />
          </Field>
          <Field label="Category">
            <input className="input" value={category} onChange={(event) => setCategory(event.target.value)} />
          </Field>
          <Field label="Unit">
            <select className="select" value={unit} onChange={(event) => setUnit(event.target.value)}>
              {data.settings.units.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="Supplier">
            <select className="select" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              <option value="">No supplier</option>
              {data.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
          </Field>
          <Field label="Unit cost">
            <input type="number" min="0" step="0.01" className="input" value={unitCost} onChange={(event) => setUnitCost(Number(event.target.value))} />
          </Field>
          <Field label={editing ? 'Stock on hand' : 'Opening stock'} hint={editing ? 'Use the Stock button to adjust.' : undefined}>
            <input type="number" min="0" step="0.01" className="input" value={openingStock} onChange={(event) => setOpeningStock(Number(event.target.value))} disabled={Boolean(editing)} />
          </Field>
          <Field label="Minimum stock">
            <input type="number" min="0" step="0.01" className="input" value={minimumStock} onChange={(event) => setMinimumStock(Number(event.target.value))} />
          </Field>
          <Field label="Reorder quantity">
            <input type="number" min="0" step="0.01" className="input" value={reorderQuantity} onChange={(event) => setReorderQuantity(Number(event.target.value))} />
          </Field>
          <Field label="Expiry date" hint="Optional — useful for resin, dyes or food inputs.">
            <input type="date" className="input" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
          </Field>
        </FormGrid>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Stock movement (shared)                                                    */
/* -------------------------------------------------------------------------- */

export function StockMovementModal({
  open,
  onClose,
  itemType,
  fixedItemId
}: {
  open: boolean
  onClose: () => void
  itemType?: 'product' | 'material'
  fixedItemId?: string
}) {
  const data = useData()
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [type, setTypeState] = useState<'product' | 'material'>(itemType || 'product')
  const [itemId, setItemId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [movementType, setMovementType] = useState<MovementType>('adjustment')
  const [quantity, setQuantity] = useState(0)
  const [unitCost, setUnitCost] = useState(0)
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const items = type === 'product' ? data.products : data.materials

  useEffect(() => {
    if (!open) return
    const resolvedType = itemType || 'product'
    const firstItem = resolvedType === 'product' ? data.products[0] : data.materials[0]
    setTypeState(resolvedType)
    setItemId(fixedItemId || firstItem?.id || '')
    setDate(todayISO())
    setMovementType('adjustment')
    setQuantity(0)
    setUnitCost(
      fixedItemId
        ? (resolvedType === 'product'
            ? data.products.find((row) => row.id === fixedItemId)?.cost
            : data.materials.find((row) => row.id === fixedItemId)?.unitCost) || 0
        : firstItem
          ? resolvedType === 'product'
            ? (firstItem as Product).cost
            : (firstItem as Material).unitCost
          : 0
    )
    setReference('')
    setNotes('')
    setError(null)
  }, [open, itemType, fixedItemId, data.products, data.materials])

  const changeType = (next: 'product' | 'material') => {
    setTypeState(next)
    const firstItem = next === 'product' ? data.products[0] : data.materials[0]
    setItemId(firstItem?.id || '')
    setUnitCost(next === 'product' ? (firstItem as Product | undefined)?.cost || 0 : (firstItem as Material | undefined)?.unitCost || 0)
  }

  const changeItem = (nextId: string) => {
    setItemId(nextId)
    if (type === 'product') {
      setUnitCost(data.products.find((product) => product.id === nextId)?.cost || 0)
    } else {
      setUnitCost(data.materials.find((material) => material.id === nextId)?.unitCost || 0)
    }
  }

  const save = async () => {
    if (!itemId) return setError('Choose the item this movement applies to.')
    if (!Number.isFinite(quantity) || quantity === 0) return setError('Enter a quantity. Adjustments may be negative; other types use the absolute value.')
    if (movementType === 'adjustment' && quantity === 0) return setError('Adjustment quantity cannot be zero.')
    setBusy(true)
    setError(null)
    try {
      const signed =
        movementType === 'adjustment'
          ? round2(quantity)
          : NEGATIVE_TYPES.includes(movementType)
            ? -Math.abs(round2(quantity))
            : Math.abs(round2(quantity))
      const movement: InventoryMovement = {
        id: uid('mv'),
        itemType: type,
        itemId,
        date,
        type: movementType,
        quantity: signed,
        unitCost: round2(Math.max(0, unitCost)),
        reference,
        notes,
        createdAt: nowISO()
      }
      await put('inventoryMovements', movement)
      await recomputeStock(type, itemId)
      await useApp.getState().reload()
      await log('update', `Stock ${movementType} of ${Math.abs(signed)} recorded`, 'Inventory', movement.id)
      notify('Stock movement recorded.', 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Movement could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Record stock movement"
      description="Every stock change is stored as a movement. Cached stock levels are recalculated from this ledger."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Record movement'}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <FormGrid>
          <Field label="Item type">
            <select className="select" value={type} onChange={(event) => changeType(event.target.value as 'product' | 'material')} disabled={Boolean(itemType)}>
              <option value="product">Finished product</option>
              <option value="material">Raw material</option>
            </select>
          </Field>
          <Field label="Item">
            <select className="select" value={itemId} onChange={(event) => changeItem(event.target.value)}>
              <option value="">Choose an item</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Movement type">
            <select className="select" value={movementType} onChange={(event) => setMovementType(event.target.value as MovementType)}>
              {(type === 'product' ? PRODUCT_MOVEMENTS : MATERIAL_MOVEMENTS).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className="input" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Quantity" hint={movementType === 'adjustment' ? 'Positive adds stock, negative removes stock.' : NEGATIVE_TYPES.includes(movementType) ? 'Enter a positive amount; it will reduce stock.' : 'Enter a positive amount; it will add stock.'}>
            <input type="number" step="0.01" className="input" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          </Field>
          <Field label="Unit cost">
            <input type="number" min="0" step="0.01" className="input" value={unitCost} onChange={(event) => setUnitCost(Number(event.target.value))} />
          </Field>
        </FormGrid>
        <Field label="Reference">
          <input className="input" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="e.g. purchase, order or batch reference" />
        </Field>
        <Field label="Notes">
          <textarea className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Inventory ledger                                                           */
/* -------------------------------------------------------------------------- */

export function InventoryPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [movementOpen, setMovementOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [itemTypeFilter, setItemTypeFilter] = useState('all')
  const [deleting, setDeleting] = useState<InventoryMovement | null>(null)
  const [busy, setBusy] = useState(false)

  const productValue = sumBy(data.products, (product) => product.stockQuantity * product.cost)
  const materialValue = sumBy(data.materials, (material) => material.currentStock * material.unitCost)

  const movements = useMemo(
    () =>
      data.inventoryMovements
        .filter((movement) => typeFilter === 'all' || movement.type === typeFilter)
        .filter((movement) => itemTypeFilter === 'all' || movement.itemType === itemTypeFilter)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.inventoryMovements, typeFilter, itemTypeFilter]
  )

  const itemName = (movement: InventoryMovement) => {
    if (movement.itemType === 'product') {
      return data.products.find((product) => product.id === movement.itemId)?.name || 'Deleted product'
    }
    return data.materials.find((material) => material.id === movement.itemId)?.name || 'Deleted material'
  }

  const deleteMovement = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await remove('inventoryMovements', deleting.id)
      await recomputeStock(deleting.itemType, deleting.itemId)
      await useApp.getState().reload()
      notify('Movement deleted and stock recalculated.', 'success')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortValue: (row: InventoryMovement) => row.date,
      render: (row: InventoryMovement) => formatDate(row.date, data.settings.dateFormat)
    },
    {
      key: 'item',
      label: 'Item',
      sortValue: (row: InventoryMovement) => itemName(row),
      render: (row: InventoryMovement) => (
        <div>
          <p className="font-medium">{itemName(row)}</p>
          <p className="text-[11px] capitalize text-muted">{row.itemType}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (row: InventoryMovement) => <span className="capitalize">{row.type}</span>
    },
    {
      key: 'quantity',
      label: 'Quantity',
      align: 'right' as const,
      sortValue: (row: InventoryMovement) => row.quantity,
      render: (row: InventoryMovement) => (
        <span className={row.quantity < 0 ? 'font-semibold text-danger' : 'font-semibold text-success'}>
          {row.quantity > 0 ? '+' : ''}{row.quantity}
        </span>
      )
    },
    {
      key: 'cost',
      label: 'Unit cost',
      align: 'right' as const,
      render: (row: InventoryMovement) => formatCurrency(row.unitCost, data.settings)
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (row: InventoryMovement) => row.reference || '—'
    },
    {
      key: 'actions',
      label: '',
      render: (row: InventoryMovement) => (
        <IconButton label="Delete movement" onClick={() => setDeleting(row)}>
          <Trash2 size={14} />
        </IconButton>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Products"
        title="Inventory"
        description="One ledger for finished goods and raw materials. Stock levels always come from recorded movements."
        actions={
          <>
            <Button
              onClick={() => {
                exportCSV('inventory-movements.csv', movements, [
                  { key: 'date', label: 'Date', getValue: (row) => row.date },
                  { key: 'item', label: 'Item', getValue: (row) => itemName(row) },
                  { key: 'itemType', label: 'Item type', getValue: (row) => row.itemType },
                  { key: 'type', label: 'Movement', getValue: (row) => row.type },
                  { key: 'quantity', label: 'Quantity', getValue: (row) => row.quantity },
                  { key: 'cost', label: 'Unit cost', getValue: (row) => row.unitCost },
                  { key: 'reference', label: 'Reference', getValue: (row) => row.reference }
                ])
                void log('export', 'Exported inventory movements CSV', 'Inventory')
              }}
            >
              <Download size={15} /> Export ledger
            </Button>
            <Button variant="primary" onClick={() => setMovementOpen(true)}><Plus size={15} /> Record movement</Button>
          </>
        }
      />
      <PageTabs tabs={PRODUCT_TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Finished goods value" value={formatCurrency(productValue, data.settings)} hint="At cost" />
        <KpiCard label="Materials value" value={formatCurrency(materialValue, data.settings)} />
        <KpiCard label="Movements" value={String(data.inventoryMovements.length)} />
        <KpiCard label="Low-stock items" value={String(data.products.filter((product) => product.stockQuantity <= product.reorderThreshold).length + lowStockMaterials(data).length)} tone="warning" />
      </div>

      <div className="mb-3 grid gap-3 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Finished product stock" description="Recomputed from opening stock, production, sales, waste and adjustments." />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>On hand</th>
                  <th style={{ textAlign: 'right' }}>Reorder at</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td style={{ textAlign: 'right' }} className={product.stockQuantity <= product.reorderThreshold ? 'font-semibold text-warning' : ''}>
                      {product.stockQuantity}
                    </td>
                    <td style={{ textAlign: 'right' }}>{product.reorderThreshold}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(product.stockQuantity * product.cost, data.settings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Raw material stock" description="Received, consumed, wasted and adjusted." />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th style={{ textAlign: 'right' }}>On hand</th>
                  <th style={{ textAlign: 'right' }}>Minimum</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {data.materials.map((material) => (
                  <tr key={material.id}>
                    <td>{material.name}</td>
                    <td style={{ textAlign: 'right' }} className={material.currentStock <= material.minimumStock ? 'font-semibold text-warning' : ''}>
                      {material.currentStock} {material.unit}
                    </td>
                    <td style={{ textAlign: 'right' }}>{material.minimumStock}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(material.currentStock * material.unitCost, data.settings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="label" htmlFor="movement-item-type">Item type</label>
            <select id="movement-item-type" className="select min-w-[150px]" value={itemTypeFilter} onChange={(event) => setItemTypeFilter(event.target.value)}>
              <option value="all">All items</option>
              <option value="product">Products</option>
              <option value="material">Materials</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="movement-type">Movement type</label>
            <select id="movement-type" className="select min-w-[150px]" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All movements</option>
              {PRODUCT_MOVEMENTS.concat(MATERIAL_MOVEMENTS.filter((value) => !PRODUCT_MOVEMENTS.includes(value))).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
        <DataTable
          rows={movements}
          columns={columns}
          searchable={(row) => `${itemName(row)} ${row.type} ${row.reference} ${row.notes}`}
          emptyTitle="No stock movements"
          emptyDescription="Record opening stock, purchases, production, sales, waste or adjustments."
          emptyAction={<Button variant="primary" onClick={() => setMovementOpen(true)}><Plus size={15} /> Record movement</Button>}
        />
      </Card>

      <StockMovementModal open={movementOpen} onClose={() => setMovementOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete stock movement?"
        message="Deleting a movement changes the calculated stock level for that item. This cannot be undone."
        confirmLabel="Delete movement"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={deleteMovement}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Suppliers & purchases                                                      */
/* -------------------------------------------------------------------------- */

export function SuppliersPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null)
  const [busy, setBusy] = useState(false)

  const purchases = [...data.purchases].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
  const total = sumBy(purchases, (purchase) => purchase.total)
  const received = purchases.filter((purchase) => purchase.status === 'received')

  const deleteSupplier = async () => {
    if (!deletingSupplier) return
    if (data.purchases.some((purchase) => purchase.supplierId === deletingSupplier.id)) {
      notify('This supplier is linked to a purchase. Delete the purchase first.', 'error')
      setDeletingSupplier(null)
      return
    }
    setBusy(true)
    try {
      await remove('suppliers', deletingSupplier.id)
      await log('delete', `Deleted supplier "${deletingSupplier.name}"`, 'Supplier', deletingSupplier.id)
      notify('Supplier deleted.', 'success')
      setDeletingSupplier(null)
    } finally {
      setBusy(false)
    }
  }

  const deletePurchase = async () => {
    if (!deletingPurchase) return
    setBusy(true)
    try {
      const movements = data.inventoryMovements.filter(
        (movement) => movement.reference === deletingPurchase.id && movement.type === 'purchase'
      )
      for (const movement of movements) await remove('inventoryMovements', movement.id)
      for (const item of data.purchaseItems.filter((row) => row.purchaseId === deletingPurchase.id)) {
        await remove('purchaseItems', item.id)
      }
      await remove('purchases', deletingPurchase.id)
      for (const materialId of new Set(movements.map((movement) => movement.itemId))) {
        await recomputeStock('material', materialId)
      }
      await useApp.getState().reload()
      await log('delete', 'Deleted purchase', 'Purchase', deletingPurchase.id)
      notify('Purchase deleted and stock recalculated.', 'success')
      setDeletingPurchase(null)
    } finally {
      setBusy(false)
    }
  }

  const receivePurchase = async (purchase: Purchase) => {
    setBusy(true)
    try {
      const items = data.purchaseItems.filter((item) => item.purchaseId === purchase.id)
      const movements: InventoryMovement[] = []
      const updatedItems: PurchaseItem[] = []
      for (const item of items) {
        const remaining = round2(item.quantity - item.receivedQuantity)
        if (remaining > 0) {
          movements.push({
            id: uid('mv'),
            itemType: 'material',
            itemId: item.materialId,
            date: todayISO(),
            type: 'purchase',
            quantity: remaining,
            unitCost: item.unitPrice,
            reference: purchase.id,
            notes: 'Purchase received',
            createdAt: nowISO()
          })
        }
        updatedItems.push({ ...item, receivedQuantity: item.quantity })
      }
      await useApp.getState().putMany('inventoryMovements', movements)
      await useApp.getState().putMany('purchaseItems', updatedItems)
      await useApp.getState().put('purchases', { ...purchase, status: 'received', updatedAt: nowISO() })
      for (const materialId of new Set(movements.map((movement) => movement.itemId))) {
        await recomputeStock('material', materialId)
      }
      await useApp.getState().reload()
      await log('update', `Received purchase from ${data.suppliers.find((supplier) => supplier.id === purchase.supplierId)?.name || 'supplier'}`, 'Purchase', purchase.id)
      notify('Purchase received and stock updated.', 'success')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Products"
        title="Suppliers & purchases"
        description="Keep supplier details, record stock purchases, and receive deliveries into your material inventory."
        actions={
          <>
            <Button
              onClick={() => {
                exportCSV('suppliers.csv', data.suppliers, [
                  { key: 'name', label: 'Supplier', getValue: (row) => row.name },
                  { key: 'email', label: 'Email', getValue: (row) => row.email },
                  { key: 'phone', label: 'Phone', getValue: (row) => row.phone },
                  { key: 'address', label: 'Address', getValue: (row) => row.address },
                  { key: 'materials', label: 'Materials supplied', getValue: (row) => row.materialsSupplied }
                ])
                void log('export', 'Exported suppliers CSV', 'Supplier')
              }}
            >
              <Download size={15} /> Export suppliers
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditingSupplier(null)
                setSupplierOpen(true)
              }}
            >
              <Plus size={15} /> Add supplier
            </Button>
          </>
        }
      />
      <PageTabs tabs={PRODUCT_TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Suppliers" value={String(data.suppliers.length)} />
        <KpiCard label="Purchases" value={String(purchases.length)} hint={formatCurrency(total, data.settings)} />
        <KpiCard label="Received" value={String(received.length)} tone="success" />
        <KpiCard label="Awaiting delivery" value={String(purchases.filter((purchase) => purchase.status !== 'received' && purchase.status !== 'cancelled').length)} tone="warning" />
      </div>

      <div className="mb-3 grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <SectionTitle title="Suppliers" action={<Button small onClick={() => { setEditingSupplier(null); setSupplierOpen(true) }}><Plus size={14} /> Add</Button>} />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-[11px] text-muted">{supplier.materialsSupplied}</p>
                    </td>
                    <td className="text-xs">
                      <p>{supplier.email || '—'}</p>
                      <p>{supplier.phone || '—'}</p>
                    </td>
                    <td>
                      <div className="table-actions">
                        <IconButton label="Edit supplier" onClick={() => { setEditingSupplier(supplier); setSupplierOpen(true) }}>
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton label="Delete supplier" onClick={() => setDeletingSupplier(supplier)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.suppliers.length ? <p className="py-5 text-center text-sm text-muted">No suppliers yet.</p> : null}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Purchases"
            description="Receiving a purchase adds the ordered quantities to material stock."
            action={<Button small variant="primary" onClick={() => setPurchaseOpen(true)}><Plus size={14} /> New purchase</Button>}
          />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{formatDate(purchase.purchaseDate, data.settings.dateFormat)}</td>
                    <td>{data.suppliers.find((supplier) => supplier.id === purchase.supplierId)?.name || '—'}</td>
                    <td>{data.purchaseItems.filter((item) => item.purchaseId === purchase.id).length}</td>
                    <td><Badge tone={purchase.status === 'received' ? 'success' : purchase.status === 'cancelled' ? 'danger' : 'warning'}>{purchase.status}</Badge></td>
                    <td style={{ textAlign: 'right' }} className="font-semibold">{formatCurrency(purchase.total, data.settings)}</td>
                    <td>
                      <div className="table-actions">
                        {purchase.status !== 'received' && purchase.status !== 'cancelled' ? (
                          <Button small variant="ghost" disabled={busy} onClick={() => void receivePurchase(purchase)}>Receive</Button>
                        ) : null}
                        <IconButton label="Delete purchase" onClick={() => setDeletingPurchase(purchase)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!purchases.length ? <p className="py-5 text-center text-sm text-muted">No purchases recorded yet.</p> : null}
          </div>
        </Card>
      </div>

      <SupplierModal open={supplierOpen} editing={editingSupplier} onClose={() => setSupplierOpen(false)} />
      <PurchaseModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} />

      <ConfirmDialog
        open={Boolean(deletingSupplier)}
        title="Delete supplier?"
        message={`"${deletingSupplier?.name || ''}" will be removed. Materials keep their history but will show no supplier.`}
        confirmLabel="Delete supplier"
        busy={busy}
        onCancel={() => setDeletingSupplier(null)}
        onConfirm={deleteSupplier}
      />
      <ConfirmDialog
        open={Boolean(deletingPurchase)}
        title="Delete purchase?"
        message="The purchase, its items and any stock received from it will be reversed. Material stock levels will be recalculated."
        confirmLabel="Delete purchase"
        busy={busy}
        onCancel={() => setDeletingPurchase(null)}
        onConfirm={deletePurchase}
      />
    </div>
  )
}

function SupplierModal({ open, editing, onClose }: { open: boolean; editing: Supplier | null; onClose: () => void }) {
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [materialsSupplied, setMaterialsSupplied] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(editing?.name || '')
    setEmail(editing?.email || '')
    setPhone(editing?.phone || '')
    setAddress(editing?.address || '')
    setMaterialsSupplied(editing?.materialsSupplied || '')
    setNotes(editing?.notes || '')
    setError(null)
  }, [open, editing])

  const save = async () => {
    if (!name.trim()) return setError('Give the supplier a name.')
    setBusy(true)
    try {
      const record: Supplier = {
        id: editing?.id || uid('supplier'),
        name: name.trim(),
        email,
        phone,
        address,
        materialsSupplied,
        notes,
        createdAt: editing?.createdAt || nowISO(),
        updatedAt: nowISO()
      }
      await put('suppliers', record)
      await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Added'} supplier "${record.name}"`, 'Supplier', record.id)
      notify(editing ? 'Supplier updated.' : 'Supplier added.', 'success')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit supplier' : 'Add supplier'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save supplier'}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <Field label="Supplier name">
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <FormGrid>
          <Field label="Email">
            <input type="email" className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Phone">
            <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
        </FormGrid>
        <Field label="Address">
          <input className="input" value={address} onChange={(event) => setAddress(event.target.value)} />
        </Field>
        <Field label="Materials supplied">
          <input className="input" value={materialsSupplied} onChange={(event) => setMaterialsSupplied(event.target.value)} placeholder="e.g. clay, glazes, packaging" />
        </Field>
        <Field label="Notes">
          <textarea className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

interface PurchaseLine {
  id: string
  materialId: string
  quantity: number
  unitPrice: number
}

function PurchaseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useData()
  const put = useApp((state) => state.put)
  const putMany = useApp((state) => state.putMany)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [supplierId, setSupplierId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(todayISO())
  const [expectedDate, setExpectedDate] = useState(todayISO())
  const [status, setStatus] = useState<'ordered' | 'partial' | 'received' | 'cancelled'>('ordered')
  const [taxAmount, setTaxAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<PurchaseLine[]>([
    { id: uid('pi'), materialId: data.materials[0]?.id || '', quantity: 1, unitPrice: data.materials[0]?.unitCost || 0 }
  ])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setSupplierId(data.suppliers[0]?.id || '')
    setPurchaseDate(todayISO())
    setExpectedDate(todayISO())
    setStatus('ordered')
    setTaxAmount(0)
    setNotes('')
    setLines([{ id: uid('pi'), materialId: data.materials[0]?.id || '', quantity: 1, unitPrice: data.materials[0]?.unitCost || 0 }])
    setError(null)
  }, [open, data.suppliers, data.materials])

  const subtotal = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))
  const total = round2(subtotal + Math.max(0, taxAmount))

  const updateLine = (id: string, patch: Partial<PurchaseLine>) => {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  const save = async () => {
    if (!supplierId) return setError('Choose a supplier.')
    if (!lines.length || lines.some((line) => !line.materialId || line.quantity <= 0)) {
      return setError('Each line needs a material and a quantity greater than zero.')
    }
    setBusy(true)
    setError(null)
    try {
      const purchaseId = uid('purchase')
      const purchase: Purchase = {
        id: purchaseId,
        supplierId,
        purchaseDate,
        expectedDate,
        status,
        taxAmount: round2(Math.max(0, taxAmount)),
        total,
        notes,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }
      const items: PurchaseItem[] = lines.map((line) => ({
        id: line.id,
        purchaseId,
        materialId: line.materialId,
        quantity: round2(line.quantity),
        receivedQuantity: status === 'received' ? round2(line.quantity) : 0,
        unitPrice: round2(line.unitPrice)
      }))
      await put('purchases', purchase)
      await putMany('purchaseItems', items)
      if (status === 'received') {
        const movements: InventoryMovement[] = items.map((item) => ({
          id: uid('mv'),
          itemType: 'material',
          itemId: item.materialId,
          date: purchaseDate,
          type: 'purchase',
          quantity: item.quantity,
          unitCost: item.unitPrice,
          reference: purchaseId,
          notes: 'Purchase received',
          createdAt: nowISO()
        }))
        await putMany('inventoryMovements', movements)
        for (const materialId of new Set(items.map((item) => item.materialId))) {
          await recomputeStock('material', materialId)
        }
        await useApp.getState().reload()
      }
      await log('create', `Recorded purchase from ${data.suppliers.find((supplier) => supplier.id === supplierId)?.name || 'supplier'}`, 'Purchase', purchaseId)
      notify('Purchase recorded.', 'success')
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Purchase could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title="New purchase"
      description="A received purchase adds the quantities to your material ledger."
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save purchase'}</Button>
        </>
      }
    >
      <div className="grid gap-3">
        {error ? <p className="rounded-lg bg-[#fbe9e8] px-3 py-2 text-xs text-danger">{error}</p> : null}
        <FormGrid columns={3}>
          <Field label="Supplier">
            <select className="select" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              <option value="">Choose a supplier</option>
              {data.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
          </Field>
          <Field label="Purchase date">
            <input type="date" className="input" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} />
          </Field>
          <Field label="Expected date">
            <input type="date" className="input" value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} />
          </Field>
          <Field label="Status">
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              {['ordered', 'partial', 'received', 'cancelled'].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="Tax amount">
            <input type="number" min="0" step="0.01" className="input" value={taxAmount} onChange={(event) => setTaxAmount(Number(event.target.value))} />
          </Field>
        </FormGrid>

        <div className="table-wrap">
          <table className="data-table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th style={{ textAlign: 'right' }}>Line total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <select
                      className="select"
                      value={line.materialId}
                      onChange={(event) => {
                        const material = data.materials.find((row) => row.id === event.target.value)
                        updateLine(line.id, { materialId: event.target.value, unitPrice: material?.unitCost || 0 })
                      }}
                    >
                      <option value="">Choose material</option>
                      {data.materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <input type="number" min="0" step="0.01" className="input" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })} />
                  </td>
                  <td>
                    <input type="number" min="0" step="0.01" className="input" value={line.unitPrice} onChange={(event) => updateLine(line.id, { unitPrice: Number(event.target.value) })} />
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(line.quantity * line.unitPrice, data.settings)}</td>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button small onClick={() => setLines((current) => [...current, { id: uid('pi'), materialId: '', quantity: 1, unitPrice: 0 }])}>
            <Plus size={14} /> Add line
          </Button>
          <p className="text-sm">
            Subtotal {formatCurrency(subtotal, data.settings)} · Tax {formatCurrency(Math.max(0, taxAmount), data.settings)} ·{' '}
            <strong>Total {formatCurrency(total, data.settings)}</strong>
          </p>
        </div>
        <Field label="Notes">
          <textarea className="textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
