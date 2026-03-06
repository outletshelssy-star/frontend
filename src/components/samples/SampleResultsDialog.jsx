import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTE_OPTIONS = ['00', '15', '30', '45']
const VOLUME_OPTIONS = ['1/4 galón', '1/2 galón', '1 galón']
const RETENTION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 15, 30]
import {
  formatApi60fWithEquipmentResolution,
  formatSpecificGravityFromApi,
  formatWaterPercentByVolume,
  formatWaterValue,
  getAvgTempDisplay,
  getThermoLabel,
} from '../../utils/sampleUtils'
import { todayColombiaStr, formatDateCO } from '../../utils/dateUtils'

const SampleResultsDialog = ({
  open,
  onClose,
  resultsMode,
  isSavingResults,
  createdSample,
  isSampleModified,
  sampleRequiresUpdateReason,
  createForm,
  setCreateForm,
  terminalOptions,
  productTypeOptions,
  resultsForm,
  setResultsForm,
  kfFactorHelper,
  activeExternalAnalyses,
  externalLatestByType,
  externalAnalysesError,
  externalRecordsError,
  hydrometerOptions,
  thermometerOptions,
  kfEquipmentOptions,
  balanceOptions,
  thermohygrometerOptions,
  updateReason,
  setUpdateReason,
  updateReasonError,
  setUpdateReasonError,
  resultsInlineErrors,
  clearResultsInlineError,
  setResultsFieldRef,
  onSave,
  onCancel,
  onEdit,
  canEdit,
  analysisDateMin,
  analysisDateMax,
}) => {
  const sampleLastUpdateReason = String(createdSample?.last_update_reason || '').trim()
  const baseProductOptions =
    Array.isArray(productTypeOptions) && productTypeOptions.length > 0
      ? productTypeOptions
      : [{ value: 'Crudo', label: 'Crudo - Crudo' }]
  const selectedProductName = String(resultsForm.product_name || '').trim()
  const hasSelectedProduct = baseProductOptions.some(
    (item) => String(item?.value || '').trim().toLowerCase() === selectedProductName.toLowerCase(),
  )
  const resolvedProductOptions =
    selectedProductName && !hasSelectedProduct
      ? [{ value: selectedProductName, label: selectedProductName }, ...baseProductOptions]
      : baseProductOptions
  const getInlineError = (fieldKey) => String(resultsInlineErrors?.[fieldKey] || '')
  const selectedHydrometer = hydrometerOptions.find(
    (item) => String(item?.id || '') === String(resultsForm.api.hydrometer_id || ''),
  )
  const api60fDisplay = formatApi60fWithEquipmentResolution(
    resultsForm.api.api_60f,
    selectedHydrometer,
  )
  const specificGravityDisplay = formatSpecificGravityFromApi(api60fDisplay)
  const waterPercentVolumeDisplay = formatWaterPercentByVolume(
    resultsForm.water.value,
    specificGravityDisplay,
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { maxWidth: 1400, height: '95vh' } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(227, 28, 121, 0.15)',
          pb: 1.5,
        }}
      >
        <Typography component="span" variant="h6">
          {resultsMode === 'create'
            ? 'Registrar resultados'
            : resultsMode === 'edit'
              ? 'Editar resultados'
              : 'Resultados de análisis'}
        </Typography>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              backgroundColor: 'primary.light',
              color: 'secondary.dark',
              fontWeight: 700,
            }}
          >
            {(() => {
              const terminalName =
                terminalOptions.find(
                  (terminal) => String(terminal.id) === String(createForm.terminal_id),
                )?.name || ''
              const code = createdSample?.code || ''
              const identifier = createdSample?.identifier || ''
              const parts = [terminalName, code, identifier].filter(Boolean)
              return parts.join(' - ')
            })()}
          </Box>
          {isSampleModified ? <Chip size="small" color="warning" label="Modificada" /> : null}
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'grid',
          gap: 1,
          pt: '12px !important',
          overflow: 'auto',
          '& .MuiInputLabel-root.MuiInputLabel-shrink': {
            backgroundColor: '#fff',
            px: 0.5,
            zIndex: 2,
          },
          '& .MuiOutlinedInput-root': { backgroundColor: '#fff' },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: '4px 12px',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            alignItems: 'start',
          }}
        >
          {/* Etiquetas — fila 1 */}
          <Typography variant="subtitle2" color="text.secondary">
            Campos generales
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ display: { xs: 'none', lg: 'block' } }}>
            Condiciones de laboratorio
          </Typography>

          {/* Campos generales — fila 2 col 1 */}
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {/* Sub-fila 1: Producto | Fecha | Hora | Min */}
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '3fr 2fr 1fr 1fr' }}>
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
                  {resolvedProductOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Fecha análisis"
                type="date"
                value={resultsForm.analyzed_at}
                size="small"
                fullWidth
                inputRef={setResultsFieldRef?.('analyzed_at')}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: analysisDateMin || undefined,
                  max: analysisDateMax || todayColombiaStr(),
                }}
                error={Boolean(getInlineError('analyzed_at'))}
                helperText={getInlineError('analyzed_at') || ''}
                disabled={resultsMode === 'view'}
                onChange={(event) => {
                  clearResultsInlineError?.('analyzed_at')
                  setResultsForm((prev) => ({
                    ...prev,
                    analyzed_at: event.target.value,
                  }))
                }}
              />
              <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
                <InputLabel id="results-hour-label">Hora</InputLabel>
                <Select
                  labelId="results-hour-label"
                  label="Hora"
                  value={resultsForm.analyzed_hour ?? '00'}
                  onChange={(event) =>
                    setResultsForm((prev) => ({ ...prev, analyzed_hour: event.target.value }))
                  }
                >
                  {HOUR_OPTIONS.map((h) => (
                    <MenuItem key={h} value={h}>{h}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
                <InputLabel id="results-minute-label">Min</InputLabel>
                <Select
                  labelId="results-minute-label"
                  label="Min"
                  value={resultsForm.analyzed_minute ?? '00'}
                  onChange={(event) =>
                    setResultsForm((prev) => ({ ...prev, analyzed_minute: event.target.value }))
                  }
                >
                  {MINUTE_OPTIONS.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {/* Sub-fila 2: Identificador (edit/view) | Cantidad | Retención */}
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: resultsMode !== 'create' ? '1.5fr 1fr 1fr' : '1fr 1fr',
              }}
            >
              {resultsMode !== 'create' ? (
                <TextField
                  label="Identificador"
                  size="small"
                  fullWidth
                  value={resultsForm.identifier}
                  disabled={resultsMode === 'view'}
                  onChange={(event) =>
                    setResultsForm((prev) => ({
                      ...prev,
                      identifier: event.target.value,
                    }))
                  }
                />
              ) : null}
              <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
                <InputLabel id="results-volume-label">Cantidad</InputLabel>
                <Select
                  labelId="results-volume-label"
                  label="Cantidad"
                  value={resultsForm.volume || ''}
                  onChange={(event) =>
                    setResultsForm((prev) => ({ ...prev, volume: event.target.value }))
                  }
                >
                  <MenuItem value=""><em>Sin especificar</em></MenuItem>
                  {VOLUME_OPTIONS.map((v) => (
                    <MenuItem key={v} value={v}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
                <InputLabel id="results-retention-label">Retención (días)</InputLabel>
                <Select
                  labelId="results-retention-label"
                  label="Retención (días)"
                  value={resultsForm.retention_days || ''}
                  onChange={(event) =>
                    setResultsForm((prev) => ({ ...prev, retention_days: event.target.value }))
                  }
                >
                  <MenuItem value=""><em>Sin especificar</em></MenuItem>
                  {resultsForm.retention_days &&
                    !RETENTION_OPTIONS.some((d) => String(d) === String(resultsForm.retention_days)) && (
                      <MenuItem value={String(resultsForm.retention_days)} disabled>
                        {resultsForm.retention_days} días
                      </MenuItem>
                    )}
                  {RETENTION_OPTIONS.map((d) => (
                    <MenuItem key={d} value={String(d)}>{d} días</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Condiciones de laboratorio — fila 2 col 2 */}
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: { xs: 'block', lg: 'none' }, mt: 1 }}>
              Condiciones de laboratorio
            </Typography>
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '2fr 1fr 1fr 80px' }}>
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
                  {resultsForm.thermohygrometer_id &&
                    !thermohygrometerOptions.some(
                      (item) => String(item.id) === String(resultsForm.thermohygrometer_id),
                    ) && (
                      <MenuItem value={String(resultsForm.thermohygrometer_id)} disabled>
                        ID {resultsForm.thermohygrometer_id} (no disponible)
                      </MenuItem>
                    )}
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
                label="Humedad (%)"
                type="number"
                value={resultsForm.lab_humidity}
                size="small"
                fullWidth
                inputRef={setResultsFieldRef?.('lab_humidity')}
                error={Boolean(getInlineError('lab_humidity'))}
                helperText={getInlineError('lab_humidity') || ''}
                disabled={resultsMode === 'view'}
                onChange={(event) => {
                  clearResultsInlineError?.('lab_humidity')
                  setResultsForm((prev) => ({
                    ...prev,
                    lab_humidity: event.target.value,
                  }))
                }}
              />
              <TextField
                label="Temperatura"
                type="number"
                value={resultsForm.lab_temperature}
                size="small"
                fullWidth
                inputRef={setResultsFieldRef?.('lab_temperature')}
                error={Boolean(getInlineError('lab_temperature')) || Boolean(resultsForm.lab_temp_error)}
                helperText={getInlineError('lab_temperature') || resultsForm.lab_temp_error || ' '}
                disabled={resultsMode === 'view'}
                onChange={(event) => {
                  clearResultsInlineError?.('lab_temperature')
                  setResultsForm((prev) => ({
                    ...prev,
                    lab_temperature: event.target.value,
                  }))
                }}
              />
              <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
                <InputLabel id="lab-temp-unit-label">Unidad</InputLabel>
                <Select
                  labelId="lab-temp-unit-label"
                  label="Unidad"
                  value={resultsForm.lab_temperature_unit}
                  onChange={(event) => {
                    clearResultsInlineError?.('lab_temperature')
                    setResultsForm((prev) => ({
                      ...prev,
                      lab_temperature_unit: String(event.target.value || 'f'),
                    }))
                  }}
                >
                  <MenuItem value="f">F</MenuItem>
                  <MenuItem value="c">C</MenuItem>
                  <MenuItem value="k">K</MenuItem>
                  <MenuItem value="r">R</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
        {resultsMode === 'edit' ? (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25 }}>
              Análisis
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
        {createForm.analyses.includes('api_astm_1298') ||
        createForm.analyses.includes('water_astm_4377') ? (
          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            }}
          >
            {createForm.analyses.includes('api_astm_1298') ? (
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  p: 1.5,
                  display: 'grid',
                  gap: 1.5,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  API ASTM 1298
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', sm: '2fr 0.7fr' },
                  }}
                >
                  <FormControl
                    size="small"
                    fullWidth
                    disabled={resultsMode === 'view'}
                    error={Boolean(getInlineError('api_thermometer_id'))}
                  >
                    <InputLabel id="api-thermometer-label">Termometro</InputLabel>
                    <Select
                      labelId="api-thermometer-label"
                      label="Termometro"
                      value={resultsForm.api.thermometer_id}
                      inputRef={setResultsFieldRef?.('api_thermometer_id')}
                      onChange={(event) => {
                        clearResultsInlineError?.('api_thermometer_id')
                        setResultsForm((prev) => ({
                          ...prev,
                          api: { ...prev.api, thermometer_id: String(event.target.value || '') },
                        }))
                      }}
                    >
                      {thermometerOptions.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>
                          {getThermoLabel(item)}
                        </MenuItem>
                      ))}
                    </Select>
                    {getInlineError('api_thermometer_id') ? (
                      <FormHelperText>{getInlineError('api_thermometer_id')}</FormHelperText>
                    ) : null}
                  </FormControl>
                  <FormControl size="small" fullWidth disabled={resultsMode === 'view'}>
                    <InputLabel id="api-temp-unit-label">Unidad</InputLabel>
                    <Select
                      labelId="api-temp-unit-label"
                      label="Unidad"
                      value={resultsForm.api.temp_unit}
                      onChange={(event) => {
                        clearResultsInlineError?.('api_temp_obs_start')
                        clearResultsInlineError?.('api_temp_obs_end')
                        setResultsForm((prev) => ({
                          ...prev,
                          api: { ...prev.api, temp_unit: String(event.target.value || 'f') },
                        }))
                      }}
                    >
                      <MenuItem value="f">F</MenuItem>
                      <MenuItem value="c">C</MenuItem>
                      <MenuItem value="k">K</MenuItem>
                      <MenuItem value="r">R</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                  }}
                >
                  <TextField
                    label="Temp observada inicial"
                    type="number"
                    value={resultsForm.api.temp_obs_start}
                    size="small"
                    fullWidth
                    inputRef={setResultsFieldRef?.('api_temp_obs_start')}
                    error={Boolean(getInlineError('api_temp_obs_start'))}
                    helperText={getInlineError('api_temp_obs_start') || ''}
                    disabled={resultsMode === 'view'}
                    onChange={(event) => {
                      clearResultsInlineError?.('api_temp_obs_start')
                      clearResultsInlineError?.('api_temp_obs_end')
                      setResultsForm((prev) => ({
                        ...prev,
                        api: { ...prev.api, temp_obs_start: event.target.value },
                      }))
                    }}
                  />
                  <TextField
                    label="Temp observada final"
                    type="number"
                    value={resultsForm.api.temp_obs_end}
                    size="small"
                    fullWidth
                    inputRef={setResultsFieldRef?.('api_temp_obs_end')}
                    error={Boolean(getInlineError('api_temp_obs_end'))}
                    helperText={getInlineError('api_temp_obs_end') || ''}
                    disabled={resultsMode === 'view'}
                    onChange={(event) => {
                      clearResultsInlineError?.('api_temp_obs_start')
                      clearResultsInlineError?.('api_temp_obs_end')
                      setResultsForm((prev) => ({
                        ...prev,
                        api: { ...prev.api, temp_obs_end: event.target.value },
                      }))
                    }}
                  />
                  <TextField
                    label="Temp promedio (calc.)"
                    value={getAvgTempDisplay(
                      resultsForm.api.temp_obs_start,
                      resultsForm.api.temp_obs_end,
                      resultsForm.api.temp_unit,
                    )}
                    size="small"
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: '#f1f5f9',
                        fontStyle: 'italic',
                        color: 'text.secondary',
                      },
                    }}
                    error={Boolean(resultsForm.api.temp_diff_error)}
                    helperText={resultsForm.api.temp_diff_error || undefined}
                    FormHelperTextProps={{ sx: { m: 0, mt: 0.25 } }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', sm: '2fr 0.7fr' },
                  }}
                >
                  <FormControl
                    size="small"
                    fullWidth
                    disabled={resultsMode === 'view'}
                    error={Boolean(getInlineError('api_hydrometer_id'))}
                  >
                    <InputLabel id="api-hydrometer-label">Hidrometro</InputLabel>
                    <Select
                      labelId="api-hydrometer-label"
                      label="Hidrometro"
                      value={resultsForm.api.hydrometer_id}
                      inputRef={setResultsFieldRef?.('api_hydrometer_id')}
                      onChange={(event) => {
                        clearResultsInlineError?.('api_hydrometer_id')
                        clearResultsInlineError?.('api_lectura_api')
                        setResultsForm((prev) => ({
                          ...prev,
                          api: { ...prev.api, hydrometer_id: String(event.target.value || '') },
                        }))
                      }}
                    >
                      {hydrometerOptions.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>
                          {getThermoLabel(item)}
                        </MenuItem>
                      ))}
                    </Select>
                    {getInlineError('api_hydrometer_id') ? (
                      <FormHelperText>{getInlineError('api_hydrometer_id')}</FormHelperText>
                    ) : null}
                  </FormControl>
                  <TextField
                    label="Lectura API"
                    type="number"
                    value={resultsForm.api.lectura_api}
                    size="small"
                    fullWidth
                    inputRef={setResultsFieldRef?.('api_lectura_api')}
                    error={
                      Boolean(getInlineError('api_lectura_api')) ||
                      Boolean(resultsForm.api.api_60f_error)
                    }
                    helperText={
                      getInlineError('api_lectura_api') || resultsForm.api.api_60f_error || ''
                    }
                    disabled={resultsMode === 'view'}
                    onChange={(event) => {
                      clearResultsInlineError?.('api_lectura_api')
                      setResultsForm((prev) => ({
                        ...prev,
                        api: { ...prev.api, lectura_api: event.target.value },
                      }))
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    border: '1px solid #dbeafe',
                    backgroundColor: '#eff6ff',
                    borderRadius: 1,
                    p: 1,
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  }}
                >
                  <Box
                    sx={{
                      textAlign: 'center',
                      alignItems: 'center',
                      display: 'grid',
                      gap: 0.25,
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                      {api60fDisplay || '--'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                    API 60 °F
                  </Typography>
                </Box>
                <Box
                  sx={{
                    textAlign: 'center',
                    alignItems: 'center',
                    display: 'grid',
                    gap: 0.25,
                    borderLeft: { xs: 'none', sm: '1px solid #bfdbfe' },
                    pl: { xs: 0, sm: 1 },
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                    {specificGravityDisplay || '--'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Gravedad especifica
                  </Typography>
                </Box>
              </Box>
              </Box>
            ) : null}
            {createForm.analyses.includes('water_astm_4377') ? (
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  p: 1.5,
                  display: 'grid',
                  gap: 1.5,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Agua ASTM 4377
                </Typography>
                <FormControl
                  size="small"
                  fullWidth
                  error={Boolean(getInlineError('water_balance_id'))}
                >
                  <InputLabel id="water-balance-label">Balanza</InputLabel>
                  <Select
                    labelId="water-balance-label"
                    label="Balanza"
                    value={resultsForm.water.water_balance_id}
                    disabled={resultsMode === 'view'}
                    onChange={(event) => {
                      clearResultsInlineError?.('water_balance_id')
                      setResultsForm((prev) => ({
                        ...prev,
                        water: { ...prev.water, water_balance_id: event.target.value },
                      }))
                    }}
                  >
                    {balanceOptions.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)}>
                        {getThermoLabel(item)}
                      </MenuItem>
                    ))}
                  </Select>
                  {getInlineError('water_balance_id') ? (
                    <FormHelperText>{getInlineError('water_balance_id')}</FormHelperText>
                  ) : null}
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
                    error={Boolean(getInlineError('water_sample_weight'))}
                    helperText={getInlineError('water_sample_weight') || ''}
                    disabled={resultsMode === 'view'}
                    onChange={(event) => {
                      clearResultsInlineError?.('water_sample_weight')
                      setResultsForm((prev) => ({
                        ...prev,
                        water: { ...prev.water, water_sample_weight: event.target.value },
                      }))
                    }}
                  />
                  <FormControl
                    size="small"
                    fullWidth
                    error={Boolean(getInlineError('water_sample_weight_unit'))}
                  >
                    <InputLabel id="water-weight-unit-label">Unidad peso</InputLabel>
                    <Select
                      labelId="water-weight-unit-label"
                      label="Unidad peso"
                      value={resultsForm.water.water_sample_weight_unit || 'g'}
                      disabled={resultsMode === 'view'}
                      onChange={(event) => {
                        clearResultsInlineError?.('water_sample_weight_unit')
                        setResultsForm((prev) => ({
                          ...prev,
                          water: {
                            ...prev.water,
                            water_sample_weight_unit: event.target.value,
                          },
                        }))
                      }}
                    >
                      <MenuItem value="g">g</MenuItem>
                      <MenuItem value="mg">mg</MenuItem>
                    </Select>
                    {getInlineError('water_sample_weight_unit') ? (
                      <FormHelperText>{getInlineError('water_sample_weight_unit')}</FormHelperText>
                    ) : null}
                  </FormControl>
                  </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', sm: '2fr 0.7fr' },
                  }}
                >
                  <FormControl
                    size="small"
                    fullWidth
                    error={Boolean(getInlineError('water_kf_equipment_id'))}
                  >
                    <InputLabel id="kf-equipment-label">Equipo KF</InputLabel>
                    <Select
                      labelId="kf-equipment-label"
                      label="Equipo KF"
                      value={resultsForm.water.kf_equipment_id}
                      disabled={resultsMode === 'view'}
                      onChange={(event) => {
                        clearResultsInlineError?.('water_kf_equipment_id')
                        clearResultsInlineError?.('water_kf_factor_avg')
                        setResultsForm((prev) => ({
                          ...prev,
                          water: { ...prev.water, kf_equipment_id: event.target.value },
                        }))
                      }}
                    >
                      {kfEquipmentOptions.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>
                          {getThermoLabel(item)}
                        </MenuItem>
                      ))}
                    </Select>
                    {getInlineError('water_kf_equipment_id') ? (
                      <FormHelperText>{getInlineError('water_kf_equipment_id')}</FormHelperText>
                    ) : null}
                  </FormControl>
                  <TextField
                    label="Factor KF (auto)"
                    type="number"
                    value={resultsForm.water.kf_factor_avg}
                    size="small"
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: '#f1f5f9',
                        fontStyle: 'italic',
                        color: 'text.secondary',
                      },
                    }}
                    helperText={getInlineError('water_kf_factor_avg') || kfFactorHelper || undefined}
                    error={Boolean(getInlineError('water_kf_factor_avg')) || Boolean(kfFactorHelper)}
                    FormHelperTextProps={{ sx: { m: 0, mt: 0.25 } }}
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
                    error={Boolean(getInlineError('water_volume_consumed'))}
                    helperText={getInlineError('water_volume_consumed') || ''}
                    disabled={resultsMode === 'view'}
                    onChange={(event) => {
                      clearResultsInlineError?.('water_volume_consumed')
                      setResultsForm((prev) => ({
                        ...prev,
                        water: { ...prev.water, water_volume_consumed: event.target.value },
                      }))
                    }}
                  />
                  <FormControl
                    size="small"
                    fullWidth
                    error={Boolean(getInlineError('water_volume_unit'))}
                  >
                    <InputLabel id="water-volume-unit-label">Unidad volumen</InputLabel>
                    <Select
                      labelId="water-volume-unit-label"
                      label="Unidad volumen"
                      value={resultsForm.water.water_volume_unit || 'mL'}
                      disabled={resultsMode === 'view'}
                      onChange={(event) => {
                        clearResultsInlineError?.('water_volume_unit')
                        setResultsForm((prev) => ({
                          ...prev,
                          water: {
                            ...prev.water,
                            water_volume_unit: event.target.value,
                          },
                        }))
                      }}
                    >
                      <MenuItem value="mL">mL</MenuItem>
                      <MenuItem value="L">L</MenuItem>
                    </Select>
                    {getInlineError('water_volume_unit') ? (
                      <FormHelperText>{getInlineError('water_volume_unit')}</FormHelperText>
                    ) : null}
                  </FormControl>
                </Box>
                <Box
                  sx={{
                    border: '1px solid #dcfce7',
                    backgroundColor: '#f0fdf4',
                    borderRadius: 1,
                    p: 1,
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: specificGravityDisplay ? '1fr 1fr' : '1fr',
                    },
                  }}
                >
                  <Box
                    sx={{
                      textAlign: 'center',
                      alignItems: 'center',
                      display: 'grid',
                      gap: 0.25,
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#15803d' }}>
                      {formatWaterValue(resultsForm.water.value) || '--'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      % p/p Agua
                    </Typography>
                  </Box>
                  {specificGravityDisplay ? (
                    <Box
                      sx={{
                        textAlign: 'center',
                        alignItems: 'center',
                        display: 'grid',
                        gap: 0.25,
                        borderLeft: { xs: 'none', sm: '1px solid #bbf7d0' },
                        pl: { xs: 0, sm: 1 },
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#15803d' }}>
                        {waterPercentVolumeDisplay || '--'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        % p/v Agua
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              </Box>
            ) : null}
          </Box>
        ) : null}
        {sampleRequiresUpdateReason ? (
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Alert severity="warning">
              Esta muestra tiene mas de 24 horas. Indica el motivo de la modificacion para guardar
              cambios.
            </Alert>
            <TextField
              label="Motivo de la modificacion"
              value={updateReason}
              inputRef={setResultsFieldRef?.('update_reason')}
              onChange={(event) => {
                setUpdateReason(event.target.value)
                if (updateReasonError) setUpdateReasonError('')
              }}
              size="small"
              fullWidth
              required
              multiline
              minRows={2}
              error={Boolean(updateReasonError)}
              helperText={updateReasonError || 'Ejemplo: correccion de datos de laboratorio.'}
              disabled={isSavingResults}
            />
          </Box>
        ) : null}
        {resultsMode === 'view' && isSampleModified ? (
          <Alert severity="info">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Observacion de modificacion
            </Typography>
            <Typography variant="body2">{sampleLastUpdateReason}</Typography>
          </Alert>
        ) : null}
        <Box sx={{ display: 'grid', gap: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Análisis externos
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
                    latestRecord?.result_value !== undefined &&
                    latestRecord?.result_value !== null
                      ? String(latestRecord.result_value)
                      : ''
                  const resultUnit = latestRecord?.result_unit || ''
                  const resultDate = latestRecord?.performed_at || latestRecord?.created_at || ''
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
                            {formatDateCO(resultDate)}
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
                          {resultValue || '--'}
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
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onCancel}>{resultsMode === 'view' ? 'Cerrar' : 'Cancelar'}</Button>
        {resultsMode === 'view' && canEdit ? (
          <Button variant="outlined" onClick={onEdit}>
            Editar
          </Button>
        ) : null}
        {resultsMode !== 'view' ? (
          <Button
            variant="contained"
            disabled={isSavingResults || !createdSample?.id}
            onClick={onSave}
          >
            {isSavingResults ? 'Guardando...' : 'Guardar resultados'}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  )
}

export default SampleResultsDialog
