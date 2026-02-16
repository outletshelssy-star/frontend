import { useMemo, useState } from 'react'
import {
  Add,
  DeleteOutline,
  EditOutlined,
  FilterAltOff,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material'
import { createCompany, deleteCompany, fetchCompanyById, updateCompany } from '../services/api'

const CompaniesTable = ({
  companies,
  companiesError,
  isCompaniesLoading,
  tokenType,
  accessToken,
  onCompanyChanged,
}) => {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [isUpdateLoading, setIsUpdateLoading] = useState(false)
  const [companyId, setCompanyId] = useState(null)
  const [viewCompany, setViewCompany] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    company_type: 'client',
    is_active: true,
  })
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const hasActiveFilters = query.trim().length > 0 || typeFilter !== 'all'

  const handleClearFilters = () => {
    setQuery('')
    setTypeFilter('all')
    setPage(1)
  }

  const filteredCompanies = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return companies.filter((company) => {
      const matchesType =
        typeFilter === 'all' ? true : company.company_type === typeFilter
      const name = String(company.name || '').toLowerCase()
      const type = String(company.company_type || '').toLowerCase()
      const matchesQuery =
        !normalized || name.includes(normalized) || type.includes(normalized)
      return matchesType && matchesQuery
    })
  }, [companies, query, typeFilter])

  const sortedCompanies = useMemo(() => {
    const getValue = (company) => {
      switch (sortBy) {
        case 'name':
          return company.name || ''
        case 'type':
          return company.company_type || ''
        default:
          return ''
      }
    }
    return [...filteredCompanies].sort((a, b) => {
      const aVal = String(getValue(a)).toLowerCase()
      const bVal = String(getValue(b)).toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredCompanies, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pagedCompanies = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return sortedCompanies.slice(start, start + rowsPerPage)
  }, [sortedCompanies, rowsPerPage, safePage])

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(key)
    setSortDir('asc')
  }

  const openCreate = () => {
    setFormData({ name: '', company_type: 'client', is_active: true })
    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
  }

  const openEdit = (company) => {
    setCompanyId(company.id)
    setFormData({
      name: company.name || '',
      company_type: company.company_type || 'client',
      is_active: company.is_active ?? true,
    })
    setIsEditOpen(true)
  }

  const closeEdit = () => {
    setIsEditOpen(false)
    setCompanyId(null)
  }

  const openView = async (company) => {
    setViewCompany(company)
    setIsViewOpen(true)
    try {
      const data = await fetchCompanyById({
        tokenType,
        accessToken,
        companyId: company.id,
      })
      setViewCompany(data)
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo cargar el detalle de la empresa.',
        severity: 'error',
      })
    }
  }

  const closeView = () => {
    setIsViewOpen(false)
    setViewCompany(null)
  }

  const openDelete = (company) => {
    setCompanyId(company.id)
    setViewCompany(company)
    setIsDeleteOpen(true)
  }

  const closeDelete = () => {
    setIsDeleteOpen(false)
    setCompanyId(null)
    setViewCompany(null)
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setToast({
        open: true,
        message: 'El nombre es obligatorio.',
        severity: 'error',
      })
      return
    }
    setIsCreateLoading(true)
    closeCreate()
    try {
      await createCompany({
        tokenType,
        accessToken,
        payload: {
          name: formData.name.trim(),
          company_type: formData.company_type,
          is_active: formData.is_active,
        },
      })
      if (onCompanyChanged) {
        await onCompanyChanged()
      }
      setToast({
        open: true,
        message: 'Empresa creada correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo crear la empresa.',
        severity: 'error',
      })
    } finally {
      setIsCreateLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!companyId) return
    if (!formData.name.trim()) {
      setToast({
        open: true,
        message: 'El nombre es obligatorio.',
        severity: 'error',
      })
      return
    }
    setIsUpdateLoading(true)
    closeEdit()
    try {
      await updateCompany({
        tokenType,
        accessToken,
        companyId,
        payload: {
          name: formData.name.trim(),
          company_type: formData.company_type,
          is_active: formData.is_active,
        },
      })
      if (onCompanyChanged) {
        await onCompanyChanged()
      }
      setToast({
        open: true,
        message: 'Empresa actualizada correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo actualizar la empresa.',
        severity: 'error',
      })
    } finally {
      setIsUpdateLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!companyId) return
    setIsSaving(true)
    try {
      await deleteCompany({ tokenType, accessToken, companyId })
      if (onCompanyChanged) {
        await onCompanyChanged()
      }
      setToast({
        open: true,
        message: 'Empresa eliminada correctamente.',
        severity: 'success',
      })
      closeDelete()
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar la empresa.',
        severity: 'error',
      })
      closeDelete()
    } finally {
      setIsSaving(false)
    }
  }

  const renderTypeBadge = (type) => {
    const colors =
      type === 'master'
        ? { fg: '#5b21b6', bg: '#ede9fe' }
        : type === 'partner'
          ? { fg: '#1d4ed8', bg: '#dbeafe' }
          : { fg: '#0f766e', bg: '#ccfbf1' }
    return (
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
          color: colors.fg,
          backgroundColor: colors.bg,
        }}
      >
        {type}
      </Box>
    )
  }

  const renderStatusBadge = (isActive) => {
    const colors = isActive
      ? { fg: '#16a34a', bg: '#dcfce7' }
      : { fg: '#b91c1c', bg: '#fee2e2' }
    return (
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
          color: colors.fg,
          backgroundColor: colors.bg,
        }}
      >
        {isActive ? 'Activo' : 'Inactivo'}
      </Box>
    )
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
          Listado de empresas
        </Typography>
        <Button
          type="button"
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={openCreate}
          sx={{ height: 40 }}
        >
          Nueva empresa
        </Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre o tipo"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          sx={{ minWidth: 280, flex: '1 1 280px' }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="companies-type-filter">Tipo</InputLabel>
          <Select
            labelId="companies-type-filter"
            value={typeFilter}
            label="Tipo"
            onChange={(event) => {
              setTypeFilter(event.target.value)
              setPage(1)
            }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="master">Master</MenuItem>
            <MenuItem value="client">Client</MenuItem>
            <MenuItem value="partner">Partner</MenuItem>
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
          label={`${filteredCompanies.length} resultados`}
          size="small"
          sx={{ backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: 600 }}
        />
      </Box>
      {companiesError ? (
        <Typography className="error" component="p">
          {companiesError}
        </Typography>
      ) : null}
      {!companiesError && !isCompaniesLoading && filteredCompanies.length === 0 ? (
        <Typography className="meta" component="p">
          No hay empresas para mostrar.
        </Typography>
      ) : null}
      {!companiesError && filteredCompanies.length > 0 ? (
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
                    Nombre de Empresa
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={sortBy === 'type'}
                    direction={sortBy === 'type' ? sortDir : 'asc'}
                    onClick={() => handleSort('type')}
                  >
                    Tipo
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedCompanies.map((company, index) => (
                <TableRow
                  key={company.id}
                  hover
                  sx={{
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                    '&:hover': {
                      backgroundColor: '#eef2ff',
                    },
                  }}
                >
                  <TableCell>{company.name}</TableCell>
                  <TableCell align="center">
                    {renderTypeBadge(company.company_type)}
                  </TableCell>
                  <TableCell align="center">
                    {renderStatusBadge(Boolean(company.is_active))}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        aria-label="Ver empresa"
                        onClick={() => openView(company)}
                        sx={{ color: '#64748b', '&:hover': { color: '#4338ca' } }}
                      >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Editar empresa"
                        onClick={() => openEdit(company)}
                        sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Eliminar empresa"
                        onClick={() => openDelete(company)}
                        sx={{ color: '#64748b', '&:hover': { color: '#b91c1c' } }}
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
      ) : null}
      {!companiesError && filteredCompanies.length > 0 ? (
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
              <InputLabel id="companies-rows-per-page">Filas</InputLabel>
              <Select
                labelId="companies-rows-per-page"
                value={rowsPerPage}
                label="Filas"
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setPage(1)
                }}
              >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={15}>15</MenuItem>
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
      <Dialog open={isCreateOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>Nueva empresa</DialogTitle>
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
          <TextField
            label="Nombre"
            value={formData.name}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <FormControl>
            <InputLabel id="company-type-label">Tipo</InputLabel>
            <Select
              labelId="company-type-label"
              label="Tipo"
              value={formData.company_type}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, company_type: event.target.value }))
              }
            >
              <MenuItem value="master">Master</MenuItem>
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="partner">Partner</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="company-status-label">Estado</InputLabel>
            <Select
              labelId="company-status-label"
              label="Estado"
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  is_active: event.target.value === 'active',
                }))
              }
            >
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="inactive">Inactivo</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreate}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isEditOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Editar empresa</DialogTitle>
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
          <TextField
            label="Nombre"
            value={formData.name}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <FormControl>
            <InputLabel id="company-type-edit">Tipo</InputLabel>
            <Select
              labelId="company-type-edit"
              label="Tipo"
              value={formData.company_type}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, company_type: event.target.value }))
              }
            >
              <MenuItem value="master">Master</MenuItem>
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="partner">Partner</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="company-status-edit">Estado</InputLabel>
            <Select
              labelId="company-status-edit"
              label="Estado"
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  is_active: event.target.value === 'active',
                }))
              }
            >
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="inactive">Inactivo</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdate}>
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isViewOpen} onClose={closeView} fullWidth maxWidth="xs">
        <DialogTitle>Detalle de empresa</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Nombre
          </Typography>
          <Typography>{viewCompany?.name || '-'}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Tipo
          </Typography>
          {renderTypeBadge(viewCompany?.company_type || '-')}
          <Typography variant="subtitle2" color="text.secondary">
            Estado
          </Typography>
          {renderStatusBadge(Boolean(viewCompany?.is_active))}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeView}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isDeleteOpen} onClose={closeDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar eliminacion</DialogTitle>
        <DialogContent>
          <Typography>
            {viewCompany ? `Vas a eliminar ${viewCompany.name}.` : 'Vas a eliminar esta empresa.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={isSaving}
            startIcon={<DeleteOutline fontSize="small" />}
          >
            {isSaving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isCreateLoading} maxWidth="xs" fullWidth>
        <DialogTitle>Guardando empresa...</DialogTitle>
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
      <Dialog open={isUpdateLoading} maxWidth="xs" fullWidth>
        <DialogTitle>Actualizando empresa...</DialogTitle>
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

export default CompaniesTable
