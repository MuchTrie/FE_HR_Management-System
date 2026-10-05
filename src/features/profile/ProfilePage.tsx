import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Mail, Shield, Building2, Briefcase, Calendar, Phone, MapPin } from 'lucide-react'
import { RoleBadge, EmployeeStatusBadge } from '../../components/ui/Badge'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const emp = user?.employee

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Your account information</p>
        </div>
      </div>

      <div className="max-w-3xl grid gap-6">
        {/* Profile card */}
        <div className="card p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-3xl font-bold shadow-md flex-shrink-0">
              {emp?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {emp ? `${emp.first_name} ${emp.last_name}` : user?.email}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <RoleBadge role={user?.role ?? ''} />
                {emp && <EmployeeStatusBadge status={emp.status} />}
                {emp && <span className="text-xs text-gray-400 font-mono">#{emp.employee_number}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield size={16} className="text-brand-600" /> Account
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={15} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={15} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Role</p>
                <p className="font-medium text-gray-900 dark:text-white">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Info */}
        {emp && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Employee Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail size={15} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Personal Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{emp.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={15} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{emp.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 size={15} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Department</p>
                  <p className="font-medium text-gray-900 dark:text-white">{emp.department?.name ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase size={15} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Position</p>
                  <p className="font-medium text-gray-900 dark:text-white">{emp.position?.name ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={15} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Join Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{emp.join_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={15} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="font-medium text-gray-900 dark:text-white">{emp.address}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleLogout} className="btn-danger btn w-fit">
          Logout
        </button>
      </div>
    </div>
  )
}
