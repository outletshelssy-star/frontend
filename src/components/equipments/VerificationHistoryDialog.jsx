import { EditOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'

const VerificationHistoryDialog = ({
  open,
  onClose,
  onCancel,
  viewEquipment,
  isMonthlyVerificationType,
  verificationHistoryTypeId,
  verificationRangeMode,
  setVerificationRangeMode,
  verificationRangeMonth,
  setVerificationRangeMonth,
  verificationRangeYear,
  setVerificationRangeYear,
  getFilteredVerifications,
  isKarlFischerEquipment,
  isBalanceEquipment,
  isTapeEquipment,
  canEditVerificationDate,
  renderVerificationResultLabel,
  openVerificationHistoryEdit,
  parseVerificationComparison,
  getEquipmentSerialById,
  parseBalanceComparisonFromNotes,
  equipments,
  parseTapeNotes,
  formatTapeReadingsLabel,
  getTapeAverage,
  getKarlFischerAverageFactor,
  buildControlChartPointsFromVerifications,
}) => {
  return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="xl"
        PaperProps={{
          sx: { width: '95vw', maxWidth: '1600px' },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Últimas verificaciones - {viewEquipment?.equipment_type?.name || '-'} (
          {viewEquipment?.serial || '-'})
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gap: 2.5,
            pt: 2,
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            alignItems: 'start',
            minHeight: { xs: 'auto', lg: '70vh' },
          }}
        >
          <Box sx={{ display: 'grid', gap: 2 }}>
            {!isMonthlyVerificationType(viewEquipment, verificationHistoryTypeId) ? (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 220, mt: 1 }}>
                  <InputLabel id="verification-range-label">Rango</InputLabel>
                  <Select
                    labelId="verification-range-label"
                    label="Rango"
                    value={verificationRangeMode}
                    onChange={(event) => setVerificationRangeMode(event.target.value)}
                  >
                    <MenuItem value="all">Todo el historial</MenuItem>
                    <MenuItem value="last30">Últimos 30 días</MenuItem>
                    <MenuItem value="month">Mes y año</MenuItem>
                  </Select>
                </FormControl>
                {verificationRangeMode === 'month' ? (
                  <>
                    <FormControl size="small" sx={{ minWidth: 160, mt: 1 }}>
                      <InputLabel id="verification-range-month-label">Mes</InputLabel>
                      <Select
                        labelId="verification-range-month-label"
                        label="Mes"
                        value={verificationRangeMonth}
                        onChange={(event) => setVerificationRangeMonth(event.target.value)}
                      >
                        <MenuItem value="1">Enero</MenuItem>
                        <MenuItem value="2">Febrero</MenuItem>
                        <MenuItem value="3">Marzo</MenuItem>
                        <MenuItem value="4">Abril</MenuItem>
                        <MenuItem value="5">Mayo</MenuItem>
                        <MenuItem value="6">Junio</MenuItem>
                        <MenuItem value="7">Julio</MenuItem>
                        <MenuItem value="8">Agosto</MenuItem>
                        <MenuItem value="9">Septiembre</MenuItem>
                        <MenuItem value="10">Octubre</MenuItem>
                        <MenuItem value="11">Noviembre</MenuItem>
                        <MenuItem value="12">Diciembre</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140, mt: 1 }}>
                      <InputLabel id="verification-range-year-label">Año</InputLabel>
                      <Select
                        labelId="verification-range-year-label"
                        label="Año"
                        value={verificationRangeYear}
                        onChange={(event) => setVerificationRangeYear(event.target.value)}
                      >
                        {Array.from(
                          new Set(
                            (viewEquipment?.verifications || [])
                              .map((v) => {
                                const d = new Date(v?.verified_at)
                                return Number.isNaN(d.getTime()) ? null : d.getFullYear()
                              })
                              .filter(Boolean),
                          ),
                        )
                          .sort((a, b) => b - a)
                          .map((year) => (
                            <MenuItem key={year} value={String(year)}>
                              {year}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </>
                ) : null}
              </Box>
            ) : null}
            {getFilteredVerifications(viewEquipment).length === 0 ? (
              <Typography color="text.secondary">Sin verificaciones.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    {isKarlFischerEquipment(viewEquipment) ? (
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Factor</TableCell>
                        <TableCell>Resultado</TableCell>
                        {canEditVerificationDate ? <TableCell>Acciones</TableCell> : null}
                      </TableRow>
                    ) : isBalanceEquipment(viewEquipment) ? (
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Serial pesa</TableCell>
                        <TableCell>Lectura pesa</TableCell>
                        <TableCell>Lectura balanza</TableCell>
                        <TableCell>Diferencia</TableCell>
                        <TableCell>Resultado</TableCell>
                        {canEditVerificationDate ? <TableCell>Acciones</TableCell> : null}
                      </TableRow>
                    ) : isTapeEquipment(viewEquipment) ? (
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Lecturas equipo</TableCell>
                        <TableCell>Lecturas patrón</TableCell>
                        <TableCell>Promedio equipo</TableCell>
                        <TableCell>Promedio patrón</TableCell>
                        <TableCell>Diferencia</TableCell>
                        <TableCell>Resultado</TableCell>
                        {canEditVerificationDate ? <TableCell>Acciones</TableCell> : null}
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Lectura equipo</TableCell>
                        <TableCell>Serial patrón</TableCell>
                        <TableCell>Lectura patrón</TableCell>
                        <TableCell>Diferencia</TableCell>
                        <TableCell>Resultado</TableCell>
                        {canEditVerificationDate ? <TableCell>Acciones</TableCell> : null}
                      </TableRow>
                    )}
                  </TableHead>
                  <TableBody>
                    {getFilteredVerifications(viewEquipment).map((verification) => {
                      const isKarlFischer = isKarlFischerEquipment(viewEquipment)
                      const isTape = isTapeEquipment(viewEquipment)
                      const isBalance = isBalanceEquipment(viewEquipment)
                      const comparison = parseVerificationComparison(verification?.notes)
                      const serialPatron = comparison.patronId
                        ? getEquipmentSerialById(comparison.patronId)
                        : '-'
                      const result = renderVerificationResultLabel(verification?.is_ok)
                      if (isKarlFischer) {
                        const avg = getKarlFischerAverageFactor(verification)
                        return (
                          <TableRow key={verification.id}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {verification?.verified_at
                                ? new Date(verification.verified_at).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell>{avg === null ? '-' : `${avg.toFixed(4)} mg/mL`}</TableCell>
                            <TableCell sx={{ color: result.color, fontWeight: 600 }}>
                              {verification?.is_ok === false ? 'Fuera de control' : result.label}
                            </TableCell>
                            {canEditVerificationDate ? (
                              <TableCell>
                                <IconButton
                                  size="small"
                                  aria-label="Editar verificación"
                                  onClick={() => openVerificationHistoryEdit(verification)}
                                  sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        )
                      }
                      if (isBalance) {
                        const balanceComparison = parseBalanceComparisonFromNotes(
                          verification?.notes,
                        )
                        const patronId = balanceComparison.patronId
                        const referenceEquipment = patronId
                          ? (equipments || []).find((item) => String(item?.id) === String(patronId))
                          : null
                        const weightLabel =
                          balanceComparison.weight ||
                          (referenceEquipment
                            ? `${referenceEquipment.nominal_mass_value ?? '-'} ${
                                referenceEquipment.nominal_mass_unit || 'g'
                              }`
                            : '-')
                        const balanceLabel = balanceComparison.balance || '-'
                        const diffLabel = balanceComparison.diff || '-'
                        return (
                          <TableRow key={verification.id}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {verification?.verified_at
                                ? new Date(verification.verified_at).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell>{serialPatron}</TableCell>
                            <TableCell>{weightLabel}</TableCell>
                            <TableCell>{balanceLabel}</TableCell>
                            <TableCell>{diffLabel}</TableCell>
                            <TableCell sx={{ color: result.color, fontWeight: 600 }}>
                              {verification?.is_ok === false ? 'Fuera de control' : result.label}
                            </TableCell>
                            {canEditVerificationDate ? (
                              <TableCell>
                                <IconButton
                                  size="small"
                                  aria-label="Editar verificación"
                                  onClick={() => openVerificationHistoryEdit(verification)}
                                  sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        )
                      }
                      if (isTape) {
                        const workValues = [
                          verification?.reading_under_test_high_value,
                          verification?.reading_under_test_mid_value,
                          verification?.reading_under_test_low_value,
                        ]
                        const refValues = [
                          verification?.reference_reading_high_value,
                          verification?.reference_reading_mid_value,
                          verification?.reference_reading_low_value,
                        ]
                        const unitWork = verification?.reading_under_test_unit || ''
                        const unitRef = verification?.reference_reading_unit || ''
                        const hasStructured =
                          workValues.some((value) => value !== null && value !== undefined) ||
                          refValues.some((value) => value !== null && value !== undefined)
                        const parsed = !hasStructured
                          ? parseTapeNotes(verification?.notes || '')
                          : null
                        const workDisplayValues = hasStructured
                          ? workValues
                          : parsed?.workValues || []
                        const refDisplayValues = hasStructured ? refValues : parsed?.refValues || []
                        const displayUnitWork = hasStructured ? unitWork : parsed?.workUnit || ''
                        const displayUnitRef = hasStructured ? unitRef : parsed?.refUnit || ''
                        const avgWork = getTapeAverage(workValues)
                        const avgRef = getTapeAverage(refValues)
                        const diff = avgWork !== null && avgRef !== null ? avgRef - avgWork : null
                        const avgWorkDisplay = avgWork ?? parsed?.avgWork ?? null
                        const avgRefDisplay = avgRef ?? parsed?.avgRef ?? null
                        const diffDisplay = diff ?? parsed?.diff ?? null
                        return (
                          <TableRow key={verification.id}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {verification?.verified_at
                                ? new Date(verification.verified_at).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {formatTapeReadingsLabel(workDisplayValues, displayUnitWork)}
                            </TableCell>
                            <TableCell>
                              {formatTapeReadingsLabel(refDisplayValues, displayUnitRef)}
                            </TableCell>
                            <TableCell>
                              {avgWorkDisplay === null ? '-' : `${avgWorkDisplay.toFixed(3)} mm`}
                            </TableCell>
                            <TableCell>
                              {avgRefDisplay === null ? '-' : `${avgRefDisplay.toFixed(3)} mm`}
                            </TableCell>
                            <TableCell>
                              {diffDisplay === null ? '-' : `${diffDisplay.toFixed(3)} mm`}
                            </TableCell>
                            <TableCell sx={{ color: result.color, fontWeight: 600 }}>
                              {verification?.is_ok === false ? 'Fuera de control' : result.label}
                            </TableCell>
                            {canEditVerificationDate ? (
                              <TableCell>
                                <IconButton
                                  size="small"
                                  aria-label="Editar verificación"
                                  onClick={() => openVerificationHistoryEdit(verification)}
                                  sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        )
                      }
                      return (
                        <TableRow key={verification.id}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {verification?.verified_at
                              ? new Date(verification.verified_at).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>{comparison.underTest || '-'}</TableCell>
                          <TableCell>{serialPatron}</TableCell>
                          <TableCell>{comparison.reference || '-'}</TableCell>
                          <TableCell>{comparison.diff || '-'}</TableCell>
                          <TableCell sx={{ color: result.color, fontWeight: 600 }}>
                            {verification?.is_ok === false ? 'Fuera de control' : result.label}
                          </TableCell>
                          {canEditVerificationDate ? (
                            <TableCell>
                              <IconButton
                                size="small"
                                aria-label="Editar verificación"
                                onClick={() => openVerificationHistoryEdit(verification)}
                                sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {isKarlFischerEquipment(viewEquipment)
                ? 'Carta de control (Factor)'
                : isBalanceEquipment(viewEquipment)
                  ? 'Carta de control (Diferencia g)'
                  : isTapeEquipment(viewEquipment)
                    ? 'Carta de control (Diferencia mm)'
                    : 'Carta de control (Diferencia F)'}
            </Typography>
            {buildControlChartPointsFromVerifications(
              getFilteredVerifications(viewEquipment),
              isMonthlyVerificationType(viewEquipment, verificationHistoryTypeId),
              isTapeEquipment(viewEquipment),
              isBalanceEquipment(viewEquipment),
              isKarlFischerEquipment(viewEquipment),
            ).length === 0 ? (
              <Typography color="text.secondary">
                Sin datos para generar la carta de control.
              </Typography>
            ) : (
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                  padding: 1,
                  backgroundColor: 'transparent',
                }}
              >
                {(() => {
                  const isTape = isTapeEquipment(viewEquipment)
                  const isBalance = isBalanceEquipment(viewEquipment)
                  const isKarlFischer = isKarlFischerEquipment(viewEquipment)
                  const isMonthlyHistory = isTape
                    ? false
                    : isKarlFischer
                      ? false
                      : isMonthlyVerificationType(viewEquipment, verificationHistoryTypeId)
                  const points = buildControlChartPointsFromVerifications(
                    getFilteredVerifications(viewEquipment),
                    isMonthlyHistory,
                    isTape,
                    isBalance,
                    isKarlFischer,
                  )
                  const limit = isTape ? 2 : 0.5
                  const kfLower = 4.5
                  const kfUpper = 5.5
                  const maxEmp = isBalance
                    ? Math.max(
                        0,
                        ...points.map((p) => p.emp).filter((value) => typeof value === 'number'),
                      )
                    : null
                  const chartEmp = isBalance
                    ? maxEmp > 0
                      ? maxEmp
                      : Math.max(
                          0.000001,
                          ...points
                            .map((p) => Math.abs(p.diffG || 0))
                            .filter((value) => typeof value === 'number'),
                        )
                    : null
                  const outOfControlCount = points.filter((p) => {
                    if (isKarlFischer) {
                      return p.avgFactor > kfUpper || p.avgFactor < kfLower
                    }
                    if (isBalance) {
                      if (p.emp == null || p.diffG == null) return false
                      return p.diffG > p.emp || p.diffG < -p.emp
                    }
                    if (isMonthlyHistory) {
                      return (
                        p.diffHighF > limit ||
                        p.diffHighF < -limit ||
                        p.diffMidF > limit ||
                        p.diffMidF < -limit ||
                        p.diffLowF > limit ||
                        p.diffLowF < -limit
                      )
                    }
                    const value = isTape ? p.diffMm : p.diffF
                    return value > limit || value < -limit
                  }).length
                  const allValues = isMonthlyHistory
                    ? points.flatMap((p) => [p.diffHighF, p.diffMidF, p.diffLowF])
                    : isBalance
                      ? points.map((p) => p.diffG)
                      : isTape
                        ? points.map((p) => p.diffMm)
                        : isKarlFischer
                          ? points.map((p) => p.avgFactor)
                          : points.map((p) => p.diffF)
                  const numericValues = allValues.filter(
                    (value) => typeof value === 'number' && !Number.isNaN(value),
                  )
                  const maxDiffAbs = isBalance
                    ? Math.max(
                        0,
                        ...points
                          .map((p) => Math.abs(p.diffG || 0))
                          .filter((value) => typeof value === 'number'),
                      )
                    : 0
                  const balanceRange = isBalance
                    ? Math.max((chartEmp || 0) * 5, maxDiffAbs * 1.2, 0.001)
                    : null
                  const allWithinLimits = isKarlFischer
                    ? points.every(
                        (p) =>
                          p.avgFactor != null && p.avgFactor >= kfLower && p.avgFactor <= kfUpper,
                      )
                    : isBalance
                      ? points.every(
                          (p) => p.diffG != null && p.emp != null && Math.abs(p.diffG) <= p.emp,
                        )
                      : isMonthlyHistory
                        ? points.every(
                            (p) =>
                              Math.abs(p.diffHighF) <= limit &&
                              Math.abs(p.diffMidF) <= limit &&
                              Math.abs(p.diffLowF) <= limit,
                          )
                        : points.every((p) => {
                            const value = isTape ? p.diffMm : p.diffF
                            return Math.abs(value) <= limit
                          })
                  const tightRange = isBalance
                    ? Math.max((chartEmp || 0) * 1.2, 0.000001)
                    : limit * 1.2
                  const rangeBase = allWithinLimits
                    ? tightRange
                    : isBalance
                      ? balanceRange || 0
                      : limit
                  let dataMin = 0
                  let dataMax = 0
                  if (isKarlFischer) {
                    dataMin = numericValues.length ? Math.min(...numericValues, kfLower) : kfLower
                    dataMax = numericValues.length ? Math.max(...numericValues, kfUpper) : kfUpper
                  } else {
                    dataMin = numericValues.length
                      ? Math.min(...numericValues, -rangeBase)
                      : -rangeBase
                    dataMax = numericValues.length
                      ? Math.max(...numericValues, rangeBase)
                      : rangeBase
                  }
                  if (dataMin === dataMax) {
                    const padding = isBalance
                      ? Math.max(Math.abs(dataMin) * 0.1, 0.000001)
                      : isKarlFischer
                        ? 0.05
                        : 0.1
                    dataMin -= padding
                    dataMax += padding
                  }
                  const tsValues = points.map((p) => p.ts).filter((ts) => !Number.isNaN(ts))
                  const minTs = tsValues.length ? Math.min(...tsValues) : undefined
                  const maxTs = tsValues.length ? Math.max(...tsValues) : undefined
                  const chartData = points.map((p) =>
                    isMonthlyHistory
                      ? {
                          time: p.ts,
                          highF:
                            typeof p.diffHighF === 'number'
                              ? Number(p.diffHighF.toFixed(4))
                              : undefined,
                          midF:
                            typeof p.diffMidF === 'number'
                              ? Number(p.diffMidF.toFixed(4))
                              : undefined,
                          lowF:
                            typeof p.diffLowF === 'number'
                              ? Number(p.diffLowF.toFixed(4))
                              : undefined,
                        }
                      : isBalance
                        ? {
                            time: p.ts,
                            diffG:
                              typeof p.diffG === 'number' ? Number(p.diffG.toFixed(6)) : undefined,
                          }
                        : isTape
                          ? {
                              time: p.ts,
                              diffMm:
                                typeof p.diffMm === 'number'
                                  ? Number(p.diffMm.toFixed(4))
                                  : undefined,
                            }
                          : isKarlFischer
                            ? {
                                time: p.ts,
                                avgFactor:
                                  typeof p.avgFactor === 'number'
                                    ? Number(p.avgFactor.toFixed(4))
                                    : undefined,
                              }
                            : {
                                time: p.ts,
                                diffF:
                                  typeof p.diffF === 'number'
                                    ? Number(p.diffF.toFixed(4))
                                    : undefined,
                              },
                  )
                  return (
                    <Box sx={{ width: '100%', height: 420, position: 'relative' }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          display: 'flex',
                          gap: 2,
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          backgroundColor: 'rgba(255,255,255,0.85)',
                          padding: '2px 6px',
                          borderRadius: 1,
                        }}
                      >
                        {isMonthlyHistory ? (
                          <>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 2,
                                  backgroundColor: '#2563eb',
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Alto
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 2,
                                  backgroundColor: '#16a34a',
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Medio
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 2,
                                  backgroundColor: '#f59e0b',
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Bajo
                              </Typography>
                            </Box>
                          </>
                        ) : null}
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: '#2563eb',
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Dentro de control
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: '#dc2626',
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Fuera de control
                          </Typography>
                        </Box>
                      </Box>
                      {outOfControlCount > 0 ? (
                        <Typography
                          variant="caption"
                          sx={{ color: '#dc2626', fontWeight: 700, mb: 0.5 }}
                        >
                          Fuera de control: {outOfControlCount}
                        </Typography>
                      ) : null}
                      <ResponsiveContainer>
                        <LineChart
                          data={chartData}
                          margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="time"
                            type="number"
                            domain={[minTs || 'dataMin', maxTs || 'dataMax']}
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            label={{
                              value: 'Tiempo',
                              position: 'insideBottom',
                              offset: -12,
                              fill: '#64748b',
                              fontSize: 11,
                            }}
                          />
                          <YAxis
                            domain={[dataMin, dataMax]}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            label={{
                              value: isKarlFischer
                                ? 'Factor (mg/mL)'
                                : isBalance
                                  ? 'Diferencia (g)'
                                  : isTape
                                    ? 'Diferencia (mm)'
                                    : 'Diferencia (F)',
                              angle: -90,
                              position: 'insideLeft',
                              fill: '#64748b',
                              fontSize: 11,
                            }}
                          />
                          <RechartsTooltip
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value, name) => {
                              const labelMap = {
                                diffF: 'Diferencia',
                                diffMm: 'Diferencia',
                                diffG: 'Diferencia',
                                highF: 'Alto',
                                midF: 'Medio',
                                lowF: 'Bajo',
                                avgFactor: 'Factor',
                              }
                              if (isKarlFischer) {
                                return [`${value} mg/mL`, labelMap[name] || name]
                              }
                              if (isBalance) {
                                return [`${value} g`, labelMap[name] || name]
                              }
                              if (isTape) {
                                return [`${value} mm`, labelMap[name] || name]
                              }
                              return [`${value} F`, labelMap[name] || name]
                            }}
                          />
                          {isBalance ? (
                            <>
                              <ReferenceLine
                                y={chartEmp || 0}
                                stroke="#f97316"
                                strokeWidth={2}
                                strokeDasharray="4 3"
                                label={{
                                  value: `+${(chartEmp || 0).toFixed(6)} g`,
                                  position: 'insideTopLeft',
                                  fill: '#f97316',
                                  fontSize: 10,
                                }}
                              />
                              <ReferenceLine
                                y={-(chartEmp || 0)}
                                stroke="#f97316"
                                strokeWidth={2}
                                strokeDasharray="4 3"
                                label={{
                                  value: `-${(chartEmp || 0).toFixed(6)} g`,
                                  position: 'insideBottomLeft',
                                  fill: '#f97316',
                                  fontSize: 10,
                                }}
                              />
                            </>
                          ) : isKarlFischer ? (
                            <>
                              <ReferenceLine
                                y={kfUpper}
                                stroke="#f97316"
                                strokeDasharray="4 3"
                                label={{
                                  value: `+${kfUpper.toFixed(2)} mg/mL`,
                                  position: 'insideTopLeft',
                                  fill: '#f97316',
                                  fontSize: 10,
                                }}
                              />
                              <ReferenceLine
                                y={kfLower}
                                stroke="#f97316"
                                strokeDasharray="4 3"
                                label={{
                                  value: `${kfLower.toFixed(2)} mg/mL`,
                                  position: 'insideBottomLeft',
                                  fill: '#f97316',
                                  fontSize: 10,
                                }}
                              />
                            </>
                          ) : (
                            <>
                              <ReferenceLine
                                y={limit}
                                stroke="#f97316"
                                strokeDasharray="4 3"
                                label={{
                                  value: isTape ? '+2 mm' : '+0.5 F',
                                  position: 'insideTopLeft',
                                  fill: '#f97316',
                                  fontSize: 10,
                                }}
                              />
                              <ReferenceLine
                                y={-limit}
                                stroke="#f97316"
                                strokeDasharray="4 3"
                                label={{
                                  value: isTape ? '-2 mm' : '-0.5 F',
                                  position: 'insideBottomLeft',
                                  fill: '#f97316',
                                  fontSize: 10,
                                }}
                              />
                            </>
                          )}
                          {!isKarlFischer ? (
                            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 3" />
                          ) : null}
                          {isMonthlyHistory ? (
                            <>
                              <Line
                                type="monotone"
                                dataKey="highF"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={(props) => {
                                  const { cx, cy, payload } = props
                                  const value = payload?.highF
                                  const outOfControl = value > limit || value < -limit
                                  return (
                                    <circle
                                      cx={cx}
                                      cy={cy}
                                      r={outOfControl ? 5 : 3}
                                      fill={outOfControl ? '#dc2626' : '#2563eb'}
                                    />
                                  )
                                }}
                                isAnimationActive={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="midF"
                                stroke="#16a34a"
                                strokeWidth={2}
                                dot={(props) => {
                                  const { cx, cy, payload } = props
                                  const value = payload?.midF
                                  const outOfControl = value > limit || value < -limit
                                  return (
                                    <circle
                                      cx={cx}
                                      cy={cy}
                                      r={outOfControl ? 5 : 3}
                                      fill={outOfControl ? '#dc2626' : '#16a34a'}
                                    />
                                  )
                                }}
                                isAnimationActive={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="lowF"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={(props) => {
                                  const { cx, cy, payload } = props
                                  const value = payload?.lowF
                                  const outOfControl = value > limit || value < -limit
                                  return (
                                    <circle
                                      cx={cx}
                                      cy={cy}
                                      r={outOfControl ? 5 : 3}
                                      fill={outOfControl ? '#dc2626' : '#f59e0b'}
                                    />
                                  )
                                }}
                                isAnimationActive={false}
                              />
                            </>
                          ) : (
                            <Line
                              type="monotone"
                              dataKey={
                                isKarlFischer
                                  ? 'avgFactor'
                                  : isBalance
                                    ? 'diffG'
                                    : isTape
                                      ? 'diffMm'
                                      : 'diffF'
                              }
                              stroke="#2563eb"
                              strokeWidth={2}
                              dot={(props) => {
                                const { cx, cy, payload } = props
                                const value = isKarlFischer
                                  ? payload?.avgFactor
                                  : isBalance
                                    ? payload?.diffG
                                    : isTape
                                      ? payload?.diffMm
                                      : payload?.diffF
                                const outOfControl = isKarlFischer
                                  ? value > kfUpper || value < kfLower
                                  : isBalance
                                    ? payload?.emp != null &&
                                      (value > payload.emp || value < -payload.emp)
                                    : value > limit || value < -limit
                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={isBalance ? (outOfControl ? 6 : 4) : outOfControl ? 5 : 3}
                                    fill={outOfControl ? '#dc2626' : '#2563eb'}
                                  />
                                )
                              }}
                              isAnimationActive={false}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )
                })()}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={onCancel}>Cerrar</Button>
        </DialogActions>
      </Dialog>
  )
}

export { VerificationHistoryDialog }
