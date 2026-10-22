import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay,
  isSameMonth, startOfMonth, startOfWeek,
} from 'date-fns'
import { getAttendance, getDepartments, getEmployees, getHolidays } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { AttendanceStatusBadge } from '../../components/ui/Badge'
import { EmptyState, TableSkeleton } from '../../components/ui/Loading'
import type { Attendance, AttendanceStatus } from '../../types'

const statusStyles: Record<AttendanceStatus, string> = {
  PRESENT: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40',
  LATE: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40',
  ABSENT: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40',
}

function timeValue(value?: string) {
  if (!value) return '—'
  return format(new Date(value), 'HH:mm')
}

function dayKey(value: Date | string) {
  return typeof value === 'string' ? value.slice(0, 10) : format(value, 'yyyy-MM-dd')
}

export default function AttendanceCalendarPage() {
  const { user } = useAuth()
  const isEmployee = user?.role === 'EMPLOYEE'
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [employeeId, setEmployeeId] = useState<number | undefined>(isEmployee ? user?.employee_id : undefined)
  const [departmentId, setDepartmentId] = useState<number | undefined>()
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const from = format(monthStart, 'yyyy-MM-dd')
  const to = format(monthEnd, 'yyyy-MM-dd')

  const { data: employees } = useQuery({
    queryKey: ['calendar-employees'],
    queryFn: () => getEmployees({ page: 1, per_page: 50, status: 'ACTIVE' }),
    enabled: !isEmployee,
  })
  const { data: departments } = useQuery({
    queryKey: ['calendar-departments'],
    queryFn: getDepartments,
    enabled: !isEmployee,
  })
  const { data: holidays } = useQuery({
    queryKey: ['calendar-holidays', month.getFullYear()],
    queryFn: () => getHolidays(month.getFullYear()),
  })
  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance-calendar', from, to, employeeId, user?.role],
    queryFn: () => getAttendance({ date_from: from, date_to: to, employee_id: employeeId }),
  })

  const departmentEmployeeIds = useMemo(() => {
    if (!departmentId) return undefined
    return new Set((employees?.items ?? []).filter(item => item.department_id === departmentId).map(item => item.id))
  }, [departmentId, employees])

  const visibleAttendance = useMemo(() => {
    if (!departmentEmployeeIds) return attendance?.items ?? []
    return (attendance?.items ?? []).filter(item => departmentEmployeeIds.has(item.employee_id))
  }, [attendance, departmentEmployeeIds])

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, Attendance[]>()
    visibleAttendance.forEach(item => {
      const key = dayKey(item.date)
      map.set(key, [...(map.get(key) ?? []), item])
    })
    return map
  }, [visibleAttendance])
  const holidayByDate = useMemo(() => new Map((holidays ?? []).map(item => [dayKey(item.date), item])), [holidays])
  const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) })
  const selectedAttendance = attendanceByDate.get(dayKey(selectedDate)) ?? []
  const selectedHoliday = holidayByDate.get(dayKey(selectedDate))

  const changeMonth = (offset: number) => {
    const next = addMonths(month, offset)
    setMonth(next)
    setSelectedDate(startOfMonth(next))
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Calendar</h1>
          <p className="page-subtitle">View attendance records and company holidays by month</p>
        </div>
      </div>

      {!isEmployee && (
        <div className="card flex flex-col gap-3 p-4 sm:flex-row">
          <select className="select w-full sm:w-56" value={employeeId ?? ''} onChange={event => setEmployeeId(event.target.value ? Number(event.target.value) : undefined)}>
            <option value="">All Employees</option>
            {employees?.items.map(item => <option key={item.id} value={item.id}>{item.first_name} {item.last_name}</option>)}
          </select>
          <select className="select w-full sm:w-56" value={departmentId ?? ''} onChange={event => setDepartmentId(event.target.value ? Number(event.target.value) : undefined)}>
            <option value="">All Departments</option>
            {departments?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
            <button className="btn btn-ghost btn-sm" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
            <h2 className="font-semibold text-gray-900 dark:text-white">{format(month, 'MMMM yyyy')}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/60">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="p-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:p-3">{day}</div>)}
          </div>
          {isLoading ? <div className="p-4"><TableSkeleton rows={5} cols={7} /></div> : (
            <div className="grid grid-cols-7">
              {calendarDays.map(day => {
                const key = dayKey(day)
                const records = attendanceByDate.get(key) ?? []
                const holiday = holidayByDate.get(key)
                const status = records[0]?.status as AttendanceStatus | undefined
                return (
                  <button key={key} onClick={() => setSelectedDate(day)} className={`min-h-20 border-b border-r border-gray-200 p-2 text-left transition-colors dark:border-gray-800 sm:min-h-24 sm:p-3 ${!isSameMonth(day, month) ? 'bg-gray-50/60 text-gray-300 dark:bg-gray-950/30 dark:text-gray-700' : 'text-gray-700 dark:text-gray-300'} ${isSameDay(day, selectedDate) ? 'ring-2 ring-inset ring-brand-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                    <span className="text-xs font-semibold">{format(day, 'd')}</span>
                    {holiday && <span className="mt-1 block truncate text-[10px] text-purple-600 dark:text-purple-300" title={holiday.name}>{holiday.name}</span>}
                    {status && <span className={`mt-1 block rounded border px-1 py-0.5 text-[9px] font-semibold ${statusStyles[status]}`}>{status}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <aside className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">{format(selectedDate, 'dd MMM yyyy')}</h2>
          </div>
          {selectedHoliday && <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-700 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-200"><MapPin size={15} className="mr-2 inline" />{selectedHoliday.name}</div>}
          {selectedAttendance.length === 0 ? <EmptyState message={selectedHoliday ? 'No attendance record for this holiday' : 'No attendance record for this date'} /> : (
            <div className="space-y-3">
              {selectedAttendance.map(item => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                  {!isEmployee && <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">{item.employee?.first_name} {item.employee?.last_name}</p>}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <span><Clock size={13} className="mr-1 inline" />In: {timeValue(item.check_in)}</span>
                    <span><Clock size={13} className="mr-1 inline" />Out: {timeValue(item.check_out)}</span>
                  </div>
                  <div className="mt-2"><AttendanceStatusBadge status={item.status} /></div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
