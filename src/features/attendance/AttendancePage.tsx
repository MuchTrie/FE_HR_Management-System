import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, LogIn, LogOut } from 'lucide-react'
import {
  getAttendance, checkIn, checkOut, getTodayAttendance, getEmployees,
} from '../../lib/api'
import type { AttendanceQueryParams } from '../../types'
import { AttendanceStatusBadge } from '../../components/ui/Badge'
import { TableSkeleton, EmptyState, Spinner } from '../../components/ui/Loading'
import Pagination from '../../components/ui/Pagination'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const isEmployee = user?.role === 'EMPLOYEE'
  const empId = user?.employee_id

  const [params, setParams] = useState<AttendanceQueryParams>({
    page: 1, per_page: 10,
    employee_id: isEmployee ? empId : undefined,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', params],
    queryFn: () => getAttendance(params),
  })

  const { data: todayAtt, refetch: refetchToday } = useQuery({
    queryKey: ['today-att', empId],
    queryFn: () => getTodayAttendance(empId!),
    enabled: isEmployee && !!empId,
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => getEmployees({ per_page: 100 }),
    enabled: !isEmployee,
  })

  const checkInMutation = useMutation({
    mutationFn: () => checkIn(empId!),
    onSuccess: () => {
      toast.success('Check-in successful!')
      refetchToday()
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const checkOutMutation = useMutation({
    mutationFn: () => checkOut(empId!),
    onSuccess: () => {
      toast.success('Check-out successful!')
      refetchToday()
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const today = format(new Date(), 'EEEE, d MMMM yyyy')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">{today}</p>
        </div>
      </div>

      {/* Check-in/out card for Employee */}
      {isEmployee && (
        <div className="card p-6 mb-6 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <Clock size={20} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Today's Attendance</h3>
              <p className="text-xs text-gray-400">{today}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Check In</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {todayAtt?.check_in ?? '—'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Check Out</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {todayAtt?.check_out ?? '—'}
              </p>
            </div>
          </div>

          {todayAtt && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
              <AttendanceStatusBadge status={todayAtt.status} />
            </div>
          )}

          <div className="flex gap-3">
            <button
              id="btn-check-in"
              className="btn-primary btn flex-1"
              disabled={!!todayAtt?.check_in || checkInMutation.isPending}
              onClick={() => checkInMutation.mutate()}
            >
              {checkInMutation.isPending ? <Spinner size={16} className="text-white" /> : <LogIn size={16} />}
              Check In
            </button>
            <button
              id="btn-check-out"
              className="btn-outline btn flex-1"
              disabled={!todayAtt?.check_in || !!todayAtt?.check_out || checkOutMutation.isPending}
              onClick={() => checkOutMutation.mutate()}
            >
              {checkOutMutation.isPending ? <Spinner size={16} /> : <LogOut size={16} />}
              Check Out
            </button>
          </div>
        </div>
      )}

      {/* Filter (Admin/Manager) */}
      {!isEmployee && (
        <div className="card p-4 mb-5">
          <div className="flex flex-wrap gap-3">
            <select
              className="select w-52"
              value={params.employee_id ?? ''}
              onChange={e => setParams(p => ({ ...p, employee_id: e.target.value ? Number(e.target.value) : undefined, page: 1 }))}
            >
              <option value="">All Employees</option>
              {employees?.items.map(e => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">From</label>
              <input
                type="date"
                className="input w-40"
                value={params.date_from ?? ''}
                onChange={e => setParams(p => ({ ...p, date_from: e.target.value || undefined, page: 1 }))}
              />
              <label className="text-sm text-gray-600 dark:text-gray-400">To</label>
              <input
                type="date"
                className="input w-40"
                value={params.date_to ?? ''}
                onChange={e => setParams(p => ({ ...p, date_to: e.target.value || undefined, page: 1 }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
        {isEmployee ? 'My Attendance History' : 'Attendance Records'}
      </h2>

      {isLoading ? <TableSkeleton rows={8} cols={5} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {!isEmployee && <th>Employee</th>}
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.length === 0 ? (
                <tr><td colSpan={isEmployee ? 4 : 5}><EmptyState message="No attendance records" /></td></tr>
              ) : data?.items.map(att => (
                <tr key={att.id}>
                  {!isEmployee && (
                    <td className="font-medium">
                      {att.employee?.first_name} {att.employee?.last_name}
                    </td>
                  )}
                  <td>{att.date}</td>
                  <td>{att.check_in ?? '—'}</td>
                  <td>{att.check_out ?? '—'}</td>
                  <td><AttendanceStatusBadge status={att.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={params.page!}
        totalPages={data?.total_pages ?? 1}
        onPageChange={p => setParams(prev => ({ ...prev, page: p }))}
        total={data?.total}
        perPage={params.per_page}
      />
    </div>
  )
}
