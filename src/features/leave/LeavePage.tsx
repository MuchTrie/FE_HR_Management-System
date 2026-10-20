import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle, XCircle, XOctagon, Pencil, Info } from 'lucide-react'
import {
  getLeaves, createLeave, updateLeave, getLeaveBalance, getLeavePolicies, approveLeave, rejectLeave, cancelLeave,
  getApiErrorMessage,
} from '../../lib/api'
import type { CreateLeaveRequest, LeaveStatus } from '../../types'
import { LeaveStatusBadge } from '../../components/ui/Badge'
import { TableSkeleton, EmptyState, Spinner } from '../../components/ui/Loading'
import { ConfirmModal } from '../../components/ui/Modal'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const leaveSchema = z.object({
  leave_type: z.enum(['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'EMERGENCY']),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
}).refine(value => value.end_date >= value.start_date, {
  path: ['end_date'],
  message: 'End date must be on or after start date',
})
type LeaveForm = z.infer<typeof leaveSchema>

const leaveTypeLabels: Record<string, string> = {
  ANNUAL: 'Annual',
  SICK: 'Sick',
  PERSONAL: 'Personal',
  MATERNITY: 'Maternity',
  EMERGENCY: 'Emergency',
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function LeaveRequestForm({ onSubmit, isLoading, initial }: { onSubmit: (d: CreateLeaveRequest) => void; isLoading: boolean; initial?: CreateLeaveRequest }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
    defaultValues: initial ?? { leave_type: 'ANNUAL', start_date: '', end_date: '', reason: '' },
  })
  useEffect(() => {
    reset(initial ?? { leave_type: 'ANNUAL', start_date: '', end_date: '', reason: '' })
  }, [initial, reset])

  return (
    <form id="leave-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Leave Type</label>
        <select {...register('leave_type')} className="select">
          <option value="ANNUAL">Annual Leave</option>
          <option value="SICK">Sick Leave</option>
          <option value="PERSONAL">Personal Leave</option>
          <option value="MATERNITY">Maternity Leave</option>
          <option value="EMERGENCY">Emergency Leave</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Date</label>
          <input {...register('start_date')} type="date" className={`input ${errors.start_date ? 'input-error' : ''}`} />
          {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date.message}</p>}
        </div>
        <div>
          <label className="label">End Date</label>
          <input {...register('end_date')} type="date" className={`input ${errors.end_date ? 'input-error' : ''}`} />
          {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Reason</label>
        <textarea {...register('reason')} className={`textarea ${errors.reason ? 'input-error' : ''}`} rows={4} placeholder="Please describe your reason for leave..." />
        {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>}
      </div>
      <button id="btn-submit-leave" type="submit" className="btn-primary btn w-full" disabled={isLoading}>
        {isLoading ? <Spinner size={16} className="text-white" /> : null}
        {isLoading ? 'Submitting...' : 'Submit Leave Request'}
      </button>
    </form>
  )
}

export default function LeavePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const isEmployee = user?.role === 'EMPLOYEE'
  const empId = user?.employee_id

  const [formOpen, setFormOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [editingLeave, setEditingLeave] = useState<{ id: number; data: CreateLeaveRequest } | null>(null)
  const [actionModal, setActionModal] = useState<{ id: number; action: 'approve' | 'reject' | 'cancel' } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | ''>('')
  const { data: balances } = useQuery({
    queryKey: ['leave-balance', empId],
    queryFn: () => getLeaveBalance(),
    enabled: isEmployee,
  })
  const { data: leavePolicies } = useQuery({
    queryKey: ['leave-policies'],
    queryFn: getLeavePolicies,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', page, filterStatus, isEmployee],
    queryFn: () => getLeaves({
      page, per_page: 10,
      employee_id: isEmployee ? empId : undefined,
      status: filterStatus || undefined,
    }),
  })

  const createMutation = useMutation({
    mutationFn: (d: CreateLeaveRequest) => createLeave(d, empId!),
    onSuccess: () => { toast.success('Leave request submitted!'); qc.invalidateQueries({ queryKey: ['leaves'] }); setFormOpen(false) },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e, 'Pengajuan cuti gagal dibuat.')),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data: values }: { id: number; data: CreateLeaveRequest }) => updateLeave(id, values),
    onSuccess: () => {
      toast.success('Leave request updated')
      qc.invalidateQueries({ queryKey: ['leaves'] })
      setEditingLeave(null)
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e, 'Pengajuan cuti gagal diperbarui.')),
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: number; action: string; reason?: string }) => {
      if (action === 'approve') return approveLeave(id)
      if (action === 'reject') return rejectLeave(id, reason ?? '')
      return cancelLeave(id)
    },
    onSuccess: (_, vars) => {
      toast.success(`Leave ${vars.action}d successfully`)
      qc.invalidateQueries({ queryKey: ['leaves'] })
      setActionModal(null)
      setRejectionReason('')
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e, 'Tindakan pada pengajuan cuti gagal.')),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5 border-b border-gray-200 pb-5 dark:border-gray-800 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-500">Time off</p>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">{isEmployee ? 'Track and manage your leave requests' : 'Review and manage employee leave requests'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-outline btn" onClick={() => setRulesOpen(true)}>
            <Info size={16} /> Aturan Cuti
          </button>
          {isEmployee && (
            <button id="btn-request-leave" className="btn-primary btn" onClick={() => setFormOpen(true)}>
              <Plus size={16} /> Request Leave
            </button>
          )}
        </div>
      </div>

      {isEmployee && balances && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Your leave balance</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current year allowance and usage</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {balances.map(balance => (
              <div key={balance.leave_type} className="card min-h-[108px] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{leaveTypeLabels[balance.leave_type] ?? balance.leave_type}</p>
                <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                  {balance.remaining}
                  <span className="ml-1 text-xs font-normal text-gray-400">days left</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">{balance.used} used of {balance.quota}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Leave requests</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Filter requests by approval status</p>
          </div>
          <select
            className="select w-full sm:w-48"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value as LeaveStatus | ''); setPage(1) }}
          >
            <option value="">All Status</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </section>

      {/* Table */}
      {isLoading ? <TableSkeleton rows={6} cols={6} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {!isEmployee && <th>Employee</th>}
                <th>Type</th>
                <th>Start date</th>
                <th>End date</th>
                <th className="min-w-[220px]">Reason</th>
                <th>Status</th>
                {!isEmployee && <th>Actions</th>}
                {isEmployee && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data?.items.length === 0 ? (
                <tr><td colSpan={isEmployee ? 6 : 7}><EmptyState message="No leave requests found" /></td></tr>
              ) : data?.items.map(lr => (
                <tr key={lr.id}>
                  {!isEmployee && (
                    <td className="font-medium">
                      {lr.employee?.first_name} {lr.employee?.last_name}
                    </td>
                  )}
                  <td>
                    <span className="badge badge-blue">{leaveTypeLabels[lr.leave_type] ?? lr.leave_type}</span>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(lr.start_date)}</td>
                  <td className="whitespace-nowrap">{formatDate(lr.end_date)}</td>
                  <td className="max-w-xs">
                    <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400" title={lr.reason}>{lr.reason}</p>
                    {lr.status === 'REJECTED' && lr.rejection_reason && (
                      <p className="truncate text-red-500 text-xs" title={lr.rejection_reason}>Rejected: {lr.rejection_reason}</p>
                    )}
                  </td>
                  <td><LeaveStatusBadge status={lr.status} /></td>
                  <td>
                    <div className="flex justify-start gap-1">
                      {/* Admin/Manager can approve/reject */}
                      {!isEmployee && lr.status === 'PENDING' && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            onClick={() => setActionModal({ id: lr.id, action: 'approve' })}
                            title="Approve"
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => { setRejectionReason(''); setActionModal({ id: lr.id, action: 'reject' }) }}
                            title="Reject"
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      {/* Employee can cancel pending */}
                      {isEmployee && lr.status === 'PENDING' && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                            onClick={() => setEditingLeave({ id: lr.id, data: { leave_type: lr.leave_type, start_date: lr.start_date.slice(0, 10), end_date: lr.end_date.slice(0, 10), reason: lr.reason } })}
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => setActionModal({ id: lr.id, action: 'cancel' })}
                            title="Cancel"
                          >
                            <XOctagon size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={data?.total_pages ?? 1}
        onPageChange={setPage}
        total={data?.total}
        perPage={10}
      />

      {/* Request form modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Request Leave">
        <LeaveRequestForm onSubmit={(d) => createMutation.mutate(d)} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} title="Aturan Pengajuan Cuti" size="lg">
        <div className="space-y-5 text-sm text-gray-600 dark:text-gray-300">
          <div className="rounded-lg border border-brand-100 bg-brand-50 p-4 dark:border-brand-900/40 dark:bg-brand-950/30">
            <p className="font-medium text-brand-700 dark:text-brand-300">
              Periksa aturan berikut sebelum mengajukan cuti.
            </p>
            <p className="mt-1 text-xs text-brand-600/80 dark:text-brand-400">
              Pengajuan akan divalidasi oleh sistem dan dapat ditolak jika tidak memenuhi ketentuan.
            </p>
          </div>

          <section>
            <h3 className="font-semibold text-gray-900 dark:text-white">Kuota cuti tahunan</h3>
            <p className="mt-1">Sisa kuota dihitung berdasarkan jenis cuti dan tahun berjalan. Pengajuan berstatus pending juga mengurangi kuota yang tersedia.</p>
            {leavePolicies && leavePolicies.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Jenis cuti</th>
                      <th>Kuota</th>
                      <th>Maksimal berturut-turut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leavePolicies.map(policy => (
                      <tr key={policy.id}>
                        <td>{policy.leave_type}</td>
                        <td>{policy.annual_quota_days} hari/tahun</td>
                        <td>{policy.max_consecutive_days > 0 ? `${policy.max_consecutive_days} hari` : 'Tidak dibatasi'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 dark:text-white">Ketentuan tanggal</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Tanggal selesai harus sama dengan atau setelah tanggal mulai.</li>
              <li>Secara default, cuti tidak dapat diajukan pada Sabtu dan Minggu.</li>
              <li>Cuti tidak dapat diajukan pada hari libur perusahaan yang terdaftar.</li>
              <li>Tanggal cuti tidak boleh bertabrakan dengan pengajuan pending atau cuti yang sudah disetujui.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 dark:text-white">Proses pengajuan</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Alasan pengajuan harus diisi minimal 10 karakter.</li>
              <li>Pengajuan baru berstatus <strong>PENDING</strong>.</li>
              <li>Pengajuan PENDING masih dapat diedit atau dibatalkan.</li>
              <li>Setelah disetujui, ditolak, atau dibatalkan, pengajuan tidak dapat diproses ulang.</li>
            </ul>
          </section>
        </div>
      </Modal>

      <Modal isOpen={editingLeave !== null} onClose={() => setEditingLeave(null)} title="Edit Leave Request">
        {editingLeave && (
          <LeaveRequestForm
            initial={editingLeave.data}
            onSubmit={(data) => updateMutation.mutate({ id: editingLeave.id, data })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      {actionModal?.action === 'reject' ? (
        <Modal isOpen onClose={() => setActionModal(null)} title="Reject Leave" size="sm">
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="rejection-reason">Reason</label>
              <textarea
                id="rejection-reason"
                className="textarea"
                rows={4}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is rejected..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button className="btn-outline" onClick={() => setActionModal(null)} disabled={actionMutation.isPending}>Cancel</button>
              <button
                className="btn-danger btn"
                disabled={actionMutation.isPending || rejectionReason.trim().length < 3}
                onClick={() => actionModal && actionMutation.mutate({ id: actionModal.id, action: 'reject', reason: rejectionReason.trim() })}
              >
                {actionMutation.isPending ? 'Rejecting...' : 'Reject Leave'}
              </button>
            </div>
          </div>
        </Modal>
      ) : (
        <ConfirmModal
          isOpen={!!actionModal}
          onClose={() => setActionModal(null)}
          onConfirm={() => actionModal && actionMutation.mutate({ id: actionModal.id, action: actionModal.action })}
          title={actionModal?.action === 'approve' ? 'Approve Leave' : 'Cancel Leave'}
          message={actionModal?.action === 'approve' ? 'Are you sure you want to approve this leave request?' : 'Are you sure you want to cancel this leave request?'}
          confirmText={actionModal?.action === 'approve' ? 'Approve' : 'Cancel Request'}
          variant={actionModal?.action === 'cancel' ? 'danger' : 'default'}
          isLoading={actionMutation.isPending}
        />
      )}
    </div>
  )
}
