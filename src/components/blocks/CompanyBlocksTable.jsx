import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoredFilterValue } from '../../utils/storage'
import { Add } from '@mui/icons-material'
import { Alert, Box, Button, Snackbar, Typography } from '@mui/material'
import {
  createCompanyBlock,
  deleteCompanyBlock,
  fetchCompanyBlockById,
  updateCompanyBlock,
} from '../../services/api'
import { useCompanyBlocksQuery } from '../../hooks/useCompanyBlocksQuery'
import { useAuthStore } from '../../store/useAuthStore'
import { BlocksDataTable } from './BlocksDataTable'
import { BlocksFilters } from './BlocksFilters'
import {
  BlockDeleteDialog,
  BlockFormDialog,
  BlockProgressDialog,
  BlockViewDialog,
} from './BlockDialogs'

const BLOCK_FORM_INITIAL_STATE = {
  name: '',
  company_id: '',
  is_active: true,
}

const BLOCK_FORM_FIELD_ERRORS_INITIAL_STATE = {
  name: '',
  company_id: '',
}

const CompanyBlocksTable = ({ companies }) => {
  const { tokenType, accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const {
    data: blocks = [],
    isLoading: isBlocksLoading,
    error: blocksError,
  } = useCompanyBlocksQuery()
  const [query, setQuery] = useState(() => getStoredFilterValue('blocks.filters.query', ''))
  const [statusFilter, setStatusFilter] = useState(() =>
    getStoredFilterValue('blocks.filters.status', 'active'),
  )
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [isUpdateLoading, setIsUpdateLoading] = useState(false)
  const [blockId, setBlockId] = useState(null)
  const [viewBlock, setViewBlock] = useState(null)
  const [formData, setFormData] = useState(BLOCK_FORM_INITIAL_STATE)
  const [createFieldErrors, setCreateFieldErrors] = useState(BLOCK_FORM_FIELD_ERRORS_INITIAL_STATE)
  const [createFocusField, setCreateFocusField] = useState('')
  const [editFieldErrors, setEditFieldErrors] = useState(BLOCK_FORM_FIELD_ERRORS_INITIAL_STATE)
  const [editFocusField, setEditFocusField] = useState('')
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })
  const blocksErrorMessage =
    blocksError?.detail || blocksError?.message || 'No se pudieron cargar los bloques.'

  const createBlockMutation = useMutation({
    mutationFn: (payload) => createCompanyBlock({ tokenType, accessToken, payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-blocks'] }),
  })

  const updateBlockMutation = useMutation({
    mutationFn: ({ blockId, payload }) =>
      updateCompanyBlock({ tokenType, accessToken, blockId, payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-blocks'] }),
  })

  const deleteBlockMutation = useMutation({
    mutationFn: (blockId) => deleteCompanyBlock({ tokenType, accessToken, blockId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-blocks'] }),
  })

  const hasActiveFilters = query.trim().length > 0 || statusFilter !== 'all'

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('blocks.filters.query', JSON.stringify(query))
  }, [query])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('blocks.filters.status', JSON.stringify(statusFilter))
  }, [statusFilter])

  const filteredBlocks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return blocks.filter((block) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? block.is_active
            : !block.is_active
      const name = String(block.name || '').toLowerCase()
      const companyName = String(block.company?.name || '').toLowerCase()
      const matchesQuery =
        !normalized || name.includes(normalized) || companyName.includes(normalized)
      return matchesStatus && matchesQuery
    })
  }, [blocks, query, statusFilter])

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

  const handleClearFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setPage(1)
  }

  const handleFormDataChange = (changes) => {
    setFormData((prev) => ({ ...prev, ...changes }))
    if (isFormOpen && formMode === 'create') {
      setCreateFieldErrors((prev) => {
        const next = { ...prev }
        if (Object.prototype.hasOwnProperty.call(changes, 'name')) {
          next.name = ''
        }
        if (Object.prototype.hasOwnProperty.call(changes, 'company_id')) {
          next.company_id = ''
        }
        return next
      })
      setCreateFocusField('')
    }
    if (isFormOpen && formMode === 'edit') {
      setEditFieldErrors((prev) => {
        const next = { ...prev }
        if (Object.prototype.hasOwnProperty.call(changes, 'name')) {
          next.name = ''
        }
        if (Object.prototype.hasOwnProperty.call(changes, 'company_id')) {
          next.company_id = ''
        }
        return next
      })
      setEditFocusField('')
    }
  }

  const openCreate = () => {
    setFormMode('create')
    setFormData({
      ...BLOCK_FORM_INITIAL_STATE,
      company_id: companies?.[0]?.id || '',
    })
    setCreateFieldErrors(BLOCK_FORM_FIELD_ERRORS_INITIAL_STATE)
    setCreateFocusField('')
    setIsFormOpen(true)
  }

  const openEdit = (block) => {
    if (!block) return
    setFormMode('edit')
    setBlockId(block.id)
    setFormData({
      name: block.name || '',
      company_id: block.company_id || '',
      is_active: Boolean(block.is_active),
    })
    setEditFieldErrors(BLOCK_FORM_FIELD_ERRORS_INITIAL_STATE)
    setEditFocusField('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    if (formMode === 'edit') {
      setBlockId(null)
      setEditFieldErrors(BLOCK_FORM_FIELD_ERRORS_INITIAL_STATE)
      setEditFocusField('')
      return
    }
    setCreateFieldErrors(BLOCK_FORM_FIELD_ERRORS_INITIAL_STATE)
    setCreateFocusField('')
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
    const nextFieldErrors = {
      name: '',
      company_id: '',
    }
    if (!formData.name.trim()) {
      nextFieldErrors.name = 'El nombre es obligatorio.'
    }
    if (!formData.company_id) {
      nextFieldErrors.company_id = 'Selecciona una empresa.'
    }
    setCreateFieldErrors(nextFieldErrors)
    const firstFieldWithError = ['name', 'company_id'].find((field) => nextFieldErrors[field])
    if (firstFieldWithError) {
      setCreateFocusField(firstFieldWithError)
      return
    }
    setCreateFocusField('')
    setIsCreateLoading(true)
    closeForm()
    try {
      await createBlockMutation.mutateAsync({
        payload: {
          name: formData.name.trim(),
          company_id: Number(formData.company_id),
          is_active: true,
        },
      })
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
    const nextFieldErrors = {
      name: '',
      company_id: '',
    }
    if (!formData.name.trim()) {
      nextFieldErrors.name = 'El nombre es obligatorio.'
    }
    if (!formData.company_id) {
      nextFieldErrors.company_id = 'Selecciona una empresa.'
    }
    setEditFieldErrors(nextFieldErrors)
    const firstFieldWithError = ['name', 'company_id'].find((field) => nextFieldErrors[field])
    if (firstFieldWithError) {
      setEditFocusField(firstFieldWithError)
      return
    }
    setEditFocusField('')
    setIsUpdateLoading(true)
    closeForm()
    try {
      await updateBlockMutation.mutateAsync({
        blockId,
        payload: {
          name: formData.name.trim(),
          company_id: Number(formData.company_id),
          is_active: formData.is_active,
        },
      })
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
      await deleteBlockMutation.mutateAsync(blockId)
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

  const isCreateMode = formMode === 'create'
  const activeFieldErrors = isCreateMode ? createFieldErrors : editFieldErrors
  const activeFocusField = isCreateMode ? createFocusField : editFocusField
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
          borderBottom: '2px solid rgba(227, 28, 121, 0.15)',
        }}
      >
        <Box>
          <Typography
            component="h2"
            variant="h5"
            sx={{ fontWeight: 700, color: 'secondary.dark', lineHeight: 1.2 }}
          >
            Bloques
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Gestiona los bloques por empresa
          </Typography>
        </Box>
        <Button
          type="button"
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={openCreate}
          sx={{ height: 40, borderRadius: 2, fontWeight: 600 }}
        >
          Nuevo bloque
        </Button>
      </Box>

      <BlocksFilters
        query={query}
        statusFilter={statusFilter}
        hasActiveFilters={hasActiveFilters}
        filteredCount={filteredBlocks.length}
        onQueryChange={(value) => {
          setQuery(value)
          setPage(1)
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setPage(1)
        }}
        onClearFilters={handleClearFilters}
      />

      <BlocksDataTable
        blocksError={blocksError}
        blocksErrorMessage={blocksErrorMessage}
        isBlocksLoading={isBlocksLoading}
        filteredCount={filteredBlocks.length}
        pagedBlocks={pagedBlocks}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        onView={openView}
        onEdit={openEdit}
        onDelete={openDelete}
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

      <BlockFormDialog
        open={isFormOpen}
        title={isCreateMode ? 'Nuevo bloque' : 'Editar bloque'}
        formData={formData}
        companies={companies}
        onChange={handleFormDataChange}
        onClose={closeForm}
        onSubmit={isCreateMode ? handleCreate : handleUpdate}
        submitLabel={isCreateMode ? 'Guardar' : 'Guardar cambios'}
        isLoading={isFormLoading}
        showStatus={!isCreateMode}
        companyLabelId={isCreateMode ? 'block-company-label' : 'block-company-edit'}
        fieldErrors={activeFieldErrors}
        focusField={activeFocusField}
        onFocusHandled={
          isCreateMode ? () => setCreateFocusField('') : () => setEditFocusField('')
        }
      />

      <BlockViewDialog
        open={isViewOpen}
        viewBlock={viewBlock}
        onClose={closeView}
        onEdit={() => {
          closeView()
          openEdit(viewBlock)
        }}
      />

      <BlockDeleteDialog
        open={isDeleteOpen}
        viewBlock={viewBlock}
        isSaving={isSaving}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />

      <BlockProgressDialog
        open={isCreateLoading || isUpdateLoading}
        title={isCreateLoading ? 'Guardando bloque...' : 'Actualizando bloque...'}
      />

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
