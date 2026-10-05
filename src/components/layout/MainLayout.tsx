import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../contexts/AuthContext'

export default function MainLayout() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main content area */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        <Header />
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-950 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
