import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Upload,
  UserRound,
  Users
} from 'lucide-react'
import type { Client, Communication, Task, TaskPriority, TaskStatus } from '../lib/types'
import { useApp } from '../store/app'
import { useData, useQuickCreate } from '../components/hooks'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  FormGrid,
  IconButton,
  KpiCard,
  Modal,
  PageHeader,
  PageTabs,
  SectionTitle,
  StatusBadge,
  labelize
} from '../components/ui'
import type { CsvField } from '../components/forms'
import { CsvImportModal } from '../components/forms'
import { clientSummary, invoiceBalance } from '../lib/calc'
import { formatCurrency, sumBy } from '../lib/money'
import { addDays, formatDate, isOverdue, parseDateInput, todayISO } from '../lib/dates'
import { exportCSV } from '../lib/csv'
import { nowISO, uid } from '../lib/db'
import { downloadClientStatementPdf } from '../lib/pdf'

const TABS = [
  { label: 'Client CRM', to: '/clients/list' },
  { label: 'Tasks', to: '/clients/tasks' },
  { label: 'Communication log', to: '/clients/communication' }
]

const CLIENT_TYPE_OPTIONS: { value: Client['clientType']; label: string }[] = [
  { value: 'business', label: 'Business' },
  { value: 'individual', label: 'Individual' }
]

const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']
const TASK_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done']
const COMM_METHODS: Communication['method'][] = ['email', 'phone', 'in-person', 'other']

const CLIENT_CSV_FIELDS: CsvField[] = [
  { key: 'name', label: 'Name', required: true, aliases: ['client', 'customer', 'full name'] },
  { key: 'company', label: 'Company', aliases: ['business', 'organization'] },
  { key: 'email', label: 'Email', aliases: ['e-mail', 'email address'] },
  { key: 'phone', label: 'Phone', aliases: ['telephone', 'mobile'] },
  { key: 'address', label: 'Address', aliases: ['location'] },
  { key: 'type', label: 'Type', hint: 'business or individual', aliases: ['client type'] },
  { key: 'notes', label: 'Notes', aliases: ['memo'] }
]

/* -------------------------------------------------------------------------- */
/* Clients                                                                    */
/* -------------------------------------------------------------------------- */

interface ClientForm {
  name: string
  company: string
  email: string
  phone: string
  address: string
  clientType: Client['clientType']
  notes: string
}

const EMPTY_CLIENT: ClientForm = {
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  clientType: 'business',
  notes: ''
}

export function ClientsPage() {
  const data = useData()
  const putMany = useApp((state) => state.putMany)
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)

  const [typeFilter, setTypeFilter] = useState<'all' | Client['clientType']>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [commOpen, setCommOpen] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  useQuickCreate(openCreate)

  const rows = useMemo(() => {
    return data.clients
      .filter((client) => typeFilter === 'all' || client.clientType === typeFilter)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data.clients, typeFilter])

  const summaries = useMemo(() => {
    const map = new Map<string, ReturnType<typeof clientSummary>>()
    for (const client of data.clients) map.set(client.id, clientSummary(data, client.id))
    return map
  }, [data])

  const withBalance = data.clients.filter((client) => (summaries.get(client.id)?.outstanding || 0) > 0.005)
  const lifetime = sumBy(data.clients, (client) => summaries.get(client.id)?.totalSales || 0)
  const averageLifetime = data.clients.length ? lifetime / data.clients.length : 0

  const requestDelete = (client: Client) => {
    const linked =
      data.orders.some((order) => order.clientId === client.id) ||
      data.invoices.some((invoice) => invoice.clientId === client.id) ||
      data.quotes.some((quote) => quote.clientId === client.id) ||
      data.tasks.some((task) => task.clientId === client.id) ||
      data.communications.some((comm) => comm.clientId === client.id)
    if (linked) {
      notify('This client is linked to orders, invoices, quotes, tasks or notes. Remove those links before deleting.', 'error')
      return
    }
    setDeleting(client)
  }

  const deleteClient = async () => {
    if (!deleting) return
    await remove('clients', deleting.id)
    await log('delete', `Deleted client ${deleting.name}`, 'Client', deleting.id)
    notify('Client deleted.', 'success')
    setDeleting(null)
  }

  const importClients = async (importRows: Record<string, string>[]) => {
    const timestamp = nowISO()
    const records: Client[] = importRows
      .filter((row) => row.name.trim())
      .map((row) => ({
        id: uid('client'),
        name: row.name.trim(),
        company: row.company.trim(),
        email: row.email.trim(),
        phone: row.phone.trim(),
        address: row.address.trim(),
        clientType: row.type.trim().toLowerCase().startsWith('ind') ? 'individual' : 'business',
        notes: row.notes.trim(),
        createdAt: timestamp,
        updatedAt: timestamp
      }))
    if (!records.length) throw new Error('No rows with a client name were found.')
    await putMany('clients', records)
    await log('import', `Imported ${records.length} clients from CSV`, 'Client')
    notify(`${records.length} client${records.length === 1 ? '' : 's'} imported.`, 'success')
    return records.length
  }

  const exportClients = () => {
    exportCSV(`clients-${todayISO()}.csv`, rows, [
      { key: 'name', label: 'Name', getValue: (row) => row.name },
      { key: 'company', label: 'Company', getValue: (row) => row.company },
      { key: 'email', label: 'Email', getValue: (row) => row.email },
      { key: 'phone', label: 'Phone', getValue: (row) => row.phone },
      { key: 'address', label: 'Address', getValue: (row) => row.address },
      { key: 'type', label: 'Type', getValue: (row) => row.clientType },
      { key: 'orders', label: 'Orders', getValue: (row) => summaries.get(row.id)?.orders || 0 },
      { key: 'sales', label: 'Total sales', getValue: (row) => summaries.get(row.id)?.totalSales || 0 },
      { key: 'outstanding', label: 'Outstanding', getValue: (row) => summaries.get(row.id)?.outstanding || 0 }
    ])
    void log('export', `Exported ${rows.length} clients to CSV`, 'Client')
    notify('Client list exported.', 'success')
  }

  const detail = detailId ? data.clients.find((client) => client.id === detailId) || null : null

  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="Client CRM"
        description="Every customer, their history and what they still owe — stored only on this device."
        actions={
          <>
            <Button onClick={() => setImportOpen(true)}>
              <Upload size={15} /> Import
            </Button>
            <Button onClick={exportClients} disabled={!rows.length}>
              <Download size={15} /> Export
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add client
            </Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total clients" value={String(data.clients.length)} icon={<Users size={17} />} />
        <KpiCard
          label="Business accounts"
          value={String(data.clients.filter((client) => client.clientType === 'business').length)}
          hint={`${data.clients.filter((client) => client.clientType === 'individual').length} individuals`}
          icon={<Building2 size={17} />}
        />
        <KpiCard
          label="With open balance"
          value={String(withBalance.length)}
          tone={withBalance.length ? 'warning' : 'success'}
          hint="Clients with unpaid invoices"
          icon={<FileText size={17} />}
        />
        <KpiCard
          label="Average lifetime sales"
          value={formatCurrency(averageLifetime, data.settings)}
          hint="Average invoiced value per client"
          tone="brand"
        />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">Client directory</p>
            <p className="text-xs text-muted">Open a client to see their invoices, orders and recent conversations.</p>
          </div>
          <select
            className="select w-auto min-w-[150px]"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            aria-label="Filter by client type"
          >
            <option value="all">All client types</option>
            <option value="business">Business</option>
            <option value="individual">Individual</option>
          </select>
        </div>

        <DataTable
          rows={rows}
          searchable={(row) => `${row.name} ${row.company} ${row.email} ${row.phone} ${row.address}`}
          pageSize={10}
          emptyTitle="No clients yet"
          emptyDescription="Add your first customer or import a CSV list to get started."
          emptyAction={
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} /> Add client
            </Button>
          }
          initialSort={{ key: 'name', direction: 'asc' }}
          columns={[
            {
              key: 'name',
              label: 'Client',
              sortValue: (row) => row.name,
              render: (row) => (
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-[11px] text-muted">{row.company || labelize(row.clientType)}</p>
                </div>
              )
            },
            {
              key: 'contact',
              label: 'Contact',
              render: (row) => (
                <div className="text-xs">
                  {row.email ? (
                    <p className="flex items-center gap-1.5">
                      <Mail size={12} className="text-muted" /> {row.email}
                    </p>
                  ) : null}
                  {row.phone ? (
                    <p className="flex items-center gap-1.5 text-muted">
                      <Phone size={12} /> {row.phone}
                    </p>
                  ) : null}
                  {!row.email && !row.phone ? <span className="text-muted">—</span> : null}
                </div>
              )
            },
            {
              key: 'orders',
              label: 'Orders',
              align: 'right',
              sortValue: (row) => summaries.get(row.id)?.orders || 0,
              render: (row) => String(summaries.get(row.id)?.orders || 0)
            },
            {
              key: 'sales',
              label: 'Invoiced',
              align: 'right',
              sortValue: (row) => summaries.get(row.id)?.totalSales || 0,
              render: (row) => formatCurrency(summaries.get(row.id)?.totalSales || 0, data.settings)
            },
            {
              key: 'outstanding',
              label: 'Outstanding',
              align: 'right',
              sortValue: (row) => summaries.get(row.id)?.outstanding || 0,
              render: (row) => {
                const value = summaries.get(row.id)?.outstanding || 0
                return value > 0.005 ? (
                  <span className="font-semibold text-warning">{formatCurrency(value, data.settings)}</span>
                ) : (
                  <span className="text-muted">—</span>
                )
              }
            },
            {
              key: 'last',
              label: 'Last activity',
              sortValue: (row) => summaries.get(row.id)?.lastActivity || '',
              render: (row) => {
                const value = summaries.get(row.id)?.lastActivity
                return value ? formatDate(value, data.settings.dateFormat) : <span className="text-muted">—</span>
              }
            },
            {
              key: 'actions',
              label: '',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-1">
                  <IconButton label={`Open ${row.name}`} onClick={() => setDetailId(row.id)}>
                    <UserRound size={15} />
                  </IconButton>
                  <IconButton
                    label={`Edit ${row.name}`}
                    onClick={() => {
                      setEditing(row)
                      setModalOpen(true)
                    }}
                  >
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton label={`Delete ${row.name}`} onClick={() => requestDelete(row)}>
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              )
            }
          ]}
        />
      </Card>

      <ClientModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete client"
        message={`Delete ${deleting?.name || 'this client'}? Their profile will be permanently removed from this device.`}
        confirmLabel="Delete client"
        onCancel={() => setDeleting(null)}
        onConfirm={() => void deleteClient()}
      />
      <CsvImportModal
        open={importOpen}
        title="Import clients"
        description="Upload a CSV export from a spreadsheet, your email contacts or another tool."
        fields={CLIENT_CSV_FIELDS}
        templateName="clients-template.csv"
        onClose={() => setImportOpen(false)}
        onImport={importClients}
      />
      <TaskModal open={taskOpen} presetClientId={detail?.id} onClose={() => setTaskOpen(false)} />
      <CommunicationModal open={commOpen} presetClientId={detail?.id} onClose={() => setCommOpen(false)} />

      {detail ? (
        <ClientDetail
          client={detail}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setEditing(detail)
            setModalOpen(true)
          }}
          onAddTask={() => setTaskOpen(true)}
          onLogCommunication={() => setCommOpen(true)}
        />
      ) : null}
    </>
  )
}

function ClientDetail({
  client,
  onClose,
  onEdit,
  onAddTask,
  onLogCommunication
}: {
  client: Client
  onClose: () => void
  onEdit: () => void
  onAddTask: () => void
  onLogCommunication: () => void
}) {
  const data = useData()
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const summary = clientSummary(data, client.id)
  const invoices = data.invoices
    .filter((invoice) => invoice.clientId === client.id)
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
  const orders = data.orders
    .filter((order) => order.clientId === client.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const tasks = data.tasks.filter((task) => task.clientId === client.id && task.status !== 'done')
  const comms = data.communications
    .filter((comm) => comm.clientId === client.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const statement = () => {
    downloadClientStatementPdf(client, invoices, data.payments, data.refunds, data.settings)
    void log('export', `Downloaded statement for ${client.name}`, 'Client', client.id)
    notify('Client statement downloaded.', 'success')
  }

  return (
    <Modal
      open
      wide
      title={client.name}
      description={client.company || labelize(client.clientType)}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onEdit}>
            <Pencil size={14} /> Edit client
          </Button>
          <Button onClick={onAddTask}>
            <CalendarClock size={14} /> Add task
          </Button>
          <Button onClick={onLogCommunication}>
            <MessageSquare size={14} /> Log communication
          </Button>
          <Button variant="primary" onClick={statement} disabled={!invoices.length}>
            <Download size={14} /> Download statement
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="Orders" value={String(summary.orders)} />
          <KpiCard label="Invoiced" value={formatCurrency(summary.totalSales, data.settings)} />
          <KpiCard
            label="Outstanding"
            value={formatCurrency(summary.outstanding, data.settings)}
            tone={summary.outstanding > 0.005 ? 'warning' : 'success'}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-3 text-sm">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">Contact</p>
            <p className="font-medium">{client.email || 'No email recorded'}</p>
            <p className="text-muted">{client.phone || 'No phone recorded'}</p>
            <p className="mt-1 text-muted">{client.address || 'No address recorded'}</p>
          </div>
          <div className="rounded-xl border border-line p-3 text-sm">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">Notes</p>
            <p className="text-muted">{client.notes || 'No notes yet.'}</p>
          </div>
        </div>

        <div>
          <SectionTitle title="Invoices" description="Balances update as payments and refunds are recorded." />
          {invoices.length === 0 ? (
            <p className="text-xs text-muted">No invoices for this client yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Issued</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'right' }}>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 6).map((invoice) => {
                    const balance = invoiceBalance(invoice, data.payments, data.refunds)
                    return (
                      <tr key={invoice.id}>
                        <td className="font-semibold">{invoice.number}</td>
                        <td>{formatDate(invoice.issueDate, data.settings.dateFormat)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.total, data.settings)}</td>
                        <td style={{ textAlign: 'right' }}>
                          {formatCurrency(Math.max(0, balance.balance), data.settings)}
                        </td>
                        <td>
                          <StatusBadge status={balance.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <SectionTitle title="Recent orders" />
            {orders.length === 0 ? (
              <p className="text-xs text-muted">No orders yet.</p>
            ) : (
              <div className="grid gap-1.5">
                {orders.slice(0, 4).map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{order.number}</span>
                    <span className="flex items-center gap-2 text-xs text-muted">
                      {formatCurrency(order.total, data.settings)}
                      <StatusBadge status={order.status} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <SectionTitle title="Open tasks" />
            {tasks.length === 0 ? (
              <p className="text-xs text-muted">No open tasks for this client.</p>
            ) : (
              <div className="grid gap-1.5">
                {tasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{task.title}</span>
                    <span className="flex items-center gap-2 text-xs text-muted">
                      {task.dueDate ? formatDate(task.dueDate, data.settings.dateFormat) : 'No due date'}
                      <Badge tone={isOverdue(task.dueDate) ? 'danger' : 'neutral'}>{labelize(task.priority)}</Badge>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionTitle title="Communication history" />
          {comms.length === 0 ? (
            <p className="text-xs text-muted">No communication has been logged yet.</p>
          ) : (
            <div className="grid gap-2">
              {comms.slice(0, 4).map((comm) => (
                <div key={comm.id} className="rounded-lg bg-canvas px-3 py-2 text-xs">
                  <p className="flex items-center justify-between font-semibold text-ink">
                    <span>{comm.subject || labelize(comm.method)}</span>
                    <span className="font-normal text-muted">{formatDate(comm.date, data.settings.dateFormat)}</span>
                  </p>
                  <p className="mt-0.5 text-muted">{comm.summary}</p>
                  {comm.followUpDate ? (
                    <p className="mt-1 text-brand-dark">Follow up {formatDate(comm.followUpDate, data.settings.dateFormat)}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function ClientModal({
  open,
  editing,
  onClose
}: {
  open: boolean
  editing: Client | null
  onClose: () => void
}) {
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [form, setForm] = useState<ClientForm>(EMPTY_CLIENT)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      editing
        ? {
            name: editing.name,
            company: editing.company,
            email: editing.email,
            phone: editing.phone,
            address: editing.address,
            clientType: editing.clientType,
            notes: editing.notes
          }
        : EMPTY_CLIENT
    )
    setError('')
  }, [open, editing])

  const save = async () => {
    if (!form.name.trim()) {
      setError('Enter a client name.')
      return
    }
    const timestamp = nowISO()
    const record: Client = {
      id: editing?.id || uid('client'),
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      clientType: form.clientType,
      notes: form.notes.trim(),
      createdAt: editing?.createdAt || timestamp,
      updatedAt: timestamp
    }
    await put('clients', record)
    await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Added'} client ${record.name}`, 'Client', record.id)
    notify(editing ? 'Client updated.' : 'Client added.', 'success')
    onClose()
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit client' : 'Add client'}
      description="Client details feed invoices, statements and follow-up reminders."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void save()}>
            {editing ? 'Save changes' : 'Add client'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <FormGrid>
          <Field label="Name" htmlFor="client-name">
            <input
              id="client-name"
              className="input"
              value={form.name}
              autoFocus
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Company">
            <input
              className="input"
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              className="input"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </Field>
          <Field label="Client type">
            <select
              className="select"
              value={form.clientType}
              onChange={(event) => setForm({ ...form, clientType: event.target.value as Client['clientType'] })}
            >
              {CLIENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Address">
            <input
              className="input"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </Field>
        </FormGrid>
        <Field label="Notes" hint="Preferences, payment habits, delivery instructions.">
          <textarea
            className="textarea"
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </Field>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Tasks                                                                      */
/* -------------------------------------------------------------------------- */

interface TaskForm {
  title: string
  description: string
  clientId: string
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
  notes: string
}

const EMPTY_TASK: TaskForm = {
  title: '',
  description: '',
  clientId: '',
  dueDate: '',
  priority: 'medium',
  status: 'todo',
  notes: ''
}

export function TasksPage() {
  const data = useData()
  const put = useApp((state) => state.put)
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  useQuickCreate(openCreate)

  const clientName = (clientId: string | null) =>
    clientId ? data.clients.find((client) => client.id === clientId)?.name || 'Unknown client' : '—'

  const rows = useMemo(() => {
    return data.tasks
      .filter((task) => statusFilter === 'all' || task.status === statusFilter)
      .filter((task) => priorityFilter === 'all' || task.priority === priorityFilter)
      .filter((task) => clientFilter === 'all' || task.clientId === clientFilter)
      .slice()
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return b.createdAt.localeCompare(a.createdAt)
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      })
  }, [data.tasks, statusFilter, priorityFilter, clientFilter])

  const today = todayISO()
  const openTasks = data.tasks.filter((task) => task.status !== 'done')
  const overdue = openTasks.filter((task) => isOverdue(task.dueDate, today))
  const dueSoon = openTasks.filter(
    (task) => task.dueDate && task.dueDate >= today && task.dueDate <= addDays(today, 7)
  )
  const done = data.tasks.filter((task) => task.status === 'done')

  const toggle = async (task: Task) => {
    const status: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    await put('tasks', { ...task, status, updatedAt: nowISO() })
    await log('update', `${status === 'done' ? 'Completed' : 'Reopened'} task ${task.title}`, 'Task', task.id)
  }

  const deleteTask = async () => {
    if (!deleting) return
    await remove('tasks', deleting.id)
    await log('delete', `Deleted task ${deleting.title}`, 'Task', deleting.id)
    notify('Task deleted.', 'success')
    setDeleting(null)
  }

  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="Tasks"
        description="Keep follow-ups, production steps and admin work in one place."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} /> Add task
          </Button>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open tasks" value={String(openTasks.length)} icon={<Circle size={17} />} />
        <KpiCard
          label="Overdue"
          value={String(overdue.length)}
          tone={overdue.length ? 'danger' : 'success'}
          hint="Past their due date"
          icon={<CalendarClock size={17} />}
        />
        <KpiCard label="Due in 7 days" value={String(dueSoon.length)} tone="warning" />
        <KpiCard label="Completed" value={String(done.length)} tone="success" icon={<CheckCircle2 size={17} />} />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <select
            className="select w-auto min-w-[140px]"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            aria-label="Filter by task status"
          >
            <option value="all">All statuses</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {labelize(status)}
              </option>
            ))}
          </select>
          <select
            className="select w-auto min-w-[130px]"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {labelize(priority)}
              </option>
            ))}
          </select>
          <select
            className="select w-auto min-w-[170px]"
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            aria-label="Filter by client"
          >
            <option value="all">All clients</option>
            {data.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          rows={rows}
          searchable={(row) => `${row.title} ${row.description} ${clientName(row.clientId)}`}
          pageSize={12}
          emptyTitle="No tasks match these filters"
          emptyDescription="Create a task or clear the filters to see your list."
          columns={[
            {
              key: 'done',
              label: '',
              className: 'w-8',
              render: (row) => (
                <IconButton
                  label={row.status === 'done' ? 'Reopen task' : 'Mark task complete'}
                  onClick={() => void toggle(row)}
                >
                  {row.status === 'done' ? (
                    <CheckCircle2 size={17} className="text-success" />
                  ) : (
                    <Circle size={17} className="text-muted" />
                  )}
                </IconButton>
              )
            },
            {
              key: 'title',
              label: 'Task',
              sortValue: (row) => row.title,
              render: (row) => (
                <div>
                  <p className={`font-semibold ${row.status === 'done' ? 'text-muted line-through' : ''}`}>{row.title}</p>
                  {row.description ? <p className="text-[11px] text-muted">{row.description}</p> : null}
                </div>
              )
            },
            {
              key: 'client',
              label: 'Client',
              sortValue: (row) => clientName(row.clientId),
              render: (row) => clientName(row.clientId)
            },
            {
              key: 'due',
              label: 'Due',
              sortValue: (row) => row.dueDate || '',
              render: (row) => {
                if (!row.dueDate) return <span className="text-muted">No date</span>
                const late = row.status !== 'done' && row.dueDate < today
                return (
                  <span className={late ? 'font-semibold text-danger' : ''}>
                    {formatDate(row.dueDate, data.settings.dateFormat)}
                  </span>
                )
              }
            },
            {
              key: 'priority',
              label: 'Priority',
              sortValue: (row) => row.priority,
              render: (row) => <StatusBadge status={row.priority} />
            },
            {
              key: 'status',
              label: 'Status',
              sortValue: (row) => row.status,
              render: (row) => <StatusBadge status={row.status} />
            },
            {
              key: 'actions',
              label: '',
              align: 'right',
              render: (row) => (
                <div className="flex justify-end gap-1">
                  <IconButton
                    label={`Edit ${row.title}`}
                    onClick={() => {
                      setEditing(row)
                      setModalOpen(true)
                    }}
                  >
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton label={`Delete ${row.title}`} onClick={() => setDeleting(row)}>
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              )
            }
          ]}
        />
      </Card>

      <TaskModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete task"
        message={`Delete "${deleting?.title || ''}"?`}
        confirmLabel="Delete task"
        onCancel={() => setDeleting(null)}
        onConfirm={() => void deleteTask()}
      />
    </>
  )
}

function TaskModal({
  open,
  editing,
  presetClientId,
  onClose
}: {
  open: boolean
  editing?: Task | null
  presetClientId?: string
  onClose: () => void
}) {
  const data = useData()
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [form, setForm] = useState<TaskForm>(EMPTY_TASK)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      editing
        ? {
            title: editing.title,
            description: editing.description,
            clientId: editing.clientId || '',
            dueDate: editing.dueDate || '',
            priority: editing.priority,
            status: editing.status,
            notes: editing.notes
          }
        : { ...EMPTY_TASK, clientId: presetClientId || '' }
    )
    setError('')
  }, [open, editing, presetClientId])

  const save = async () => {
    if (!form.title.trim()) {
      setError('Enter a task title.')
      return
    }
    const timestamp = nowISO()
    const record: Task = {
      id: editing?.id || uid('task'),
      title: form.title.trim(),
      description: form.description.trim(),
      clientId: form.clientId || null,
      orderId: editing?.orderId || null,
      invoiceId: editing?.invoiceId || null,
      dueDate: form.dueDate || null,
      priority: form.priority,
      status: form.status,
      notes: form.notes.trim(),
      createdAt: editing?.createdAt || timestamp,
      updatedAt: timestamp
    }
    await put('tasks', record)
    await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Added'} task ${record.title}`, 'Task', record.id)
    notify(editing ? 'Task updated.' : 'Task added.', 'success')
    onClose()
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit task' : 'Add task'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void save()}>
            {editing ? 'Save changes' : 'Add task'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field label="Task title" htmlFor="task-title">
          <input
            id="task-title"
            className="input"
            value={form.title}
            autoFocus
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </Field>
        <Field label="Description">
          <input
            className="input"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </Field>
        <FormGrid>
          <Field label="Client">
            <select
              className="select"
              value={form.clientId}
              onChange={(event) => setForm({ ...form, clientId: event.target.value })}
            >
              <option value="">No client</option>
              {data.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </Field>
          <Field label="Priority">
            <select
              className="select"
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {labelize(priority)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className="select"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {labelize(status)}
                </option>
              ))}
            </select>
          </Field>
        </FormGrid>
        <Field label="Notes">
          <textarea
            className="textarea"
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </Field>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Communication                                                              */
/* -------------------------------------------------------------------------- */

interface CommunicationForm {
  clientId: string
  date: string
  method: Communication['method']
  subject: string
  summary: string
  followUpDate: string
}

export function CommunicationPage() {
  const data = useData()
  const remove = useApp((state) => state.remove)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)

  const [clientFilter, setClientFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState<'all' | Communication['method']>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Communication | null>(null)
  const [deleting, setDeleting] = useState<Communication | null>(null)

  const clientName = (clientId: string) =>
    data.clients.find((client) => client.id === clientId)?.name || 'Unknown client'

  const rows = useMemo(
    () =>
      data.communications
        .filter((comm) => clientFilter === 'all' || comm.clientId === clientFilter)
        .filter((comm) => methodFilter === 'all' || comm.method === methodFilter)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.communications, clientFilter, methodFilter]
  )

  const today = todayISO()
  const thisMonth = rows.filter((comm) => comm.date.slice(0, 7) === today.slice(0, 7))
  const followUps = data.communications.filter(
    (comm) => comm.followUpDate && comm.followUpDate <= addDays(today, 7)
  )
  const reached = new Set(data.communications.map((comm) => comm.clientId)).size

  const exportLog = () => {
    exportCSV(`communication-log-${today}.csv`, rows, [
      { key: 'date', label: 'Date', getValue: (row) => row.date },
      { key: 'client', label: 'Client', getValue: (row) => clientName(row.clientId) },
      { key: 'method', label: 'Method', getValue: (row) => row.method },
      { key: 'subject', label: 'Subject', getValue: (row) => row.subject },
      { key: 'summary', label: 'Summary', getValue: (row) => row.summary },
      { key: 'followUp', label: 'Follow-up', getValue: (row) => row.followUpDate || '' }
    ])
    void log('export', 'Exported communication log to CSV', 'Communication')
    notify('Communication log exported.', 'success')
  }

  const deleteComm = async () => {
    if (!deleting) return
    await remove('communications', deleting.id)
    await log('delete', `Deleted communication with ${clientName(deleting.clientId)}`, 'Communication', deleting.id)
    notify('Communication entry deleted.', 'success')
    setDeleting(null)
  }

  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="Communication log"
        description="A private record of calls, emails and meetings so nothing gets forgotten."
        actions={
          <>
            <Button onClick={exportLog} disabled={!rows.length}>
              <Download size={15} /> Export
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
              disabled={!data.clients.length}
            >
              <Plus size={15} /> Log communication
            </Button>
          </>
        }
      />
      <PageTabs tabs={TABS} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total entries" value={String(data.communications.length)} icon={<MessageSquare size={17} />} />
        <KpiCard label="This month" value={String(thisMonth.length)} />
        <KpiCard
          label="Follow-ups due"
          value={String(followUps.length)}
          tone={followUps.length ? 'warning' : 'success'}
          hint="Within the next 7 days"
          icon={<CalendarClock size={17} />}
        />
        <KpiCard label="Clients reached" value={String(reached)} icon={<Users size={17} />} />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <select
            className="select w-auto min-w-[180px]"
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            aria-label="Filter by client"
          >
            <option value="all">All clients</option>
            {data.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <select
            className="select w-auto min-w-[150px]"
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value as typeof methodFilter)}
            aria-label="Filter by method"
          >
            <option value="all">All methods</option>
            {COMM_METHODS.map((method) => (
              <option key={method} value={method}>
                {labelize(method)}
              </option>
            ))}
          </select>
        </div>

        {data.clients.length === 0 ? (
          <EmptyState
            title="Add a client first"
            description="The communication log records conversations against a client record."
          />
        ) : (
          <DataTable
            rows={rows}
            searchable={(row) => `${clientName(row.clientId)} ${row.subject} ${row.summary}`}
            pageSize={12}
            emptyTitle="No communication logged"
            emptyDescription="Log a call, email or meeting to build a history for each client."
            columns={[
              {
                key: 'date',
                label: 'Date',
                sortValue: (row) => row.date,
                render: (row) => formatDate(row.date, data.settings.dateFormat)
              },
              {
                key: 'client',
                label: 'Client',
                sortValue: (row) => clientName(row.clientId),
                render: (row) => <span className="font-semibold">{clientName(row.clientId)}</span>
              },
              {
                key: 'method',
                label: 'Method',
                sortValue: (row) => row.method,
                render: (row) => <Badge tone="brand">{labelize(row.method)}</Badge>
              },
              {
                key: 'subject',
                label: 'Subject',
                sortValue: (row) => row.subject,
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.subject || '—'}</p>
                    <p className="text-[11px] text-muted">{row.summary}</p>
                  </div>
                )
              },
              {
                key: 'followUp',
                label: 'Follow-up',
                sortValue: (row) => row.followUpDate || '',
                render: (row) =>
                  row.followUpDate ? (
                    <span className={isOverdue(row.followUpDate, today) ? 'font-semibold text-danger' : ''}>
                      {formatDate(row.followUpDate, data.settings.dateFormat)}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )
              },
              {
                key: 'actions',
                label: '',
                align: 'right',
                render: (row) => (
                  <div className="flex justify-end gap-1">
                    <IconButton
                      label="Edit entry"
                      onClick={() => {
                        setEditing(row)
                        setModalOpen(true)
                      }}
                    >
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton label="Delete entry" onClick={() => setDeleting(row)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                )
              }
            ]}
          />
        )}
      </Card>

      <CommunicationModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete communication entry"
        message="This entry will be permanently removed from the local communication log."
        confirmLabel="Delete entry"
        onCancel={() => setDeleting(null)}
        onConfirm={() => void deleteComm()}
      />
    </>
  )
}

function CommunicationModal({
  open,
  editing,
  presetClientId,
  onClose
}: {
  open: boolean
  editing?: Communication | null
  presetClientId?: string
  onClose: () => void
}) {
  const data = useData()
  const put = useApp((state) => state.put)
  const notify = useApp((state) => state.notify)
  const log = useApp((state) => state.log)
  const [form, setForm] = useState<CommunicationForm>({
    clientId: '',
    date: todayISO(),
    method: 'email',
    subject: '',
    summary: '',
    followUpDate: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      editing
        ? {
            clientId: editing.clientId,
            date: editing.date,
            method: editing.method,
            subject: editing.subject,
            summary: editing.summary,
            followUpDate: editing.followUpDate || ''
          }
        : {
            clientId: presetClientId || data.clients[0]?.id || '',
            date: todayISO(),
            method: 'email',
            subject: '',
            summary: '',
            followUpDate: ''
          }
    )
    setError('')
  }, [open, editing, presetClientId, data.clients])

  const save = async () => {
    if (!form.clientId) {
      setError('Choose a client for this entry.')
      return
    }
    if (!form.summary.trim() && !form.subject.trim()) {
      setError('Add a subject or a short summary.')
      return
    }
    const record: Communication = {
      id: editing?.id || uid('comm'),
      clientId: form.clientId,
      date: parseDateInput(form.date),
      method: form.method,
      subject: form.subject.trim(),
      summary: form.summary.trim(),
      followUpDate: form.followUpDate ? parseDateInput(form.followUpDate) : null,
      createdAt: editing?.createdAt || nowISO()
    }
    await put('communications', record)
    await log(editing ? 'update' : 'create', `${editing ? 'Updated' : 'Logged'} communication with ${data.clients.find((client) => client.id === form.clientId)?.name || 'client'}`, 'Communication', record.id)
    notify(editing ? 'Communication entry updated.' : 'Communication logged.', 'success')
    onClose()
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit communication entry' : 'Log communication'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void save()}>
            {editing ? 'Save changes' : 'Log entry'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <FormGrid>
          <Field label="Client">
            <select
              className="select"
              value={form.clientId}
              onChange={(event) => setForm({ ...form, clientId: event.target.value })}
            >
              <option value="">Choose a client…</option>
              {data.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </Field>
          <Field label="Method">
            <select
              className="select"
              value={form.method}
              onChange={(event) => setForm({ ...form, method: event.target.value as Communication['method'] })}
            >
              {COMM_METHODS.map((method) => (
                <option key={method} value={method}>
                  {labelize(method)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Follow-up date" hint="Optional reminder date.">
            <input
              type="date"
              className="input"
              value={form.followUpDate}
              onChange={(event) => setForm({ ...form, followUpDate: event.target.value })}
            />
          </Field>
        </FormGrid>
        <Field label="Subject">
          <input
            className="input"
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
            placeholder="Quote follow-up, delivery question…"
          />
        </Field>
        <Field label="Summary">
          <textarea
            className="textarea"
            rows={4}
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
            placeholder="What was discussed and what happens next?"
          />
        </Field>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  )
}
