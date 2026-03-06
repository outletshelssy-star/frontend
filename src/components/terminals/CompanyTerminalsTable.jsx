import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoredFilterValue } from '../../utils/storage'
import { Add } from '@mui/icons-material'
import { Alert, Box, Button, Snackbar, Typography } from '@mui/material'
import {
  createCompanyTerminal,
  deleteCompanyTerminal,
  fetchCompanyTerminalById,
  updateCompanyTerminal,
  fetchExternalAnalysisTypes,
  fetchExternalAnalysesByTerminal,
  upsertExternalAnalysisTerminal,
  fetchTerminalProducts,
  updateTerminalProducts,
} from '../../services/api'
import { useAuthStore } from '../../store/useAuthStore'
import {
  TerminalDeleteDialog,
  TerminalFormDialog,
  TerminalProgressDialog,
  TerminalViewDialog,
} from './TerminalDialogs'
import { TerminalsDataTable } from './TerminalsDataTable'
import { TerminalsFilters } from './TerminalsFilters'
import { formatTerminalDate } from './terminalUtils'

const TERMINAL_FORM_INITIAL_STATE = {
  name: '',
  block_id: '',
  owner_company_id: '',
  admin_company_id: '',
  terminal_code: '',
  is_active: true,
  has_lab: true,
  lab_terminal_id: '',
}

const TERMINAL_TEXT_FIELD_ERRORS_INITIAL_STATE = {
  name: '',
  terminal_code: '',
}

const DEFAULT_PRODUCT_TYPE = 'crudo'
const PRODUCT_TYPE_LABELS = {
  crudo: 'Crudo',
  gasolina: 'Gasolina',
  diesel: 'Diesel',
}

const normalizeTerminalProducts = (value) => {
  const items = Array.isArray(value) ? value : []
  const normalized = items
    .map((item) => {
      if (typeof item === 'string') {
        const productType = String(item || '').trim().toLowerCase()
        if (!productType) return null
        return {
          name: PRODUCT_TYPE_LABELS[productType] || productType,
          product_type: productType,
        }
      }
      const productType = String(item?.product_type || '').trim().toLowerCase()
      const name = String(item?.name || '').trim()
      if (!name && !productType) return null
      return {
        name: name || PRODUCT_TYPE_LABELS[productType] || productType,
        product_type: productType || DEFAULT_PRODUCT_TYPE,
      }
    })
    .filter(Boolean)
  const seen = new Set()
  return normalized.filter((item) => {
    const key = `${String(item.name || '').toLowerCase()}::${item.product_type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const sanitizeProductsForPayload = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) => {
      if (typeof item === 'string') {
        const productType = String(item || '').trim().toLowerCase()
        if (!productType) return null
        return {
          name: PRODUCT_TYPE_LABELS[productType] || productType,
          product_type: productType,
        }
      }
      return {
        name: String(item?.name || '').trim(),
        product_type: String(item?.product_type || DEFAULT_PRODUCT_TYPE).trim().toLowerCase(),
      }
    })
    .filter((item) => item && item.name.length > 0)
    .filter((item, index, list) => {
      const key = `${item.name.toLowerCase()}::${item.product_type}`
      return list.findIndex((candidate) => `${candidate.name.toLowerCase()}::${candidate.product_type}` === key) === index
    })

const getInvalidProductNameIndexes = (products) =>
  (Array.isArray(products) ? products : []).reduce((indexes, item, index) => {
    if (typeof item === 'string') return indexes
    if (!String(item?.name || '').trim()) {
      indexes.push(index)
    }
    return indexes
  }, [])

const CompanyTerminalsTable = ({
  terminals,
  terminalsError,
  isTerminalsLoading,
  companies,
  blocks,
}) => {
  const { tokenType, accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState(() => getStoredFilterValue('terminals.filters.query', ''))
  const [statusFilter, setStatusFilter] = useState('active')
  const [ownerFilter, setOwnerFilter] = useState(() =>
    getStoredFilterValue('terminals.filters.owner', 'all'),
  )
  const [blockFilter, setBlockFilter] = useState(() =>
    getStoredFilterValue('terminals.filters.block', 'all'),
  )
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const isCreateOpen = isFormOpen && formMode === 'create'
  const isEditOpen = isFormOpen && formMode === 'edit'
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [isUpdateLoading, setIsUpdateLoading] = useState(false)
  const [terminalId, setTerminalId] = useState(null)
  const [viewTerminal, setViewTerminal] = useState(null)
  const [analysisTypes, setAnalysisTypes] = useState([])
  const [terminalAnalyses, setTerminalAnalyses] = useState([])
  const [selectedAnalysisIds, setSelectedAnalysisIds] = useState([])
  const [isAnalysesLoading, setIsAnalysesLoading] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showProductValidation, setShowProductValidation] = useState(false)
  const [terminalProducts, setTerminalProducts] = useState([])
  const [terminalProductsById, setTerminalProductsById] = useState({})
  const [formData, setFormData] = useState(TERMINAL_FORM_INITIAL_STATE)
  const [createFieldErrors, setCreateFieldErrors] = useState(
    TERMINAL_TEXT_FIELD_ERRORS_INITIAL_STATE,
  )
  const [editFieldErrors, setEditFieldErrors] = useState(
    TERMINAL_TEXT_FIELD_ERRORS_INITIAL_STATE,
  )
  const [createFocusField, setCreateFocusField] = useState('')
  const [editFocusField, setEditFocusField] = useState('')
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })
  const terminalsErrorMessage = terminalsError
    ? terminalsError?.detail ||
      terminalsError?.message ||
      String(terminalsError || '') ||
      'No se pudieron cargar los terminales.'
    : ''

  const createTerminalMutation = useMutation({
    mutationFn: (payload) => createCompanyTerminal({ tokenType, accessToken, payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-terminals'] }),
  })

  const updateTerminalMutation = useMutation({
    mutationFn: ({ terminalId, payload }) =>
      updateCompanyTerminal({ tokenType, accessToken, terminalId, payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-terminals'] }),
  })

  const deleteTerminalMutation = useMutation({
    mutationFn: (terminalId) => deleteCompanyTerminal({ tokenType, accessToken, terminalId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-terminals'] }),
  })

  const hasActiveFilters =
    query.trim().length > 0 ||
    statusFilter !== 'active' ||
    ownerFilter !== 'all' ||
    blockFilter !== 'all'

  const invalidProductNameIndexes = useMemo(
    () => getInvalidProductNameIndexes(selectedProducts),
    [selectedProducts],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('terminals.filters.query', JSON.stringify(query))
  }, [query])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('terminals.filters.status', JSON.stringify(statusFilter))
  }, [statusFilter])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('terminals.filters.owner', JSON.stringify(ownerFilter))
  }, [ownerFilter])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('terminals.filters.block', JSON.stringify(blockFilter))
  }, [blockFilter])

  const terminalsById = useMemo(() => {
    const map = new Map()
    if (Array.isArray(terminals)) {
      terminals.forEach((terminal) => {
        if (terminal?.id != null) {
          map.set(String(terminal.id), terminal)
        }
      })
    }
    return map
  }, [terminals])

  const labTerminalOptions = useMemo(() => {
    return (Array.isArray(terminals) ? terminals : []).filter(
      (terminal) =>
        terminal?.has_lab &&
        terminal?.is_active &&
        (terminal?.id == null || String(terminal.id) !== String(terminalId)),
    )
  }, [terminals, terminalId])

  const getLabLabel = useCallback((terminal) => {
    if (terminal?.has_lab) return 'Propio'
    const labId = terminal?.lab_terminal_id
    if (labId == null) return 'Sin laboratorio'
    const labTerminal = terminalsById.get(String(labId))
    return labTerminal ? `Usa: ${labTerminal.name}` : `Usa: ${labId}`
  }, [terminalsById])

  const handleClearFilters = () => {
    setQuery('')
    setStatusFilter('active')
    setOwnerFilter('all')
    setBlockFilter('all')
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
          : Number(terminal.owner_company_id) === Number(ownerFilter) ||
            Number(terminal.admin_company_id) === Number(ownerFilter)
      const matchesBlock =
        blockFilter === 'all'
          ? true
          : Number(terminal.block_id || terminal.block?.id) === Number(blockFilter)
      const name = String(terminal.name || '').toLowerCase()
      const blockName = String(terminal.block?.name || '').toLowerCase()
      const ownerName = String(terminal.owner_company?.name || '').toLowerCase()
      const adminName = String(terminal.admin_company?.name || '').toLowerCase()
      const labLabel = getLabLabel(terminal).toLowerCase()
      const matchesQuery =
        !normalized ||
        name.includes(normalized) ||
        blockName.includes(normalized) ||
        ownerName.includes(normalized) ||
        adminName.includes(normalized) ||
        labLabel.includes(normalized)
      return matchesStatus && matchesOwner && matchesBlock && matchesQuery
    })
  }, [terminals, query, statusFilter, ownerFilter, blockFilter, getLabLabel])

  const sortedTerminals = useMemo(() => {
    const getValue = (terminal) => {
      switch (sortBy) {
        case 'name':
          return terminal.name || ''
        case 'code':
          return terminal.terminal_code || ''
        case 'block':
          return terminal.block?.name || ''
        case 'owner':
          return terminal.owner_company?.name || ''
        case 'admin':
          return terminal.admin_company?.name || ''
        case 'lab':
          return getLabLabel(terminal)
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
  }, [filteredTerminals, sortBy, sortDir, getLabLabel])

  const totalPages = Math.max(1, Math.ceil(filteredTerminals.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pagedTerminals = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return sortedTerminals.slice(start, start + rowsPerPage)
  }, [sortedTerminals, rowsPerPage, safePage])

  const pagedTerminalIds = useMemo(
    () =>
      pagedTerminals
        .map((terminal) => String(terminal?.id || ''))
        .filter(Boolean),
    [pagedTerminals],
  )

  useEffect(() => {
    if (!pagedTerminalIds.length || !accessToken) return
    const missingIds = pagedTerminalIds.filter((terminalId) => terminalProductsById[terminalId] === undefined)
    if (missingIds.length === 0) return
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        missingIds.map(async (terminalId) => {
          try {
            const productsData = await fetchTerminalProducts({
              tokenType,
              accessToken,
              terminalId: Number(terminalId),
            })
            return [terminalId, normalizeTerminalProducts(productsData)]
          } catch {
            return [terminalId, []]
          }
        }),
      )
      if (cancelled) return
      setTerminalProductsById((prev) => {
        const next = { ...prev }
        entries.forEach(([terminalId, products]) => {
          next[terminalId] = products
        })
        return next
      })
    })()
    return () => {
      cancelled = true
    }
  }, [pagedTerminalIds, terminalProductsById, tokenType, accessToken])

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(key)
    setSortDir('asc')
  }

  const handleTerminalFormDataChange = useCallback(
    (changes) => {
      setFormData((prev) => ({ ...prev, ...changes }))
      if (!changes || typeof changes !== 'object') return
      const hasNameChange = Object.prototype.hasOwnProperty.call(changes, 'name')
      const hasTerminalCodeChange = Object.prototype.hasOwnProperty.call(changes, 'terminal_code')
      if (!hasNameChange && !hasTerminalCodeChange) return
      if (isEditOpen) {
        setEditFocusField('')
        setEditFieldErrors((prev) => ({
          ...prev,
          ...(hasNameChange ? { name: '' } : {}),
          ...(hasTerminalCodeChange ? { terminal_code: '' } : {}),
        }))
        return
      }
      setCreateFocusField('')
      setCreateFieldErrors((prev) => ({
        ...prev,
        ...(hasNameChange ? { name: '' } : {}),
        ...(hasTerminalCodeChange ? { terminal_code: '' } : {}),
      }))
    },
    [isEditOpen],
  )

  const openCreate = async () => {
    setFormMode('create')
    setCreateFieldErrors({ ...TERMINAL_TEXT_FIELD_ERRORS_INITIAL_STATE })
    setCreateFocusField('')
    setFormData({
      ...TERMINAL_FORM_INITIAL_STATE,
      block_id: blocks?.[0]?.id || '',
      owner_company_id: companies?.[0]?.id || '',
      admin_company_id: companies?.[0]?.id || '',
    })
    setSelectedAnalysisIds([])
    setSelectedProducts([])
    setShowProductValidation(false)
    if (analysisTypes.length === 0) {
      try {
        setIsAnalysesLoading(true)
        const data = await fetchExternalAnalysisTypes({ tokenType, accessToken })
        const types = Array.isArray(data?.items) ? data.items : []
        setAnalysisTypes(types)
      } catch (err) {
        setToast({
          open: true,
          message: err?.detail || 'No se pudieron cargar los analisis externos.',
          severity: 'error',
        })
      } finally {
        setIsAnalysesLoading(false)
      }
    }
    setIsFormOpen(true)
  }

  const openEdit = async (terminal) => {
    if (!terminal) return
    setFormMode('edit')
    setEditFieldErrors({ ...TERMINAL_TEXT_FIELD_ERRORS_INITIAL_STATE })
    setEditFocusField('')
    setTerminalId(terminal.id)
    setFormData({
      name: terminal.name || '',
      block_id: terminal.block_id || '',
      owner_company_id: terminal.owner_company_id || '',
      admin_company_id: terminal.admin_company_id || '',
      terminal_code: terminal.terminal_code || '',
      is_active: Boolean(terminal.is_active),
      has_lab: Boolean(terminal.has_lab),
      lab_terminal_id: terminal.lab_terminal_id ? String(terminal.lab_terminal_id) : '',
    })
    setShowProductValidation(false)
    try {
      setIsAnalysesLoading(true)
      const [typesData, analysesData, productsData] = await Promise.all([
        fetchExternalAnalysisTypes({ tokenType, accessToken }),
        fetchExternalAnalysesByTerminal({
          tokenType,
          accessToken,
          terminalId: terminal.id,
        }),
        fetchTerminalProducts({ tokenType, accessToken, terminalId: terminal.id }),
      ])
      const types = Array.isArray(typesData?.items) ? typesData.items : []
      const analyses = Array.isArray(analysesData?.items)
        ? analysesData.items.map((item) => ({ ...item }))
        : []
      setAnalysisTypes(types)
      setTerminalAnalyses(analyses)
      const activeIds = analyses
        .filter((item) => item.is_active !== false)
        .map((item) => String(item.analysis_type_id))
      setSelectedAnalysisIds(activeIds)
      setSelectedProducts(normalizeTerminalProducts(productsData))
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudieron cargar los analisis externos.',
        severity: 'error',
      })
    } finally {
      setIsAnalysesLoading(false)
    }
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setCreateFieldErrors({ ...TERMINAL_TEXT_FIELD_ERRORS_INITIAL_STATE })
    setEditFieldErrors({ ...TERMINAL_TEXT_FIELD_ERRORS_INITIAL_STATE })
    setCreateFocusField('')
    setEditFocusField('')
    setIsFormOpen(false)
    setTerminalId(null)
    setShowProductValidation(false)
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
      setIsAnalysesLoading(true)
      const [typesData, analysesData, productsData] = await Promise.all([
        fetchExternalAnalysisTypes({ tokenType, accessToken }),
        fetchExternalAnalysesByTerminal({
          tokenType,
          accessToken,
          terminalId: terminal.id,
        }),
        fetchTerminalProducts({ tokenType, accessToken, terminalId: terminal.id }),
      ])
      const types = Array.isArray(typesData?.items) ? typesData.items : []
      const analyses = Array.isArray(analysesData?.items)
        ? analysesData.items.map((item) => ({
            ...item,
          }))
        : []
      setAnalysisTypes(types)
      setTerminalAnalyses(analyses)
      setTerminalProducts(normalizeTerminalProducts(productsData))
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo cargar el detalle del terminal.',
        severity: 'error',
      })
    } finally {
      setIsAnalysesLoading(false)
    }
  }

  const closeView = () => {
    setIsViewOpen(false)
    setViewTerminal(null)
    setTerminalAnalyses([])
    setAnalysisTypes([])
    setTerminalProducts([])
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
    setShowProductValidation(true)
    const nextFieldErrors = { ...TERMINAL_TEXT_FIELD_ERRORS_INITIAL_STATE }
    let firstInvalidField = ''
    if (!formData.name.trim()) {
      nextFieldErrors.name = 'El nombre es obligatorio.'
      firstInvalidField = 'name'
    }
    if (!formData.terminal_code.trim()) {
      nextFieldErrors.terminal_code = 'El codigo del terminal es obligatorio.'
      if (!firstInvalidField) {
        firstInvalidField = 'terminal_code'
      }
    }
    setCreateFieldErrors(nextFieldErrors)
    if (firstInvalidField) {
      setCreateFocusField(firstInvalidField)
      return
    }
    setCreateFocusField('')
    if (!formData.block_id || !formData.owner_company_id || !formData.admin_company_id) {
      setToast({
        open: true,
        message: 'Selecciona bloque, empresa propietaria y empresa admin.',
        severity: 'error',
      })
      return
    }
    if (!formData.has_lab && !String(formData.lab_terminal_id || '').trim()) {
      setToast({
        open: true,
        message: 'Selecciona un terminal con laboratorio.',
        severity: 'error',
      })
      return
    }
    if (invalidProductNameIndexes.length > 0) {
      setToast({
        open: true,
        message: 'No puedes guardar productos sin nombre. Completa el nombre o elimina la fila vacia.',
        severity: 'error',
      })
      return
    }
    setIsCreateLoading(true)
    closeForm()
    try {
      const created = await createTerminalMutation.mutateAsync({
        payload: {
          name: formData.name.trim(),
          block_id: Number(formData.block_id),
          owner_company_id: Number(formData.owner_company_id),
          admin_company_id: Number(formData.admin_company_id),
          terminal_code: formData.terminal_code?.trim() || null,
          is_active: formData.is_active,
          has_lab: formData.has_lab,
          lab_terminal_id: formData.has_lab ? null : Number(formData.lab_terminal_id),
        },
      })
      if (created?.id && analysisTypes.length > 0) {
        await Promise.all(
          analysisTypes.map((analysis) =>
            upsertExternalAnalysisTerminal({
              tokenType,
              accessToken,
              terminalId: created.id,
              payload: {
                analysis_type_id: Number(analysis.id),
                frequency_days: 0,
                is_active: selectedAnalysisIds.includes(String(analysis.id)),
              },
            }),
          ),
        )
      }
      if (created?.id) {
        const createdProducts = await updateTerminalProducts({
          tokenType,
          accessToken,
          terminalId: created.id,
          products: sanitizeProductsForPayload(selectedProducts),
        })
        setTerminalProductsById((prev) => ({
          ...prev,
          [String(created.id)]: normalizeTerminalProducts(createdProducts),
        }))
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
    setShowProductValidation(true)
    if (!terminalId) return
    const nextFieldErrors = { ...TERMINAL_TEXT_FIELD_ERRORS_INITIAL_STATE }
    let firstInvalidField = ''
    if (!formData.name.trim()) {
      nextFieldErrors.name = 'El nombre es obligatorio.'
      firstInvalidField = 'name'
    }
    if (!formData.terminal_code.trim()) {
      nextFieldErrors.terminal_code = 'El codigo del terminal es obligatorio.'
      if (!firstInvalidField) {
        firstInvalidField = 'terminal_code'
      }
    }
    setEditFieldErrors(nextFieldErrors)
    if (firstInvalidField) {
      setEditFocusField(firstInvalidField)
      return
    }
    setEditFocusField('')
    if (!formData.block_id || !formData.owner_company_id || !formData.admin_company_id) {
      setToast({
        open: true,
        message: 'Selecciona bloque, empresa propietaria y empresa admin.',
        severity: 'error',
      })
      return
    }
    if (!formData.has_lab && !String(formData.lab_terminal_id || '').trim()) {
      setToast({
        open: true,
        message: 'Selecciona un terminal con laboratorio.',
        severity: 'error',
      })
      return
    }
    if (invalidProductNameIndexes.length > 0) {
      setToast({
        open: true,
        message: 'No puedes guardar productos sin nombre. Completa el nombre o elimina la fila vacia.',
        severity: 'error',
      })
      return
    }
    setIsUpdateLoading(true)
    closeForm()
    try {
      await updateTerminalMutation.mutateAsync({
        terminalId,
        payload: {
          name: formData.name.trim(),
          block_id: Number(formData.block_id),
          owner_company_id: Number(formData.owner_company_id),
          admin_company_id: Number(formData.admin_company_id),
          terminal_code: formData.terminal_code?.trim() || null,
          is_active: formData.is_active,
          has_lab: formData.has_lab,
          lab_terminal_id: formData.has_lab ? null : Number(formData.lab_terminal_id),
        },
      })
      if (analysisTypes.length > 0) {
        await Promise.all(
          analysisTypes.map((analysis) => {
            const current = terminalAnalyses.find((item) => item.analysis_type_id === analysis.id)
            return upsertExternalAnalysisTerminal({
              tokenType,
              accessToken,
              terminalId,
              payload: {
                analysis_type_id: Number(analysis.id),
                frequency_days: current?.frequency_days ?? 0,
                is_active: selectedAnalysisIds.includes(String(analysis.id)),
              },
            })
          }),
        )
      }
      const updatedProducts = await updateTerminalProducts({
        tokenType,
        accessToken,
        terminalId,
        products: sanitizeProductsForPayload(selectedProducts),
      })
      setTerminalProductsById((prev) => ({
        ...prev,
        [String(terminalId)]: normalizeTerminalProducts(updatedProducts),
      }))
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
      await deleteTerminalMutation.mutateAsync(terminalId)
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
            sx={{ fontWeight: 700, color: '#201747', lineHeight: 1.2 }}
          >
            Terminales
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Gestiona los terminales registrados en el sistema
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
          Nuevo terminal
        </Button>
      </Box>

      <TerminalsFilters
        query={query}
        blockFilter={blockFilter}
        ownerFilter={ownerFilter}
        statusFilter={statusFilter}
        blocks={blocks}
        companies={companies}
        filteredCount={filteredTerminals.length}
        hasActiveFilters={hasActiveFilters}
        onQueryChange={(value) => {
          setQuery(value)
          setPage(1)
        }}
        onBlockFilterChange={(value) => {
          setBlockFilter(value)
          setPage(1)
        }}
        onOwnerFilterChange={(value) => {
          setOwnerFilter(value)
          setPage(1)
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setPage(1)
        }}
        onClearFilters={handleClearFilters}
      />

      <TerminalsDataTable
        terminalsError={terminalsError}
        terminalsErrorMessage={terminalsErrorMessage}
        isTerminalsLoading={isTerminalsLoading}
        filteredCount={filteredTerminals.length}
        pagedTerminals={pagedTerminals}
        terminalProductsById={terminalProductsById}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        getLabLabel={getLabLabel}
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

      <TerminalFormDialog
        open={isFormOpen}
        isEditOpen={isEditOpen}
        formData={formData}
        blocks={blocks}
        companies={companies}
        labTerminalOptions={labTerminalOptions}
        analysisTypes={analysisTypes}
        isAnalysesLoading={isAnalysesLoading}
        selectedAnalysisIds={selectedAnalysisIds}
        selectedProducts={selectedProducts}
        showProductValidation={showProductValidation}
        invalidProductNameIndexes={invalidProductNameIndexes}
        fieldErrors={isEditOpen ? editFieldErrors : createFieldErrors}
        focusField={isEditOpen ? editFocusField : createFocusField}
        onFocusHandled={() => {
          if (isEditOpen) {
            setEditFocusField('')
            return
          }
          setCreateFocusField('')
        }}
        onFormDataChange={handleTerminalFormDataChange}
        onAnalysisToggle={(analysisId, checked) => {
          setSelectedAnalysisIds((prev) =>
            checked ? [...prev, analysisId] : prev.filter((id) => id !== analysisId),
          )
        }}
        onProductChange={(index, changes) => {
          setSelectedProducts((prev) =>
            prev.map((item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    ...changes,
                  }
                : item,
            ),
          )
        }}
        onAddProduct={() => {
          setSelectedProducts((prev) => [
            ...prev,
            {
              name: '',
              product_type: DEFAULT_PRODUCT_TYPE,
            },
          ])
        }}
        onRemoveProduct={(index) => {
          setSelectedProducts((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
        }}
        onClose={closeForm}
        onSubmit={isEditOpen ? handleUpdate : handleCreate}
      />

      <TerminalViewDialog
        open={isViewOpen}
        viewTerminal={viewTerminal}
        terminalsById={terminalsById}
        isAnalysesLoading={isAnalysesLoading}
        terminalAnalyses={terminalAnalyses}
        terminalProducts={terminalProducts}
        formatDate={formatTerminalDate}
        onClose={closeView}
        onEdit={() => {
          closeView()
          openEdit(viewTerminal)
        }}
      />

      <TerminalDeleteDialog
        open={isDeleteOpen}
        viewTerminal={viewTerminal}
        isSaving={isSaving}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />

      <TerminalProgressDialog
        open={isCreateLoading || isUpdateLoading}
        title={isCreateLoading ? 'Guardando terminal...' : 'Actualizando terminal...'}
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

export default CompanyTerminalsTable
