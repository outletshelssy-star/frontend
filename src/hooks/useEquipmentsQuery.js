import { useQuery } from '@tanstack/react-query'
import { fetchEquipments } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'

const useEquipmentsQuery = ({ enabled = true } = {}) => {
  const { tokenType, accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['equipments'],
    queryFn: async () => {
      const data = await fetchEquipments({ tokenType, accessToken })
      return Array.isArray(data?.items) ? data.items : []
    },
    enabled: Boolean(accessToken) && enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export { useEquipmentsQuery }
