import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '@/services/api'
import { DashboardSummary } from '@/types'

export const useDashboard = () =>
  useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.summary().then(r => r.data),
    refetchInterval: 5 * 60 * 1000, // 5 min
  })
