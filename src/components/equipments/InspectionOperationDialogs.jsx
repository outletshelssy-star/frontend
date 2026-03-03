import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'

const InspectionDialog = ({
  open,
  onClose,
  onCancel,
  onSave,
  inspectionEditMode,
  inspectionEquipment,
  canEditInspectionDate,
  inspectionForm,
  setInspectionForm,
  inspectionItems,
  isInspectionLoading,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        {inspectionEditMode ? 'Editar inspeccion' : 'Registrar inspeccion'}
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: 2 }}>
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
              gridTemplateColumns: {
                xs: '1fr',
                sm: canEditInspectionDate ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
              },
            }}
          >
            <TextField
              label="Serial"
              value={inspectionEquipment?.serial || '-'}
              slotProps={{ input: { readOnly: true } }}
            />
            <TextField
              label="Tipo de equipo"
              value={inspectionEquipment?.equipment_type?.name || '-'}
              slotProps={{ input: { readOnly: true } }}
            />
            {canEditInspectionDate ? (
              <TextField
                label="Fecha de inspeccion"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={inspectionForm.inspected_at ? String(inspectionForm.inspected_at).slice(0, 10) : ''}
                onChange={(event) =>
                  setInspectionForm((prev) => ({
                    ...prev,
                    inspected_at: event.target.value,
                  }))
                }
              />
            ) : null}
          </Box>
        </Box>

        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: 1 }}
          >
            Items de inspeccion
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          {inspectionItems.length === 0 ? (
            <Typography color="text.secondary">
              No hay items de inspeccion para este tipo de equipo.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              }}
            >
              {inspectionItems.map((item) => {
                const response = inspectionForm.responses[item.id] || {}
                return (
                  <Box
                    key={item.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1.5,
                      display: 'grid',
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>
                      {item.item}
                      {item.is_required ? ' *' : ''}
                    </Typography>
                    {item.response_type === 'boolean' ? (
                      <FormControl>
                        <InputLabel id={`inspection-bool-${item.id}`}>Respuesta</InputLabel>
                        <Select
                          labelId={`inspection-bool-${item.id}`}
                          label="Respuesta"
                          value={
                            response.value_bool === true
                              ? 'true'
                              : response.value_bool === false
                                ? 'false'
                                : ''
                          }
                          onChange={(event) => {
                            const value = event.target.value === '' ? null : event.target.value === 'true'
                            setInspectionForm((prev) => ({
                              ...prev,
                              responses: {
                                ...prev.responses,
                                [item.id]: {
                                  response_type: item.response_type,
                                  value_bool: value,
                                },
                              },
                            }))
                          }}
                        >
                          <MenuItem value="">Selecciona</MenuItem>
                          <MenuItem value="true">Si</MenuItem>
                          <MenuItem value="false">No</MenuItem>
                        </Select>
                      </FormControl>
                    ) : null}
                    {item.response_type === 'text' ? (
                      <TextField
                        label="Respuesta"
                        value={response.value_text || ''}
                        onChange={(event) =>
                          setInspectionForm((prev) => ({
                            ...prev,
                            responses: {
                              ...prev.responses,
                              [item.id]: {
                                response_type: item.response_type,
                                value_text: event.target.value,
                              },
                            },
                          }))
                        }
                      />
                    ) : null}
                    {item.response_type === 'number' ? (
                      <TextField
                        label="Respuesta"
                        type="number"
                        value={response.value_number ?? ''}
                        onChange={(event) =>
                          setInspectionForm((prev) => ({
                            ...prev,
                            responses: {
                              ...prev.responses,
                              [item.id]: {
                                response_type: item.response_type,
                                value_number: event.target.value,
                              },
                            },
                          }))
                        }
                      />
                    ) : null}
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>

        <TextField
          label="Notas"
          value={inspectionForm.notes}
          onChange={(event) => setInspectionForm((prev) => ({ ...prev, notes: event.target.value }))}
          multiline
          minRows={2}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={isInspectionLoading || inspectionItems.length === 0}
          onClick={onSave}
        >
          {isInspectionLoading ? 'Guardando...' : 'Guardar inspeccion'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const InspectionWaitDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Guardando inspeccion
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Procesando...</Typography>
      </DialogContent>
    </Dialog>
  )
}

const InspectionReplaceDialog = ({ open, onClose, onCancel, onReplace }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Inspeccion registrada hoy
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography>Ya existe una inspeccion registrada hoy para este equipo. Deseas reemplazarla?</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={onReplace}>
          Reemplazar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const InspectionBlockedAlertDialog = ({
  open,
  onClose,
  inspectionBlockedSerial,
  inspectionBlockedTypeName,
  inspectionBlockedRoleLabel,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Equipo no apto para operar
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 1.5 }}>
        <Typography>
          {inspectionBlockedSerial
            ? `El equipo ${inspectionBlockedSerial} quedo NO APTA tras la inspeccion.`
            : 'El equipo quedo NO APTA tras la inspeccion.'}
        </Typography>
        <Typography color="text.secondary">Tipo de equipo: {inspectionBlockedTypeName || '-'}</Typography>
        <Typography color="text.secondary">Tipo: {inspectionBlockedRoleLabel || '-'}</Typography>
        <Typography color="text.secondary">Serial: {inspectionBlockedSerial || '-'}</Typography>
        <Typography color="text.secondary">
          El equipo no puede seguir trabajando hasta que sea revisado y habilitado por un administrador del sistema.
        </Typography>
        <Typography color="text.secondary">
          Si consideras que hubo un error de captura, comunicate con un administrador.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant="contained" color="warning" onClick={onClose}>
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const VerificationWaitDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Guardando verificacion
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Procesando...</Typography>
      </DialogContent>
    </Dialog>
  )
}

const VerificationReplaceDialog = ({ open, onClose, onCancel, onReplace }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Verificacion registrada hoy
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography>Ya existe una verificacion registrada hoy para este equipo. Deseas reemplazarla?</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={onReplace}>
          Reemplazar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const CalibrationWaitDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Guardando calibracion
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Procesando...</Typography>
      </DialogContent>
    </Dialog>
  )
}

export {
  CalibrationWaitDialog,
  InspectionBlockedAlertDialog,
  InspectionDialog,
  InspectionReplaceDialog,
  InspectionWaitDialog,
  VerificationReplaceDialog,
  VerificationWaitDialog,
}
