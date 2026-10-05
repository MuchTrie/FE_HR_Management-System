import { Sun, Moon, Bell } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  title?: string
}

export default function Header({ title }: HeaderProps) {
  const { toggleTheme, isDark } = useTheme()
  const { user } = useAuth()

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Page title */}
      <div className="flex-1">
        {title && (
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center
                     text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-gray-800
                     transition-all duration-200"
          title={isDark ? 'Switch to Light' : 'Switch to Dark'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification bell */}
        <button className="w-9 h-9 rounded-lg flex items-center justify-center relative
                     text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-gray-800
                     transition-all duration-200">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.employee?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-none">
              {user?.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user?.email}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
