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

const EquipmentCreateDialog = ({
  open,
  onClose,
  onCancel,
  onSave,
  formData,
  setFormData,
  equipmentTypes,
  isWeightEquipmentType,
  syncMeasureSpecs,
  formatEquipmentTypeOptionLabel,
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
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Nuevo equipo
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: 2 }}>
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: 1 }}
          >
            Identificacion
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            }}
          >
            <FormControl required sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
              <InputLabel id="equipment-type-create">Tipo de equipo</InputLabel>
              <Select
                labelId="equipment-type-create"
                label="Tipo de equipo"
                value={formData.equipment_type_id}
                onChange={(event) => {
                  const nextValue = event.target.value
                  const nextType = equipmentTypes.find((type) => String(type.id) === String(nextValue))
                  const isWeightType = isWeightEquipmentType(nextType)
                  setFormData((prev) => ({
                    ...prev,
                    equipment_type_id: nextValue,
                    weight_class: isWeightType ? prev.weight_class : '',
                    nominal_mass_value: isWeightType ? prev.nominal_mass_value : '',
                    nominal_mass_unit: isWeightType ? 'g' : '',
                  }))
                  const measures = Array.isArray(nextType?.measures) ? nextType.measures : []
                  syncMeasureSpecs(measures)
                }}
              >
                {equipmentTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {formatEquipmentTypeOptionLabel(type)}
                  </MenuItem>
                ))}
              </Select>
              {!equipmentTypes.length ? (
                <FormHelperText>No hay tipos de equipo disponibles.</FormHelperText>
              ) : null}
            </FormControl>
            <TextField
              label="Serial"
              value={formData.serial}
              onChange={(event) => setFormData((prev) => ({ ...prev, serial: event.target.value }))}
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
              onChange={(event) => setFormData((prev) => ({ ...prev, brand: event.target.value }))}
              required
            />
            <TextField
              label="Modelo"
              value={formData.model}
              onChange={(event) => setFormData((prev) => ({ ...prev, model: event.target.value }))}
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
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            }}
          >
            <FormControl required>
              <InputLabel id="equipment-owner-create">Empresa duena</InputLabel>
              <Select
                labelId="equipment-owner-create"
                label="Empresa duena"
                value={formData.owner_company_id}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    owner_company_id: event.target.value,
                  }))
                }
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl required>
              <InputLabel id="equipment-terminal-create">Terminal</InputLabel>
              <Select
                labelId="equipment-terminal-create"
                label="Terminal"
                value={formData.terminal_id}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, terminal_id: event.target.value }))
                }
              >
                {terminals.map((terminal) => (
                  <MenuItem key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="equipment-status-create">Estado</InputLabel>
              <Select
                labelId="equipment-status-create"
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
            <Divider sx={{ mt: 0.5, mb: 2 }} />
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              }}
            >
              <FormControl required>
                <InputLabel id="equipment-weight-class-create">Clase</InputLabel>
                <Select
                  labelId="equipment-weight-class-create"
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
                <InputLabel id="equipment-weight-nominal-create">Peso nominal (g)</InputLabel>
                <Select
                  labelId="equipment-weight-nominal-create"
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
            <Divider sx={{ mt: 0.5, mb: 2 }} />
            <Box sx={{ display: 'grid', gap: 1.5 }}>
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
                        unitLabelId: `measure-min-unit-${measure}`,
                      },
                      {
                        fieldKey: 'max_value',
                        unitKey: 'max_unit',
                        label: 'Maximo',
                        unitLabelId: `measure-max-unit-${measure}`,
                      },
                      {
                        fieldKey: 'resolution',
                        unitKey: 'resolution_unit',
                        label: 'Resolucion',
                        unitLabelId: `measure-resolution-unit-${measure}`,
                      },
                    ].map(({ fieldKey, unitKey, label, unitLabelId }) => (
                      <Box key={fieldKey} sx={{ display: 'grid', gap: 1 }}>
                        <TextField
                          label={label}
                          type="number"
                          size="small"
                          value={measureSpecs[measure]?.[fieldKey] ?? ''}
                          onChange={(event) =>
                            setMeasureSpecs((prev) => ({
                              ...prev,
                              [measure]: { ...prev[measure], [fieldKey]: event.target.value },
                            }))
                          }
                        />
                        <FormControl size="small">
                          <InputLabel id={unitLabelId}>Unidad</InputLabel>
                          <Select
                            labelId={unitLabelId}
                            label="Unidad"
                            value={measureSpecs[measure]?.[unitKey] || ''}
                            onChange={(event) =>
                              setMeasureSpecs((prev) => ({
                                ...prev,
                                [measure]: { ...prev[measure], [unitKey]: event.target.value },
                              }))
                            }
                          >
                            {getUnitOptions(measure).map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
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
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={onSave}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export { EquipmentCreateDialog }
