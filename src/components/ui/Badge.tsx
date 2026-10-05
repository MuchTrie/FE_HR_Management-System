
type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'brand'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  )
}

// ─── Convenience badges ───────────────────────────────────────────────────────
export function EmployeeStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    ACTIVE: 'green', INACTIVE: 'yellow', RESIGNED: 'red',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>
}

export function AttendanceStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    PRESENT: 'green', LATE: 'yellow', ABSENT: 'red',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>
}

export function LeaveStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    PENDING: 'yellow', APPROVED: 'green', REJECTED: 'red', CANCELLED: 'gray',
  }
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, BadgeVariant> = {
    ADMIN: 'brand', MANAGER: 'blue', EMPLOYEE: 'gray',
  }
  return <Badge variant={map[role] ?? 'gray'}>{role}</Badge>
}
import type React from 'react'
