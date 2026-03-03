import { useQuery } from '@tanstack/react-query'
import { fetchSamplesByTerminal } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'

const useSamplesByTerminalQuery = ({ terminalId, enabled = true } = {}) => {
  const { tokenType, accessToken } = useAuthStore()
  const normalizedId = terminalId ? String(terminalId) : ''

  return useQuery({
    queryKey: ['samples', normalizedId],
    queryFn: async () => {
      const data = await fetchSamplesByTerminal({
        tokenType,
        accessToken,
        terminalId: normalizedId,
      })
      return Array.isArray(data?.items) ? data.items : []
    },
    enabled: Boolean(accessToken) && Boolean(normalizedId) && enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export { useSamplesByTerminalQuery }
