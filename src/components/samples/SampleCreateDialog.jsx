import { useEffect, useRef, useState } from 'react'
import { todayColombiaStr } from '../../utils/dateUtils'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTE_OPTIONS = ['00', '15', '30', '45']
const VOLUME_OPTIONS = ['1/4 galón', '1/2 galón', '1 galón']
const RETENTION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 15, 30]

const FIELD_ERRORS_INITIAL_STATE = {
  terminal_id: '',
  analyzed_at: '',
  identifier: '',
  analyses: '',
}

const SampleCreateDialog = ({
  open,
  onClose,
  isCreating,
  createForm,
  setCreateForm,
  terminalOptions,
  productTypeOptions,
  onTerminalChange,
  onSave,
  analysisDateMin,
  analysisDateMax,
  restrictAnalysisDateRange,
}) => {
  const [fieldErrors, setFieldErrors] = useState(FIELD_ERRORS_INITIAL_STATE)
  const [focusField, setFocusField] = useState('')
  const terminalInputRef = useRef(null)
  const analyzedAtInputRef = useRef(null)
  const identifierInputRef = useRef(null)
  const analysesInputRef = useRef(null)

  const clearFieldError = (fieldKey) => {
    setFieldErrors((prev) => ({ ...prev, [fieldKey]: '' }))
    setFocusField((prev) => (prev === fieldKey ? '' : prev))
  }

  useEffect(() => {
    if (!focusField) return
    const inputMap = {
      terminal_id: terminalInputRef.current,
      analyzed_at: analyzedAtInputRef.current,
      identifier: identifierInputRef.current,
      analyses: analysesInputRef.current,
    }
    const target = inputMap[focusField]
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

  const handleSaveClick = () => {
    const nextErrors = { ...FIELD_ERRORS_INITIAL_STATE }
    if (!String(createForm.terminal_id || '').trim()) {
      nextErrors.terminal_id = 'Selecciona un terminal.'
    }
    if (!String(createForm.analyzed_at || '').trim()) {
      nextErrors.analyzed_at = 'La fecha de analisis es obligatoria.'
    }
    if (
      restrictAnalysisDateRange &&
      String(createForm.analyzed_at || '').trim() &&
      ((analysisDateMin && createForm.analyzed_at < analysisDateMin) ||
        (analysisDateMax && createForm.analyzed_at > analysisDateMax))
    ) {
      nextErrors.analyzed_at =
        'Los usuarios solo pueden seleccionar una fecha dentro de las ultimas 72 horas.'
    }
    if (!String(createForm.identifier || '').trim()) {
      nextErrors.identifier = 'El identificador es obligatorio.'
    }
    if (!Array.isArray(createForm.analyses) || createForm.analyses.length === 0) {
      nextErrors.analyses = 'Selecciona al menos un analisis.'
    }
    const hasErrors = Object.values(nextErrors).some(Boolean)
    if (hasErrors) {
      setFieldErrors(nextErrors)
      const firstInvalidField =
        ['terminal_id', 'analyzed_at', 'identifier', 'analyses'].find(
          (fieldKey) => nextErrors[fieldKey],
        ) || ''
      setFocusField(firstInvalidField)
      return
    }
    onSave()
  }

  const baseProductOptions =
    Array.isArray(productTypeOptions) && productTypeOptions.length > 0
      ? productTypeOptions
      : [{ value: 'Crudo', label: 'Crudo - Crudo' }]
  const selectedProductName = String(createForm.product_name || '').trim()
  const hasSelectedProduct = baseProductOptions.some(
    (item) => String(item?.value || '').trim().toLowerCase() === selectedProductName.toLowerCase(),
  )
  const resolvedProductOptions =
    selectedProductName && !hasSelectedProduct
      ? [{ value: selectedProductName, label: selectedProductName }, ...baseProductOptions]
      : baseProductOptions
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { maxWidth: 768 } }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Crear muestra
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'grid',
          gap: 1.5,
          pt: '16px !important',
          overflow: 'visible',
          '& .MuiInputLabel-root': { backgroundColor: '#fff', px: 0.5 },
          '& .MuiOutlinedInput-root': { backgroundColor: '#fff' },
          '& .MuiInputBase-root': { height: 40 },
        }}
      >
        {/* Row 1: Terminal | Producto */}
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          }}
        >
          <FormControl size="small" fullWidth error={Boolean(fieldErrors.terminal_id)}>
            <InputLabel id="create-sample-terminal-label">Terminal</InputLabel>
            <Select
              labelId="create-sample-terminal-label"
              label="Terminal"
              value={createForm.terminal_id}
              inputRef={terminalInputRef}
              onChange={(event) => {
                const newTerminalId = String(event.target.value || '')
                clearFieldError('terminal_id')
                setCreateForm((prev) => ({
                  ...prev,
                  terminal_id: newTerminalId,
                }))
                if (onTerminalChange) onTerminalChange(newTerminalId)
              }}
            >
              {terminalOptions.map((terminal) => (
                <MenuItem key={terminal.id} value={String(terminal.id)}>
                  {terminal.name}
                </MenuItem>
              ))}
            </Select>
            {fieldErrors.terminal_id ? (
              <FormHelperText>{fieldErrors.terminal_id}</FormHelperText>
            ) : null}
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="create-sample-product-label">Producto</InputLabel>
            <Select
              labelId="create-sample-product-label"
              label="Producto"
              value={createForm.product_name || resolvedProductOptions[0]?.value || 'Crudo'}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  product_name: String(event.target.value || 'Crudo'),
                }))
              }
            >
              {resolvedProductOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Row 2: Fecha de análisis | Hora de análisis */}
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          }}
        >
          <TextField
            label="Fecha de análisis"
            type="date"
            size="small"
            value={createForm.analyzed_at || ''}
            inputRef={analyzedAtInputRef}
            error={Boolean(fieldErrors.analyzed_at)}
            helperText={fieldErrors.analyzed_at || ''}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: analysisDateMin || undefined,
              max: analysisDateMax || todayColombiaStr(),
            }}
            onChange={(event) => {
              clearFieldError('analyzed_at')
              setCreateForm((prev) => ({
                ...prev,
                analyzed_at: event.target.value,
              }))
            }}
            required
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel id="create-sample-hour-label">Hora</InputLabel>
              <Select
                labelId="create-sample-hour-label"
                label="Hora"
                value={createForm.analyzed_hour ?? '00'}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, analyzed_hour: event.target.value }))
                }
              >
                {HOUR_OPTIONS.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel id="create-sample-minute-label">Min</InputLabel>
              <Select
                labelId="create-sample-minute-label"
                label="Min"
                value={createForm.analyzed_minute ?? '00'}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, analyzed_minute: event.target.value }))
                }
              >
                {MINUTE_OPTIONS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Row 3: Identificador (fila completa) */}
        <TextField
          label="Identificador"
          size="small"
          value={createForm.identifier}
          inputRef={identifierInputRef}
          error={Boolean(fieldErrors.identifier)}
          helperText={fieldErrors.identifier || ''}
          onChange={(event) => {
            clearFieldError('identifier')
            setCreateForm((prev) => ({
              ...prev,
              identifier: event.target.value,
            }))
          }}
          required
        />

        {/* Row 4: Cantidad | Tiempo de retención */}
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          }}
        >
          <FormControl size="small" fullWidth>
            <InputLabel id="create-sample-volume-label">Cantidad</InputLabel>
            <Select
              labelId="create-sample-volume-label"
              label="Cantidad"
              value={createForm.volume || ''}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, volume: event.target.value }))
              }
            >
              <MenuItem value="">
                <em>Sin especificar</em>
              </MenuItem>
              {VOLUME_OPTIONS.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="create-sample-retention-label">Tiempo de retención (días)</InputLabel>
            <Select
              labelId="create-sample-retention-label"
              label="Tiempo de retención (días)"
              value={createForm.retention_days || ''}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, retention_days: event.target.value }))
              }
            >
              <MenuItem value="">
                <em>Sin especificar</em>
              </MenuItem>
              {RETENTION_OPTIONS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d} días
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Análisis */}
        <FormControl component="fieldset" error={Boolean(fieldErrors.analyses)}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            Analisis
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  inputRef={analysesInputRef}
                  checked={createForm.analyses.includes('api_astm_1298')}
                  onChange={(event) => {
                    clearFieldError('analyses')
                    setCreateForm((prev) => ({
                      ...prev,
                      analyses: event.target.checked
                        ? Array.from(new Set([...prev.analyses, 'api_astm_1298']))
                        : prev.analyses.filter((item) => item !== 'api_astm_1298'),
                    }))
                  }}
                />
              }
              label="API ASTM 1298"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={createForm.analyses.includes('water_astm_4377')}
                  onChange={(event) => {
                    clearFieldError('analyses')
                    setCreateForm((prev) => ({
                      ...prev,
                      analyses: event.target.checked
                        ? Array.from(new Set([...prev.analyses, 'water_astm_4377']))
                        : prev.analyses.filter((item) => item !== 'water_astm_4377'),
                    }))
                  }}
                />
              }
              label="Agua ASTM 4377"
            />
          </FormGroup>
          {fieldErrors.analyses ? <FormHelperText>{fieldErrors.analyses}</FormHelperText> : null}
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={isCreating} onClick={handleSaveClick}>
          {isCreating ? 'Creando...' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SampleCreateDialog
