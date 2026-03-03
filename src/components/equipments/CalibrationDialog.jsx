import { DeleteOutline } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'

const CalibrationDialog = ({
  open,
  onClose,
  onCancel,
  onSave,
  calibrationEditMode,
  calibrationEquipment,
  canEditCalibrationDate,
  calibrationForm,
  setCalibrationForm,
  companies,
  isThermoHygrometerEquipment,
  calibrationResultsTemp,
  setCalibrationResultsTemp,
  getEmptyCalibrationRow,
  calibrationResultsHumidity,
  setCalibrationResultsHumidity,
  isHydrometerEquipment,
  isKarlFischerEquipment,
  isWeightEquipmentType,
  calibrationResults,
  setCalibrationResults,
  isThermometerEquipment,
  setCalibrationFile,
  getCertificateLabel,
  isCalibrationLoading,
}) => {
  return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          {calibrationEditMode ? 'Editar calibración' : 'Registrar calibración'}
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2.5, pt: 2 }}>
          {/* ── Equipo ── */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Equipo
            </Typography>
            <Divider sx={{ mt: 0.5, mb: 2 }} />
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                label="Serial"
                value={calibrationEquipment?.serial || '-'}
                slotProps={{ input: { readOnly: true } }}
              />
              <TextField
                label="Tipo de equipo"
                value={calibrationEquipment?.equipment_type?.name || '-'}
                slotProps={{ input: { readOnly: true } }}
              />
            </Box>
          </Box>

          {/* ── Datos de calibración ── */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Datos de calibración
            </Typography>
            <Divider sx={{ mt: 0.5, mb: 2 }} />
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: canEditCalibrationDate ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                },
              }}
            >
              {canEditCalibrationDate ? (
                <TextField
                  label="Fecha de calibración"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={
                    calibrationForm.calibrated_at
                      ? String(calibrationForm.calibrated_at).slice(0, 10)
                      : ''
                  }
                  onChange={(event) =>
                    setCalibrationForm((prev) => ({
                      ...prev,
                      calibrated_at: event.target.value,
                    }))
                  }
                />
              ) : null}
              <FormControl>
                <InputLabel id="calibration-company-id-label">Empresa</InputLabel>
                <Select
                  labelId="calibration-company-id-label"
                  label="Empresa"
                  value={calibrationForm.calibration_company_id}
                  onChange={(event) =>
                    setCalibrationForm((prev) => ({
                      ...prev,
                      calibration_company_id: String(event.target.value || ''),
                    }))
                  }
                >
                  <MenuItem value="">Selecciona</MenuItem>
                  {(companies || []).map((company) => (
                    <MenuItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="No. certificado"
                value={calibrationForm.certificate_number}
                onChange={(event) =>
                  setCalibrationForm((prev) => ({
                    ...prev,
                    certificate_number: event.target.value,
                  }))
                }
              />
            </Box>
          </Box>
          {/* ── Resultados de medición ── */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Resultados de medición
            </Typography>
            <Divider sx={{ mt: 0.5, mb: 2 }} />
            {String(calibrationEquipment?.equipment_type?.name || '')
              .trim()
              .toLowerCase() !== 'balanza analitica' ? (
              <Box sx={{ display: 'grid', gap: 1 }}>
              {isThermoHygrometerEquipment(calibrationEquipment) ? (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        Resultados de medición - Temperatura
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ height: 40 }}
                        onClick={() =>
                          setCalibrationResultsTemp((prev) => [
                            ...prev,
                            getEmptyCalibrationRow('c'),
                          ])
                        }
                      >
                        Agregar fila
                      </Button>
                    </Box>
                    {calibrationResultsTemp.length === 0 ? (
                      <Typography color="text.secondary">Sin resultados.</Typography>
                    ) : (
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        {calibrationResultsTemp.map((row, index) => {
                          const refValue = Number(row.reference_value)
                          const ebcValue = Number(row.measured_value)
                          const hasRef = !Number.isNaN(refValue)
                          const hasEbc = !Number.isNaN(ebcValue)
                          const correction = hasRef && hasEbc ? refValue - ebcValue : null
                          return (
                            <Box
                              key={`cal-temp-${index}`}
                              sx={{
                                display: 'grid',
                                gap: 1.5,
                                columnGap: 1.5,
                                gridTemplateColumns: {
                                  xs: '1fr',
                                  md: '0.9fr 1.4fr 1fr 1fr 1fr 1fr 0.6fr auto',
                                },
                                alignItems: 'center',
                                mt: 0.5,
                              }}
                            >
                              <FormControl size="small">
                                <InputLabel id={`cal-temp-unit-${index}`}>Unidad</InputLabel>
                                <Select
                                  labelId={`cal-temp-unit-${index}`}
                                  label="Unidad"
                                  value={row.unit || 'c'}
                                  onChange={(event) =>
                                    setCalibrationResultsTemp((prev) =>
                                      prev.map((item, idx) =>
                                        idx === index
                                          ? { ...item, unit: event.target.value }
                                          : item,
                                      ),
                                    )
                                  }
                                >
                                  <MenuItem value="c">C</MenuItem>
                                  <MenuItem value="f">F</MenuItem>
                                  <MenuItem value="k">K</MenuItem>
                                  <MenuItem value="r">R</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                label="Punto"
                                size="small"
                                value={row.point_label}
                                onChange={(event) =>
                                  setCalibrationResultsTemp((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, point_label: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="Lectura patrón"
                                size="small"
                                type="number"
                                value={row.reference_value}
                                onChange={(event) =>
                                  setCalibrationResultsTemp((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, reference_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="EBC"
                                size="small"
                                type="number"
                                value={row.measured_value}
                                onChange={(event) =>
                                  setCalibrationResultsTemp((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, measured_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="Corrección"
                                size="small"
                                value={correction === null ? '' : correction.toFixed(3)}
                                slotProps={{ input: { readOnly: true } }}
                              />
                              <TextField
                                label="Incertidumbre"
                                size="small"
                                type="number"
                                value={row.error_value}
                                onChange={(event) =>
                                  setCalibrationResultsTemp((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, error_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="k"
                                size="small"
                                type="number"
                                value={row.tolerance_value}
                                onChange={(event) =>
                                  setCalibrationResultsTemp((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, tolerance_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <IconButton
                                size="small"
                                aria-label="Eliminar fila"
                                onClick={() =>
                                  setCalibrationResultsTemp((prev) =>
                                    prev.filter((_, idx) => idx !== index),
                                  )
                                }
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Box>
                          )
                        })}
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        Resultados de medición - % Humedad
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ height: 40 }}
                        onClick={() =>
                          setCalibrationResultsHumidity((prev) => [
                            ...prev,
                            getEmptyCalibrationRow('%'),
                          ])
                        }
                      >
                        Agregar fila
                      </Button>
                    </Box>
                    {calibrationResultsHumidity.length === 0 ? (
                      <Typography color="text.secondary">Sin resultados.</Typography>
                    ) : (
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        {calibrationResultsHumidity.map((row, index) => {
                          const refValue = Number(row.reference_value)
                          const ebcValue = Number(row.measured_value)
                          const hasRef = !Number.isNaN(refValue)
                          const hasEbc = !Number.isNaN(ebcValue)
                          const correction = hasRef && hasEbc ? refValue - ebcValue : null
                          return (
                            <Box
                              key={`cal-hum-${index}`}
                              sx={{
                                display: 'grid',
                                gap: 1.5,
                                columnGap: 1.5,
                                gridTemplateColumns: {
                                  xs: '1fr',
                                  md: '0.9fr 1.4fr 1fr 1fr 1fr 1fr 0.6fr auto',
                                },
                                alignItems: 'center',
                                mt: 0.5,
                              }}
                            >
                              <FormControl size="small">
                                <InputLabel id={`cal-hum-unit-${index}`}>Unidad</InputLabel>
                                <Select
                                  labelId={`cal-hum-unit-${index}`}
                                  label="Unidad"
                                  value={row.unit || '%'}
                                  onChange={(event) =>
                                    setCalibrationResultsHumidity((prev) =>
                                      prev.map((item, idx) =>
                                        idx === index
                                          ? { ...item, unit: event.target.value }
                                          : item,
                                      ),
                                    )
                                  }
                                >
                                  <MenuItem value="%">%</MenuItem>
                                  <MenuItem value="%rh">%RH</MenuItem>
                                  <MenuItem value="rh">RH</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                label="Punto"
                                size="small"
                                value={row.point_label}
                                onChange={(event) =>
                                  setCalibrationResultsHumidity((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, point_label: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="Lectura patrón"
                                size="small"
                                type="number"
                                value={row.reference_value}
                                onChange={(event) =>
                                  setCalibrationResultsHumidity((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, reference_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="EBC"
                                size="small"
                                type="number"
                                value={row.measured_value}
                                onChange={(event) =>
                                  setCalibrationResultsHumidity((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, measured_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="Corrección"
                                size="small"
                                value={correction === null ? '' : correction.toFixed(3)}
                                slotProps={{ input: { readOnly: true } }}
                              />
                              <TextField
                                label="Incertidumbre"
                                size="small"
                                type="number"
                                value={row.error_value}
                                onChange={(event) =>
                                  setCalibrationResultsHumidity((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, error_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="k"
                                size="small"
                                type="number"
                                value={row.tolerance_value}
                                onChange={(event) =>
                                  setCalibrationResultsHumidity((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, tolerance_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <IconButton
                                size="small"
                                aria-label="Eliminar fila"
                                onClick={() =>
                                  setCalibrationResultsHumidity((prev) =>
                                    prev.filter((_, idx) => idx !== index),
                                  )
                                }
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Box>
                          )
                        })}
                      </Box>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 600 }}>Resultados de medición</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ height: 40 }}
                      onClick={() =>
                        setCalibrationResults((prev) => [
                          ...prev,
                          getEmptyCalibrationRow(
                            isHydrometerEquipment(calibrationEquipment)
                              ? 'api'
                              : isKarlFischerEquipment(calibrationEquipment)
                                ? 'ml'
                                : isWeightEquipmentType(calibrationEquipment?.equipment_type)
                                  ? 'g'
                                  : '',
                          ),
                        ])
                      }
                    >
                      Agregar fila
                    </Button>
                  </Box>
                  {calibrationResults.length === 0 ? (
                    <Typography color="text.secondary">Sin resultados.</Typography>
                  ) : (
                    <Box sx={{ display: 'grid', gap: 1 }}>
                      {isWeightEquipmentType(calibrationEquipment?.equipment_type) ? (
                        calibrationResults.map((row, index) => (
                          <Box
                            key={`cal-row-${index}`}
                            sx={{
                              display: 'grid',
                              gap: 1,
                              gridTemplateColumns: { xs: '1fr', md: '0.8fr 1.2fr 1fr 1fr auto' },
                              alignItems: 'center',
                            }}
                          >
                            <FormControl size="small">
                              <InputLabel id={`cal-weight-unit-${index}`}>Unidad</InputLabel>
                              <Select
                                labelId={`cal-weight-unit-${index}`}
                                label="Unidad"
                                value={row.unit || 'g'}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index ? { ...item, unit: event.target.value } : item,
                                    ),
                                  )
                                }
                              >
                                <MenuItem value="g">g</MenuItem>
                                <MenuItem value="mg">mg</MenuItem>
                              </Select>
                            </FormControl>
                            <TextField
                              label="Punto"
                              size="small"
                              value={row.point_label}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, point_label: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="Incertidumbre"
                              size="small"
                              type="number"
                              value={row.error_value}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, error_value: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="k"
                              size="small"
                              type="number"
                              value={row.tolerance_value}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, tolerance_value: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <IconButton
                              size="small"
                              aria-label="Eliminar fila"
                              onClick={() =>
                                setCalibrationResults((prev) =>
                                  prev.filter((_, idx) => idx !== index),
                                )
                              }
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Box>
                        ))
                      ) : isThermometerEquipment(calibrationEquipment) ? (
                        calibrationResults.map((row, index) => {
                          const refValue = Number(row.reference_value)
                          const ebcValue = Number(row.measured_value)
                          const hasRef = !Number.isNaN(refValue)
                          const hasEbc = !Number.isNaN(ebcValue)
                          const correction = hasRef && hasEbc ? refValue - ebcValue : null
                          return (
                            <Box
                              key={`cal-row-${index}`}
                              sx={{
                                display: 'grid',
                                gap: 1.5,
                                columnGap: 1.5,
                                gridTemplateColumns: {
                                  xs: '1fr',
                                  md: '0.9fr 1.4fr 1fr 1fr 1fr 1fr 0.6fr auto',
                                },
                                alignItems: 'center',
                                mt: 0.5,
                              }}
                            >
                              <FormControl size="small">
                                <InputLabel id={`cal-unit-${index}`}>Unidad</InputLabel>
                                <Select
                                  labelId={`cal-unit-${index}`}
                                  label="Unidad"
                                  value={row.unit || ''}
                                  onChange={(event) =>
                                    setCalibrationResults((prev) =>
                                      prev.map((item, idx) =>
                                        idx === index
                                          ? { ...item, unit: event.target.value }
                                          : item,
                                      ),
                                    )
                                  }
                                >
                                  <MenuItem value="">-</MenuItem>
                                  <MenuItem value="c">C</MenuItem>
                                  <MenuItem value="f">F</MenuItem>
                                  <MenuItem value="k">K</MenuItem>
                                  <MenuItem value="r">R</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                label="Punto"
                                size="small"
                                value={row.point_label}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, point_label: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="Lectura patrón"
                                size="small"
                                type="number"
                                value={row.reference_value}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, reference_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="EBC"
                                size="small"
                                type="number"
                                value={row.measured_value}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, measured_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="Corrección"
                                size="small"
                                value={correction === null ? '' : correction.toFixed(3)}
                                slotProps={{ input: { readOnly: true } }}
                              />
                              <TextField
                                label="Incertidumbre"
                                size="small"
                                type="number"
                                value={row.error_value}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, error_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="k"
                                size="small"
                                type="number"
                                value={row.tolerance_value}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, tolerance_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <IconButton
                                size="small"
                                aria-label="Eliminar fila"
                                onClick={() =>
                                  setCalibrationResults((prev) =>
                                    prev.filter((_, idx) => idx !== index),
                                  )
                                }
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Box>
                          )
                        })
                      ) : isHydrometerEquipment(calibrationEquipment) ? (
                        <Box sx={{ display: 'grid', gap: 1.5 }}>
                          {calibrationResults.map((row, index) => (
                            <Box
                              key={`cal-row-${index}`}
                              sx={{
                                display: 'grid',
                                gap: 1,
                                columnGap: 1.5,
                                gridTemplateColumns: {
                                  xs: '1fr',
                                  md: 'minmax(120px, 1fr) minmax(140px, 1fr) minmax(160px, 1fr) minmax(140px, 1fr) minmax(90px, 0.7fr) minmax(90px, 0.6fr) auto',
                                },
                                alignItems: 'center',
                              }}
                            >
                              <TextField
                                label="Punto"
                                size="small"
                                value={row.point_label}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, point_label: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="Lectura patrón"
                                size="small"
                                type="number"
                                value={row.reference_value}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, reference_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="Lectura instrumento"
                                size="small"
                                type="number"
                                value={row.measured_value}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, measured_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="Incertidumbre"
                                size="small"
                                type="number"
                                value={row.error_value}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, error_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="k"
                                size="small"
                                type="number"
                                value={row.tolerance_value}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index
                                        ? { ...item, tolerance_value: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <TextField
                                label="Unidad"
                                size="small"
                                value="API"
                                slotProps={{ input: { readOnly: true } }}
                              />
                              <IconButton
                                size="small"
                                aria-label="Eliminar fila"
                                onClick={() =>
                                  setCalibrationResults((prev) =>
                                    prev.filter((_, idx) => idx !== index),
                                  )
                                }
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      ) : isKarlFischerEquipment(calibrationEquipment) ? (
                        calibrationResults.map((row, index) => (
                          <Box
                            key={`cal-row-${index}`}
                            sx={{
                              display: 'grid',
                              gap: 1,
                              gridTemplateColumns: {
                                xs: '1fr',
                                md: '0.8fr 0.9fr 1fr 1fr 1fr 1fr 1fr 1fr 0.8fr auto',
                              },
                              alignItems: 'center',
                            }}
                          >
                            <FormControl size="small">
                              <InputLabel id={`kf-unit-${index}`}>Unidad</InputLabel>
                              <Select
                                labelId={`kf-unit-${index}`}
                                label="Unidad"
                                value={row.unit || 'ml'}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index ? { ...item, unit: event.target.value } : item,
                                    ),
                                  )
                                }
                              >
                                <MenuItem value="ml">mL</MenuItem>
                                <MenuItem value="l">L</MenuItem>
                              </Select>
                            </FormControl>
                            <TextField
                              label="Punto"
                              size="small"
                              value={row.point_label}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, point_label: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="Volumen calculado"
                              size="small"
                              type="number"
                              value={row.volume_value}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, volume_value: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="Error sistemático"
                              size="small"
                              type="number"
                              value={row.systematic_error}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, systematic_error: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="EMP sistemático"
                              size="small"
                              type="number"
                              value={row.systematic_emp}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, systematic_emp: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="Error aleatorio"
                              size="small"
                              type="number"
                              value={row.random_error}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, random_error: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="EMP aleatorio"
                              size="small"
                              type="number"
                              value={row.random_emp}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, random_emp: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="Incertidumbre"
                              size="small"
                              type="number"
                              value={row.uncertainty_value}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, uncertainty_value: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="k"
                              size="small"
                              type="number"
                              value={row.k_value}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index ? { ...item, k_value: event.target.value } : item,
                                  ),
                                )
                              }
                            />
                            <IconButton
                              size="small"
                              aria-label="Eliminar fila"
                              onClick={() =>
                                setCalibrationResults((prev) =>
                                  prev.filter((_, idx) => idx !== index),
                                )
                              }
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Box>
                        ))
                      ) : (
                        calibrationResults.map((row, index) => (
                          <Box
                            key={`cal-row-${index}`}
                            sx={{
                              display: 'grid',
                              gap: 1,
                              gridTemplateColumns: {
                                xs: '1fr',
                                md: '2fr 1fr 1fr 1fr 1fr 1fr 1fr auto',
                              },
                              alignItems: 'center',
                            }}
                          >
                            <TextField
                              label="Punto"
                              size="small"
                              value={row.point_label}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, point_label: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="Ref"
                              size="small"
                              type="number"
                              value={row.reference_value}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, reference_value: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="Medido"
                              size="small"
                              type="number"
                              value={row.measured_value}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, measured_value: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="Unidad"
                              size="small"
                              value={row.unit}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index ? { ...item, unit: event.target.value } : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="Error"
                              size="small"
                              type="number"
                              value={row.error_value}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, error_value: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <TextField
                              label="Tol"
                              size="small"
                              type="number"
                              value={row.tolerance_value}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, tolerance_value: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                            <FormControl size="small">
                              <InputLabel id={`cal-ok-${index}`}>OK</InputLabel>
                              <Select
                                labelId={`cal-ok-${index}`}
                                label="OK"
                                value={row.is_ok}
                                onChange={(event) =>
                                  setCalibrationResults((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index ? { ...item, is_ok: event.target.value } : item,
                                    ),
                                  )
                                }
                              >
                                <MenuItem value="">-</MenuItem>
                                <MenuItem value="true">Sí</MenuItem>
                                <MenuItem value="false">No</MenuItem>
                              </Select>
                            </FormControl>
                            <IconButton
                              size="small"
                              aria-label="Eliminar fila"
                              onClick={() =>
                                setCalibrationResults((prev) =>
                                  prev.filter((_, idx) => idx !== index),
                                )
                              }
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Box>
                        ))
                      )}
                    </Box>
                  )}
                </Box>
              )}
              </Box>
          ) : (
              <Typography color="text.secondary">
                Resultados de medición no requeridos para este tipo de equipo.
              </Typography>
          )}
          </Box>

          {/* ── Documentación ── */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Documentación
            </Typography>
            <Divider sx={{ mt: 0.5, mb: 2 }} />
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1,
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' },
                  alignItems: 'center',
                }}
              >
                <Button variant="outlined" component="label">
                  Subir certificado (PDF)
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null
                      setCalibrationFile(file)
                    }}
                  />
                </Button>
                <Typography color="text.secondary">{getCertificateLabel()}</Typography>
              </Box>
              <TextField
                label="Observaciones"
                value={calibrationForm.notes}
                onChange={(event) =>
                  setCalibrationForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                multiline
                minRows={2}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={isCalibrationLoading}
            onClick={onSave}
          >
            {isCalibrationLoading ? 'Guardando...' : 'Guardar calibración'}
          </Button>
        </DialogActions>
      </Dialog>
  )
}

export { CalibrationDialog }
