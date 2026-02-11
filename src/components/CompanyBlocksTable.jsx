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
import {
  createCompanyBlock,
  deleteCompanyBlock,
  fetchCompanyBlockById,
  updateCompanyBlock,
} from '../services/api'

const CompanyBlocksTable = ({
  blocks,
  blocksError,
  isBlocksLoading,
  companies,
  tokenType,
  accessToken,
  onBlockChanged,
}) => {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
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
  const [blockId, setBlockId] = useState(null)
  const [viewBlock, setViewBlock] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    company_id: '',
    is_active: true,
  })
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const hasActiveFilters =
    query.trim().length > 0 || statusFilter !== 'all' || companyFilter !== 'all'

  const handleClearFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setCompanyFilter('all')
    setPage(1)
  }

  const filteredBlocks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return blocks.filter((block) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? block.is_active
          : !block.is_active
      const matchesCompany =
        companyFilter === 'all'
          ? true
          : Number(block.company_id) === Number(companyFilter)
      const name = String(block.name || '').toLowerCase()
      const companyName = String(block.company?.name || '').toLowerCase()
      const matchesQuery =
        !normalized || name.includes(normalized) || companyName.includes(normalized)
      return matchesStatus && matchesCompany && matchesQuery
    })
  }, [blocks, query, statusFilter, companyFilter])

  const sortedBlocks = useMemo(() => {
    const getValue = (block) => {
      switch (sortBy) {
        case 'name':
          return block.name || ''
        case 'company':
          return block.company?.name || ''
        case 'status':
          return block.is_active ? 'active' : 'inactive'
        default:
          return ''
      }
    }
    return [...filteredBlocks].sort((a, b) => {
      const aVal = String(getValue(a)).toLowerCase()
      const bVal = String(getValue(b)).toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredBlocks, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredBlocks.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pagedBlocks = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return sortedBlocks.slice(start, start + rowsPerPage)
  }, [sortedBlocks, rowsPerPage, safePage])

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(key)
    setSortDir('asc')
  }

  const openCreate = () => {
    setFormData({
      name: '',
      company_id: companies?.[0]?.id || '',
      is_active: true,
    })
    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
  }

  const openEdit = (block) => {
    setBlockId(block.id)
    setFormData({
      name: block.name || '',
      company_id: block.company_id || '',
      is_active: Boolean(block.is_active),
    })
    setIsEditOpen(true)
  }

  const closeEdit = () => {
    setIsEditOpen(false)
    setBlockId(null)
  }

  const openView = async (block) => {
    setViewBlock(block)
    setIsViewOpen(true)
    try {
      const data = await fetchCompanyBlockById({
        tokenType,
        accessToken,
        blockId: block.id,
        companyId: block.company_id,
      })
      setViewBlock(data)
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo cargar el detalle del bloque.',
        severity: 'error',
      })
    }
  }

  const closeView = () => {
    setIsViewOpen(false)
    setViewBlock(null)
  }

  const openDelete = (block) => {
    setBlockId(block.id)
    setViewBlock(block)
    setIsDeleteOpen(true)
  }

  const closeDelete = () => {
    setIsDeleteOpen(false)
    setBlockId(null)
    setViewBlock(null)
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
    if (!formData.company_id) {
      setToast({
        open: true,
        message: 'Selecciona una empresa.',
        severity: 'error',
      })
      return
    }
    setIsCreateLoading(true)
    closeCreate()
    try {
      await createCompanyBlock({
        tokenType,
        accessToken,
        payload: {
          name: formData.name.trim(),
          company_id: Number(formData.company_id),
          is_active: formData.is_active,
        },
      })
      if (onBlockChanged) {
        await onBlockChanged()
      }
      setToast({
        open: true,
        message: 'Bloque creado correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo crear el bloque.',
        severity: 'error',
      })
    } finally {
      setIsCreateLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!blockId) return
    if (!formData.name.trim()) {
      setToast({
        open: true,
        message: 'El nombre es obligatorio.',
        severity: 'error',
      })
      return
    }
    if (!formData.company_id) {
      setToast({
        open: true,
        message: 'Selecciona una empresa.',
        severity: 'error',
      })
      return
    }
    setIsUpdateLoading(true)
    closeEdit()
    try {
      await updateCompanyBlock({
        tokenType,
        accessToken,
        blockId,
        payload: {
          name: formData.name.trim(),
          company_id: Number(formData.company_id),
          is_active: formData.is_active,
        },
      })
      if (onBlockChanged) {
        await onBlockChanged()
      }
      setToast({
        open: true,
        message: 'Bloque actualizado correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo actualizar el bloque.',
        severity: 'error',
      })
    } finally {
      setIsUpdateLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!blockId) return
    setIsSaving(true)
    try {
      await deleteCompanyBlock({ tokenType, accessToken, blockId })
      if (onBlockChanged) {
        await onBlockChanged()
      }
      setToast({
        open: true,
        message: 'Bloque eliminado correctamente.',
        severity: 'success',
      })
      closeDelete()
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar el bloque.',
        severity: 'error',
      })
      closeDelete()
    } finally {
      setIsSaving(false)
    }
  }

  const renderStatusBadge = (isActive) => {
    const colors = isActive
      ? { fg: '#166534', bg: '#dcfce7' }
      : { fg: '#991b1b', bg: '#fee2e2' }
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
          Listado de bloques
        </Typography>
        <Button
          type="button"
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={openCreate}
          sx={{ height: 40 }}
        >
          Nuevo bloque
        </Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre o empresa"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          sx={{ minWidth: 260, flex: '1 1 260px' }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="block-company-filter">Empresa</InputLabel>
          <Select
            labelId="block-company-filter"
            value={companyFilter}
            label="Empresa"
            onChange={(event) => {
              setCompanyFilter(event.target.value)
              setPage(1)
            }}
          >
            <MenuItem value="all">Todas</MenuItem>
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="block-status-filter">Estado</InputLabel>
          <Select
            labelId="block-status-filter"
            value={statusFilter}
            label="Estado"
            onChange={(event) => {
              setStatusFilter(event.target.value)
              setPage(1)
            }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="active">Activo</MenuItem>
            <MenuItem value="inactive">Inactivo</MenuItem>
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
          label={`${filteredBlocks.length} resultados`}
          size="small"
          sx={{ backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: 600 }}
        />
      </Box>
      {blocksError ? (
        <Typography className="error" component="p">
          {blocksError}
        </Typography>
      ) : null}
      {!blocksError && !isBlocksLoading && filteredBlocks.length === 0 ? (
        <Typography className="meta" component="p">
          No hay bloques para mostrar.
        </Typography>
      ) : null}
      {!blocksError && filteredBlocks.length > 0 ? (
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
                    active={sortBy === 'company'}
                    direction={sortBy === 'company' ? sortDir : 'asc'}
                    onClick={() => handleSort('company')}
                  >
                    Empresa
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
              {pagedBlocks.map((block, index) => (
                <TableRow
                  key={block.id}
                  hover
                  sx={{
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                    '&:hover': {
                      backgroundColor: '#eef2ff',
                    },
                  }}
                >
                  <TableCell>{block.name}</TableCell>
                  <TableCell>{block.company?.name || '-'}</TableCell>
                  <TableCell align="center">
                    {renderStatusBadge(block.is_active)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        aria-label="Ver bloque"
                        onClick={() => openView(block)}
                        sx={{ color: '#64748b', '&:hover': { color: '#4338ca' } }}
                      >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Editar bloque"
                        onClick={() => openEdit(block)}
                        sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Eliminar bloque"
                        onClick={() => openDelete(block)}
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
      {!blocksError && filteredBlocks.length > 0 ? (
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
              <InputLabel id="blocks-rows-per-page">Filas</InputLabel>
              <Select
                labelId="blocks-rows-per-page"
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
      <Dialog open={isCreateOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo bloque</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField
            label="Nombre"
            value={formData.name}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <FormControl>
            <InputLabel id="block-company-label">Empresa</InputLabel>
            <Select
              labelId="block-company-label"
              label="Empresa"
              value={formData.company_id}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, company_id: event.target.value }))
              }
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="block-status-label">Estado</InputLabel>
            <Select
              labelId="block-status-label"
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
        <DialogTitle>Editar bloque</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField
            label="Nombre"
            value={formData.name}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <FormControl>
            <InputLabel id="block-company-edit">Empresa</InputLabel>
            <Select
              labelId="block-company-edit"
              label="Empresa"
              value={formData.company_id}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, company_id: event.target.value }))
              }
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="block-status-edit">Estado</InputLabel>
            <Select
              labelId="block-status-edit"
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
        <DialogTitle>Detalle de bloque</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Nombre
          </Typography>
          <Typography>{viewBlock?.name || '-'}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Empresa
          </Typography>
          <Typography>{viewBlock?.company?.name || '-'}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Estado
          </Typography>
          {viewBlock?.is_active === undefined ? '-' : renderStatusBadge(viewBlock.is_active)}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeView}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isDeleteOpen} onClose={closeDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar eliminacion</DialogTitle>
        <DialogContent>
          <Typography>
            {viewBlock ? `Vas a eliminar ${viewBlock.name}.` : 'Vas a eliminar este bloque.'}
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
        <DialogTitle>Guardando bloque...</DialogTitle>
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
        <DialogTitle>Actualizando bloque...</DialogTitle>
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

export default CompanyBlocksTable
