import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Calendar, Building2, Briefcase } from 'lucide-react'
import { getEmployee } from '../../lib/api'
import { PageLoader } from '../../components/ui/Loading'
import { EmployeeStatusBadge } from '../../components/ui/Badge'

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => getEmployee(Number(id)),
  })

  if (isLoading) return <PageLoader />
  if (!employee) return <div className="text-gray-400">Employee not found</div>

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn-ghost btn" onClick={() => navigate('/employees')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Employee Detail</h1>
            <p className="page-subtitle">#{employee.employee_number}</p>
          </div>
        </div>
        <Link to={`/employees/${id}/edit`} className="btn-primary btn">
          <Pencil size={15} />
          Edit Employee
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 max-w-5xl">
        {/* Profile card */}
        <div className="card p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-md">
            {employee.first_name[0]}{employee.last_name[0]}
          </div>
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">
            {employee.first_name} {employee.last_name}
          </h2>
          <p className="text-sm text-gray-400 mb-3">{employee.position?.name ?? '—'}</p>
          <EmployeeStatusBadge status={employee.status} />

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Employee #</span>
              <span className="font-mono font-medium">{employee.employee_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Gender</span>
              <span className="font-medium">{employee.gender}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Join Date</span>
              <span className="font-medium">{employee.join_date}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
            <div className="space-y-4">
              <InfoRow icon={<Mail size={15} />} label="Email" value={employee.email} />
              <InfoRow icon={<Phone size={15} />} label="Phone" value={employee.phone} />
              <InfoRow icon={<MapPin size={15} />} label="Address" value={employee.address} />
              <InfoRow icon={<Calendar size={15} />} label="Date of Birth" value={employee.date_of_birth} />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Organization</h3>
            <div className="space-y-4">
              <InfoRow icon={<Building2 size={15} />} label="Department" value={employee.department?.name ?? '—'} />
              <InfoRow icon={<Briefcase size={15} />} label="Position" value={employee.position?.name ?? '—'} />
              {employee.manager && (
                <InfoRow
                  icon={<span className="text-xs">👤</span>}
                  label="Manager"
                  value={`${employee.manager.first_name} ${employee.manager.last_name}`}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
import type React from 'react'
