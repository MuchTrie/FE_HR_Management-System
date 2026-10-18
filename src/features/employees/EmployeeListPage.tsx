import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Eye, SlidersHorizontal, X } from 'lucide-react'
import {
  getEmployees, deleteEmployee,
  getDepartments, getPositions,
} from '../../lib/api'
import type { EmployeeQueryParams, EmployeeSortField, EmployeeStatus, Gender, SortOrder } from '../../types'
import { EmployeeStatusBadge } from '../../components/ui/Badge'
import { TableSkeleton, EmptyState } from '../../components/ui/Loading'
import { ConfirmModal } from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

const sortOptions: { value: EmployeeSortField; label: string }[] = [
  { value: 'id', label: 'ID' },
  { value: 'employee_number', label: 'Employee number' },
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date_of_birth', label: 'Date of birth' },
  { value: 'gender', label: 'Gender' },
  { value: 'department_id', label: 'Department' },
  { value: 'position_id', label: 'Position' },
  { value: 'manager_id', label: 'Manager' },
  { value: 'join_date', label: 'Join date' },
  { value: 'status', label: 'Status' },
  { value: 'created_at', label: 'Created date' },
  { value: 'updated_at', label: 'Updated date' },
]

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function EmployeeListPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, hasRole } = useAuth()
  const canManageEmployees = hasRole('ADMIN')
  const [params, setParams] = useState<EmployeeQueryParams>({
    page: 1, per_page: 10, status: 'ACTIVE', sort_by: 'first_name', sort_order: 'ASC',
  })
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setParams(previous => ({ ...previous, search: search.trim() || undefined, page: 1 }))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['employees', params],
    queryFn: () => getEmployees(params),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: getPositions,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      toast.success('Employee deleted')
      qc.invalidateQueries({ queryKey: ['employees'] })
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete'),
  })

  const hasFilters = Boolean(
    search || params.department_id || params.position_id || params.gender ||
    params.join_date_from || params.join_date_to || params.status !== 'ACTIVE' ||
    params.sort_by !== 'first_name' || params.sort_order !== 'ASC',
  )

  const clearFilters = () => {
    setSearch('')
    setParams({
      page: 1, per_page: params.per_page, status: 'ACTIVE',
      sort_by: 'first_name', sort_order: 'ASC',
    })
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Employees</h1>
            {data && <span className="badge badge-gray">{data.total}</span>}
          </div>
          <p className="page-subtitle">
            {user?.role === 'ADMIN' ? 'Manage all employee records' :
              user?.role === 'MANAGER' ? 'Manage direct report records' : 'View your employee record'}
          </p>
        </div>
          {canManageEmployees && <button
            id="btn-add-employee"
          className="btn-primary btn"
          onClick={() => navigate('/employees/new')}
        >
          <Plus size={16} />
          Add Employee
        </button>}
      </div>

      <section className="card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-brand-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Filter employees</h2>
          </div>
          {hasFilters && (
            <button type="button" className="btn-ghost btn btn-sm" onClick={clearFilters}>
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="employee-search"
              type="text"
              placeholder="Cari nama, email, nomor..."
              className="input pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            id="filter-department"
            className="select w-full"
            value={params.department_id ?? ''}
            onChange={e => setParams(p => ({ ...p, department_id: e.target.value ? Number(e.target.value) : undefined, page: 1 }))}
          >
            <option value="">All departments</option>
            {departments?.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            id="filter-position"
            className="select w-full"
            value={params.position_id ?? ''}
            onChange={e => setParams(p => ({ ...p, position_id: e.target.value ? Number(e.target.value) : undefined, page: 1 }))}
          >
            <option value="">All positions</option>
            {positions?.map(position => (
              <option key={position.id} value={position.id}>{position.name}</option>
            ))}
          </select>
          <select
            id="filter-gender"
            className="select w-full"
            value={params.gender ?? ''}
            onChange={e => setParams(p => ({ ...p, gender: (e.target.value as Gender) || undefined, page: 1 }))}
          >
            <option value="">All genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <select
            id="filter-status"
            className="select w-full"
            value={params.status ?? ''}
            onChange={e => setParams(p => ({ ...p, status: (e.target.value as EmployeeStatus) || undefined, page: 1 }))}
          >
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="RESIGNED">Resigned</option>
          </select>
          <input
            id="filter-join-date-from"
            type="date"
            className="input w-full"
            value={params.join_date_from ?? ''}
            onChange={e => setParams(p => ({ ...p, join_date_from: e.target.value || undefined, page: 1 }))}
            aria-label="Join date from"
            title="Join date from"
          />
          <input
            id="filter-join-date-to"
            type="date"
            className="input w-full"
            value={params.join_date_to ?? ''}
            onChange={e => setParams(p => ({ ...p, join_date_to: e.target.value || undefined, page: 1 }))}
            aria-label="Join date to"
            title="Join date to"
          />
          <select
            id="sort-by"
            className="select w-full"
            value={params.sort_by}
            onChange={e => setParams(p => ({ ...p, sort_by: e.target.value as EmployeeSortField, page: 1 }))}
          >
            {sortOptions.map(option => <option key={option.value} value={option.value}>Sort: {option.label}</option>)}
          </select>
          <select
            id="sort-order"
            className="select w-full"
            value={params.sort_order}
            onChange={e => setParams(p => ({ ...p, sort_order: e.target.value as SortOrder, page: 1 }))}
          >
            <option value="ASC">Ascending</option>
            <option value="DESC">Descending</option>
          </select>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Search by name, email, or employee number. Results update automatically.
        </p>
      </section>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th>Join date</th>
                {canManageEmployees && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data?.items.length === 0 ? (
                <tr>
                  <td colSpan={canManageEmployees ? 7 : 6}>
                    <EmptyState message="No employees found" />
                  </td>
                </tr>
              ) : data?.items.map((emp, idx) => (
                <tr key={emp.id}>
                  <td className="text-gray-400 text-xs">
                    {((params.page! - 1) * params.per_page!) + idx + 1}
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold flex-shrink-0">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{emp.department?.name ?? '—'}</td>
                  <td>{emp.position?.name ?? '—'}</td>
                  <td><EmployeeStatusBadge status={emp.status} /></td>
                  <td className="whitespace-nowrap">{formatDate(emp.join_date)}</td>
                  {canManageEmployees && <td>
                    <div className="flex justify-end gap-1">
                      {canManageEmployees && <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        title="View"
                      >
                        <Eye size={14} />
                      </button>}
                      {canManageEmployees && <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/employees/${emp.id}/edit`)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>}
                      {canManageEmployees && <button
                        className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setDeleteId(emp.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>}
                    </div>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={params.page!}
        totalPages={data?.total_pages ?? 1}
        onPageChange={p => setParams(prev => ({ ...prev, page: p }))}
        total={data?.total}
        perPage={params.per_page}
      />

      <div className="flex justify-end mt-3">
        <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          Per page
          <select
            className="select w-24"
            value={params.per_page}
            onChange={e => setParams(p => ({ ...p, per_page: Number(e.target.value), page: 1 }))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
