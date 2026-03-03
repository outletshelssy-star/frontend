import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoredFilterValue } from '../../utils/storage'
import { Add, DeleteOutline, EditOutlined, SaveOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Alert,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
  Checkbox,
  ListItemText,
  FormHelperText,
  FormControlLabel,
} from '@mui/material'
import {
  createEquipmentType,
  createEquipmentTypeVerification,
  updateEquipmentTypeVerification,
  deleteEquipmentTypeVerification,
  deleteEquipmentType,
  fetchEquipmentTypeById,
  fetchEquipmentTypeVerifications,
  updateEquipmentType,
  createEquipmentTypeInspectionItem,
  updateEquipmentTypeInspectionItem,
  deleteEquipmentTypeInspectionItem,
} from '../../services/api'
import { useEquipmentTypesQuery } from '../../hooks/useEquipmentTypesQuery'
import { useAuthStore } from '../../store/useAuthStore'
import { EquipmentTypesFilters } from './EquipmentTypesFilters'
import { EquipmentTypesDataTable } from './EquipmentTypesDataTable'
import { EquipmentTypeRoleBadge, EquipmentTypeStatusBadge } from './EquipmentTypeBadges'
import { MEASURE_OPTIONS, ROLE_OPTIONS, formatDaysWithUnit } from './equipmentTypeUtils'

const EquipmentTypesTable = ({ currentUser }) => {
  const { tokenType, accessToken } = useAuthStore()

  const queryClient = useQueryClient()

  const {
    data: equipmentTypes = [],

    isLoading: isEquipmentTypesLoading,

    error: equipmentTypesError,
  } = useEquipmentTypesQuery()

  const canEdit = ['admin', 'superadmin'].includes(
    String(currentUser?.user_type || '').toLowerCase(),
  )

  const getDefaultVerificationTypes = () => []

  const [query, setQuery] = useState(() => getStoredFilterValue('equipmentTypes.filters.query', ''))

  const [statusFilter, setStatusFilter] = useState(() =>
    getStoredFilterValue('equipmentTypes.filters.status', 'all'),
  )

  const [roleFilter, setRoleFilter] = useState(() =>
    getStoredFilterValue('equipmentTypes.filters.role', 'all'),
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

  const [isAddItemOpen, setIsAddItemOpen] = useState(false)

  const [isAddItemLoading, setIsAddItemLoading] = useState(false)

  const [isVerificationTypeLoading, setIsVerificationTypeLoading] = useState(false)

  const [equipmentTypeId, setEquipmentTypeId] = useState(null)

  const [viewEquipmentType, setViewEquipmentType] = useState(null)

  const [editEquipmentType, setEditEquipmentType] = useState(null)

  const [formData, setFormData] = useState({
    name: '',

    role: 'working',

    calibration_days: 0,

    maintenance_days: 0,

    inspection_days: 0,

    observations: '',

    is_active: true,

    has_measures: true,
  })

  const [verificationTypesForm, setVerificationTypesForm] = useState(getDefaultVerificationTypes())

  const [measures, setMeasures] = useState([])

  const [measureToAdd, setMeasureToAdd] = useState('')

  const [maxErrors, setMaxErrors] = useState({})

  const [inspectionItemMode, setInspectionItemMode] = useState('create')

  const [editingInspectionItemId, setEditingInspectionItemId] = useState(null)

  const [inspectionItemForm, setInspectionItemForm] = useState({
    item: '',

    response_type: 'boolean',

    is_required: true,

    order: 0,

    expected_bool: null,

    expected_text_options: '',

    expected_number: '',

    expected_number_min: '',

    expected_number_max: '',
  })

  const [toast, setToast] = useState({
    open: false,

    message: '',

    severity: 'success',
  })

  const equipmentTypesErrorMessage = equipmentTypesError
    ? equipmentTypesError?.detail ||
      equipmentTypesError?.message ||
      String(equipmentTypesError || '') ||
      'No se pudieron cargar los tipos de equipo.'
    : ''

  const createEquipmentTypeMutation = useMutation({
    mutationFn: (payload) => createEquipmentType({ tokenType, accessToken, payload }),

    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment-types'] }),
  })

  const updateEquipmentTypeMutation = useMutation({
    mutationFn: ({ equipmentTypeId, payload }) =>
      updateEquipmentType({ tokenType, accessToken, equipmentTypeId, payload }),

    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment-types'] }),
  })

  const deleteEquipmentTypeMutation = useMutation({
    mutationFn: (equipmentTypeId) =>
      deleteEquipmentType({ tokenType, accessToken, equipmentTypeId }),

    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment-types'] }),
  })

  const hasActiveFilters = query.trim().length > 0 || statusFilter !== 'all' || roleFilter !== 'all'

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem('equipmentTypes.filters.query', JSON.stringify(query))
  }, [query])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem('equipmentTypes.filters.status', JSON.stringify(statusFilter))
  }, [statusFilter])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem('equipmentTypes.filters.role', JSON.stringify(roleFilter))
  }, [roleFilter])

  const handleClearFilters = () => {
    setQuery('')

    setStatusFilter('all')

    setRoleFilter('all')

    setPage(1)
  }

  const filteredEquipmentTypes = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return equipmentTypes.filter((item) => {
      const matchesStatus =
        statusFilter === 'all' ? true : statusFilter === 'active' ? item.is_active : !item.is_active

      const matchesRole = roleFilter === 'all' ? true : item.role === roleFilter

      const name = String(item.name || '').toLowerCase()

      const role = String(item.role || '').toLowerCase()

      const labLabel = item.is_lab ? 'laboratorio' : 'campo'

      const matchesQuery =
        !normalized ||
        name.includes(normalized) ||
        role.includes(normalized) ||
        labLabel.includes(normalized)

      return matchesStatus && matchesRole && matchesQuery
    })
  }, [equipmentTypes, query, statusFilter, roleFilter])

  const sortedEquipmentTypes = useMemo(() => {
    const getValue = (item) => {
      switch (sortBy) {
        case 'name':
          return item.name || ''

        case 'role':
          return item.role || ''

        case 'calibration':
          return item.calibration_days ?? 0

        case 'maintenance':
          return item.maintenance_days ?? 0

        case 'inspection':
          return item.inspection_days ?? 0

        case 'lab':
          return item.is_lab ? 'laboratorio' : 'campo'

        case 'status':
          return item.is_active ? 'active' : 'inactive'

        default:
          return ''
      }
    }

    return [...filteredEquipmentTypes].sort((a, b) => {
      const aVal = String(getValue(a)).toLowerCase()

      const bVal = String(getValue(b)).toLowerCase()

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1

      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1

      return 0
    })
  }, [filteredEquipmentTypes, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredEquipmentTypes.length / rowsPerPage))

  const safePage = Math.min(page, totalPages)

  const pagedEquipmentTypes = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage

    return sortedEquipmentTypes.slice(start, start + rowsPerPage)
  }, [sortedEquipmentTypes, rowsPerPage, safePage])

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

      role: 'working',

      calibration_days: 0,

      maintenance_days: 0,

      inspection_days: 0,

      observations: '',

      is_active: true,

      has_measures: true,
    })

    setVerificationTypesForm(getDefaultVerificationTypes())

    setMeasures([])

    setMeasureToAdd('')

    setMaxErrors({})

    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
  }

  const openEdit = (item) => {
    setEquipmentTypeId(item.id)

    setFormData({
      name: item.name || '',

      role: item.role || 'working',

      calibration_days: item.calibration_days || 0,

      maintenance_days: item.maintenance_days || 0,

      inspection_days: item.inspection_days || 0,

      observations: item.observations || '',

      is_active: Boolean(item.is_active),

      has_measures: Array.isArray(item.measures) ? item.measures.length > 0 : false,
    })

    const nextMeasures = Array.isArray(item.measures) ? item.measures : []

    const nextMaxErrors = {}

    ;(item.max_errors || []).forEach((entry) => {
      nextMaxErrors[entry.measure] = {
        max_error_value: entry.max_error_value,

        unit: entry.unit || getBaseUnit(entry.measure),
      }
    })

    setMeasures(nextMeasures)

    setMeasureToAdd('')

    setMaxErrors(nextMaxErrors)

    setIsEditOpen(true)

    setEditEquipmentType(item)

    fetchEquipmentTypeById({
      tokenType,

      accessToken,

      equipmentTypeId: item.id,
    })
      .then((data) => {
        setEditEquipmentType(data)
      })

      .catch(() => {
        setEditEquipmentType(item)
      })
  }

  const closeEdit = () => {
    setIsEditOpen(false)

    setEquipmentTypeId(null)

    setEditEquipmentType(null)
  }

  const openView = async (item) => {
    setViewEquipmentType(item)

    setIsViewOpen(true)

    try {
      const [data, verificationTypesData] = await Promise.all([
        fetchEquipmentTypeById({
          tokenType,

          accessToken,

          equipmentTypeId: item.id,
        }),

        fetchEquipmentTypeVerifications({
          tokenType,

          accessToken,

          equipmentTypeId: item.id,
        }).catch(() => ({ items: [] })),
      ])

      const verificationTypes = Array.isArray(verificationTypesData?.items)
        ? verificationTypesData.items
        : []

      verificationTypes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      setViewEquipmentType({
        ...data,

        verification_types: verificationTypes,
      })
    } catch (err) {
      setToast({
        open: true,

        message: err?.detail || 'No se pudo cargar el detalle del tipo de equipo.',

        severity: 'error',
      })
    }
  }

  const closeView = () => {
    setIsViewOpen(false)

    setViewEquipmentType(null)
  }

  const openAddInspectionItem = () => {
    setInspectionItemMode('create')

    setEditingInspectionItemId(null)

    setInspectionItemForm({
      item: '',

      response_type: 'boolean',

      is_required: true,

      order: 0,

      expected_bool: null,

      expected_text_options: '',

      expected_number: '',

      expected_number_min: '',

      expected_number_max: '',
    })

    setIsAddItemOpen(true)
  }

  const closeAddInspectionItem = () => {
    setIsAddItemOpen(false)

    setInspectionItemMode('create')

    setEditingInspectionItemId(null)
  }

  const openEditInspectionItem = (item) => {
    if (!item) return

    setInspectionItemMode('edit')

    setEditingInspectionItemId(item.id)

    setInspectionItemForm({
      item: item.item || '',

      response_type: item.response_type || 'boolean',

      is_required: item.is_required ?? true,

      order: item.order ?? 0,

      expected_bool: item.expected_bool ?? null,

      expected_text_options: (item.expected_text_options || []).join(', '),

      expected_number: item.expected_number ?? '',

      expected_number_min: item.expected_number_min ?? '',

      expected_number_max: item.expected_number_max ?? '',
    })

    setIsAddItemOpen(true)
  }

  const preventBackdropClose = (closeFn) => (event, reason) => {
    if (reason === 'backdropClick') return

    closeFn()
  }

  const openDelete = (item) => {
    if (!item) return

    setEquipmentTypeId(item.id)

    setViewEquipmentType(item)

    setIsDeleteOpen(true)
  }

  const closeDelete = () => {
    setIsDeleteOpen(false)

    setEquipmentTypeId(null)
  }

  const handleMeasuresChange = (value) => {
    if (!formData.has_measures) return

    const nextMeasures = Array.isArray(value) ? value : []

    setMeasures(nextMeasures)

    setMaxErrors((prev) => {
      const next = {}

      nextMeasures.forEach((measure) => {
        next[measure] = prev[measure] || { max_error_value: '', unit: '' }
      })

      return next
    })
  }

  const buildInspectionItemPayload = () => {
    const item = inspectionItemForm.item.trim()

    if (!item) {
      setToast({
        open: true,

        message: 'El ítem es obligatorio.',

        severity: 'error',
      })

      return null
    }

    const base = {
      item,

      response_type: inspectionItemForm.response_type,

      is_required: Boolean(inspectionItemForm.is_required),

      order: Number(inspectionItemForm.order || 0),
    }

    if (inspectionItemForm.response_type === 'boolean') {
      return {
        ...base,

        expected_bool:
          inspectionItemForm.expected_bool === null
            ? null
            : Boolean(inspectionItemForm.expected_bool),
      }
    }

    if (inspectionItemForm.response_type === 'text') {
      const options = inspectionItemForm.expected_text_options

        .split(',')

        .map((value) => value.trim())

        .filter(Boolean)

      return {
        ...base,

        expected_text_options: options,
      }
    }

    if (inspectionItemForm.response_type === 'number') {
      return {
        ...base,

        expected_number:
          inspectionItemForm.expected_number === ''
            ? null
            : Number(inspectionItemForm.expected_number),

        expected_number_min:
          inspectionItemForm.expected_number_min === ''
            ? null
            : Number(inspectionItemForm.expected_number_min),

        expected_number_max:
          inspectionItemForm.expected_number_max === ''
            ? null
            : Number(inspectionItemForm.expected_number_max),
      }
    }

    return base
  }

  const handleAddInspectionItem = async () => {
    if (!editEquipmentType?.id) return

    const payload = buildInspectionItemPayload()

    if (!payload) return

    setIsAddItemLoading(true)

    try {
      if (inspectionItemMode === 'edit' && editingInspectionItemId) {
        const updated = await updateEquipmentTypeInspectionItem({
          tokenType,

          accessToken,

          equipmentTypeId: editEquipmentType.id,

          itemId: editingInspectionItemId,

          payload,
        })

        setEditEquipmentType((prev) => {
          if (!prev) return prev

          const prevItems = Array.isArray(prev.inspection_items) ? prev.inspection_items : []

          const nextItems = prevItems.map((item) => (item.id === updated.id ? updated : item))

          return { ...prev, inspection_items: nextItems }
        })

        setToast({
          open: true,

          message: 'Ítem de inspección actualizado.',

          severity: 'success',
        })
      } else {
        const newItem = await createEquipmentTypeInspectionItem({
          tokenType,

          accessToken,

          equipmentTypeId: editEquipmentType.id,

          payload,
        })

        setEditEquipmentType((prev) => {
          if (!prev) return prev

          const prevItems = Array.isArray(prev.inspection_items) ? prev.inspection_items : []

          const nextItems = [...prevItems, newItem].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

          return { ...prev, inspection_items: nextItems }
        })

        setToast({
          open: true,

          message: 'Ítem de inspección agregado.',

          severity: 'success',
        })
      }

      closeAddInspectionItem()
    } catch (err) {
      setToast({
        open: true,

        message: err?.detail || 'No se pudo guardar el ítem de inspección.',

        severity: 'error',
      })
    } finally {
      setIsAddItemLoading(false)
    }
  }

  const handleDeleteInspectionItem = async (item) => {
    if (!editEquipmentType?.id || !item?.id) return

    setIsAddItemLoading(true)

    try {
      await deleteEquipmentTypeInspectionItem({
        tokenType,

        accessToken,

        equipmentTypeId: editEquipmentType.id,

        itemId: item.id,
      })

      setEditEquipmentType((prev) => {
        if (!prev) return prev

        const prevItems = Array.isArray(prev.inspection_items) ? prev.inspection_items : []

        const nextItems = prevItems.filter((entry) => entry.id !== item.id)

        return { ...prev, inspection_items: nextItems }
      })

      setToast({
        open: true,

        message: 'Ítem de inspección eliminado.',

        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,

        message: err?.detail || 'No se pudo eliminar el ítem de inspección.',

        severity: 'error',
      })
    } finally {
      setIsAddItemLoading(false)
    }
  }

  const handleAddVerificationType = async () => {
    if (!editEquipmentType?.id) return

    const existing = Array.isArray(editEquipmentType.verification_types)
      ? editEquipmentType.verification_types
      : []

    const nextOrder = existing.length

    setIsVerificationTypeLoading(true)

    try {
      const created = await createEquipmentTypeVerification({
        tokenType,

        accessToken,

        equipmentTypeId: editEquipmentType.id,

        payload: {
          name: `Verificacion ${nextOrder + 1}`,

          frequency_days: 30,

          is_active: true,

          order: nextOrder,
        },
      })

      setEditEquipmentType((prev) => {
        if (!prev) return prev

        const current = Array.isArray(prev.verification_types) ? prev.verification_types : []

        const next = [...current, created].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

        return { ...prev, verification_types: next }
      })

      setToast({
        open: true,

        message: 'Tipo de verificación agregado.',

        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,

        message: err?.detail || 'No se pudo agregar el tipo de verificación.',

        severity: 'error',
      })
    } finally {
      setIsVerificationTypeLoading(false)
    }
  }

  const handleSaveVerificationType = async (typeItem) => {
    if (!editEquipmentType?.id || !typeItem?.id) return

    const name = String(typeItem.name || '').trim()

    const frequencyDays = Number(typeItem.frequency_days ?? 0)

    if (!name) {
      setToast({
        open: true,

        message: 'El nombre de la verificación es obligatorio.',

        severity: 'error',
      })

      return
    }

    if (Number.isNaN(frequencyDays) || frequencyDays < 0) {
      setToast({
        open: true,

        message: 'La frecuencia de verificación debe ser un número válido.',

        severity: 'error',
      })

      return
    }

    setIsVerificationTypeLoading(true)

    try {
      const updated = await updateEquipmentTypeVerification({
        tokenType,

        accessToken,

        equipmentTypeId: editEquipmentType.id,

        verificationTypeId: typeItem.id,

        payload: {
          name,

          frequency_days: frequencyDays,

          is_active: Boolean(typeItem.is_active ?? true),

          order: Number(typeItem.order ?? 0),
        },
      })

      setEditEquipmentType((prev) => {
        if (!prev) return prev

        const current = Array.isArray(prev.verification_types) ? prev.verification_types : []

        const next = current

          .map((item) => (item.id === updated.id ? updated : item))

          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

        return { ...prev, verification_types: next }
      })

      setToast({
        open: true,

        message: 'Tipo de verificación actualizado.',

        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,

        message: err?.detail || 'No se pudo actualizar el tipo de verificación.',

        severity: 'error',
      })
    } finally {
      setIsVerificationTypeLoading(false)
    }
  }

  const handleDeleteVerificationType = async (typeItem) => {
    if (!editEquipmentType?.id || !typeItem?.id) return

    setIsVerificationTypeLoading(true)

    try {
      await deleteEquipmentTypeVerification({
        tokenType,

        accessToken,

        equipmentTypeId: editEquipmentType.id,

        verificationTypeId: typeItem.id,
      })

      setEditEquipmentType((prev) => {
        if (!prev) return prev

        const current = Array.isArray(prev.verification_types) ? prev.verification_types : []

        const next = current.filter((item) => item.id !== typeItem.id)

        return { ...prev, verification_types: next }
      })

      setToast({
        open: true,

        message: 'Tipo de verificación eliminado.',

        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,

        message: err?.detail || 'No se pudo eliminar el tipo de verificación.',

        severity: 'error',
      })
    } finally {
      setIsVerificationTypeLoading(false)
    }
  }

  const buildPayload = () => ({
    name: formData.name.trim(),

    role: formData.role,

    calibration_days: Number(formData.calibration_days || 0),

    maintenance_days: Number(formData.maintenance_days || 0),

    inspection_days: Number(formData.inspection_days || 0),

    observations: formData.observations?.trim() || null,

    is_active: Boolean(formData.is_active),

    measures,

    max_errors: measures.map((measure) => ({
      measure,

      max_error_value: Number(maxErrors[measure]?.max_error_value || 0),

      unit: String(maxErrors[measure]?.unit || '').trim() || null,
    })),
  })

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'El nombre es obligatorio.'
    }

    if (formData.has_measures && !measures.length) {
      return 'Selecciona al menos una medida.'
    }

    if (verificationTypesForm.length) {
      const invalidVerificationType = verificationTypesForm.find(
        (typeItem) =>
          !String(typeItem.name || '').trim() ||
          typeItem.frequency_days === '' ||
          typeItem.frequency_days === null ||
          Number.isNaN(Number(typeItem.frequency_days)),
      )

      if (invalidVerificationType) {
        return 'Completa nombre y frecuencia de cada tipo de verificación.'
      }
    }

    if (formData.has_measures) {
      const missing = measures.find(
        (measure) =>
          !String(maxErrors[measure]?.unit || '').trim() ||
          maxErrors[measure]?.max_error_value === '' ||
          maxErrors[measure]?.max_error_value === null ||
          Number.isNaN(Number(maxErrors[measure]?.max_error_value)),
      )

      if (missing) {
        return 'Completa unidad y valor de error máximo para cada medida.'
      }
    }

    return ''
  }

  const handleCreate = async () => {
    const error = validateForm()

    if (error) {
      setToast({ open: true, message: error, severity: 'error' })

      return
    }

    setIsCreateLoading(true)

    closeCreate()

    try {
      const createdEquipmentType = await createEquipmentTypeMutation.mutateAsync(buildPayload())

      if (createdEquipmentType?.id) {
        const verificationTypesPayload = verificationTypesForm.map((typeItem, index) => ({
          name: String(typeItem.name || '').trim(),

          frequency_days: Number(typeItem.frequency_days || 0),

          is_active: Boolean(typeItem.is_active ?? true),

          order: Number(typeItem.order ?? index),
        }))

        await Promise.all(
          verificationTypesPayload.map((payload) =>
            createEquipmentTypeVerification({
              tokenType,

              accessToken,

              equipmentTypeId: createdEquipmentType.id,

              payload,
            }),
          ),
        )
      }

      setToast({
        open: true,

        message: 'Tipo de equipo creado correctamente.',

        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,

        message: err?.detail || 'No se pudo crear el tipo de equipo.',

        severity: 'error',
      })
    } finally {
      setIsCreateLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!equipmentTypeId) return

    const error = validateForm()

    if (error) {
      setToast({ open: true, message: error, severity: 'error' })

      return
    }

    setIsUpdateLoading(true)

    closeEdit()

    try {
      await updateEquipmentTypeMutation.mutateAsync({
        equipmentTypeId,

        payload: buildPayload(),
      })

      setToast({
        open: true,

        message: 'Tipo de equipo actualizado correctamente.',

        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,

        message: err?.detail || 'No se pudo actualizar el tipo de equipo.',

        severity: 'error',
      })
    } finally {
      setIsUpdateLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!equipmentTypeId) return

    setIsSaving(true)

    try {
      await deleteEquipmentTypeMutation.mutateAsync(equipmentTypeId)

      setToast({
        open: true,

        message: 'Tipo de equipo eliminado correctamente.',

        severity: 'success',
      })

      closeDelete()
    } catch (err) {
      setToast({
        open: true,

        message: err?.detail || 'No se pudo eliminar el tipo de equipo.',

        severity: 'error',
      })

      closeDelete()
    } finally {
      setIsSaving(false)
    }
  }


  const getUnitOptions = (measure) => {
    switch (measure) {
      case 'temperature':
        return [
          { value: 'c', label: 'C' },

          { value: 'f', label: 'F' },

          { value: 'k', label: 'K' },

          { value: 'r', label: 'R' },
        ]

      case 'relative_humidity':
        return [{ value: '%', label: '%' }]

      case 'weight':
        return [
          { value: 'g', label: 'g' },

          { value: 'kg', label: 'kg' },

          { value: 'lb', label: 'lb' },

          { value: 'oz', label: 'oz' },
        ]

      case 'length':
        return [
          { value: 'mm', label: 'mm' },

          { value: 'cm', label: 'cm' },

          { value: 'm', label: 'm' },

          { value: 'in', label: 'in' },

          { value: 'ft', label: 'ft' },
        ]

      case 'pressure':
        return [{ value: 'pa', label: 'Pa' }]

      case 'api':
        return [{ value: 'api', label: '°API' }]

      case 'percent_pv':
        return [{ value: '%p/v', label: '% p/v' }]

      default:
        return []
    }
  }

  const getBaseUnit = (measure) => {
    switch (measure) {
      case 'temperature':
        return 'c'

      case 'relative_humidity':
        return '%'

      case 'weight':
        return 'g'

      case 'length':
        return 'mm'

      case 'pressure':
        return 'pa'

      case 'api':
        return 'api'

      case 'percent_pv':
        return '%p/v'

      default:
        return ''
    }
  }

  const getBaseUnitLabel = (measure) => {
    const unitValue = getBaseUnit(measure)

    if (!unitValue) return ''

    return getUnitOptions(measure).find((option) => option.value === unitValue)?.label || unitValue
  }

  const renderMaxErrors = (errors = []) => {
    if (!errors.length) return '-'

    return errors

      .map((entry) => {
        const label =
          MEASURE_OPTIONS.find((option) => option.value === entry.measure)?.label || entry.measure

        const unit = getBaseUnitLabel(entry.measure)

        return `${label}: ${entry.max_error_value ?? 0} ${unit}`.trim()
      })

      .join(', ')
  }

  const renderInspectionExpected = (item) => {
    if (!item) return '-'

    if (item.response_type === 'boolean') {
      if (item.expected_bool === null || item.expected_bool === undefined) return '-'

      return `Esperado: ${item.expected_bool ? 'Si' : 'No'}`
    }

    if (item.response_type === 'text') {
      const options = item.expected_text_options || []

      return options.length ? `Opciones: ${options.join(', ')}` : '-'
    }

    if (item.response_type === 'number') {
      if (item.expected_number !== null && item.expected_number !== undefined) {
        return `Esperado: ${item.expected_number}`
      }

      const min =
        item.expected_number_min !== null && item.expected_number_min !== undefined
          ? item.expected_number_min
          : ''

      const max =
        item.expected_number_max !== null && item.expected_number_max !== undefined
          ? item.expected_number_max
          : ''

      if (min != '' || max != '') {
        return `Rango: ${min != '' ? min : '-'} a ${max != '' ? max : '-'}`
      }
    }

    return '-'
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
            Plan Metrológico
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Gestiona los tipos de equipos y su plan de calibración
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
          Nuevo tipo
        </Button>
      </Box>

      <EquipmentTypesFilters
        query={query}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        hasActiveFilters={hasActiveFilters}
        filteredCount={filteredEquipmentTypes.length}
        onQueryChange={(value) => {
          setQuery(value)
          setPage(1)
        }}
        onRoleFilterChange={(value) => {
          setRoleFilter(value)
          setPage(1)
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setPage(1)
        }}
        onClearFilters={handleClearFilters}
      />

      <EquipmentTypesDataTable
        equipmentTypesError={equipmentTypesError}
        equipmentTypesErrorMessage={equipmentTypesErrorMessage}
        isEquipmentTypesLoading={isEquipmentTypesLoading}
        filteredCount={filteredEquipmentTypes.length}
        pagedEquipmentTypes={pagedEquipmentTypes}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        canEdit={canEdit}
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

      <Dialog
        open={isCreateOpen}
        onClose={preventBackdropClose(closeCreate)}
        fullWidth
        maxWidth="xl"
        PaperProps={{
          sx: {
            width: 'min(1400px, 96vw)',

            maxHeight: '94vh',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Nuevo tipo de equipo
        </DialogTitle>

        <DialogContent
          sx={{
            display: 'grid',

            gap: 2,

            pt: 2,

            overflow: 'auto',

            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },

            alignItems: 'start',
          }}
        >
          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              backgroundColor: '#fdfafe',

              display: 'grid',

              gap: 2,

              gridColumn: { xs: '1 / -1', lg: '1 / -1' },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                color: 'secondary.dark',
                letterSpacing: '0.08em',
                lineHeight: 1.5,
              }}
            >
              General
            </Typography>

            <Box
              sx={{
                display: 'grid',

                gap: 2,

                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              }}
            >
              <TextField
                label="Nombre"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                required
                fullWidth
              />

              <FormControl>
                <InputLabel id="equipment-role-label">Rol</InputLabel>

                <Select
                  labelId="equipment-role-label"
                  label="Rol"
                  value={formData.role}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, role: event.target.value }))
                  }
                >
                  {ROLE_OPTIONS.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              display: 'grid',

              gap: 2,

              gridColumn: { xs: '1 / -1', lg: '1 / 2' },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                color: 'secondary.dark',
                letterSpacing: '0.08em',
                lineHeight: 1.5,
              }}
            >
              Programación
            </Typography>

            <Box
              sx={{
                display: 'grid',

                gap: 2,

                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              }}
            >
              <TextField
                label="Días inspección"
                type="number"
                value={formData.inspection_days}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,

                    inspection_days: event.target.value,
                  }))
                }
              />

              <TextField
                label="Días calibración"
                type="number"
                value={formData.calibration_days}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,

                    calibration_days: event.target.value,
                  }))
                }
              />

              <TextField
                label="Días mantenimiento"
                type="number"
                value={formData.maintenance_days}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,

                    maintenance_days: event.target.value,
                  }))
                }
              />
            </Box>
          </Box>

          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              display: 'grid',

              gap: 1.5,

              gridColumn: { xs: '1 / -1', lg: '2 / 3' },
            }}
          >
            <Box
              sx={{
                display: 'flex',

                alignItems: 'center',

                justifyContent: 'space-between',

                gap: 2,
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 700,
                  color: 'secondary.dark',
                  letterSpacing: '0.08em',
                  lineHeight: 1.5,
                }}
              >
                Tipos de verificación
              </Typography>

              <Button
                size="small"
                variant="outlined"
                sx={{ height: 40 }}
                onClick={() =>
                  setVerificationTypesForm((prev) => [
                    ...prev,

                    {
                      name: `Verificacion ${prev.length + 1}`,

                      frequency_days: 30,

                      is_active: true,

                      order: prev.length,
                    },
                  ])
                }
              >
                Agregar verificación
              </Button>
            </Box>

            {verificationTypesForm.map((typeItem, index) => (
              <Box
                key={`verification-type-create-${index}`}
                sx={{
                  display: 'grid',

                  gap: 1,

                  gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto' },

                  alignItems: 'center',

                  border: '1px solid #e5e7eb',

                  borderRadius: 1.5,

                  p: 1,

                  backgroundColor: '#f9fafb',
                }}
              >
                <TextField
                  label="Nombre"
                  size="small"
                  value={typeItem.name}
                  onChange={(event) =>
                    setVerificationTypesForm((prev) =>
                      prev.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, name: event.target.value } : entry,
                      ),
                    )
                  }
                />

                <TextField
                  label="Días"
                  size="small"
                  type="number"
                  value={typeItem.frequency_days}
                  onChange={(event) =>
                    setVerificationTypesForm((prev) =>
                      prev.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, frequency_days: event.target.value }
                          : entry,
                      ),
                    )
                  }
                />

                <Button
                  color="error"
                  size="small"
                  onClick={() =>
                    setVerificationTypesForm((prev) => {
                      if (prev.length <= 1) return prev

                      return prev

                        .filter((_, entryIndex) => entryIndex !== index)

                        .map((entry, entryIndex) => ({
                          ...entry,

                          order: entryIndex,
                        }))
                    })
                  }
                  disabled={verificationTypesForm.length <= 1}
                >
                  Quitar
                </Button>
              </Box>
            ))}

            <FormHelperText>
              Puedes crear varias verificaciones, por ejemplo diaria y mensual.
            </FormHelperText>
          </Box>

          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              display: 'grid',

              gap: 2,

              gridColumn: { xs: '1 / -1', lg: '1 / -1' },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                color: 'secondary.dark',
                letterSpacing: '0.08em',
                lineHeight: 1.5,
              }}
            >
              Medidas y tolerancias
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={!formData.has_measures}
                  onChange={(event) => {
                    const disableMeasures = event.target.checked

                    setFormData((prev) => ({
                      ...prev,

                      has_measures: !disableMeasures,
                    }))

                    if (disableMeasures) {
                      setMeasures([])

                      setMeasureToAdd('')

                      setMaxErrors({})
                    }
                  }}
                />
              }
              label="Este tipo no requiere medidas (pesadas)."
            />

            <Box
              sx={{
                display: 'grid',

                gap: 2,

                gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' },

                alignItems: 'start',
              }}
            >
              <Box
                sx={{
                  display: 'grid',

                  gap: 1.5,

                  gridTemplateColumns: { xs: '1fr', sm: '2fr auto' },

                  alignItems: 'center',
                }}
              >
                <FormControl>
                  <InputLabel id="equipment-measures-label">Medidas</InputLabel>

                  <Select
                    labelId="equipment-measures-label"
                    label="Medidas"
                    value={measureToAdd}
                    onChange={(event) => setMeasureToAdd(event.target.value)}
                    disabled={!formData.has_measures}
                  >
                    {MEASURE_OPTIONS.map((measure) => (
                      <MenuItem key={measure.value} value={measure.value}>
                        {measure.label}
                      </MenuItem>
                    ))}
                  </Select>

                  <FormHelperText>Selecciona una medida y agrégala a la lista.</FormHelperText>
                </FormControl>

                <Button
                  variant="outlined"
                  onClick={() => {
                    if (!measureToAdd) return

                    if (measures.includes(measureToAdd)) return

                    handleMeasuresChange([...measures, measureToAdd])

                    setMeasureToAdd('')
                  }}
                  disabled={
                    !formData.has_measures || !measureToAdd || measures.includes(measureToAdd)
                  }
                >
                  Agregar medida
                </Button>
              </Box>

              {formData.has_measures && measures.length > 0 ? (
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 700,
                      color: 'secondary.dark',
                      letterSpacing: '0.08em',
                      lineHeight: 1.5,
                    }}
                  >
                    Error máximo por medida
                  </Typography>

                  {measures.map((measure) => (
                    <Box
                      key={measure}
                      sx={{
                        display: 'grid',

                        gap: 2,

                        gridTemplateColumns: {
                          xs: '1fr',

                          sm: 'minmax(120px, 2fr) minmax(90px, 1fr) minmax(130px, 1fr) auto',
                        },

                        alignItems: 'center',
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {MEASURE_OPTIONS.find((option) => option.value === measure)?.label ||
                          measure}
                      </Typography>

                      <TextField
                        label="Valor"
                        type="number"
                        value={maxErrors[measure]?.max_error_value ?? ''}
                        onChange={(event) =>
                          setMaxErrors((prev) => ({
                            ...prev,

                            [measure]: {
                              ...prev[measure],

                              max_error_value: event.target.value,
                            },
                          }))
                        }
                      />

                      <FormControl sx={{ minWidth: 130 }}>
                        <InputLabel id={`max-error-unit-${measure}`}>Unidad</InputLabel>

                        <Select
                          labelId={`max-error-unit-${measure}`}
                          label="Unidad"
                          value={maxErrors[measure]?.unit || ''}
                          onChange={(event) =>
                            setMaxErrors((prev) => ({
                              ...prev,

                              [measure]: {
                                ...prev[measure],

                                unit: event.target.value,
                              },
                            }))
                          }
                        >
                          {getUnitOptions(measure).map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Button
                        color="error"
                        size="small"
                        onClick={() =>
                          handleMeasuresChange(measures.filter((value) => value !== measure))
                        }
                      >
                        Quitar
                      </Button>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  {formData.has_measures
                    ? 'Selecciona medidas para configurar errores máximos.'
                    : 'No aplica.'}
                </Typography>
              )}
            </Box>
          </Box>

          <TextField
            label="Observaciones"
            value={formData.observations}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, observations: event.target.value }))
            }
            multiline
            minRows={2}
            sx={{ gridColumn: { xs: '1 / -1', lg: '1 / -1' } }}
          />

          <FormHelperText sx={{ gridColumn: { xs: '1 / -1', lg: '1 / -1' } }}>
            Nota: Los ítems de inspección se agregan despues de crear el tipo de equipo.
          </FormHelperText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closeCreate}>Cancelar</Button>

          <Button variant="contained" onClick={handleCreate}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onClose={preventBackdropClose(closeEdit)}
        fullWidth
        maxWidth="xl"
        PaperProps={{
          sx: {
            width: 'min(1400px, 96vw)',

            maxHeight: '94vh',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Editar tipo de equipo
        </DialogTitle>

        <DialogContent
          sx={{
            display: 'grid',

            gap: 2,

            pt: 2,

            overflow: 'auto',

            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },

            alignItems: 'start',
          }}
        >
          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              backgroundColor: '#fdfafe',

              display: 'grid',

              gap: 2,

              gridColumn: { xs: '1 / -1', lg: '1 / -1' },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                color: 'secondary.dark',
                letterSpacing: '0.08em',
                lineHeight: 1.5,
              }}
            >
              General
            </Typography>

            <Box
              sx={{
                display: 'grid',

                gap: 2,

                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
              }}
            >
              <TextField
                label="Nombre"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                required
                fullWidth
              />

              <FormControl>
                <InputLabel id="equipment-role-edit">Rol</InputLabel>

                <Select
                  labelId="equipment-role-edit"
                  label="Rol"
                  value={formData.role}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, role: event.target.value }))
                  }
                >
                  {ROLE_OPTIONS.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <InputLabel id="equipment-status-edit">Estado</InputLabel>

                <Select
                  labelId="equipment-status-edit"
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
            </Box>
          </Box>

          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              display: 'grid',

              gap: 2,

              gridColumn: { xs: '1 / -1', lg: '1 / 2' },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                color: 'secondary.dark',
                letterSpacing: '0.08em',
                lineHeight: 1.5,
              }}
            >
              Programación
            </Typography>

            <Box
              sx={{
                display: 'grid',

                gap: 2,

                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              }}
            >
              <TextField
                label="Días inspección"
                type="number"
                value={formData.inspection_days}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,

                    inspection_days: event.target.value,
                  }))
                }
              />

              <TextField
                label="Días calibración"
                type="number"
                value={formData.calibration_days}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,

                    calibration_days: event.target.value,
                  }))
                }
              />

              <TextField
                label="Días mantenimiento"
                type="number"
                value={formData.maintenance_days}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,

                    maintenance_days: event.target.value,
                  }))
                }
              />
            </Box>
          </Box>

          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              display: 'grid',

              gap: 1.5,

              gridColumn: { xs: '1 / -1', lg: '2 / 3' },
            }}
          >
            <Box
              sx={{
                display: 'flex',

                alignItems: 'center',

                justifyContent: 'space-between',

                gap: 2,
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 700,
                  color: 'secondary.dark',
                  letterSpacing: '0.08em',
                  lineHeight: 1.5,
                }}
              >
                Tipos de verificación
              </Typography>

              <Button
                variant="outlined"
                size="small"
                sx={{ height: 40 }}
                onClick={handleAddVerificationType}
                disabled={isVerificationTypeLoading}
              >
                Agregar verificación
              </Button>
            </Box>

            {(editEquipmentType?.verification_types || []).length === 0 ? (
              <Typography color="text.secondary">
                No hay tipos de verificación registrados.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',

                  gap: 1,

                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                }}
              >
                {(editEquipmentType?.verification_types || []).map((typeItem, index) => (
                  <Box
                    key={typeItem.id}
                    sx={{
                      border: '1px solid #e5e7eb',

                      borderRadius: 1.5,

                      padding: 1,

                      backgroundColor: '#f9fafb',

                      display: 'grid',

                      gap: 1,

                      gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto auto' },

                      alignItems: 'center',
                    }}
                  >
                    <TextField
                      label="Nombre"
                      size="small"
                      value={typeItem.name || ''}
                      onChange={(event) =>
                        setEditEquipmentType((prev) => {
                          if (!prev) return prev

                          const current = Array.isArray(prev.verification_types)
                            ? prev.verification_types
                            : []

                          const next = current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, name: event.target.value } : item,
                          )

                          return { ...prev, verification_types: next }
                        })
                      }
                    />

                    <TextField
                      label="Días"
                      size="small"
                      type="number"
                      value={typeItem.frequency_days ?? 0}
                      onChange={(event) =>
                        setEditEquipmentType((prev) => {
                          if (!prev) return prev

                          const current = Array.isArray(prev.verification_types)
                            ? prev.verification_types
                            : []

                          const next = current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, frequency_days: event.target.value }
                              : item,
                          )

                          return { ...prev, verification_types: next }
                        })
                      }
                    />

                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="Guardar tipo de verificación"
                      onClick={() => handleSaveVerificationType(typeItem)}
                      disabled={isVerificationTypeLoading}
                    >
                      <SaveOutlined fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      color="error"
                      aria-label="Eliminar tipo de verificación"
                      onClick={() => handleDeleteVerificationType(typeItem)}
                      disabled={isVerificationTypeLoading}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              display: 'grid',

              gap: 2,

              gridColumn: { xs: '1 / -1', lg: '1 / 2' },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                color: 'secondary.dark',
                letterSpacing: '0.08em',
                lineHeight: 1.5,
              }}
            >
              Medidas y tolerancias
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={!formData.has_measures}
                  onChange={(event) => {
                    const disableMeasures = event.target.checked

                    setFormData((prev) => ({
                      ...prev,

                      has_measures: !disableMeasures,
                    }))

                    if (disableMeasures) {
                      setMeasures([])

                      setMeasureToAdd('')

                      setMaxErrors({})
                    }
                  }}
                />
              }
              label="Este tipo no requiere medidas (pesadas)."
            />

            <Box
              sx={{
                display: 'grid',

                gap: 2,

                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },

                alignItems: 'start',
              }}
            >
              <FormControl>
                <InputLabel id="equipment-measures-edit">Medidas</InputLabel>

                <Select
                  labelId="equipment-measures-edit"
                  label="Medidas"
                  multiple
                  value={measures}
                  onChange={(event) => handleMeasuresChange(event.target.value)}
                  disabled={!formData.has_measures}
                  renderValue={(selected) =>
                    selected

                      .map(
                        (value) =>
                          MEASURE_OPTIONS.find((option) => option.value === value)?.label || value,
                      )

                      .join(', ')
                  }
                >
                  {MEASURE_OPTIONS.map((measure) => (
                    <MenuItem key={measure.value} value={measure.value}>
                      <Checkbox checked={measures.indexOf(measure.value) > -1} />

                      <ListItemText primary={measure.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {formData.has_measures && measures.length > 0 ? (
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 700,
                      color: 'secondary.dark',
                      letterSpacing: '0.08em',
                      lineHeight: 1.5,
                    }}
                  >
                    Error máximo por medida
                  </Typography>

                  {measures.map((measure) => (
                    <Box
                      key={measure}
                      sx={{
                        display: 'grid',

                        gap: 2,

                        gridTemplateColumns:
                          'minmax(120px, 2fr) minmax(90px, 1fr) minmax(130px, 1fr)',

                        alignItems: 'center',
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {MEASURE_OPTIONS.find((option) => option.value === measure)?.label ||
                          measure}
                      </Typography>

                      <TextField
                        label="Valor"
                        type="number"
                        value={maxErrors[measure]?.max_error_value ?? ''}
                        onChange={(event) =>
                          setMaxErrors((prev) => ({
                            ...prev,

                            [measure]: {
                              ...prev[measure],

                              max_error_value: event.target.value,
                            },
                          }))
                        }
                      />

                      <FormControl sx={{ minWidth: 130 }}>
                        <InputLabel id={`max-error-unit-edit-${measure}`}>Unidad</InputLabel>

                        <Select
                          labelId={`max-error-unit-edit-${measure}`}
                          label="Unidad"
                          value={maxErrors[measure]?.unit || ''}
                          onChange={(event) =>
                            setMaxErrors((prev) => ({
                              ...prev,

                              [measure]: {
                                ...prev[measure],

                                unit: event.target.value,
                              },
                            }))
                          }
                        >
                          {getUnitOptions(measure).map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  {formData.has_measures
                    ? 'Selecciona medidas para configurar errores máximos.'
                    : 'No aplica.'}
                </Typography>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              display: 'grid',

              gap: 1.5,

              gridColumn: { xs: '1 / -1', lg: '2 / 3' },
            }}
          >
            <Box
              sx={{
                display: 'flex',

                alignItems: 'center',

                justifyContent: 'space-between',

                gap: 2,
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 700,
                  color: 'secondary.dark',
                  letterSpacing: '0.08em',
                  lineHeight: 1.5,
                }}
              >
                Ítems de inspección
              </Typography>

              <Button variant="outlined" size="small" onClick={openAddInspectionItem}>
                Agregar ítem
              </Button>
            </Box>

            {(editEquipmentType?.inspection_items || []).length === 0 ? (
              <Typography color="text.secondary">
                No hay ítems de inspección registrados.
              </Typography>
            ) : (
              <Box
                sx={{
                  mt: 0.5,

                  display: 'grid',

                  gap: 1,

                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },

                  maxHeight: { lg: 280 },

                  overflow: 'auto',
                }}
              >
                {(editEquipmentType?.inspection_items || []).map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      border: '1px solid #e5e7eb',

                      borderRadius: 1.5,

                      padding: 1,

                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'space-between',

                        gap: 1,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>{item.item}</Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => openEditInspectionItem(item)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>

                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteInspectionItem(item)}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {renderInspectionExpected(item)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <TextField
            label="Observaciones"
            value={formData.observations}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, observations: event.target.value }))
            }
            multiline
            minRows={2}
            fullWidth
            sx={{ gridColumn: { xs: '1 / -1', lg: '1 / -1' } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closeEdit}>Cancelar</Button>

          <Button variant="contained" onClick={handleUpdate}>
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isViewOpen} onClose={preventBackdropClose(closeView)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Detalle de tipo de equipo
        </DialogTitle>

        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              backgroundColor: '#fdfafe',

              display: 'grid',

              gap: 1.5,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                color: 'secondary.dark',
                letterSpacing: '0.08em',
                lineHeight: 1.5,
              }}
            >
              General
            </Typography>

            <Box
              sx={{
                display: 'grid',

                gap: 2,

                gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },

                alignItems: 'start',
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    color: 'secondary.dark',
                    letterSpacing: '0.08em',
                    lineHeight: 1.5,
                  }}
                >
                  Nombre
                </Typography>

                <Typography sx={{ fontWeight: 600 }}>{viewEquipmentType?.name || '-'}</Typography>
              </Box>

              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    color: 'secondary.dark',
                    letterSpacing: '0.08em',
                    lineHeight: 1.5,
                  }}
                >
                  Rol
                </Typography>

                <EquipmentTypeRoleBadge role={viewEquipmentType?.role} />
              </Box>

              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    color: 'secondary.dark',
                    letterSpacing: '0.08em',
                    lineHeight: 1.5,
                  }}
                >
                  Estado
                </Typography>

                {viewEquipmentType?.is_active === undefined
                  ? '-'
                  : <EquipmentTypeStatusBadge isActive={viewEquipmentType.is_active} />}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              border: '1px solid #e5e7eb',

              borderTop: '2px solid rgba(227, 28, 121, 0.2)',

              borderRadius: 2,

              p: 2,

              display: 'grid',

              gap: 1.5,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                color: 'secondary.dark',
                letterSpacing: '0.08em',
                lineHeight: 1.5,
              }}
            >
              Parámetros técnicos
            </Typography>

            <Box
              sx={{
                display: 'grid',

                gap: 2,

                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    color: 'secondary.dark',
                    letterSpacing: '0.08em',
                    lineHeight: 1.5,
                  }}
                >
                  Medidas
                </Typography>

                <Typography>
                  {(viewEquipmentType?.measures || [])

                    .map(
                      (measure) =>
                        MEASURE_OPTIONS.find((option) => option.value === measure)?.label ||
                        measure,
                    )

                    .join(', ') || '-'}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    color: 'secondary.dark',
                    letterSpacing: '0.08em',
                    lineHeight: 1.5,
                  }}
                >
                  Error máximo (unidad base)
                </Typography>

                <Typography>{renderMaxErrors(viewEquipmentType?.max_errors)}</Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',

                gap: 2,

                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    color: 'secondary.dark',
                    letterSpacing: '0.08em',
                    lineHeight: 1.5,
                  }}
                >
                  Inspección
                </Typography>

                <Typography>{formatDaysWithUnit(viewEquipmentType?.inspection_days)}</Typography>
              </Box>

              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    color: 'secondary.dark',
                    letterSpacing: '0.08em',
                    lineHeight: 1.5,
                  }}
                >
                  Calibración
                </Typography>

                <Typography>{formatDaysWithUnit(viewEquipmentType?.calibration_days)}</Typography>
              </Box>

              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    color: 'secondary.dark',
                    letterSpacing: '0.08em',
                    lineHeight: 1.5,
                  }}
                >
                  Mantenimiento
                </Typography>

                <Typography>{formatDaysWithUnit(viewEquipmentType?.maintenance_days)}</Typography>
              </Box>
            </Box>

            <Box>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 700,
                  color: 'secondary.dark',
                  letterSpacing: '0.08em',
                  lineHeight: 1.5,
                }}
              >
                Tipos de verificación
              </Typography>

              {(viewEquipmentType?.verification_types || []).length === 0 ? (
                <Typography color="text.secondary">
                  No hay tipos de verificación registrados.
                </Typography>
              ) : (
                <Typography>
                  {(viewEquipmentType?.verification_types || [])

                    .map((typeItem) => {
                      const days = Number(typeItem.frequency_days ?? 0)

                      const freq =
                        days <= 0 ? 'No aplica' : `${days} ${days === 1 ? 'dia' : 'dias'}`

                      return `${typeItem.name}: ${freq}`
                    })

                    .join(', ')}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 700,
                  color: 'secondary.dark',
                  letterSpacing: '0.08em',
                  lineHeight: 1.5,
                }}
              >
                Observaciones
              </Typography>

              <Typography>{viewEquipmentType?.observations || '-'}</Typography>
            </Box>
          </Box>

          <Box sx={{ width: '100%' }}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                color: 'secondary.dark',
                letterSpacing: '0.08em',
                lineHeight: 1.5,
              }}
            >
              Ítems de inspección
            </Typography>

            {(viewEquipmentType?.inspection_items || []).length === 0 ? (
              <Typography color="text.secondary">
                No hay ítems de inspección registrados.
              </Typography>
            ) : (
              <Box
                sx={{
                  mt: 0.5,

                  display: 'grid',

                  gap: 1,

                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                }}
              >
                {(viewEquipmentType?.inspection_items || []).map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      border: '1px solid #e5e7eb',

                      borderRadius: 1.5,

                      padding: 1.25,

                      backgroundColor: '#f9fafb',
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{item.item}</Typography>

                    <Typography variant="body2" color="text.secondary">
                      {renderInspectionExpected(item)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closeView}>Cerrar</Button>

          <Button
            variant="outlined"
            onClick={() => {
              if (viewEquipmentType) {
                closeView()

                openEdit(viewEquipmentType)
              }
            }}
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isAddItemOpen}
        onClose={preventBackdropClose(closeAddInspectionItem)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          {inspectionItemMode === 'edit'
            ? 'Editar ítem de inspección'
            : 'Agregar ítem de inspección'}
        </DialogTitle>

        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2, overflow: 'visible' }}>
          <TextField
            label="Item"
            value={inspectionItemForm.item}
            onChange={(event) =>
              setInspectionItemForm((prev) => ({ ...prev, item: event.target.value }))
            }
            required
          />

          <FormControl>
            <InputLabel id="inspection-response-type-label">Tipo de respuesta</InputLabel>

            <Select
              labelId="inspection-response-type-label"
              label="Tipo de respuesta"
              value={inspectionItemForm.response_type}
              onChange={(event) =>
                setInspectionItemForm((prev) => ({
                  ...prev,

                  response_type: event.target.value,

                  expected_bool: null,

                  expected_text_options: '',

                  expected_number: '',

                  expected_number_min: '',

                  expected_number_max: '',
                }))
              }
            >
              <MenuItem value="boolean">Booleano</MenuItem>

              <MenuItem value="text">Texto</MenuItem>

              <MenuItem value="number">Número</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(inspectionItemForm.is_required)}
                onChange={(event) =>
                  setInspectionItemForm((prev) => ({
                    ...prev,

                    is_required: event.target.checked,
                  }))
                }
              />
            }
            label="Requerido"
          />

          <TextField
            label="Orden"
            type="number"
            value={inspectionItemForm.order}
            onChange={(event) =>
              setInspectionItemForm((prev) => ({
                ...prev,

                order: event.target.value,
              }))
            }
          />

          {inspectionItemForm.response_type === 'boolean' ? (
            <FormControl>
              <InputLabel id="inspection-expected-bool-label">Valor esperado</InputLabel>

              <Select
                labelId="inspection-expected-bool-label"
                label="Valor esperado"
                value={
                  inspectionItemForm.expected_bool === null
                    ? ''
                    : inspectionItemForm.expected_bool
                      ? 'true'
                      : 'false'
                }
                onChange={(event) =>
                  setInspectionItemForm((prev) => ({
                    ...prev,

                    expected_bool: event.target.value === '' ? null : event.target.value === 'true',
                  }))
                }
              >
                <MenuItem value="">Sin validacion</MenuItem>

                <MenuItem value="true">Si</MenuItem>

                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          ) : null}

          {inspectionItemForm.response_type === 'text' ? (
            <TextField
              label="Opciones (separadas por coma)"
              value={inspectionItemForm.expected_text_options}
              onChange={(event) =>
                setInspectionItemForm((prev) => ({
                  ...prev,

                  expected_text_options: event.target.value,
                }))
              }
            />
          ) : null}

          {inspectionItemForm.response_type === 'number' ? (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <TextField
                label="Valor esperado"
                type="number"
                value={inspectionItemForm.expected_number}
                onChange={(event) =>
                  setInspectionItemForm((prev) => ({
                    ...prev,

                    expected_number: event.target.value,
                  }))
                }
              />

              <TextField
                label="Min"
                type="number"
                value={inspectionItemForm.expected_number_min}
                onChange={(event) =>
                  setInspectionItemForm((prev) => ({
                    ...prev,

                    expected_number_min: event.target.value,
                  }))
                }
              />

              <TextField
                label="Max"
                type="number"
                value={inspectionItemForm.expected_number_max}
                onChange={(event) =>
                  setInspectionItemForm((prev) => ({
                    ...prev,

                    expected_number_max: event.target.value,
                  }))
                }
              />
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closeAddInspectionItem}>Cancelar</Button>

          <Button variant="contained" onClick={handleAddInspectionItem} disabled={isAddItemLoading}>
            {isAddItemLoading
              ? 'Guardando...'
              : inspectionItemMode === 'edit'
                ? 'Guardar cambios'
                : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteOpen}
        onClose={preventBackdropClose(closeDelete)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Confirmar eliminación
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            {viewEquipmentType
              ? `Vas a eliminar ${viewEquipmentType.name}.`
              : 'Vas a eliminar este tipo de equipo.'}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
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
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Guardando tipo...
        </DialogTitle>

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
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Actualizando tipo...
        </DialogTitle>

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

export default EquipmentTypesTable
