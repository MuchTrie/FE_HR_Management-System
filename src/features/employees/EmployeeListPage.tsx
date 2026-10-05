import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Eye, Filter } from 'lucide-react'
import {
  getEmployees, deleteEmployee,
  getDepartments,
} from '../../lib/api'
import type { EmployeeQueryParams, EmployeeStatus } from '../../types'
import { EmployeeStatusBadge } from '../../components/ui/Badge'
import { TableSkeleton, EmptyState } from '../../components/ui/Loading'
import { ConfirmModal } from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import toast from 'react-hot-toast'

export default function EmployeeListPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params, setParams] = useState<EmployeeQueryParams>({ page: 1, per_page: 10 })
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', params],
    queryFn: () => getEmployees(params),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setParams(p => ({ ...p, search, page: 1 }))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage all employee records</p>
        </div>
        <button
          id="btn-add-employee"
          className="btn-primary btn"
          onClick={() => navigate('/employees/new')}
        >
          <Plus size={16} />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
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
            className="select w-44"
            value={params.department_id ?? ''}
            onChange={e => setParams(p => ({ ...p, department_id: e.target.value ? Number(e.target.value) : undefined, page: 1 }))}
          >
            <option value="">All Departments</option>
            {departments?.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            id="filter-status"
            className="select w-36"
            value={params.status ?? ''}
            onChange={e => setParams(p => ({ ...p, status: (e.target.value as EmployeeStatus) || undefined, page: 1 }))}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="RESIGNED">RESIGNED</option>
          </select>
          <button type="submit" className="btn-primary btn">
            <Filter size={15} />
            Filter
          </button>
        </form>
      </div>

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
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
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
                  <td>{emp.join_date}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/employees/${emp.id}/edit`)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setDeleteId(emp.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
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
import type React from 'react'
