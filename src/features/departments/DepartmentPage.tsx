import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getEmployees,
} from '../../lib/api'
import type { CreateDepartmentRequest, Department } from '../../types'
import { TableSkeleton, EmptyState, Spinner } from '../../components/ui/Loading'
import { ConfirmModal } from '../../components/ui/Modal'
import Modal from '../../components/ui/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  manager_id: z.coerce.number().optional(),
})
type FormData = z.infer<typeof schema>

function DepartmentForm({
  initial, onSubmit, isLoading,
}: {
  initial?: Department
  onSubmit: (d: CreateDepartmentRequest) => void
  isLoading: boolean
}) {
  const { data: employees } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => getEmployees({ per_page: 100 }),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof schema>, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ? {
      name: initial.name, description: initial.description, manager_id: initial.manager_id,
    } : undefined,
  })

  return (
    <form id="department-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Department Name</label>
        <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Engineering" />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea {...register('description')} className="textarea" rows={3} placeholder="Brief description of this department" />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>
      <div>
        <label className="label">Manager (Optional)</label>
        <select {...register('manager_id')} className="select">
          <option value="">No Manager</option>
          {employees?.items.map(e => (
            <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button id="btn-save-dept" type="submit" className="btn-primary btn flex-1" disabled={isLoading}>
          {isLoading ? <Spinner size={16} className="text-white" /> : null}
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function DepartmentPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<Department | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => { toast.success('Department created'); qc.invalidateQueries({ queryKey: ['departments'] }); setFormOpen(false) },
    onError: () => toast.error('Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateDepartmentRequest }) => updateDepartment(id, data),
    onSuccess: () => { toast.success('Department updated'); qc.invalidateQueries({ queryKey: ['departments'] }); setEditItem(null) },
    onError: () => toast.error('Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => { toast.success('Department deleted'); qc.invalidateQueries({ queryKey: ['departments'] }); setDeleteId(null) },
    onError: () => toast.error('Failed'),
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage organizational departments</p>
        </div>
        <button id="btn-add-dept" className="btn-primary btn" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      {/* Cards grid */}
      {isLoading ? <TableSkeleton rows={4} cols={4} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departments?.length === 0 ? <EmptyState message="No departments found" /> : departments?.map(dept => (
            <div key={dept.id} className="card p-5 hover:shadow-card-hover transition-shadow duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                  <Users size={18} className="text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditItem(dept)} title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteId(dept.id)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{dept.name}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mb-3">{dept.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{dept.employee_count ?? 0}</span> employees
                </span>
                {dept.manager && (
                  <span className="text-xs text-gray-400 ml-auto">
                    Manager: {dept.manager.first_name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Add Department">
        <DepartmentForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Department">
        {editItem && (
          <DepartmentForm
            initial={editItem}
            onSubmit={(data) => updateMutation.mutate({ id: editItem.id, data })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Department"
        message="Are you sure you want to delete this department?"
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
