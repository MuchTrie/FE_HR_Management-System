import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle, XCircle, XOctagon } from 'lucide-react'
import {
  getLeaves, createLeave, approveLeave, rejectLeave, cancelLeave,
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
})
type LeaveForm = z.infer<typeof leaveSchema>

function LeaveRequestForm({ onSubmit, isLoading }: { onSubmit: (d: CreateLeaveRequest) => void; isLoading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
  })

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
  const [actionModal, setActionModal] = useState<{ id: number; action: 'approve' | 'reject' | 'cancel' } | null>(null)
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | ''>('')

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
    onError: (e: Error) => toast.error(e.message),
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      if (action === 'approve') return approveLeave(id, user!.employee_id!)
      if (action === 'reject') return rejectLeave(id, user!.employee_id!)
      return cancelLeave(id)
    },
    onSuccess: (_, vars) => {
      toast.success(`Leave ${vars.action}d successfully`)
      qc.invalidateQueries({ queryKey: ['leaves'] })
      setActionModal(null)
    },
    onError: () => toast.error('Action failed'),
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">{isEmployee ? 'Your leave requests' : 'All leave requests'}</p>
        </div>
        {isEmployee && (
          <button id="btn-request-leave" className="btn-primary btn" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Request Leave
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card p-4 mb-5">
        <div className="flex gap-3 flex-wrap">
          <select
            className="select w-44"
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
      </div>

      {/* Table */}
      {isLoading ? <TableSkeleton rows={6} cols={6} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {!isEmployee && <th>Employee</th>}
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Reason</th>
                <th>Status</th>
                {!isEmployee && <th>Actions</th>}
                {isEmployee && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data?.items.length === 0 ? (
                <tr><td colSpan={8}><EmptyState message="No leave requests found" /></td></tr>
              ) : data?.items.map(lr => (
                <tr key={lr.id}>
                  {!isEmployee && (
                    <td className="font-medium">
                      {lr.employee?.first_name} {lr.employee?.last_name}
                    </td>
                  )}
                  <td>
                    <span className="badge badge-blue">{lr.leave_type}</span>
                  </td>
                  <td>{lr.start_date}</td>
                  <td>{lr.end_date}</td>
                  <td className="max-w-xs">
                    <p className="truncate text-gray-500 dark:text-gray-400 text-xs">{lr.reason}</p>
                  </td>
                  <td><LeaveStatusBadge status={lr.status} /></td>
                  <td>
                    <div className="flex gap-1">
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
                            onClick={() => setActionModal({ id: lr.id, action: 'reject' })}
                            title="Reject"
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      {/* Employee can cancel pending */}
                      {isEmployee && lr.status === 'PENDING' && (
                        <button
                          className="btn btn-ghost btn-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setActionModal({ id: lr.id, action: 'cancel' })}
                          title="Cancel"
                        >
                          <XOctagon size={15} />
                        </button>
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

      {/* Action confirm */}
      <ConfirmModal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        onConfirm={() => actionModal && actionMutation.mutate({ id: actionModal.id, action: actionModal.action })}
        title={
          actionModal?.action === 'approve' ? 'Approve Leave' :
          actionModal?.action === 'reject' ? 'Reject Leave' : 'Cancel Leave'
        }
        message={
          actionModal?.action === 'approve' ? 'Are you sure you want to approve this leave request?' :
          actionModal?.action === 'reject' ? 'Are you sure you want to reject this leave request?' :
          'Are you sure you want to cancel this leave request?'
        }
        confirmText={actionModal?.action === 'approve' ? 'Approve' : actionModal?.action === 'reject' ? 'Reject' : 'Cancel Request'}
        variant={actionModal?.action === 'reject' || actionModal?.action === 'cancel' ? 'danger' : 'default'}
        isLoading={actionMutation.isPending}
      />
    </div>
  )
}
