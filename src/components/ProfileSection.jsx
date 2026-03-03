import { useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { updateMe, updateMyPassword, uploadMyPhoto } from '../services/api'

const ProfileSection = ({
  currentUser,
  currentUserError,
  formatUserType,
  tokenType,
  accessToken,
  onProfileUpdated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const terminalChipPalette = [
    { bg: '#e0f2fe', fg: '#075985' },
    { bg: '#dcfce7', fg: '#166534' },
    { bg: '#fef3c7', fg: '#92400e' },
    { bg: '#fee2e2', fg: '#991b1b' },
    { bg: '#ede9fe', fg: '#5b21b6' },
    { bg: '#e0e7ff', fg: '#3730a3' },
    { bg: '#cffafe', fg: '#0e7490' },
    { bg: '#fce7f3', fg: '#9d174d' },
  ]

  const getTerminalChipStyle = (name = '') => {
    const normalized = String(name).toLowerCase().trim()
    let hash = 0
    for (let i = 0; i < normalized.length; i += 1) {
      hash = (hash * 31 + normalized.charCodeAt(i)) % 2147483647
    }
    const index = terminalChipPalette.length ? Math.abs(hash) % terminalChipPalette.length : 0
    const colors = terminalChipPalette[index] || terminalChipPalette[0]
    return {
      backgroundColor: colors.bg,
      color: colors.fg,
      fontWeight: 600,
      fontSize: '0.7rem',
      height: 20,
    }
  }

  useEffect(() => {
    if (!currentUser) return
    setFormData({
      name: currentUser.name || '',
      last_name: currentUser.last_name || '',
    })
    setPhotoPreview(currentUser.photo_url || '')
  }, [currentUser])

  useEffect(() => {
    if (!photoFile) return
    const objectUrl = URL.createObjectURL(photoFile)
    setPhotoPreview(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [photoFile])

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.last_name.trim()) {
      setToast({
        open: true,
        message: 'Completa nombre y apellido.',
        severity: 'error',
      })
      return
    }
    setIsSaving(true)
    handleCloseEdit()
    setIsProfileSaving(true)
    try {
      const updated = await updateMe({
        tokenType,
        accessToken,
        payload: {
          name: formData.name.trim(),
          last_name: formData.last_name.trim(),
        },
      })
      let finalUser = updated
      if (photoFile) {
        finalUser = await uploadMyPhoto({
          tokenType,
          accessToken,
          file: photoFile,
        })
      }
      if (onProfileUpdated) {
        await onProfileUpdated(finalUser)
      }
      setToast({
        open: true,
        message: 'Perfil actualizado correctamente.',
        severity: 'success',
      })
    } catch (err) {
      const detail = err?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item?.msg || 'Error').join(', ')
        : detail || 'No se pudo actualizar el perfil.'
      setToast({
        open: true,
        message,
        severity: 'error',
      })
    } finally {
      setIsSaving(false)
      setIsProfileSaving(false)
    }
  }

  const handleOpenEdit = () => {
    setFormData({
      name: currentUser?.name || '',
      last_name: currentUser?.last_name || '',
    })
    setPhotoFile(null)
    setPhotoPreview(currentUser?.photo_url || '')
    setIsEditOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditOpen(false)
  }

  const handleOpenPassword = () => {
    setIsPasswordOpen(true)
  }

  const handleClosePassword = () => {
    setIsPasswordOpen(false)
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    })
  }

  const handleUpdatePassword = async () => {
    if (
      !passwordData.current_password ||
      !passwordData.new_password ||
      !passwordData.confirm_password
    ) {
      setToast({
        open: true,
        message: 'Completa todos los campos de contrasena.',
        severity: 'error',
      })
      return
    }
    if (passwordData.new_password.length < 8) {
      setToast({
        open: true,
        message: 'La nueva contrasena debe tener minimo 8 caracteres.',
        severity: 'error',
      })
      return
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setToast({
        open: true,
        message: 'La nueva contrasena y la confirmacion no coinciden.',
        severity: 'error',
      })
      return
    }

    setIsSaving(true)
    try {
      await updateMyPassword({
        tokenType,
        accessToken,
        payload: {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        },
      })
      setToast({
        open: true,
        message: 'Contrasena actualizada correctamente.',
        severity: 'success',
      })
      handleClosePassword()
    } catch (err) {
      const detail = err?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item?.msg || 'Error').join(', ')
        : detail || 'No se pudo actualizar la contrasena.'
      setToast({
        open: true,
        message,
        severity: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="card dashboard-card profile-card">
      <Typography component="h2" variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Mi perfil
      </Typography>
      {currentUserError ? <p className="error">{currentUserError}</p> : null}
      {!currentUser && !currentUserError ? <p className="meta">Cargando perfil...</p> : null}
      {currentUser ? (
        <div className="profile">
          <Avatar
            className="profile__avatar"
            src={currentUser.photo_url || ''}
            alt={`${currentUser.name} ${currentUser.last_name}`}
            variant="rounded"
            sx={{
              width: { xs: 92, sm: 120, md: 140 },
              height: { xs: 92, sm: 120, md: 140 },
              borderRadius: 4,
            }}
          >
            {currentUser.name?.charAt(0) || 'U'}
          </Avatar>
          <div className="profile__info">
            <div className="profile__name">
              {currentUser.name} {currentUser.last_name}
            </div>
            <div className="profile__meta">{currentUser.email}</div>
            <div className="profile__meta">
              Rol:{' '}
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color:
                    currentUser.user_type === 'superadmin'
                      ? '#5b21b6'
                      : currentUser.user_type === 'admin'
                        ? '#1d4ed8'
                        : '#0f766e',
                  backgroundColor:
                    currentUser.user_type === 'superadmin'
                      ? '#ede9fe'
                      : currentUser.user_type === 'admin'
                        ? '#dbeafe'
                        : '#ccfbf1',
                }}
              >
                {formatUserType(currentUser.user_type)}
              </Box>
            </div>
            <div className="profile__meta">
              Empresa: {currentUser.company?.name || 'Sin empresa'}
            </div>
            <div className="profile__meta">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Box component="span">Terminales:</Box>
                {currentUser.user_type === 'superadmin' ? (
                  <Chip
                    label="Todos"
                    size="small"
                    sx={{
                      backgroundColor: '#1e3a8a',
                      color: '#e0f2fe',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 20,
                    }}
                  />
                ) : Array.isArray(currentUser.terminals) && currentUser.terminals.length ? (
                  <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                    {currentUser.terminals.map((terminal) => (
                      <Chip
                        key={terminal.id}
                        label={terminal.name}
                        size="small"
                        sx={getTerminalChipStyle(terminal.name)}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Box component="span">Sin terminales</Box>
                )}
              </Box>
            </div>
            <div className="profile__meta">
              Estado:{' '}
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: currentUser.is_active ? '#166534' : '#991b1b',
                  backgroundColor: currentUser.is_active ? '#dcfce7' : '#fee2e2',
                }}
              >
                {currentUser.is_active ? 'Activo' : 'Inactivo'}
              </Box>
            </div>
          </div>
        </div>
      ) : null}
      {currentUser ? (
        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: { xs: '1fr', sm: 'auto auto' },
            justifyContent: 'flex-start',
          }}
        >
          <Button variant="contained" onClick={handleOpenEdit} fullWidth={isMobile}>
            Editar datos
          </Button>
          <Button variant="outlined" onClick={handleOpenPassword} fullWidth={isMobile}>
            Cambiar contrasena
          </Button>
        </Box>
      ) : null}
      <Dialog
        open={isEditOpen}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>Editar perfil</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Foto de perfil
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              mb: 3,
            }}
          >
            <Avatar src={photoPreview} sx={{ width: 72, height: 72, borderRadius: 2 }}>
              {formData.name?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" component="label" size="small">
                {photoFile ? photoFile.name : 'Subir foto'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null
                    setPhotoFile(file)
                  }}
                />
              </Button>
              {photoFile ? (
                <Button
                  type="button"
                  variant="text"
                  size="small"
                  color="error"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(currentUser?.photo_url || '')
                  }}
                >
                  Quitar foto
                </Button>
              ) : null}
            </Box>
          </Box>
          <Typography variant="overline" color="text.secondary">
            Datos personales
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Nombre"
              size="small"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <TextField
              label="Apellido"
              size="small"
              value={formData.last_name}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, last_name: event.target.value }))
              }
              required
            />
          </Box>
        </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleCloseEdit}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isPasswordOpen}
        onClose={handleClosePassword}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>Cambiar contrasena</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Seguridad
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Contrasena actual"
              type="password"
              size="small"
              value={passwordData.current_password}
              onChange={(event) =>
                setPasswordData((prev) => ({
                  ...prev,
                  current_password: event.target.value,
                }))
              }
              autoComplete="current-password"
              required
            />
            <TextField
              label="Nueva contrasena"
              type="password"
              size="small"
              value={passwordData.new_password}
              onChange={(event) =>
                setPasswordData((prev) => ({
                  ...prev,
                  new_password: event.target.value,
                }))
              }
              autoComplete="new-password"
              required
            />
            <TextField
              label="Confirmar contrasena"
              type="password"
              size="small"
              value={passwordData.confirm_password}
              onChange={(event) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirm_password: event.target.value,
                }))
              }
              autoComplete="new-password"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleClosePassword}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdatePassword} disabled={isSaving}>
            {isSaving ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isProfileSaving} maxWidth="xs" fullWidth>
        <DialogTitle>Actualizando perfil...</DialogTitle>
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
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </section>
  )
}

export default ProfileSection
