import { useQuery } from '@tanstack/react-query'
import { fetchEquipmentTypes } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'

const useEquipmentTypesQuery = ({ enabled = true } = {}) => {
  const { tokenType, accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['equipment-types'],
    queryFn: async () => {
      const data = await fetchEquipmentTypes({ tokenType, accessToken })
      return Array.isArray(data?.items) ? data.items : []
    },
    enabled: Boolean(accessToken) && enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export { useEquipmentTypesQuery }
