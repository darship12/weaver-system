import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { productionAPI } from '@/services/api'

export const useProduction = (params?: object) =>
  useQuery({ queryKey: ['production', params], queryFn: () => productionAPI.list(params).then(r => r.data) })

export const useProductionSummary = (period = 'daily') =>
  useQuery({ queryKey: ['production-summary', period], queryFn: () => productionAPI.summary(period).then(r => r.data) })

export const useDefects = (period = 'weekly') =>
  useQuery({ queryKey: ['defects', period], queryFn: () => productionAPI.defects().then(r => r.data) })

export const useCreateProduction = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: object) => productionAPI.create(data),
    onSuccess: () => {
      toast.success('Production entry saved!')
      qc.invalidateQueries({ queryKey: ['production'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['production-summary'] })
    },
    onError: () => toast.error('Failed to save production entry.'),
  })
}
