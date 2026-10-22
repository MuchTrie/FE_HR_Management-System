import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { createHoliday, deleteHoliday, getHolidays, updateHoliday } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { CompanyHoliday, CreateHolidayRequest } from '../../types'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import { EmptyState, Spinner, TableSkeleton } from '../../components/ui/Loading'
import toast from 'react-hot-toast'

function HolidayForm({ initial, onSubmit, isLoading }: {
  initial?: CompanyHoliday
  onSubmit: (data: CreateHolidayRequest) => void
  isLoading: boolean
}) {
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const canSubmit = date.length > 0 && name.trim().length > 0
  return (
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (canSubmit) onSubmit({ date, name: name.trim() }) }}>
      <div>
        <label className="label" htmlFor="holiday-date">Date</label>
        <input id="holiday-date" type="date" className="input" value={date} onChange={event => setDate(event.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="holiday-name">Holiday name</label>
        <input id="holiday-name" className="input" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Independence Day" required />
      </div>
      <button type="submit" className="btn-primary btn w-full" disabled={!canSubmit || isLoading}>
        {isLoading && <Spinner size={16} className="text-white" />}
        {isLoading ? 'Saving...' : 'Save holiday'}
      </button>
    </form>
  )
}

export default function HolidayPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const qc = useQueryClient()
  const [year, setYear] = useState(new Date().getFullYear())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CompanyHoliday | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const { data: holidays, isLoading } = useQuery({
    queryKey: ['holidays-page', year],
    queryFn: () => getHolidays(year),
  })
  const createMutation = useMutation({
    mutationFn: createHoliday,
    onSuccess: () => { toast.success('Holiday created'); qc.invalidateQueries({ queryKey: ['holidays-page'] }); qc.invalidateQueries({ queryKey: ['calendar-holidays'] }); setFormOpen(false) },
    onError: () => toast.error('Holiday date already exists or could not be saved.'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateHolidayRequest }) => updateHoliday(id, data),
    onSuccess: () => { toast.success('Holiday updated'); qc.invalidateQueries({ queryKey: ['holidays-page'] }); qc.invalidateQueries({ queryKey: ['calendar-holidays'] }); setEditing(null) },
    onError: () => toast.error('Holiday date already exists or could not be updated.'),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => { toast.success('Holiday deleted'); qc.invalidateQueries({ queryKey: ['holidays-page'] }); qc.invalidateQueries({ queryKey: ['calendar-holidays'] }); setDeleting(null) },
    onError: () => toast.error('Holiday could not be deleted.'),
  })

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Holidays</h1>
          <p className="page-subtitle">Manage dates excluded from working-day calculations</p>
        </div>
        {isAdmin && <button className="btn-primary btn" onClick={() => setFormOpen(true)}><Plus size={16} /> Add holiday</button>}
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500"><CalendarDays size={17} className="text-brand-600" /> Holidays for year</div>
        <select className="select w-full sm:w-32" value={year} onChange={event => setYear(Number(event.target.value))}>
          {[year - 1, year, year + 1].map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={isAdmin ? 3 : 2} /> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Date</th><th>Holiday</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>
              {holidays?.length === 0 ? <tr><td colSpan={isAdmin ? 3 : 2}><EmptyState message="No company holidays found" /></td></tr> : holidays?.map(holiday => (
                <tr key={holiday.id}>
                  <td className="whitespace-nowrap font-medium">{format(parseISO(holiday.date), 'dd MMM yyyy')}</td>
                  <td>{holiday.name}</td>
                  {isAdmin && <td><div className="flex gap-1"><button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEditing(holiday)}><Pencil size={15} /></button><button className="btn btn-ghost btn-sm text-red-500" title="Delete" onClick={() => setDeleting(holiday.id)}><Trash2 size={15} /></button></div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Add Company Holiday">
        <HolidayForm onSubmit={data => createMutation.mutate(data)} isLoading={createMutation.isPending} />
      </Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Company Holiday">
        {editing && <HolidayForm initial={editing} onSubmit={data => updateMutation.mutate({ id: editing.id, data })} isLoading={updateMutation.isPending} />}
      </Modal>
      <ConfirmModal isOpen={deleting !== null} onClose={() => setDeleting(null)} onConfirm={() => deleting && deleteMutation.mutate(deleting)} title="Delete Company Holiday" message="Delete this holiday? Existing leave validation will no longer treat this date as a company holiday." confirmText="Delete" variant="danger" isLoading={deleteMutation.isPending} />
    </div>
  )
}
