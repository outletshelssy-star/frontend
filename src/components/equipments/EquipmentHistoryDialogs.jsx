import { useState } from 'react'
import { colombiaMonth, colombiaYear, formatDateCO, toColombiaDateStr } from '../../utils/dateUtils'
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
import { DeleteOutline, EditOutlined } from '@mui/icons-material'

const COMPACT_HISTORY_TABLE_SX = {
  '& .MuiTableHead-root .MuiTableCell-root': {
    py: 0.5,
  },
  '& .MuiTableBody-root .MuiTableCell-root': {
    py: 0.35,
  },
  '& .MuiIconButton-root': {
    p: 0.25,
  },
}

const getFilteredInspections = (items, rangeMode, rangeMonth, rangeYear) => {
  if (!Array.isArray(items)) return []
  if (rangeMode === 'last30') {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return items.filter((item) => item?.inspected_at && new Date(item.inspected_at) >= cutoff)
  }
  if (rangeMode === 'month') {
    const month = Number(rangeMonth)
    const year = Number(rangeYear)
    return items.filter((item) => {
      if (!item?.inspected_at) return false
      const d = new Date(item.inspected_at)
      const s = toColombiaDateStr(d)
      return Number(s.slice(5, 7)) === month && Number(s.slice(0, 4)) === year
    })
  }
  return items
}

const InspectionHistoryDialog = ({
  open,
  onClose,
  onCancel,
  viewEquipment,
  inspectionHistoryItems,
  canEditInspectionDate,
  renderVerificationResultLabel,
  openInspectionHistoryEdit,
  onDeleteInspection,
}) => {
  const [rangeMode, setRangeMode] = useState('all')
  const [rangeMonth, setRangeMonth] = useState(String(colombiaMonth()))
  const [rangeYear, setRangeYear] = useState(String(colombiaYear()))

  const yearOptions = [
    ...new Set(
      inspectionHistoryItems
        .map((item) => {
          const d = new Date(item?.inspected_at)
          if (Number.isNaN(d.getTime())) return null
          return Number(toColombiaDateStr(d).slice(0, 4))
        })
        .filter(Boolean),
    ),
  ].sort((a, b) => b - a)

  const filtered = getFilteredInspections(inspectionHistoryItems, rangeMode, rangeMonth, rangeYear)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Ultimas inspecciones - {viewEquipment?.equipment_type?.name || '-'} ({viewEquipment?.serial || '-'})
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="inspection-range-label">Rango</InputLabel>
            <Select
              labelId="inspection-range-label"
              label="Rango"
              value={rangeMode}
              onChange={(e) => setRangeMode(e.target.value)}
            >
              <MenuItem value="all">Todo el historial</MenuItem>
              <MenuItem value="last30">Últimos 30 días</MenuItem>
              <MenuItem value="month">Mes y año</MenuItem>
            </Select>
          </FormControl>
          {rangeMode === 'month' ? (
            <>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="inspection-range-month-label">Mes</InputLabel>
                <Select
                  labelId="inspection-range-month-label"
                  label="Mes"
                  value={rangeMonth}
                  onChange={(e) => setRangeMonth(e.target.value)}
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
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="inspection-range-year-label">Año</InputLabel>
                <Select
                  labelId="inspection-range-year-label"
                  label="Año"
                  value={rangeYear}
                  onChange={(e) => setRangeYear(e.target.value)}
                >
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={String(year)}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : null}
        </Box>
        {filtered.length === 0 ? (
          <Typography color="text.secondary">Sin inspecciones.</Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 680 }}>
            <Table size="small" stickyHeader sx={COMPACT_HISTORY_TABLE_SX}>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Observaciones</TableCell>
                  {canEditInspectionDate ? <TableCell>Acciones</TableCell> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((inspection) => {
                  const result = renderVerificationResultLabel(inspection?.is_ok)
                  return (
                    <TableRow key={inspection.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDateCO(inspection?.inspected_at)}
                      </TableCell>
                      <TableCell sx={{ color: result.color, fontWeight: 600 }}>
                        {result.label}
                      </TableCell>
                      <TableCell>{inspection?.notes || '-'}</TableCell>
                      {canEditInspectionDate ? (
                        <TableCell>
                          <IconButton
                            size="small"
                            aria-label="Editar inspeccion"
                            onClick={() => openInspectionHistoryEdit(inspection)}
                            sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label="Eliminar inspeccion"
                            onClick={() => onDeleteInspection(inspection.id)}
                            sx={{ color: '#64748b', '&:hover': { color: '#b91c1c' } }}
                          >
                            <DeleteOutline fontSize="small" />
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onCancel}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

const CalibrationHistoryDialog = ({
  open,
  onClose,
  onCancel,
  viewEquipment,
  canEditCalibrationDate,
  getCompanyNameById,
  openCalibrationHistoryEdit,
  onDeleteCalibration,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Ultimas calibraciones - {viewEquipment?.equipment_type?.name || '-'} ({viewEquipment?.serial || '-'} )
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
          {(viewEquipment?.calibrations || []).length === 0 ? (
            <Typography color="text.secondary">Sin calibraciones.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Empresa</TableCell>
                    <TableCell>No. certificado</TableCell>
                    <TableCell>Certificado</TableCell>
                    <TableCell>Observaciones</TableCell>
                    {canEditCalibrationDate ? <TableCell /> : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...(viewEquipment?.calibrations || [])]
                    .sort((a, b) => new Date(b.calibrated_at) - new Date(a.calibrated_at))
                    .map((calibration) => {
                      const companyLabel = calibration?.calibration_company_id
                        ? getCompanyNameById(calibration.calibration_company_id)
                        : '-'
                      return (
                        <TableRow key={calibration.id}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {formatDateCO(calibration?.calibrated_at)}
                          </TableCell>
                          <TableCell>{companyLabel}</TableCell>
                          <TableCell>{calibration?.certificate_number || '-'}</TableCell>
                          <TableCell>
                            {calibration?.certificate_pdf_url ? (
                              <Button
                                size="small"
                                component="a"
                                href={calibration.certificate_pdf_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Ver PDF
                              </Button>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{calibration?.notes || '-'}</TableCell>
                          {canEditCalibrationDate ? (
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              <IconButton
                                size="small"
                                aria-label="Editar calibracion"
                                onClick={() => openCalibrationHistoryEdit(viewEquipment, calibration)}
                                sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                aria-label="Eliminar calibracion"
                                onClick={() => setConfirmDeleteId(calibration.id)}
                                sx={{ color: '#64748b', '&:hover': { color: '#dc2626' } }}
                              >
                                <DeleteOutline fontSize="small" />
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={onCancel}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Eliminar calibración</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography>¿Estás seguro de que deseas eliminar esta calibración? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteCalibration(confirmDeleteId)
              setConfirmDeleteId(null)
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export { CalibrationHistoryDialog, InspectionHistoryDialog }
