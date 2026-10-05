import {
  createBrowserRouter, RouterProvider, Navigate,
} from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import LoginPage from '../features/auth/LoginPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import EmployeeListPage from '../features/employees/EmployeeListPage'
import EmployeeFormPage from '../features/employees/EmployeeFormPage'
import EmployeeDetailPage from '../features/employees/EmployeeDetailPage'
import DepartmentPage from '../features/departments/DepartmentPage'
import PositionPage from '../features/positions/PositionPage'
import AttendancePage from '../features/attendance/AttendancePage'
import LeavePage from '../features/leave/LeavePage'
import UsersPage from '../features/users/UsersPage'
import ProfilePage from '../features/profile/ProfilePage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',             element: <DashboardPage /> },
      { path: 'employees',             element: <EmployeeListPage /> },
      { path: 'employees/new',         element: <EmployeeFormPage /> },
      { path: 'employees/:id',         element: <EmployeeDetailPage /> },
      { path: 'employees/:id/edit',    element: <EmployeeFormPage /> },
      { path: 'departments',           element: <DepartmentPage /> },
      { path: 'positions',             element: <PositionPage /> },
      { path: 'attendance',            element: <AttendancePage /> },
      { path: 'leaves',                element: <LeavePage /> },
      { path: 'users',                 element: <UsersPage /> },
      { path: 'profile',               element: <ProfilePage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
