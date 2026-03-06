import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
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

const EquipmentEditDialog = ({
  open,
  onClose,
  onCancel,
  onSave,
  formData,
  setFormData,
  selectedEquipmentTypeName,
  selectedEquipmentTypeRole,
  equipmentTypes,
  syncMeasureSpecs,
  availableEditRoles,
  equipmentRoleLabels,
  companies,
  terminals,
  statusOptions,
  isWeightTypeSelected,
  weightClassOptions,
  weightNominalOptions,
  getWeightEmp,
  selectedMeasures,
  getMeasureLabel,
  measureSpecs,
  setMeasureSpecs,
  getUnitOptions,
}) => {
  const REQUIRED_FIELD_ERRORS_INITIAL_STATE = {
    role: '',
    brand: '',
    model: '',
    serial: '',
    owner_company_id: '',
    terminal_id: '',
  }
  const [requiredFieldErrors, setRequiredFieldErrors] = useState(REQUIRED_FIELD_ERRORS_INITIAL_STATE)
  const [measureFieldErrors, setMeasureFieldErrors] = useState({})
  const [focusField, setFocusField] = useState('')

  const roleInputRef = useRef(null)
  const brandInputRef = useRef(null)
  const modelInputRef = useRef(null)
  const serialInputRef = useRef(null)
  const ownerCompanyInputRef = useRef(null)
  const terminalInputRef = useRef(null)
  const measureInputRefs = useRef({})

  const measureCardsColumns =
    selectedMeasures.length <= 1
      ? { xs: '1fr' }
      : { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }

  const clearRequiredFieldError = (fieldKey) => {
    setRequiredFieldErrors((prev) => ({ ...prev, [fieldKey]: '' }))
    setFocusField((prev) => (prev === fieldKey ? '' : prev))
  }

  const clearMeasureFieldError = (measureKey, fieldKey) => {
    setMeasureFieldErrors((prev) => {
      if (!prev?.[measureKey]?.[fieldKey]) return prev
      return {
        ...prev,
        [measureKey]: {
          ...prev[measureKey],
          [fieldKey]: '',
        },
      }
    })
    const expectedFocus = `measure:${measureKey}:${fieldKey}`
    setFocusField((prev) => (prev === expectedFocus ? '' : prev))
  }

  const setMeasureInputRef = (measureKey, fieldKey) => (node) => {
    const refKey = `${measureKey}.${fieldKey}`
    if (node) {
      measureInputRefs.current[refKey] = node
      return
    }
    delete measureInputRefs.current[refKey]
  }

  useEffect(() => {
    if (!open) {
      setRequiredFieldErrors(REQUIRED_FIELD_ERRORS_INITIAL_STATE)
      setMeasureFieldErrors({})
      measureInputRefs.current = {}
      setFocusField('')
      return
    }
    if (!focusField) return
    const inputMap = {
      role: roleInputRef.current,
      brand: brandInputRef.current,
      model: modelInputRef.current,
      serial: serialInputRef.current,
      owner_company_id: ownerCompanyInputRef.current,
      terminal_id: terminalInputRef.current,
    }
    let target = inputMap[focusField]
    if (!target && focusField.startsWith('measure:')) {
      const [, measureKey = '', fieldKey = ''] = focusField.split(':')
      target = measureInputRefs.current[`${measureKey}.${fieldKey}`]
    }
    if (!target) return
    const selectTarget = target.querySelector?.('input')
    if (selectTarget) {
      selectTarget.focus?.()
      selectTarget.select?.()
      return
    }
    target.focus?.()
    target.select?.()
  }, [focusField, open])

  useEffect(() => {
    if (!open) return
    setMeasureFieldErrors((prev) => {
      const next = {}
      selectedMeasures.forEach((measure) => {
        if (prev?.[measure]) next[measure] = prev[measure]
      })
      return next
    })
  }, [open, selectedMeasures])

  const handleSaveClick = () => {
    const nextErrors = {
      role: '',
      brand: '',
      model: '',
      serial: '',
      owner_company_id: '',
      terminal_id: '',
    }
    if (!formData.equipment_type_id || !String(selectedEquipmentTypeRole || '').trim()) {
      nextErrors.role = 'Selecciona el rol.'
    }
    if (!String(formData.brand || '').trim()) {
      nextErrors.brand = 'La marca es obligatoria.'
    }
    if (!String(formData.model || '').trim()) {
      nextErrors.model = 'El modelo es obligatorio.'
    }
    if (!String(formData.serial || '').trim()) {
      nextErrors.serial = 'El serial es obligatorio.'
    }
    if (!formData.owner_company_id) {
      nextErrors.owner_company_id = 'Selecciona la propietaria.'
    }
    if (!formData.terminal_id) {
      nextErrors.terminal_id = 'Selecciona el terminal.'
    }
    const hasErrors = Object.values(nextErrors).some(Boolean)
    if (hasErrors) {
      setRequiredFieldErrors(nextErrors)
      const firstMissingField =
        ['role', 'brand', 'model', 'serial', 'owner_company_id', 'terminal_id'].find(
          (fieldKey) => nextErrors[fieldKey],
        ) || ''
      setFocusField(firstMissingField)
      return
    }

    const measureErrorOrder = [
      'min_value',
      'min_unit',
      'max_value',
      'max_unit',
      'resolution',
      'resolution_unit',
    ]
    const nextMeasureErrors = {}
    let firstMeasureErrorFocus = ''
    selectedMeasures.forEach((measure) => {
      const spec = measureSpecs?.[measure] || {}
      const errors = {
        min_value: '',
        min_unit: '',
        max_value: '',
        max_unit: '',
        resolution: '',
        resolution_unit: '',
      }
      if (spec.min_value === '' || spec.min_value === null || spec.min_value === undefined) {
        errors.min_value = 'Ingresa el minimo.'
      } else if (Number.isNaN(Number(spec.min_value))) {
        errors.min_value = 'Ingresa un valor numerico.'
      }
      if (!String(spec.min_unit || '').trim()) {
        errors.min_unit = 'Selecciona una unidad.'
      }
      if (spec.max_value === '' || spec.max_value === null || spec.max_value === undefined) {
        errors.max_value = 'Ingresa el maximo.'
      } else if (Number.isNaN(Number(spec.max_value))) {
        errors.max_value = 'Ingresa un valor numerico.'
      }
      if (!String(spec.max_unit || '').trim()) {
        errors.max_unit = 'Selecciona una unidad.'
      }
      if (
        spec.resolution === '' ||
        spec.resolution === null ||
        spec.resolution === undefined
      ) {
        errors.resolution = 'Ingresa la resolucion.'
      } else if (Number.isNaN(Number(spec.resolution))) {
        errors.resolution = 'Ingresa un valor numerico.'
      }
      if (!String(spec.resolution_unit || '').trim()) {
        errors.resolution_unit = 'Selecciona una unidad.'
      }
      if (Object.values(errors).some(Boolean)) {
        nextMeasureErrors[measure] = errors
        if (!firstMeasureErrorFocus) {
          const firstMeasureErrorField = measureErrorOrder.find((fieldKey) => errors[fieldKey]) || ''
          if (firstMeasureErrorField) {
            firstMeasureErrorFocus = `measure:${measure}:${firstMeasureErrorField}`
          }
        }
      }
    })
    if (Object.keys(nextMeasureErrors).length > 0) {
      setMeasureFieldErrors(nextMeasureErrors)
      setFocusField(firstMeasureErrorFocus)
      return
    }
    setMeasureFieldErrors({})
    onSave()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1 }}>
        Editar equipo
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 1.5, pt: '12px !important' }}>
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
            <TextField
              label="Tipo de equipo"
              value={selectedEquipmentTypeName || '-'}
              slotProps={{ input: { readOnly: true } }}
              sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
            />
            <FormControl required error={Boolean(requiredFieldErrors.role)}>
              <InputLabel id="equipment-role-edit">Rol</InputLabel>
              <Select
                labelId="equipment-role-edit"
                label="Rol"
                value={String(selectedEquipmentTypeRole || '').toLowerCase()}
                inputRef={roleInputRef}
                onChange={(event) => {
                  const nextRole = String(event.target.value || '').toLowerCase()
                  if (!selectedEquipmentTypeName || !nextRole) return
                  const nextType = equipmentTypes.find(
                    (type) =>
                      String(type?.name || '') === String(selectedEquipmentTypeName) &&
                      String(type?.role || '').toLowerCase() === nextRole,
                  )
                  if (!nextType) return
                  clearRequiredFieldError('role')
                  setFormData((prev) => ({
                    ...prev,
                    equipment_type_id: nextType.id,
                  }))
                  const measures = Array.isArray(nextType?.measures) ? nextType.measures : []
                  syncMeasureSpecs(measures)
                }}
              >
                {availableEditRoles.map((roleKey) => (
                  <MenuItem key={roleKey} value={roleKey}>
                    {equipmentRoleLabels[roleKey] || roleKey}
                  </MenuItem>
                ))}
              </Select>
              {requiredFieldErrors.role ? (
                <FormHelperText>{requiredFieldErrors.role}</FormHelperText>
              ) : availableEditRoles.length === 0 ? (
                <FormHelperText>No hay roles disponibles para este tipo.</FormHelperText>
              ) : availableEditRoles.length === 1 ? (
                <FormHelperText>Solo existe un rol para este tipo.</FormHelperText>
              ) : null}
            </FormControl>
            <TextField
              label="Serial"
              value={formData.serial}
              inputRef={serialInputRef}
              error={Boolean(requiredFieldErrors.serial)}
              helperText={requiredFieldErrors.serial || ''}
              onChange={(event) => {
                clearRequiredFieldError('serial')
                setFormData((prev) => ({ ...prev, serial: event.target.value }))
              }}
              required
            />
            <TextField
              label="Codigo interno"
              value={formData.internal_code}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, internal_code: event.target.value }))
              }
            />
            <TextField
              label="Marca"
              value={formData.brand}
              inputRef={brandInputRef}
              error={Boolean(requiredFieldErrors.brand)}
              helperText={requiredFieldErrors.brand || ''}
              onChange={(event) => {
                clearRequiredFieldError('brand')
                setFormData((prev) => ({ ...prev, brand: event.target.value }))
              }}
              required
            />
            <TextField
              label="Modelo"
              value={formData.model}
              inputRef={modelInputRef}
              error={Boolean(requiredFieldErrors.model)}
              helperText={requiredFieldErrors.model || ''}
              onChange={(event) => {
                clearRequiredFieldError('model')
                setFormData((prev) => ({ ...prev, model: event.target.value }))
              }}
              required
            />
            <TextField
              label="Seriales de componentes"
              value={formData.component_serials_text}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  component_serials_text: event.target.value,
                }))
              }
              placeholder={'Cinta: CINTA-001\nPlomada: PLOM-002'}
              multiline
              minRows={2}
              sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
              helperText="Formato: Nombre: Serial (uno por linea)"
            />
          </Box>
        </Box>

        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: 1 }}
          >
            Ubicacion y estado
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 1.5 }} />
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
            }}
          >
            <FormControl required error={Boolean(requiredFieldErrors.owner_company_id)}>
              <InputLabel id="equipment-owner-edit">Propietaria</InputLabel>
              <Select
                labelId="equipment-owner-edit"
                label="Propietaria"
                value={formData.owner_company_id}
                inputRef={ownerCompanyInputRef}
                onChange={(event) => {
                  clearRequiredFieldError('owner_company_id')
                  setFormData((prev) => ({
                    ...prev,
                    owner_company_id: event.target.value,
                  }))
                }}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
              {requiredFieldErrors.owner_company_id ? (
                <FormHelperText>{requiredFieldErrors.owner_company_id}</FormHelperText>
              ) : null}
            </FormControl>
            <FormControl required error={Boolean(requiredFieldErrors.terminal_id)}>
              <InputLabel id="equipment-terminal-edit">Terminal</InputLabel>
              <Select
                labelId="equipment-terminal-edit"
                label="Terminal"
                value={formData.terminal_id}
                inputRef={terminalInputRef}
                onChange={(event) => {
                  clearRequiredFieldError('terminal_id')
                  setFormData((prev) => ({ ...prev, terminal_id: event.target.value }))
                }}
              >
                {terminals.map((terminal) => (
                  <MenuItem key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </MenuItem>
                ))}
              </Select>
              {requiredFieldErrors.terminal_id ? (
                <FormHelperText>{requiredFieldErrors.terminal_id}</FormHelperText>
              ) : null}
            </FormControl>
            <FormControl>
              <InputLabel id="equipment-status-edit">Estado</InputLabel>
              <Select
                labelId="equipment-status-edit"
                label="Estado"
                value={formData.status}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, status: event.target.value }))
                }
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="equipment-active-edit">Activo</InputLabel>
              <Select
                labelId="equipment-active-edit"
                label="Activo"
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: event.target.value === 'active',
                  }))
                }
              >
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {isWeightTypeSelected ? (
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Datos de peso
            </Typography>
            <Divider sx={{ mt: 0.5, mb: 1.5 }} />
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              }}
            >
              <FormControl required>
                <InputLabel id="equipment-weight-class-edit">Clase</InputLabel>
                <Select
                  labelId="equipment-weight-class-edit"
                  label="Clase"
                  value={formData.weight_class}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      weight_class: event.target.value,
                    }))
                  }
                >
                  {weightClassOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl required>
                <InputLabel id="equipment-weight-nominal-edit">Peso nominal (g)</InputLabel>
                <Select
                  labelId="equipment-weight-nominal-edit"
                  label="Peso nominal (g)"
                  value={formData.nominal_mass_value}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      nominal_mass_value: event.target.value,
                    }))
                  }
                >
                  {weightNominalOptions.map((option) => (
                    <MenuItem key={option} value={String(option)}>
                      {option} g
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="EMP"
                value={getWeightEmp(formData.nominal_mass_value, formData.weight_class) ?? ''}
                slotProps={{ input: { readOnly: true } }}
              />
            </Box>
          </Box>
        ) : null}

        {selectedMeasures.length > 0 ? (
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Especificaciones por medida
            </Typography>
            <Divider sx={{ mt: 0.5, mb: 1.5 }} />
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: measureCardsColumns }}>
              {selectedMeasures.map((measure) => (
                <Box
                  key={measure}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    backgroundColor: 'grey.50',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1.5, textTransform: 'capitalize' }}
                  >
                    {getMeasureLabel(measure)}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                    }}
                  >
                    {[
                      {
                        fieldKey: 'min_value',
                        unitKey: 'min_unit',
                        label: 'Minimo',
                        unitLabelId: `measure-min-unit-edit-${measure}`,
                      },
                      {
                        fieldKey: 'max_value',
                        unitKey: 'max_unit',
                        label: 'Maximo',
                        unitLabelId: `measure-max-unit-edit-${measure}`,
                      },
                      {
                        fieldKey: 'resolution',
                        unitKey: 'resolution_unit',
                        label: 'Resolucion',
                        unitLabelId: `measure-resolution-unit-edit-${measure}`,
                      },
                    ].map(({ fieldKey, unitKey, label, unitLabelId }) => (
                      <Box key={fieldKey} sx={{ display: 'grid', gap: 2.5 }}>
                        <TextField
                          label={label}
                          type="number"
                          size="small"
                          value={measureSpecs[measure]?.[fieldKey] ?? ''}
                          inputRef={setMeasureInputRef(measure, fieldKey)}
                          error={Boolean(measureFieldErrors?.[measure]?.[fieldKey])}
                          helperText={measureFieldErrors?.[measure]?.[fieldKey] || ''}
                          onChange={(event) =>
                            {
                              clearMeasureFieldError(measure, fieldKey)
                              setMeasureSpecs((prev) => ({
                                ...prev,
                                [measure]: { ...prev[measure], [fieldKey]: event.target.value },
                              }))
                            }
                          }
                        />
                        <FormControl size="small" error={Boolean(measureFieldErrors?.[measure]?.[unitKey])}>
                          <InputLabel id={unitLabelId}>Unidad</InputLabel>
                          <Select
                            labelId={unitLabelId}
                            label="Unidad"
                            value={measureSpecs[measure]?.[unitKey] || ''}
                            inputRef={setMeasureInputRef(measure, unitKey)}
                            onChange={(event) =>
                              {
                                clearMeasureFieldError(measure, unitKey)
                                setMeasureSpecs((prev) => ({
                                  ...prev,
                                  [measure]: { ...prev[measure], [unitKey]: event.target.value },
                                }))
                              }
                            }
                          >
                            {getUnitOptions(measure).map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {measureFieldErrors?.[measure]?.[unitKey] ? (
                            <FormHelperText>{measureFieldErrors[measure][unitKey]}</FormHelperText>
                          ) : null}
                        </FormControl>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 1.5, gap: 1 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={handleSaveClick}>
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export { EquipmentEditDialog }
