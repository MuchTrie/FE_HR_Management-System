import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, Briefcase,
  Clock, CalendarOff, UserCog, LogOut, Shield,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface NavItemDef {
  label: string
  to: string
  icon: React.ReactNode
  roles?: ('ADMIN' | 'MANAGER' | 'EMPLOYEE')[]
}

const navItems: NavItemDef[] = [
  { label: 'Dashboard',   to: '/dashboard',   icon: <LayoutDashboard size={18} /> },
  { label: 'Employees',   to: '/employees',   icon: <Users size={18} />,         roles: ['ADMIN', 'MANAGER'] },
  { label: 'Departments', to: '/departments', icon: <Building2 size={18} />,     roles: ['ADMIN'] },
  { label: 'Positions',   to: '/positions',   icon: <Briefcase size={18} />,     roles: ['ADMIN'] },
  { label: 'Attendance',  to: '/attendance',  icon: <Clock size={18} /> },
  { label: 'Leave',       to: '/leaves',      icon: <CalendarOff size={18} /> },
  { label: 'Users',       to: '/users',       icon: <UserCog size={18} />,       roles: ['ADMIN'] },
]

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter(item =>
    !item.roles || item.roles.some(r => hasRole(r))
  )

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shadow-sm">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900 dark:text-white tracking-wide">SecureHR</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">HR System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-hidden">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">
          Menu
        </p>
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile bottom */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.employee?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
              {user?.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user?.email}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{user?.role}</p>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="nav-item w-full mt-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
import type React from 'react'
