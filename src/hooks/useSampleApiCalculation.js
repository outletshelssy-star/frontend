import { useEffect } from 'react'
import { calculateHydrometerApi60f } from '../services/api'
import { convertTemperatureToF } from '../utils/sampleUtils'

const useSampleApiCalculation = ({ isResultsOpen, accessToken, tokenType, resultsForm, setResultsForm }) => {
  useEffect(() => {
    if (!isResultsOpen || !accessToken) {
      setResultsForm((prev) => ({
        ...prev,
        api: { ...prev.api, api_60f: '', api_60f_error: '', temp_diff_error: '' },
        lab_temp_error: '',
      }))
      return
    }
    const rawTempStart = String(resultsForm.api.temp_obs_start || '').trim()
    const rawTempEnd = String(resultsForm.api.temp_obs_end || '').trim()
    const rawApi = String(resultsForm.api.lectura_api || '').trim()
    if (!rawTempStart || !rawTempEnd) {
      setResultsForm((prev) => ({
        ...prev,
        api: { ...prev.api, api_60f: '', api_60f_error: '', temp_diff_error: '' },
        lab_temp_error: '',
      }))
      return
    }
    const tempFStart = convertTemperatureToF(rawTempStart, resultsForm.api.temp_unit)
    const tempFEnd = convertTemperatureToF(rawTempEnd, resultsForm.api.temp_unit)
    const apiValue = Number(rawApi)
    if (tempFStart === null || tempFEnd === null || Number.isNaN(apiValue)) {
      setResultsForm((prev) => ({
        ...prev,
        api: { ...prev.api, api_60f: '', api_60f_error: '', temp_diff_error: '' },
        lab_temp_error: '',
      }))
      return
    }
    const diff = Math.abs(Number(tempFStart) - Number(tempFEnd))
    if (diff > 0.5) {
      setResultsForm((prev) => ({
        ...prev,
        api: {
          ...prev.api,
          api_60f: '',
          api_60f_error: '',
          temp_diff_error: 'La diferencia entre temperaturas debe ser <= 0.5 F.',
        },
        lab_temp_error: '',
      }))
      return
    }
    if (!rawApi || apiValue <= 0) {
      setResultsForm((prev) => ({
        ...prev,
        api: { ...prev.api, api_60f: '', api_60f_error: '', temp_diff_error: '' },
        lab_temp_error: '',
      }))
      return
    }
    const avgTempF = (Number(tempFStart) + Number(tempFEnd)) / 2
    let cancelled = false
    const run = async () => {
      try {
        const data = await calculateHydrometerApi60f({
          tokenType,
          accessToken,
          temp_obs_f: Number(avgTempF),
          lectura_api: apiValue,
        })
        if (cancelled) return
        setResultsForm((prev) => ({
          ...prev,
          api: {
            ...prev.api,
            api_60f: data?.api_60f !== undefined ? String(data.api_60f) : '',
            api_60f_error: '',
            temp_diff_error: '',
          },
          lab_temp_error: prev.lab_temp_error,
        }))
      } catch (err) {
        if (cancelled) return
        setResultsForm((prev) => ({
          ...prev,
          api: {
            ...prev.api,
            api_60f: '',
            api_60f_error: err?.detail || 'No se pudo calcular API a 60F.',
            temp_diff_error: '',
          },
          lab_temp_error: prev.lab_temp_error,
        }))
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [
    isResultsOpen,
    accessToken,
    tokenType,
    resultsForm.api.temp_obs_start,
    resultsForm.api.temp_obs_end,
    resultsForm.api.temp_unit,
    resultsForm.api.lectura_api,
  ])
}

export default useSampleApiCalculation
