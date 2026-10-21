import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle, BarChart3, Building2, CalendarDays, CheckCircle,
  Clock, RefreshCw, UserCheck, UserX,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { getDashboardStats, getAttendance } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { StatCardSkeleton, PageLoader } from '../../components/ui/Loading'
import { AttendanceStatusBadge } from '../../components/ui/Badge'
import { Link } from 'react-router-dom'
import type { DashboardStats } from '../../types'

const presets: Array<{ value: DashboardStats['preset']; label: string }> = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'this_year', label: 'This year' },
]

function formatTime(isoString: string | null | undefined) {
  if (!isoString) return '—'
  try {
    const date = parseISO(isoString)
    return format(date, 'HH:mm')
  } catch {
    return '—'
  }
}

function StatCard({ label, value, icon, subtext }: {
  label: string
  value: number | string
  icon: React.ReactNode
  subtext?: string
}) {
  return (
    <div className="flex h-full min-h-[148px] flex-col justify-between rounded-12 border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-gray-800 dark:bg-gray-900/50">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-8 bg-gray-100 p-1.5 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {icon}
          </div>
          <p className="min-h-8 text-xs font-semibold uppercase leading-4 tracking-wider text-gray-400">{label}</p>
        </div>
        <p className="text-4xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
        {subtext && <p className="mt-1 text-sm text-gray-500">{subtext}</p>}
      </div>
    </div>
  )
}

function AdminKpiCard({ label, value, subtext, linkTo }: {
  label: string
  value: number | string
  subtext?: string
  linkTo?: string
}) {
  const content = (
    <div className="flex h-full min-h-[148px] flex-col justify-between rounded-12 border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-gray-800 dark:bg-gray-900/50">
      <div>
        <p className="mb-1 min-h-8 text-xs font-semibold uppercase leading-4 tracking-wider text-gray-400">{label}</p>
        <p className="text-4xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
        {subtext && <p className="mt-1 text-sm text-gray-500">{subtext}</p>}
      </div>
    </div>
  )

  if (linkTo) {
    return <Link to={linkTo} className="block h-full hover:text-brand-600">{content}</Link>
  }
  return <div className="h-full">{content}</div>
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
  const maxDepartment = Math.max(...departments.map(([, value]) => value), 1)

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Building2 size={18} className="text-brand-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Employees by department</h3>
        </div>
        <div className="space-y-3">
          {departments.length === 0 ? <p className="text-sm text-gray-400">No department data for this scope.</p> : departments.map(([name, value]) => (
            <div key={name}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-300">{name}</span><span className="font-semibold text-gray-900 dark:text-white">{value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${(value / maxDepartment) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex items-center gap-2">
          <BarChart3 size={18} className="text-brand-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Attendance status</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {attendance.length === 0 ? <p className="text-sm text-gray-400">No attendance data for this period.</p> : attendance.map(([status, value]) => (
            <div key={status} className="rounded-8 bg-gray-50 p-3 dark:bg-gray-800/40">
              <p className="text-xs uppercase text-gray-400">{status}</p><p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">Late attendance: <strong className="text-gray-700 dark:text-gray-300">{stats.late_attendance}</strong></p>
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
        <div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2><p className="text-sm text-gray-500">{stats.period_start} — {stats.period_end}</p></div>
        <PeriodFilter preset={preset} onChange={setPreset} />
      </div>
      {role === 'EMPLOYEE' ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard label="Attendance records" value={Object.values(stats.attendance_status_counts).reduce((sum, value) => sum + value, 0)} icon={<CalendarDays size={18} />} subtext="Selected period" />
          <StatCard label="Present today" value={stats.present_today} icon={<UserCheck size={18} />} subtext="At work right now" />
          <StatCard label="Late attendance" value={stats.late_attendance} icon={<Clock size={18} />} subtext="Late arrivals" />
          <StatCard label="Absent today" value={stats.absent_today} icon={<UserX size={18} />} subtext="Not at work" />
          <StatCard label="Pending leave" value={stats.leave_status_counts.PENDING ?? 0} icon={<CalendarDays size={18} />} subtext="Pending approval" />
          <StatCard label="Approved leave" value={stats.leave_status_counts.APPROVED ?? 0} icon={<CheckCircle size={18} />} subtext="Approved requests" />
        </div>
      ) : (
        <div className="grid items-stretch grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <AdminKpiCard label="Active employees" value={stats.total_employees} subtext={role === 'MANAGER' ? 'Direct reports' : 'Company-wide'} linkTo="/employees" />
          <AdminKpiCard label="Departments" value={stats.total_departments} subtext="Active teams" />
          <AdminKpiCard label="Present today" value={stats.present_today} subtext="At work" />
          <AdminKpiCard label="Absent today" value={stats.absent_today} subtext="Not at work" />
          <AdminKpiCard label="Pending leave" value={stats.pending_leaves} subtext="Review required" linkTo="/leaves/pending" />
          <AdminKpiCard label="Late attendance" value={stats.late_attendance} subtext="Late arrivals" />
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
  if (isLoading) return <PageLoader />

  return (
    <>
      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table hover">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance?.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-sm text-gray-500">No attendance records found</td>
                </tr>
              ) : attendance?.items.map(item => (
                <tr key={item.id}>
                  <td className="text-sm">{format(parseISO(item.date), 'dd MMM yyyy')}</td>
                  <td className="font-mono text-sm">{formatTime(item.check_in)}</td>
                  <td className="font-mono text-sm">{formatTime(item.check_out)}</td>
                  <td><AttendanceStatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const today = format(new Date(), 'EEEE, d MMMM yyyy')
  const role = user?.role ?? 'EMPLOYEE'
  return (
    <div>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <div className="text-sm text-gray-500">
          Role: <span className="font-semibold text-brand-600">{role}</span>
        </div>
      </div>
      <DashboardContent role={role} />
      {role === 'EMPLOYEE' && (
        <div className="mt-6">
          <EmployeeRecentData />
        </div>
      )}
    </div>
  )
}
