import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStoredFilterValue } from '../../utils/storage'
import { useAuthStore } from '../../store/useAuthStore'
import { Add } from '@mui/icons-material'
import { Alert, Box, Button, Snackbar, Typography, useMediaQuery, useTheme } from '@mui/material'
import {
  createUser,
  deleteUser,
  fetchCompanies,
  fetchCompanyTerminals,
  fetchUserById,
  uploadUserPhoto,
  updateUser,
} from '../../services/api'
import {
  UserFormDialog,
  UserDeleteDialog,
  UserProgressDialog,
  UserViewDialog,
} from './UserDialogs'
import { UsersDataTable } from './UsersDataTable'
import { UsersFilters } from './UsersFilters'
import { getTerminalChipStyle } from './userUtils'
import { brand } from '../../theme'

const CREATE_FORM_INITIAL_STATE = {
  name: '',
  last_name: '',
  email: '',
  password: '',
  user_type: 'user',
  company_id: '',
  terminal_ids: [],
}

const EDIT_FORM_INITIAL_STATE = {
  name: '',
  last_name: '',
  email: '',
  user_type: 'user',
  company_id: '',
  is_active: true,
  terminal_ids: [],
}

const USER_FORM_FIELD_ERRORS_INITIAL_STATE = {
  name: '',
  last_name: '',
  email: '',
  password: '',
  user_type: '',
  company_id: '',
  terminal_ids: '',
}

const UsersTable = ({
  users,
  usersError,
  isUsersLoading,
  formatUserType,
  onRefresh,
}) => {
  const { tokenType, accessToken } = useAuthStore()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [query, setQuery] = useState(() => getStoredFilterValue('users.filters.query', ''))
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [roleFilter, setRoleFilter] = useState(() =>
    getStoredFilterValue('users.filters.role', 'all'),
  )
  const [terminalFilter, setTerminalFilter] = useState(() =>
    getStoredFilterValue('users.filters.terminals', []),
  )
  const [statusFilter, setStatusFilter] = useState(() =>
    getStoredFilterValue('users.filters.status', 'all'),
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
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
  const [formData, setFormData] = useState(CREATE_FORM_INITIAL_STATE)
  const [createFieldErrors, setCreateFieldErrors] = useState(USER_FORM_FIELD_ERRORS_INITIAL_STATE)
  const [createFocusField, setCreateFocusField] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [editData, setEditData] = useState(EDIT_FORM_INITIAL_STATE)
  const [editFieldErrors, setEditFieldErrors] = useState(USER_FORM_FIELD_ERRORS_INITIAL_STATE)
  const [editFocusField, setEditFocusField] = useState('')
  const [editPhotoFile, setEditPhotoFile] = useState(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState('')
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const hasActiveFilters =
    query.trim().length > 0 ||
    statusFilter !== 'all' ||
    roleFilter !== 'all' ||
    terminalFilter.length > 0

  useEffect(() => {
    window.localStorage.setItem('users.filters.query', JSON.stringify(query))
  }, [query])

  useEffect(() => {
    window.localStorage.setItem('users.filters.role', JSON.stringify(roleFilter))
  }, [roleFilter])

  useEffect(() => {
    window.localStorage.setItem('users.filters.terminals', JSON.stringify(terminalFilter))
  }, [terminalFilter])

  useEffect(() => {
    window.localStorage.setItem('users.filters.status', JSON.stringify(statusFilter))
  }, [statusFilter])

  const handleClearFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setRoleFilter('all')
    setTerminalFilter([])
    setPage(1)
  }

  const resetForm = () => {
    setFormError('')
    setFormData(CREATE_FORM_INITIAL_STATE)
    setCreateFieldErrors(USER_FORM_FIELD_ERRORS_INITIAL_STATE)
    setCreateFocusField('')
    setPhotoFile(null)
    setPhotoPreview('')
  }

  const resetEditForm = () => {
    setFormError('')
    setEditData(EDIT_FORM_INITIAL_STATE)
    setEditFieldErrors(USER_FORM_FIELD_ERRORS_INITIAL_STATE)
    setEditFocusField('')
    setEditPhotoFile(null)
    setEditPhotoPreview('')
  }

  const handleCreateFormDataChange = (changes) => {
    setFormData((prev) => ({ ...prev, ...changes }))
    setCreateFieldErrors((prev) => {
      const next = { ...prev }
      if (Object.prototype.hasOwnProperty.call(changes, 'name')) {
        next.name = ''
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'last_name')) {
        next.last_name = ''
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'email')) {
        next.email = ''
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'password')) {
        next.password = ''
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'user_type')) {
        next.user_type = ''
        if (changes.user_type === 'superadmin') {
          next.terminal_ids = ''
        }
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'company_id')) {
        next.company_id = ''
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'terminal_ids')) {
        next.terminal_ids = ''
      }
      return next
    })
    setCreateFocusField('')
  }

  const handleEditDataChange = (changes) => {
    setEditData((prev) => ({ ...prev, ...changes }))
    setEditFieldErrors((prev) => {
      const next = { ...prev }
      if (Object.prototype.hasOwnProperty.call(changes, 'name')) {
        next.name = ''
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'last_name')) {
        next.last_name = ''
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'email')) {
        next.email = ''
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'user_type')) {
        next.user_type = ''
        if (changes.user_type === 'superadmin') {
          next.terminal_ids = ''
        }
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'company_id')) {
        next.company_id = ''
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'terminal_ids')) {
        next.terminal_ids = ''
      }
      return next
    })
    setEditFocusField('')
  }

  const ensureReferenceData = useCallback(async () => {
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
  }, [accessToken, companies.length, terminals.length, tokenType])

  useEffect(() => {
    if (!accessToken) return
    ensureReferenceData()
  }, [accessToken, ensureReferenceData])

  const handleOpenDialog = async () => {
    setFormMode('create')
    setIsDialogOpen(true)
    setFormError('')
    setCreateFieldErrors(USER_FORM_FIELD_ERRORS_INITIAL_STATE)
    setCreateFocusField('')
    await ensureReferenceData()
  }

  const handleOpenEdit = async (user) => {
    const editTerminalIds = Array.isArray(user.terminal_ids)
      ? user.terminal_ids
      : Array.isArray(user.terminals)
        ? user.terminals.map((terminal) => terminal?.id).filter(Boolean)
        : []
    setEditUserId(user.id)
    setEditData({
      name: user.name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      user_type: user.user_type || 'user',
      company_id: String(user.company?.id || user.company_id || ''),
      is_active: Boolean(user.is_active),
      terminal_ids: editTerminalIds.map((id) => String(id)),
    })
    setEditPhotoFile(null)
    setEditPhotoPreview(user.photo_url || '')
    setFormMode('edit')
    setIsDialogOpen(true)
    setFormError('')
    setEditFieldErrors(USER_FORM_FIELD_ERRORS_INITIAL_STATE)
    setEditFocusField('')
    await ensureReferenceData()
  }

  const handleOpenView = async (user) => {
    setViewUser(user)
    setIsViewOpen(true)
    if (!accessToken) return
    await ensureReferenceData()
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
    if (formMode === 'edit') {
      setEditUserId(null)
      resetEditForm()
      return
    }
    resetForm()
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

    const nextFieldErrors = {
      name: '',
      last_name: '',
      email: '',
      password: '',
      user_type: '',
      company_id: '',
      terminal_ids: '',
    }
    if (formData.name.trim().length < 2) {
      nextFieldErrors.name = 'El nombre debe tener minimo 2 caracteres.'
    }
    if (formData.last_name.trim().length < 2) {
      nextFieldErrors.last_name = 'El apellido debe tener minimo 2 caracteres.'
    }
    if (!formData.email.trim()) {
      nextFieldErrors.email = 'El correo es obligatorio.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextFieldErrors.email = 'El correo no tiene un formato valido.'
    }
    if (formData.password.trim().length < 8) {
      nextFieldErrors.password = 'La contraseña debe tener minimo 8 caracteres.'
    }
    if (!String(formData.user_type || '').trim()) {
      nextFieldErrors.user_type = 'Selecciona un rol.'
    }
    if (!formData.company_id) {
      nextFieldErrors.company_id = 'Selecciona una empresa.'
    }
    if (formData.user_type !== 'superadmin' && !formData.terminal_ids.length) {
      nextFieldErrors.terminal_ids = 'Selecciona al menos un terminal.'
    }
    const fieldOrder = [
      'name',
      'last_name',
      'email',
      'password',
      'user_type',
      'company_id',
      'terminal_ids',
    ]
    const firstFieldWithError = fieldOrder.find((field) => Boolean(nextFieldErrors[field]))
    setCreateFieldErrors(nextFieldErrors)
    if (firstFieldWithError) {
      setCreateFocusField(firstFieldWithError)
      setFormError('')
      return
    }
    setCreateFocusField('')

    if (photoFile && !photoFile.type.startsWith('image/')) {
      setFormError('La foto debe ser un archivo de imagen valido.')
      return
    }
    if (photoFile && photoFile.size > 2 * 1024 * 1024) {
      setFormError('La foto no debe superar 2MB.')
      return
    }

    setIsCreateLoading(true)
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
            formData.user_type === 'superadmin' ? [] : formData.terminal_ids.map(Number),
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
      handleCloseDialog()
      if (onRefresh) await onRefresh()
      setToast({
        open: true,
        message: 'Usuario creado correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setFormError(err?.detail || 'No se pudo crear el usuario.')
    } finally {
      setIsCreateLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    setFormError('')
    const nextFieldErrors = {
      name: '',
      last_name: '',
      email: '',
      password: '',
      user_type: '',
      company_id: '',
      terminal_ids: '',
    }
    if (editData.name.trim().length < 2) {
      nextFieldErrors.name = 'El nombre debe tener minimo 2 caracteres.'
    }
    if (editData.last_name.trim().length < 2) {
      nextFieldErrors.last_name = 'El apellido debe tener minimo 2 caracteres.'
    }
    if (!editData.email.trim()) {
      nextFieldErrors.email = 'El correo es obligatorio.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email.trim())) {
      nextFieldErrors.email = 'El correo no tiene un formato valido.'
    }
    if (!String(editData.user_type || '').trim()) {
      nextFieldErrors.user_type = 'Selecciona un rol.'
    }
    if (!editData.company_id) {
      nextFieldErrors.company_id = 'Selecciona una empresa.'
    }
    if (editData.user_type !== 'superadmin' && !editData.terminal_ids.length) {
      nextFieldErrors.terminal_ids = 'Selecciona al menos un terminal.'
    }
    const fieldOrder = ['name', 'last_name', 'email', 'user_type', 'company_id', 'terminal_ids']
    const firstFieldWithError = fieldOrder.find((field) => Boolean(nextFieldErrors[field]))
    setEditFieldErrors(nextFieldErrors)
    if (firstFieldWithError) {
      setEditFocusField(firstFieldWithError)
      setFormError('')
      return
    }
    setEditFocusField('')

    setIsUpdateLoading(true)
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
            editData.user_type === 'superadmin' ? [] : editData.terminal_ids.map(Number),
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
      handleCloseDialog()
      if (onRefresh) await onRefresh()
      setToast({
        open: true,
        message: 'Usuario actualizado correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setFormError(err?.detail || 'No se pudo actualizar el usuario.')
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
      if (onRefresh) await onRefresh()
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
        statusFilter === 'all' ? true : statusFilter === 'active' ? user.is_active : !user.is_active
      const matchesRole = roleFilter === 'all' ? true : user.user_type === roleFilter
      const userTerminalIds = Array.isArray(user.terminal_ids) ? user.terminal_ids : []
      const matchesTerminal =
        terminalFilter.length === 0
          ? true
          : terminalFilter.some((terminalId) => userTerminalIds.includes(terminalId))
      const name = `${user.name || ''} ${user.last_name || ''}`.toLowerCase()
      const email = String(user.email || '').toLowerCase()
      const role = String(user.user_type || '')
        .toLowerCase()
        .replaceAll('_', ' ')
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

  const isCreateMode = formMode === 'create'
  const activeFormData = isCreateMode ? formData : editData
  const activeFieldErrors = isCreateMode ? createFieldErrors : editFieldErrors
  const activeFocusField = isCreateMode ? createFocusField : editFocusField
  const activePhotoFile = isCreateMode ? photoFile : editPhotoFile
  const activePhotoPreview = isCreateMode ? photoPreview : editPhotoPreview
  const isFormLoading = isCreateMode ? isCreateLoading : isUpdateLoading

  return (
    <section className="card dashboard-card">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 1,
          pb: 1.5,
          borderBottom: `2px solid ${brand.magentaA15}`,
        }}
      >
        <Box>
          <Typography
            component="h2"
            variant="h5"
            sx={{ fontWeight: 700, color: 'secondary.dark', lineHeight: 1.2 }}
          >
            Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Gestiona los usuarios del sistema
          </Typography>
        </Box>
        <Button
          type="button"
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={handleOpenDialog}
          fullWidth={isMobile}
          sx={{
            height: 40,
            borderRadius: 2,
            fontWeight: 600,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          Nuevo usuario
        </Button>
      </Box>

      <UsersFilters
        query={query}
        roleFilter={roleFilter}
        terminalFilter={terminalFilter}
        statusFilter={statusFilter}
        terminals={terminals}
        terminalsLoading={terminalsLoading}
        filteredCount={filteredUsers.length}
        hasActiveFilters={hasActiveFilters}
        onQueryChange={(value) => {
          setQuery(value)
          setPage(1)
        }}
        onRoleFilterChange={(value) => {
          setRoleFilter(value)
          setPage(1)
        }}
        onTerminalFilterChange={(value) => {
          setTerminalFilter(value)
          setPage(1)
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setPage(1)
        }}
        onClearFilters={handleClearFilters}
      />

      <UsersDataTable
        usersError={usersError}
        isUsersLoading={isUsersLoading}
        filteredCount={filteredUsers.length}
        pagedUsers={pagedUsers}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        formatUserType={formatUserType}
        getTerminalChipStyle={getTerminalChipStyle}
        onOpenView={handleOpenView}
        onOpenEdit={handleOpenEdit}
        onOpenDelete={handleOpenDelete}
        safePage={safePage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size)
          setPage(1)
        }}
        onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
      />

      <UserFormDialog
        mode={formMode}
        open={isDialogOpen}
        isMobile={isMobile}
        formError={formError}
        formData={activeFormData}
        fieldErrors={activeFieldErrors}
        focusField={activeFocusField}
        photoFile={activePhotoFile}
        photoPreview={activePhotoPreview}
        companies={companies}
        companiesLoading={companiesLoading}
        terminals={terminals}
        terminalsLoading={terminalsLoading}
        isSubmitting={isFormLoading}
        onClose={handleCloseDialog}
        onSubmit={isCreateMode ? handleCreateUser : handleUpdateUser}
        onFormDataChange={isCreateMode ? handleCreateFormDataChange : handleEditDataChange}
        onFocusHandled={
          isCreateMode ? () => setCreateFocusField('') : () => setEditFocusField('')
        }
        onPhotoChange={isCreateMode ? setPhotoFile : setEditPhotoFile}
        onPhotoClear={
          isCreateMode
            ? () => setPhotoFile(null)
            : () => {
                setEditPhotoFile(null)
                setEditPhotoPreview('')
              }
        }
      />

      <UserViewDialog
        open={isViewOpen}
        isMobile={isMobile}
        viewUser={viewUser}
        companies={companies}
        terminals={terminals}
        onClose={handleCloseView}
        onEdit={() => {
          if (viewUser) {
            handleCloseView()
            handleOpenEdit(viewUser)
          }
        }}
      />

      <UserDeleteDialog
        open={isDeleteOpen}
        isMobile={isMobile}
        deleteTarget={deleteTarget}
        isSubmitting={isSubmitting}
        onClose={handleCloseDelete}
        onConfirm={handleDeleteUser}
      />

      <UserProgressDialog
        open={isCreateLoading || isUpdateLoading}
        title={isCreateLoading ? 'Creando usuario...' : 'Actualizando usuario...'}
      />

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

export default UsersTable
