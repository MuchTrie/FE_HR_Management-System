import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Login berhasil!')
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login gagal'
      setError('root', { message: msg })
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const DEMO_ACCOUNTS = [
    { label: 'Admin', email: 'admin@securehr.com', password: 'Admin@123' },
    { label: 'Manager', email: 'siti.rahayu@securehr.com', password: 'Manager@123' },
    { label: 'Employee', email: 'rina.wulandari@securehr.com', password: 'Employee@123' },
  ]

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Left panel — Brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-white rounded-full" />
          <div className="absolute bottom-[-15%] right-[-10%] w-80 h-80 bg-white rounded-full" />
          <div className="absolute top-[40%] right-[10%] w-40 h-40 bg-white rounded-full" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl tracking-wide">SecureHR</p>
              <p className="text-white/60 text-xs uppercase tracking-widest">HR Management System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage Your<br />
            <span className="text-white/80">Workforce</span><br />
            Efficiently
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Complete HR solution for managing employees, attendance, leaves, and organizational structure — all in one place.
          </p>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Employees', value: '200+' },
              { label: 'Departments', value: '5' },
              { label: 'Monthly Attendance', value: '99%' },
              { label: 'Leave Types', value: '5' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white font-bold text-2xl">{stat.value}</p>
                <p className="text-white/70 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Shield size={20} className="text-brand-600" />
            <span className="font-bold text-gray-900 dark:text-white">SecureHR</span>
          </div>
          <div className="ml-auto">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center
                         bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400
                         hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to your SecureHR account</p>
            </div>

            {/* Demo accounts */}
            <div className="mb-6 p-4 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-2">🔑 Demo Accounts</p>
              <div className="space-y-1">
                {DEMO_ACCOUNTS.map(acc => (
                  <div key={acc.label} className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-brand-700 dark:text-brand-400">[{acc.label}]</span>{' '}
                    {acc.email} / <span className="font-mono">{acc.password}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">
              {/* Email */}
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@perusahaan.com"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Root error */}
              {errors.root && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="btn-primary btn w-full btn-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-gray-400 dark:text-gray-500">
              Lupa password? Hubungi Administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
