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

const VerificationDialog = ({
  open,
  onClose,
  onCancel,
  onSave,
  verificationEditMode,
  canEditVerificationDate,
  verificationEquipment,
  verificationForm,
  setVerificationForm,
  selectedVerificationType,
  verificationTypes,
  loadVerificationItems,
  setVerificationItems,
  setToast,
  requiresComparisonReadings,
  isHydrometerMonthlyVerification,
  requiresKarlFischerVerification,
  requiresBalanceComparison,
  requiresTemperatureComparison,
  requiresTapeComparison,
  isMonthlyVerification,
  hydrometerThermometerOptions,
  hydrometerReferenceOptions,
  hydrometerWorkApi60f,
  hydrometerWorkApi60fError,
  hydrometerRefApi60f,
  hydrometerRefApi60fError,
  referenceEquipmentOptions,
  selectedReferenceEquipment,
  kfBalanceOptions,
  convertLengthToMmDisplay,
  convertTemperatureToFDisplay,
  normalizeWeightToGrams,
  getWeightEmp,
  verificationItems,
  isVerificationLoading,
}) => {
  return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1 }}>
          {verificationEditMode ? 'Editar verificación' : 'Registrar verificación'}
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 1.5 }}>
          {/* ── Equipo ── */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Equipo
            </Typography>
            <Divider sx={{ mt: 0.5, mb: 1.5 }} />
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: canEditVerificationDate ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                },
              }}
            >
              <TextField
                label="Serial"
                value={verificationEquipment?.serial || '-'}
                slotProps={{ input: { readOnly: true } }}
              />
              <TextField
                label="Tipo de equipo"
                value={verificationEquipment?.equipment_type?.name || '-'}
                slotProps={{ input: { readOnly: true } }}
              />
              {canEditVerificationDate ? (
                <TextField
                  label="Fecha de verificación"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={
                    verificationForm.verified_at
                      ? String(verificationForm.verified_at).slice(0, 10)
                      : ''
                  }
                  onChange={(event) =>
                    setVerificationForm((prev) => ({
                      ...prev,
                      verified_at: event.target.value,
                    }))
                  }
                />
              ) : null}
            </Box>
          </Box>

          {/* ── Tipo de verificación ── */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Tipo de verificación
            </Typography>
            <Divider sx={{ mt: 0.5, mb: 1.5 }} />
            {(() => {
            const selectedType = selectedVerificationType
            if (selectedType && [1, 30].includes(Number(selectedType.frequency_days))) {
              return (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo de verificación
                  </Typography>
                  <Typography>{selectedType.name}</Typography>
                </Box>
              )
            }
            return (
              <FormControl size="small" fullWidth>
                <InputLabel id="verification-type-label">Tipo de verificación</InputLabel>
                <Select
                  labelId="verification-type-label"
                  label="Tipo de verificación"
                  value={verificationForm.verification_type_id}
                  onChange={async (event) => {
                    const selectedTypeId = String(event.target.value || '')
                    setVerificationForm((prev) => ({
                      ...prev,
                      verification_type_id: selectedTypeId,
                      responses: {},
                    }))
                    setVerificationItems([])
                    if (!selectedTypeId || !verificationEquipment) {
                      return
                    }
                    try {
                      await loadVerificationItems({
                        equipmentTypeId: verificationEquipment.equipment_type_id,
                        verificationTypeId: Number(selectedTypeId),
                      })
                    } catch (err) {
                      setToast({
                        open: true,
                        message: err?.detail || 'No se pudieron cargar los ítems de verificación.',
                        severity: 'error',
                      })
                    }
                  }}
                >
                  {verificationTypes.map((typeItem) => (
                    <MenuItem key={typeItem.id} value={String(typeItem.id)}>
                      {typeItem.name} ({typeItem.frequency_days} días)
                    </MenuItem>
                  ))}
                </Select>
                {verificationTypes.length === 0 ? (
                  <FormHelperText>
                    No hay tipos de verificación para este tipo de equipo.
                  </FormHelperText>
                ) : null}
              </FormControl>
            )
            })()}
          </Box>

          {requiresComparisonReadings ||
          isHydrometerMonthlyVerification ||
          requiresKarlFischerVerification ? (
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 700, letterSpacing: 1 }}
              >
                {requiresKarlFischerVerification
                  ? 'Estandarización del reactivo'
                  : 'Comparación contra patrón'}
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 1.5 }} />
              <Box sx={{ display: 'grid', gap: 1.25 }}>
              {isHydrometerMonthlyVerification ? (
                <>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
                    }}
                  >
                    <FormControl size="small" fullWidth>
                      <InputLabel id="thermometer-working-label">Termómetro de trabajo</InputLabel>
                      <Select
                        labelId="thermometer-working-label"
                        label="Termómetro de trabajo"
                        value={verificationForm.thermometer_working_id}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            thermometer_working_id: String(event.target.value || ''),
                          }))
                        }
                      >
                        {hydrometerThermometerOptions.map((candidate) => (
                          <MenuItem key={candidate.id} value={String(candidate.id)}>
                            {candidate.serial} - {candidate.brand} {candidate.model}
                          </MenuItem>
                        ))}
                      </Select>
                      {hydrometerThermometerOptions.length === 0 ? (
                        <FormHelperText>
                          No hay termómetros de trabajo disponibles en este terminal.
                        </FormHelperText>
                      ) : null}
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="thermometer-unit-label">Unidad termómetro</InputLabel>
                      <Select
                        labelId="thermometer-unit-label"
                        label="Unidad termómetro"
                        value={verificationForm.thermometer_unit}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            thermometer_unit: String(event.target.value || 'c'),
                          }))
                        }
                      >
                        <MenuItem value="c">C</MenuItem>
                        <MenuItem value="f">F</MenuItem>
                        <MenuItem value="k">K</MenuItem>
                        <MenuItem value="r">R</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="hydrometer-product-label">Producto</InputLabel>
                    <Select
                      labelId="hydrometer-product-label"
                      label="Producto"
                      value={verificationForm.product_name}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          product_name: String(event.target.value || 'Crudo'),
                        }))
                      }
                    >
                      <MenuItem value="Crudo">Crudo</MenuItem>
                    </Select>
                  </FormControl>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                    }}
                  >
                    <TextField
                      label="Lectura hidrómetro trabajo (API)"
                      type="number"
                      size="small"
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      value={verificationForm.hydrometer_working_value}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          hydrometer_working_value: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      label="Lectura termómetro trabajo"
                      type="number"
                      size="small"
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      value={verificationForm.thermometer_working_value}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          thermometer_working_value: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      label="API a 60F"
                      size="small"
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      value={hydrometerWorkApi60f}
                      slotProps={{ input: { readOnly: true } }}
                      helperText={hydrometerWorkApi60fError || ' '}
                      error={Boolean(hydrometerWorkApi60fError)}
                    />
                  </Box>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="hydrometer-reference-label">Hidrómetro patrón</InputLabel>
                    <Select
                      labelId="hydrometer-reference-label"
                      label="Hidrómetro patrón"
                      value={verificationForm.reference_equipment_id}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          reference_equipment_id: String(event.target.value || ''),
                        }))
                      }
                    >
                      {hydrometerReferenceOptions.map((candidate) => (
                        <MenuItem key={candidate.id} value={String(candidate.id)}>
                          {candidate.serial} - {candidate.brand} {candidate.model}
                        </MenuItem>
                      ))}
                    </Select>
                    {hydrometerReferenceOptions.length === 0 ? (
                      <FormHelperText>
                        No hay hidrómetros patrón disponibles en este terminal.
                      </FormHelperText>
                    ) : null}
                  </FormControl>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                    }}
                  >
                    <TextField
                      label="Lectura hidrómetro patrón (API)"
                      type="number"
                      size="small"
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      value={verificationForm.hydrometer_reference_value}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          hydrometer_reference_value: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      label="Lectura termómetro para patrón"
                      type="number"
                      size="small"
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      value={verificationForm.thermometer_reference_value}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          thermometer_reference_value: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      label="API a 60F"
                      size="small"
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      value={hydrometerRefApi60f}
                      slotProps={{ input: { readOnly: true } }}
                      helperText={hydrometerRefApi60fError || ' '}
                      error={Boolean(hydrometerRefApi60fError)}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {(() => {
                      const work = Number(hydrometerWorkApi60f)
                      const ref = Number(hydrometerRefApi60f)
                      if (Number.isNaN(work) || Number.isNaN(ref)) {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            Diferencia API60F: -
                          </Typography>
                        )
                      }
                      const diff = work - ref
                      const ok = diff >= -0.5 && diff <= 0.5
                      return (
                        <>
                          <Typography variant="caption" color="text.secondary">
                            Diferencia API60F: {diff.toFixed(1)} API
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: ok ? 'success.main' : 'error.main', fontWeight: 600 }}
                          >
                            {ok ? 'Cumple' : 'No cumple'}
                          </Typography>
                        </>
                      )
                    })()}
                  </Box>
                </>
              ) : !requiresKarlFischerVerification ? (
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
                    alignItems: 'center',
                    mt: 0.75,
                  }}
                >
                  <FormControl
                    size="small"
                    fullWidth
                    sx={{
                      gridColumn: {
                        xs: '1 / -1',
                        sm: requiresBalanceComparison ? '1 / span 2' : '1 / -1',
                      },
                    }}
                  >
                    <InputLabel id="reference-equipment-label">
                      {requiresBalanceComparison ? 'Pesa patrón' : 'Equipo patrón'}
                    </InputLabel>
                    <Select
                      labelId="reference-equipment-label"
                      label={requiresBalanceComparison ? 'Pesa patrón' : 'Equipo patrón'}
                      value={verificationForm.reference_equipment_id}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          reference_equipment_id: String(event.target.value || ''),
                        }))
                      }
                    >
                      {referenceEquipmentOptions.map((candidate) => (
                        <MenuItem key={candidate.id} value={String(candidate.id)}>
                          {candidate.serial} - {candidate.brand} {candidate.model}
                        </MenuItem>
                      ))}
                    </Select>
                    {referenceEquipmentOptions.length === 0 ? (
                      <FormHelperText>
                        No hay equipos patrón disponibles en este terminal.
                      </FormHelperText>
                    ) : null}
                  </FormControl>
                  {requiresBalanceComparison ? (
                    <TextField
                      label="Peso nominal"
                      size="small"
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      value={
                        selectedReferenceEquipment
                          ? `${selectedReferenceEquipment.nominal_mass_value ?? '-'} ${
                              selectedReferenceEquipment.nominal_mass_unit || 'g'
                            }`
                          : '-'
                      }
                      slotProps={{ input: { readOnly: true } }}
                    />
                  ) : (
                    <Box />
                  )}
                </Box>
              ) : null}
              {requiresBalanceComparison ? (
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    alignItems: 'center',
                  }}
                >
                  <TextField
                    label="Lectura balanza"
                    type="number"
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: 40 } }}
                    value={verificationForm.balance_reading_value}
                    onChange={(event) =>
                      setVerificationForm((prev) => ({
                        ...prev,
                        balance_reading_value: event.target.value,
                      }))
                    }
                  />
                  <FormControl
                    size="small"
                    fullWidth
                    sx={{ '& .MuiInputBase-root': { height: 40 } }}
                  >
                    <InputLabel id="balance-unit-label">Unidad balanza</InputLabel>
                    <Select
                      labelId="balance-unit-label"
                      label="Unidad balanza"
                      value={verificationForm.balance_unit || 'g'}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          balance_unit: String(event.target.value || 'g'),
                        }))
                      }
                    >
                      <MenuItem value="g">g</MenuItem>
                      <MenuItem value="mg">mg</MenuItem>
                    </Select>
                  </FormControl>
                  {(() => {
                    if (!selectedReferenceEquipment) return null
                    const underG = normalizeWeightToGrams(
                      verificationForm.balance_reading_value,
                      verificationForm.balance_unit || 'g',
                    )
                    const refG = normalizeWeightToGrams(
                      selectedReferenceEquipment.nominal_mass_value,
                      selectedReferenceEquipment.nominal_mass_unit || 'g',
                    )
                    if (underG === null || refG === null) {
                      return (
                        <Typography variant="caption" color="text.secondary">
                          Diferencia: -
                        </Typography>
                      )
                    }
                    const emp =
                      Number(selectedReferenceEquipment.emp_value) > 0
                        ? Number(selectedReferenceEquipment.emp_value)
                        : getWeightEmp(
                            selectedReferenceEquipment.nominal_mass_value,
                            selectedReferenceEquipment.weight_class,
                          )
                    if (emp === null || emp === undefined) {
                      return (
                        <Typography variant="caption" color="text.secondary">
                          EMP: -
                        </Typography>
                      )
                    }
                    const diff = refG - underG
                    const ok = Math.abs(diff) <= emp
                    return (
                      <Typography
                        variant="caption"
                        sx={{
                          color: ok ? 'success.main' : 'error.main',
                          fontWeight: 600,
                          gridColumn: { sm: '1 / span 2' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Diferencia: {diff.toFixed(6)} g (EMP {emp.toFixed(6)} g) —{' '}
                        {ok ? 'Cumple' : 'No cumple'}
                      </Typography>
                    )
                  })()}
                </Box>
              ) : null}
              {requiresKarlFischerVerification ? (
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1,
                  }}
                >
                  <FormControl size="small" fullWidth>
                    <InputLabel id="kf-balance-label">Balanza analítica (trabajo)</InputLabel>
                    <Select
                      labelId="kf-balance-label"
                      label="Balanza analítica (trabajo)"
                      value={verificationForm.reference_equipment_id}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          reference_equipment_id: String(event.target.value || ''),
                        }))
                      }
                    >
                      {kfBalanceOptions.map((candidate) => (
                        <MenuItem key={candidate.id} value={String(candidate.id)}>
                          {candidate.serial} - {candidate.brand} {candidate.model}
                        </MenuItem>
                      ))}
                    </Select>
                    {kfBalanceOptions.length === 0 ? (
                      <FormHelperText>
                        No hay balanzas analíticas disponibles en este terminal.
                      </FormHelperText>
                    ) : null}
                  </FormControl>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                      alignItems: 'center',
                      mt: 0.75,
                    }}
                  >
                    <TextField
                      label="Peso 1 (mg)"
                      type="number"
                      size="small"
                      value={verificationForm.kf_weight_1}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          kf_weight_1: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      label="Volumen 1 (mL)"
                      type="number"
                      size="small"
                      value={verificationForm.kf_volume_1}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          kf_volume_1: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      label="Factor 1 (mg/mL)"
                      size="small"
                      value={(() => {
                        const w = Number(verificationForm.kf_weight_1)
                        const v = Number(verificationForm.kf_volume_1)
                        if (!v || Number.isNaN(w) || Number.isNaN(v)) return ''
                        return (w / v).toFixed(4)
                      })()}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                      alignItems: 'center',
                      mt: 0.5,
                    }}
                  >
                    <TextField
                      label="Peso 2 (mg)"
                      type="number"
                      size="small"
                      value={verificationForm.kf_weight_2}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          kf_weight_2: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      label="Volumen 2 (mL)"
                      type="number"
                      size="small"
                      value={verificationForm.kf_volume_2}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          kf_volume_2: event.target.value,
                        }))
                      }
                    />
                    <TextField
                      label="Factor 2 (mg/mL)"
                      size="small"
                      value={(() => {
                        const w = Number(verificationForm.kf_weight_2)
                        const v = Number(verificationForm.kf_volume_2)
                        if (!v || Number.isNaN(w) || Number.isNaN(v)) return ''
                        return (w / v).toFixed(4)
                      })()}
                      slotProps={{ input: { readOnly: true } }}
                    />
                  </Box>
                  {(() => {
                    const w1 = Number(verificationForm.kf_weight_1)
                    const v1 = Number(verificationForm.kf_volume_1)
                    const w2 = Number(verificationForm.kf_weight_2)
                    const v2 = Number(verificationForm.kf_volume_2)
                    const hasValues = ![w1, v1, w2, v2].some((val) => Number.isNaN(val) || !val)

                    if (!hasValues) {
                      return (
                        <Box
                          sx={{
                            border: '1px dashed #cbd5e1',
                            borderRadius: 2,
                            p: 1.5,
                            backgroundColor: '#f8fafc',
                            display: 'grid',
                            gap: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            Factor calculado (promedio)
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary', lineHeight: 1 }}>
                            --
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Completa peso y volumen en ambas corridas para calcularlo.
                          </Typography>
                        </Box>
                      )
                    }

                    const f1 = w1 / v1
                    const f2 = w2 / v2
                    const avg = (f1 + f2) / 2
                    const err = avg ? (Math.abs(f1 - f2) / avg) * 100 : 0
                    const factorsOk = f1 >= 4.5 && f1 <= 5.5 && f2 >= 4.5 && f2 <= 5.5
                    const relOk = err < 2
                    const ok = factorsOk && relOk
                    const tone = ok
                      ? { border: '#86efac', bg: '#f0fdf4', value: '#166534', status: 'success.main' }
                      : { border: '#fca5a5', bg: '#fef2f2', value: '#b91c1c', status: 'error.main' }

                    return (
                      <Box
                        sx={{
                          border: `1px solid ${tone.border}`,
                          borderRadius: 2,
                          p: 1.5,
                          backgroundColor: tone.bg,
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ display: 'grid', gap: 0.35 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            Factor calculado (promedio)
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: tone.value, lineHeight: 1 }}>
                            {avg.toFixed(4)} mg/mL
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Error relativo: {err.toFixed(3)}%
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'grid', gap: 0.25, textAlign: { xs: 'left', sm: 'right' } }}>
                          <Typography variant="subtitle2" sx={{ color: tone.status, fontWeight: 700 }}>
                            {ok ? 'Cumple' : 'No cumple'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Criterio: 4.5-5.5 mg/mL y error relativo {'<'} 2%
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })()}
                </Box>
              ) : null}
              {!isHydrometerMonthlyVerification && requiresTapeComparison ? (
                <>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    }}
                  >
                    <FormControl
                      size="small"
                      fullWidth
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                    >
                      <InputLabel id="reading-unit-under-test-label">Unidad equipo</InputLabel>
                      <Select
                        labelId="reading-unit-under-test-label"
                        label="Unidad equipo"
                        value={verificationForm.reading_unit_under_test || 'mm'}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            reading_unit_under_test: String(event.target.value || 'mm'),
                          }))
                        }
                      >
                        <MenuItem value="mm">mm</MenuItem>
                        <MenuItem value="cm">cm</MenuItem>
                        <MenuItem value="m">m</MenuItem>
                        <MenuItem value="in">in</MenuItem>
                        <MenuItem value="ft">ft</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl
                      size="small"
                      fullWidth
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                    >
                      <InputLabel id="reading-unit-reference-label">Unidad patrón</InputLabel>
                      <Select
                        labelId="reading-unit-reference-label"
                        label="Unidad patrón"
                        value={verificationForm.reading_unit_reference || 'mm'}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            reading_unit_reference: String(event.target.value || 'mm'),
                          }))
                        }
                      >
                        <MenuItem value="mm">mm</MenuItem>
                        <MenuItem value="cm">cm</MenuItem>
                        <MenuItem value="m">m</MenuItem>
                        <MenuItem value="in">in</MenuItem>
                        <MenuItem value="ft">ft</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  {[
                    {
                      label: 'Lectura 1',
                      underKey: 'reading_under_test_high_value',
                      refKey: 'reference_reading_high_value',
                    },
                    {
                      label: 'Lectura 2',
                      underKey: 'reading_under_test_mid_value',
                      refKey: 'reference_reading_mid_value',
                    },
                    {
                      label: 'Lectura 3 (opcional)',
                      underKey: 'reading_under_test_low_value',
                      refKey: 'reference_reading_low_value',
                    },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      }}
                    >
                      <TextField
                        label={`${item.label} equipo`}
                        type="number"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={verificationForm[item.underKey]}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            [item.underKey]: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        label={`${item.label} patrón`}
                        type="number"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={verificationForm[item.refKey]}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            [item.refKey]: event.target.value,
                          }))
                        }
                      />
                    </Box>
                  ))}
                  <Box sx={{ display: 'grid', gap: 0.5 }}>
                    {(() => {
                      const workValues = [
                        verificationForm.reading_under_test_high_value,
                        verificationForm.reading_under_test_mid_value,
                        verificationForm.reading_under_test_low_value,
                      ].filter((value) => String(value).trim() !== '')
                      const refValues = [
                        verificationForm.reference_reading_high_value,
                        verificationForm.reference_reading_mid_value,
                        verificationForm.reference_reading_low_value,
                      ].filter((value) => String(value).trim() !== '')
                      if (workValues.length < 2 || refValues.length < 2) {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            Promedios y diferencia: -
                          </Typography>
                        )
                      }
                      const workMm = workValues
                        .map((value) =>
                          convertLengthToMmDisplay(value, verificationForm.reading_unit_under_test),
                        )
                        .filter((value) => value !== null)
                      const refMm = refValues
                        .map((value) =>
                          convertLengthToMmDisplay(value, verificationForm.reading_unit_reference),
                        )
                        .filter((value) => value !== null)
                      if (
                        workMm.length !== workValues.length ||
                        refMm.length !== refValues.length
                      ) {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            Promedios y diferencia: -
                          </Typography>
                        )
                      }
                      const avgWork = workMm.reduce((acc, curr) => acc + curr, 0) / workMm.length
                      const avgRef = refMm.reduce((acc, curr) => acc + curr, 0) / refMm.length
                      const diff = avgRef - avgWork
                      const ok = Math.abs(diff) < 2
                      return (
                        <>
                          <Typography variant="caption" color="text.secondary">
                            Promedio equipo: {avgWork.toFixed(3)} mm
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Promedio patrón: {avgRef.toFixed(3)} mm
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Diferencia (Patrón-Equipo): {diff.toFixed(3)} mm
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: ok ? 'success.main' : 'error.main', fontWeight: 600 }}
                          >
                            {ok
                              ? 'Cumple (diferencia absoluta menor a 2 mm)'
                              : 'No cumple (la diferencia absoluta debe ser menor a 2 mm)'}
                          </Typography>
                        </>
                      )
                    })()}
                  </Box>
                </>
              ) : !isHydrometerMonthlyVerification && isMonthlyVerification ? (
                <>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    }}
                  >
                    <FormControl
                      size="small"
                      fullWidth
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                    >
                      <InputLabel id="reading-unit-under-test-label">Unidad equipo</InputLabel>
                      <Select
                        labelId="reading-unit-under-test-label"
                        label="Unidad equipo"
                        value={verificationForm.reading_unit_under_test}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            reading_unit_under_test: String(event.target.value || 'c'),
                          }))
                        }
                      >
                        <MenuItem value="c">C</MenuItem>
                        <MenuItem value="f">F</MenuItem>
                        <MenuItem value="k">K</MenuItem>
                        <MenuItem value="r">R</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl
                      size="small"
                      fullWidth
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                    >
                      <InputLabel id="reading-unit-reference-label">Unidad patrón</InputLabel>
                      <Select
                        labelId="reading-unit-reference-label"
                        label="Unidad patrón"
                        value={verificationForm.reading_unit_reference}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            reading_unit_reference: String(event.target.value || 'c'),
                          }))
                        }
                      >
                        <MenuItem value="c">C</MenuItem>
                        <MenuItem value="f">F</MenuItem>
                        <MenuItem value="k">K</MenuItem>
                        <MenuItem value="r">R</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  {[
                    {
                      label: 'Lectura alta',
                      underKey: 'reading_under_test_high_value',
                      refKey: 'reference_reading_high_value',
                    },
                    {
                      label: 'Lectura media',
                      underKey: 'reading_under_test_mid_value',
                      refKey: 'reference_reading_mid_value',
                    },
                    {
                      label: 'Lectura baja',
                      underKey: 'reading_under_test_low_value',
                      refKey: 'reference_reading_low_value',
                    },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      }}
                    >
                      <TextField
                        label={`${item.label} equipo`}
                        type="number"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={verificationForm[item.underKey]}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            [item.underKey]: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        label={`${item.label} patrón`}
                        type="number"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={verificationForm[item.refKey]}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            [item.refKey]: event.target.value,
                          }))
                        }
                      />
                    </Box>
                  ))}
                  <Box sx={{ display: 'grid', gap: 0.5 }}>
                    {[
                      {
                        label: 'Alta',
                        underKey: 'reading_under_test_high_value',
                        refKey: 'reference_reading_high_value',
                      },
                      {
                        label: 'Media',
                        underKey: 'reading_under_test_mid_value',
                        refKey: 'reference_reading_mid_value',
                      },
                      {
                        label: 'Baja',
                        underKey: 'reading_under_test_low_value',
                        refKey: 'reference_reading_low_value',
                      },
                    ].map((item) => {
                      const rawUnderTest = Number(verificationForm[item.underKey])
                      const rawReference = Number(verificationForm[item.refKey])
                      const unitUnderTest = verificationForm.reading_unit_under_test || 'c'
                      const unitReference = verificationForm.reading_unit_reference || 'c'
                      if (Number.isNaN(rawUnderTest) || Number.isNaN(rawReference)) {
                        return (
                          <Typography key={item.label} variant="caption" color="text.secondary">
                            Diferencia {item.label}: -
                          </Typography>
                        )
                      }
                      const underTestF = convertTemperatureToFDisplay(rawUnderTest, unitUnderTest)
                      const referenceF = convertTemperatureToFDisplay(rawReference, unitReference)
                      if (underTestF === null || referenceF === null) {
                        return (
                          <Typography key={item.label} variant="caption" color="text.secondary">
                            Diferencia {item.label}: -
                          </Typography>
                        )
                      }
                      const delta = Math.abs(underTestF - referenceF)
                      const ok = delta <= 0.5
                      return (
                        <Box key={item.label} sx={{ display: 'flex', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Diferencia {item.label}: {delta.toFixed(3)} F
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: ok ? 'success.main' : 'error.main', fontWeight: 600 }}
                          >
                            {ok ? 'Cumple' : 'No cumple'}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Box>
                </>
              ) : !isHydrometerMonthlyVerification && requiresTemperatureComparison ? (
                <>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
                      }}
                    >
                      <TextField
                        label="Lectura equipo"
                        type="number"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={verificationForm.reading_under_test_f}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            reading_under_test_f: event.target.value,
                          }))
                        }
                      />
                      <FormControl
                        size="small"
                        fullWidth
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      >
                        <InputLabel id="reading-unit-under-test-label">Unidad equipo</InputLabel>
                        <Select
                          labelId="reading-unit-under-test-label"
                          label="Unidad equipo"
                          value={verificationForm.reading_unit_under_test}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              reading_unit_under_test: String(event.target.value || 'c'),
                            }))
                          }
                        >
                          <MenuItem value="c">C</MenuItem>
                          <MenuItem value="f">F</MenuItem>
                          <MenuItem value="k">K</MenuItem>
                          <MenuItem value="r">R</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
                    }}
                  >
                    <TextField
                      label="Lectura patrón"
                      type="number"
                      size="small"
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      value={verificationForm.reference_reading_f}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          reference_reading_f: event.target.value,
                        }))
                      }
                    />
                    <FormControl
                      size="small"
                      fullWidth
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                    >
                      <InputLabel id="reading-unit-reference-label">Unidad patrón</InputLabel>
                      <Select
                        labelId="reading-unit-reference-label"
                        label="Unidad patrón"
                        value={verificationForm.reading_unit_reference}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            reading_unit_reference: String(event.target.value || 'c'),
                          }))
                        }
                      >
                        <MenuItem value="c">C</MenuItem>
                        <MenuItem value="f">F</MenuItem>
                        <MenuItem value="k">K</MenuItem>
                        <MenuItem value="r">R</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    {(() => {
                      const rawUnderTest = Number(verificationForm.reading_under_test_f)
                      const rawReference = Number(verificationForm.reference_reading_f)
                      const unitUnderTest = verificationForm.reading_unit_under_test || 'c'
                      const unitReference = verificationForm.reading_unit_reference || 'c'
                      if (Number.isNaN(rawUnderTest) || Number.isNaN(rawReference)) {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            Diferencia: -
                          </Typography>
                        )
                      }
                      const underTestF = convertTemperatureToFDisplay(rawUnderTest, unitUnderTest)
                      const referenceF = convertTemperatureToFDisplay(rawReference, unitReference)
                      if (underTestF === null || referenceF === null) {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            Diferencia: -
                          </Typography>
                        )
                      }
                      const delta = Math.abs(underTestF - referenceF)
                      const ok = delta <= 0.5
                      return (
                        <>
                          <Typography variant="caption" color="text.secondary">
                            Diferencia: {delta.toFixed(3)} F
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: ok ? 'success.main' : 'error.main', fontWeight: 600 }}
                          >
                            {ok ? 'Cumple' : 'No cumple'}
                          </Typography>
                        </>
                      )
                    })()}
                  </Box>
                </>
              ) : null}
              <Typography variant="caption" color="text.secondary">
                {isHydrometerMonthlyVerification
                  ? 'Se requiere inspección diaria aprobada en ambos equipos.'
                  : requiresTapeComparison
                    ? 'Se requieren inspecciones diarias aprobadas en ambos equipos. Criterio: |Diferencia| < 2 mm.'
                    : requiresBalanceComparison
                      ? 'Se requiere inspección diaria aprobada en ambos equipos y diferencia dentro del error máximo permitido.'
                      : requiresKarlFischerVerification
                        ? 'Criterio: factores entre 4.5 y 5.5 y error relativo < 2%.'
                        : 'Se requiere inspección diaria aprobada en ambos equipos y diferencia máxima de 0.5 F.'}
              </Typography>
              </Box>
            </Box>
          ) : null}

          {verificationItems.length === 0 ? null : (
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 700, letterSpacing: 1 }}
              >
                Ítems de verificación
              </Typography>
              <Divider sx={{ mt: 0.5, mb: 1.5 }} />
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                }}
              >
                {verificationItems.map((item) => {
                  const response = verificationForm.responses[item.id] || {}
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
                    <Typography sx={{ fontWeight: 600 }}>{item.item}</Typography>
                    {item.response_type === 'boolean' ? (
                      <FormControl>
                        <InputLabel id={`verification-bool-${item.id}`}>Respuesta</InputLabel>
                        <Select
                          labelId={`verification-bool-${item.id}`}
                          label="Respuesta"
                          value={
                            response.value_bool === true
                              ? 'true'
                              : response.value_bool === false
                                ? 'false'
                                : ''
                          }
                          onChange={(event) => {
                            const value =
                              event.target.value === '' ? null : event.target.value === 'true'
                            setVerificationForm((prev) => ({
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
                          <MenuItem value="true">Sí</MenuItem>
                          <MenuItem value="false">No</MenuItem>
                        </Select>
                      </FormControl>
                    ) : null}
                    {item.response_type === 'text' ? (
                      <TextField
                        label="Respuesta"
                        value={response.value_text || ''}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
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
                        label="Valor"
                        type="number"
                        value={response.value_number ?? ''}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
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
            </Box>
          )}

          <TextField
            label="Observaciones"
            value={verificationForm.notes}
            onChange={(event) =>
              setVerificationForm((prev) => ({ ...prev, notes: event.target.value }))
            }
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 1.5, gap: 1 }}>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={
              isVerificationLoading ||
              !verificationForm.verification_type_id ||
              (verificationItems.length === 0 &&
                !requiresComparisonReadings &&
                !isHydrometerMonthlyVerification &&
                !requiresKarlFischerVerification)
            }
            onClick={onSave}
          >
            {isVerificationLoading ? 'Guardando...' : 'Guardar verificación'}
          </Button>
        </DialogActions>
      </Dialog>
  )
}

export { VerificationDialog }
