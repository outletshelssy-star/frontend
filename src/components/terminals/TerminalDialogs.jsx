import { AddCircleOutline, DeleteOutline, RemoveCircleOutline } from '@mui/icons-material'
import { useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

const PRODUCT_TYPES = [
  { value: 'crudo', label: 'Crudo' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'gasolina', label: 'Gasolina' },
]

const getProductTypeLabel = (productType) =>
  PRODUCT_TYPES.find((item) => item.value === productType)?.label || productType || ''

const TerminalFormDialog = ({
  open,
  isEditOpen,
  formData,
  blocks,
  companies,
  labTerminalOptions,
  analysisTypes,
  isAnalysesLoading,
  selectedAnalysisIds,
  selectedProducts,
  showProductValidation,
  invalidProductNameIndexes,
  onFormDataChange,
  onAnalysisToggle,
  onProductChange,
  onAddProduct,
  onRemoveProduct,
  onClose,
  onSubmit,
  fieldErrors = {},
  focusField = '',
  onFocusHandled,
}) => {
  const nameInputRef = useRef(null)
  const terminalCodeInputRef = useRef(null)

  useEffect(() => {
    if (!focusField) return
    const refByField = {
      name: nameInputRef,
      terminal_code: terminalCodeInputRef,
    }
    const target = refByField[focusField]?.current
    target?.focus?.()
    onFocusHandled?.()
  }, [focusField, onFocusHandled])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        {isEditOpen ? 'Editar terminal' : 'Nuevo terminal'}
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Typography variant="overline" color="text.secondary">
          Identificacion
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            mb: 3,
          }}
        >
          <TextField
            label="Nombre"
            size="small"
            value={formData.name}
            error={Boolean(fieldErrors?.name)}
            helperText={fieldErrors?.name || ''}
            inputRef={nameInputRef}
            onChange={(event) => onFormDataChange({ name: event.target.value })}
            required
            sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}
          />
          <TextField
            label="Codigo del terminal"
            size="small"
            placeholder="Ej: ABC"
            value={formData.terminal_code}
            error={Boolean(fieldErrors?.terminal_code)}
            helperText={fieldErrors?.terminal_code || ''}
            inputRef={terminalCodeInputRef}
            required
            onChange={(event) =>
              onFormDataChange({
                terminal_code: event.target.value,
              })
            }
          />
        </Box>
        <Typography variant="overline" color="text.secondary">
          Ubicacion
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            mb: 3,
          }}
        >
          <FormControl size="small">
            <InputLabel id="terminal-block-label">Bloque</InputLabel>
            <Select
              labelId="terminal-block-label"
              label="Bloque"
              value={formData.block_id}
              onChange={(event) => onFormDataChange({ block_id: event.target.value })}
            >
              {blocks.map((block) => (
                <MenuItem key={block.id} value={block.id}>
                  {block.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="terminal-owner-label">Propietario</InputLabel>
            <Select
              labelId="terminal-owner-label"
              label="Propietario"
              value={formData.owner_company_id}
              onChange={(event) =>
                onFormDataChange({
                  owner_company_id: event.target.value,
                })
              }
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="terminal-admin-label">Administradora</InputLabel>
            <Select
              labelId="terminal-admin-label"
              label="Administradora"
              value={formData.admin_company_id}
              onChange={(event) =>
                onFormDataChange({
                  admin_company_id: event.target.value,
                })
              }
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="overline" color="text.secondary">
          {isEditOpen ? 'Laboratorio y Estado' : 'Laboratorio'}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            alignItems: 'center',
            mb: 3,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(formData.has_lab)}
                onChange={(event) =>
                  onFormDataChange({
                    has_lab: event.target.checked,
                    lab_terminal_id: event.target.checked ? '' : formData.lab_terminal_id,
                  })
                }
              />
            }
            label="Tiene laboratorio propio"
          />
          {isEditOpen ? (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(event) => onFormDataChange({ is_active: event.target.checked })}
                />
              }
              label={formData.is_active ? 'Activo' : 'Inactivo'}
            />
          ) : null}
          <FormControl size="small" disabled={formData.has_lab}>
            <InputLabel id="terminal-lab-label">Terminal laboratorio</InputLabel>
            <Select
              labelId="terminal-lab-label"
              label="Terminal laboratorio"
              value={formData.lab_terminal_id}
              onChange={(event) => onFormDataChange({ lab_terminal_id: event.target.value })}
            >
              {labTerminalOptions.map((terminal) => (
                <MenuItem key={terminal.id} value={String(terminal.id)}>
                  {terminal.name}
                </MenuItem>
              ))}
            </Select>
            {!formData.has_lab && labTerminalOptions.length === 0 ? (
              <FormHelperText>No hay terminales con laboratorio disponibles.</FormHelperText>
            ) : null}
          </FormControl>
        </Box>
        <Typography variant="overline" color="text.secondary">
          Productos
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: isEditOpen ? 3 : 2.5 }}>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {Array.isArray(selectedProducts) && selectedProducts.length > 0 ? (
              selectedProducts.map((product, index) => (
                <Box
                  key={`product-row-${index}`}
                  sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto' },
                    alignItems: 'start',
                  }}
                >
                  <TextField
                    size="small"
                    label={`Producto ${index + 1}`}
                    value={product?.name || ''}
                    error={Boolean(showProductValidation && invalidProductNameIndexes?.includes(index))}
                    helperText={
                      showProductValidation && invalidProductNameIndexes?.includes(index)
                        ? 'El nombre del producto es obligatorio.'
                        : ''
                    }
                    onChange={(event) =>
                      onProductChange(index, {
                        name: event.target.value,
                      })
                    }
                    placeholder="Ej: Crudo Hoatzin"
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel id={`terminal-product-type-${index}`}>Tipo</InputLabel>
                    <Select
                      labelId={`terminal-product-type-${index}`}
                      label="Tipo"
                      value={product?.product_type || 'crudo'}
                      onChange={(event) =>
                        onProductChange(index, {
                          product_type: String(event.target.value || 'crudo'),
                        })
                      }
                    >
                      {PRODUCT_TYPES.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    type="button"
                    color="inherit"
                    variant="outlined"
                    onClick={() => onRemoveProduct(index)}
                    startIcon={<RemoveCircleOutline fontSize="small" />}
                    sx={{ minHeight: 40, borderStyle: 'dashed', alignSelf: 'start' }}
                  >
                    Quitar
                  </Button>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Sin productos configurados.
              </Typography>
            )}
            <Button
              type="button"
              variant="outlined"
              onClick={onAddProduct}
              startIcon={<AddCircleOutline fontSize="small" />}
              sx={{ justifySelf: 'start', borderStyle: 'dashed' }}
            >
              Agregar producto
            </Button>
          </Box>
        </Box>
        <Typography variant="overline" color="text.secondary" sx={{ mt: 1 }}>
          Analisis externos
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 3 }}>
          {analysisTypes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {isAnalysesLoading ? 'Cargando analisis...' : 'No hay analisis externos disponibles.'}
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 0.5,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                  md: 'repeat(4, minmax(0, 1fr))',
                },
              }}
            >
              {analysisTypes.map((item) => {
                const value = String(item.id)
                const checked = selectedAnalysisIds.includes(value)
                return (
                  <FormControlLabel
                    key={item.id}
                    control={
                      <Checkbox checked={checked} onChange={(event) => onAnalysisToggle(value, event.target.checked)} />
                    }
                    label={item.name}
                  />
                )
              })}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSubmit}>
          {isEditOpen ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const TerminalViewDialog = ({
  open,
  viewTerminal,
  terminalsById,
  isAnalysesLoading,
  terminalAnalyses,
  terminalProducts,
  formatDate,
  onClose,
  onEdit,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Detalle de terminal
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Typography variant="overline" color="text.secondary">
          Identificacion
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            label="Nombre"
            size="small"
            value={viewTerminal?.name || ''}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            label="Codigo del terminal"
            size="small"
            value={viewTerminal?.terminal_code || '-'}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
        </Box>
        <Typography variant="overline" color="text.secondary">
          Ubicacion
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            label="Bloque"
            size="small"
            value={viewTerminal?.block?.name || '-'}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            label="Propietario"
            size="small"
            value={viewTerminal?.owner_company?.name || '-'}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            label="Administradora"
            size="small"
            value={viewTerminal?.admin_company?.name || '-'}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
        </Box>
        <Typography variant="overline" color="text.secondary">
          Laboratorio y Estado
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mb: 3,
            alignItems: 'center',
          }}
        >
          <FormControlLabel
            control={<Switch checked={Boolean(viewTerminal?.has_lab)} disabled />}
            label="Tiene laboratorio propio"
          />
          <FormControlLabel
            control={<Switch checked={Boolean(viewTerminal?.is_active)} disabled />}
            label={viewTerminal?.is_active ? 'Activo' : 'Inactivo'}
          />
          {!viewTerminal?.has_lab ? (
            <TextField
              label="Terminal laboratorio"
              size="small"
              value={
                viewTerminal?.lab_terminal_id
                  ? terminalsById.get(String(viewTerminal.lab_terminal_id))?.name ||
                    String(viewTerminal.lab_terminal_id)
                  : 'Sin laboratorio'
              }
              disabled
              slotProps={{ input: { readOnly: true } }}
              sx={{ gridColumn: '1 / -1' }}
            />
          ) : null}
        </Box>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
          Productos
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {Array.isArray(terminalProducts) && terminalProducts.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {terminalProducts.map((product, index) => {
              const name = typeof product === 'string' ? product : String(product?.name || '').trim()
              const productType =
                typeof product === 'string' ? '' : String(product?.product_type || '').trim()
              const typeLabel = getProductTypeLabel(productType)
              const label = [name, typeLabel].filter(Boolean).join(' - ')
              return (
                <Typography
                  key={`${label || 'producto'}-${index}`}
                  variant="body2"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  {label || '-'}
                </Typography>
              )
            })}
          </Box>
        ) : (
          <Typography color="text.secondary">Sin productos configurados.</Typography>
        )}
        <Typography variant="overline" color="text.secondary" sx={{ mt: 3.5, display: 'block' }}>
          Analisis externos
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {isAnalysesLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">Cargando analisis...</Typography>
          </Box>
        ) : terminalAnalyses.length === 0 ? (
          <Typography color="text.secondary">Sin analisis configurados.</Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Analisis</TableCell>
                  <TableCell>Frecuencia (dias)</TableCell>
                  <TableCell>Ultimo</TableCell>
                  <TableCell>Proximo</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {terminalAnalyses.map((analysis) => (
                  <TableRow key={analysis.analysis_type_id}>
                    <TableCell>{analysis.analysis_type_name}</TableCell>
                    <TableCell>{analysis.frequency_days ?? '-'}</TableCell>
                    <TableCell>{formatDate(analysis.last_performed_at)}</TableCell>
                    <TableCell>{formatDate(analysis.next_due_at)}</TableCell>
                    <TableCell>{analysis.is_active ? 'Activo' : 'Inactivo'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="outlined" onClick={onEdit} disabled={!viewTerminal}>
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const TerminalDeleteDialog = ({ open, viewTerminal, isSaving, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Confirmar eliminacion
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Typography>
          {viewTerminal ? `Vas a eliminar ${viewTerminal.name}.` : 'Vas a eliminar este terminal.'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isSaving}
          startIcon={<DeleteOutline fontSize="small" />}
        >
          {isSaving ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const TerminalProgressDialog = ({ open, title }) => {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        {title}
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pt: '16px !important',
          pb: 3,
        }}
      >
        <CircularProgress size={24} />
        <Typography>Esto puede tardar unos segundos.</Typography>
      </DialogContent>
    </Dialog>
  )
}

export { TerminalDeleteDialog, TerminalFormDialog, TerminalProgressDialog, TerminalViewDialog }
