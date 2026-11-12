import React, { useEffect, useState } from 'react'
import { useBusinessStore } from '../store/business'
import { useNavigate } from 'react-router-dom'
import { Task, Communication } from '../lib/database'

export const TasksAndCommunications: React.FC = () => {
  const navigate = useNavigate()
  const { isDemo, businessData, tasks, communications, addTask, updateTask, removeTask, addCommunication, updateCommunication, removeCommunication } = useBusinessStore()
  const { isLoaded } = useBusinessStore()

  // Task form state
  const [form, setForm] = useState<Partial<Task>>({
    title: '',
    description: null,
    clientId: null,
    orderId: null,
    invoiceId: null,
    dueDate: new Date(),
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'cancelled',
    notes: ''
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Tasks already in store
  }, [tasks])

  const handleShowForm = (id?: string, task?: Task) => {
    if (id && task) {
      setForm({
        ...task,
        dueDate: new Date(task.dueDate),
        priority: task.priority,
        status: task.status
      })
      setEditingId(id)
    } else {
      setForm({
        title: '',
        description: null,
        clientId: null,
        orderId: null,
        invoiceId: null,
        dueDate: new Date(),
        priority: 'medium',
        status: 'pending',
        notes: ''
      })
      setEditingId(null)
    }
    setShowForm(true)
  }

  const handleHideForm = () => {
    setShowForm(false)
    setForm({
      title: '',
      description: null,
      clientId: null,
      orderId: null,
      invoiceId: null,
      dueDate: new Date(),
      priority: 'medium',
      status: 'pending',
      notes: ''
    })
    setEditingId(null)
  }

  const handleSave = async () => {
    try {
      const taskData: Task = {
        ...form,
        id: editingId || `task-${Date.now()}`,
        title: form.title,
        description: form.description,
        clientId: form.clientId,
        orderId: form.orderId,
        invoiceId: form.invoiceId,
        dueDate: form.dueDate,
        priority: form.priority,
        status: form.status,
        notes: form.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        await updateTask(editingId, {
          title: form.title,
          description: form.description,
          clientId: form.clientId,
          orderId: form.orderId,
          invoiceId: form.invoiceId,
          dueDate: form.dueDate,
          priority: form.priority,
          status: form.status,
          notes: form.notes
        })
      } else {
        await addTask(taskData)
      }

      handleHideForm()
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  // Communication form state
  const [commForm, setCommForm] = useState<Partial<Communication>>({
    clientId: null,
    date: new Date(),
    method: 'email' as 'email' | 'phone' | 'in-person' | 'other',
    subject: '',
    summary: '',
    followUpDate: null as Date | null
  })

  const [showCommForm, setShowCommForm] = useState(false)

  const handleShowCommForm = (clientId: string) => {
    setCommForm({
      clientId,
      date: new Date(),
      method: 'email',
      subject: '',
      summary: '',
      followUpDate: null
    })
    setShowCommForm(true)
  }

  const handleHideCommForm = () => {
    setShowCommForm(false)
    setCommForm({
      clientId: null,
      date: new Date(),
      method: 'email',
      subject: '',
      summary: '',
      followUpDate: null
    })
  }

  const handleSaveComm = async () => {
    try {
      const commData: Communication = {
        ...commForm,
        id: `comm-${Date.now()}`,
        clientId: commForm.clientId,
        date: commForm.date,
        method: commForm.method,
        subject: commForm.subject,
        summary: commForm.summary,
        followUpDate: commForm.followUpDate,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await addCommunication(commData)
      handleHideCommForm()
    } catch (error) {
      console.error('Failed to save communication:', error)
    }
  }

  const handleCancelComm = () => {
    setShowCommForm(false)
    setCommForm({
      clientId: null,
      date: new Date(),
      method: 'email',
      subject: '',
      summary: '',
      followUpDate: null
    })
  }

  return (
    <div className="pt-8">
      <h2 className="text-2xl font-bold mb-6">Tasks and Communication Log</h2>

      {/* Tasks Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Tasks</h3>
        
        {/* Task form */}
        {showForm && (
          <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)] mb-4">
            <h4 className="text-xs font-medium text-[var(--muted)] mb-2">New Task</h4>
            <form className="space-y-3">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full py-1 rounded border px-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full py-1 rounded border px-2 text-sm h-16 resize-none"
                  rows={2}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full py-1 rounded border px-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full py-1 rounded border px-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate.toISOString().split('T')[0]}
                  className="w-full py-1 rounded border px-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Client</label>
                <select className="w-full py-1 rounded border px-2 text-sm">
                  <option value="">Any Client</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Related</label>
                <select className="w-full py-1 rounded border px-2 text-sm">
                  <option value="">None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full py-1 rounded border px-2 text-sm h-16 resize-none"
                  rows={2}
                ></textarea>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleHideForm}
                  className="px-2 py-1 rounded text-xs text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-2 py-1 rounded bg-[var(--accent)] text-white text-xs hover:bg-[var(--deeporange)] transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <p className="text-sm text-[var(--muted)] mb-2">Recent Tasks</p>
        {/* Would list tasks from store */}
      </div>

      {/* Communications Section */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-sm font-medium text-[var(--muted)] mb-4">Communication Log</h3>
        
        {/* Communication form */}
        {showCommForm && (
          <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)] mb-4">
            <h4 className="text-xs font-medium text-[var(--muted)] mb-2">New Communication</h4>
            <form className="space-y-3">
              <input
                type="hidden"
                value={commForm.clientId}
                defaultValue={commForm.clientId}
              />
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Method</label>
                <select
                  value={commForm.method}
                  onChange={(e) => setCommForm({ ...commForm, method: e.target.value as any })}
                  className="w-full py-1 rounded border px-2 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="in-person">In-Person</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Subject</label>
                <input
                  value={commForm.subject}
                  onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })}
                  className="w-full py-1 rounded border px-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Summary</label>
                <textarea
                  value={commForm.summary || ''}
                  onChange={(e) => setCommForm({ ...commForm, summary: e.target.value })}
                  className="w-full py-1 rounded border px-2 text-sm h-24 resize-none"
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Follow-Up Date</label>
                <input
                  type="date"
                  value={commForm.followUpDate?.toISOString().split('T')[0] || ''}
                  className="w-full py-1 rounded border px-2 text-sm"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleCancelComm}
                  className="px-2 py-1 rounded text-xs text-[var(--fg)] hover:bg-[var(--soft-bg)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveComm}
                  className="px-2 py-1 rounded bg-[var(--accent)] text-white text-xs hover:bg-[var(--deeporange)] transition-colors"
                >
                  Send/Log
                </button>
              </div>
            </form>
          </div>
        )}

        <button
          onClick={handleShowCommForm}
          className="w-full py-2 rounded bg-[var(--accent)] text-white text-sm hover:bg-[var(--deeporange)] transition-colors mb-3"
        >
          + Add Communication
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Total Tasks</p>
          <p className="text-2xl font-bold">{tasks.length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Completed</p>
          <p className="text-2xl font-bold text-[var(--success)]">{tasks.filter(t => t.status === 'completed').length}</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Overdue</p>
          <p className="text-2xl font-bold text-[var(--danger)]">0</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">Comm. Log</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  )
}