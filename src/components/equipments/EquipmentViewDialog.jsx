import { useMemo, useState } from 'react'
import { colombiaMonth, colombiaYear, colombiaMidnightUTC, toColombiaDateStr } from '../../utils/dateUtils'
import {
  Cancel,
  CheckCircle,
  ErrorOutline,
  WarningAmber,
} from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  FormControl,
  InputLabel,
  MenuItem,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'

const HISTORY_MONTH_OPTIONS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

const EquipmentViewDialog = ({
  open,
  onClose,
  onCancel,
  viewEquipment,
  renderStatusBadge,
  getMeasureLabel,
  formatSpecValue,
  getBaseUnitLabel,
  shouldSkipInspection,
  renderInspectionBadge,
  getLastInspectionDateLabel,
  openInspectionHistory,
  getVerificationTypesForEquipment,
  getLastVerificationDateLabelByType,
  getVerificationStatusForType,
  getVerificationTypeTooltip,
  openVerificationHistory,
  renderCalibrationBadge,
  getLastCalibrationDateLabel,
  openCalibrationHistory,
  isEquipmentHistoryLoading,
  equipmentHistoryError,
  equipmentHistoryItems,
  getEquipmentTypeNameById,
  getEquipmentTypeRoleLabelById,
  getTerminalNameById,
  getStatusLabelByValue,
  formatDateTime,
  getUserNameById,
}) => {
  const [historyDateFilterMode, setHistoryDateFilterMode] = useState('last30')
  const [historyFilterMonth, setHistoryFilterMonth] = useState(String(colombiaMonth()))
  const [historyFilterYear, setHistoryFilterYear] = useState(String(colombiaYear()))

  const historyYearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (equipmentHistoryItems || [])
            .map((entry) => {
              const dateValue = new Date(entry?.started_at)
              if (Number.isNaN(dateValue.getTime())) return null
              return Number(toColombiaDateStr(dateValue).slice(0, 4))
            })
            .filter((year) => Number.isFinite(year)),
        ),
      ).sort((a, b) => b - a),
    [equipmentHistoryItems],
  )

  const effectiveHistoryFilterYear =
    historyYearOptions.length > 0 && !historyYearOptions.includes(Number(historyFilterYear))
      ? String(historyYearOptions[0])
      : historyFilterYear

  const filteredEquipmentHistoryItems = useMemo(() => {
    const items = Array.isArray(equipmentHistoryItems) ? equipmentHistoryItems : []
    if (historyDateFilterMode === 'last30') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      return items.filter((entry) => {
        if (!entry?.started_at) return false
        const dateValue = new Date(entry.started_at)
        return !Number.isNaN(dateValue.getTime()) && dateValue >= cutoff
      })
    }
    if (historyDateFilterMode === 'month') {
      const selectedMonth = Number(historyFilterMonth)
      const selectedYear = Number(effectiveHistoryFilterYear)
      return items.filter((entry) => {
        if (!entry?.started_at) return false
        const dateValue = new Date(entry.started_at)
        if (Number.isNaN(dateValue.getTime())) return false
        const s = toColombiaDateStr(dateValue)
        return Number(s.slice(5, 7)) === selectedMonth && Number(s.slice(0, 4)) === selectedYear
      })
    }
    if (historyDateFilterMode === 'year') {
      const selectedYear = Number(effectiveHistoryFilterYear)
      return items.filter((entry) => {
        if (!entry?.started_at) return false
        const dateValue = new Date(entry.started_at)
        if (Number.isNaN(dateValue.getTime())) return false
        return Number(toColombiaDateStr(dateValue).slice(0, 4)) === selectedYear
      })
    }
    return items
  }, [
    effectiveHistoryFilterYear,
    equipmentHistoryItems,
    historyDateFilterMode,
    historyFilterMonth,
  ])

  const yearOptionsForSelect = historyYearOptions.length
    ? historyYearOptions
    : [colombiaYear()]

  const normalizedEquipmentTypeName = String(viewEquipment?.equipment_type?.name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const isThermometerEquipment = normalizedEquipmentTypeName.includes('termometro')
  const toFahrenheit = (celsiusValue) => {
    const numeric = Number(celsiusValue)
    if (!Number.isFinite(numeric)) return celsiusValue
    return (numeric * 9) / 5 + 32
  }
  const toFahrenheitDelta = (celsiusDeltaValue) => {
    const numeric = Number(celsiusDeltaValue)
    if (!Number.isFinite(numeric)) return celsiusDeltaValue
    return (numeric * 9) / 5
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1 }}>
        Detalle de equipo
      </DialogTitle>
      <DialogContent sx={{ pt: '12px !important' }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            alignItems: 'start',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(0, 2fr) minmax(0, 3fr)',
            },
          }}
        >
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {/* Identificacion */}
            <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: 1 }}
          >
            Identificacion
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 1.5 }} />
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Tipo de equipo
              </Typography>
              <Typography>{viewEquipment?.equipment_type?.name || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Marca
              </Typography>
              <Typography>{viewEquipment?.brand || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Modelo
              </Typography>
              <Typography>{viewEquipment?.model || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Serial
              </Typography>
              <Typography>{viewEquipment?.serial || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Componentes
              </Typography>
              {(viewEquipment?.component_serials || []).length === 0 ? (
                <Typography>-</Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 0.5 }}>
                  {(viewEquipment?.component_serials || []).map((item) => (
                    <Typography key={`${item.component_name}-${item.serial}`}>
                      {item.component_name}: {item.serial}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Codigo interno
              </Typography>
              <Typography>{viewEquipment?.internal_code || '-'}</Typography>
            </Box>
          </Box>
            </Box>

            {/* Operacion */}
            <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: 1 }}
          >
            Operacion
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 1.5 }} />
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Empresa duena
              </Typography>
              <Typography>{viewEquipment?.owner_company?.name || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Terminal
              </Typography>
              <Typography>{viewEquipment?.terminal?.name || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Estado
              </Typography>
              {renderStatusBadge(viewEquipment?.status)}
            </Box>
          </Box>
            </Box>

            {/* Especificaciones por medida */}
            {(viewEquipment?.measure_specs || []).length > 0 && (
              <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Especificaciones por medida
            </Typography>
            <Divider sx={{ mt: 0.5, mb: 1.5 }} />
            <Box sx={{ display: 'grid', gap: 1 }}>
              {(viewEquipment?.measure_specs || []).map((spec) => {
                const displayAsFahrenheit =
                  isThermometerEquipment && String(spec?.measure || '') === 'temperature'
                const displayResolution = displayAsFahrenheit
                  ? toFahrenheitDelta(spec?.resolution)
                  : spec?.resolution
                const displayMinValue = displayAsFahrenheit
                  ? toFahrenheit(spec?.min_value)
                  : spec?.min_value
                const displayMaxValue = displayAsFahrenheit
                  ? toFahrenheit(spec?.max_value)
                  : spec?.max_value
                const displayUnitLabel = displayAsFahrenheit ? 'F' : getBaseUnitLabel(spec.measure)
                return (
                  <Box
                    key={`${spec.measure}-${spec.id}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      flexWrap: 'nowrap',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 1.5,
                      backgroundColor: 'grey.50',
                      overflow: 'hidden',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getMeasureLabel(spec.measure)}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'nowrap' }}>
                      Min: {formatSpecValue(displayMinValue, displayResolution)} {displayUnitLabel}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'nowrap' }}>
                      Max: {formatSpecValue(displayMaxValue, displayResolution)} {displayUnitLabel}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'nowrap' }}>
                      Resolucion: {formatSpecValue(displayResolution, displayResolution)}{' '}
                      {displayUnitLabel}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
              </Box>
            )}

            {/* Control de calidad */}
            <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: 1 }}
          >
            Control de calidad
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 1.5 }} />
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Calibraciones
              </Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {renderCalibrationBadge(viewEquipment)}
                  <Typography variant="body2">
                    Ultima: {getLastCalibrationDateLabel(viewEquipment?.calibrations)}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ height: 40, width: 'fit-content' }}
                  onClick={() => openCalibrationHistory(viewEquipment)}
                >
                  Ver calibraciones
                </Button>
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Inspecciones
              </Typography>
              {shouldSkipInspection(viewEquipment) ? (
                <Typography variant="body2" color="text.secondary">
                  No aplica
                </Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {renderInspectionBadge(viewEquipment)}
                    <Typography variant="body2">
                      Ultima: {getLastInspectionDateLabel(viewEquipment?.inspections)}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ height: 40, width: 'fit-content' }}
                    onClick={openInspectionHistory}
                  >
                    Ver inspecciones
                  </Button>
                </Box>
              )}
            </Box>
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <Typography variant="subtitle2" color="text.secondary">
                Verificaciones
              </Typography>
              <Box sx={{ display: 'grid', gap: 0.75 }}>
                {(() => {
                  const equipmentRole = String(viewEquipment?.equipment_type?.role || '').toLowerCase()
                  const activeTypes = (getVerificationTypesForEquipment(viewEquipment) || []).filter(
                    (t) => Number(t?.frequency_days ?? 0) > 0,
                  )
                  if (equipmentRole === 'reference' || activeTypes.length === 0) {
                    return (
                      <Typography variant="body2" color="text.secondary">
                        No aplica
                      </Typography>
                    )
                  }
                  return activeTypes.map((typeItem) => (
                    (() => {
                      const { status } = getVerificationStatusForType(viewEquipment, typeItem)
                      const verifColor = status === 'ok'
                        ? '#16a34a'
                        : status === 'warning'
                          ? '#ca8a04'
                          : status === 'failed'
                            ? '#ea580c'
                            : '#dc2626'
                      const verifIcon = status === 'ok'
                        ? <CheckCircle fontSize="small" />
                        : status === 'warning'
                          ? <WarningAmber fontSize="small" />
                          : status === 'failed'
                            ? <ErrorOutline fontSize="small" />
                            : <Cancel fontSize="small" />
                      return (
                        <Box
                          key={typeItem.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Tooltip
                            title={getVerificationTypeTooltip(viewEquipment, typeItem)}
                            arrow
                            placement="top"
                          >
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: verifColor,
                              }}
                            >
                              {verifIcon}
                            </Box>
                          </Tooltip>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {typeItem.name}
                          </Typography>
                          <Typography variant="body2">
                            Ultima: {getLastVerificationDateLabelByType(viewEquipment, typeItem.id)}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ height: 40 }}
                            onClick={() => openVerificationHistory(typeItem.id)}
                          >
                            Ver verificaciones
                          </Button>
                        </Box>
                      )
                    })()
                  ))
                })()}
              </Box>
            </Box>
          </Box>
            </Box>
          </Box>

          {/* Historial del equipo */}
          <Box sx={{ alignSelf: 'start' }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: 1 }}
          >
            Historial del equipo
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 1.5 }} />
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel id="equipment-history-range-label">Rango</InputLabel>
              <Select
                labelId="equipment-history-range-label"
                label="Rango"
                value={historyDateFilterMode}
                onChange={(event) => setHistoryDateFilterMode(event.target.value)}
              >
                <MenuItem value="last30">Ultimos 30 dias</MenuItem>
                <MenuItem value="month">Mes y año</MenuItem>
                <MenuItem value="year">Año</MenuItem>
              </Select>
            </FormControl>
            {historyDateFilterMode === 'month' ? (
              <>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="equipment-history-month-label">Mes</InputLabel>
                  <Select
                    labelId="equipment-history-month-label"
                    label="Mes"
                    value={historyFilterMonth}
                    onChange={(event) => setHistoryFilterMonth(event.target.value)}
                  >
                    {HISTORY_MONTH_OPTIONS.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel id="equipment-history-year-month-label">Año</InputLabel>
                  <Select
                    labelId="equipment-history-year-month-label"
                    label="Año"
                    value={effectiveHistoryFilterYear}
                    onChange={(event) => setHistoryFilterYear(event.target.value)}
                  >
                    {yearOptionsForSelect.map((year) => (
                      <MenuItem key={year} value={String(year)}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            ) : null}
            {historyDateFilterMode === 'year' ? (
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel id="equipment-history-year-label">Año</InputLabel>
                <Select
                  labelId="equipment-history-year-label"
                  label="Año"
                  value={effectiveHistoryFilterYear}
                  onChange={(event) => setHistoryFilterYear(event.target.value)}
                >
                  {yearOptionsForSelect.map((year) => (
                    <MenuItem key={year} value={String(year)}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}
          </Box>
          {isEquipmentHistoryLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography color="text.secondary">Cargando historial...</Typography>
            </Box>
          ) : equipmentHistoryError ? (
            <Typography color="text.secondary">{equipmentHistoryError}</Typography>
          ) : filteredEquipmentHistoryItems.length === 0 ? (
            <Typography color="text.secondary">
              {equipmentHistoryItems.length === 0
                ? 'Sin historial registrado.'
                : 'Sin registros para el filtro seleccionado.'}
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 640 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Desde</TableCell>
                    <TableCell>Hasta</TableCell>
                    <TableCell>Cambiado por</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEquipmentHistoryItems.map((entry) => {
                    const isType = entry.kind === 'type'
                    const isTerminal = entry.kind === 'terminal'
                    const label = isType ? 'Rol' : isTerminal ? 'Estacion' : 'Estado'
                    const value = isType
                      ? `${getEquipmentTypeNameById(entry.equipment_type_id)} (${getEquipmentTypeRoleLabelById(entry.equipment_type_id)})`
                      : isTerminal
                        ? getTerminalNameById(entry.terminal_id)
                        : getStatusLabelByValue(entry.status)
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{label}</TableCell>
                        <TableCell>{value}</TableCell>
                        <TableCell>{formatDateTime(entry.started_at)}</TableCell>
                        <TableCell>
                          {entry.ended_at ? formatDateTime(entry.ended_at) : 'Actual'}
                        </TableCell>
                        <TableCell>
                          {entry.changed_by_user_name || getUserNameById(entry.changed_by_user_id)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 1.5, gap: 1 }}>
        <Button onClick={onCancel}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export { EquipmentViewDialog }
