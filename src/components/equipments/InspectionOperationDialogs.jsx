import { useEffect, useRef, useState } from 'react'
import { todayColombiaStr } from '../../utils/dateUtils'
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
  FormHelperText,
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
  const [fieldErrors, setFieldErrors] = useState({})
  const [focusField, setFocusField] = useState('')
  const [focusRequest, setFocusRequest] = useState(0)
  const inspectionFieldRefs = useRef({})

  const getInspectionFieldKey = (itemId) => `response_${itemId}`

  const resetInlineState = () => {
    setFieldErrors({})
    setFocusField('')
    setFocusRequest(0)
    inspectionFieldRefs.current = {}
  }

  const handleClose = (...args) => {
    resetInlineState()
    onClose?.(...args)
  }

  const handleCancel = () => {
    resetInlineState()
    onCancel?.()
  }

  const getFieldError = (fieldKey) => String(fieldErrors?.[fieldKey] || '')

  const clearFieldError = (fieldKey) => {
    setFieldErrors((prev) => {
      if (!prev?.[fieldKey]) return prev
      return {
        ...prev,
        [fieldKey]: '',
      }
    })
  }

  const setInspectionFieldRef = (fieldKey) => (node) => {
    if (!node) {
      delete inspectionFieldRefs.current[fieldKey]
      return
    }
    inspectionFieldRefs.current[fieldKey] = node
  }

  useEffect(() => {
    if (!open || !focusField) return
    const target = inspectionFieldRefs.current[focusField]
    if (!target) return
    const focusable =
      typeof target.matches === 'function' &&
      target.matches('input, textarea, [role="combobox"]')
        ? target
        : target.querySelector?.('input, textarea, [role="combobox"]')
    focusable?.focus?.()
    focusable?.select?.()
  }, [focusField, focusRequest, open])

  const handleSaveClick = () => {
    const nextErrors = {}
    inspectionItems.forEach((item) => {
      const response = inspectionForm.responses[item.id] || {}
      const hasValue =
        item.response_type === 'boolean'
          ? response.value_bool === true || response.value_bool === false
          : item.response_type === 'text'
            ? String(response.value_text || '').trim().length > 0
            : item.response_type === 'number'
              ? response.value_number !== '' && response.value_number !== null
              : false
      if (item.is_required && !hasValue) {
        nextErrors[getInspectionFieldKey(item.id)] = 'Selecciona una respuesta.'
      }
    })
    const firstInvalidField = Object.keys(nextErrors)[0] || ''
    if (firstInvalidField) {
      setFieldErrors(nextErrors)
      setFocusField(firstInvalidField)
      setFocusRequest((prev) => prev + 1)
      return
    }
    setFieldErrors({})
    setFocusField('')
    onSave?.()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        {inspectionEditMode ? 'Editar inspeccion' : 'Registrar inspeccion'}
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '16px !important' }}>
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
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayColombiaStr() } }}
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
                const fieldKey = getInspectionFieldKey(item.id)
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
                      <FormControl
                        error={Boolean(getFieldError(fieldKey))}
                        ref={setInspectionFieldRef(fieldKey)}
                      >
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
                            clearFieldError(fieldKey)
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
                        <FormHelperText>{getFieldError(fieldKey) || ' '}</FormHelperText>
                      </FormControl>
                    ) : null}
                    {item.response_type === 'text' ? (
                      <TextField
                        label="Respuesta"
                        value={response.value_text || ''}
                        inputRef={setInspectionFieldRef(fieldKey)}
                        error={Boolean(getFieldError(fieldKey))}
                        helperText={getFieldError(fieldKey) || ' '}
                        onChange={(event) =>
                          {
                            clearFieldError(fieldKey)
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
                        }
                      />
                    ) : null}
                    {item.response_type === 'number' ? (
                      <TextField
                        label="Respuesta"
                        type="number"
                        value={response.value_number ?? ''}
                        inputRef={setInspectionFieldRef(fieldKey)}
                        error={Boolean(getFieldError(fieldKey))}
                        helperText={getFieldError(fieldKey) || ' '}
                        onChange={(event) =>
                          {
                            clearFieldError(fieldKey)
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
        <Button onClick={handleCancel}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={isInspectionLoading || inspectionItems.length === 0}
          onClick={handleSaveClick}
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
      <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: '16px !important', pb: 3 }}>
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
      <DialogContent sx={{ pt: '16px !important' }}>
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

const InspectionNoAptaConfirmDialog = ({
  open,
  onClose,
  onEdit,
  onContinue,
  message,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Inspección no apta
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 1.25, pt: '16px !important' }}>
        <Typography>El resultado de esta inspección será NO APTA.</Typography>
        {message ? <Typography color="text.secondary">{message}</Typography> : null}
        <Typography color="text.secondary">
          ¿Deseas continuar con el guardado o prefieres modificar los datos?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onEdit}>Modificar datos</Button>
        <Button variant="contained" color="warning" onClick={onContinue}>
          Continuar y guardar
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
      <DialogContent sx={{ display: 'grid', gap: 1.5, pt: '16px !important' }}>
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
      <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: '16px !important', pb: 3 }}>
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
      <DialogContent sx={{ pt: '16px !important' }}>
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

const VerificationNoAptaConfirmDialog = ({
  open,
  onClose,
  onEdit,
  onContinue,
  message,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Verificación no apta
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 1.25, pt: '16px !important' }}>
        <Typography>El resultado de esta verificación será NO APTA.</Typography>
        {message ? <Typography color="text.secondary">{message}</Typography> : null}
        <Typography color="text.secondary">
          ¿Deseas continuar con el guardado o prefieres modificar los datos?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onEdit}>Modificar datos</Button>
        <Button variant="contained" color="warning" onClick={onContinue}>
          Continuar y guardar
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
      <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: '16px !important', pb: 3 }}>
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
  InspectionNoAptaConfirmDialog,
  InspectionReplaceDialog,
  InspectionWaitDialog,
  VerificationNoAptaConfirmDialog,
  VerificationReplaceDialog,
  VerificationWaitDialog,
}
