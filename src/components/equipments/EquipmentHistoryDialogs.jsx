import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { EditOutlined } from '@mui/icons-material'

const InspectionHistoryDialog = ({
  open,
  onClose,
  onCancel,
  viewEquipment,
  inspectionHistoryItems,
  canEditInspectionDate,
  renderVerificationResultLabel,
  openInspectionHistoryEdit,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Ultimas inspecciones - {viewEquipment?.equipment_type?.name || '-'} ({viewEquipment?.serial || '-'})
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
        {inspectionHistoryItems.length === 0 ? (
          <Typography color="text.secondary">Sin inspecciones.</Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Observaciones</TableCell>
                  {canEditInspectionDate ? <TableCell>Acciones</TableCell> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {inspectionHistoryItems.map((inspection) => {
                  const result = renderVerificationResultLabel(inspection?.is_ok)
                  return (
                    <TableRow key={inspection.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {inspection?.inspected_at
                          ? new Date(inspection.inspected_at).toLocaleDateString()
                          : '-'}
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
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Ultimas calibraciones - {viewEquipment?.equipment_type?.name || '-'} ({viewEquipment?.serial || '-'} )
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
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
                          {calibration?.calibrated_at
                            ? new Date(calibration.calibrated_at).toLocaleDateString()
                            : '-'}
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
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              aria-label="Editar calibracion"
                              onClick={() => openCalibrationHistoryEdit(viewEquipment, calibration)}
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onCancel}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export { CalibrationHistoryDialog, InspectionHistoryDialog }
