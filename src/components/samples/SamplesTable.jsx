import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoredFilterValue } from '../../utils/storage'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Alert,
} from '@mui/material'
import { FilterAltOff, VisibilityOutlined, EditOutlined, DeleteOutline } from '@mui/icons-material'
import { createSample, deleteSample, updateSample } from '../../services/api'
import { useSamplesByTerminalQuery } from '../../hooks/useSamplesByTerminalQuery'
import { useAuthStore } from '../../store/useAuthStore'
import useSampleEquipmentOptions from '../../hooks/useSampleEquipmentOptions'
import useSampleApiCalculation from '../../hooks/useSampleApiCalculation'
import useSampleKfFactor from '../../hooks/useSampleKfFactor'
import useSampleExternalAnalyses from '../../hooks/useSampleExternalAnalyses'
import {
  convertTemperatureToF,
  convertTemperatureToC,
  convertWeightToGrams,
  formatDateInput,
  formatKfFactor,
  formatWaterValue,
  getThermoSpecs,
  getMeasureSpec,
  isOutsideSpecRange,
  calculateWaterPercent,
  isSampleEmpty,
  hasSamplePassed24Hours,
} from '../../utils/sampleUtils'
import SampleCreateDialog from './SampleCreateDialog'
import SampleResultsDialog from './SampleResultsDialog'
import SampleDeleteDialog from './SampleDeleteDialog'

const SamplesTable = ({ terminals, equipments, currentUser }) => {
  const { tokenType, accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedTerminalId, setSelectedTerminalId] = useState(() =>
    getStoredFilterValue('samples.filters.terminal', ''),
  )
  const [query, setQuery] = useState(() => getStoredFilterValue('samples.filters.query', ''))
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
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
  const [updateReason, setUpdateReason] = useState('')
  const [updateReasonError, setUpdateReasonError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('samples.filters.terminal', JSON.stringify(selectedTerminalId))
  }, [selectedTerminalId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('samples.filters.query', JSON.stringify(query))
  }, [query])

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  const samplesEnabled = Boolean(selectedTerminalId)
  const {
    data: samples = [],
    isLoading: isSamplesLoading,
    error: samplesQueryError,
  } = useSamplesByTerminalQuery({ terminalId: selectedTerminalId, enabled: samplesEnabled })
  const samplesErrorMessage = samplesQueryError
    ? samplesQueryError?.detail ||
      samplesQueryError?.message ||
      String(samplesQueryError || '') ||
      'No se pudieron cargar las muestras.'
    : ''

  const createSampleMutation = useMutation({
    mutationFn: (args) => createSample(args),
    onSuccess: (_data, variables) => {
      const createdTerminalId = variables?.payload?.terminal_id
      const keyId = createdTerminalId ? String(createdTerminalId) : String(selectedTerminalId || '')
      queryClient.invalidateQueries({ queryKey: ['samples', keyId] })
    },
  })

  const updateSampleMutation = useMutation({
    mutationFn: (args) => updateSample(args),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['samples', String(selectedTerminalId || '')] }),
  })

  const deleteSampleMutation = useMutation({
    mutationFn: (args) => deleteSample(args),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['samples', String(selectedTerminalId || '')] }),
  })

  const terminalOptions = useMemo(
    () =>
      Array.isArray(terminals)
        ? [...terminals].sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''), undefined, {
              numeric: true,
              sensitivity: 'base',
            }),
          )
        : [],
    [terminals],
  )

  const canDeleteSample = !['visitor'].includes(String(currentUser?.user_type || '').toLowerCase())

  const getLabTerminalId = (terminalId) => {
    if (!terminalId) return ''
    const terminal = terminalOptions.find((item) => String(item?.id) === String(terminalId))
    if (!terminal) return String(terminalId)
    if (terminal.has_lab) return String(terminal.id)
    return terminal.lab_terminal_id ? String(terminal.lab_terminal_id) : String(terminal.id)
  }

  const equipmentTerminalId = getLabTerminalId(
    isResultsOpen ? createForm.terminal_id : selectedTerminalId,
  )

  const resultsTerminalId = String(
    createForm.terminal_id || createdSample?.terminal_id || selectedTerminalId || '',
  )

  const { hydrometerOptions, thermometerOptions, kfEquipmentOptions, balanceOptions, thermohygrometerOptions } =
    useSampleEquipmentOptions(equipments, equipmentTerminalId)

  useSampleApiCalculation({ isResultsOpen, accessToken, tokenType, resultsForm, setResultsForm })

  const { kfFactorHelper } = useSampleKfFactor({
    isResultsOpen,
    accessToken,
    tokenType,
    kfEquipmentId: resultsForm.water.kf_equipment_id,
    kfEquipmentOptions,
    setResultsForm,
  })

  const { externalAnalysesError, externalRecordsError, activeExternalAnalyses, externalLatestByType } =
    useSampleExternalAnalyses({ isResultsOpen, resultsTerminalId, accessToken, tokenType })

  useEffect(() => {
    if (!isResultsOpen) return
    const nextValue = calculateWaterPercent(
      resultsForm.water.water_volume_consumed,
      resultsForm.water.water_volume_unit,
      resultsForm.water.kf_factor_avg,
      resultsForm.water.water_sample_weight,
      resultsForm.water.water_sample_weight_unit,
    )
    setResultsForm((prev) => ({ ...prev, water: { ...prev.water, value: nextValue } }))
  }, [
    isResultsOpen,
    resultsForm.water.water_volume_consumed,
    resultsForm.water.water_volume_unit,
    resultsForm.water.kf_factor_avg,
    resultsForm.water.water_sample_weight,
    resultsForm.water.water_sample_weight_unit,
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
    const tempFStart = convertTemperatureToF(resultsForm.api.temp_obs_start, resultsForm.api.temp_unit)
    const tempFEnd = convertTemperatureToF(resultsForm.api.temp_obs_end, resultsForm.api.temp_unit)
    const labTempRaw = String(resultsForm.lab_temperature || '').trim()
    if (!hasAllTempInputs || !labTempRaw || tempFStart === null || tempFEnd === null) {
      setResultsForm((prev) => ({ ...prev, lab_temp_error: '' }))
      return
    }
    const labTempF = convertTemperatureToF(labTempRaw, resultsForm.lab_temperature_unit)
    if (labTempF === null) {
      setResultsForm((prev) => ({ ...prev, lab_temp_error: '' }))
      return
    }
    const avgTempF = (Number(tempFStart) + Number(tempFEnd)) / 2
    const diff = Math.abs(labTempF - avgTempF)
    if (diff > 5) {
      setResultsForm((prev) => ({
        ...prev,
        lab_temp_error: 'La diferencia con la temperatura promedio debe ser <= 5 F.',
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

  useEffect(() => {
    if (!selectedTerminalId) return setPage(1)
  }, [selectedTerminalId])

  const filteredSamples = useMemo(() => {
    const safeSamples = Array.isArray(samples) ? samples : []
    const search = String(query || '').trim().toLowerCase()
    if (!search) return safeSamples
    return safeSamples.filter((sample) => {
      const analysis = Array.isArray(sample.analyses) ? sample.analyses[0] : null
      const haystack = [sample.code, analysis?.analysis_type, analysis?.product_name]
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

  const sampleRequiresUpdateReason = resultsMode === 'edit' && hasSamplePassed24Hours(createdSample)
  const sampleLastUpdateReason = String(createdSample?.last_update_reason || '').trim()
  const isSampleModified = Boolean(sampleLastUpdateReason)

  const openResultsForSample = (sample, mode) => {
    if (!sample) return
    const analyses = Array.isArray(sample.analyses) ? sample.analyses : []
    const apiAnalysis = analyses.find((item) => item?.analysis_type === 'api_astm_1298') || null
    const waterAnalysis = analyses.find((item) => item?.analysis_type === 'water_astm_4377') || null
    setCreatedSample(sample)
    setResultsMode(mode)
    setUpdateReason(sample.last_update_reason || '')
    setUpdateReasonError('')
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
        hydrometer_id: apiAnalysis?.hydrometer_id ? String(apiAnalysis.hydrometer_id) : '',
        thermometer_id: apiAnalysis?.thermometer_id ? String(apiAnalysis.thermometer_id) : '',
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
          waterAnalysis?.kf_equipment_id !== undefined && waterAnalysis?.kf_equipment_id !== null
            ? String(waterAnalysis.kf_equipment_id)
            : '',
        water_balance_id:
          waterAnalysis?.water_balance_id !== undefined && waterAnalysis?.water_balance_id !== null
            ? String(waterAnalysis.water_balance_id)
            : '',
        water_sample_weight:
          waterAnalysis?.water_sample_weight !== undefined &&
          waterAnalysis?.water_sample_weight !== null
            ? String(waterAnalysis.water_sample_weight)
            : '',
        water_sample_weight_unit: waterAnalysis?.water_sample_weight_unit || 'g',
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

  const isEditDisabledForUser = () =>
    String(currentUser?.user_type || '').toLowerCase() === 'visitor'

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return
    try {
      await deleteSampleMutation.mutateAsync({ tokenType, accessToken, sampleId: deleteTarget.id })
      setToast({ open: true, message: 'Muestra eliminada correctamente.', severity: 'success' })
      setDeleteTarget(null)
    } catch (err) {
      setToast({ open: true, message: err?.detail || 'No se pudo eliminar la muestra.', severity: 'error' })
    }
  }

  const handleCreateSave = async () => {
    const terminalId = String(createForm.terminal_id || '').trim()
    if (!terminalId) {
      setToast({ open: true, message: 'Selecciona un terminal.', severity: 'error' })
      return
    }
    if (!String(createForm.identifier || '').trim()) {
      setToast({ open: true, message: 'El identificador es obligatorio.', severity: 'error' })
      return
    }
    if (!createForm.analyses || createForm.analyses.length === 0) {
      setToast({ open: true, message: 'Selecciona al menos un análisis.', severity: 'error' })
      return
    }
    setIsCreating(true)
    try {
      const created = await createSampleMutation.mutateAsync({
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
      setToast({ open: true, message: 'Muestra creada correctamente.', severity: 'success' })
      setIsCreateOpen(false)
      setCreatedSample(created)
      setResultsMode('create')
      setUpdateReason('')
      setUpdateReasonError('')
      setQuery('')
      setResultsForm((prev) => ({
        ...prev,
        product_name: 'Crudo',
        analyzed_at: new Date().toISOString().slice(0, 10),
        thermohygrometer_id: '',
        lab_humidity: '',
        lab_temperature: '',
        lab_temperature_unit: 'f',
        identifier: created?.identifier || createForm.identifier?.trim() || '',
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
    } catch (err) {
      setToast({ open: true, message: err?.detail || 'No se pudo crear la muestra.', severity: 'error' })
    } finally {
      setIsCreating(false)
    }
  }

  const handleResultsSave = async () => {
    if (!createdSample?.id) return
    const normalizedUpdateReason = String(updateReason || '').trim()
    if (sampleRequiresUpdateReason && !normalizedUpdateReason) {
      setUpdateReasonError(
        'Debes indicar el motivo de la modificacion para muestras con mas de 24 horas.',
      )
      setToast({
        open: true,
        message: 'Debes indicar el motivo de la modificacion para muestras con mas de 24 horas.',
        severity: 'error',
      })
      return
    }
    setUpdateReasonError('')
    const analyzedAtRaw =
      resultsForm.analyzed_at || createdSample?.analyzed_at || createdSample?.created_at || null
    const analyzedAt = analyzedAtRaw ? new Date(analyzedAtRaw).toISOString() : null
    const normalizedIdentifier = String(resultsForm.identifier || '').trim()
    const resolvedIdentifier =
      resultsMode === 'edit'
        ? normalizedIdentifier || null
        : String(createdSample?.identifier || normalizedIdentifier || '').trim() || null
    setIsSavingResults(true)
    try {
      if (createForm.analyses.includes('api_astm_1298')) {
        const tempFStart = convertTemperatureToF(resultsForm.api.temp_obs_start, resultsForm.api.temp_unit)
        const tempFEnd = convertTemperatureToF(resultsForm.api.temp_obs_end, resultsForm.api.temp_unit)
        if (tempFStart !== null && tempFEnd !== null) {
          const diff = Math.abs(Number(tempFStart) - Number(tempFEnd))
          if (diff > 0.5) {
            setToast({ open: true, message: 'La diferencia entre temperaturas debe ser <= 0.5 F.', severity: 'error' })
            setIsSavingResults(false)
            return
          }
        }
        const selectedThermometer = thermometerOptions.find(
          (item) => String(item.id) === String(resultsForm.api.thermometer_id),
        )
        if (selectedThermometer) {
          const tempSpec = getMeasureSpec(selectedThermometer, 'temperature')
          const tempStartC = convertTemperatureToC(resultsForm.api.temp_obs_start, resultsForm.api.temp_unit)
          const tempEndC = convertTemperatureToC(resultsForm.api.temp_obs_end, resultsForm.api.temp_unit)
          if (isOutsideSpecRange(tempStartC, tempSpec) || isOutsideSpecRange(tempEndC, tempSpec)) {
            setToast({ open: true, message: 'La temperatura observada esta fuera del rango del termometro.', severity: 'error' })
            setIsSavingResults(false)
            return
          }
        }
        const selectedHydrometer = hydrometerOptions.find(
          (item) => String(item.id) === String(resultsForm.api.hydrometer_id),
        )
        if (selectedHydrometer) {
          const apiSpec = getMeasureSpec(selectedHydrometer, 'api')
          const apiValue = Number(resultsForm.api.lectura_api)
          if (resultsForm.api.lectura_api !== '' && !Number.isNaN(apiValue) && isOutsideSpecRange(apiValue, apiSpec)) {
            setToast({ open: true, message: 'La lectura API esta fuera del rango del hidrometro.', severity: 'error' })
            setIsSavingResults(false)
            return
          }
        }
      }
      const selectedThermo = thermohygrometerOptions.find(
        (item) => String(item.id) === String(resultsForm.thermohygrometer_id),
      )
      if (selectedThermo) {
        const { temperature, relativeHumidity } = getThermoSpecs(selectedThermo)
        const humidityValue = Number(resultsForm.lab_humidity)
        if (resultsForm.lab_humidity !== '' && !Number.isNaN(humidityValue) && relativeHumidity) {
          if (
            (relativeHumidity.min_value !== null && humidityValue < relativeHumidity.min_value) ||
            (relativeHumidity.max_value !== null && humidityValue > relativeHumidity.max_value)
          ) {
            setToast({ open: true, message: 'La humedad relativa esta fuera del rango del termohigrometro.', severity: 'error' })
            setIsSavingResults(false)
            return
          }
        }
        const tempValueC = convertTemperatureToC(resultsForm.lab_temperature, resultsForm.lab_temperature_unit)
        if (resultsForm.lab_temperature !== '' && tempValueC !== null && temperature) {
          if (
            (temperature.min_value !== null && tempValueC < temperature.min_value) ||
            (temperature.max_value !== null && tempValueC > temperature.max_value)
          ) {
            setToast({ open: true, message: 'La temperatura del laboratorio esta fuera del rango del termohigrometro.', severity: 'error' })
            setIsSavingResults(false)
            return
          }
        }
      }
      if (resultsForm.lab_temp_error) {
        setToast({ open: true, message: 'La temperatura del laboratorio debe estar a <= 5 F del promedio.', severity: 'error' })
        setIsSavingResults(false)
        return
      }
      if (
        createForm.analyses.includes('water_astm_4377') &&
        (!String(resultsForm.water.kf_factor_avg || '').trim() ||
          !String(resultsForm.water.kf_equipment_id || '').trim())
      ) {
        setToast({ open: true, message: 'Selecciona el equipo KF y el factor promedio para el analisis de agua.', severity: 'error' })
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
        setToast({ open: true, message: 'Selecciona la balanza, el peso, la unidad y el volumen para el analisis de agua.', severity: 'error' })
        setIsSavingResults(false)
        return
      }
      if (createForm.analyses.includes('water_astm_4377')) {
        const selectedBalance = balanceOptions.find(
          (item) => String(item.id) === String(resultsForm.water.water_balance_id),
        )
        if (selectedBalance) {
          const weightSpec = getMeasureSpec(selectedBalance, 'weight')
          const weightValueG = convertWeightToGrams(
            resultsForm.water.water_sample_weight,
            resultsForm.water.water_sample_weight_unit,
          )
          if (weightValueG !== null && isOutsideSpecRange(weightValueG, weightSpec)) {
            setToast({ open: true, message: 'El peso de muestra esta fuera del rango de la balanza.', severity: 'error' })
            setIsSavingResults(false)
            return
          }
        }
      }
      const analyses = createForm.analyses.map((analysisType) => {
        if (analysisType === 'api_astm_1298') {
          const tempFStart = convertTemperatureToF(resultsForm.api.temp_obs_start, resultsForm.api.temp_unit)
          const tempFEnd = convertTemperatureToF(resultsForm.api.temp_obs_end, resultsForm.api.temp_unit)
          const tempF =
            tempFStart === null || tempFEnd === null
              ? null
              : (Number(tempFStart) + Number(tempFEnd)) / 2
          return {
            analysis_type: 'api_astm_1298',
            product_name: resultsForm.product_name || 'Crudo',
            temp_obs_f: tempF === null ? null : Number(tempF),
            lectura_api: resultsForm.api.lectura_api === '' ? null : Number(resultsForm.api.lectura_api),
            hydrometer_id: resultsForm.api.hydrometer_id ? Number(resultsForm.api.hydrometer_id) : null,
            thermometer_id: resultsForm.api.thermometer_id ? Number(resultsForm.api.thermometer_id) : null,
          }
        }
        if (analysisType === 'water_astm_4377') {
          return {
            analysis_type: 'water_astm_4377',
            product_name: resultsForm.product_name || 'Crudo',
            water_value: resultsForm.water.value === '' ? null : Number(resultsForm.water.value),
            kf_factor_avg: resultsForm.water.kf_factor_avg === '' ? null : Number(resultsForm.water.kf_factor_avg),
            kf_equipment_id: resultsForm.water.kf_equipment_id === '' ? null : Number(resultsForm.water.kf_equipment_id),
            water_balance_id: resultsForm.water.water_balance_id === '' ? null : Number(resultsForm.water.water_balance_id),
            water_sample_weight: resultsForm.water.water_sample_weight === '' ? null : Number(resultsForm.water.water_sample_weight),
            water_sample_weight_unit: resultsForm.water.water_sample_weight_unit || null,
            water_volume_consumed: resultsForm.water.water_volume_consumed === '' ? null : Number(resultsForm.water.water_volume_consumed),
            water_volume_unit: resultsForm.water.water_volume_unit || null,
          }
        }
        return { analysis_type: analysisType, product_name: resultsForm.product_name || 'Crudo' }
      })
      await updateSampleMutation.mutateAsync({
        tokenType,
        accessToken,
        sampleId: createdSample.id,
        payload: {
          product_name: resultsForm.product_name || 'Crudo',
          analyzed_at: analyzedAt,
          identifier: resolvedIdentifier,
          thermohygrometer_id:
            resultsForm.thermohygrometer_id === '' ? null : Number(resultsForm.thermohygrometer_id),
          lab_humidity: resultsForm.lab_humidity === '' ? null : Number(resultsForm.lab_humidity),
          lab_temperature:
            resultsForm.lab_temperature === ''
              ? null
              : Number(convertTemperatureToF(resultsForm.lab_temperature, resultsForm.lab_temperature_unit)),
          analyses,
          update_reason: normalizedUpdateReason || null,
        },
      })
      setToast({ open: true, message: 'Resultados guardados correctamente.', severity: 'success' })
      setIsResultsOpen(false)
    } catch (err) {
      setToast({ open: true, message: err?.detail || 'No se pudieron guardar los resultados.', severity: 'error' })
    } finally {
      setIsSavingResults(false)
    }
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
          pb: 1.5,
          borderBottom: '2px solid rgba(227, 28, 121, 0.15)',
        }}
      >
        <Box>
          <Typography
            component="h2"
            variant="h5"
            sx={{ fontWeight: 700, color: 'secondary.dark', lineHeight: 1.2 }}
          >
            Muestras
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Gestiona las muestras del laboratorio
          </Typography>
        </Box>
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
          sx={{ borderColor: 'rgba(227, 28, 121, 0.4)', color: 'secondary.main', height: 40 }}
        >
          Limpiar filtros
        </Button>
        <Chip
          label={`${filteredSamples.length} resultados`}
          size="small"
          sx={{ backgroundColor: 'primary.light', color: 'primary.main', fontWeight: 600 }}
        />
      </Box>

      {samplesQueryError ? <Typography color="error">{samplesErrorMessage}</Typography> : null}

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
            background: '#ffffff',
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto',
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    backgroundColor: 'primary.light',
                    color: 'secondary.dark',
                    fontWeight: 700,
                    borderBottom: '2px solid rgba(227,28,121,0.2)',
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
                <TableCell align="center" sx={{ width: 140 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSamples.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary">Sin muestras.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pagedSamples.map((sample, index) => {
                  const analysis = Array.isArray(sample.analyses) ? sample.analyses[0] : null
                  const isModifiedSample = Boolean(String(sample?.last_update_reason || '').trim())
                  const isEditDisabled = isEditDisabledForUser()
                  const canDeleteThisSample =
                    canDeleteSample && sample.id === lastSampleId && isSampleEmpty(sample)
                  return (
                    <TableRow
                      key={sample.id}
                      hover
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fdfafe',
                        '&:hover': { backgroundColor: 'primary.light' },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                          <span>{sample.code || '-'}</span>
                          {isModifiedSample ? (
                            <Chip size="small" color="warning" variant="outlined" label="Modificada" />
                          ) : null}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {sample.created_at ? new Date(sample.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{analysis?.product_name || '-'}</TableCell>
                      <TableCell>{sample.identifier || '-'}</TableCell>
                      <TableCell>
                        {analysis?.api_60f !== undefined ? analysis.api_60f : '-'}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const waterAnalysis = Array.isArray(sample.analyses)
                            ? sample.analyses.find((item) => item?.analysis_type === 'water_astm_4377')
                            : null
                          return waterAnalysis?.water_value !== undefined && waterAnalysis?.water_value !== null
                            ? formatWaterValue(waterAnalysis.water_value) || '-'
                            : '-'
                        })()}
                      </TableCell>
                      <TableCell align="center" sx={{ width: 140 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            aria-label="Ver muestra"
                            onClick={() => openResultsForSample(sample, 'view')}
                            sx={{ color: '#64748b', '&:hover': { color: 'primary.main' } }}
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
            pt: 1,
            borderTop: '1px solid #f0f0f5',
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

      <SampleCreateDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        isCreating={isCreating}
        createForm={createForm}
        setCreateForm={setCreateForm}
        terminalOptions={terminalOptions}
        onSave={handleCreateSave}
      />

      <SampleResultsDialog
        open={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
        resultsMode={resultsMode}
        isSavingResults={isSavingResults}
        createdSample={createdSample}
        isSampleModified={isSampleModified}
        sampleRequiresUpdateReason={sampleRequiresUpdateReason}
        createForm={createForm}
        setCreateForm={setCreateForm}
        terminalOptions={terminalOptions}
        resultsForm={resultsForm}
        setResultsForm={setResultsForm}
        kfFactorHelper={kfFactorHelper}
        activeExternalAnalyses={activeExternalAnalyses}
        externalLatestByType={externalLatestByType}
        externalAnalysesError={externalAnalysesError}
        externalRecordsError={externalRecordsError}
        hydrometerOptions={hydrometerOptions}
        thermometerOptions={thermometerOptions}
        kfEquipmentOptions={kfEquipmentOptions}
        balanceOptions={balanceOptions}
        thermohygrometerOptions={thermohygrometerOptions}
        updateReason={updateReason}
        setUpdateReason={setUpdateReason}
        updateReasonError={updateReasonError}
        setUpdateReasonError={setUpdateReasonError}
        onSave={handleResultsSave}
        onCancel={() => setIsResultsOpen(false)}
      />

      <SampleDeleteDialog
        deleteTarget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

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
