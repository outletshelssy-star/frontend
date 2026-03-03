import { useQuery } from '@tanstack/react-query'
import { fetchCompanies } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'

const useCompaniesQuery = () => {
  const { tokenType, accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const data = await fetchCompanies({ tokenType, accessToken })
      return Array.isArray(data?.items) ? data.items : []
    },
    enabled: Boolean(accessToken),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export { useCompaniesQuery }
