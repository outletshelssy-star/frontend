import { DeleteOutline, EditOutlined } from '@mui/icons-material'
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
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { CompanyTypeBadge } from './CompanyBadges'
import { COMPANY_TYPE_OPTIONS } from './companyUtils'

const CompanyFormFields = ({ formData, onChange, showStatusToggle }) => {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
        Datos de la empresa
      </Typography>
      <Divider sx={{ mt: 0.5, mb: 2 }} />
      <Box sx={{ display: 'grid', gap: 2 }}>
        <TextField
          label="Nombre"
          value={formData.name}
          onChange={(event) => onChange({ name: event.target.value })}
          required
        />
        <FormControl>
          <InputLabel id="company-type-label">Tipo</InputLabel>
          <Select
            labelId="company-type-label"
            label="Tipo"
            value={formData.company_type}
            onChange={(event) => onChange({ company_type: event.target.value })}
          >
            {COMPANY_TYPE_OPTIONS.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {showStatusToggle ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch
              checked={formData.is_active}
              onChange={(event) => onChange({ is_active: event.target.checked })}
            />
            <Typography>{formData.is_active ? 'Empresa activa' : 'Empresa inactiva'}</Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}

const CompanyFormDialog = ({
  open,
  title,
  formData,
  onChange,
  onClose,
  onSubmit,
  isLoading,
  submitLabel,
  showStatusToggle = false,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>{title}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: 2 }}>
        <CompanyFormFields formData={formData} onChange={onChange} showStatusToggle={showStatusToggle} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? 'Guardando...' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const CompanyViewDialog = ({ open, company, onClose, onEdit }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Detalle de empresa
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            Datos de la empresa
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Nombre" value={company?.name || ''} disabled />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
                Tipo
              </Typography>
              <CompanyTypeBadge type={company?.company_type} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch checked={Boolean(company?.is_active)} disabled />
              <Typography>{company?.is_active ? 'Empresa activa' : 'Empresa inactiva'}</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cerrar</Button>
        <Button
          variant="contained"
          startIcon={<EditOutlined fontSize="small" />}
          onClick={onEdit}
          disabled={!company}
        >
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const CompanyDeleteDialog = ({ open, company, isSaving, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Confirmar eliminacion
      </DialogTitle>
      <DialogContent>
        <Typography>
          {company ? `Vas a eliminar ${company.name}.` : 'Vas a eliminar esta empresa.'}
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

const CompanyProgressDialog = ({ open, title }) => {
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
          py: 3,
        }}
      >
        <CircularProgress size={24} />
        <Typography>Esto puede tardar unos segundos.</Typography>
      </DialogContent>
    </Dialog>
  )
}

export {
  CompanyDeleteDialog,
  CompanyFormDialog,
  CompanyProgressDialog,
  CompanyViewDialog,
}
