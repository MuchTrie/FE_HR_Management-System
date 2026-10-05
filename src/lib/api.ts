import apiClient from './axios'
import type {
  ApiResponse, Attendance, AttendanceQueryParams, AuthUser, CreateDepartmentRequest,
  CreateEmployeeRequest, CreateLeaveRequest, CreatePositionRequest, DashboardStats,
  Department, Employee, EmployeeQueryParams, LeaveRequest, LeaveQueryParams, PaginatedResponse,
  Position, User,
} from '../types'

type LoginResult = { token: string; refresh_token: string; user: AuthUser }
type ApiEnvelope<T> = ApiResponse<T>

const unwrap = <T>(response: { data: ApiEnvelope<T> }): T => response.data.data

export async function login(email: string, password: string): Promise<LoginResult> {
  return unwrap(await apiClient.post<ApiEnvelope<LoginResult>>('/auth/login', { email, password }))
}

export async function refresh(refresh_token: string): Promise<LoginResult> {
  return unwrap(await apiClient.post<ApiEnvelope<LoginResult>>('/auth/refresh', { refresh_token }))
}

export async function logout(refresh_token: string | null): Promise<void> {
  await apiClient.post('/auth/logout', refresh_token ? { refresh_token } : {})
}

export async function getMe(): Promise<AuthUser> {
  return unwrap(await apiClient.get<ApiEnvelope<AuthUser>>('/auth/me'))
}

export async function getEmployees(params?: EmployeeQueryParams): Promise<PaginatedResponse<Employee>['data']> {
  return unwrap(await apiClient.get<ApiEnvelope<PaginatedResponse<Employee>['data']>>('/employees', { params }))
}

export async function getEmployee(id: number): Promise<Employee> {
  return unwrap(await apiClient.get<ApiEnvelope<Employee>>(`/employees/${id}`))
}

export async function createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
  return unwrap(await apiClient.post<ApiEnvelope<Employee>>('/employees', data))
}

export async function updateEmployee(id: number, data: Partial<CreateEmployeeRequest>): Promise<Employee> {
  return unwrap(await apiClient.put<ApiEnvelope<Employee>>(`/employees/${id}`, data))
}

export async function deleteEmployee(id: number): Promise<void> {
  await apiClient.delete(`/employees/${id}`)
}

export async function getDepartments(): Promise<Department[]> {
  return unwrap(await apiClient.get<ApiEnvelope<Department[]>>('/departments'))
}

export async function getDepartment(id: number): Promise<Department> {
  return unwrap(await apiClient.get<ApiEnvelope<Department>>(`/departments/${id}`))
}

export async function createDepartment(data: CreateDepartmentRequest): Promise<Department> {
  return unwrap(await apiClient.post<ApiEnvelope<Department>>('/departments', data))
}

export async function updateDepartment(id: number, data: Partial<CreateDepartmentRequest>): Promise<Department> {
  return unwrap(await apiClient.put<ApiEnvelope<Department>>(`/departments/${id}`, data))
}

export async function deleteDepartment(id: number): Promise<void> {
  await apiClient.delete(`/departments/${id}`)
}

export async function getPositions(): Promise<Position[]> {
  return unwrap(await apiClient.get<ApiEnvelope<Position[]>>('/positions'))
}

export async function getPosition(id: number): Promise<Position> {
  return unwrap(await apiClient.get<ApiEnvelope<Position>>(`/positions/${id}`))
}

export async function createPosition(data: CreatePositionRequest): Promise<Position> {
  return unwrap(await apiClient.post<ApiEnvelope<Position>>('/positions', data))
}

export async function updatePosition(id: number, data: Partial<CreatePositionRequest>): Promise<Position> {
  return unwrap(await apiClient.put<ApiEnvelope<Position>>(`/positions/${id}`, data))
}

export async function deletePosition(id: number): Promise<void> {
  await apiClient.delete(`/positions/${id}`)
}

export async function getAttendance(params?: AttendanceQueryParams): Promise<PaginatedResponse<Attendance>['data']> {
  const items = unwrap(await apiClient.get<ApiEnvelope<Attendance[]>>('/attendance', { params }))
  return { items, total: items.length, page: params?.page ?? 1, per_page: params?.per_page ?? items.length, total_pages: 1 }
}

export async function checkIn(_employeeId?: number): Promise<Attendance> {
  return unwrap(await apiClient.post<ApiEnvelope<Attendance>>('/attendance/check-in'))
}

export async function checkOut(_employeeId?: number): Promise<Attendance> {
  return unwrap(await apiClient.post<ApiEnvelope<Attendance>>('/attendance/check-out'))
}

export async function getTodayAttendance(employeeId: number): Promise<Attendance | null> {
  const values = await getAttendance({ employee_id: employeeId, date_from: new Date().toISOString().slice(0, 10), date_to: new Date().toISOString().slice(0, 10) })
  return values.items[0] ?? null
}

export async function getLeaves(params?: LeaveQueryParams): Promise<PaginatedResponse<LeaveRequest>['data']> {
  const items = unwrap(await apiClient.get<ApiEnvelope<LeaveRequest[]>>('/leaves', { params }))
  return { items, total: items.length, page: params?.page ?? 1, per_page: params?.per_page ?? items.length, total_pages: 1 }
}

export async function createLeave(data: CreateLeaveRequest, _employeeId?: number): Promise<LeaveRequest> {
  return unwrap(await apiClient.post<ApiEnvelope<LeaveRequest>>('/leaves', data))
}

export async function approveLeave(id: number, _approverId?: number): Promise<LeaveRequest> {
  return unwrap(await apiClient.post<ApiEnvelope<LeaveRequest>>(`/leaves/${id}/approve`))
}

export async function rejectLeave(id: number, _approverId?: number): Promise<LeaveRequest> {
  return unwrap(await apiClient.post<ApiEnvelope<LeaveRequest>>(`/leaves/${id}/reject`))
}

export async function cancelLeave(id: number): Promise<LeaveRequest> {
  return unwrap(await apiClient.post<ApiEnvelope<LeaveRequest>>(`/leaves/${id}/cancel`))
}

export async function getUsers(): Promise<User[]> {
  return unwrap(await apiClient.get<ApiEnvelope<User[]>>('/users'))
}

export async function toggleUserActive(id: number): Promise<User> {
  return unwrap(await apiClient.patch<ApiEnvelope<User>>(`/users/${id}/status`))
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return unwrap(await apiClient.get<ApiEnvelope<DashboardStats>>('/dashboard/stats'))
}
