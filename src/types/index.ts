// ─── Role & User ────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'

export interface AuthUser {
  id: number
  email: string
  role: Role
  employee?: Employee
  employee_id?: number
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  data: {
    token: string
    user: AuthUser
  }
}

// ─── Employee ────────────────────────────────────────────────────────────────
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'RESIGNED'
export type Gender = 'MALE' | 'FEMALE'

export interface Employee {
  id: number
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  date_of_birth: string
  gender: Gender
  department_id: number
  department?: Department
  position_id: number
  position?: Position
  manager_id?: number
  manager?: Employee
  join_date: string
  status: EmployeeStatus
  created_at: string
  updated_at: string
}

export interface CreateEmployeeRequest {
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  date_of_birth: string
  gender: Gender
  department_id: number
  position_id: number
  manager_id?: number
  join_date: string
  status: EmployeeStatus
}

// ─── Department ──────────────────────────────────────────────────────────────
export interface Department {
  id: number
  name: string
  description: string
  manager_id?: number
  manager?: Employee
  employee_count?: number
  created_at: string
  updated_at: string
}

export interface CreateDepartmentRequest {
  name: string
  description: string
  manager_id?: number
}

// ─── Position ────────────────────────────────────────────────────────────────
export interface Position {
  id: number
  name: string
  description: string
  level: number
  created_at: string
  updated_at: string
}

export interface CreatePositionRequest {
  name: string
  description: string
  level: number
}

// ─── Attendance ──────────────────────────────────────────────────────────────
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT'

export interface Attendance {
  id: number
  employee_id: number
  employee?: Employee
  date: string
  check_in?: string
  check_out?: string
  status: AttendanceStatus
  created_at: string
  updated_at: string
}

// ─── Leave ───────────────────────────────────────────────────────────────────
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type LeaveType = 'ANNUAL' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'EMERGENCY'

export interface LeaveRequest {
  id: number
  employee_id: number
  employee?: Employee
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  approved_by?: number
  approver?: Employee
  approved_at?: string
  rejection_reason?: string
  cancelled_at?: string
  approval_level: number
  required_levels: number
  created_at: string
  updated_at: string
}

export interface CreateLeaveRequest {
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
}

export interface LeaveBalance {
  leave_type: LeaveType
  quota: number
  used: number
  remaining: number
  year: number
}

export interface LeavePolicy {
  id: number
  leave_type: LeaveType
  annual_quota_days: number
  max_consecutive_days: number
  allow_weekend: boolean
  required_approval_levels: number
}

export interface CompanyHoliday {
  id: number
  date: string
  name: string
}

export interface LeaveStatusHistory {
  id: number
  leave_id: number
  from_status: LeaveStatus
  to_status: LeaveStatus
  changed_by: number
  reason?: string
  created_at: string
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  employee_id: number
  employee?: Employee
  email: string
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_employees: number
  total_departments: number
  present_today: number
  pending_leaves: number
  absent_today: number
  total_users: number
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface EmployeeQueryParams {
  page?: number
  per_page?: number
  search?: string
  department_id?: number
  position_id?: number
  gender?: Gender
  status?: EmployeeStatus
  join_date_from?: string
  join_date_to?: string
  sort_by?: EmployeeSortField
  sort_order?: SortOrder
}

export type EmployeeSortField =
  | 'id' | 'employee_number' | 'first_name' | 'last_name' | 'email'
  | 'phone' | 'date_of_birth' | 'gender' | 'department_id'
  | 'position_id' | 'manager_id' | 'join_date' | 'status'
  | 'created_at' | 'updated_at'
export type SortOrder = 'ASC' | 'DESC'

export interface AttendanceQueryParams {
  page?: number
  per_page?: number
  employee_id?: number
  date_from?: string
  date_to?: string
}

export interface LeaveQueryParams {
  page?: number
  per_page?: number
  employee_id?: number
  status?: LeaveStatus
}
