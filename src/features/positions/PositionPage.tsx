import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  getPositions, createPosition, updatePosition, deletePosition,
} from '../../lib/api'
import type { CreatePositionRequest, Position } from '../../types'
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
  level: z.coerce.number().min(1).max(10),
})
type FormData = z.infer<typeof schema>

function PositionForm({
  initial, onSubmit, isLoading,
}: { initial?: Position; onSubmit: (d: CreatePositionRequest) => void; isLoading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof schema>, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ? { name: initial.name, description: initial.description, level: initial.level } : { level: 1 },
  })

  return (
    <form id="position-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Position Name</label>
        <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Software Engineer" />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea {...register('description')} className="textarea" rows={3} placeholder="Brief description of this position" />
      </div>
      <div>
        <label className="label">Level (1–10)</label>
        <input {...register('level')} type="number" min={1} max={10} className={`input ${errors.level ? 'input-error' : ''}`} />
        {errors.level && <p className="text-xs text-red-500 mt-1">{errors.level.message}</p>}
      </div>
      <button id="btn-save-position" type="submit" className="btn-primary btn w-full" disabled={isLoading}>
        {isLoading ? <Spinner size={16} className="text-white" /> : null}
        {isLoading ? 'Saving...' : 'Save Position'}
      </button>
    </form>
  )
}

// Level badge
function LevelBadge({ level }: { level: number }) {
  const colors = ['', 'bg-gray-100 text-gray-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600',
    'bg-yellow-100 text-yellow-600', 'bg-orange-100 text-orange-600', 'bg-red-100 text-red-600',
    'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600', 'bg-indigo-100 text-indigo-600', 'bg-rose-100 text-rose-600']
  return (
    <span className={`badge ${colors[level] ?? 'bg-gray-100 text-gray-600'} dark:bg-opacity-20`}>
      Level {level}
    </span>
  )
}

export default function PositionPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<Position | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: positions, isLoading } = useQuery({
    queryKey: ['positions'],
    queryFn: getPositions,
  })

  const createMutation = useMutation({
    mutationFn: createPosition,
    onSuccess: () => { toast.success('Position created'); qc.invalidateQueries({ queryKey: ['positions'] }); setFormOpen(false) },
    onError: () => toast.error('Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreatePositionRequest }) => updatePosition(id, data),
    onSuccess: () => { toast.success('Position updated'); qc.invalidateQueries({ queryKey: ['positions'] }); setEditItem(null) },
    onError: () => toast.error('Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePosition(id),
    onSuccess: () => { toast.success('Position deleted'); qc.invalidateQueries({ queryKey: ['positions'] }); setDeleteId(null) },
    onError: () => toast.error('Failed'),
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Positions</h1>
          <p className="page-subtitle">Manage job positions and levels</p>
        </div>
        <button id="btn-add-position" className="btn-primary btn" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Add Position
        </button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={4} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Position Name</th>
                <th>Description</th>
                <th>Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions?.length === 0 ? (
                <tr><td colSpan={5}><EmptyState message="No positions found" /></td></tr>
              ) : positions?.sort((a, b) => a.level - b.level).map((pos, idx) => (
                <tr key={pos.id}>
                  <td className="text-gray-400 text-xs">{idx + 1}</td>
                  <td className="font-medium">{pos.name}</td>
                  <td className="text-gray-500 dark:text-gray-400 max-w-xs truncate">{pos.description}</td>
                  <td><LevelBadge level={pos.level} /></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditItem(pos)}>
                        <Pencil size={13} />
                      </button>
                      <button className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteId(pos.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Add Position">
        <PositionForm onSubmit={(d) => createMutation.mutate(d)} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Position">
        {editItem && (
          <PositionForm
            initial={editItem}
            onSubmit={(d) => updateMutation.mutate({ id: editItem.id, data: d })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Position"
        message="Are you sure you want to delete this position?"
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
