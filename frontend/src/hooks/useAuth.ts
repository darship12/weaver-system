import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store'

export const useAuth = () => {
  const { user, isAuthenticated, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()

  const logout = useCallback(async () => {
    await storeLogout()
    navigate('/login')
    toast.success('Logged out successfully.')
  }, [navigate, storeLogout])

  const canAccess = useCallback((minRole: string) => {
    if (!user) return false
    const levels: Record<string, number> = { supervisor: 1, owner: 2, admin: 3 }
    return (levels[user.role] || 0) >= (levels[minRole] || 0)
  }, [user])

  return {
    user,
    isAuthenticated,
    logout,
    canAccess,
  }
}
