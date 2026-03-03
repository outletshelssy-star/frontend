import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

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
  renderVerificationBadge,
  getLastVerificationDateLabel,
  getLastVerificationDateLabelByType,
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
  formatDateTime,
  getUserNameById,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1 }}>
        Detalle de equipo
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 1.5 }}>
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
              {(viewEquipment?.measure_specs || []).map((spec) => (
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
                    Min: {formatSpecValue(spec.min_value, spec.resolution)}{' '}
                    {getBaseUnitLabel(spec.measure)}
                  </Typography>
                  <Typography sx={{ whiteSpace: 'nowrap' }}>
                    Max: {formatSpecValue(spec.max_value, spec.resolution)}{' '}
                    {getBaseUnitLabel(spec.measure)}
                  </Typography>
                  <Typography sx={{ whiteSpace: 'nowrap' }}>
                    Resolucion: {formatSpecValue(spec.resolution, spec.resolution)}{' '}
                    {getBaseUnitLabel(spec.measure)}
                  </Typography>
                </Box>
              ))}
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
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Inspecciones
              </Typography>
              {shouldSkipInspection(viewEquipment) ? (
                <Typography variant="body2" color="text.secondary">
                  No aplica
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {renderInspectionBadge(viewEquipment)}
                  <Typography variant="body2">
                    Ultima: {getLastInspectionDateLabel(viewEquipment?.inspections)}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ height: 40 }}
                    onClick={openInspectionHistory}
                  >
                    Ver inspecciones
                  </Button>
                </Box>
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Verificaciones
              </Typography>
              <Box sx={{ display: 'grid', gap: 0.75 }}>
                {(() => {
                  const types = getVerificationTypesForEquipment(viewEquipment) || []
                  const allVerifications = Array.isArray(viewEquipment?.verifications)
                    ? viewEquipment.verifications
                    : []
                  if (types.length === 0) {
                    if (allVerifications.length === 0) {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          Sin verificaciones
                        </Typography>
                      )
                    }
                    return (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        {renderVerificationBadge(allVerifications)}
                        <Typography variant="body2">
                          Ultima: {getLastVerificationDateLabel(allVerifications)}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ height: 40 }}
                          onClick={() => openVerificationHistory('')}
                        >
                          Ver verificaciones
                        </Button>
                      </Box>
                    )
                  }
                  return types.map((typeItem) => (
                    <Box
                      key={typeItem.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      {renderVerificationBadge(
                        (viewEquipment?.verifications || []).filter(
                          (verification) =>
                            String(verification?.verification_type_id) === String(typeItem.id),
                        ),
                      )}
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
                  ))
                })()}
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Calibraciones
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {renderCalibrationBadge(viewEquipment)}
                <Typography variant="body2">
                  Ultima: {getLastCalibrationDateLabel(viewEquipment?.calibrations)}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ height: 40 }}
                  onClick={() => openCalibrationHistory(viewEquipment)}
                >
                  Ver calibraciones
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Historial del equipo */}
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: 1 }}
          >
            Historial del equipo
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 1.5 }} />
          {isEquipmentHistoryLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography color="text.secondary">Cargando historial...</Typography>
            </Box>
          ) : equipmentHistoryError ? (
            <Typography color="text.secondary">{equipmentHistoryError}</Typography>
          ) : equipmentHistoryItems.length === 0 ? (
            <Typography color="text.secondary">Sin historial registrado.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
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
                  {equipmentHistoryItems.map((entry) => {
                    const isType = entry.kind === 'type'
                    const label = isType ? 'Rol' : 'Estacion'
                    const value = isType
                      ? `${getEquipmentTypeNameById(entry.equipment_type_id)} (${getEquipmentTypeRoleLabelById(entry.equipment_type_id)})`
                      : getTerminalNameById(entry.terminal_id)
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 1.5, gap: 1 }}>
        <Button onClick={onCancel}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export { EquipmentViewDialog }
