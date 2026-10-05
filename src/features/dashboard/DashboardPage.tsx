import { useQuery } from '@tanstack/react-query'
import {
  Users, Building2, Clock, CalendarOff, UserX, UserCheck,
} from 'lucide-react'
import { getDashboardStats, getAttendance, getLeaves } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { StatCardSkeleton, PageLoader } from '../../components/ui/Loading'
import { AttendanceStatusBadge, LeaveStatusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  gradient: string
  subtext?: string
}

function StatCard({ label, value, icon, gradient, subtext }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 ${gradient} shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtext && <p className="text-xs text-white/60 mt-1">{subtext}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => getAttendance({ per_page: 5 }),
  })

  const { data: leavesData } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: () => getLeaves({ status: 'PENDING', per_page: 5 }),
  })

  if (statsLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Employees" value={stats?.total_employees ?? 0}
          icon={<Users size={20} />} gradient="stat-card-red" subtext="Active" />
        <StatCard label="Departments" value={stats?.total_departments ?? 0}
          icon={<Building2 size={20} />} gradient="stat-card-dark" />
        <StatCard label="Present Today" value={stats?.present_today ?? 0}
          icon={<UserCheck size={20} />} gradient="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white" />
        <StatCard label="Absent Today" value={stats?.absent_today ?? 0}
          icon={<UserX size={20} />} gradient="stat-card-rose" />
        <StatCard label="Pending Leave" value={stats?.pending_leaves ?? 0}
          icon={<CalendarOff size={20} />} gradient="bg-gradient-to-br from-amber-600 to-amber-800 text-white" />
        <StatCard label="Total Users" value={stats?.total_users ?? 0}
          icon={<Clock size={20} />} gradient="stat-card-slate" />
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Attendance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData?.items.slice(0, 5).map(att => (
                  <tr key={att.id}>
                    <td className="font-medium">
                      {att.employee?.first_name} {att.employee?.last_name}
                    </td>
                    <td>{att.date}</td>
                    <td>{att.check_in ?? '—'}</td>
                    <td><AttendanceStatusBadge status={att.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Pending Leave Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leavesData?.items.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-6">No pending requests</td></tr>
                ) : leavesData?.items.map(lr => (
                  <tr key={lr.id}>
                    <td className="font-medium">{lr.employee?.first_name} {lr.employee?.last_name}</td>
                    <td>{lr.leave_type}</td>
                    <td className="text-xs">{lr.start_date} ~ {lr.end_date}</td>
                    <td><LeaveStatusBadge status={lr.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Employee Dashboard ───────────────────────────────────────────────────────
function EmployeeDashboard() {
  const { user } = useAuth()
  const empId = user?.employee_id

  const { data: todayAtt, isLoading } = useQuery({
    queryKey: ['my-attendance-today', empId],
    queryFn: () => getAttendance({ employee_id: empId, per_page: 7 }),
    enabled: !!empId,
  })

  const { data: myLeaves } = useQuery({
    queryKey: ['my-leaves', empId],
    queryFn: () => getLeaves({ employee_id: empId, per_page: 5 }),
    enabled: !!empId,
  })

  const today = todayAtt?.items.find(a => a.date === new Date().toISOString().split('T')[0])

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Today's Attendance</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Check In</span>
              <span className="font-semibold text-gray-900 dark:text-white">{today?.check_in ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Check Out</span>
              <span className="font-semibold text-gray-900 dark:text-white">{today?.check_out ?? '—'}</span>
            </div>
            {today && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <AttendanceStatusBadge status={today.status} />
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">My Leave Summary</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
              <span className="font-bold text-amber-600">{myLeaves?.items.filter(l => l.status === 'PENDING').length ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
              <span className="font-bold text-emerald-600">{myLeaves?.items.filter(l => l.status === 'APPROVED').length ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Rejected</span>
              <span className="font-bold text-red-600">{myLeaves?.items.filter(l => l.status === 'REJECTED').length ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Profile</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-lg">
              {user?.employee?.first_name?.[0] ?? 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {user?.employee?.first_name} {user?.employee?.last_name}
              </p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {todayAtt?.items.map(att => (
                <tr key={att.id}>
                  <td>{att.date}</td>
                  <td>{att.check_in ?? '—'}</td>
                  <td>{att.check_out ?? '—'}</td>
                  <td><AttendanceStatusBadge status={att.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const today = format(new Date(), 'EEEE, d MMMM yyyy')

  return (
    <div>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Role: <span className="font-semibold text-brand-600 dark:text-brand-400">{user?.role}</span>
        </div>
      </div>

      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') ? (
        <AdminDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  )
}
import type React from 'react'
