import { useQuery } from '@tanstack/react-query'
import { fetchCompanyTerminals } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'

const useCompanyTerminalsQuery = ({ enabled = true } = {}) => {
  const { tokenType, accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['company-terminals'],
    queryFn: async () => {
      const data = await fetchCompanyTerminals({ tokenType, accessToken })
      return Array.isArray(data?.items) ? data.items : []
    },
    enabled: Boolean(accessToken) && enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export { useCompanyTerminalsQuery }
