
import { useMemo, useState } from 'react'
import {
  Add,
  DeleteOutline,
  EditOutlined,
  FilterAltOff,
  SaveOutlined,
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
} from '../services/api'

const ROLE_OPTIONS = [
  { value: 'reference', label: 'Patron' },
  { value: 'working', label: 'Trabajo' },
]

const MEASURE_OPTIONS = [
  { value: 'temperature', label: 'Temperatura' },
  { value: 'pressure', label: 'Presion' },
  { value: 'length', label: 'Longitud' },
  { value: 'weight', label: 'Peso' },
]

const EquipmentTypesTable = ({
  equipmentTypes,
  equipmentTypesError,
  isEquipmentTypesLoading,
  tokenType,
  accessToken,
  onEquipmentTypeChanged,
}) => {
  const getDefaultVerificationTypes = () => [
    {
      name: 'Verificacion diaria',
      frequency_days: 1,
      is_active: true,
      order: 0,
    },
  ]

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
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
  })
  const [verificationTypesForm, setVerificationTypesForm] = useState(
    getDefaultVerificationTypes()
  )
  const [measures, setMeasures] = useState([])
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

  const hasActiveFilters =
    query.trim().length > 0 || statusFilter !== 'all' || roleFilter !== 'all'

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
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? item.is_active
            : !item.is_active
      const matchesRole =
        roleFilter === 'all' ? true : item.role === roleFilter
      const name = String(item.name || '').toLowerCase()
      const role = String(item.role || '').toLowerCase()
      const matchesQuery =
        !normalized ||
        name.includes(normalized) ||
        role.includes(normalized)
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
    })
    setVerificationTypesForm(getDefaultVerificationTypes())
    setMeasures([])
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
        message: 'El item es obligatorio.',
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
          const prevItems = Array.isArray(prev.inspection_items)
            ? prev.inspection_items
            : []
          const nextItems = prevItems.map((item) =>
            item.id === updated.id ? updated : item
          )
          return { ...prev, inspection_items: nextItems }
        })
        setToast({
          open: true,
          message: 'Item de inspeccion actualizado.',
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
          const prevItems = Array.isArray(prev.inspection_items)
            ? prev.inspection_items
            : []
          const nextItems = [...prevItems, newItem].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0)
          )
          return { ...prev, inspection_items: nextItems }
        })
        setToast({
          open: true,
          message: 'Item de inspeccion agregado.',
          severity: 'success',
        })
      }
      closeAddInspectionItem()
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo guardar el item de inspeccion.',
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
        const prevItems = Array.isArray(prev.inspection_items)
          ? prev.inspection_items
          : []
        const nextItems = prevItems.filter((entry) => entry.id !== item.id)
        return { ...prev, inspection_items: nextItems }
      })
      setToast({
        open: true,
        message: 'Item de inspeccion eliminado.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar el item de inspeccion.',
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
        const current = Array.isArray(prev.verification_types)
          ? prev.verification_types
          : []
        const next = [...current, created].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        )
        return { ...prev, verification_types: next }
      })
      setToast({
        open: true,
        message: 'Tipo de verificacion agregado.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo agregar el tipo de verificacion.',
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
        message: 'El nombre de la verificacion es obligatorio.',
        severity: 'error',
      })
      return
    }
    if (Number.isNaN(frequencyDays) || frequencyDays < 0) {
      setToast({
        open: true,
        message: 'La frecuencia de verificacion debe ser un numero valido.',
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
        const current = Array.isArray(prev.verification_types)
          ? prev.verification_types
          : []
        const next = current
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        return { ...prev, verification_types: next }
      })
      setToast({
        open: true,
        message: 'Tipo de verificacion actualizado.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo actualizar el tipo de verificacion.',
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
        const current = Array.isArray(prev.verification_types)
          ? prev.verification_types
          : []
        const next = current.filter((item) => item.id !== typeItem.id)
        return { ...prev, verification_types: next }
      })
      setToast({
        open: true,
        message: 'Tipo de verificacion eliminado.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar el tipo de verificacion.',
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
    if (!measures.length) {
      return 'Selecciona al menos una medida.'
    }
    if (!verificationTypesForm.length) {
      return 'Agrega al menos un tipo de verificacion.'
    }
    const invalidVerificationType = verificationTypesForm.find(
      (typeItem) =>
        !String(typeItem.name || '').trim() ||
        typeItem.frequency_days === '' ||
        typeItem.frequency_days === null ||
        Number.isNaN(Number(typeItem.frequency_days))
    )
    if (invalidVerificationType) {
      return 'Completa nombre y frecuencia de cada tipo de verificacion.'
    }
    const missing = measures.find(
      (measure) =>
        !String(maxErrors[measure]?.unit || '').trim() ||
        maxErrors[measure]?.max_error_value === '' ||
        maxErrors[measure]?.max_error_value === null ||
        Number.isNaN(Number(maxErrors[measure]?.max_error_value))
    )
    if (missing) {
      return 'Completa unidad y valor de error maximo para cada medida.'
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
      const createdEquipmentType = await createEquipmentType({
        tokenType,
        accessToken,
        payload: buildPayload(),
      })
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
            })
          )
        )
      }
      if (onEquipmentTypeChanged) {
        await onEquipmentTypeChanged()
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
      await updateEquipmentType({
        tokenType,
        accessToken,
        equipmentTypeId,
        payload: buildPayload(),
      })
      if (onEquipmentTypeChanged) {
        await onEquipmentTypeChanged()
      }
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
      await deleteEquipmentType({ tokenType, accessToken, equipmentTypeId })
      if (onEquipmentTypeChanged) {
        await onEquipmentTypeChanged()
      }
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

  const renderRoleBadge = (role) => {
    const colors =
      role === 'reference'
        ? { fg: '#1d4ed8', bg: '#dbeafe' }
        : { fg: '#0f766e', bg: '#ccfbf1' }
    const label =
      ROLE_OPTIONS.find((option) => option.value === role)?.label || role || '-'
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
        {label}
      </Box>
    )
  }

  const renderDaysValue = (value) => {
    const numeric = Number(value ?? 0)
    return numeric === 0 ? 'No Aplica' : numeric
  }

  const renderDaysWithUnit = (value) => {
    const numeric = Number(value ?? 0)
    if (numeric <= 0) return 'No aplica'
    return `${numeric} ${numeric === 1 ? 'dia' : 'dias'}`
  }

  const renderDaysWithUnitLower = (value) => {
    const numeric = Number(value ?? 0)
    if (numeric <= 0) return 'No aplica'
    return `${numeric} ${numeric === 1 ? 'dia' : 'dias'}`
  }

  const renderVerificationTypesSummary = (verificationTypes = []) => {
    if (!Array.isArray(verificationTypes) || verificationTypes.length === 0) {
      return '-'
    }
    const summary = verificationTypes
      .filter((item) => item?.is_active !== false)
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
      .map((item) => {
        const days = Number(item?.frequency_days ?? 0)
        if (days === 0) return 'No aplica'
        return `${days} ${days === 1 ? 'dia' : 'dias'}`
      })
      .join(', ')
    return summary || '-'
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
      default:
        return []
    }
  }

  const getBaseUnit = (measure) => {
    switch (measure) {
      case 'temperature':
        return 'c'
      case 'weight':
        return 'g'
      case 'length':
        return 'mm'
      case 'pressure':
        return 'pa'
      default:
        return ''
    }
  }

  const getBaseUnitLabel = (measure) => {
    const unitValue = getBaseUnit(measure)
    if (!unitValue) return ''
    return (
      getUnitOptions(measure).find((option) => option.value === unitValue)?.label ||
      unitValue
    )
  }

  const renderMaxErrors = (errors = []) => {
    if (!errors.length) return '-'
    return errors
      .map((entry) => {
        const label =
          MEASURE_OPTIONS.find((option) => option.value === entry.measure)?.label ||
          entry.measure
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
                  }}
                >
                  <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
                    Tipos de equipo
                  </Typography>
                  <Button
                    type="button"
                    variant="contained"
                    size="small"
                    startIcon={<Add fontSize="small" />}
                    onClick={openCreate}
                    sx={{ height: 40 }}
                  >
                    Nuevo tipo
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    placeholder="Buscar por nombre o rol"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setPage(1)
                    }}
                    sx={{ minWidth: 260, flex: '1 1 260px' }}
                  />
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel id="equipment-role-filter">Rol</InputLabel>
                    <Select
                      labelId="equipment-role-filter"
                      value={roleFilter}
                      label="Rol"
                      onChange={(event) => {
                        setRoleFilter(event.target.value)
                        setPage(1)
                      }}
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      {ROLE_OPTIONS.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="equipment-status-filter">Estado</InputLabel>
                    <Select
                      labelId="equipment-status-filter"
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
                    label={`${filteredEquipmentTypes.length} resultados`}
                    size="small"
                    sx={{ backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: 600 }}
                  />
                </Box>
                {equipmentTypesError ? (
                  <Typography className="error" component="p">
                    {equipmentTypesError}
                  </Typography>
                ) : null}
                {!equipmentTypesError && !isEquipmentTypesLoading && filteredEquipmentTypes.length === 0 ? (
                  <Typography className="meta" component="p">
                    No hay tipos de equipo para mostrar.
                  </Typography>
                ) : null}
                {!equipmentTypesError && filteredEquipmentTypes.length > 0 ? (
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
                              Tipo de equipo
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="center">
                            <TableSortLabel
                              active={sortBy === 'inspection'}
                              direction={sortBy === 'inspection' ? sortDir : 'asc'}
                              onClick={() => handleSort('inspection')}
                            >
                              Inspeccion
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="center">Verificaciones</TableCell>
                          <TableCell align="center">
                            <TableSortLabel
                              active={sortBy === 'calibration'}
                              direction={sortBy === 'calibration' ? sortDir : 'asc'}
                              onClick={() => handleSort('calibration')}
                            >
                              Calibracion
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="center">
                            <TableSortLabel
                              active={sortBy === 'maintenance'}
                              direction={sortBy === 'maintenance' ? sortDir : 'asc'}
                              onClick={() => handleSort('maintenance')}
                            >
                              Mantenimiento
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
                        {pagedEquipmentTypes.map((item, index) => (
                          <TableRow
                            key={item.id}
                            hover
                            sx={{
                              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                              '&:hover': { backgroundColor: '#eef2ff' },
                            }}
                          >
                            <TableCell>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography sx={{ fontWeight: 600 }}>
                                  {item.name}
                                </Typography>
                                {renderRoleBadge(item.role)}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {renderDaysWithUnitLower(item.inspection_days)}
                            </TableCell>
                            <TableCell align="center">
                              {renderVerificationTypesSummary(item.verification_types)}
                            </TableCell>
                            <TableCell align="center">
                              {renderDaysWithUnitLower(item.calibration_days)}
                            </TableCell>
                            <TableCell align="center">
                              {renderDaysWithUnitLower(item.maintenance_days)}
                            </TableCell>
                            <TableCell align="center">{renderStatusBadge(item.is_active)}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'inline-flex', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  aria-label="Ver tipo de equipo"
                                  onClick={() => openView(item)}
                                  sx={{ color: '#64748b', '&:hover': { color: '#4338ca' } }}
                                >
                                  <VisibilityOutlined fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  aria-label="Editar tipo de equipo"
                                  onClick={() => openEdit(item)}
                                  sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  aria-label="Eliminar tipo de equipo"
                                  onClick={() => openDelete(item)}
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
                {!equipmentTypesError && filteredEquipmentTypes.length > 0 ? (
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
                        <InputLabel id="equipment-rows-per-page">Filas</InputLabel>
                        <Select
                          labelId="equipment-rows-per-page"
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
                  <DialogTitle>Nuevo tipo de equipo</DialogTitle>
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
                        borderRadius: 2,
                        p: 2,
                        backgroundColor: '#f8fafc',
                        display: 'grid',
                        gap: 2,
                        gridColumn: { xs: '1 / -1', lg: '1 / -1' },
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
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
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, name: event.target.value }))
                          }
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
                        borderRadius: 2,
                        p: 2,
                        display: 'grid',
                        gap: 2,
                        gridColumn: { xs: '1 / -1', lg: '1 / 2' },
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Programacion
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gap: 2,
                          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                        }}
                      >
                        <TextField
                          label="Dias inspeccion"
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
                          label="Dias calibracion"
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
                          label="Dias mantenimiento"
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
                        <Typography variant="subtitle2" color="text.secondary">
                          Tipos de verificacion
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
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
                          Agregar verificacion
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
                                  entryIndex === index
                                    ? { ...entry, name: event.target.value }
                                    : entry
                                )
                              )
                            }
                          />
                          <TextField
                            label="Dias"
                            size="small"
                            type="number"
                            value={typeItem.frequency_days}
                            onChange={(event) =>
                              setVerificationTypesForm((prev) =>
                                prev.map((entry, entryIndex) =>
                                  entryIndex === index
                                    ? { ...entry, frequency_days: event.target.value }
                                    : entry
                                )
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
                        borderRadius: 2,
                        p: 2,
                        display: 'grid',
                        gap: 2,
                        gridColumn: { xs: '1 / -1', lg: '1 / -1' },
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Medidas y tolerancias
                      </Typography>
                      <FormControl>
                        <InputLabel id="equipment-measures-label">Medidas</InputLabel>
                        <Select
                          labelId="equipment-measures-label"
                          label="Medidas"
                          multiple
                          value={measures}
                          onChange={(event) => handleMeasuresChange(event.target.value)}
                          renderValue={(selected) =>
                            selected
                              .map(
                                (value) =>
                                  MEASURE_OPTIONS.find((option) => option.value === value)?.label ||
                                  value
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
                        <FormHelperText>
                          Si usas presion, el backend puede requerir unidades soportadas.
                        </FormHelperText>
                      </FormControl>

                      {measures.length > 0 ? (
                        <Box sx={{ display: 'grid', gap: 1.5 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Error maximo por medida
                          </Typography>
                          {measures.map((measure) => (
                            <Box
                              key={measure}
                              sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: 'minmax(120px, 2fr) minmax(90px, 1fr) minmax(130px, 1fr)',
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
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography color="text.secondary">
                          Selecciona medidas para configurar errores maximos.
                        </Typography>
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
                      sx={{ gridColumn: { xs: '1 / -1', lg: '1 / -1' } }}
                    />
                    <FormHelperText sx={{ gridColumn: { xs: '1 / -1', lg: '1 / -1' } }}>
                      Nota: Los items de inspeccion se agregan despues de crear el tipo de equipo.
                    </FormHelperText>
                  </DialogContent>
                  <DialogActions>
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
                  <DialogTitle>Editar tipo de equipo</DialogTitle>
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
                        borderRadius: 2,
                        p: 2,
                        backgroundColor: '#f8fafc',
                        display: 'grid',
                        gap: 2,
                        gridColumn: { xs: '1 / -1', lg: '1 / -1' },
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
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
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, name: event.target.value }))
                          }
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
                        borderRadius: 2,
                        p: 2,
                        display: 'grid',
                        gap: 2,
                        gridColumn: { xs: '1 / -1', lg: '1 / 2' },
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Programacion
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gap: 2,
                          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                        }}
                      >
                        <TextField
                          label="Dias inspeccion"
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
                          label="Dias calibracion"
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
                          label="Dias mantenimiento"
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
                        <Typography variant="subtitle2" color="text.secondary">
                          Tipos de verificacion
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleAddVerificationType}
                          disabled={isVerificationTypeLoading}
                        >
                          Agregar verificacion
                        </Button>
                      </Box>
                      {(editEquipmentType?.verification_types || []).length === 0 ? (
                        <Typography color="text.secondary">
                          No hay tipos de verificacion registrados.
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
                                      itemIndex === index
                                        ? { ...item, name: event.target.value }
                                        : item
                                    )
                                    return { ...prev, verification_types: next }
                                  })
                                }
                              />
                              <TextField
                                label="Dias"
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
                                        : item
                                    )
                                    return { ...prev, verification_types: next }
                                  })
                                }
                              />
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label="Guardar tipo de verificacion"
                                onClick={() => handleSaveVerificationType(typeItem)}
                                disabled={isVerificationTypeLoading}
                              >
                                <SaveOutlined fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label="Eliminar tipo de verificacion"
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
                        borderRadius: 2,
                        p: 2,
                        display: 'grid',
                        gap: 2,
                        gridColumn: { xs: '1 / -1', lg: '1 / 2' },
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Medidas y tolerancias
                      </Typography>
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
                            renderValue={(selected) =>
                              selected
                                .map(
                                  (value) =>
                                    MEASURE_OPTIONS.find((option) => option.value === value)?.label ||
                                    value
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

                        {measures.length > 0 ? (
                          <Box sx={{ display: 'grid', gap: 1.5 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              sx={{ lineHeight: 1.2 }}
                            >
                              Error maximo por medida
                            </Typography>
                            {measures.map((measure) => (
                              <Box
                                key={measure}
                                sx={{
                                  display: 'grid',
                                  gap: 2,
                                  gridTemplateColumns: 'minmax(120px, 2fr) minmax(90px, 1fr) minmax(130px, 1fr)',
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
                            Selecciona medidas para configurar errores maximos.
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        border: '1px solid #e5e7eb',
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
                        <Typography variant="subtitle2" color="text.secondary">
                          Items de inspeccion
                        </Typography>
                        <Button variant="outlined" size="small" onClick={openAddInspectionItem}>
                          Agregar item
                        </Button>
                      </Box>
                      {(editEquipmentType?.inspection_items || []).length === 0 ? (
                        <Typography color="text.secondary">
                          No hay items de inspeccion registrados.
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
                  <DialogActions>
                    <Button onClick={closeEdit}>Cancelar</Button>
                    <Button variant="contained" onClick={handleUpdate}>
                      Guardar cambios
                    </Button>
                  </DialogActions>
                </Dialog>
                <Dialog
                  open={isViewOpen}
                  onClose={preventBackdropClose(closeView)}
                  fullWidth
                  maxWidth="lg"
                >
                  <DialogTitle>Detalle de tipo de equipo</DialogTitle>
                  <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
                    <Box
                      sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 2,
                        p: 2,
                        backgroundColor: '#f8fafc',
                        display: 'grid',
                        gap: 1.5,
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
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
                          <Typography variant="subtitle2" color="text.secondary">
                            Nombre
                          </Typography>
                          <Typography sx={{ fontWeight: 600 }}>
                            {viewEquipmentType?.name || '-'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Rol
                          </Typography>
                          {renderRoleBadge(viewEquipmentType?.role)}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Estado
                          </Typography>
                          {viewEquipmentType?.is_active === undefined
                            ? '-'
                            : renderStatusBadge(viewEquipmentType.is_active)}
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 2,
                        p: 2,
                        display: 'grid',
                        gap: 1.5,
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Parametros tecnicos
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gap: 2,
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Medidas
                          </Typography>
                          <Typography>
                            {(viewEquipmentType?.measures || [])
                              .map(
                                (measure) =>
                                  MEASURE_OPTIONS.find((option) => option.value === measure)?.label ||
                                  measure
                              )
                              .join(', ') || '-'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Error maximo (unidad base)
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
                          <Typography variant="subtitle2" color="text.secondary">
                            Inspeccion
                          </Typography>
                          <Typography>{renderDaysWithUnit(viewEquipmentType?.inspection_days)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Calibracion
                          </Typography>
                          <Typography>{renderDaysWithUnit(viewEquipmentType?.calibration_days)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Mantenimiento
                          </Typography>
                          <Typography>{renderDaysWithUnit(viewEquipmentType?.maintenance_days)}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Tipos de verificacion
                        </Typography>
                        {(viewEquipmentType?.verification_types || []).length === 0 ? (
                          <Typography color="text.secondary">
                            No hay tipos de verificacion registrados.
                          </Typography>
                        ) : (
                          <Typography>
                            {(viewEquipmentType?.verification_types || [])
                              .map((typeItem) => {
                                const days = Number(typeItem.frequency_days ?? 0)
                                const freq =
                                  days <= 0
                                    ? 'No aplica'
                                    : `${days} ${days === 1 ? 'dia' : 'dias'}`
                                return `${typeItem.name}: ${freq}`
                              })
                              .join(', ')}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Observaciones
                        </Typography>
                        <Typography>{viewEquipmentType?.observations || '-'}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Items de inspeccion
                      </Typography>
                      {(viewEquipmentType?.inspection_items || []).length === 0 ? (
                        <Typography color="text.secondary">No hay items de inspeccion registrados.</Typography>
                      ) : (
                        <Box
                          sx={{
                            mt: 1,
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
                  <DialogActions>
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
                  <DialogTitle>{inspectionItemMode === 'edit' ? 'Editar item de inspeccion' : 'Agregar item de inspeccion'}</DialogTitle>
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
                        <MenuItem value="number">Numero</MenuItem>
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
                              expected_bool:
                                event.target.value === ''
                                  ? null
                                  : event.target.value === 'true',
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
                  <DialogActions>
                    <Button onClick={closeAddInspectionItem}>Cancelar</Button>
                    <Button
                      variant="contained"
                      onClick={handleAddInspectionItem}
                      disabled={isAddItemLoading}
                    >
                      {isAddItemLoading ? 'Guardando...' : inspectionItemMode === 'edit' ? 'Guardar cambios' : 'Guardar'}
                    </Button>
                  </DialogActions>
                </Dialog>
                <Dialog
                  open={isDeleteOpen}
                  onClose={preventBackdropClose(closeDelete)}
                  maxWidth="xs"
                  fullWidth
                >
                  <DialogTitle>Confirmar eliminacion</DialogTitle>
                  <DialogContent>
                    <Typography>
                      {viewEquipmentType
                        ? `Vas a eliminar ${viewEquipmentType.name}.`
                        : 'Vas a eliminar este tipo de equipo.'}
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
                  <DialogTitle>Guardando tipo...</DialogTitle>
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
                  <DialogTitle>Actualizando tipo...</DialogTitle>
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
