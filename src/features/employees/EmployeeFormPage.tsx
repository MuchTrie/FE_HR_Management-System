import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import {
  getEmployee, createEmployee, updateEmployee,
  getDepartments, getPositions,
} from '../../lib/api'
import { PageLoader, Spinner } from '../../components/ui/Loading'
import toast from 'react-hot-toast'

const schema = z.object({
  employee_number: z.string().min(1, 'Required'),
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(8, 'Min 8 digits'),
  address: z.string().min(5, 'Required'),
  date_of_birth: z.string().min(1, 'Required'),
  gender: z.enum(['MALE', 'FEMALE']),
  department_id: z.coerce.number().min(1, 'Required'),
  position_id: z.coerce.number().min(1, 'Required'),
  manager_id: z.coerce.number().optional(),
  join_date: z.string().min(1, 'Required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'RESIGNED']),
})

type FormData = z.infer<typeof schema>

export default function EmployeeFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const qc = useQueryClient()

  const { data: employee, isLoading: empLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => getEmployee(Number(id)),
    enabled: isEdit,
  })

  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: getDepartments })
  const { data: positions } = useQuery({ queryKey: ['positions'], queryFn: getPositions })
  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.input<typeof schema>, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: employee ? {
      ...employee,
      department_id: employee.department_id,
      position_id: employee.position_id,
    } : undefined,
  })

  useEffect(() => {
    if (employee) {
      reset({
        employee_number: employee.employee_number,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        date_of_birth: employee.date_of_birth,
        gender: employee.gender,
        department_id: employee.department_id,
        position_id: employee.position_id,
        manager_id: employee.manager_id,
        join_date: employee.join_date,
        status: employee.status,
      })
    }
  }, [employee, reset])

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      toast.success('Employee created!')
      qc.invalidateQueries({ queryKey: ['employees'] })
      navigate('/employees')
    },
    onError: () => toast.error('Failed to create employee'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => updateEmployee(Number(id), data),
    onSuccess: () => {
      toast.success('Employee updated!')
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employee', id] })
      navigate('/employees')
    },
    onError: () => toast.error('Failed to update employee'),
  })

  const onSubmit = (data: FormData) => {
    if (isEdit) updateMutation.mutate(data)
    else createMutation.mutate(data)
  }

  if (isEdit && empLoading) return <PageLoader />

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn-ghost btn" onClick={() => navigate('/employees')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Employee' : 'Add Employee'}</h1>
            <p className="page-subtitle">{isEdit ? 'Update employee information' : 'Add a new employee record'}</p>
          </div>
        </div>
      </div>

      <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <div className="card p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Employee Number</label>
                <input {...register('employee_number')} className={`input ${errors.employee_number ? 'input-error' : ''}`} placeholder="EMP001" />
                {errors.employee_number && <p className="text-xs text-red-500 mt-1">{errors.employee_number.message}</p>}
              </div>
              <div>
                <label className="label">First Name</label>
                <input {...register('first_name')} className={`input ${errors.first_name ? 'input-error' : ''}`} placeholder="Ahmad" />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input {...register('last_name')} className={`input ${errors.last_name ? 'input-error' : ''}`} placeholder="Fauzi" />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
              </div>
              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="ahmad@company.com" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Phone</label>
                <input {...register('phone')} className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="08123456789" />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="label">Gender</label>
                <select {...register('gender')} className={`select ${errors.gender ? 'input-error' : ''}`}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input {...register('date_of_birth')} type="date" className={`input ${errors.date_of_birth ? 'input-error' : ''}`} />
                {errors.date_of_birth && <p className="text-xs text-red-500 mt-1">{errors.date_of_birth.message}</p>}
              </div>
              <div>
                <label className="label">Join Date</label>
                <input {...register('join_date')} type="date" className={`input ${errors.join_date ? 'input-error' : ''}`} />
                {errors.join_date && <p className="text-xs text-red-500 mt-1">{errors.join_date.message}</p>}
              </div>
              <div>
                <label className="label">Status</label>
                <select {...register('status')} className="select">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="RESIGNED">RESIGNED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="label">Address</label>
            <textarea {...register('address')} className={`textarea ${errors.address ? 'input-error' : ''}`} rows={3} placeholder="Jl. Contoh No. 1, Jakarta" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>

          {/* Organization */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
              Organization
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Department</label>
                <select {...register('department_id')} className={`select ${errors.department_id ? 'input-error' : ''}`}>
                  <option value="">Select Department</option>
                  {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {errors.department_id && <p className="text-xs text-red-500 mt-1">{errors.department_id.message}</p>}
              </div>
              <div>
                <label className="label">Position</label>
                <select {...register('position_id')} className={`select ${errors.position_id ? 'input-error' : ''}`}>
                  <option value="">Select Position</option>
                  {positions?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.position_id && <p className="text-xs text-red-500 mt-1">{errors.position_id.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button type="button" className="btn-outline btn" onClick={() => navigate('/employees')}>Cancel</button>
          <button id="btn-save-employee" type="submit" className="btn-primary btn" disabled={isSaving}>
            {isSaving ? <Spinner size={16} className="text-white" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
      </form>
    </div>
  )
}
