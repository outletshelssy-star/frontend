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
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import {
  formatWaterValue,
  getAvgTempDisplay,
  getThermoLabel,
} from '../../utils/sampleUtils'

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
  onSave,
  onCancel,
}) => {
  const sampleLastUpdateReason = String(createdSample?.last_update_reason || '').trim()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { maxWidth: 1152, height: '90vh' } }}
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
        <Typography variant="h6">
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
          gap: 1.5,
          pt: 5,
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
            gap: 1,
            mt: 1,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
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
            label="Fecha de análisis"
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
        </Box>
        <Box
          sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1.5, display: 'grid', gap: 1.5 }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Condiciones del laboratorio
          </Typography>
          <Box
            sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}
          >
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
              gap: 1.5,
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
                          {getThermoLabel(item)}
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
                          {getThermoLabel(item)}
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
                    border: '1px solid #dbeafe',
                    backgroundColor: '#eff6ff',
                    borderRadius: 1,
                    p: 1,
                    textAlign: 'center',
                    alignItems: 'center',
                    display: 'grid',
                    gap: 0.25,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                    {resultsForm.api.api_60f || '--'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    API 60 °F
                  </Typography>
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
                        {getThermoLabel(item)}
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
                          {getThermoLabel(item)}
                        </MenuItem>
                      ))}
                    </Select>
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
                    helperText={kfFactorHelper || undefined}
                    error={Boolean(kfFactorHelper)}
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
                    border: '1px solid #dcfce7',
                    backgroundColor: '#f0fdf4',
                    borderRadius: 1,
                    p: 1,
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
                    % Agua
                  </Typography>
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
        {resultsMode === 'view' ? null : (
          <Button
            variant="contained"
            disabled={isSavingResults || !createdSample?.id}
            onClick={onSave}
          >
            {isSavingResults ? 'Guardando...' : 'Guardar resultados'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default SampleResultsDialog
