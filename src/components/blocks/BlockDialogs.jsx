import { DeleteOutline } from '@mui/icons-material'
import { useEffect, useRef } from 'react'
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
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material'

const BlockFormFields = ({
  formData,
  companies,
  onChange,
  fieldErrors,
  nameInputRef,
  companyInputRef,
  showStatus = false,
  companyLabelId = 'block-company-label',
}) => {
  return (
    <>
      <Typography variant="overline" color="text.secondary">
        Datos del bloque
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'grid', gap: 2, mb: showStatus ? 3 : 0 }}>
        <TextField
          label="Nombre"
          size="small"
          value={formData.name}
          error={Boolean(fieldErrors?.name)}
          helperText={fieldErrors?.name || ''}
          inputRef={nameInputRef}
          onChange={(event) => onChange({ name: event.target.value })}
          required
        />
        <FormControl size="small" required error={Boolean(fieldErrors?.company_id)}>
          <InputLabel id={companyLabelId}>Empresa</InputLabel>
          <Select
            labelId={companyLabelId}
            label="Empresa"
            value={formData.company_id}
            inputRef={companyInputRef}
            onChange={(event) => onChange({ company_id: event.target.value })}
          >
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
          {fieldErrors?.company_id ? <FormHelperText>{fieldErrors.company_id}</FormHelperText> : null}
        </FormControl>
      </Box>
      {showStatus ? (
        <>
          <Typography variant="overline" color="text.secondary">
            Estado
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(event) => onChange({ is_active: event.target.checked })}
              />
            }
            label={formData.is_active ? 'Activo' : 'Inactivo'}
          />
        </>
      ) : null}
    </>
  )
}

const BlockFormDialog = ({
  open,
  title,
  formData,
  companies,
  onChange,
  onClose,
  onSubmit,
  submitLabel,
  isLoading = false,
  showStatus = false,
  companyLabelId,
  fieldErrors = {},
  focusField = '',
  onFocusHandled,
}) => {
  const nameInputRef = useRef(null)
  const companyInputRef = useRef(null)

  useEffect(() => {
    if (!focusField) return
    const refByField = {
      name: nameInputRef,
      company_id: companyInputRef,
    }
    const target = refByField[focusField]?.current
    target?.focus?.()
    onFocusHandled?.()
  }, [focusField, onFocusHandled])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <BlockFormFields
          formData={formData}
          companies={companies}
          onChange={onChange}
          fieldErrors={fieldErrors}
          nameInputRef={nameInputRef}
          companyInputRef={companyInputRef}
          showStatus={showStatus}
          companyLabelId={companyLabelId}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSubmit} disabled={isLoading}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const BlockViewDialog = ({ open, viewBlock, onClose, onEdit }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Detalle de bloque
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Typography variant="overline" color="text.secondary">
          Datos del bloque
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <TextField
            label="Nombre"
            size="small"
            value={viewBlock?.name || ''}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            label="Empresa"
            size="small"
            value={viewBlock?.company?.name || '-'}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
        </Box>
        <Typography variant="overline" color="text.secondary">
          Estado
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <FormControlLabel
          control={<Switch checked={Boolean(viewBlock?.is_active)} disabled />}
          label={viewBlock?.is_active ? 'Activo' : 'Inactivo'}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="outlined" onClick={onEdit} disabled={!viewBlock}>
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const BlockDeleteDialog = ({ open, viewBlock, isSaving, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Confirmar eliminacion
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Typography>
          {viewBlock ? `Vas a eliminar ${viewBlock.name}.` : 'Vas a eliminar este bloque.'}
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

const BlockProgressDialog = ({ open, title }) => {
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

export { BlockDeleteDialog, BlockFormDialog, BlockProgressDialog, BlockViewDialog }
