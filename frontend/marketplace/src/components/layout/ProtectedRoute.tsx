import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAppSelector } from '@/redux/hooks'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}
