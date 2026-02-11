import { useEffect, useMemo, useState } from 'react'
import {
  Add,
  DeleteOutline,
  EditOutlined,
  FilterAltOff,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  InputLabel,
  IconButton,
  Paper,
  Alert,
  Select,
  MenuItem,
  Switch,
  TableSortLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Stack,
} from '@mui/material'
import {
  createUser,
  deleteUser,
  fetchCompanies,
  fetchCompanyTerminals,
  fetchUserById,
  uploadUserPhoto,
  updateUser,
} from '../services/api'

const UsersTable = ({
  users,
  usersError,
  isUsersLoading,
  formatUserType,
  tokenType,
  accessToken,
  onUserCreated,
  statusFilter = 'all',
  onStatusFilterChange,
}) => {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [roleFilter, setRoleFilter] = useState('all')
  const [terminalFilter, setTerminalFilter] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editUserId, setEditUserId] = useState(null)
  const [viewUser, setViewUser] = useState(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [companies, setCompanies] = useState([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [terminals, setTerminals] = useState([])
  const [terminalsLoading, setTerminalsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [isUpdateLoading, setIsUpdateLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    password: '',
    user_type: 'user',
    company_id: '',
    terminal_ids: [],
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [editData, setEditData] = useState({
    name: '',
    last_name: '',
    email: '',
    user_type: 'user',
    company_id: '',
    is_active: true,
    terminal_ids: [],
  })
  const [editPhotoFile, setEditPhotoFile] = useState(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState('')
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

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
    const index = terminalChipPalette.length
      ? Math.abs(hash) % terminalChipPalette.length
      : 0
    const colors = terminalChipPalette[index] || terminalChipPalette[0]
    return {
      backgroundColor: colors.bg,
      color: colors.fg,
      fontWeight: 600,
      fontSize: '0.7rem',
      height: 20,
    }
  }

  const hasActiveFilters =
    query.trim().length > 0 ||
    statusFilter !== 'all' ||
    roleFilter !== 'all' ||
    terminalFilter.length > 0

  const handleClearFilters = () => {
    setQuery('')
    if (onStatusFilterChange) {
      onStatusFilterChange('all')
    }
    setRoleFilter('all')
    setTerminalFilter([])
    setPage(1)
  }


  const resetForm = () => {
    setFormError('')
    setFormData({
      name: '',
      last_name: '',
      email: '',
      password: '',
      user_type: 'user',
      company_id: '',
      terminal_ids: [],
    })
    setPhotoFile(null)
    setPhotoPreview('')
  }

  const ensureReferenceData = async () => {
    if (companies.length === 0 && accessToken) {
      setCompaniesLoading(true)
      try {
        const data = await fetchCompanies({ tokenType, accessToken })
        setCompanies(Array.isArray(data.items) ? data.items : [])
      } catch (err) {
        setCompanies([])
        setFormError(err?.detail || 'No se pudieron cargar las empresas.')
      } finally {
        setCompaniesLoading(false)
      }
    }
    if (terminals.length === 0 && accessToken) {
      setTerminalsLoading(true)
      try {
        const data = await fetchCompanyTerminals({ tokenType, accessToken })
        setTerminals(Array.isArray(data.items) ? data.items : [])
      } catch (err) {
        setTerminals([])
        setFormError(err?.detail || 'No se pudieron cargar los terminales.')
      } finally {
        setTerminalsLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!accessToken) return
    ensureReferenceData()
  }, [accessToken])

  const handleOpenDialog = async () => {
    setIsDialogOpen(true)
    setFormError('')
    await ensureReferenceData()
  }

  const handleOpenEdit = async (user) => {
    setEditUserId(user.id)
    setEditData({
      name: user.name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      user_type: user.user_type || 'user',
      company_id: user.company?.id || user.company_id || '',
      is_active: Boolean(user.is_active),
      terminal_ids: Array.isArray(user.terminal_ids) ? user.terminal_ids : [],
    })
    setEditPhotoFile(null)
    setEditPhotoPreview(user.photo_url || '')
    setIsEditOpen(true)
    setFormError('')
    await ensureReferenceData()
  }

  const handleOpenView = async (user) => {
    setViewUser(user)
    setIsViewOpen(true)
    if (!accessToken) return
    try {
      const data = await fetchUserById({
        tokenType,
        accessToken,
        userId: user.id,
      })
      setViewUser(data)
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo cargar el detalle del usuario.',
        severity: 'error',
      })
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleCloseEdit = () => {
    setIsEditOpen(false)
    setEditUserId(null)
    setFormError('')
    setEditData({
      name: '',
      last_name: '',
      email: '',
      user_type: 'user',
      company_id: '',
      is_active: true,
      terminal_ids: [],
    })
    setEditPhotoFile(null)
    setEditPhotoPreview('')
  }

  const handleCloseView = () => {
    setIsViewOpen(false)
    setViewUser(null)
  }

  const handleOpenDelete = (user) => {
    setDeleteTarget(user)
    setIsDeleteOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteOpen(false)
    setDeleteTarget(null)
  }

  const handleCreateUser = async () => {
    setFormError('')

    const errors = []
    if (formData.name.trim().length < 2) {
      errors.push('El nombre debe tener minimo 2 caracteres.')
    }
    if (formData.last_name.trim().length < 2) {
      errors.push('El apellido debe tener minimo 2 caracteres.')
    }
    if (!formData.email.trim()) {
      errors.push('El correo es obligatorio.')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.push('El correo no tiene un formato valido.')
    }
    if (formData.password.trim().length < 8) {
      errors.push('La contrasena debe tener minimo 8 caracteres.')
    }
    if (!formData.company_id) {
      errors.push('Selecciona una empresa.')
    }
    if (formData.user_type !== 'superadmin' && !formData.terminal_ids.length) {
      errors.push('Selecciona al menos un terminal.')
    }
    if (photoFile && !photoFile.type.startsWith('image/')) {
      errors.push('La foto debe ser un archivo de imagen valido.')
    }
    if (photoFile && photoFile.size > 2 * 1024 * 1024) {
      errors.push('La foto no debe superar 2MB.')
    }

    if (errors.length) {
      setFormError(errors[0])
      return
    }

    setIsCreateLoading(true)
    handleCloseDialog()
    try {
      const createdUser = await createUser({
        tokenType,
        accessToken,
        payload: {
          name: formData.name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          user_type: formData.user_type,
          company_id: Number(formData.company_id),
          terminal_ids:
            formData.user_type === 'superadmin'
              ? []
              : formData.terminal_ids.map(Number),
          is_active: true,
        },
      })
      if (photoFile && createdUser?.id) {
        await uploadUserPhoto({
          tokenType,
          accessToken,
          userId: createdUser.id,
          file: photoFile,
        })
      }
      if (onUserCreated) {
        await onUserCreated(statusFilter)
      }
      setToast({
        open: true,
        message: 'Usuario creado correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setFormError(err?.detail || 'No se pudo crear el usuario.')
      setToast({
        open: true,
        message: err?.detail || 'No se pudo crear el usuario.',
        severity: 'error',
      })
    } finally {
      setIsCreateLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    setFormError('')

    const errors = []
    if (editData.name.trim().length < 2) {
      errors.push('El nombre debe tener minimo 2 caracteres.')
    }
    if (editData.last_name.trim().length < 2) {
      errors.push('El apellido debe tener minimo 2 caracteres.')
    }
    if (!editData.email.trim()) {
      errors.push('El correo es obligatorio.')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email.trim())) {
      errors.push('El correo no tiene un formato valido.')
    }
    if (!editData.company_id) {
      errors.push('Selecciona una empresa.')
    }
    if (editData.user_type !== 'superadmin' && !editData.terminal_ids.length) {
      errors.push('Selecciona al menos un terminal.')
    }

    if (errors.length) {
      setFormError(errors[0])
      return
    }

    setIsUpdateLoading(true)
    handleCloseEdit()
    try {
      await updateUser({
        tokenType,
        accessToken,
        userId: editUserId,
        payload: {
          name: editData.name.trim(),
          last_name: editData.last_name.trim(),
          email: editData.email.trim(),
          user_type: editData.user_type,
          company_id: Number(editData.company_id),
          is_active: editData.is_active,
          terminal_ids:
            editData.user_type === 'superadmin'
              ? []
              : editData.terminal_ids.map(Number),
        },
      })
      if (editPhotoFile && editUserId) {
        await uploadUserPhoto({
          tokenType,
          accessToken,
          userId: editUserId,
          file: editPhotoFile,
        })
      }
      if (onUserCreated) {
        await onUserCreated(statusFilter)
      }
      setToast({
        open: true,
        message: 'Usuario actualizado correctamente.',
        severity: 'success',
      })
      handleCloseEdit()
    } catch (err) {
      setFormError(err?.detail || 'No se pudo actualizar el usuario.')
      setToast({
        open: true,
        message: err?.detail || 'No se pudo actualizar el usuario.',
        severity: 'error',
      })
    } finally {
      setIsUpdateLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    setIsSubmitting(true)
    try {
      const response = await deleteUser({
        tokenType,
        accessToken,
        userId: deleteTarget.id,
      })
      if (onUserCreated) {
        await onUserCreated(statusFilter)
      }
      setToast({
        open: true,
        message: response?.message || 'Usuario eliminado correctamente.',
        severity: 'success',
      })
      handleCloseDelete()
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar el usuario.',
        severity: 'error',
      })
      handleCloseDelete()
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return users.filter((user) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? user.is_active
            : !user.is_active
      const matchesRole =
        roleFilter === 'all' ? true : user.user_type === roleFilter
      const userTerminalIds = Array.isArray(user.terminal_ids)
        ? user.terminal_ids
        : []
      const matchesTerminal =
        terminalFilter.length === 0
          ? true
          : terminalFilter.some((terminalId) =>
              userTerminalIds.includes(terminalId)
            )
      const name = `${user.name || ''} ${user.last_name || ''}`.toLowerCase()
      const email = String(user.email || '').toLowerCase()
      const role = String(user.user_type || '').toLowerCase().replaceAll('_', ' ')
      const company = String(user.company?.name || '').toLowerCase()
      const matchesQuery =
        !normalized ||
        name.includes(normalized) ||
        email.includes(normalized) ||
        role.includes(normalized) ||
        company.includes(normalized)
      return matchesStatus && matchesRole && matchesTerminal && matchesQuery
    })
  }, [users, query, statusFilter, roleFilter, terminalFilter])

  const sortedUsers = useMemo(() => {
    const getValue = (user) => {
      switch (sortBy) {
        case 'name':
          return `${user.name || ''} ${user.last_name || ''}`.trim()
        case 'email':
          return user.email || ''
        case 'company':
          return user.company?.name || ''
        case 'role':
          return user.user_type || ''
        case 'status':
          return user.is_active ? 'Activo' : 'Inactivo'
        default:
          return ''
      }
    }

    return [...filteredUsers].sort((a, b) => {
      const aVal = String(getValue(a)).toLowerCase()
      const bVal = String(getValue(b)).toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredUsers, sortBy, sortDir])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('')
      return
    }
    const objectUrl = URL.createObjectURL(photoFile)
    setPhotoPreview(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [photoFile])

  useEffect(() => {
    if (!editPhotoFile) {
      return
    }
    const objectUrl = URL.createObjectURL(editPhotoFile)
    setEditPhotoPreview(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [editPhotoFile])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pagedUsers = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return sortedUsers.slice(start, start + rowsPerPage)
  }, [sortedUsers, rowsPerPage, safePage])

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(key)
    setSortDir('asc')
  }

  return (
    <section className="card dashboard-card">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
          Listado de usuarios
        </Typography>
        <Button
          type="button"
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={handleOpenDialog}
          sx={{ height: 40 }}
        >
          Nuevo usuario
        </Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre, correo, rol o empresa"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          sx={{ minWidth: 280, flex: '1 1 280px' }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="users-terminal-filter" shrink>
            Terminales
          </InputLabel>
          <Select
            labelId="users-terminal-filter"
            label="Terminales"
            multiple
            displayEmpty
            value={terminalFilter}
            onChange={(event) => {
              setTerminalFilter(event.target.value)
              setPage(1)
            }}
            renderValue={(selected) => {
              if (!selected.length) return 'Todos'
              return selected
                .map((id) => terminals.find((t) => t.id === id)?.name || id)
                .join(', ')
            }}
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
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="users-role-filter">Rol</InputLabel>
          <Select
            labelId="users-role-filter"
            value={roleFilter}
            label="Rol"
            onChange={(event) => {
              setRoleFilter(event.target.value)
              setPage(1)
            }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="user">Usuario</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="superadmin">Superadmin</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="users-status-filter">Estado</InputLabel>
          <Select
            labelId="users-status-filter"
            value={statusFilter}
            label="Estado"
            onChange={(event) => {
              if (onStatusFilterChange) {
                onStatusFilterChange(event.target.value)
              }
              setPage(1)
            }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="active">Activos</MenuItem>
            <MenuItem value="inactive">Inactivos</MenuItem>
          </Select>
        </FormControl>
        <Button
          type="button"
          size="small"
          variant="outlined"
          startIcon={<FilterAltOff fontSize="small" />}
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          sx={{ borderColor: '#c7d2fe', color: '#4338ca', height: 40 }}
        >
          Limpiar filtros
        </Button>
        <Chip
          label={`${filteredUsers.length} resultados`}
          size="small"
          sx={{ backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: 600 }}
        />
      </Box>
      {usersError ? (
        <Typography className="error" component="p">
          {usersError}
        </Typography>
      ) : null}
      {!usersError && !isUsersLoading && filteredUsers.length === 0 ? (
        <Typography className="meta" component="p">
          No hay usuarios para mostrar.
        </Typography>
      ) : null}
      {!usersError && filteredUsers.length > 0 ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    backgroundColor: '#eef2ff',
                    color: '#4338ca',
                    fontWeight: 700,
                  },
                }}
              >
                <TableCell align="left">
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortDir : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Nombre
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left">
                  <TableSortLabel
                    active={sortBy === 'email'}
                    direction={sortBy === 'email' ? sortDir : 'asc'}
                    onClick={() => handleSort('email')}
                  >
                    Correo
                  </TableSortLabel>
                </TableCell>
                  <TableCell align="left">
                    <TableSortLabel
                      active={sortBy === 'company'}
                      direction={sortBy === 'company' ? sortDir : 'asc'}
                      onClick={() => handleSort('company')}
                    >
                      Empresa
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="left">Terminales</TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={sortBy === 'role'}
                      direction={sortBy === 'role' ? sortDir : 'asc'}
                    onClick={() => handleSort('role')}
                  >
                    Rol
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortDir : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Estado
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedUsers.map((user, index) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={{
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                    '&:hover': {
                      backgroundColor: '#eef2ff',
                    },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={user.photo_url || ''}
                        alt={`${user.name} ${user.last_name}`}
                        sx={{ width: 32, height: 32 }}
                      >
                        {user.name?.charAt(0) || 'U'}
                      </Avatar>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {user.name} {user.last_name}
                      </Typography>
                    </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.company?.name || 'Sin empresa'}</TableCell>
                <TableCell>
                  {user.user_type === 'superadmin' ? (
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
                  ) : Array.isArray(user.terminals) && user.terminals.length ? (
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                      {user.terminals.map((terminal) => (
                        <Chip
                          key={terminal.id}
                          label={terminal.name}
                          size="small"
                          sx={getTerminalChipStyle(terminal.name)}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin terminales
                    </Typography>
                  )}
                </TableCell>
                  <TableCell align="center">
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
                        user.user_type === 'superadmin'
                          ? '#5b21b6'
                          : user.user_type === 'admin'
                          ? '#1d4ed8'
                          : '#0f766e',
                      backgroundColor:
                        user.user_type === 'superadmin'
                          ? '#ede9fe'
                          : user.user_type === 'admin'
                          ? '#dbeafe'
                          : '#ccfbf1',
                    }}
                  >
                    {formatUserType(user.user_type)}
                  </Box>
                </TableCell>
                  <TableCell align="center">
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
                        color: user.is_active ? '#166534' : '#991b1b',
                        backgroundColor: user.is_active ? '#dcfce7' : '#fee2e2',
                      }}
                    >
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Box>
                  </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'inline-flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      aria-label="Ver usuario"
                      onClick={() => handleOpenView(user)}
                      sx={{
                        color: '#64748b',
                        '&:hover': { color: '#4338ca' },
                      }}
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Editar usuario"
                      onClick={() => handleOpenEdit(user)}
                      sx={{
                        color: '#64748b',
                        '&:hover': { color: '#0f766e' },
                      }}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Eliminar usuario"
                      onClick={() => handleOpenDelete(user)}
                      sx={{
                        color: '#64748b',
                        '&:hover': { color: '#b91c1c' },
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box />
      )}
      {!usersError && filteredUsers.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mt: 2,
          }}
        >
          <Typography className="meta" component="p">
            Pagina {safePage} de {totalPages}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="users-rows-per-page">Filas</InputLabel>
              <Select
                labelId="users-rows-per-page"
                value={rowsPerPage}
                label="Filas"
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setPage(1)
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="outlined"
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={safePage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Siguiente
            </Button>
          </Box>
        </Box>
      ) : null}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 4 }}>Nuevo usuario</DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gap: 2,
            pt: 1,
            overflow: 'visible',
            '& .MuiFormControl-root': {
              overflow: 'visible',
            },
            '& .MuiInputLabel-root': {
              backgroundColor: '#ffffff',
              padding: '0 4px',
            },
            '& .MuiInputLabel-shrink': {
              top: 0,
            },
          }}
          >
            {formError ? (
              <Typography className="error" component="p">
                {formError}
              </Typography>
            ) : null}
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' },
                alignItems: 'start',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gap: 1,
                  justifyItems: 'center',
                  gridRow: { sm: 'span 2' },
                }}
              >
                <Avatar
                  src={photoPreview || ''}
                  alt="Foto de usuario"
                  sx={{ width: 96, height: 96, borderRadius: 3 }}
                >
                  {formData.name?.charAt(0) || 'U'}
                </Avatar>
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  {photoFile ? 'Cambiar foto' : 'Seleccionar foto'}
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
                    onClick={() => setPhotoFile(null)}
                    sx={{ textTransform: 'none' }}
                  >
                    Quitar foto
                  </Button>
                ) : null}
              </Box>
              <TextField
                label="Nombre"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                sx={{ mt: 0.5 }}
                required
              />
              <TextField
                label="Apellido"
                value={formData.last_name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, last_name: event.target.value }))
                }
                required
              />
            </Box>
          <TextField
            label="Correo"
            type="email"
            value={formData.email}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, email: event.target.value }))
            }
            autoComplete="off"
            required
          />
          <TextField
            label="Contrasena"
            type="password"
            value={formData.password}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, password: event.target.value }))
            }
            autoComplete="new-password"
            required
          />
            <FormControl>
              <InputLabel id="user-type-label">Rol</InputLabel>
              <Select
                labelId="user-type-label"
                label="Rol"
                value={formData.user_type}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, user_type: event.target.value }))
                }
              >
                <MenuItem value="user">Usuario</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="superadmin">Superadmin</MenuItem>
              </Select>
            </FormControl>
          <FormControl>
            <InputLabel id="company-label">Empresa</InputLabel>
            <Select
              labelId="company-label"
              label="Empresa"
              value={formData.company_id}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, company_id: event.target.value }))
              }
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
          <FormControl>
            <InputLabel id="terminals-label">Terminales</InputLabel>
            <Select
              labelId="terminals-label"
              label="Terminales"
              multiple
              disabled={formData.user_type === 'superadmin'}
              value={formData.terminal_ids}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  terminal_ids: event.target.value,
                }))
              }
              renderValue={(selected) =>
                formData.user_type === 'superadmin'
                  ? 'Todos los terminales'
                  : selected
                      .map(
                        (id) => terminals.find((t) => t.id === id)?.name || id
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
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            flexWrap: 'nowrap',
          }}
        >
          <Button type="button" onClick={resetForm}>
            Limpiar formulario
          </Button>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isCreateLoading} maxWidth="xs" fullWidth>
        <DialogTitle>Guardando usuario...</DialogTitle>
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
      <Dialog open={isEditOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 4 }}>Editar usuario</DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gap: 2,
            pt: 1,
            overflow: 'visible',
            '& .MuiFormControl-root': {
              overflow: 'visible',
            },
            '& .MuiInputLabel-root': {
              backgroundColor: '#ffffff',
              padding: '0 4px',
            },
            '& .MuiInputLabel-shrink': {
              top: 0,
            },
          }}
          >
            {formError ? (
              <Typography className="error" component="p">
                {formError}
              </Typography>
            ) : null}
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' },
                alignItems: 'start',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gap: 1,
                  justifyItems: 'center',
                  gridRow: { sm: 'span 2' },
                }}
              >
                <Avatar
                  src={editPhotoPreview || ''}
                  alt="Foto de usuario"
                  sx={{ width: 96, height: 96, borderRadius: 3 }}
                >
                  {editData.name?.charAt(0) || 'U'}
                </Avatar>
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  {editPhotoFile ? 'Cambiar foto' : editPhotoPreview ? 'Cambiar foto' : 'Seleccionar foto'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null
                      setEditPhotoFile(file)
                    }}
                  />
                </Button>
                {editPhotoFile || editPhotoPreview ? (
                  <Button
                    type="button"
                    variant="text"
                    size="small"
                    onClick={() => {
                      setEditPhotoFile(null)
                      setEditPhotoPreview('')
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Quitar foto
                  </Button>
                ) : null}
              </Box>
              <TextField
                label="Nombre"
                value={editData.name}
                onChange={(event) =>
                  setEditData((prev) => ({ ...prev, name: event.target.value }))
                }
                sx={{ mt: 0.5 }}
                required
              />
              <TextField
                label="Apellido"
                value={editData.last_name}
                onChange={(event) =>
                  setEditData((prev) => ({ ...prev, last_name: event.target.value }))
                }
                required
              />
            </Box>
          <TextField
            label="Correo"
            type="email"
            value={editData.email}
            onChange={(event) =>
              setEditData((prev) => ({ ...prev, email: event.target.value }))
            }
            autoComplete="off"
            required
          />
          <FormControl>
            <InputLabel id="edit-user-type-label">Rol</InputLabel>
            <Select
              labelId="edit-user-type-label"
              label="Rol"
              value={editData.user_type}
              onChange={(event) =>
                setEditData((prev) => ({ ...prev, user_type: event.target.value }))
              }
            >
              <MenuItem value="user">Usuario</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="superadmin">Superadmin</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="edit-company-label">Empresa</InputLabel>
            <Select
              labelId="edit-company-label"
              label="Empresa"
              value={editData.company_id}
              onChange={(event) =>
                setEditData((prev) => ({ ...prev, company_id: event.target.value }))
              }
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
          <FormControl>
            <InputLabel id="edit-terminals-label">Terminales</InputLabel>
            <Select
              labelId="edit-terminals-label"
              label="Terminales"
              multiple
              disabled={editData.user_type === 'superadmin'}
              value={editData.terminal_ids}
              onChange={(event) =>
                setEditData((prev) => ({
                  ...prev,
                  terminal_ids: event.target.value,
                }))
              }
              renderValue={(selected) =>
                editData.user_type === 'superadmin'
                  ? 'Todos los terminales'
                  : selected
                      .map(
                        (id) => terminals.find((t) => t.id === id)?.name || id
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
                <MenuItem key={terminal.id} value={terminal.id}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch
              checked={editData.is_active}
              onChange={(event) =>
                setEditData((prev) => ({ ...prev, is_active: event.target.checked }))
              }
            />
            <Typography>Usuario activo</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEdit}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleUpdateUser}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isUpdateLoading} maxWidth="xs" fullWidth>
        <DialogTitle>Actualizando usuario...</DialogTitle>
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
      <Dialog
        open={isViewOpen}
        onClose={handleCloseView}
        fullWidth={false}
        maxWidth="xs"
        PaperProps={{ sx: { width: 420, maxWidth: '90vw' } }}
      >
        <DialogTitle sx={{ pb: 2, fontSize: '1.05rem' }}>
          Detalle de usuario
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'grid',
            gap: 1.25,
            pt: 1,
            fontSize: '0.95rem',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' },
              alignItems: 'start',
            }}
          >
            <Box sx={{ display: 'grid', gap: 1, justifyItems: 'center' }}>
              <Avatar
                src={viewUser?.photo_url || ''}
                alt={viewUser ? `${viewUser.name} ${viewUser.last_name}` : 'Usuario'}
                sx={{ width: 96, height: 96, borderRadius: 3 }}
              >
                {viewUser?.name?.charAt(0) || 'U'}
              </Avatar>
            </Box>
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Nombre
              </Typography>
              <Typography>
                {viewUser ? `${viewUser.name} ${viewUser.last_name}` : '-'}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Correo
              </Typography>
              <Typography sx={{ fontSize: '0.95rem' }}>
                {viewUser?.email || '-'}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Rol
              </Typography>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  width: 'fit-content',
                  color:
                    viewUser?.user_type === 'superadmin'
                      ? '#5b21b6'
                      : viewUser?.user_type === 'admin'
                      ? '#1d4ed8'
                      : '#0f766e',
                  backgroundColor:
                    viewUser?.user_type === 'superadmin'
                      ? '#ede9fe'
                      : viewUser?.user_type === 'admin'
                      ? '#dbeafe'
                      : '#ccfbf1',
                }}
              >
                {viewUser ? formatUserType(viewUser.user_type) : '-'}
              </Box>
              <Typography variant="subtitle2" color="text.secondary">
                Empresa
              </Typography>
              <Typography sx={{ fontSize: '0.95rem' }}>
                {viewUser?.company?.name || 'Sin empresa'}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Terminales
              </Typography>
              {viewUser?.user_type === 'superadmin' ? (
                <Chip
                  label="Todos"
                  size="small"
                  sx={{
                    backgroundColor: '#1e3a8a',
                    color: '#e0f2fe',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 20,
                    width: 'fit-content',
                  }}
                />
              ) : Array.isArray(viewUser?.terminals) && viewUser.terminals.length ? (
                <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                  {viewUser.terminals.map((terminal) => (
                    <Chip
                      key={terminal.id}
                      label={terminal.name}
                      size="small"
                      sx={getTerminalChipStyle(terminal.name)}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ fontSize: '0.95rem' }}>Sin terminales</Typography>
              )}
              <Typography variant="subtitle2" color="text.secondary">
                Estado
              </Typography>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  width: 'fit-content',
                  color: viewUser?.is_active ? '#166534' : '#991b1b',
                  backgroundColor: viewUser?.is_active ? '#dcfce7' : '#fee2e2',
                }}
              >
                {viewUser?.is_active ? 'Activo' : 'Inactivo'}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="text"
            startIcon={<EditOutlined fontSize="small" />}
            onClick={() => {
              if (viewUser) {
                handleCloseView()
                handleOpenEdit(viewUser)
              }
            }}
            sx={{ textTransform: 'none', color: '#0f766e' }}
          >
            Editar
          </Button>
          <Button onClick={handleCloseView}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isDeleteOpen} onClose={handleCloseDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar eliminacion</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteTarget
              ? `Vas a eliminar a ${deleteTarget.name} ${deleteTarget.last_name}.`
              : 'Vas a eliminar este usuario.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Si el usuario tiene actividad relacionada, se desactivara en lugar de
            eliminarse.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDelete}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
            disabled={isSubmitting}
            startIcon={<DeleteOutline fontSize="small" />}
          >
            {isSubmitting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default UsersTable
