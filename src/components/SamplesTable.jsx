import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableSortLabel,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
} from '@mui/material'
import { FilterAltOff, VisibilityOutlined, EditOutlined, DeleteOutline } from '@mui/icons-material'
import {
  calculateHydrometerApi60f,
  createSample,
  deleteSample,
  fetchEquipmentTypeVerifications,
  fetchEquipmentVerifications,
  fetchExternalAnalysesByTerminal,
  fetchExternalAnalysisRecords,
  fetchSamplesByTerminal,
  updateSample,
} from '../services/api'

const getStoredFilterValue = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch (err) {
    return raw
  }
}
const SamplesTable = ({
  terminals,
  equipments,
  currentUser,
  tokenType,
  accessToken,
}) => {
  const [selectedTerminalId, setSelectedTerminalId] = useState(() =>
    getStoredFilterValue('samples.filters.terminal', '')
  )
  const [samples, setSamples] = useState([])
  const [samplesError, setSamplesError] = useState('')
  const [isSamplesLoading, setIsSamplesLoading] = useState(false)
  const [query, setQuery] = useState(() =>
    getStoredFilterValue('samples.filters.query', '')
  )
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [externalAnalyses, setExternalAnalyses] = useState([])
  const [externalAnalysisRecords, setExternalAnalysisRecords] = useState([])
  const [externalAnalysesError, setExternalAnalysesError] = useState('')
  const [externalRecordsError, setExternalRecordsError] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    terminal_id: '',
    identifier: '',
    analyses: ['api_astm_1298'],
  })
  const [isResultsOpen, setIsResultsOpen] = useState(false)
  const [isSavingResults, setIsSavingResults] = useState(false)
  const [createdSample, setCreatedSample] = useState(null)
  const [resultsMode, setResultsMode] = useState('create')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [resultsForm, setResultsForm] = useState({
    product_name: 'Crudo',
    analyzed_at: '',
    thermohygrometer_id: '',
    lab_humidity: '',
    lab_temperature: '',
    lab_temperature_unit: 'f',
    lab_temp_error: '',
    identifier: '',
    api: {
      hydrometer_id: '',
      thermometer_id: '',
      temp_obs_start: '',
      temp_obs_end: '',
      temp_unit: 'f',
      lectura_api: '',
      api_60f: '',
      api_60f_error: '',
      temp_diff_error: '',
    },
    water: {
      value: '',
      kf_equipment_id: '',
      water_balance_id: '',
      water_sample_weight: '',
      water_sample_weight_unit: 'g',
      water_volume_consumed: '',
      water_volume_unit: 'mL',
      kf_factor_avg: '',
    },
  })
  const [kfFactorHelper, setKfFactorHelper] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      'samples.filters.terminal',
      JSON.stringify(selectedTerminalId)
    )
  }, [selectedTerminalId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('samples.filters.query', JSON.stringify(query))
  }, [query])
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const terminalOptions = useMemo(
    () => (Array.isArray(terminals) ? terminals : []),
    [terminals]
  )

  const isUserRole = String(currentUser?.user_type || '').toLowerCase() === 'user'
  const canDeleteSample =
    !['visitor'].includes(String(currentUser?.user_type || '').toLowerCase())

  const getLabTerminalId = (terminalId) => {
    if (!terminalId) return ''
    const terminal = terminalOptions.find(
      (item) => String(item?.id) === String(terminalId)
    )
    if (!terminal) return String(terminalId)
    if (terminal.has_lab) return String(terminal.id)
    return terminal.lab_terminal_id ? String(terminal.lab_terminal_id) : String(terminal.id)
  }

  const equipmentTerminalId = getLabTerminalId(
    isResultsOpen ? createForm.terminal_id : selectedTerminalId
  )

  const resultsTerminalId = String(
    createForm.terminal_id || createdSample?.terminal_id || selectedTerminalId || ''
  )

  const hydrometerOptions = useMemo(() => {
    if (!Array.isArray(equipments)) return []
    return equipments.filter((item) => {
      if (!item?.id) return false
      if (String(item.terminal_id) !== String(equipmentTerminalId)) return false
      if (item.status !== 'in_use') return false
      const roleType = String(item?.equipment_type?.role || '').toLowerCase()
      if (roleType !== 'working') return false
      const name = String(item?.equipment_type?.name || '').toLowerCase()
      return name === 'hidrometro'
    })
  }, [equipments, equipmentTerminalId])

  const thermometerOptions = useMemo(() => {
    if (!Array.isArray(equipments)) return []
    return equipments.filter((item) => {
      if (!item?.id) return false
      if (String(item.terminal_id) !== String(equipmentTerminalId)) return false
      if (item.status !== 'in_use') return false
      const roleType = String(item?.equipment_type?.role || '').toLowerCase()
      if (roleType !== 'working') return false
      const name = String(item?.equipment_type?.name || '').toLowerCase()
      return name.includes('termometro')
    })
  }, [equipments, equipmentTerminalId])

  const kfEquipmentOptions = useMemo(() => {
    if (!Array.isArray(equipments)) return []
    return equipments.filter((item) => {
      if (!item?.id) return false
      if (String(item.terminal_id) !== String(equipmentTerminalId)) return false
      if (item.status !== 'in_use') return false
      const typeName = String(item?.equipment_type?.name || '').toLowerCase()
      return typeName === 'titulador karl fischer'
    })
  }, [equipments, equipmentTerminalId])

  const balanceOptions = useMemo(() => {
    if (!Array.isArray(equipments)) return []
    return equipments.filter((item) => {
      if (!item?.id) return false
      if (String(item.terminal_id) !== String(equipmentTerminalId)) return false
      if (item.status !== 'in_use') return false
      const typeName = String(item?.equipment_type?.name || '').toLowerCase()
      return typeName === 'balanza analitica'
    })
  }, [equipments, equipmentTerminalId])

  const thermohygrometerOptions = useMemo(() => {
    if (!Array.isArray(equipments)) return []
    return equipments.filter((item) => {
      if (!item?.id) return false
      if (String(item.terminal_id) !== String(equipmentTerminalId)) return false
      if (item.status !== 'in_use') return false
      const typeName = String(item?.equipment_type?.name || '').toLowerCase()
      return typeName === 'termohigrometro'
    })
  }, [equipments, equipmentTerminalId])

  const getThermoLabel = (item) => {
    if (!item) return ''
    const serial = String(item.serial || '').trim()
    const brand = String(item.brand || '').trim()
    const model = String(item.model || '').trim()
    const parts = [serial, brand, model].filter(Boolean)
    return parts.join(' - ') || String(item.internal_code || item.id || '')
  }

  const activeExternalAnalyses = useMemo(
    () => (Array.isArray(externalAnalyses) ? externalAnalyses.filter((item) => item.is_active) : []),
    [externalAnalyses]
  )

  const externalLatestByType = useMemo(() => {
    const items = Array.isArray(externalAnalysisRecords) ? externalAnalysisRecords : []
    const byType = new Map()
    items.forEach((record) => {
      const typeId = record?.analysis_type_id
      if (!typeId) return
      const dateValue =
        record?.performed_at || record?.created_at || record?.updated_at || null
      const time = dateValue ? new Date(dateValue).getTime() : 0
      const existing = byType.get(typeId)
      const existingTime = existing?.__time || 0
      if (!existing || time >= existingTime) {
        byType.set(typeId, { ...record, __time: time })
      }
    })
    return byType
  }, [externalAnalysisRecords])

  const parseKfFactorAvgFromNotes = (notes = '') => {
    const text = String(notes || '')
    const match = text.match(/Factor promedio:\s*([-+]?\d*[.,]?\d+)/i)
    if (!match) return null
    const value = Number(String(match[1]).replace(',', '.'))
    return Number.isNaN(value) ? null : value
  }

  const formatKfFactor = (value) => {
    if (value === null || value === undefined || value === '') return ''
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return ''
    return numeric.toFixed(4)
  }

  const calculateWaterPercent = (volume, volumeUnit, factor, weight, weightUnit) => {
    const vRaw = Number(volume)
    const f = Number(factor)
    const wRaw = Number(weight)
    if ([vRaw, f, wRaw].some((val) => Number.isNaN(val) || val <= 0)) return ''
    const v =
      String(volumeUnit || '').toLowerCase() === 'l' ? vRaw * 1000 : vRaw
    const w =
      String(weightUnit || '').toLowerCase() === 'g' ? wRaw * 1000 : wRaw
    const result = (v * f / w) * 100
    return Number.isFinite(result) ? result.toFixed(4) : ''
  }

  const convertTemperatureToF = (value, unit) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return null
    const normalized = String(unit || 'f').toLowerCase()
    if (normalized === 'f') return numeric
    if (normalized === 'c') return numeric * 9 / 5 + 32
    if (normalized === 'k') return (numeric - 273.15) * 9 / 5 + 32
    if (normalized === 'r') return numeric - 459.67
    return null
  }

  const convertTemperatureFromF = (value, unit) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return null
    const normalized = String(unit || 'f').toLowerCase()
    if (normalized === 'f') return numeric
    if (normalized === 'c') return (numeric - 32) * 5 / 9
    if (normalized === 'k') return (numeric - 32) * 5 / 9 + 273.15
    if (normalized === 'r') return numeric + 459.67
    return null
  }

  const convertTemperatureToC = (value, unit) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return null
    const normalized = String(unit || 'f').toLowerCase()
    if (normalized === 'c') return numeric
    if (normalized === 'f') return (numeric - 32) * 5 / 9
    if (normalized === 'k') return numeric - 273.15
    if (normalized === 'r') return (numeric - 459.67) * 5 / 9
    return null
  }

  const convertWeightToGrams = (value, unit) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return null
    const normalized = String(unit || 'g').toLowerCase()
    if (normalized === 'g') return numeric
    if (normalized === 'mg') return numeric / 1000
    return null
  }

  const formatDateInput = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
    return raw.slice(0, 10)
  }

  const getThermoSpecs = (equipment) => {
    const specs = Array.isArray(equipment?.measure_specs) ? equipment.measure_specs : []
    return {
      temperature: specs.find((spec) => spec.measure === 'temperature') || null,
      relativeHumidity: specs.find((spec) => spec.measure === 'relative_humidity') || null,
    }
  }

  const getMeasureSpec = (equipment, measure) => {
    const specs = Array.isArray(equipment?.measure_specs) ? equipment.measure_specs : []
    return specs.find((spec) => spec.measure === measure) || null
  }

  const isOutsideSpecRange = (value, spec) => {
    if (value === null || value === undefined || Number.isNaN(value)) return false
    if (!spec) return false
    if (spec.min_value !== null && spec.min_value !== undefined && value < spec.min_value) {
      return true
    }
    if (spec.max_value !== null && spec.max_value !== undefined && value > spec.max_value) {
      return true
    }
    return false
  }

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
    const tempFStart = convertTemperatureToF(
      rawTempStart,
      resultsForm.api.temp_unit
    )
    const tempFEnd = convertTemperatureToF(rawTempEnd, resultsForm.api.temp_unit)
    const apiValue = Number(rawApi)
    if (
      tempFStart === null ||
      tempFEnd === null ||
      Number.isNaN(apiValue)
    ) {
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

  useEffect(() => {
    const selectedId = String(resultsForm.water.kf_equipment_id || '')
    if (!isResultsOpen || !selectedId || !accessToken) {
      setKfFactorHelper('')
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const selectedEquipment = kfEquipmentOptions.find(
          (item) => String(item.id) === selectedId
        )
        const equipmentTypeId = selectedEquipment?.equipment_type_id
        if (!equipmentTypeId) {
          setKfFactorHelper('No se encontro el tipo de equipo KF.')
          return
        }
        const [typesData, verificationsData] = await Promise.all([
          fetchEquipmentTypeVerifications({
            tokenType,
            accessToken,
            equipmentTypeId,
          }),
          fetchEquipmentVerifications({
            tokenType,
            accessToken,
            equipmentId: Number(selectedId),
          }),
        ])
        if (cancelled) return
        const types = Array.isArray(typesData?.items) ? typesData.items : []
        const dailyType = types.find((item) => Number(item.frequency_days) === 1)
        if (!dailyType?.id) {
          setKfFactorHelper('No hay tipo de verificacion diaria configurado.')
          return
        }
        const verifications = Array.isArray(verificationsData?.items)
          ? verificationsData.items
          : []
        const dailyVerifications = verifications.filter(
          (item) => String(item.verification_type_id) === String(dailyType.id)
        )
        if (dailyVerifications.length === 0) {
          setKfFactorHelper('No hay verificaciones diarias disponibles.')
          return
        }
        const latest = dailyVerifications.reduce((acc, item) => {
          if (!acc) return item
          const accDate = new Date(acc.verified_at).getTime()
          const itemDate = new Date(item.verified_at).getTime()
          return itemDate > accDate ? item : acc
        }, null)
        const factor = latest ? parseKfFactorAvgFromNotes(latest.notes) : null
        if (factor === null) {
          setKfFactorHelper('No se encontro factor promedio en la verificacion diaria.')
          return
        }
        setKfFactorHelper('')
        setResultsForm((prev) => {
          const current = String(prev.water.kf_factor_avg || '').trim()
          if (current) return prev
          return {
            ...prev,
            water: { ...prev.water, kf_factor_avg: formatKfFactor(factor) },
          }
        })
      } catch (err) {
        if (cancelled) return
        setKfFactorHelper('No se pudo cargar el factor promedio KF.')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [
    accessToken,
    isResultsOpen,
    resultsForm.water.kf_equipment_id,
    kfEquipmentOptions,
    tokenType,
  ])

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

  useEffect(() => {
    if (!isResultsOpen) return
    const nextValue = calculateWaterPercent(
      resultsForm.water.water_volume_consumed,
      resultsForm.water.water_volume_unit,
      resultsForm.water.kf_factor_avg,
      resultsForm.water.water_sample_weight,
      resultsForm.water.water_sample_weight_unit
    )
    setResultsForm((prev) => ({
      ...prev,
      water: { ...prev.water, value: nextValue },
    }))
  }, [
    isResultsOpen,
    resultsForm.water.water_volume_consumed,
    resultsForm.water.kf_factor_avg,
    resultsForm.water.water_sample_weight,
  ])

  useEffect(() => {
    if (!isResultsOpen) {
      setResultsForm((prev) => ({ ...prev, lab_temp_error: '' }))
      return
    }
    const hasAllTempInputs =
      String(resultsForm.api.temp_obs_start || '').trim() &&
      String(resultsForm.api.temp_obs_end || '').trim() &&
      String(resultsForm.lab_temperature || '').trim()
    const tempFStart = convertTemperatureToF(
      resultsForm.api.temp_obs_start,
      resultsForm.api.temp_unit
    )
    const tempFEnd = convertTemperatureToF(
      resultsForm.api.temp_obs_end,
      resultsForm.api.temp_unit
    )
    const labTempRaw = String(resultsForm.lab_temperature || '').trim()
    if (!hasAllTempInputs || !labTempRaw || tempFStart === null || tempFEnd === null) {
      setResultsForm((prev) => ({ ...prev, lab_temp_error: '' }))
      return
    }
    const labTempF = convertTemperatureToF(
      labTempRaw,
      resultsForm.lab_temperature_unit
    )
    if (labTempF === null) {
      setResultsForm((prev) => ({ ...prev, lab_temp_error: '' }))
      return
    }
    const avgTempF = (Number(tempFStart) + Number(tempFEnd)) / 2
    const diff = Math.abs(labTempF - avgTempF)
    if (diff > 5) {
      setResultsForm((prev) => ({
        ...prev,
        lab_temp_error:
          'La diferencia con la temperatura promedio debe ser <= 5 F.',
      }))
      return
    }
    setResultsForm((prev) => ({ ...prev, lab_temp_error: '' }))
  }, [
    isResultsOpen,
    resultsForm.lab_temperature,
    resultsForm.lab_temperature_unit,
    resultsForm.api.temp_obs_start,
    resultsForm.api.temp_obs_end,
    resultsForm.api.temp_unit,
  ])

  useEffect(() => {
    if (selectedTerminalId || terminalOptions.length === 0) return
    const storedId = localStorage.getItem('samples_terminal_id')
    if (storedId && terminalOptions.some((t) => String(t.id) === String(storedId))) {
      setSelectedTerminalId(String(storedId))
      return
    }
    setSelectedTerminalId(String(terminalOptions[0]?.id || ''))
  }, [selectedTerminalId, terminalOptions])

  useEffect(() => {
    if (!selectedTerminalId) return
    localStorage.setItem('samples_terminal_id', String(selectedTerminalId))
  }, [selectedTerminalId])

  const loadSamples = async (terminalId, options = {}) => {
    if (!terminalId || !accessToken) return
    setIsSamplesLoading(true)
    setSamplesError('')
    try {
      const data = await fetchSamplesByTerminal({
        tokenType,
        accessToken,
        terminalId,
      })
      const items = Array.isArray(data?.items) ? data.items : []
      const sortedItems = [...items].sort((a, b) => {
        const aTime = new Date(a?.analyzed_at || a?.created_at || 0).getTime()
        const bTime = new Date(b?.analyzed_at || b?.created_at || 0).getTime()
        if (aTime !== bTime) return bTime - aTime
        const aId = Number(a?.id || 0)
        const bId = Number(b?.id || 0)
        return bId - aId
      })
      setSamples(sortedItems)
      if (options.jumpToSampleId) {
        const index = sortedItems.findIndex((item) => item.id === options.jumpToSampleId)
        if (index >= 0) {
          setPage(Math.floor(index / rowsPerPage) + 1)
        }
      }
    } catch (err) {
      setSamplesError(err?.detail || 'No se pudieron cargar las muestras.')
      setSamples([])
    } finally {
      setIsSamplesLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedTerminalId) return
    loadSamples(selectedTerminalId)
    setPage(1)
  }, [selectedTerminalId])

  const getAvgTempDisplay = () => {
    const tempFStart = convertTemperatureToF(
      resultsForm.api.temp_obs_start,
      resultsForm.api.temp_unit
    )
    const tempFEnd = convertTemperatureToF(
      resultsForm.api.temp_obs_end,
      resultsForm.api.temp_unit
    )
    if (tempFStart === null || tempFEnd === null) return ''
    const avgTempF = (Number(tempFStart) + Number(tempFEnd)) / 2
    const avgInUnit = convertTemperatureFromF(avgTempF, resultsForm.api.temp_unit)
    return avgInUnit === null ? '' : avgInUnit.toFixed(2)
  }

  const formatWaterValue = (value) => {
    if (value === null || value === undefined || value === '') return ''
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return ''
    return numeric.toFixed(3)
  }

  const isSampleEmpty = (sample) => {
    if (!sample) return false
    if (sample.lab_humidity !== null || sample.lab_temperature !== null) {
      return false
    }
    const analyses = Array.isArray(sample.analyses) ? sample.analyses : []
    return analyses.every((analysis) => {
      return (
        (analysis?.api_60f === null || analysis?.api_60f === undefined) &&
        (analysis?.water_value === null || analysis?.water_value === undefined)
      )
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return
    try {
      await deleteSample({
        tokenType,
        accessToken,
        sampleId: deleteTarget.id,
      })
      setToast({
        open: true,
        message: 'Muestra eliminada correctamente.',
        severity: 'success',
      })
      setDeleteTarget(null)
      await loadSamples(String(selectedTerminalId))
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar la muestra.',
        severity: 'error',
      })
    }
  }


  const filteredSamples = useMemo(() => {
    const safeSamples = Array.isArray(samples) ? samples : []
    const search = String(query || '').trim().toLowerCase()
    if (!search) return safeSamples
    return safeSamples.filter((sample) => {
      const analysis = Array.isArray(sample.analyses) ? sample.analyses[0] : null
      const haystack = [
        sample.code,
        analysis?.analysis_type,
        analysis?.product_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
  }, [samples, query])

  const sortedSamples = useMemo(() => {
    const items = Array.isArray(filteredSamples) ? [...filteredSamples] : []
    const getValue = (sample, key) => {
      const analysis = Array.isArray(sample?.analyses) ? sample.analyses[0] : null
      if (key === 'code') return sample?.code || ''
      if (key === 'created_at') return sample?.created_at || ''
      if (key === 'product') return analysis?.product_name || ''
      if (key === 'identifier') return sample?.identifier || ''
      if (key === 'api_60f') return analysis?.api_60f ?? null
      if (key === 'water_value') {
        const waterAnalysis = Array.isArray(sample?.analyses)
          ? sample.analyses.find((item) => item?.analysis_type === 'water_astm_4377')
          : null
        return waterAnalysis?.water_value ?? null
      }
      return ''
    }
    const dir = sortDirection === 'asc' ? 1 : -1
    return items.sort((a, b) => {
      const aVal = getValue(a, sortKey)
      const bVal = getValue(b, sortKey)
      if (sortKey === 'created_at') {
        const aTime = aVal ? new Date(aVal).getTime() : 0
        const bTime = bVal ? new Date(bVal).getTime() : 0
        if (aTime !== bTime) return dir * (aTime - bTime)
      }
      if (typeof aVal === 'number' || typeof bVal === 'number') {
        const aNum = aVal === null || aVal === '' ? Number.NEGATIVE_INFINITY : Number(aVal)
        const bNum = bVal === null || bVal === '' ? Number.NEGATIVE_INFINITY : Number(bVal)
        if (aNum !== bNum) return dir * (aNum - bNum)
      }
      const aStr = String(aVal ?? '')
      const bStr = String(bVal ?? '')
      return dir * aStr.localeCompare(bStr, 'es', { numeric: true, sensitivity: 'base' })
    })
  }, [filteredSamples, sortKey, sortDirection])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('asc')
  }

  const totalPages = Math.max(1, Math.ceil(sortedSamples.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pagedSamples = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return sortedSamples.slice(start, start + rowsPerPage)
  }, [sortedSamples, safePage, rowsPerPage])

  const lastSampleId = useMemo(() => {
    if (!samples.length) return null
    const last = samples.reduce((acc, item) => {
      if (!acc) return item
      if ((item.sequence || 0) > (acc.sequence || 0)) return item
      return acc
    }, null)
    return last?.id || null
  }, [samples])

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const openResultsForSample = (sample, mode) => {
    if (!sample) return
    const analyses = Array.isArray(sample.analyses) ? sample.analyses : []
    const apiAnalysis =
      analyses.find((item) => item?.analysis_type === 'api_astm_1298') || null
    const waterAnalysis =
      analyses.find((item) => item?.analysis_type === 'water_astm_4377') || null
    setCreatedSample(sample)
    setResultsMode(mode)
    setCreateForm((prev) => ({
      ...prev,
      terminal_id: String(sample.terminal_id || prev.terminal_id || ''),
      analyses: analyses.map((item) => item.analysis_type).filter(Boolean),
    }))
    setResultsForm((prev) => ({
      ...prev,
      product_name: sample.product_name || apiAnalysis?.product_name || prev.product_name,
      analyzed_at:
        sample.analyzed_at || sample.created_at
          ? formatDateInput(sample.analyzed_at || sample.created_at)
          : prev.analyzed_at,
      identifier: sample.identifier || '',
      thermohygrometer_id:
        sample.thermohygrometer_id !== undefined && sample.thermohygrometer_id !== null
          ? String(sample.thermohygrometer_id)
          : prev.thermohygrometer_id,
      lab_humidity:
        sample.lab_humidity !== undefined && sample.lab_humidity !== null
          ? String(sample.lab_humidity)
          : prev.lab_humidity,
      lab_temperature:
        sample.lab_temperature !== undefined && sample.lab_temperature !== null
          ? String(sample.lab_temperature)
          : prev.lab_temperature,
      lab_temperature_unit: 'f',
      lab_temp_error: '',
      api: {
        ...prev.api,
        hydrometer_id: apiAnalysis?.hydrometer_id
          ? String(apiAnalysis.hydrometer_id)
          : '',
        thermometer_id: apiAnalysis?.thermometer_id
          ? String(apiAnalysis.thermometer_id)
          : '',
        temp_obs_start:
          apiAnalysis?.temp_obs_f !== undefined && apiAnalysis?.temp_obs_f !== null
            ? String(apiAnalysis.temp_obs_f)
            : '',
        temp_obs_end:
          apiAnalysis?.temp_obs_f !== undefined && apiAnalysis?.temp_obs_f !== null
            ? String(apiAnalysis.temp_obs_f)
            : '',
        temp_unit: 'f',
        lectura_api:
          apiAnalysis?.lectura_api !== undefined && apiAnalysis?.lectura_api !== null
            ? String(apiAnalysis.lectura_api)
            : '',
        api_60f:
          apiAnalysis?.api_60f !== undefined && apiAnalysis?.api_60f !== null
            ? String(apiAnalysis.api_60f)
            : '',
        api_60f_error: '',
        temp_diff_error: '',
      },
      water: {
        value:
          waterAnalysis?.water_value !== undefined && waterAnalysis?.water_value !== null
            ? String(waterAnalysis.water_value)
            : '',
        kf_equipment_id:
          waterAnalysis?.kf_equipment_id !== undefined &&
            waterAnalysis?.kf_equipment_id !== null
            ? String(waterAnalysis.kf_equipment_id)
            : '',
        water_balance_id:
          waterAnalysis?.water_balance_id !== undefined &&
            waterAnalysis?.water_balance_id !== null
            ? String(waterAnalysis.water_balance_id)
            : '',
        water_sample_weight:
          waterAnalysis?.water_sample_weight !== undefined &&
            waterAnalysis?.water_sample_weight !== null
            ? String(waterAnalysis.water_sample_weight)
            : '',
        water_sample_weight_unit:
          waterAnalysis?.water_sample_weight_unit || 'g',
        water_volume_consumed:
          waterAnalysis?.water_volume_consumed !== undefined &&
            waterAnalysis?.water_volume_consumed !== null
            ? String(waterAnalysis.water_volume_consumed)
            : '',
        water_volume_unit: waterAnalysis?.water_volume_unit || 'mL',
        kf_factor_avg:
          waterAnalysis?.kf_factor_avg !== undefined && waterAnalysis?.kf_factor_avg !== null
            ? formatKfFactor(waterAnalysis.kf_factor_avg)
            : '',
      },
    }))
    setIsResultsOpen(true)
  }

  const isEditDisabledForUser = (sample) => {
    if (String(currentUser?.user_type || '').toLowerCase() === 'visitor') return true
    if (!isUserRole || !sample?.created_at) return false
    const createdAt = new Date(sample.created_at).getTime()
    if (Number.isNaN(createdAt)) return false
    const diffMs = Date.now() - createdAt
    return diffMs >= 24 * 60 * 60 * 1000
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
          Muestras
        </Typography>
        {canDeleteSample ? (
          <Button
            variant="contained"
            onClick={() => {
              setCreateForm((prev) => ({
                ...prev,
                terminal_id: selectedTerminalId || String(terminalOptions[0]?.id || ''),
                identifier: '',
                analyses: ['api_astm_1298'],
              }))
              setIsCreateOpen(true)
            }}
            disabled={!selectedTerminalId}
          >
            Crear muestra
          </Button>
        ) : null}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="samples-terminal-label">Terminal</InputLabel>
          <Select
            labelId="samples-terminal-label"
            label="Terminal"
            value={selectedTerminalId}
            onChange={(event) => setSelectedTerminalId(String(event.target.value || ''))}
          >
            {terminalOptions.map((terminal) => (
              <MenuItem key={terminal.id} value={String(terminal.id)}>
                {terminal.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Buscar"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          sx={{ minWidth: 220 }}
        />
        <Button
          type="button"
          size="small"
          variant="outlined"
          startIcon={<FilterAltOff fontSize="small" />}
          onClick={() => {
            setQuery('')
            setPage(1)
          }}
          disabled={!query}
          sx={{ borderColor: '#c7d2fe', color: '#4338ca', height: 40 }}
        >
          Limpiar filtros
        </Button>
        <Chip
          label={`${filteredSamples.length} resultados`}
          size="small"
          sx={{ backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: 600 }}
        />
      </Box>

      {samplesError ? (
        <Typography color="error">{samplesError}</Typography>
      ) : null}

      {isSamplesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    backgroundColor: '#eef2ff',
                    color: '#4338ca',
                    fontWeight: 700,
                  },
                }}
              >
                <TableCell sortDirection={sortKey === 'code' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortKey === 'code'}
                    direction={sortKey === 'code' ? sortDirection : 'asc'}
                    onClick={() => handleSort('code')}
                  >
                    Codigo
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortKey === 'created_at' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortKey === 'created_at'}
                    direction={sortKey === 'created_at' ? sortDirection : 'asc'}
                    onClick={() => handleSort('created_at')}
                  >
                    Fecha
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortKey === 'product' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortKey === 'product'}
                    direction={sortKey === 'product' ? sortDirection : 'asc'}
                    onClick={() => handleSort('product')}
                  >
                    Producto
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortKey === 'identifier' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortKey === 'identifier'}
                    direction={sortKey === 'identifier' ? sortDirection : 'asc'}
                    onClick={() => handleSort('identifier')}
                  >
                    Identificador
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortKey === 'api_60f' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortKey === 'api_60f'}
                    direction={sortKey === 'api_60f' ? sortDirection : 'asc'}
                    onClick={() => handleSort('api_60f')}
                  >
                    API 60 °F
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortKey === 'water_value' ? sortDirection : false}>
                  <TableSortLabel
                    active={sortKey === 'water_value'}
                    direction={sortKey === 'water_value' ? sortDirection : 'asc'}
                    onClick={() => handleSort('water_value')}
                  >
                    % Agua
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 140 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSamples.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography color="text.secondary">Sin muestras.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pagedSamples.map((sample, index) => {
                  const analysis = Array.isArray(sample.analyses) ? sample.analyses[0] : null
                  const isEditDisabled = isEditDisabledForUser(sample)
                  const canDeleteThisSample =
                    canDeleteSample &&
                    sample.id === lastSampleId &&
                    isSampleEmpty(sample)
                  return (
                    <TableRow
                      key={sample.id}
                      hover
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                        '&:hover': { backgroundColor: '#eef2ff' },
                      }}
                    >
                      <TableCell>{sample.code || '-'}</TableCell>
                      <TableCell>
                        {sample.created_at
                          ? new Date(sample.created_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>{analysis?.product_name || '-'}</TableCell>
                      <TableCell>{sample.identifier || '-'}</TableCell>
                      <TableCell>
                        {analysis?.api_60f !== undefined ? analysis.api_60f : '-'}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const waterAnalysis = Array.isArray(sample.analyses)
                            ? sample.analyses.find(
                              (item) => item?.analysis_type === 'water_astm_4377'
                            )
                            : null
                          return waterAnalysis?.water_value !== undefined &&
                            waterAnalysis?.water_value !== null
                            ? formatWaterValue(waterAnalysis.water_value) || '-'
                            : '-'
                        })()}
                      </TableCell>
                      <TableCell align="center" sx={{ width: 140 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, whiteSpace: 'nowrap' }}>
                          <IconButton
                            size="small"
                            aria-label="Ver muestra"
                            onClick={() => openResultsForSample(sample, 'view')}
                            sx={{ color: '#64748b', '&:hover': { color: '#4338ca' } }}
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                          {canDeleteSample ? (
                            <IconButton
                              size="small"
                              aria-label="Editar muestra"
                              disabled={isEditDisabled}
                              onClick={() => openResultsForSample(sample, 'edit')}
                              sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          ) : null}
                          {canDeleteSample ? (
                            <IconButton
                              size="small"
                              aria-label="Eliminar muestra"
                              disabled={!canDeleteThisSample}
                              onClick={() => setDeleteTarget(sample)}
                              sx={{ color: '#64748b', '&:hover': { color: '#b91c1c' } }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          ) : null}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {filteredSamples.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mt: 0.5,
          }}
        >
          <Typography className="meta" component="p">
            Pagina {safePage} de {totalPages}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="samples-rows-per-page">Filas</InputLabel>
              <Select
                labelId="samples-rows-per-page"
                value={rowsPerPage}
                label="Filas"
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setPage(1)
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={15}>15</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="outlined"
              sx={{ height: 40 }}
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <Button
              size="small"
              variant="outlined"
              sx={{ height: 40 }}
              disabled={safePage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Siguiente
            </Button>
          </Box>
        </Box>
      ) : null}

      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { maxWidth: 768 } }}
      >
        <DialogTitle>Crear muestra</DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gap: 1.5,
            pt: 1.5,
            overflow: 'visible',
            '& .MuiInputLabel-root': { backgroundColor: '#fff', px: 0.5 },
            '& .MuiOutlinedInput-root': { backgroundColor: '#fff' },
            '& .MuiInputBase-root': { height: 40 },
          }}
        >
          <FormControl size="small" fullWidth>
            <InputLabel id="create-sample-terminal-label">Terminal</InputLabel>
            <Select
              labelId="create-sample-terminal-label"
              label="Terminal"
              value={createForm.terminal_id}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  terminal_id: String(event.target.value || ''),
                }))
              }
            >
              {terminalOptions.map((terminal) => (
                <MenuItem key={terminal.id} value={String(terminal.id)}>
                  {terminal.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Identificador"
            size="small"
            value={createForm.identifier}
            onChange={(event) =>
              setCreateForm((prev) => ({
                ...prev,
                identifier: event.target.value,
              }))
            }
            required
          />
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Analisis
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={createForm.analyses.includes('api_astm_1298')}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        analyses: event.target.checked
                          ? Array.from(new Set([...prev.analyses, 'api_astm_1298']))
                          : prev.analyses.filter((item) => item !== 'api_astm_1298'),
                      }))
                    }
                  />
                }
                label="API ASTM 1298"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={createForm.analyses.includes('water_astm_4377')}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        analyses: event.target.checked
                          ? Array.from(new Set([...prev.analyses, 'water_astm_4377']))
                          : prev.analyses.filter((item) => item !== 'water_astm_4377'),
                      }))
                    }
                  />
                }
                label="Agua ASTM 4377"
              />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={isCreating}
            onClick={async () => {
              const terminalId = String(createForm.terminal_id || '').trim()
              if (!terminalId) {
                setToast({
                  open: true,
                  message: 'Selecciona un terminal.',
                  severity: 'error',
                })
                return
              }
              if (!String(createForm.identifier || '').trim()) {
                setToast({
                  open: true,
                  message: 'El identificador es obligatorio.',
                  severity: 'error',
                })
                return
              }
              if (!createForm.analyses || createForm.analyses.length === 0) {
                setToast({
                  open: true,
                  message: 'Selecciona al menos un analisis.',
                  severity: 'error',
                })
                return
              }
              setIsCreating(true)
              try {
                const created = await createSample({
                  tokenType,
                  accessToken,
                  payload: {
                    terminal_id: Number(terminalId),
                    identifier: createForm.identifier?.trim() || null,
                    analyses: createForm.analyses.map((analysisType) => ({
                      analysis_type: analysisType,
                      product_name: 'Crudo',
                    })),
                  },
                })
                setToast({
                  open: true,
                  message: 'Muestra creada correctamente.',
                  severity: 'success',
                })
                setIsCreateOpen(false)
                setCreatedSample(created)
                setResultsMode('create')
                setQuery('')
                setResultsForm((prev) => ({
                  ...prev,
                  product_name: 'Crudo',
                  analyzed_at: new Date().toISOString().slice(0, 10),
                  thermohygrometer_id: '',
                  lab_humidity: '',
                  lab_temperature: '',
                  lab_temperature_unit: 'f',
                  identifier: '',
                  api: {
                    hydrometer_id: '',
                    thermometer_id: '',
                    temp_obs_start: '',
                    temp_obs_end: '',
                    temp_unit: 'f',
                    lectura_api: '',
                    api_60f: '',
                    api_60f_error: '',
                    temp_diff_error: '',
                  },
                  lab_temp_error: '',
                  water: {
                    value: '',
                    kf_equipment_id: '',
                    water_balance_id: '',
                    water_sample_weight: '',
                    water_sample_weight_unit: 'g',
                    water_volume_consumed: '',
                    water_volume_unit: 'mL',
                    kf_factor_avg: '',
                  },
                }))
                setIsResultsOpen(true)
                await loadSamples(terminalId, { jumpToSampleId: created.id })
              } catch (err) {
                setToast({
                  open: true,
                  message: err?.detail || 'No se pudo crear la muestra.',
                  severity: 'error',
                })
              } finally {
                setIsCreating(false)
              }
            }}
          >
            {isCreating ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { maxWidth: 1152 } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="h6">Resultados de analisis</Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              backgroundColor: '#eef2ff',
              color: '#4338ca',
              fontWeight: 700,
            }}
          >
            {(() => {
              const terminalName =
                terminalOptions.find(
                  (terminal) => String(terminal.id) === String(createForm.terminal_id)
                )?.name || ''
              const code = createdSample?.code || ''
              const identifier = createdSample?.identifier || ''
              const parts = [terminalName, code, identifier].filter(Boolean)
              return parts.join(' - ')
            })()}
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gap: 1.5,
            pt: 1.5,
            overflow: 'visible',
            '& .MuiInputLabel-root': { backgroundColor: '#fff', px: 0.5 },
            '& .MuiOutlinedInput-root': { backgroundColor: '#fff' },
          }}
        >
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
              <InputLabel id="results-product-label">Producto</InputLabel>
              <Select
                labelId="results-product-label"
                label="Producto"
                value={resultsForm.product_name}
                onChange={(event) =>
                  setResultsForm((prev) => ({
                    ...prev,
                    product_name: String(event.target.value || 'Crudo'),
                  }))
                }
              >
                <MenuItem value="Crudo">Crudo</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha del analisis"
              type="date"
              value={resultsForm.analyzed_at}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={resultsMode === 'view'}
              onChange={(event) =>
                setResultsForm((prev) => ({
                  ...prev,
                  analyzed_at: event.target.value,
                }))
              }
            />
            {resultsMode === 'edit' ? (
              <TextField
                label="Identificador"
                size="small"
                fullWidth
                value={resultsForm.identifier}
                onChange={(event) =>
                  setResultsForm((prev) => ({
                    ...prev,
                    identifier: event.target.value,
                  }))
                }
              />
            ) : null}
          </Box>
          <Box sx={{ display: 'grid', gap: 0.75, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
              <InputLabel id="thermo-label">Termohigrometro</InputLabel>
              <Select
                labelId="thermo-label"
                label="Termohigrometro"
                value={resultsForm.thermohygrometer_id}
                onChange={(event) =>
                  setResultsForm((prev) => ({
                    ...prev,
                    thermohygrometer_id: String(event.target.value || ''),
                  }))
                }
              >
                <MenuItem value="">Selecciona</MenuItem>
                {thermohygrometerOptions.map((item) => {
                  const label = getThermoLabel(item)
                  return (
                    <MenuItem key={item.id} value={String(item.id)}>
                      {label}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            <TextField
              label="Humedad relativa (%)"
              type="number"
              value={resultsForm.lab_humidity}
              size="small"
              fullWidth
              disabled={resultsMode === 'view'}
              onChange={(event) =>
                setResultsForm((prev) => ({
                  ...prev,
                  lab_humidity: event.target.value,
                }))
              }
            />
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'minmax(0, 1fr) 90px' }}>
              <TextField
                label="Temperatura laboratorio"
                type="number"
                value={resultsForm.lab_temperature}
                size="small"
                fullWidth
                error={Boolean(resultsForm.lab_temp_error)}
                helperText={resultsForm.lab_temp_error || ' '}
                disabled={resultsMode === 'view'}
                onChange={(event) =>
                  setResultsForm((prev) => ({
                    ...prev,
                    lab_temperature: event.target.value,
                  }))
                }
              />
              <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
                <InputLabel id="lab-temp-unit-label">Unidad</InputLabel>
                <Select
                  labelId="lab-temp-unit-label"
                  label="Unidad"
                  value={resultsForm.lab_temperature_unit}
                  onChange={(event) =>
                    setResultsForm((prev) => ({
                      ...prev,
                      lab_temperature_unit: String(event.target.value || 'f'),
                    }))
                  }
                >
                  <MenuItem value="f">F</MenuItem>
                  <MenuItem value="c">C</MenuItem>
                  <MenuItem value="k">K</MenuItem>
                  <MenuItem value="r">R</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          {resultsMode === 'edit' ? (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25 }}>
                Analisis
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={createForm.analyses.includes('api_astm_1298')}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          analyses: event.target.checked
                            ? Array.from(new Set([...prev.analyses, 'api_astm_1298']))
                            : prev.analyses.filter((item) => item !== 'api_astm_1298'),
                        }))
                      }
                    />
                  }
                  label="API ASTM 1298"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={createForm.analyses.includes('water_astm_4377')}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          analyses: event.target.checked
                            ? Array.from(new Set([...prev.analyses, 'water_astm_4377']))
                            : prev.analyses.filter((item) => item !== 'water_astm_4377'),
                        }))
                      }
                    />
                  }
                  label="Agua ASTM 4377"
                />
              </FormGroup>
            </Box>
          ) : null}
          {(createForm.analyses.includes('api_astm_1298') ||
            createForm.analyses.includes('water_astm_4377')) ? (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              }}
            >
              {createForm.analyses.includes('api_astm_1298') ? (
                <Box
                  sx={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 1,
                    p: 0.75,
                    display: 'grid',
                    gap: 1.5,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    API ASTM 1298
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '2fr 0.7fr' } }}>
                    <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
                      <InputLabel id="api-thermometer-label">Termometro</InputLabel>
                      <Select
                        labelId="api-thermometer-label"
                        label="Termometro"
                        value={resultsForm.api.thermometer_id}
                        onChange={(event) =>
                          setResultsForm((prev) => ({
                            ...prev,
                            api: { ...prev.api, thermometer_id: String(event.target.value || '') },
                          }))
                        }
                      >
                        {thermometerOptions.map((item) => (
                          <MenuItem key={item.id} value={String(item.id)}>
                            {item.serial} - {item.brand} {item.model}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
                      <InputLabel id="api-temp-unit-label">Unidad</InputLabel>
                      <Select
                        labelId="api-temp-unit-label"
                        label="Unidad"
                        value={resultsForm.api.temp_unit}
                        onChange={(event) =>
                          setResultsForm((prev) => ({
                            ...prev,
                            api: { ...prev.api, temp_unit: String(event.target.value || 'f') },
                          }))
                        }
                      >
                        <MenuItem value="f">F</MenuItem>
                        <MenuItem value="c">C</MenuItem>
                        <MenuItem value="k">K</MenuItem>
                        <MenuItem value="r">R</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
                    <TextField
                      label="Temp observada inicial"
                      type="number"
                      value={resultsForm.api.temp_obs_start}
                      size="small"
                      fullWidth
                      disabled={resultsMode === 'view'}
                      onChange={(event) =>
                        setResultsForm((prev) => ({
                          ...prev,
                          api: { ...prev.api, temp_obs_start: event.target.value },
                        }))
                      }
                    />
                    <TextField
                      label="Temp observada final"
                      type="number"
                      value={resultsForm.api.temp_obs_end}
                      size="small"
                      fullWidth
                      disabled={resultsMode === 'view'}
                      onChange={(event) =>
                        setResultsForm((prev) => ({
                          ...prev,
                          api: { ...prev.api, temp_obs_end: event.target.value },
                        }))
                      }
                    />
                    <TextField
                      label="Temp promedio"
                      value={getAvgTempDisplay()}
                      size="small"
                      fullWidth
                      InputProps={{ readOnly: true }}
                      error={Boolean(resultsForm.api.temp_diff_error)}
                      helperText={resultsForm.api.temp_diff_error || undefined}
                      FormHelperTextProps={{ sx: { m: 0, mt: 0.25 } }}
                    />
                  </Box>
                  <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '2fr 0.7fr' } }}>
                    <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
                      <InputLabel id="api-hydrometer-label">Hidrometro</InputLabel>
                      <Select
                        labelId="api-hydrometer-label"
                        label="Hidrometro"
                        value={resultsForm.api.hydrometer_id}
                        onChange={(event) =>
                          setResultsForm((prev) => ({
                            ...prev,
                            api: { ...prev.api, hydrometer_id: String(event.target.value || '') },
                          }))
                        }
                      >
                        {hydrometerOptions.map((item) => (
                          <MenuItem key={item.id} value={String(item.id)}>
                            {item.serial} - {item.brand} {item.model}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Lectura API"
                      type="number"
                      value={resultsForm.api.lectura_api}
                      size="small"
                      fullWidth
                      disabled={resultsMode === 'view'}
                      onChange={(event) =>
                        setResultsForm((prev) => ({
                          ...prev,
                          api: { ...prev.api, lectura_api: event.target.value },
                        }))
                      }
                    />
                  </Box>
                  {resultsForm.api.api_60f_error ? (
                    <Typography variant="caption" color="error">
                      {resultsForm.api.api_60f_error}
                    </Typography>
                  ) : null}
                  <Box
                    sx={{
                      border: "1px solid #dbeafe",
                      backgroundColor: "#eff6ff",
                      borderRadius: 1,
                      p: 1,
                      textAlign: 'center',
                      alignItems: 'center',
                      display: "grid",
                      gap: 0.25,
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#1d4ed8" }}>
                      {resultsForm.api.api_60f || "--"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      API 60 °F
                    </Typography>
                  </Box>
                </Box>
              ) : null}
              {createForm.analyses.includes('water_astm_4377') ? (
                <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1.5, display: 'grid', gap: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Agua ASTM 4377
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="water-balance-label">Balanza</InputLabel>
                    <Select
                      labelId="water-balance-label"
                      label="Balanza"
                      value={resultsForm.water.water_balance_id}
                      disabled={resultsMode === 'view'}
                      onChange={(event) =>
                        setResultsForm((prev) => ({
                          ...prev,
                          water: { ...prev.water, water_balance_id: event.target.value },
                        }))
                      }
                    >
                      {balanceOptions.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>
                          {item.serial} - {item.brand} {item.model}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      gridTemplateColumns: { xs: '1fr', sm: '2fr 0.7fr' },
                    }}
                  >
                    <TextField
                      label="Peso de muestra"
                      type="number"
                      value={resultsForm.water.water_sample_weight}
                      size="small"
                      fullWidth
                      disabled={resultsMode === 'view'}
                      onChange={(event) =>
                        setResultsForm((prev) => ({
                          ...prev,
                          water: { ...prev.water, water_sample_weight: event.target.value },
                        }))
                      }
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel id="water-weight-unit-label">Unidad peso</InputLabel>
                      <Select
                        labelId="water-weight-unit-label"
                        label="Unidad peso"
                        value={resultsForm.water.water_sample_weight_unit || 'g'}
                        disabled={resultsMode === 'view'}
                        onChange={(event) =>
                          setResultsForm((prev) => ({
                            ...prev,
                            water: {
                              ...prev.water,
                              water_sample_weight_unit: event.target.value,
                            },
                          }))
                        }
                      >
                        <MenuItem value="g">g</MenuItem>
                        <MenuItem value="mg">mg</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      gridTemplateColumns: { xs: '1fr', sm: '2fr 0.7fr' },
                    }}
                  >
                    <FormControl size="small" fullWidth>
                      <InputLabel id="kf-equipment-label">Equipo KF</InputLabel>
                      <Select
                        labelId="kf-equipment-label"
                        label="Equipo KF"
                        value={resultsForm.water.kf_equipment_id}
                        disabled={resultsMode === 'view'}
                        onChange={(event) =>
                          setResultsForm((prev) => ({
                            ...prev,
                            water: { ...prev.water, kf_equipment_id: event.target.value },
                          }))
                        }
                      >
                        {kfEquipmentOptions.map((item) => (
                          <MenuItem key={item.id} value={String(item.id)}>
                            {item.serial} - {item.brand} {item.model}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Factor KF"
                      type="number"
                      value={resultsForm.water.kf_factor_avg}
                      size="small"
                      fullWidth
                      disabled={resultsMode === 'view'}
                      required
                      helperText={kfFactorHelper || undefined}
                      error={Boolean(kfFactorHelper)}
                      FormHelperTextProps={{ sx: { m: 0, mt: 0.25 } }}
                      onChange={(event) =>
                        setResultsForm((prev) => ({
                          ...prev,
                          water: { ...prev.water, kf_factor_avg: event.target.value },
                        }))
                      }
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      gridTemplateColumns: { xs: '1fr', sm: '2fr 0.7fr' },
                    }}
                  >
                    <TextField
                      label="Volumen consumido"
                      type="number"
                      value={resultsForm.water.water_volume_consumed}
                      size="small"
                      fullWidth
                      disabled={resultsMode === 'view'}
                      onChange={(event) =>
                        setResultsForm((prev) => ({
                          ...prev,
                          water: { ...prev.water, water_volume_consumed: event.target.value },
                        }))
                      }
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel id="water-volume-unit-label">Unidad volumen</InputLabel>
                      <Select
                        labelId="water-volume-unit-label"
                        label="Unidad volumen"
                        value={resultsForm.water.water_volume_unit || 'mL'}
                        disabled={resultsMode === 'view'}
                        onChange={(event) =>
                          setResultsForm((prev) => ({
                            ...prev,
                            water: {
                              ...prev.water,
                              water_volume_unit: event.target.value,
                            },
                          }))
                        }
                      >
                        <MenuItem value="mL">mL</MenuItem>
                        <MenuItem value="L">L</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box
                    sx={{
                      border: "1px solid #dcfce7",
                      backgroundColor: "#f0fdf4",
                      borderRadius: 1,
                      p: 1,
                      textAlign: 'center',
                      alignItems: 'center',
                      display: "grid",
                      gap: 0.25,
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#15803d" }}>
                        {formatWaterValue(resultsForm.water.value) || "--"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      % Agua
                    </Typography>
                  </Box>
                </Box>
              ) : null}
            </Box>
          ) : null}
          <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Analisis externos activos
            </Typography>
            {externalAnalysesError || externalRecordsError ? (
              <Typography variant="caption" color="error">
                {externalAnalysesError || externalRecordsError}
              </Typography>
            ) : activeExternalAnalyses.length > 0 ? (
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  p: 1.5,
                  display: 'grid',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(auto-fit, minmax(180px, 1fr))',
                    },
                  }}
                >
                  {activeExternalAnalyses.map((analysis) => {
                    const latestRecord = externalLatestByType.get(analysis.analysis_type_id)
                    const resultValue =
                      latestRecord?.result_value !== undefined && latestRecord?.result_value !== null
                        ? String(latestRecord.result_value)
                        : ''
                    const resultUnit = latestRecord?.result_unit || ''
                    const resultDisplay = resultValue
                    const resultDate =
                      latestRecord?.performed_at || latestRecord?.created_at || ''
                    const analysisCompanyName =
                      latestRecord?.analysis_company_name ||
                      latestRecord?.analysis_company?.name ||
                      ''
                    return (
                      <Box
                        key={analysis.analysis_type_id}
                        sx={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 1,
                          p: 1,
                          display: 'grid',
                          gap: 0.5,
                          gridTemplateColumns: 'minmax(0, 1fr) 140px',
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ display: 'grid', gap: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                            {analysis.analysis_type_name}
                          </Typography>
                          {resultDate ? (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(resultDate).toLocaleDateString()}
                            </Typography>
                          ) : null}
                          {analysisCompanyName ? (
                            <Typography variant="caption" color="text.secondary">
                              {analysisCompanyName}
                            </Typography>
                          ) : null}
                          {analysis.method ? (
                            <Typography variant="caption" color="text.secondary">
                              {analysis.method}
                            </Typography>
                          ) : null}
                        </Box>
                        <Box
                          sx={{
                            borderRadius: 1,
                            p: 0.75,
                            textAlign: 'center',
                            display: 'grid',
                            gap: 0.25,
                          }}
                        >
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                            {resultDisplay || '--'}
                          </Typography>
                          {resultUnit ? (
                            <Typography variant="caption" color="text.secondary">
                              {resultUnit}
                            </Typography>
                          ) : null}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No hay analisis externos activos.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsResultsOpen(false)}>Cerrar</Button>
          {resultsMode === 'view' ? null : (
            <Button
              variant="contained"
              disabled={isSavingResults || !createdSample?.id}
              onClick={async () => {
                if (!createdSample?.id) return
                const analyzedAtRaw =
                  resultsForm.analyzed_at ||
                  createdSample?.analyzed_at ||
                  createdSample?.created_at ||
                  null
                const analyzedAt = analyzedAtRaw
                  ? new Date(analyzedAtRaw).toISOString()
                  : null
                setIsSavingResults(true)
                try {
                  if (createForm.analyses.includes('api_astm_1298')) {
                    const tempFStart = convertTemperatureToF(
                      resultsForm.api.temp_obs_start,
                      resultsForm.api.temp_unit
                    )
                    const tempFEnd = convertTemperatureToF(
                      resultsForm.api.temp_obs_end,
                      resultsForm.api.temp_unit
                    )
                    if (tempFStart !== null && tempFEnd !== null) {
                      const diff = Math.abs(Number(tempFStart) - Number(tempFEnd))
                      if (diff > 0.5) {
                        setToast({
                          open: true,
                          message: 'La diferencia entre temperaturas debe ser <= 0.5 F.',
                          severity: 'error',
                        })
                        setIsSavingResults(false)
                        return
                      }
                    }
                    const selectedThermometer = thermometerOptions.find(
                      (item) =>
                        String(item.id) === String(resultsForm.api.thermometer_id)
                    )
                    if (selectedThermometer) {
                      const tempSpec = getMeasureSpec(selectedThermometer, 'temperature')
                      const tempStartC = convertTemperatureToC(
                        resultsForm.api.temp_obs_start,
                        resultsForm.api.temp_unit
                      )
                      const tempEndC = convertTemperatureToC(
                        resultsForm.api.temp_obs_end,
                        resultsForm.api.temp_unit
                      )
                      if (
                        isOutsideSpecRange(tempStartC, tempSpec) ||
                        isOutsideSpecRange(tempEndC, tempSpec)
                      ) {
                        setToast({
                          open: true,
                          message:
                            'La temperatura observada esta fuera del rango del termometro.',
                          severity: 'error',
                        })
                        setIsSavingResults(false)
                        return
                      }
                    }
                    const selectedHydrometer = hydrometerOptions.find(
                      (item) =>
                        String(item.id) === String(resultsForm.api.hydrometer_id)
                    )
                    if (selectedHydrometer) {
                      const apiSpec = getMeasureSpec(selectedHydrometer, 'api')
                      const apiValue = Number(resultsForm.api.lectura_api)
                      if (
                        resultsForm.api.lectura_api !== '' &&
                        !Number.isNaN(apiValue) &&
                        isOutsideSpecRange(apiValue, apiSpec)
                      ) {
                        setToast({
                          open: true,
                          message:
                            'La lectura API esta fuera del rango del hidrometro.',
                          severity: 'error',
                        })
                        setIsSavingResults(false)
                        return
                      }
                    }
                  }
                  const selectedThermo = thermohygrometerOptions.find(
                    (item) => String(item.id) === String(resultsForm.thermohygrometer_id)
                  )
                  if (selectedThermo) {
                    const { temperature, relativeHumidity } = getThermoSpecs(selectedThermo)
                    const humidityValue = Number(resultsForm.lab_humidity)
                    if (
                      resultsForm.lab_humidity !== '' &&
                      !Number.isNaN(humidityValue) &&
                      relativeHumidity
                    ) {
                      if (
                        (relativeHumidity.min_value !== null &&
                          humidityValue < relativeHumidity.min_value) ||
                        (relativeHumidity.max_value !== null &&
                          humidityValue > relativeHumidity.max_value)
                      ) {
                        setToast({
                          open: true,
                          message:
                            'La humedad relativa esta fuera del rango del termohigrometro.',
                          severity: 'error',
                        })
                        setIsSavingResults(false)
                        return
                      }
                    }
                    const tempValueC = convertTemperatureToC(
                      resultsForm.lab_temperature,
                      resultsForm.lab_temperature_unit
                    )
                    if (
                      resultsForm.lab_temperature !== '' &&
                      tempValueC !== null &&
                      temperature
                    ) {
                      if (
                        (temperature.min_value !== null &&
                          tempValueC < temperature.min_value) ||
                        (temperature.max_value !== null &&
                          tempValueC > temperature.max_value)
                      ) {
                        setToast({
                          open: true,
                          message:
                            'La temperatura del laboratorio esta fuera del rango del termohigrometro.',
                          severity: 'error',
                        })
                        setIsSavingResults(false)
                        return
                      }
                    }
                  }
                  if (resultsForm.lab_temp_error) {
                    setToast({
                      open: true,
                      message:
                        'La temperatura del laboratorio debe estar a <= 5 F del promedio.',
                      severity: 'error',
                    })
                    setIsSavingResults(false)
                    return
                  }
                  if (
                    createForm.analyses.includes('water_astm_4377') &&
                    (!String(resultsForm.water.kf_factor_avg || '').trim() ||
                      !String(resultsForm.water.kf_equipment_id || '').trim())
                  ) {
                    setToast({
                      open: true,
                      message:
                        'Selecciona el equipo KF y el factor promedio para el analisis de agua.',
                      severity: 'error',
                    })
                    setIsSavingResults(false)
                    return
                  }
                  if (
                    createForm.analyses.includes('water_astm_4377') &&
                    (!String(resultsForm.water.water_balance_id || '').trim() ||
                      !String(resultsForm.water.water_sample_weight || '').trim() ||
                      !String(resultsForm.water.water_sample_weight_unit || '').trim() ||
                      !String(resultsForm.water.water_volume_consumed || '').trim() ||
                      !String(resultsForm.water.water_volume_unit || '').trim())
                  ) {
                    setToast({
                      open: true,
                      message:
                        'Selecciona la balanza, el peso, la unidad y el volumen para el analisis de agua.',
                      severity: 'error',
                    })
                    setIsSavingResults(false)
                    return
                  }
                  if (createForm.analyses.includes('water_astm_4377')) {
                    const selectedBalance = balanceOptions.find(
                      (item) =>
                        String(item.id) === String(resultsForm.water.water_balance_id)
                    )
                    if (selectedBalance) {
                      const weightSpec = getMeasureSpec(selectedBalance, 'weight')
                      const weightValueG = convertWeightToGrams(
                        resultsForm.water.water_sample_weight,
                        resultsForm.water.water_sample_weight_unit
                      )
                      if (
                        weightValueG !== null &&
                        isOutsideSpecRange(weightValueG, weightSpec)
                      ) {
                        setToast({
                          open: true,
                          message:
                            'El peso de muestra esta fuera del rango de la balanza.',
                          severity: 'error',
                        })
                        setIsSavingResults(false)
                        return
                      }
                    }
                  }
                  const analyses = createForm.analyses.map((analysisType) => {
                    if (analysisType === 'api_astm_1298') {
                      const tempFStart = convertTemperatureToF(
                        resultsForm.api.temp_obs_start,
                        resultsForm.api.temp_unit
                      )
                      const tempFEnd = convertTemperatureToF(
                        resultsForm.api.temp_obs_end,
                        resultsForm.api.temp_unit
                      )
                      const tempF =
                        tempFStart === null || tempFEnd === null
                          ? null
                          : (Number(tempFStart) + Number(tempFEnd)) / 2
                      return {
                        analysis_type: 'api_astm_1298',
                        product_name: resultsForm.product_name || 'Crudo',
                        temp_obs_f:
                          tempF === null ? null : Number(tempF),
                        lectura_api:
                          resultsForm.api.lectura_api === ''
                            ? null
                            : Number(resultsForm.api.lectura_api),
                        hydrometer_id:
                          resultsForm.api.hydrometer_id
                            ? Number(resultsForm.api.hydrometer_id)
                            : null,
                        thermometer_id:
                          resultsForm.api.thermometer_id
                            ? Number(resultsForm.api.thermometer_id)
                            : null,
                      }
                    }
                    if (analysisType === 'water_astm_4377') {
                      return {
                        analysis_type: 'water_astm_4377',
                        product_name: resultsForm.product_name || 'Crudo',
                        water_value:
                          resultsForm.water.value === ''
                            ? null
                            : Number(resultsForm.water.value),
                        kf_factor_avg:
                          resultsForm.water.kf_factor_avg === ''
                            ? null
                            : Number(resultsForm.water.kf_factor_avg),
                        kf_equipment_id:
                          resultsForm.water.kf_equipment_id === ''
                            ? null
                            : Number(resultsForm.water.kf_equipment_id),
                        water_balance_id:
                          resultsForm.water.water_balance_id === ''
                            ? null
                            : Number(resultsForm.water.water_balance_id),
                        water_sample_weight:
                          resultsForm.water.water_sample_weight === ''
                            ? null
                            : Number(resultsForm.water.water_sample_weight),
                        water_sample_weight_unit:
                          resultsForm.water.water_sample_weight_unit || null,
                        water_volume_consumed:
                          resultsForm.water.water_volume_consumed === ''
                            ? null
                            : Number(resultsForm.water.water_volume_consumed),
                        water_volume_unit:
                          resultsForm.water.water_volume_unit || null,
                      }
                    }
                    return {
                      analysis_type: analysisType,
                      product_name: resultsForm.product_name || 'Crudo',
                    }
                  })
                  await updateSample({
                    tokenType,
                    accessToken,
                    sampleId: createdSample.id,
                    payload: {
                      product_name: resultsForm.product_name || 'Crudo',
                      analyzed_at: analyzedAt,
                      identifier: resultsForm.identifier || null,
                      thermohygrometer_id:
                        resultsForm.thermohygrometer_id === ''
                          ? null
                          : Number(resultsForm.thermohygrometer_id),
                      lab_humidity:
                        resultsForm.lab_humidity === ''
                          ? null
                          : Number(resultsForm.lab_humidity),
                      lab_temperature:
                        resultsForm.lab_temperature === ''
                          ? null
                          : Number(
                            convertTemperatureToF(
                              resultsForm.lab_temperature,
                              resultsForm.lab_temperature_unit
                            )
                          ),
                      analyses,
                    },
                  })
                  setToast({
                    open: true,
                    message: 'Resultados guardados correctamente.',
                    severity: 'success',
                  })
                  setIsResultsOpen(false)
                  await loadSamples(String(createForm.terminal_id))
                } catch (err) {
                  setToast({
                    open: true,
                    message: err?.detail || 'No se pudieron guardar los resultados.',
                    severity: 'error',
                  })
                } finally {
                  setIsSavingResults(false)
                }
              }}
            >
              {isSavingResults ? 'Guardando...' : 'Guardar resultados'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          Eliminar muestra
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 1 }}>
          <Typography color="text.secondary">
            Esta accion eliminara la ultima muestra si no tiene datos
            registrados.
          </Typography>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'grid',
              gap: 0.5,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
              {deleteTarget?.code || 'Muestra'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {deleteTarget?.identifier ? `Identificador: ${deleteTarget.identifier}` : 'Sin identificador'}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Solo se permite eliminar la ultima muestra sin API 60F ni Agua.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              backgroundColor: '#ef4444',
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SamplesTable


