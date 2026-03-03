import { DeleteOutline, EditOutlined } from '@mui/icons-material'
import {
  Avatar,
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
import { USER_ROLE_OPTIONS } from './userUtils'

const dialogActionsSx = {
  px: 3,
  pb: 2,
  gap: 1,
  flexDirection: { xs: 'column-reverse', sm: 'row' },
  '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } },
}

const sectionTitleSx = {
  fontWeight: 700,
  letterSpacing: 1,
}

const sectionGridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', sm: '120px 1fr' },
  alignItems: 'start',
}

const photoBoxSx = {
  display: 'grid',
  gap: 1,
  justifyItems: { xs: 'start', sm: 'center' },
  gridRow: { sm: 'span 2' },
}

const accessGridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
}

const FormErrorMessage = ({ formError }) => {
  if (!formError) return null
  return (
    <Typography className="error" component="p">
      {formError}
    </Typography>
  )
}

const UserCreateDialog = ({
  open,
  isMobile,
  formError,
  formData,
  photoFile,
  photoPreview,
  companies,
  companiesLoading,
  terminals,
  terminalsLoading,
  isCreateLoading,
  onClose,
  onSubmit,
  onFormDataChange,
  onPhotoChange,
  onPhotoClear,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Nuevo usuario
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: 2 }}>
        <FormErrorMessage formError={formError} />

        <Box>
          <Typography variant="overline" color="text.secondary" sx={sectionTitleSx}>
            Datos personales
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box sx={sectionGridSx}>
            <Box sx={photoBoxSx}>
              <Avatar src={photoPreview || ''} alt="Foto de usuario" sx={{ width: 96, height: 96, borderRadius: 3 }}>
                {formData.name?.charAt(0) || 'U'}
              </Avatar>
              <Button variant="outlined" component="label" size="small" sx={{ textTransform: 'none' }}>
                {photoFile ? 'Cambiar foto' : 'Seleccionar foto'}
                <input type="file" accept="image/*" hidden onChange={(event) => onPhotoChange(event.target.files?.[0] || null)} />
              </Button>
              {photoFile ? (
                <Button type="button" variant="text" size="small" onClick={onPhotoClear} sx={{ textTransform: 'none' }}>
                  Quitar foto
                </Button>
              ) : null}
            </Box>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(event) => onFormDataChange({ name: event.target.value })}
              required
            />
            <TextField
              label="Apellido"
              value={formData.last_name}
              onChange={(event) => onFormDataChange({ last_name: event.target.value })}
              required
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary" sx={sectionTitleSx}>
            Acceso
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box sx={accessGridSx}>
            <TextField
              label="Correo"
              type="email"
              value={formData.email}
              onChange={(event) => onFormDataChange({ email: event.target.value })}
              autoComplete="off"
              required
            />
            <TextField
              label="Contrasena"
              type="password"
              value={formData.password}
              onChange={(event) => onFormDataChange({ password: event.target.value })}
              autoComplete="new-password"
              required
            />
            <FormControl>
              <InputLabel id="user-type-label">Rol</InputLabel>
              <Select
                labelId="user-type-label"
                label="Rol"
                value={formData.user_type}
                onChange={(event) => onFormDataChange({ user_type: event.target.value })}
              >
                {USER_ROLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="company-label">Empresa</InputLabel>
              <Select
                labelId="company-label"
                label="Empresa"
                value={formData.company_id}
                onChange={(event) => onFormDataChange({ company_id: event.target.value })}
              >
                {companiesLoading ? (
                  <MenuItem value="" disabled>
                    Cargando empresas...
                  </MenuItem>
                ) : null}
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ gridColumn: { sm: '1 / -1' } }}>
              <InputLabel id="terminals-label">Terminales</InputLabel>
              <Select
                labelId="terminals-label"
                label="Terminales"
                multiple
                disabled={formData.user_type === 'superadmin'}
                value={formData.terminal_ids}
                onChange={(event) => onFormDataChange({ terminal_ids: event.target.value })}
                renderValue={(selected) =>
                  formData.user_type === 'superadmin'
                    ? 'Todos los terminales'
                    : selected.map((id) => terminals.find((terminal) => terminal.id === id)?.name || id).join(', ')
                }
              >
                {terminalsLoading ? (
                  <MenuItem value="" disabled>
                    Cargando terminales...
                  </MenuItem>
                ) : null}
                {terminals.map((terminal) => (
                  <MenuItem key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </MenuItem>
                ))}
              </Select>
              {formData.user_type === 'superadmin' ? (
                <Typography variant="caption" color="text.secondary">
                  Superadmin trabaja en todos los terminales.
                </Typography>
              ) : null}
            </FormControl>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={dialogActionsSx}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSubmit} disabled={isCreateLoading}>
          {isCreateLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const UserEditDialog = ({
  open,
  isMobile,
  formError,
  editData,
  editPhotoFile,
  editPhotoPreview,
  companies,
  companiesLoading,
  terminals,
  terminalsLoading,
  isUpdateLoading,
  onClose,
  onSubmit,
  onEditDataChange,
  onPhotoChange,
  onPhotoClear,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Editar usuario
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: 2 }}>
        <FormErrorMessage formError={formError} />

        <Box>
          <Typography variant="overline" color="text.secondary" sx={sectionTitleSx}>
            Datos personales
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box sx={sectionGridSx}>
            <Box sx={photoBoxSx}>
              <Avatar src={editPhotoPreview || ''} alt="Foto de usuario" sx={{ width: 96, height: 96, borderRadius: 3 }}>
                {editData.name?.charAt(0) || 'U'}
              </Avatar>
              <Button variant="outlined" component="label" size="small" sx={{ textTransform: 'none' }}>
                {editPhotoFile || editPhotoPreview ? 'Cambiar foto' : 'Seleccionar foto'}
                <input type="file" accept="image/*" hidden onChange={(event) => onPhotoChange(event.target.files?.[0] || null)} />
              </Button>
              {editPhotoFile || editPhotoPreview ? (
                <Button type="button" variant="text" size="small" onClick={onPhotoClear} sx={{ textTransform: 'none' }}>
                  Quitar foto
                </Button>
              ) : null}
            </Box>
            <TextField
              label="Nombre"
              value={editData.name}
              onChange={(event) => onEditDataChange({ name: event.target.value })}
              required
            />
            <TextField
              label="Apellido"
              value={editData.last_name}
              onChange={(event) => onEditDataChange({ last_name: event.target.value })}
              required
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary" sx={sectionTitleSx}>
            Acceso
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box sx={accessGridSx}>
            <TextField
              label="Correo"
              type="email"
              value={editData.email}
              onChange={(event) => onEditDataChange({ email: event.target.value })}
              autoComplete="off"
              required
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <FormControl>
              <InputLabel id="edit-user-type-label">Rol</InputLabel>
              <Select
                labelId="edit-user-type-label"
                label="Rol"
                value={editData.user_type}
                onChange={(event) => onEditDataChange({ user_type: event.target.value })}
              >
                {USER_ROLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="edit-company-label">Empresa</InputLabel>
              <Select
                labelId="edit-company-label"
                label="Empresa"
                value={editData.company_id}
                onChange={(event) =>
                  onEditDataChange({
                    company_id: String(event.target.value || ''),
                  })
                }
              >
                {companiesLoading ? (
                  <MenuItem value="" disabled>
                    Cargando empresas...
                  </MenuItem>
                ) : null}
                {companies.map((company) => (
                  <MenuItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ gridColumn: { sm: '1 / -1' } }}>
              <InputLabel id="edit-terminals-label">Terminales</InputLabel>
              <Select
                labelId="edit-terminals-label"
                label="Terminales"
                multiple
                disabled={editData.user_type === 'superadmin'}
                value={editData.terminal_ids}
                onChange={(event) =>
                  onEditDataChange({
                    terminal_ids: Array.isArray(event.target.value)
                      ? event.target.value.map((id) => String(id))
                      : [],
                  })
                }
                renderValue={(selected) =>
                  editData.user_type === 'superadmin'
                    ? 'Todos los terminales'
                    : selected
                        .map(
                          (id) =>
                            terminals.find((terminal) => String(terminal.id) === String(id))?.name || id,
                        )
                        .join(', ')
                }
              >
                {terminalsLoading ? (
                  <MenuItem value="" disabled>
                    Cargando terminales...
                  </MenuItem>
                ) : null}
                {terminals.map((terminal) => (
                  <MenuItem key={terminal.id} value={String(terminal.id)}>
                    {terminal.name}
                  </MenuItem>
                ))}
              </Select>
              {editData.user_type === 'superadmin' ? (
                <Typography variant="caption" color="text.secondary">
                  Superadmin trabaja en todos los terminales.
                </Typography>
              ) : null}
            </FormControl>
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary" sx={sectionTitleSx}>
            Estado
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch checked={editData.is_active} onChange={(event) => onEditDataChange({ is_active: event.target.checked })} />
            <Typography>{editData.is_active ? 'Usuario activo' : 'Usuario inactivo'}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={dialogActionsSx}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSubmit} disabled={isUpdateLoading}>
          {isUpdateLoading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const resolveViewUserCompany = (viewUser, companies) => {
  return (
    viewUser?.company?.name ||
    companies.find((company) => String(company.id) === String(viewUser?.company_id))?.name ||
    '-'
  )
}

const resolveViewUserTerminals = (viewUser, terminals) => {
  if (viewUser?.user_type === 'superadmin') return 'Todos los terminales'

  const terminalsByDetail = Array.isArray(viewUser?.terminals)
    ? viewUser.terminals.map((terminal) => String(terminal?.name || '').trim()).filter(Boolean)
    : []
  if (terminalsByDetail.length > 0) {
    return terminalsByDetail.join(', ')
  }

  const terminalIds = Array.isArray(viewUser?.terminal_ids) ? viewUser.terminal_ids : []
  if (terminalIds.length === 0) {
    return '-'
  }

  return terminalIds
    .map(
      (id) => terminals.find((terminal) => String(terminal.id) === String(id))?.name || String(id),
    )
    .join(', ')
}

const UserViewDialog = ({ open, isMobile, viewUser, companies, terminals, onClose, onEdit }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Ver usuario
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={sectionTitleSx}>
            Datos personales
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box sx={sectionGridSx}>
            <Box sx={photoBoxSx}>
              <Avatar
                src={viewUser?.photo_url || ''}
                alt={viewUser ? `${viewUser.name} ${viewUser.last_name}` : 'Usuario'}
                sx={{ width: 96, height: 96, borderRadius: 3 }}
              >
                {viewUser?.name?.charAt(0) || 'U'}
              </Avatar>
            </Box>
            <TextField label="Nombre" value={viewUser?.name || ''} disabled />
            <TextField label="Apellido" value={viewUser?.last_name || ''} disabled />
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary" sx={sectionTitleSx}>
            Acceso
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box sx={accessGridSx}>
            <TextField
              label="Correo"
              type="email"
              value={viewUser?.email || ''}
              disabled
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <FormControl>
              <InputLabel id="view-user-type-label">Rol</InputLabel>
              <Select labelId="view-user-type-label" label="Rol" value={viewUser?.user_type || ''} disabled>
                {USER_ROLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Empresa" value={resolveViewUserCompany(viewUser, companies)} disabled />
            <TextField
              label="Terminales"
              value={resolveViewUserTerminals(viewUser, terminals)}
              disabled
              multiline
              minRows={2}
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary" sx={sectionTitleSx}>
            Estado
          </Typography>
          <Divider sx={{ mt: 0.5, mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch checked={Boolean(viewUser?.is_active)} disabled />
            <Typography>{viewUser?.is_active ? 'Usuario activo' : 'Usuario inactivo'}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={dialogActionsSx}>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" startIcon={<EditOutlined fontSize="small" />} onClick={onEdit}>
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const UserDeleteDialog = ({ open, isMobile, deleteTarget, isSubmitting, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Confirmar eliminacion
      </DialogTitle>
      <DialogContent>
        <Typography>
          {deleteTarget
            ? `Vas a eliminar a ${deleteTarget.name} ${deleteTarget.last_name}.`
            : 'Vas a eliminar este usuario.'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Si el usuario tiene actividad relacionada, se desactivara en lugar de eliminarse.
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } },
        }}
      >
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isSubmitting}
          startIcon={<DeleteOutline fontSize="small" />}
        >
          {isSubmitting ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const UserProgressDialog = ({ open, title }) => {
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
  UserCreateDialog,
  UserDeleteDialog,
  UserEditDialog,
  UserProgressDialog,
  UserViewDialog,
}
