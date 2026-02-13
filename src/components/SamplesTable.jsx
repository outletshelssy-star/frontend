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
  fetchSamplesByTerminal,
  updateSample,
} from '../services/api'

const SamplesTable = ({ terminals, equipments, currentUser, tokenType, accessToken }) => {
  const [selectedTerminalId, setSelectedTerminalId] = useState('')
  const [samples, setSamples] = useState([])
  const [samplesError, setSamplesError] = useState('')
  const [isSamplesLoading, setIsSamplesLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
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
    thermohygrometer_name: '',
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
    },
  })
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

  const equipmentTerminalId = isResultsOpen
    ? String(createForm.terminal_id || '')
    : String(selectedTerminalId || '')

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
      setSamples(items)
      if (options.jumpToSampleId) {
        const index = items.findIndex((item) => item.id === options.jumpToSampleId)
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

  const totalPages = Math.max(1, Math.ceil(filteredSamples.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pagedSamples = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return filteredSamples.slice(start, start + rowsPerPage)
  }, [filteredSamples, safePage, rowsPerPage])

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
      analyzed_at: sample.analyzed_at
        ? new Date(sample.analyzed_at).toISOString().slice(0, 10)
        : prev.analyzed_at,
      identifier: sample.identifier || '',
      thermohygrometer_name: sample.thermohygrometer_name || prev.thermohygrometer_name,
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
      },
    }))
    setIsResultsOpen(true)
  }

  const isEditDisabledForUser = (sample) => {
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
                <TableCell>Codigo</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell>Identificador</TableCell>
                <TableCell>API 60F</TableCell>
                <TableCell sx={{ width: 140 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSamples.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
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
                        <IconButton
                          size="small"
                          aria-label="Editar muestra"
                          disabled={isEditDisabled}
                          onClick={() => openResultsForSample(sample, 'edit')}
                          sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
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
            mt: 2,
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
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="outlined"
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <Button
              size="small"
              variant="outlined"
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
      >
        <DialogTitle>Crear muestra</DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gap: 2,
            pt: 2,
            overflow: 'visible',
            '& .MuiInputLabel-root': { backgroundColor: '#fff', px: 0.5 },
            '& .MuiOutlinedInput-root': { backgroundColor: '#fff' },
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
          />
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Analisis
            </Typography>
            <FormGroup>
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
                  thermohygrometer_name: '',
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
              return parts.join(' · ')
            })()}
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gap: 2,
            pt: 2,
            overflow: 'visible',
            '& .MuiInputLabel-root': { backgroundColor: '#fff', px: 0.5 },
            '& .MuiOutlinedInput-root': { backgroundColor: '#fff' },
          }}
        >
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <TextField
              label="Termohigrometro"
              value={resultsForm.thermohygrometer_name}
              size="small"
              fullWidth
              disabled={resultsMode === 'view'}
              onChange={(event) =>
                setResultsForm((prev) => ({
                  ...prev,
                  thermohygrometer_name: event.target.value,
                }))
              }
            />
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
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'minmax(0, 1fr) 90px' }}>
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
          ) : null}
          {createForm.analyses.includes('api_astm_1298') ? (
            <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1.5, display: 'grid', gap: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary">
                API ASTM 1298
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
                  <InputLabel id="api-temp-unit-label">Unidad temperatura</InputLabel>
                  <Select
                    labelId="api-temp-unit-label"
                    label="Unidad temperatura"
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
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <TextField
                  label="Temperatura observada inicial"
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
                  label="Temperatura observada final"
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
                label="Promedio temperatura"
                value={getAvgTempDisplay()}
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
                error={Boolean(resultsForm.api.temp_diff_error)}
                helperText={resultsForm.api.temp_diff_error || ' '}
              />
              </Box>
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
              <TextField
                label="API a 60F"
                value={resultsForm.api.api_60f}
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
                error={Boolean(resultsForm.api.api_60f_error)}
                helperText={resultsForm.api.api_60f_error || ' '}
              />
            </Box>
          ) : null}
          {createForm.analyses.includes('water_astm_4377') ? (
            <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1.5, display: 'grid', gap: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Agua ASTM 4377
              </Typography>
              <TextField
                label="Agua"
                type="number"
                value={resultsForm.water.value}
                size="small"
                fullWidth
                disabled={resultsMode === 'view'}
                onChange={(event) =>
                  setResultsForm((prev) => ({
                    ...prev,
                    water: { ...prev.water, value: event.target.value },
                  }))
                }
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsResultsOpen(false)}>Cerrar</Button>
          {resultsMode === 'view' ? null : (
            <Button
              variant="contained"
              disabled={isSavingResults || !createdSample?.id}
              onClick={async () => {
                if (!createdSample?.id) return
                const analyzedAt = resultsForm.analyzed_at
                  ? new Date(resultsForm.analyzed_at).toISOString()
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
