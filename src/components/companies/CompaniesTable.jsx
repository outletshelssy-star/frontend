import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Add } from '@mui/icons-material'
import { Alert, Box, Button, Snackbar, Typography } from '@mui/material'
import { useCompaniesQuery } from '../../hooks/useCompaniesQuery'
import { createCompany, deleteCompany, fetchCompanyById, updateCompany } from '../../services/api'
import { useAuthStore } from '../../store/useAuthStore'
import { getStoredFilterValue } from '../../utils/storage'
import { CompaniesDataTable } from './CompaniesDataTable'
import { CompaniesFilters } from './CompaniesFilters'
import {
  CompanyDeleteDialog,
  CompanyFormDialog,
  CompanyProgressDialog,
  CompanyViewDialog,
} from './CompanyDialogs'

const DEFAULT_FORM_DATA = {
  name: '',
  company_type: 'client',
  is_active: true,
}

const CompaniesTable = () => {
  const { tokenType, accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const {
    data: companies = [],
    isLoading: isCompaniesLoading,
    error: companiesError,
  } = useCompaniesQuery()
  const [query, setQuery] = useState(() => getStoredFilterValue('companies.filters.query', ''))
  const [typeFilter, setTypeFilter] = useState(() =>
    getStoredFilterValue('companies.filters.type', 'all'),
  )
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)
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
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA)
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const createCompanyMutation = useMutation({
    mutationFn: (payload) => createCompany({ tokenType, accessToken, payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  })

  const updateCompanyMutation = useMutation({
    mutationFn: ({ companyId, payload }) =>
      updateCompany({ tokenType, accessToken, companyId, payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  })

  const deleteCompanyMutation = useMutation({
    mutationFn: (companyId) => deleteCompany({ tokenType, accessToken, companyId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  })

  const hasActiveFilters = query.trim().length > 0 || typeFilter !== 'all'

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('companies.filters.query', JSON.stringify(query))
  }, [query])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('companies.filters.type', JSON.stringify(typeFilter))
  }, [typeFilter])

  const filteredCompanies = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return companies.filter((company) => {
      const matchesType = typeFilter === 'all' ? true : company.company_type === typeFilter
      const name = String(company.name || '').toLowerCase()
      const type = String(company.company_type || '').toLowerCase()
      const matchesQuery = !normalized || name.includes(normalized) || type.includes(normalized)
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

  const handleFormDataChange = (changes) => {
    setFormData((prev) => ({ ...prev, ...changes }))
  }

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
    setTypeFilter('all')
    setPage(1)
  }

  const openCreate = () => {
    setFormData(DEFAULT_FORM_DATA)
    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
  }

  const openEdit = (company) => {
    if (!company) return
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
      await createCompanyMutation.mutateAsync({
        payload: {
          name: formData.name.trim(),
          company_type: formData.company_type,
          is_active: true,
        },
      })
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
      await updateCompanyMutation.mutateAsync({
        companyId,
        payload: {
          name: formData.name.trim(),
          company_type: formData.company_type,
          is_active: formData.is_active,
        },
      })
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
      await deleteCompanyMutation.mutateAsync(companyId)
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
            Empresas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Gestiona las empresas registradas en el sistema
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
          Nueva empresa
        </Button>
      </Box>

      <CompaniesFilters
        query={query}
        typeFilter={typeFilter}
        hasActiveFilters={hasActiveFilters}
        filteredCount={filteredCompanies.length}
        onQueryChange={(value) => {
          setQuery(value)
          setPage(1)
        }}
        onTypeFilterChange={(value) => {
          setTypeFilter(value)
          setPage(1)
        }}
        onClearFilters={handleClearFilters}
      />

      <CompaniesDataTable
        companiesError={companiesError}
        isLoading={isCompaniesLoading}
        filteredCount={filteredCompanies.length}
        pagedCompanies={pagedCompanies}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        safePage={safePage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size)
          setPage(1)
        }}
        onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        onView={openView}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <CompanyFormDialog
        open={isCreateOpen}
        title="Nueva empresa"
        formData={formData}
        onChange={handleFormDataChange}
        onClose={closeCreate}
        onSubmit={handleCreate}
        isLoading={isCreateLoading}
        submitLabel="Guardar"
      />

      <CompanyFormDialog
        open={isEditOpen}
        title="Editar empresa"
        formData={formData}
        onChange={handleFormDataChange}
        onClose={closeEdit}
        onSubmit={handleUpdate}
        isLoading={isUpdateLoading}
        submitLabel="Guardar cambios"
        showStatusToggle
      />

      <CompanyViewDialog
        open={isViewOpen}
        company={viewCompany}
        onClose={closeView}
        onEdit={() => {
          closeView()
          openEdit(viewCompany)
        }}
      />

      <CompanyDeleteDialog
        open={isDeleteOpen}
        company={viewCompany}
        isSaving={isSaving}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />

      <CompanyProgressDialog open={isCreateLoading} title="Guardando empresa..." />
      <CompanyProgressDialog open={isUpdateLoading} title="Actualizando empresa..." />

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
