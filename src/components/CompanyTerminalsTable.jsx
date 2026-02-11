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
  createCompanyTerminal,
  deleteCompanyTerminal,
  fetchCompanyTerminalById,
  updateCompanyTerminal,
} from '../services/api'

const CompanyTerminalsTable = ({
  terminals,
  terminalsError,
  isTerminalsLoading,
  companies,
  blocks,
  tokenType,
  accessToken,
  onTerminalChanged,
}) => {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
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
  const [terminalId, setTerminalId] = useState(null)
  const [viewTerminal, setViewTerminal] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    block_id: '',
    owner_company_id: '',
    admin_company_id: '',
    is_active: true,
  })
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const hasActiveFilters =
    query.trim().length > 0 || statusFilter !== 'all' || ownerFilter !== 'all'

  const handleClearFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setOwnerFilter('all')
    setPage(1)
  }

  const filteredTerminals = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return terminals.filter((terminal) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? terminal.is_active
          : !terminal.is_active
      const matchesOwner =
        ownerFilter === 'all'
          ? true
          : Number(terminal.owner_company_id) === Number(ownerFilter)
      const name = String(terminal.name || '').toLowerCase()
      const blockName = String(terminal.block?.name || '').toLowerCase()
      const ownerName = String(terminal.owner_company?.name || '').toLowerCase()
      const adminName = String(terminal.admin_company?.name || '').toLowerCase()
      const matchesQuery =
        !normalized ||
        name.includes(normalized) ||
        blockName.includes(normalized) ||
        ownerName.includes(normalized) ||
        adminName.includes(normalized)
      return matchesStatus && matchesOwner && matchesQuery
    })
  }, [terminals, query, statusFilter, ownerFilter])

  const sortedTerminals = useMemo(() => {
    const getValue = (terminal) => {
      switch (sortBy) {
        case 'name':
          return terminal.name || ''
        case 'block':
          return terminal.block?.name || ''
        case 'owner':
          return terminal.owner_company?.name || ''
        case 'admin':
          return terminal.admin_company?.name || ''
        case 'status':
          return terminal.is_active ? 'active' : 'inactive'
        default:
          return ''
      }
    }
    return [...filteredTerminals].sort((a, b) => {
      const aVal = String(getValue(a)).toLowerCase()
      const bVal = String(getValue(b)).toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredTerminals, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredTerminals.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pagedTerminals = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return sortedTerminals.slice(start, start + rowsPerPage)
  }, [sortedTerminals, rowsPerPage, safePage])

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
      block_id: blocks?.[0]?.id || '',
      owner_company_id: companies?.[0]?.id || '',
      admin_company_id: companies?.[0]?.id || '',
      is_active: true,
    })
    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
  }

  const openEdit = (terminal) => {
    setTerminalId(terminal.id)
    setFormData({
      name: terminal.name || '',
      block_id: terminal.block_id || '',
      owner_company_id: terminal.owner_company_id || '',
      admin_company_id: terminal.admin_company_id || '',
      is_active: Boolean(terminal.is_active),
    })
    setIsEditOpen(true)
  }

  const closeEdit = () => {
    setIsEditOpen(false)
    setTerminalId(null)
  }

  const openView = async (terminal) => {
    setViewTerminal(terminal)
    setIsViewOpen(true)
    try {
      const data = await fetchCompanyTerminalById({
        tokenType,
        accessToken,
        terminalId: terminal.id,
        ownerCompanyId: terminal.owner_company_id,
      })
      setViewTerminal(data)
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo cargar el detalle del terminal.',
        severity: 'error',
      })
    }
  }

  const closeView = () => {
    setIsViewOpen(false)
    setViewTerminal(null)
  }

  const openDelete = (terminal) => {
    setTerminalId(terminal.id)
    setViewTerminal(terminal)
    setIsDeleteOpen(true)
  }

  const closeDelete = () => {
    setIsDeleteOpen(false)
    setTerminalId(null)
    setViewTerminal(null)
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
    if (!formData.block_id || !formData.owner_company_id || !formData.admin_company_id) {
      setToast({
        open: true,
        message: 'Selecciona bloque, empresa propietaria y empresa admin.',
        severity: 'error',
      })
      return
    }
    setIsCreateLoading(true)
    closeCreate()
    try {
      await createCompanyTerminal({
        tokenType,
        accessToken,
        payload: {
          name: formData.name.trim(),
          block_id: Number(formData.block_id),
          owner_company_id: Number(formData.owner_company_id),
          admin_company_id: Number(formData.admin_company_id),
          is_active: formData.is_active,
        },
      })
      if (onTerminalChanged) {
        await onTerminalChanged()
      }
      setToast({
        open: true,
        message: 'Terminal creado correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo crear el terminal.',
        severity: 'error',
      })
    } finally {
      setIsCreateLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!terminalId) return
    if (!formData.name.trim()) {
      setToast({
        open: true,
        message: 'El nombre es obligatorio.',
        severity: 'error',
      })
      return
    }
    if (!formData.block_id || !formData.owner_company_id || !formData.admin_company_id) {
      setToast({
        open: true,
        message: 'Selecciona bloque, empresa propietaria y empresa admin.',
        severity: 'error',
      })
      return
    }
    setIsUpdateLoading(true)
    closeEdit()
    try {
      await updateCompanyTerminal({
        tokenType,
        accessToken,
        terminalId,
        payload: {
          name: formData.name.trim(),
          block_id: Number(formData.block_id),
          owner_company_id: Number(formData.owner_company_id),
          admin_company_id: Number(formData.admin_company_id),
          is_active: formData.is_active,
        },
      })
      if (onTerminalChanged) {
        await onTerminalChanged()
      }
      setToast({
        open: true,
        message: 'Terminal actualizado correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo actualizar el terminal.',
        severity: 'error',
      })
    } finally {
      setIsUpdateLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!terminalId) return
    setIsSaving(true)
    try {
      await deleteCompanyTerminal({ tokenType, accessToken, terminalId })
      if (onTerminalChanged) {
        await onTerminalChanged()
      }
      setToast({
        open: true,
        message: 'Terminal eliminado correctamente.',
        severity: 'success',
      })
      closeDelete()
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar el terminal.',
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
          Listado de terminales
        </Typography>
        <Button
          type="button"
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={openCreate}
          sx={{ height: 40 }}
        >
          Nuevo terminal
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
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="terminal-owner-filter">Empresa Propietaria</InputLabel>
          <Select
            labelId="terminal-owner-filter"
            value={ownerFilter}
            label="Empresa Propietaria"
            onChange={(event) => {
              setOwnerFilter(event.target.value)
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
          <InputLabel id="terminal-status-filter">Estado</InputLabel>
          <Select
            labelId="terminal-status-filter"
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
          label={`${filteredTerminals.length} resultados`}
          size="small"
          sx={{ backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: 600 }}
        />
      </Box>
      {terminalsError ? (
        <Typography className="error" component="p">
          {terminalsError}
        </Typography>
      ) : null}
      {!terminalsError && !isTerminalsLoading && filteredTerminals.length === 0 ? (
        <Typography className="meta" component="p">
          No hay terminales para mostrar.
        </Typography>
      ) : null}
      {!terminalsError && filteredTerminals.length > 0 ? (
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
                    active={sortBy === 'block'}
                    direction={sortBy === 'block' ? sortDir : 'asc'}
                    onClick={() => handleSort('block')}
                  >
                    Bloque
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left">
                  <TableSortLabel
                    active={sortBy === 'owner'}
                    direction={sortBy === 'owner' ? sortDir : 'asc'}
                    onClick={() => handleSort('owner')}
                  >
                    Empresa Propietaria
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left">
                  <TableSortLabel
                    active={sortBy === 'admin'}
                    direction={sortBy === 'admin' ? sortDir : 'asc'}
                    onClick={() => handleSort('admin')}
                  >
                    Empresa Administradora
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
              {pagedTerminals.map((terminal, index) => (
                <TableRow
                  key={terminal.id}
                  hover
                  sx={{
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                    '&:hover': {
                      backgroundColor: '#eef2ff',
                    },
                  }}
                >
                  <TableCell>{terminal.name}</TableCell>
                  <TableCell>{terminal.block?.name || '-'}</TableCell>
                  <TableCell>{terminal.owner_company?.name || '-'}</TableCell>
                  <TableCell>{terminal.admin_company?.name || '-'}</TableCell>
                  <TableCell align="center">
                    {renderStatusBadge(terminal.is_active)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        aria-label="Ver terminal"
                        onClick={() => openView(terminal)}
                        sx={{ color: '#64748b', '&:hover': { color: '#4338ca' } }}
                      >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Editar terminal"
                        onClick={() => openEdit(terminal)}
                        sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Eliminar terminal"
                        onClick={() => openDelete(terminal)}
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
      {!terminalsError && filteredTerminals.length > 0 ? (
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
              <InputLabel id="terminals-rows-per-page">Filas</InputLabel>
              <Select
                labelId="terminals-rows-per-page"
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
        <DialogTitle>Nuevo terminal</DialogTitle>
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
            <InputLabel id="terminal-block-label">Bloque</InputLabel>
            <Select
              labelId="terminal-block-label"
              label="Bloque"
              value={formData.block_id}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, block_id: event.target.value }))
              }
            >
              {blocks.map((block) => (
                <MenuItem key={block.id} value={block.id}>
                  {block.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="terminal-owner-label">Empresa Propietaria</InputLabel>
            <Select
              labelId="terminal-owner-label"
              label="Empresa Propietaria"
              value={formData.owner_company_id}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  owner_company_id: event.target.value,
                }))
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
            <InputLabel id="terminal-admin-label">Empresa admin</InputLabel>
            <Select
              labelId="terminal-admin-label"
              label="Empresa admin"
              value={formData.admin_company_id}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  admin_company_id: event.target.value,
                }))
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
            <InputLabel id="terminal-status-label">Estado</InputLabel>
            <Select
              labelId="terminal-status-label"
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
        <DialogTitle>Editar terminal</DialogTitle>
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
            <InputLabel id="terminal-block-edit">Bloque</InputLabel>
            <Select
              labelId="terminal-block-edit"
              label="Bloque"
              value={formData.block_id}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, block_id: event.target.value }))
              }
            >
              {blocks.map((block) => (
                <MenuItem key={block.id} value={block.id}>
                  {block.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel id="terminal-owner-edit">Empresa Propietaria</InputLabel>
            <Select
              labelId="terminal-owner-edit"
              label="Empresa Propietaria"
              value={formData.owner_company_id}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  owner_company_id: event.target.value,
                }))
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
            <InputLabel id="terminal-admin-edit">Empresa admin</InputLabel>
            <Select
              labelId="terminal-admin-edit"
              label="Empresa admin"
              value={formData.admin_company_id}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  admin_company_id: event.target.value,
                }))
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
            <InputLabel id="terminal-status-edit">Estado</InputLabel>
            <Select
              labelId="terminal-status-edit"
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
        <DialogTitle>Detalle de terminal</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Nombre
          </Typography>
          <Typography>{viewTerminal?.name || '-'}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Bloque
          </Typography>
          <Typography>{viewTerminal?.block?.name || '-'}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Empresa Propietaria
          </Typography>
          <Typography>{viewTerminal?.owner_company?.name || '-'}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Empresa admin
          </Typography>
          <Typography>{viewTerminal?.admin_company?.name || '-'}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Estado
          </Typography>
          {viewTerminal?.is_active === undefined
            ? '-'
            : renderStatusBadge(viewTerminal.is_active)}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeView}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isDeleteOpen} onClose={closeDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar eliminacion</DialogTitle>
        <DialogContent>
          <Typography>
            {viewTerminal
              ? `Vas a eliminar ${viewTerminal.name}.`
              : 'Vas a eliminar este terminal.'}
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
        <DialogTitle>Guardando terminal...</DialogTitle>
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
        <DialogTitle>Actualizando terminal...</DialogTitle>
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

export default CompanyTerminalsTable
