import { useEffect, useMemo, useState } from 'react'
import { fetchExternalAnalysesByTerminal, fetchExternalAnalysisRecords } from '../services/api'

const useSampleExternalAnalyses = ({ isResultsOpen, resultsTerminalId, accessToken, tokenType }) => {
  const [externalAnalyses, setExternalAnalyses] = useState([])
  const [externalAnalysisRecords, setExternalAnalysisRecords] = useState([])
  const [externalAnalysesError, setExternalAnalysesError] = useState('')
  const [externalRecordsError, setExternalRecordsError] = useState('')

  useEffect(() => {
    if (!isResultsOpen || !resultsTerminalId || !accessToken) {
      setExternalAnalyses([])
      setExternalAnalysesError('')
      setExternalAnalysisRecords([])
      setExternalRecordsError('')
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const [analysesData, recordsData] = await Promise.all([
          fetchExternalAnalysesByTerminal({
            tokenType,
            accessToken,
            terminalId: resultsTerminalId,
          }),
          fetchExternalAnalysisRecords({
            tokenType,
            accessToken,
            terminalId: resultsTerminalId,
          }),
        ])
        if (cancelled) return
        setExternalAnalyses(Array.isArray(analysesData?.items) ? analysesData.items : [])
        setExternalAnalysesError('')
        setExternalAnalysisRecords(Array.isArray(recordsData?.items) ? recordsData.items : [])
        setExternalRecordsError('')
      } catch (err) {
        if (cancelled) return
        setExternalAnalyses([])
        setExternalAnalysesError(err?.detail || 'No se pudieron cargar los analisis externos.')
        setExternalAnalysisRecords([])
        setExternalRecordsError(err?.detail || 'No se pudieron cargar los registros externos.')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [isResultsOpen, resultsTerminalId, accessToken, tokenType])

  const activeExternalAnalyses = useMemo(
    () =>
      Array.isArray(externalAnalyses) ? externalAnalyses.filter((item) => item.is_active) : [],
    [externalAnalyses],
  )

  const externalLatestByType = useMemo(() => {
    const items = Array.isArray(externalAnalysisRecords) ? externalAnalysisRecords : []
    const byType = new Map()
    items.forEach((record) => {
      const typeId = record?.analysis_type_id
      if (!typeId) return
      const dateValue = record?.performed_at || record?.created_at || record?.updated_at || null
      const time = dateValue ? new Date(dateValue).getTime() : 0
      const existing = byType.get(typeId)
      const existingTime = existing?.__time || 0
      if (!existing || time >= existingTime) {
        byType.set(typeId, { ...record, __time: time })
      }
    })
    return byType
  }, [externalAnalysisRecords])

  return { externalAnalyses, externalAnalysisRecords, externalAnalysesError, externalRecordsError, activeExternalAnalyses, externalLatestByType }
}

export default useSampleExternalAnalyses
