import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle, BarChart3, Building2, CalendarDays, CheckCircle,
  Clock, RefreshCw, UserCheck, UserX, Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { getDashboardStats, getAttendance, getLeaves } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { StatCardSkeleton, PageLoader } from '../../components/ui/Loading'
import { AttendanceStatusBadge } from '../../components/ui/Badge'
import type { DashboardStats } from '../../types'

const presets: Array<{ value: DashboardStats['preset']; label: string }> = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'this_year', label: 'This year' },
]

const colors = ['bg-brand-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500']

function StatCard({ label, value, icon, gradient, subtext }: {
  label: string
  value: number | string
  icon: React.ReactNode
  gradient: string
  subtext?: string
}) {
  return (
    <div className={`rounded-xl p-5 shadow-sm ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/70">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtext && <p className="mt-1 text-xs text-white/60">{subtext}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">{icon}</div>
      </div>
    </div>
  )
}

function PeriodFilter({ preset, onChange }: { preset: DashboardStats['preset']; onChange: (value: DashboardStats['preset']) => void }) {
  return (
    <select className="select w-full sm:w-44" value={preset} onChange={event => onChange(event.target.value as DashboardStats['preset'])}>
      {presets.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  )
}

function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const departments = Object.entries(stats.department_counts)
  const attendance = Object.entries(stats.attendance_status_counts)
  const months = Object.entries(stats.leave_monthly).sort(([a], [b]) => a.localeCompare(b))
  const maxDepartment = Math.max(...departments.map(([, value]) => value), 1)
  const maxMonth = Math.max(...months.map(([, value]) => value), 1)

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-brand-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Employees by department</h3>
        </div>
        <div className="space-y-3">
          {departments.length === 0 ? <p className="text-sm text-gray-400">No department data for this scope.</p> : departments.map(([name, value], index) => (
            <div key={name}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-300">{name}</span><span className="font-semibold text-gray-900 dark:text-white">{value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800"><div className={`h-2 rounded-full ${colors[index % colors.length]}`} style={{ width: `${(value / maxDepartment) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Attendance status</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {attendance.length === 0 ? <p className="text-sm text-gray-400">No attendance data for this period.</p> : attendance.map(([status, value]) => (
            <div key={status} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
              <p className="text-xs uppercase text-gray-400">{status}</p><p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">Late attendance: <strong>{stats.late_attendance}</strong></p>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users size={18} className="text-violet-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Employee status</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(stats.employee_status_counts).map(([status, value]) => (
            <div key={status} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
              <p className="text-xs uppercase text-gray-400">{status}</p><p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 xl:col-span-2">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={18} className="text-amber-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Leave requests by month</h3>
        </div>
        <div className="flex min-h-32 items-end gap-3 overflow-x-auto pb-1">
          {months.length === 0 ? <p className="self-center text-sm text-gray-400">No leave data for this period.</p> : months.map(([month, value]) => (
            <div key={month} className="flex min-w-14 flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{value}</span>
              <div className="flex h-24 w-full items-end rounded bg-gray-100 dark:bg-gray-800"><div className="w-full rounded bg-amber-500" style={{ height: `${(value / maxMonth) * 100}%` }} /></div>
              <span className="text-[10px] text-gray-400">{month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DashboardContent({ role }: { role: string }) {
  const [preset, setPreset] = useState<DashboardStats['preset']>('this_month')
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-stats', preset, role],
    queryFn: () => getDashboardStats(preset),
  })

  const title = role === 'ADMIN' ? 'Company overview' : role === 'MANAGER' ? 'Team overview' : 'My overview'
  if (isLoading) return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[...Array(4)].map((_, index) => <StatCardSkeleton key={index} />)}</div>
  if (isError || !stats) return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <AlertCircle className="text-red-500" /><p className="text-sm text-gray-500">Dashboard statistics could not be loaded.</p>
      <button className="btn btn-outline" onClick={() => refetch()}><RefreshCw size={15} /> Try again</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2><p className="text-sm text-gray-500">{stats.period_start} to {stats.period_end}</p></div>
        <PeriodFilter preset={preset} onChange={setPreset} />
      </div>
      {role === 'EMPLOYEE' ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="Attendance records" value={Object.values(stats.attendance_status_counts).reduce((sum, value) => sum + value, 0)} icon={<CalendarDays size={20} />} gradient="stat-card-dark" subtext="Selected period" />
          <StatCard label="Present today" value={stats.present_today} icon={<UserCheck size={20} />} gradient="bg-gradient-to-br from-emerald-600 to-emerald-800" />
          <StatCard label="Late attendance" value={stats.late_attendance} icon={<Clock size={20} />} gradient="stat-card-slate" />
          <StatCard label="Absent today" value={stats.absent_today} icon={<UserX size={20} />} gradient="stat-card-rose" />
          <StatCard label="Pending leave" value={stats.leave_status_counts.PENDING ?? 0} icon={<CalendarDays size={20} />} gradient="bg-gradient-to-br from-amber-600 to-amber-800" />
          <StatCard label="Approved leave" value={stats.leave_status_counts.APPROVED ?? 0} icon={<CheckCircle size={20} />} gradient="stat-card-red" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Active employees" value={stats.total_employees} icon={<Users size={20} />} gradient="stat-card-red" subtext={role === 'MANAGER' ? 'Direct reports' : 'Company-wide'} />
          <StatCard label="Departments" value={stats.total_departments} icon={<Building2 size={20} />} gradient="stat-card-dark" />
          <StatCard label="Present today" value={stats.present_today} icon={<UserCheck size={20} />} gradient="bg-gradient-to-br from-emerald-600 to-emerald-800" />
          <StatCard label="Absent today" value={stats.absent_today} icon={<UserX size={20} />} gradient="stat-card-rose" />
          <StatCard label="Pending leave" value={stats.pending_leaves} icon={<CalendarDays size={20} />} gradient="bg-gradient-to-br from-amber-600 to-amber-800" />
          <StatCard label="Late attendance" value={stats.late_attendance} icon={<Clock size={20} />} gradient="stat-card-slate" />
        </div>
      )}
      <DashboardCharts stats={stats} />
    </div>
  )
}

function EmployeeRecentData() {
  const { user } = useAuth()
  const empId = user?.employee_id
  const { data: attendance, isLoading } = useQuery({ queryKey: ['my-attendance-dashboard', empId], queryFn: () => getAttendance({ employee_id: empId, per_page: 7 }), enabled: !!empId })
  const { data: leaves } = useQuery({ queryKey: ['my-leaves-dashboard', empId], queryFn: () => getLeaves({ employee_id: empId, per_page: 5 }), enabled: !!empId })
  if (isLoading) return <PageLoader />
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">My leave summary</p><div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-xl font-bold text-amber-600">{leaves?.items.filter(item => item.status === 'PENDING').length ?? 0}</p><p className="text-xs text-gray-500">Pending</p></div><div><p className="text-xl font-bold text-emerald-600">{leaves?.items.filter(item => item.status === 'APPROVED').length ?? 0}</p><p className="text-xs text-gray-500">Approved</p></div><div><p className="text-xl font-bold text-red-600">{leaves?.items.filter(item => item.status === 'REJECTED').length ?? 0}</p><p className="text-xs text-gray-500">Rejected</p></div></div></div>
        <div className="card p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Profile</p><p className="font-semibold text-gray-900 dark:text-white">{user?.employee?.first_name} {user?.employee?.last_name}</p><p className="text-xs text-gray-500">{user?.role}</p></div>
      </div>
      <div className="card overflow-hidden"><div className="border-b border-gray-200 p-4 dark:border-gray-800"><h3 className="font-semibold text-gray-900 dark:text-white">Recent attendance</h3></div><div className="overflow-x-auto"><table className="table"><thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Status</th></tr></thead><tbody>{attendance?.items.map(item => <tr key={item.id}><td>{item.date}</td><td>{item.check_in ?? '—'}</td><td>{item.check_out ?? '—'}</td><td><AttendanceStatusBadge status={item.status} /></td></tr>)}</tbody></table></div></div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const today = format(new Date(), 'EEEE, d MMMM yyyy')
  const role = user?.role ?? 'EMPLOYEE'
  return <div><div className="page-header mb-6"><div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">{today}</p></div><div className="text-sm text-gray-500">Role: <span className="font-semibold text-brand-600">{role}</span></div></div><DashboardContent role={role} />{role === 'EMPLOYEE' && <EmployeeRecentData />}</div>
}
