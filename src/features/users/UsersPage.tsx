import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, toggleUserActive } from '../../lib/api'
import { RoleBadge } from '../../components/ui/Badge'
import { TableSkeleton, EmptyState, Spinner } from '../../components/ui/Loading'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const qc = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const toggleMutation = useMutation({
    mutationFn: toggleUserActive,
    onSuccess: (u) => {
      toast.success(`User ${u.is_active ? 'activated' : 'deactivated'}`)
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => toast.error('Failed'),
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users and permissions</p>
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={5} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No</th>
                <th>Employee</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.length === 0 ? (
                <tr><td colSpan={6}><EmptyState message="No users found" /></td></tr>
              ) : users?.map((u, idx) => (
                <tr key={u.id}>
                  <td className="text-gray-400 text-xs">{idx + 1}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold flex-shrink-0">
                        {u.employee?.first_name?.[0] ?? u.email[0].toUpperCase()}
                      </div>
                      <p className="font-medium">
                        {u.employee ? `${u.employee.first_name} ${u.employee.last_name}` : '—'}
                      </p>
                    </div>
                  </td>
                  <td className="text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.is_active ? 'btn-outline text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'btn-outline text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                      onClick={() => toggleMutation.mutate(u.id)}
                      disabled={toggleMutation.isPending}
                    >
                      {toggleMutation.isPending ? <Spinner size={12} /> : null}
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
