import { DeleteOutline, EditOutlined } from '@mui/icons-material'
import { useEffect, useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
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
  fieldErrors,
  focusField,
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
  onFocusHandled,
  onPhotoChange,
  onPhotoClear,
}) => {
  const [terminalToAdd, setTerminalToAdd] = useState('')
  const nameInputRef = useRef(null)
  const lastNameInputRef = useRef(null)
  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)
  const roleInputRef = useRef(null)
  const companyInputRef = useRef(null)
  const terminalsInputRef = useRef(null)

  useEffect(() => {
    if (!focusField) return
    const refByField = {
      name: nameInputRef,
      last_name: lastNameInputRef,
      email: emailInputRef,
      password: passwordInputRef,
      user_type: roleInputRef,
      company_id: companyInputRef,
      terminal_ids: terminalsInputRef,
    }
    const target = refByField[focusField]?.current
    target?.focus?.()
    onFocusHandled?.()
  }, [focusField, onFocusHandled])

  useEffect(() => {
    if (!open) {
      setTerminalToAdd('')
    }
  }, [open])

  const sortedRoleOptions = [...USER_ROLE_OPTIONS].sort((a, b) =>
    String(a?.label || '').localeCompare(String(b?.label || ''), 'es', {
      sensitivity: 'base',
    }),
  )
  const sortedCompanies = Array.isArray(companies)
    ? [...companies].sort((a, b) =>
      String(a?.name || '').localeCompare(String(b?.name || ''), 'es', {
        sensitivity: 'base',
      }),
    )
    : []
  const sortedActiveTerminals = Array.isArray(terminals)
    ? terminals
      .filter((terminal) => terminal?.is_active === true)
      .sort((a, b) =>
      String(a?.name || '').localeCompare(String(b?.name || ''), 'es', {
        sensitivity: 'base',
      }),
    )
    : []
  const selectedTerminalIds = Array.isArray(formData.terminal_ids)
    ? formData.terminal_ids.map((id) => String(id))
    : []
  const selectedTerminalSet = new Set(selectedTerminalIds)
  const availableActiveTerminals = sortedActiveTerminals.filter(
    (terminal) => !selectedTerminalSet.has(String(terminal.id)),
  )
  const resolveTerminalLabel = (terminalId) =>
    terminals.find((terminal) => String(terminal.id) === String(terminalId))?.name || terminalId

  const handleAddTerminal = () => {
    if (!terminalToAdd) return
    if (selectedTerminalSet.has(String(terminalToAdd))) {
      setTerminalToAdd('')
      return
    }
    onFormDataChange({
      terminal_ids: [...selectedTerminalIds, String(terminalToAdd)],
    })
    setTerminalToAdd('')
  }

  const handleRemoveTerminal = (terminalId) => {
    onFormDataChange({
      terminal_ids: selectedTerminalIds.filter((id) => String(id) !== String(terminalId)),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Nuevo usuario
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '16px !important' }}>
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
              error={Boolean(fieldErrors?.name)}
              helperText={fieldErrors?.name || ''}
              inputRef={nameInputRef}
              onChange={(event) => onFormDataChange({ name: event.target.value })}
              required
            />
            <TextField
              label="Apellido"
              value={formData.last_name}
              error={Boolean(fieldErrors?.last_name)}
              helperText={fieldErrors?.last_name || ''}
              inputRef={lastNameInputRef}
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
              error={Boolean(fieldErrors?.email)}
              helperText={fieldErrors?.email || ''}
              inputRef={emailInputRef}
              onChange={(event) => onFormDataChange({ email: event.target.value })}
              autoComplete="off"
              required
            />
            <TextField
              label="Contraseña"
              type="password"
              value={formData.password}
              error={Boolean(fieldErrors?.password)}
              helperText={fieldErrors?.password || ''}
              inputRef={passwordInputRef}
              onChange={(event) => onFormDataChange({ password: event.target.value })}
              autoComplete="new-password"
              required
            />
            <FormControl required error={Boolean(fieldErrors?.user_type)}>
              <InputLabel id="user-type-label">Rol</InputLabel>
              <Select
                labelId="user-type-label"
                label="Rol"
                value={formData.user_type}
                inputRef={roleInputRef}
                onChange={(event) => onFormDataChange({ user_type: event.target.value })}
              >
                {sortedRoleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors?.user_type ? <FormHelperText>{fieldErrors.user_type}</FormHelperText> : null}
            </FormControl>
            <FormControl required error={Boolean(fieldErrors?.company_id)}>
              <InputLabel id="company-label">Empresa</InputLabel>
              <Select
                labelId="company-label"
                label="Empresa"
                value={formData.company_id}
                inputRef={companyInputRef}
                onChange={(event) => onFormDataChange({ company_id: event.target.value })}
              >
                {companiesLoading ? (
                  <MenuItem value="" disabled>
                    Cargando empresas...
                  </MenuItem>
                ) : null}
                {sortedCompanies.map((company) => (
                  <MenuItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors?.company_id ? <FormHelperText>{fieldErrors.company_id}</FormHelperText> : null}
            </FormControl>
            <Box sx={{ gridColumn: { sm: '1 / -1' }, display: 'grid', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <FormControl
                  required={formData.user_type !== 'superadmin'}
                  error={Boolean(fieldErrors?.terminal_ids)}
                  sx={{ minWidth: 260, flex: 1 }}
                >
                  <InputLabel id="terminals-label">Terminal</InputLabel>
                  <Select
                    labelId="terminals-label"
                    label="Terminal"
                    disabled={formData.user_type === 'superadmin'}
                    value={terminalToAdd}
                    inputRef={terminalsInputRef}
                    onChange={(event) => setTerminalToAdd(String(event.target.value || ''))}
                  >
                    <MenuItem value="">
                      <em>Selecciona un terminal</em>
                    </MenuItem>
                    {terminalsLoading ? (
                      <MenuItem value="" disabled>
                        Cargando terminales...
                      </MenuItem>
                    ) : null}
                    {availableActiveTerminals.map((terminal) => (
                      <MenuItem key={terminal.id} value={String(terminal.id)}>
                        {terminal.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleAddTerminal}
                  disabled={formData.user_type === 'superadmin' || !terminalToAdd}
                  sx={{ height: 40 }}
                >
                  Agregar terminal
                </Button>
              </Box>
              {fieldErrors?.terminal_ids && formData.user_type !== 'superadmin' ? (
                <FormHelperText error>{fieldErrors.terminal_ids}</FormHelperText>
              ) : null}
              {formData.user_type === 'superadmin' ? <Chip size="small" label="Todos" /> : null}
              {formData.user_type !== 'superadmin' && selectedTerminalIds.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedTerminalIds.map((terminalId) => (
                    <Chip
                      key={terminalId}
                      size="small"
                      label={resolveTerminalLabel(terminalId)}
                      onDelete={
                        formData.user_type === 'superadmin'
                          ? undefined
                          : () => handleRemoveTerminal(terminalId)
                      }
                    />
                  ))}
                </Box>
              ) : null}
            </Box>
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
  fieldErrors,
  focusField,
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
  onFocusHandled,
  onPhotoChange,
  onPhotoClear,
}) => {
  const [terminalToAdd, setTerminalToAdd] = useState('')
  const nameInputRef = useRef(null)
  const lastNameInputRef = useRef(null)
  const emailInputRef = useRef(null)
  const roleInputRef = useRef(null)
  const companyInputRef = useRef(null)
  const terminalsInputRef = useRef(null)

  useEffect(() => {
    if (!focusField) return
    const refByField = {
      name: nameInputRef,
      last_name: lastNameInputRef,
      email: emailInputRef,
      user_type: roleInputRef,
      company_id: companyInputRef,
      terminal_ids: terminalsInputRef,
    }
    const target = refByField[focusField]?.current
    target?.focus?.()
    onFocusHandled?.()
  }, [focusField, onFocusHandled])

  useEffect(() => {
    if (!open) {
      setTerminalToAdd('')
    }
  }, [open])

  const sortedRoleOptions = [...USER_ROLE_OPTIONS].sort((a, b) =>
    String(a?.label || '').localeCompare(String(b?.label || ''), 'es', {
      sensitivity: 'base',
    }),
  )
  const sortedCompanies = Array.isArray(companies)
    ? [...companies].sort((a, b) =>
        String(a?.name || '').localeCompare(String(b?.name || ''), 'es', {
          sensitivity: 'base',
        }),
      )
    : []
  const sortedActiveTerminals = Array.isArray(terminals)
    ? terminals
      .filter((terminal) => terminal?.is_active === true)
      .sort((a, b) =>
        String(a?.name || '').localeCompare(String(b?.name || ''), 'es', {
          sensitivity: 'base',
        }),
      )
    : []
  const selectedTerminalIds = Array.isArray(editData.terminal_ids)
    ? editData.terminal_ids.map((id) => String(id))
    : []
  const selectedTerminalSet = new Set(selectedTerminalIds)
  const availableActiveTerminals = sortedActiveTerminals.filter(
    (terminal) => !selectedTerminalSet.has(String(terminal.id)),
  )
  const resolveTerminalLabel = (terminalId) =>
    terminals.find((terminal) => String(terminal.id) === String(terminalId))?.name || terminalId

  const handleAddTerminal = () => {
    if (!terminalToAdd) return
    if (selectedTerminalSet.has(String(terminalToAdd))) {
      setTerminalToAdd('')
      return
    }
    onEditDataChange({
      terminal_ids: [...selectedTerminalIds, String(terminalToAdd)],
    })
    setTerminalToAdd('')
  }

  const handleRemoveTerminal = (terminalId) => {
    onEditDataChange({
      terminal_ids: selectedTerminalIds.filter((id) => String(id) !== String(terminalId)),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Editar usuario
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '16px !important' }}>
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
              {editPhotoFile ? (
                <Button type="button" variant="text" size="small" onClick={onPhotoClear} sx={{ textTransform: 'none' }}>
                  Quitar foto
                </Button>
              ) : null}
            </Box>
            <TextField
              label="Nombre"
              value={editData.name}
              error={Boolean(fieldErrors?.name)}
              helperText={fieldErrors?.name || ''}
              inputRef={nameInputRef}
              onChange={(event) => onEditDataChange({ name: event.target.value })}
              required
            />
            <TextField
              label="Apellido"
              value={editData.last_name}
              error={Boolean(fieldErrors?.last_name)}
              helperText={fieldErrors?.last_name || ''}
              inputRef={lastNameInputRef}
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
              error={Boolean(fieldErrors?.email)}
              helperText={fieldErrors?.email || ''}
              inputRef={emailInputRef}
              onChange={(event) => onEditDataChange({ email: event.target.value })}
              autoComplete="off"
              required
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <FormControl required error={Boolean(fieldErrors?.user_type)}>
              <InputLabel id="edit-user-type-label">Rol</InputLabel>
              <Select
                labelId="edit-user-type-label"
                label="Rol"
                value={editData.user_type}
                inputRef={roleInputRef}
                onChange={(event) => onEditDataChange({ user_type: event.target.value })}
              >
                {sortedRoleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors?.user_type ? <FormHelperText>{fieldErrors.user_type}</FormHelperText> : null}
            </FormControl>
            <FormControl required error={Boolean(fieldErrors?.company_id)}>
              <InputLabel id="edit-company-label">Empresa</InputLabel>
              <Select
                labelId="edit-company-label"
                label="Empresa"
                value={editData.company_id}
                inputRef={companyInputRef}
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
                {sortedCompanies.map((company) => (
                  <MenuItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors?.company_id ? <FormHelperText>{fieldErrors.company_id}</FormHelperText> : null}
            </FormControl>
            <Box sx={{ gridColumn: { sm: '1 / -1' }, display: 'grid', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <FormControl
                  required={editData.user_type !== 'superadmin'}
                  error={Boolean(fieldErrors?.terminal_ids)}
                  sx={{ minWidth: 260, flex: 1 }}
                >
                  <InputLabel id="edit-terminals-label">Terminal</InputLabel>
                  <Select
                    labelId="edit-terminals-label"
                    label="Terminal"
                    disabled={editData.user_type === 'superadmin'}
                    value={terminalToAdd}
                    inputRef={terminalsInputRef}
                    onChange={(event) => setTerminalToAdd(String(event.target.value || ''))}
                  >
                    <MenuItem value="">
                      <em>Selecciona un terminal</em>
                    </MenuItem>
                    {terminalsLoading ? (
                      <MenuItem value="" disabled>
                        Cargando terminales...
                      </MenuItem>
                    ) : null}
                    {availableActiveTerminals.map((terminal) => (
                      <MenuItem key={terminal.id} value={String(terminal.id)}>
                        {terminal.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleAddTerminal}
                  disabled={editData.user_type === 'superadmin' || !terminalToAdd}
                  sx={{ height: 40 }}
                >
                  Agregar terminal
                </Button>
              </Box>
              {fieldErrors?.terminal_ids && editData.user_type !== 'superadmin' ? (
                <FormHelperText error>{fieldErrors.terminal_ids}</FormHelperText>
              ) : null}
              {editData.user_type === 'superadmin' ? <Chip size="small" label="Todos" /> : null}
              {editData.user_type !== 'superadmin' && selectedTerminalIds.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedTerminalIds.map((terminalId) => (
                    <Chip
                      key={terminalId}
                      size="small"
                      label={resolveTerminalLabel(terminalId)}
                      onDelete={
                        editData.user_type === 'superadmin'
                          ? undefined
                          : () => handleRemoveTerminal(terminalId)
                      }
                    />
                  ))}
                </Box>
              ) : null}
            </Box>
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

const UserFormDialog = ({
  mode = 'create',
  open,
  isMobile,
  formError,
  formData,
  fieldErrors,
  focusField,
  photoFile,
  photoPreview,
  companies,
  companiesLoading,
  terminals,
  terminalsLoading,
  isSubmitting,
  onClose,
  onSubmit,
  onFormDataChange,
  onFocusHandled,
  onPhotoChange,
  onPhotoClear,
}) => {
  if (mode === 'edit') {
    return (
      <UserEditDialog
        open={open}
        isMobile={isMobile}
        formError={formError}
        editData={formData}
        fieldErrors={fieldErrors}
        focusField={focusField}
        editPhotoFile={photoFile}
        editPhotoPreview={photoPreview}
        companies={companies}
        companiesLoading={companiesLoading}
        terminals={terminals}
        terminalsLoading={terminalsLoading}
        isUpdateLoading={isSubmitting}
        onClose={onClose}
        onSubmit={onSubmit}
        onEditDataChange={onFormDataChange}
        onFocusHandled={onFocusHandled}
        onPhotoChange={onPhotoChange}
        onPhotoClear={onPhotoClear}
      />
    )
  }

  return (
    <UserCreateDialog
      open={open}
      isMobile={isMobile}
      formError={formError}
      formData={formData}
      fieldErrors={fieldErrors}
      focusField={focusField}
      photoFile={photoFile}
      photoPreview={photoPreview}
      companies={companies}
      companiesLoading={companiesLoading}
      terminals={terminals}
      terminalsLoading={terminalsLoading}
      isCreateLoading={isSubmitting}
      onClose={onClose}
      onSubmit={onSubmit}
      onFormDataChange={onFormDataChange}
      onFocusHandled={onFocusHandled}
      onPhotoChange={onPhotoChange}
      onPhotoClear={onPhotoClear}
    />
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
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '16px !important' }}>
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
      <DialogContent sx={{ pt: '16px !important' }}>
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

export {
  UserFormDialog,
  UserCreateDialog,
  UserDeleteDialog,
  UserEditDialog,
  UserProgressDialog,
  UserViewDialog,
}
