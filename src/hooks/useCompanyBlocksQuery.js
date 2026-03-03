import { useQuery } from '@tanstack/react-query'
import { fetchCompanyBlocks } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'

const useCompanyBlocksQuery = () => {
  const { tokenType, accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['company-blocks'],
    queryFn: async () => {
      const data = await fetchCompanyBlocks({ tokenType, accessToken })
      return Array.isArray(data?.items) ? data.items : []
    },
    enabled: Boolean(accessToken),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export { useCompanyBlocksQuery }
