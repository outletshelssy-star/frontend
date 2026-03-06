import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoredFilterValue } from '../../utils/storage'
import { formatWithEquipmentResolution } from '../../utils/equipmentSpecUtils'
import {
  todayColombiaStr,
  colombiaMonth,
  colombiaYear,
  formatDateCO,
  formatDateTimeCO,
  utcToColombiaDateStr,
  colombiaMidnightUTC,
  toColombiaDateStr,
} from '../../utils/dateUtils'
import {
  Add,
  Cancel,
  CheckCircle,
  DeleteOutline,
  ErrorOutline,
  EditOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  createEquipment,
  createEquipmentInspection,
  deleteEquipmentInspection,
  createEquipmentVerification,
  deleteEquipment,
  deleteEquipmentVerification,
  deleteEquipmentCalibration,
  fetchEquipmentInspections,
  fetchEquipmentById,
  fetchEquipmentHistory,
  fetchEquipmentTypeInspectionItems,
  fetchUsers,
  fetchEquipmentTypeVerifications,
  fetchEquipmentTypeVerificationItems,
  calculateHydrometerApi60f,
  fetchTerminalProducts,
  updateEquipmentInspection,
  updateEquipment,
} from '../../services/api'
import { useEquipmentCalibrationDialogState } from '../../hooks/useEquipmentCalibrationDialogState'
import { useEquipmentCalibrationSubmit } from '../../hooks/useEquipmentCalibrationSubmit'
import { useEquipmentCalibrationOpenHandlers, mapCalibrationResultsRows } from '../../hooks/useEquipmentCalibrationOpenHandlers'
import { useEquipmentsQuery } from '../../hooks/useEquipmentsQuery'
import { useEquipmentVerificationSubmit } from '../../hooks/useEquipmentVerificationSubmit'
import { useAuthStore } from '../../store/useAuthStore'
import { EquipmentsListPanel } from './EquipmentsListPanel'
import { EquipmentCreateDialog } from './EquipmentCreateDialog'
import { EquipmentEditDialog } from './EquipmentEditDialog'
import { EquipmentFeedbackDialogs } from './EquipmentFeedbackDialogs'
import { CalibrationDialog } from './CalibrationDialog'
import {
  CalibrationHistoryDialog,
  InspectionHistoryDialog,
} from './EquipmentHistoryDialogs'
import {
  CalibrationWaitDialog,
  InspectionBlockedAlertDialog,
  InspectionDialog,
  InspectionNoAptaConfirmDialog,
  InspectionReplaceDialog,
  InspectionWaitDialog,
  VerificationNoAptaConfirmDialog,
  VerificationReplaceDialog,
  VerificationWaitDialog,
} from './InspectionOperationDialogs'
import { VerificationHistoryDialog } from './VerificationHistoryDialog'
import { VerificationDialog } from './VerificationDialog'
import { EquipmentViewDialog } from './EquipmentViewDialog'
import {
  EMPTY_EQUIPMENTS,
  EQUIPMENT_ROLE_LABELS,
  STATUS_OPTIONS,
  WEIGHT_CLASS_OPTIONS,
  WEIGHT_NOMINAL_G_OPTIONS,
  getWeightEmp,
  isCalibrationVigente,
  isInspectionVigente,
  normalizeWeightSerial,
  normalizeWeightToGrams,
  parseComponentSerialsInput,
  serializeComponentSerials,
} from './equipmentUtils'

const PRODUCT_TYPE_LABELS = {
  crudo: 'Crudo',
  gasolina: 'Gasolina',
  diesel: 'Diesel',
}

const toProductTypeLabel = (productType) => {
  const normalized = String(productType || '')
    .trim()
    .toLowerCase()
  if (!normalized) return ''
  if (PRODUCT_TYPE_LABELS[normalized]) return PRODUCT_TYPE_LABELS[normalized]
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const buildHydrometerProductOptions = (products) => {
  if (!Array.isArray(products)) return []
  const seenNames = new Set()
  return products.reduce((acc, item) => {
    const name = String(item?.name || '').trim()
    if (!name) return acc
    const key = name.toLowerCase()
    if (seenNames.has(key)) return acc
    seenNames.add(key)
    const typeLabel = toProductTypeLabel(item?.product_type)
    acc.push({
      value: name,
      label: typeLabel ? `${name} - ${typeLabel}` : name,
    })
    return acc
  }, [])
}

const EquipmentsTable = ({ equipmentTypes, companies, terminals, currentUser }) => {
  const { tokenType, accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const {
    data: equipments = EMPTY_EQUIPMENTS,
    isLoading: isEquipmentsLoading,
    error: equipmentsError,
  } = useEquipmentsQuery()
  const [query, setQuery] = useState(() => getStoredFilterValue('equipment.filters.query', ''))
  const [statusFilter, setStatusFilter] = useState(() =>
    getStoredFilterValue('equipment.filters.status', 'all'),
  )
  const [activeFilter, setActiveFilter] = useState(() =>
    getStoredFilterValue('equipment.filters.active', 'active'),
  )
  const [terminalFilter, setTerminalFilter] = useState(() =>
    getStoredFilterValue('equipment.filters.terminal', 'all'),
  )
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, activeFilter, terminalFilter])
  const [sortBy, setSortBy] = useState('serial')
  const [sortDir, setSortDir] = useState('asc')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUpdateLoading, setIsUpdateLoading] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isVerificationHistoryOpen, setIsVerificationHistoryOpen] = useState(false)
  const [isInspectionOpen, setIsInspectionOpen] = useState(false)
  const [isInspectionLoading, setIsInspectionLoading] = useState(false)
  const [isInspectionWaitOpen, setIsInspectionWaitOpen] = useState(false)
  const [isInspectionBlockedAlertOpen, setIsInspectionBlockedAlertOpen] = useState(false)
  const [inspectionBlockedSerial, setInspectionBlockedSerial] = useState('')
  const [inspectionBlockedTypeName, setInspectionBlockedTypeName] = useState('')
  const [inspectionBlockedRoleLabel, setInspectionBlockedRoleLabel] = useState('')
  const [isInspectionHistoryOpen, setIsInspectionHistoryOpen] = useState(false)
  const [isInspectionNoAptaConfirmOpen, setIsInspectionNoAptaConfirmOpen] = useState(false)
  const [inspectionNoAptaConfirmMessage, setInspectionNoAptaConfirmMessage] = useState('')
  const [inspectionHistoryItems, setInspectionHistoryItems] = useState([])
  const [isCalibrationHistoryOpen, setIsCalibrationHistoryOpen] = useState(false)
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false)
  const [isCalibrationLoading, setIsCalibrationLoading] = useState(false)
  const [isCalibrationWaitOpen, setIsCalibrationWaitOpen] = useState(false)
  const [calibrationEquipment, setCalibrationEquipment] = useState(null)
  const [calibrationFile, setCalibrationFile] = useState(null)
  const [calibrationCertificateUrl, setCalibrationCertificateUrl] = useState('')
  const [calibrationEditMode, setCalibrationEditMode] = useState(false)
  const [calibrationEditingId, setCalibrationEditingId] = useState(null)
  const [calibrationOriginalDate, setCalibrationOriginalDate] = useState('')
  const [calibrationFieldErrors, setCalibrationFieldErrors] = useState({})
  const [calibrationFocusField, setCalibrationFocusField] = useState('')
  const [calibrationForm, setCalibrationForm] = useState({
    calibrated_at: '',
    calibration_company_id: '',
    certificate_number: '',
    notes: '',
  })
  const [calibrationResults, setCalibrationResults] = useState([])
  const [calibrationResultsTemp, setCalibrationResultsTemp] = useState([])
  const [calibrationResultsHumidity, setCalibrationResultsHumidity] = useState([])
  const [isVerificationOpen, setIsVerificationOpen] = useState(false)
  const [isVerificationLoading, setIsVerificationLoading] = useState(false)
  const [isVerificationWaitOpen, setIsVerificationWaitOpen] = useState(false)
  const [isControlChartAlertOpen, setIsControlChartAlertOpen] = useState(false)
  const [controlChartAlertCount, setControlChartAlertCount] = useState(0)
  const [verificationHistoryTypeId, setVerificationHistoryTypeId] = useState('')
  const [isInspectionReplaceOpen, setIsInspectionReplaceOpen] = useState(false)
  const [pendingInspectionPayload, setPendingInspectionPayload] = useState(null)
  const [isVerificationReplaceOpen, setIsVerificationReplaceOpen] = useState(false)
  const [pendingVerificationPayload, setPendingVerificationPayload] = useState(null)
  const [isVerificationNoAptaConfirmOpen, setIsVerificationNoAptaConfirmOpen] = useState(false)
  const [verificationNoAptaConfirmMessage, setVerificationNoAptaConfirmMessage] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [viewEquipment, setViewEquipment] = useState(null)
  const [editingEquipmentId, setEditingEquipmentId] = useState(null)
  const [equipmentHistoryItems, setEquipmentHistoryItems] = useState([])
  const [isEquipmentHistoryLoading, setIsEquipmentHistoryLoading] = useState(false)
  const [equipmentHistoryError, setEquipmentHistoryError] = useState('')
  const [userNameById, setUserNameById] = useState({})
  const [inspectionEquipment, setInspectionEquipment] = useState(null)
  const [inspectionItems, setInspectionItems] = useState([])
  const [inspectionEditMode, setInspectionEditMode] = useState(false)
  const [inspectionEditingId, setInspectionEditingId] = useState(null)
  const [inspectionOriginalDate, setInspectionOriginalDate] = useState('')
  const [inspectionForm, setInspectionForm] = useState({
    notes: '',
    inspected_at: '',
    responses: {},
  })
  const [verificationEquipment, setVerificationEquipment] = useState(null)
  const [verificationTypes, setVerificationTypes] = useState([])
  const [verificationTypesByEquipmentType, setVerificationTypesByEquipmentType] = useState({})
  const [isVerificationTypesLoading, setIsVerificationTypesLoading] = useState(false)
  const [verificationItems, setVerificationItems] = useState([])
  const [verificationEditMode, setVerificationEditMode] = useState(false)
  const [verificationEditingId, setVerificationEditingId] = useState(null)
  const [verificationOriginalDate, setVerificationOriginalDate] = useState('')
  const [hydrometerWorkApi60f, setHydrometerWorkApi60f] = useState('')
  const [hydrometerWorkApi60fError, setHydrometerWorkApi60fError] = useState('')
  const [hydrometerRefApi60f, setHydrometerRefApi60f] = useState('')
  const [hydrometerRefApi60fError, setHydrometerRefApi60fError] = useState('')
  const [hydrometerProductOptions, setHydrometerProductOptions] = useState([])
  const [isHydrometerProductsLoading, setIsHydrometerProductsLoading] = useState(false)
  const [verificationFieldErrors, setVerificationFieldErrors] = useState({})
  const [verificationFocusField, setVerificationFocusField] = useState('')
  const [verificationForm, setVerificationForm] = useState({
    verification_type_id: '',
    notes: '',
    verified_at: '',
    reference_equipment_id: '',
    kf_weight_1: '',
    kf_volume_1: '',
    kf_weight_2: '',
    kf_volume_2: '',
    product_name: 'Crudo',
    thermometer_working_id: '',
    hydrometer_working_value: '',
    hydrometer_reference_value: '',
    thermometer_working_value: '',
    thermometer_reference_value: '',
    thermometer_unit: 'c',
    reading_under_test_f: '',
    reference_reading_f: '',
    balance_reading_value: '',
    balance_unit: 'g',
    reading_under_test_high_value: '',
    reading_under_test_mid_value: '',
    reading_under_test_low_value: '',
    reference_reading_high_value: '',
    reference_reading_mid_value: '',
    reference_reading_low_value: '',
    reading_unit_under_test: 'c',
    reading_unit_reference: 'c',
    responses: {},
  })
  const [verificationRangeMode, setVerificationRangeMode] = useState('last30')
  const [verificationRangeMonth, setVerificationRangeMonth] = useState(
    String(colombiaMonth()),
  )
  const [verificationRangeYear, setVerificationRangeYear] = useState(
    String(colombiaYear()),
  )
  const [deletingEquipment, setDeletingEquipment] = useState(null)
  const [formData, setFormData] = useState({
    internal_code: '',
    serial: '',
    component_serials_text: '',
    model: '',
    brand: '',
    status: 'in_use',
    is_active: true,
    equipment_type_id: '',
    owner_company_id: '',
    terminal_id: '',
    weight_class: '',
    nominal_mass_value: '',
    nominal_mass_unit: '',
  })
  const [measureSpecs, setMeasureSpecs] = useState({})
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const equipmentsErrorMessage = equipmentsError
    ? equipmentsError?.detail ||
      equipmentsError?.message ||
      String(equipmentsError || '') ||
      'No se pudieron cargar los equipos.'
    : ''

  const createEquipmentMutation = useMutation({
    mutationFn: (args) => createEquipment(args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipments'] }),
  })

  const updateEquipmentMutation = useMutation({
    mutationFn: (args) => updateEquipment(args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipments'] }),
  })

  const deleteEquipmentMutation = useMutation({
    mutationFn: (args) => deleteEquipment(args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipments'] }),
  })

  const role = String(currentUser?.user_type || '').toLowerCase()
  const isReadOnly = role === 'visitor'
  const canFilterActive = role === 'superadmin'
  const canSeeAdminStatus = role === 'admin' || role === 'superadmin'
  const canEditInspectionDate = role === 'admin' || role === 'superadmin'
  const canEditVerificationDate = role === 'admin' || role === 'superadmin'
  const canEditCalibrationDate = role === 'admin' || role === 'superadmin'
  const canDeleteEquipment = role === 'admin' || role === 'superadmin'
  const terminalFilterOptions = useMemo(() => {
    const items = Array.isArray(terminals) ? [...terminals] : []
    return items
      .filter((terminal) => terminal?.id !== null && terminal?.id !== undefined)
      .sort((a, b) =>
        String(a?.name || '').localeCompare(String(b?.name || ''), 'es', {
          sensitivity: 'base',
        }),
      )
  }, [terminals])
  const hasActiveFilters =
    query.trim().length > 0 ||
    statusFilter !== 'all' ||
    terminalFilter !== 'all' ||
    (canFilterActive && activeFilter !== 'active')

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('equipment.filters.query', JSON.stringify(query))
    window.localStorage.setItem('equipment.filters.status', JSON.stringify(statusFilter))
    window.localStorage.setItem('equipment.filters.active', JSON.stringify(activeFilter))
    window.localStorage.setItem('equipment.filters.terminal', JSON.stringify(terminalFilter))
  }, [query, statusFilter, activeFilter, terminalFilter])

  useEffect(() => {
    const uniqueTypeIds = Array.from(
      new Set(
        (equipments || [])
          .map((item) => item?.equipment_type_id)
          .filter((id) => id !== null && id !== undefined),
      ),
    )
    if (!uniqueTypeIds.length || !accessToken) {
      setIsVerificationTypesLoading(false)
      setVerificationTypesByEquipmentType({})
      return
    }
    let cancelled = false
    setIsVerificationTypesLoading(true)
    const load = async () => {
      try {
        const results = await Promise.all(
          uniqueTypeIds.map(async (equipmentTypeId) => {
            const data = await fetchEquipmentTypeVerifications({
              tokenType,
              accessToken,
              equipmentTypeId,
            })
            const items = Array.isArray(data?.items) ? data.items : []
            items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            return [String(equipmentTypeId), items]
          }),
        )
        if (cancelled) return
        setVerificationTypesByEquipmentType(Object.fromEntries(results))
      } catch {
        if (!cancelled) {
          setVerificationTypesByEquipmentType({})
        }
      } finally {
        if (!cancelled) {
          setIsVerificationTypesLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [equipments, tokenType, accessToken])

  useEffect(() => {
    if (!isVerificationHistoryOpen) {
      setIsControlChartAlertOpen(false)
      return
    }
    const isTape = isTapeEquipment(viewEquipment)
    const isBalance = isBalanceEquipment(viewEquipment)
    const isKarlFischer = isKarlFischerEquipment(viewEquipment)
    const limit = isTape ? 2 : 0.5
    const isMonthlyHistory = isTape
      ? false
      : isKarlFischer
        ? false
        : isMonthlyVerificationType(viewEquipment, verificationHistoryTypeId)
    const points = buildControlChartPointsFromVerifications(
      getFilteredVerifications(viewEquipment),
      isMonthlyHistory,
      isTape,
      isBalance,
      isKarlFischer,
    )
    const count = points.filter((p) => {
      if (isKarlFischer) {
        if (p.avgFactor == null) return false
        return p.avgFactor > 5.5 || p.avgFactor < 4.5
      }
      if (isBalance) {
        if (p.emp == null || p.diffG == null) return false
        return p.diffG > p.emp || p.diffG < -p.emp
      }
      if (isMonthlyHistory) {
        return (
          p.diffHighF > limit ||
          p.diffHighF < -limit ||
          p.diffMidF > limit ||
          p.diffMidF < -limit ||
          p.diffLowF > limit ||
          p.diffLowF < -limit
        )
      }
      const value = isTape ? p.diffMm : p.diffF
      return value > limit || value < -limit
    }).length
    setControlChartAlertCount(count)
    setIsControlChartAlertOpen(count > 0)
  }, [
    isVerificationHistoryOpen,
    viewEquipment,
    verificationRangeMode,
    verificationRangeMonth,
    verificationRangeYear,
  ])

  useEffect(() => {
    if (!viewEquipment || !Array.isArray(equipments)) return
    const refreshed = equipments.find((item) => String(item?.id) === String(viewEquipment?.id))
    if (refreshed && refreshed !== viewEquipment) {
      setViewEquipment(refreshed)
    }
  }, [equipments, viewEquipment?.id])

  const requiresTemperatureComparison = useMemo(() => {
    const typeName = String(verificationEquipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    const roleType = String(verificationEquipment?.equipment_type?.role || '')
      .trim()
      .toLowerCase()
    return (
      roleType === 'working' &&
      (typeName === 'termometro electronico tl1' ||
        typeName === 'termometro electronico tp7 tp9' ||
        typeName === 'termometro de vidrio')
    )
  }, [verificationEquipment])
  const requiresTapeComparison = useMemo(() => {
    const typeName = String(verificationEquipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    const roleType = String(verificationEquipment?.equipment_type?.role || '')
      .trim()
      .toLowerCase()
    return (
      roleType === 'working' &&
      (typeName === 'cinta metrica plomada fondo' || typeName === 'cinta metrica plomada vacio')
    )
  }, [verificationEquipment])
  const requiresBalanceComparison = useMemo(() => {
    const typeName = String(verificationEquipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    const roleType = String(verificationEquipment?.equipment_type?.role || '')
      .trim()
      .toLowerCase()
    return roleType === 'working' && typeName === 'balanza analitica'
  }, [verificationEquipment])
  const requiresKarlFischerVerification = useMemo(() => {
    const typeName = String(verificationEquipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    return typeName === 'titulador karl fischer'
  }, [verificationEquipment])
  const requiresComparisonReadings =
    requiresTemperatureComparison || requiresTapeComparison || requiresBalanceComparison

  const isTapeEquipment = (equipment) => {
    const typeName = String(equipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    const roleType = String(equipment?.equipment_type?.role || '')
      .trim()
      .toLowerCase()
    return (
      roleType === 'working' &&
      (typeName === 'cinta metrica plomada fondo' || typeName === 'cinta metrica plomada vacio')
    )
  }

  const isThermometerEquipment = (equipment) => {
    const typeName = String(equipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    return (
      typeName === 'termometro electronico tl1' ||
      typeName === 'termometro electronico tp7 tp9' ||
      typeName === 'termometro de vidrio' ||
      typeName === 'termohigrometro'
    )
  }

  const isThermoHygrometerEquipment = (equipment) => {
    const typeName = String(equipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    return typeName === 'termohigrometro'
  }

  const getEmptyCalibrationRow = (unit = '') => ({
    point_label: '',
    reference_value: '',
    measured_value: '',
    unit,
    error_value: '',
    tolerance_value: '',
    volume_value: '',
    systematic_error: '',
    systematic_emp: '',
    random_error: '',
    random_emp: '',
    uncertainty_value: '',
    k_value: '',
    is_ok: '',
    notes: '',
  })

  const splitThermoHygroRows = (equipment, rows) => {
    if (!isThermoHygrometerEquipment(equipment)) return null
    const tempUnits = new Set(['c', 'f', 'k', 'r'])
    const humidityUnits = new Set(['%', '%rh', 'rh'])
    const temp = []
    const humidity = []
    ;(rows || []).forEach((row) => {
      const unit = String(row.unit || '')
        .trim()
        .toLowerCase()
      if (humidityUnits.has(unit)) {
        humidity.push({ ...row, unit: unit || '%' })
        return
      }
      if (tempUnits.has(unit)) {
        temp.push({ ...row, unit: unit || 'c' })
        return
      }
      temp.push({ ...row })
    })
    if (temp.length === 0) temp.push(getEmptyCalibrationRow('c'))
    if (humidity.length === 0) humidity.push(getEmptyCalibrationRow('%'))
    return { temp, humidity }
  }

  const isBalanceEquipment = (equipment) => {
    const equipmentType =
      equipment?.equipment_type ||
      (equipment?.equipment_type_id
        ? (equipmentTypes || []).find((type) => type.id === equipment.equipment_type_id)
        : null)
    const typeName = String(equipmentType?.name || '')
      .trim()
      .toLowerCase()
    return typeName === 'balanza analitica'
  }

  const isHydrometerEquipment = (equipment) => {
    const typeName = String(equipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    return typeName === 'hidrometro'
  }

  const isKarlFischerEquipment = (equipment) => {
    const typeName = String(equipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    return typeName === 'titulador karl fischer'
  }

  const formatTapeReadingsLabel = (values = [], unit) => {
    const cleaned = values
      .filter((value) => value !== null && value !== undefined && value !== '')
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value))
    if (cleaned.length === 0) return '-'
    const unitLabel = unit ? ` ${unit}` : ''
    return `${cleaned.map((value) => value.toFixed(3)).join(', ')}${unitLabel}`
  }

  const getTapeAverage = (values = []) => {
    const cleaned = values
      .filter((value) => value !== null && value !== undefined && value !== '')
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value))
    if (cleaned.length < 2) return null
    return cleaned.reduce((acc, curr) => acc + curr, 0) / cleaned.length
  }

  const parseTapeNotes = (notes = '') => {
    const text = String(notes || '')
    const workMatch = text.match(/Lecturas equipo:\s*\[([^\]]+)\]\s*([a-zA-Z]+)/i)
    const refMatch = text.match(/Lecturas patron:\s*\[([^\]]+)\]\s*([a-zA-Z]+)/i)
    const avgWorkMatch = text.match(/Promedio equipo:\s*([-+]?\d*[.,]?\d+)\s*mm/i)
    const avgRefMatch = text.match(/Promedio patrón:\s*([-+]?\d*[.,]?\d+)\s*mm/i)
    const diffMatch = text.match(/Diferencia\s*\(Patron-Equipo\):\s*([-+]?\d*[.,]?\d+)\s*mm/i)

    const toNumbers = (raw) =>
      raw
        .split(',')
        .map((val) => Number(String(val).trim().replace(',', '.')))
        .filter((val) => !Number.isNaN(val))

    return {
      workValues: workMatch ? toNumbers(workMatch[1]) : [],
      workUnit: workMatch ? workMatch[2] : '',
      refValues: refMatch ? toNumbers(refMatch[1]) : [],
      refUnit: refMatch ? refMatch[2] : '',
      avgWork: avgWorkMatch ? Number(avgWorkMatch[1].replace(',', '.')) : null,
      avgRef: avgRefMatch ? Number(avgRefMatch[1].replace(',', '.')) : null,
      diff: diffMatch ? Number(diffMatch[1].replace(',', '.')) : null,
    }
  }

  const selectedVerificationType = useMemo(
    () =>
      verificationTypes.find(
        (typeItem) => String(typeItem.id) === String(verificationForm.verification_type_id),
      ),
    [verificationTypes, verificationForm.verification_type_id],
  )

  const isMonthlyVerification = Number(selectedVerificationType?.frequency_days) === 30
  const isHydrometerMonthlyVerification =
    isHydrometerEquipment(verificationEquipment) && isMonthlyVerification

  useEffect(() => {
    const terminalId = verificationEquipment?.terminal_id
    if (
      !isVerificationOpen ||
      !verificationEquipment ||
      !isHydrometerEquipment(verificationEquipment) ||
      !terminalId ||
      !accessToken
    ) {
      setHydrometerProductOptions([])
      setIsHydrometerProductsLoading(false)
      return
    }
    let cancelled = false
    setIsHydrometerProductsLoading(true)
    const run = async () => {
      try {
        const data = await fetchTerminalProducts({
          tokenType,
          accessToken,
          terminalId,
        })
        if (cancelled) return
        setHydrometerProductOptions(buildHydrometerProductOptions(data))
      } catch {
        if (cancelled) return
        setHydrometerProductOptions([])
      } finally {
        if (!cancelled) {
          setIsHydrometerProductsLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [isVerificationOpen, verificationEquipment, tokenType, accessToken])

  useEffect(() => {
    if (!isVerificationOpen || !isHydrometerMonthlyVerification) return
    setVerificationForm((prev) => {
      const currentValue = String(prev.product_name || '').trim()
      const hasCurrent = hydrometerProductOptions.some((option) => option.value === currentValue)
      if (hasCurrent) {
        return prev
      }
      return {
        ...prev,
        product_name:
          hydrometerProductOptions.length > 0 ? String(hydrometerProductOptions[0].value) : '',
      }
    })
  }, [isVerificationOpen, isHydrometerMonthlyVerification, hydrometerProductOptions])

  useEffect(() => {
    if (!isHydrometerMonthlyVerification || !accessToken) {
      setHydrometerWorkApi60f('')
      setHydrometerWorkApi60fError('')
      return
    }
    if (
      String(verificationForm.hydrometer_working_value || '').trim() === '' ||
      String(verificationForm.thermometer_working_value || '').trim() === ''
    ) {
      setHydrometerWorkApi60f('')
      setHydrometerWorkApi60fError('')
      return
    }
    const rawApi = Number(verificationForm.hydrometer_working_value)
    const rawTemp = Number(verificationForm.thermometer_working_value)
    if (Number.isNaN(rawApi) || Number.isNaN(rawTemp) || rawApi <= 0) {
      setHydrometerWorkApi60f('')
      setHydrometerWorkApi60fError('')
      return
    }
    const unit = verificationForm.thermometer_unit || 'c'
    const tempF = convertTemperatureToFDisplay(rawTemp, unit)
    if (tempF === null || Number.isNaN(Number(tempF))) {
      setHydrometerWorkApi60f('')
      setHydrometerWorkApi60fError('')
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const data = await calculateHydrometerApi60f({
          tokenType,
          accessToken,
          temp_obs_f: Number(tempF),
          lectura_api: rawApi,
        })
        if (cancelled) return
        setHydrometerWorkApi60f(
          data?.api_60f !== undefined && data?.api_60f !== null ? String(data.api_60f) : '',
        )
        setHydrometerWorkApi60fError('')
      } catch (err) {
        if (cancelled) return
        setHydrometerWorkApi60f('')
        setHydrometerWorkApi60fError(err?.detail || 'No se pudo calcular API a 60F.')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [
    isHydrometerMonthlyVerification,
    accessToken,
    tokenType,
    verificationForm.hydrometer_working_value,
    verificationForm.thermometer_working_value,
  ])

  useEffect(() => {
    if (!isHydrometerMonthlyVerification || !accessToken) {
      setHydrometerRefApi60f('')
      setHydrometerRefApi60fError('')
      return
    }
    if (
      String(verificationForm.hydrometer_reference_value || '').trim() === '' ||
      String(verificationForm.thermometer_reference_value || '').trim() === ''
    ) {
      setHydrometerRefApi60f('')
      setHydrometerRefApi60fError('')
      return
    }
    const rawApi = Number(verificationForm.hydrometer_reference_value)
    const rawTemp = Number(verificationForm.thermometer_reference_value)
    if (Number.isNaN(rawApi) || Number.isNaN(rawTemp) || rawApi <= 0) {
      setHydrometerRefApi60f('')
      setHydrometerRefApi60fError('')
      return
    }
    const unit = verificationForm.thermometer_unit || 'c'
    const tempF = convertTemperatureToFDisplay(rawTemp, unit)
    if (tempF === null || Number.isNaN(Number(tempF))) {
      setHydrometerRefApi60f('')
      setHydrometerRefApi60fError('')
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const data = await calculateHydrometerApi60f({
          tokenType,
          accessToken,
          temp_obs_f: Number(tempF),
          lectura_api: rawApi,
        })
        if (cancelled) return
        setHydrometerRefApi60f(
          data?.api_60f !== undefined && data?.api_60f !== null ? String(data.api_60f) : '',
        )
        setHydrometerRefApi60fError('')
      } catch (err) {
        if (cancelled) return
        setHydrometerRefApi60f('')
        setHydrometerRefApi60fError(err?.detail || 'No se pudo calcular API a 60F.')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [
    isHydrometerMonthlyVerification,
    accessToken,
    tokenType,
    verificationForm.hydrometer_reference_value,
    verificationForm.thermometer_reference_value,
  ])

  const referenceEquipmentOptions = useMemo(() => {
    if (!requiresComparisonReadings || !verificationEquipment) return []
    const isTape = requiresTapeComparison
    const isBalance = requiresBalanceComparison
    return (equipments || []).filter((item) => {
      if (!item?.id || item.id === verificationEquipment.id) return false
      if (item.terminal_id !== verificationEquipment.terminal_id) return false
      if (item.is_active === false) return false
      if (item.status !== 'in_use') return false
      const candidateRole = String(item?.equipment_type?.role || '').toLowerCase()
      if (candidateRole !== 'reference') return false
      const candidateName = String(item?.equipment_type?.name || '')
        .trim()
        .toLowerCase()
      if (isBalance) {
        return candidateName.startsWith('pesa')
      }
      if (requiresTemperatureComparison) {
        const measures = item?.equipment_type?.measures || []
        if (Array.isArray(measures) && measures.length > 0) {
          return measures.includes('temperature')
        }
        const specMeasures = (item?.measure_specs || []).map((spec) => String(spec?.measure || ''))
        if (specMeasures.length > 0) {
          return specMeasures.includes('temperature')
        }
        return false
      }
      if (!isTape) return true
      return (
        candidateName === 'cinta metrica plomada fondo' ||
        candidateName === 'cinta metrica plomada vacio'
      )
    })
  }, [
    equipments,
    verificationEquipment,
    requiresComparisonReadings,
    requiresTapeComparison,
    requiresBalanceComparison,
  ])

  const selectedReferenceEquipment = useMemo(() => {
    const selectedId = String(verificationForm.reference_equipment_id || '')
    if (!selectedId) return null
    return referenceEquipmentOptions.find((item) => String(item.id) === selectedId) || null
  }, [referenceEquipmentOptions, verificationForm.reference_equipment_id])

  const kfBalanceOptions = useMemo(() => {
    if (!requiresKarlFischerVerification || !verificationEquipment) return []
    return (equipments || []).filter((item) => {
      if (!item?.id || item.id === verificationEquipment.id) return false
      if (item.terminal_id !== verificationEquipment.terminal_id) return false
      if (item.is_active === false) return false
      if (item.status !== 'in_use') return false
      const candidateName = String(item?.equipment_type?.name || '')
        .trim()
        .toLowerCase()
      return candidateName === 'balanza analitica'
    })
  }, [equipments, verificationEquipment, requiresKarlFischerVerification])

  const selectedKfBalance = useMemo(() => {
    const selectedId = String(verificationForm.reference_equipment_id || '')
    if (!selectedId) return null
    return kfBalanceOptions.find((item) => String(item.id) === selectedId) || null
  }, [kfBalanceOptions, verificationForm.reference_equipment_id])

  const hydrometerReferenceOptions = useMemo(() => {
    if (!verificationEquipment || !isHydrometerMonthlyVerification) return []
    return (equipments || []).filter((item) => {
      if (!item?.id || item.id === verificationEquipment.id) return false
      if (item.terminal_id !== verificationEquipment.terminal_id) return false
      if (item.is_active === false) return false
      if (item.status !== 'in_use') return false
      const candidateRole = String(item?.equipment_type?.role || '').toLowerCase()
      if (candidateRole !== 'reference') return false
      const candidateName = String(item?.equipment_type?.name || '')
        .trim()
        .toLowerCase()
      return candidateName === 'hidrometro'
    })
  }, [equipments, verificationEquipment, isHydrometerMonthlyVerification])

  const hydrometerThermometerOptions = useMemo(() => {
    if (!verificationEquipment || !isHydrometerMonthlyVerification) return []
    return (equipments || []).filter((item) => {
      if (!item?.id) return false
      if (item.terminal_id !== verificationEquipment.terminal_id) return false
      if (item.is_active === false) return false
      if (item.status !== 'in_use') return false
      const roleType = String(item?.equipment_type?.role || '').toLowerCase()
      if (roleType !== 'working') return false
      const name = String(item?.equipment_type?.name || '')
        .trim()
        .toLowerCase()
      return name.includes('termometro')
    })
  }, [equipments, verificationEquipment, isHydrometerMonthlyVerification])

  const handleClearFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setActiveFilter('active')
    setTerminalFilter('all')
    setPage(1)
  }

  const filteredEquipments = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return equipments.filter((item) => {
      if (!canFilterActive && item.is_active === false) {
        return false
      }
      if (canFilterActive) {
        if (activeFilter === 'active' && item.is_active === false) {
          return false
        }
        if (activeFilter === 'inactive' && item.is_active !== false) {
          return false
        }
      }
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter
      const matchesTerminal =
        terminalFilter === 'all' ? true : String(item.terminal_id || '') === String(terminalFilter)
      const serial = String(item.serial || '').toLowerCase()
      const model = String(item.model || '').toLowerCase()
      const brand = String(item.brand || '').toLowerCase()
      const type = String(item.equipment_type?.name || '').toLowerCase()
      const terminal = String(item.terminal?.name || '').toLowerCase()
      const matchesQuery =
        !normalized ||
        serial.includes(normalized) ||
        model.includes(normalized) ||
        brand.includes(normalized) ||
        type.includes(normalized) ||
        terminal.includes(normalized)
      return matchesStatus && matchesTerminal && matchesQuery
    })
  }, [equipments, query, statusFilter, activeFilter, terminalFilter, role])

  const sortedEquipments = useMemo(() => {
    const getValue = (item) => {
      switch (sortBy) {
        case 'serial':
          return item.serial || ''
        case 'model':
          return item.model || ''
        case 'brand':
          return item.brand || ''
        case 'type':
          return item.equipment_type?.name || ''
        case 'terminal':
          return item.terminal?.name || ''
        case 'status':
          return item.status || ''
        default:
          return ''
      }
    }
    return [...filteredEquipments].sort((a, b) => {
      const aVal = String(getValue(a)).toLowerCase()
      const bVal = String(getValue(b)).toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredEquipments, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredEquipments.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pagedEquipments = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return sortedEquipments.slice(start, start + rowsPerPage)
  }, [sortedEquipments, rowsPerPage, safePage])

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortBy(key)
    setSortDir('asc')
  }

  const renderStatusBadge = (status) => {
    const colorMap = {
      stored: { fg: '#1e3a8a', bg: '#dbeafe' },
      in_use: { fg: '#065f46', bg: '#d1fae5' },
      maintenance: { fg: '#92400e', bg: '#fef3c7' },
      needs_review: { fg: '#9a3412', bg: '#ffedd5' },
      lost: { fg: '#991b1b', bg: '#fee2e2' },
      disposed: { fg: '#6b21a8', bg: '#ede9fe' },
      unknown: { fg: '#374151', bg: '#e5e7eb' },
    }
    const colors = colorMap[status] || { fg: '#374151', bg: '#e5e7eb' }
    const label = STATUS_OPTIONS.find((option) => option.value === status)?.label || status || '-'
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

  const renderAdminStatusBadge = (isActive) => {
    const colors = isActive ? { fg: '#166534', bg: '#dcfce7' } : { fg: '#991b1b', bg: '#fee2e2' }
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
    if (!role) return null
    const normalized = String(role || '').toLowerCase()
    const colors =
      normalized === 'reference'
        ? { fg: '#1d4ed8', bg: '#dbeafe' }
        : { fg: '#0f766e', bg: '#ccfbf1' }
    const label = EQUIPMENT_ROLE_LABELS[normalized] || role || '-'
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

  const formatEquipmentTypeOptionLabel = (type) => {
    const roleKey = String(type?.role || '').toLowerCase()
    const roleLabel = EQUIPMENT_ROLE_LABELS[roleKey] || roleKey || '-'
    return `${type?.name || '-'} (${roleLabel})`
  }

  const isWeightEquipmentType = (type) =>
    String(type?.name || '')
      .toLowerCase()
      .includes('pesa')

  const getEquipmentTypeById = (equipmentTypeId) =>
    equipmentTypes.find((type) => String(type?.id) === String(equipmentTypeId))

  const getEquipmentTypeNameById = (equipmentTypeId) =>
    getEquipmentTypeById(equipmentTypeId)?.name || String(equipmentTypeId || '-')

  const getEquipmentTypeRoleLabelById = (equipmentTypeId) => {
    const roleKey = String(getEquipmentTypeById(equipmentTypeId)?.role || '').toLowerCase()
    return EQUIPMENT_ROLE_LABELS[roleKey] || roleKey || '-'
  }

  const getTerminalNameById = (terminalId) => {
    if (!terminalId) return '-'
    const match = (terminals || []).find((terminal) => String(terminal?.id) === String(terminalId))
    return match?.name || String(terminalId)
  }

  const getStatusLabelByValue = (statusValue) => {
    const normalized = String(statusValue || '')
      .trim()
      .toLowerCase()
    if (!normalized) return '-'
    return STATUS_OPTIONS.find((option) => option.value === normalized)?.label || normalized
  }

  const getCompanyNameById = (companyId) => {
    if (!companyId) return '-'
    const match = (companies || []).find((company) => String(company?.id) === String(companyId))
    return match?.name || String(companyId)
  }

  const formatDateTime = formatDateTimeCO

  const getUserNameById = (userId) => {
    if (!userId) return '-'
    return userNameById[String(userId)] || String(userId)
  }

  const getLatestInspection = (inspections = []) => {
    if (!Array.isArray(inspections) || inspections.length === 0) return null
    const valid = inspections
      .filter((inspection) => inspection?.inspected_at)
      .map((inspection) => ({
        ...inspection,
        date: new Date(inspection.inspected_at),
      }))
      .filter((item) => !Number.isNaN(item.date.getTime()))
    if (!valid.length) return null
    return valid.reduce((max, current) => (current.date > max.date ? current : max))
  }

  const getInspectionResultLabel = (inspection) => {
    if (!inspection) return 'Sin inspecciones'
    if (inspection?.is_ok === true) return 'Apta'
    if (inspection?.is_ok === false) return 'No apta'
    return 'Pendiente'
  }

  const renderInspectionBadge = (equipment) => {
    const latestInspection = getLatestInspection(equipment?.inspections)
    const isFailed = latestInspection?.is_ok === false
    const isValid = isInspectionVigente(equipment)
    const icon = isFailed
      ? <ErrorOutline fontSize="small" />
      : isValid
        ? <CheckCircle fontSize="small" />
        : <Cancel fontSize="small" />
    const color = isFailed ? '#ea580c' : isValid ? '#16a34a' : '#dc2626'
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        {icon}
      </Box>
    )
  }

  const getLastInspectionDateLabel = (inspections = []) => {
    const latest = getLatestInspection(inspections)
    if (!latest) return 'Sin inspecciones'
    return formatDateCO(latest.date)
  }

  const getEquipmentTypeFor = (equipment) => {
    if (!equipment) return null
    if (equipment.equipment_type) return equipment.equipment_type
    if (!equipment.equipment_type_id) return null
    return (equipmentTypes || []).find((type) => type.id === equipment.equipment_type_id) || null
  }

  const getFileNameFromUrl = (url = '') => {
    if (!url) return ''
    try {
      const withoutQuery = url.split('?')[0]
      const parts = withoutQuery.split('/')
      const rawName = parts[parts.length - 1] || ''
      return decodeURIComponent(rawName)
    } catch {
      return ''
    }
  }

  const getCertificateLabel = () => {
    if (calibrationFile) return calibrationFile.name
    const name = getFileNameFromUrl(calibrationCertificateUrl)
    return name || 'Sin archivo seleccionado'
  }

  const getInspectionFrequencyLabel = (equipment) => {
    const equipmentType = getEquipmentTypeFor(equipment)
    const days = equipment?.inspection_days_override ?? equipmentType?.inspection_days
    if (!days || Number(days) === 0) {
      return 'No aplica'
    }
    return `Cada ${days} días`
  }

  const hasInspectionSchedule = (equipment) => {
    const equipmentType = getEquipmentTypeFor(equipment)
    const days = equipment?.inspection_days_override ?? equipmentType?.inspection_days
    return Number(days) > 0
  }

  const shouldSkipInspection = (equipment) =>
    isWeightEquipmentType(getEquipmentTypeFor(equipment)) && !hasInspectionSchedule(equipment)

  const getInspectionTooltip = (equipment) => {
    const last = getLastInspectionDateLabel(equipment?.inspections)
    const frequency = getInspectionFrequencyLabel(equipment)
    const latestInspection = getLatestInspection(equipment?.inspections)
    const result = getInspectionResultLabel(latestInspection)
    return (
      <Box sx={{ display: 'grid', gap: 0.25 }}>
        <Typography variant="caption">Ultima: {last}</Typography>
        <Typography variant="caption">Frecuencia: {frequency}</Typography>
        <Typography variant="caption">Resultado: {result}</Typography>
      </Box>
    )
  }

  const getLatestVerification = (verifications = []) => {
    if (!Array.isArray(verifications) || verifications.length === 0) return null
    const valid = verifications
      .filter((verification) => verification?.verified_at)
      .map((verification) => ({
        ...verification,
        date: new Date(verification.verified_at),
      }))
      .filter((item) => !Number.isNaN(item.date.getTime()))
    if (!valid.length) return null
    return valid.reduce((max, current) => (current.date > max.date ? current : max))
  }

  const getVerificationResultLabel = (verification) => {
    if (!verification) return 'Sin verificaciones'
    if (verification?.is_ok === true) return 'Apta'
    if (verification?.is_ok === false) return 'No apta'
    return 'Pendiente'
  }

  const renderVerificationBadge = (verifications = []) => {
    const latest = getLatestVerification(verifications)
    const isFailed = latest?.is_ok === false
    const hasApproved = Array.isArray(verifications)
      ? verifications.some((verification) => verification?.is_ok === true)
      : false
    const icon = isFailed
      ? <ErrorOutline fontSize="small" />
      : hasApproved
        ? <CheckCircle fontSize="small" />
        : <Cancel fontSize="small" />
    const color = isFailed ? '#ea580c' : hasApproved ? '#16a34a' : '#dc2626'
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        {icon}
      </Box>
    )
  }

  const getLatestCalibration = (calibrations = []) => {
    if (!Array.isArray(calibrations)) return null
    const valid = calibrations
      .filter((calibration) => calibration?.calibrated_at)
      .map((calibration) => ({
        ...calibration,
        date: new Date(calibration.calibrated_at),
      }))
      .filter((item) => !Number.isNaN(item.date.getTime()))
    if (!valid.length) return null
    return valid.reduce((max, current) => (current.date > max.date ? current : max))
  }

  const renderCalibrationBadge = (equipment) => {
    const latestCalibration = getLatestCalibration(equipment?.calibrations || [])
    const hasFailingPoint = Array.isArray(latestCalibration?.results)
      ? latestCalibration.results.some((resultRow) => resultRow?.is_ok === false)
      : false
    const isValid = isCalibrationVigente(equipment)
    const icon = hasFailingPoint
      ? <ErrorOutline fontSize="small" />
      : isValid
        ? <CheckCircle fontSize="small" />
        : <Cancel fontSize="small" />
    const color = hasFailingPoint ? '#ea580c' : isValid ? '#16a34a' : '#dc2626'
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        {icon}
      </Box>
    )
  }

  const getLastCalibrationDateLabel = (calibrations = []) => {
    const latest = getLatestCalibration(calibrations)
    if (!latest) return 'Sin calibraciones'
    return formatDateCO(latest.date)
  }

  const getCalibrationFrequencyLabel = (equipment) => {
    const equipmentType = getEquipmentTypeFor(equipment)
    const days = equipmentType?.calibration_days
    if (!days || Number(days) === 0) {
      return 'No aplica'
    }
    return `Cada ${days} días`
  }

  const getCalibrationTooltip = (equipment) => {
    const latest = getLatestCalibration(equipment?.calibrations || [])
    const frequency = getCalibrationFrequencyLabel(equipment)
    const result = !latest
      ? 'Sin calibraciones'
      : Array.isArray(latest?.results) && latest.results.some((row) => row?.is_ok === false)
        ? 'No apta'
        : Array.isArray(latest?.results) && latest.results.some((row) => row?.is_ok === true)
          ? 'Apta'
          : 'Pendiente'
    if (!latest) {
      return (
        <Box sx={{ display: 'grid', gap: 0.25 }}>
          <Typography variant="caption">Sin calibraciones</Typography>
          <Typography variant="caption">Frecuencia: {frequency}</Typography>
          <Typography variant="caption">Resultado: {result}</Typography>
        </Box>
      )
    }
    return (
      <Box sx={{ display: 'grid', gap: 0.25 }}>
        <Typography variant="caption">Ultima: {formatDateCO(latest.date)}</Typography>
        <Typography variant="caption">Frecuencia: {frequency}</Typography>
        <Typography variant="caption">Resultado: {result}</Typography>
      </Box>
    )
  }

  const getLastVerificationDateLabel = (verifications = []) => {
    if (!Array.isArray(verifications) || verifications.length === 0) {
      return 'Sin verificaciones'
    }
    const validDates = verifications
      .map((verification) => new Date(verification?.verified_at))
      .filter((date) => !Number.isNaN(date.getTime()))
    if (!validDates.length) {
      return 'Sin verificaciones'
    }
    const latest = validDates.reduce((max, current) => (current > max ? current : max))
    return formatDateCO(latest)
  }

  const getLatestVerifications = (equipment, limit = 10) => {
    const verifications = Array.isArray(equipment?.verifications) ? equipment.verifications : []
    return [...verifications]
      .filter((verification) => verification?.verified_at)
      .sort((a, b) => new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime())
      .slice(0, limit)
  }

  const getVerificationTypeLabelById = (equipment, verificationTypeId) => {
    const equipmentTypeId = equipment?.equipment_type_id
    const items = verificationTypesByEquipmentType[String(equipmentTypeId)] || []
    const match = items.find((item) => String(item.id) === String(verificationTypeId))
    return match?.name || `Tipo ${verificationTypeId}`
  }

  const renderVerificationResultLabel = (value) => {
    if (value === true) return { label: 'Apto', color: '#16a34a' }
    if (value === false) return { label: 'No Apto', color: '#dc2626' }
    return { label: 'Pendiente', color: '#64748b' }
  }

  const parseVerificationComparison = (notes = '') => {
    const text = String(notes || '')
    const patronMatch = text.match(/Patron ID:\s*(\d+)/i)
    if (/\[\[HIDROMETRO_DATA\]\]/i.test(text)) {
      const api60WorkMatch = text.match(/API60F equipo:\s*([-+]?\d*\.?\d+)\s*([^|\n]*)/i)
      const api60RefMatch = text.match(/API60F patron:\s*([-+]?\d*\.?\d+)\s*([^|\n]*)/i)
      const diffMatch60 = text.match(/Diferencia API60F:\s*([-+]?\d*\.?\d+)\s*([^|\n]*)/i)
      if (api60WorkMatch && api60RefMatch) {
        const unit = (api60WorkMatch[2] || api60RefMatch[2] || 'API').trim()
        return {
          patronId: patronMatch ? patronMatch[1] : null,
          underTest: `${api60WorkMatch[1]} ${unit}`,
          reference: `${api60RefMatch[1]} ${unit}`,
          diff: diffMatch60 ? `${diffMatch60[1]} ${(diffMatch60[2] || 'API').trim()}` : null,
        }
      }
      const hydroWorkMatch = text.match(/Hidrometro trabajo:\s*([-+]?\d*\.?\d+)\s*([^|\n]*)/i)
      const hydroRefMatch = text.match(/Hidrometro patron:\s*([-+]?\d*\.?\d+)\s*([^|\n]*)/i)
      const workVal = hydroWorkMatch ? Number(hydroWorkMatch[1]) : null
      const refVal = hydroRefMatch ? Number(hydroRefMatch[1]) : null
      const unit = (hydroWorkMatch?.[2] || hydroRefMatch?.[2] || 'API').trim()
      const diff =
        workVal !== null && refVal !== null && !Number.isNaN(workVal) && !Number.isNaN(refVal)
          ? `${(workVal - refVal).toFixed(2)} ${unit}`
          : null
      return {
        patronId: patronMatch ? patronMatch[1] : null,
        underTest: hydroWorkMatch ? `${hydroWorkMatch[1]} ${unit}` : null,
        reference: hydroRefMatch ? `${hydroRefMatch[1]} ${unit}` : null,
        diff,
      }
    }
    const underTestMatch = text.match(/Lectura equipo:\s*([^|]+)/i)
    const referenceMatch = text.match(/Lectura patron:\s*([^|]+)/i)
    const diffMatch = text.match(/Diferencia:\s*([^|]+)/i)
    const isMonthly = /Comparacion\s+mensual/i.test(text)
    if (isMonthly) {
      const altoEquipo = text.match(/Alto equipo:\s*([^|]+)/i)
      const altoPatron = text.match(/Alto patron:\s*([^|]+)/i)
      const medioEquipo = text.match(/Medio equipo:\s*([^|]+)/i)
      const medioPatron = text.match(/Medio patron:\s*([^|]+)/i)
      const bajoEquipo = text.match(/Bajo equipo:\s*([^|]+)/i)
      const bajoPatron = text.match(/Bajo patron:\s*([^|]+)/i)
      const diffAlto = text.match(/Dif\s*Alto:\s*([^|]+)/i)
      const diffMedio = text.match(/Dif\s*Medio:\s*([^|]+)/i)
      const diffBajo = text.match(/Dif\s*Bajo:\s*([^|]+)/i)
      const formatTriplet = (a, b, c) => [a, b, c].filter(Boolean).join(' | ')
      return {
        patronId: patronMatch ? patronMatch[1] : null,
        underTest: formatTriplet(
          altoEquipo ? `Alto: ${altoEquipo[1].trim()}` : null,
          medioEquipo ? `Medio: ${medioEquipo[1].trim()}` : null,
          bajoEquipo ? `Bajo: ${bajoEquipo[1].trim()}` : null,
        ),
        reference: formatTriplet(
          altoPatron ? `Alto: ${altoPatron[1].trim()}` : null,
          medioPatron ? `Medio: ${medioPatron[1].trim()}` : null,
          bajoPatron ? `Bajo: ${bajoPatron[1].trim()}` : null,
        ),
        diff: formatTriplet(
          diffAlto ? `Alto: ${diffAlto[1].trim()}` : null,
          diffMedio ? `Medio: ${diffMedio[1].trim()}` : null,
          diffBajo ? `Bajo: ${diffBajo[1].trim()}` : null,
        ),
      }
    }
    const normalizeUnit = (value) => {
      if (!value) return null
      return value.replace(/\b([cf])\b/g, (match) => match.toUpperCase())
    }
    return {
      patronId: patronMatch ? patronMatch[1] : null,
      underTest: underTestMatch ? normalizeUnit(underTestMatch[1].trim()) : null,
      reference: referenceMatch ? normalizeUnit(referenceMatch[1].trim()) : null,
      diff: diffMatch ? diffMatch[1].trim() : null,
    }
  }

  const parseBalanceComparisonFromNotes = (notes = '') => {
    const text = String(notes || '')
    const patronMatch = text.match(/Patron ID:\s*(\d+)/i)
    const weightMatch = text.match(/Pesa:\s*([^|]+)/i)
    const balanceMatch = text.match(/Lectura balanza:\s*([^|]+)/i)
    const diffMatch = text.match(/Diferencia\s*\(Pesa-Balanza\):\s*([^|]+)/i)
    return {
      patronId: patronMatch ? patronMatch[1] : null,
      weight: weightMatch ? weightMatch[1].trim() : null,
      balance: balanceMatch ? balanceMatch[1].trim() : null,
      diff: diffMatch ? diffMatch[1].trim() : null,
    }
  }

  const parseKarlFischerNotes = (notes = '') => {
    const text = String(notes || '')
    const weight1 = text.match(/Peso1:\s*([-+]?\d*\.?\d+)/i)
    const volume1 = text.match(/Volumen1:\s*([-+]?\d*\.?\d+)/i)
    const weight2 = text.match(/Peso2:\s*([-+]?\d*\.?\d+)/i)
    const volume2 = text.match(/Volumen2:\s*([-+]?\d*\.?\d+)/i)
    const balanceId = text.match(/Balanza ID:\s*(\d+)/i)
    return {
      balanceId: balanceId ? balanceId[1] : null,
      weight1: weight1 ? weight1[1] : null,
      volume1: volume1 ? volume1[1] : null,
      weight2: weight2 ? weight2[1] : null,
      volume2: volume2 ? volume2[1] : null,
    }
  }

  const getKarlFischerAverageFactor = (verification) => {
    if (!verification) return null
    const parsed = parseKarlFischerNotes(verification?.notes || '')
    const w1 = Number(verification?.kf_weight_1 ?? parsed.weight1)
    const v1 = Number(verification?.kf_volume_1 ?? parsed.volume1)
    const w2 = Number(verification?.kf_weight_2 ?? parsed.weight2)
    const v2 = Number(verification?.kf_volume_2 ?? parsed.volume2)
    if ([w1, v1, w2, v2].some((val) => Number.isNaN(val) || !val)) return null
    const f1 = w1 / v1
    const f2 = w2 / v2
    return (f1 + f2) / 2
  }

  const stripKarlFischerNotes = (notes = '') => {
    const text = String(notes || '')
    const kfMarker = '[[KF_DATA]]'
    const markerIndex = text.indexOf(kfMarker)
    if (markerIndex >= 0) {
      return text.slice(0, markerIndex).trim()
    }
    const legacyMarker = 'verificacion karl fischer'
    const lower = text.toLowerCase()
    const index = lower.indexOf(legacyMarker)
    if (index < 0) return text.trim()
    return text.slice(0, index).trim()
  }

  const parseDifferenceToF = (notes = '') => {
    const text = String(notes || '')
    const monthlyMatches = [
      ...text.matchAll(/Dif\s*Alto:\s*([-+]?\d*\.?\d+)\s*([cCfF])?/gi),
      ...text.matchAll(/Dif\s*Medio:\s*([-+]?\d*\.?\d+)\s*([cCfF])?/gi),
      ...text.matchAll(/Dif\s*Bajo:\s*([-+]?\d*\.?\d+)\s*([cCfF])?/gi),
    ]
    if (monthlyMatches.length > 0) {
      const diffsF = monthlyMatches
        .map((match) => {
          const raw = Number(match[1])
          if (Number.isNaN(raw)) return null
          const unit = (match[2] || 'c').toLowerCase()
          return unit === 'f' ? raw : (raw * 9) / 5
        })
        .filter((val) => val !== null)
      if (!diffsF.length) return null
      return Math.max(...diffsF)
    }
    const match = text.match(/Diferencia:\s*([-+]?\d*\.?\d+)\s*([cCfF])?/i)
    if (!match) return null
    const raw = Number(match[1])
    if (Number.isNaN(raw)) return null
    const unit = (match[2] || 'c').toLowerCase()
    if (unit === 'f') return raw
    return (raw * 9) / 5
  }

  const parseDifferenceToMm = (notes = '') => {
    const text = String(notes || '')
    const match = text.match(/Diferencia\s*\(Patron-Equipo\):\s*([-+]?\d*\.?\d+)\s*mm/i)
    if (!match) return null
    const raw = Number(match[1])
    if (Number.isNaN(raw)) return null
    return raw
  }

  const parseDifferenceToG = (notes = '') => {
    const text = String(notes || '')
    const match = text.match(/Diferencia\s*\(Pesa-Balanza\):\s*([-+]?\d*[\.,]?\d+)\s*g/i)
    if (!match) {
      return null
    }
    const normalized = String(match[1]).replace(',', '.')
    const raw = Number(normalized)
    if (Number.isNaN(raw)) return null
    return raw
  }

  const parseEmpToG = (notes = '') => {
    const text = String(notes || '')
    const match = text.match(/<=\s*([-+]?\d*[\.,]?\d+)\s*g/i)
    if (!match) return null
    const normalized = String(match[1]).replace(',', '.')
    const raw = Number(normalized)
    if (Number.isNaN(raw)) return null
    return raw
  }

  const parseMonthlyDifferencesToF = (notes = '') => {
    const text = String(notes || '')
    const parse = (label) => {
      const match = text.match(new RegExp(`${label}\\s*:\\s*([-+]?\\d*\\.?\\d+)\\s*([cCfF])?`, 'i'))
      if (!match) return null
      const raw = Number(match[1])
      if (Number.isNaN(raw)) return null
      const unit = (match[2] || 'c').toLowerCase()
      return unit === 'f' ? raw : (raw * 9) / 5
    }
    const high = parse('Dif\\s*Alto')
    const mid = parse('Dif\\s*Medio')
    const low = parse('Dif\\s*Bajo')
    if (high === null || mid === null || low === null) return null
    return { high, mid, low }
  }

  const isMonthlyVerificationType = (equipment, typeId) => {
    if (!equipment || !typeId) return false
    const items = verificationTypesByEquipmentType[String(equipment?.equipment_type_id)] || []
    const match = items.find((item) => String(item.id) === String(typeId))
    return Number(match?.frequency_days) === 30
  }

  const getControlChartPoints = (equipment) => {
    const verifications = getLatestVerifications(equipment, 30)
    const isTape = isTapeEquipment(equipment)
    return verifications
      .map((verification) => {
        const diffValue = isTape
          ? parseDifferenceToMm(verification?.notes)
          : parseDifferenceToF(verification?.notes)
        if (diffValue === null || !verification?.verified_at) return null
        const ts = new Date(verification.verified_at).getTime()
        if (Number.isNaN(ts)) return null
        return {
          ts,
          dateLabel: formatDateCO(verification.verified_at),
          diffValue,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.ts - b.ts)
  }

  const buildControlChartPointsFromVerifications = (
    verifications,
    isMonthly = false,
    isTape = false,
    isBalance = false,
    isKarlFischer = false,
    isHydrometer = false,
  ) => {
    return (verifications || [])
      .map((verification) => {
        if (!verification?.verified_at) return null
        const ts = new Date(verification.verified_at).getTime()
        if (Number.isNaN(ts)) return null
        if (isHydrometer) {
          const notes = String(verification?.notes || '')
          const diffMatch = notes.match(/Diferencia API60F:\s*([-+]?\d*\.?\d+)/i)
          if (!diffMatch) return null
          const diffApi = Number(diffMatch[1])
          if (Number.isNaN(diffApi)) return null
          return {
            ts,
            dateLabel: formatDateCO(verification.verified_at),
            diffApi,
          }
        }
        if (isKarlFischer) {
          const avgFactor = getKarlFischerAverageFactor(verification)
          if (avgFactor === null || Number.isNaN(avgFactor)) return null
          return {
            ts,
            dateLabel: formatDateCO(verification.verified_at),
            avgFactor,
          }
        }
        if (isBalance) {
          let diffG = parseDifferenceToG(verification?.notes)
          if (diffG === null) {
            const comparison = parseBalanceComparisonFromNotes(verification?.notes || '')
            const diffText = String(comparison?.diff || '').replace(',', '.')
            const parsed = diffText.match(/-?\d*\.?\d+/)
            diffG = parsed ? Number(parsed[0]) : null
          }
          if (diffG === null || Number.isNaN(diffG)) return null
          const comparison = parseBalanceComparisonFromNotes(verification?.notes || '')
          const patronId = comparison?.patronId
          let emp = null
          if (patronId) {
            const referenceEquipment = (equipments || []).find(
              (item) => String(item?.id) === String(patronId),
            )
            if (referenceEquipment) {
              const storedEmp = Number(referenceEquipment.emp_value)
              if (storedEmp > 0) {
                emp = storedEmp
              } else if (referenceEquipment.nominal_mass_value && referenceEquipment.weight_class) {
                const nominal =
                  referenceEquipment.nominal_mass_unit === 'mg'
                    ? Number(referenceEquipment.nominal_mass_value) / 1000
                    : Number(referenceEquipment.nominal_mass_value)
                emp = getWeightEmp(nominal, referenceEquipment.weight_class)
              }
            }
          }
          if (emp == null) {
            emp = parseEmpToG(verification?.notes)
          }
          return {
            ts,
            dateLabel: formatDateCO(verification.verified_at),
            diffG,
            emp,
          }
        }
        if (isTape) {
          const diffMm = parseDifferenceToMm(verification?.notes)
          if (diffMm === null) return null
          return {
            ts,
            dateLabel: formatDateCO(verification.verified_at),
            diffMm,
          }
        }
        if (isMonthly) {
          const diffs = parseMonthlyDifferencesToF(verification?.notes)
          if (!diffs) return null
          return {
            ts,
            dateLabel: formatDateCO(verification.verified_at),
            diffHighF: diffs.high,
            diffMidF: diffs.mid,
            diffLowF: diffs.low,
          }
        }
        const diffF = parseDifferenceToF(verification?.notes)
        if (diffF === null) return null
        return {
          ts,
          dateLabel: formatDateCO(verification.verified_at),
          diffF,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.ts - b.ts)
  }

  const getFilteredVerifications = (equipment) => {
    const all = Array.isArray(equipment?.verifications) ? equipment.verifications : []
    const byType = verificationHistoryTypeId
      ? all.filter(
          (verification) =>
            String(verification?.verification_type_id) === verificationHistoryTypeId,
        )
      : all
    if (!byType.length) return []
    const isMonthlyHistory = isMonthlyVerificationType(equipment, verificationHistoryTypeId)
    if (isMonthlyHistory) {
      return byType
    }
    if (verificationRangeMode === 'all') {
      return byType
    }
    if (verificationRangeMode === 'last30') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      return byType.filter((verification) => {
        const date = new Date(verification?.verified_at)
        return !Number.isNaN(date.getTime()) && date >= cutoff
      })
    }
    const month = Number(verificationRangeMonth)
    const year = Number(verificationRangeYear)
    if (!month || !year) return byType
    return byType.filter((verification) => {
      const date = new Date(verification?.verified_at)
      if (Number.isNaN(date.getTime())) return false
      const s = toColombiaDateStr(date)
      return Number(s.slice(5, 7)) === month && Number(s.slice(0, 4)) === year
    })
  }

  const getEquipmentSerialById = (equipmentId) => {
    if (!equipmentId) return '-'
    const match = (equipments || []).find((item) => String(item?.id) === String(equipmentId))
    return match?.serial || String(equipmentId)
  }

  const getVerificationTypesForEquipment = (equipment) => {
    const equipmentTypeId = equipment?.equipment_type_id
    if (!equipmentTypeId) return []
    const items = verificationTypesByEquipmentType[String(equipmentTypeId)] || []
    return items.filter((item) => item?.is_active !== false)
  }

  const getVerificationTypeLabel = (typeItem) => {
    const days = Number(typeItem?.frequency_days ?? 0)
    if (!days || days <= 0) return typeItem?.name || ''
    return `${typeItem?.name || ''} (${days} ${days === 1 ? 'día' : 'días'})`
  }

  const getLastVerificationDateLabelByType = (equipment, typeId) => {
    if (!equipment || !typeId) return 'Sin verificaciones'
    const verifications = Array.isArray(equipment?.verifications) ? equipment.verifications : []
    const filtered = verifications.filter(
      (verification) => String(verification?.verification_type_id) === String(typeId),
    )
    return getLastVerificationDateLabel(filtered)
  }

  const isVerificationWithinFrequency = (verifiedAt, frequencyDays) => {
    if (!verifiedAt || !frequencyDays || frequencyDays <= 0) return false
    const verifiedDate = new Date(verifiedAt)
    if (Number.isNaN(verifiedDate.getTime())) return false
    const todayMidnight = colombiaMidnightUTC()
    const verifiedDateStr = toColombiaDateStr(verifiedDate)
    const verifiedMidnight = new Date(`${verifiedDateStr}T00:00:00-05:00`)
    const diffMs = todayMidnight.getTime() - verifiedMidnight.getTime()
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    if (diffDays < 0) return false
    return frequencyDays === 1 ? diffDays === 0 : diffDays < frequencyDays
  }

  const getVerificationStatusForType = (equipment, typeItem) => {
    if (!equipment || !typeItem?.id) {
      return { hasApproved: false, status: 'error', lastLabel: 'Sin verificaciones' }
    }
    const verifications = Array.isArray(equipment?.verifications) ? equipment.verifications : []
    const filtered = verifications.filter(
      (verification) => String(verification?.verification_type_id) === String(typeItem.id),
    )
    const frequencyDays = Number(typeItem?.frequency_days ?? 0)
    const approvedWithin = filtered.filter(
      (verification) =>
        verification?.is_ok === true &&
        isVerificationWithinFrequency(verification?.verified_at, frequencyDays),
    )
    const latestVerification = getLatestVerification(filtered)
    const hasApproved = approvedWithin.length > 0
    const lastLabel = getLastVerificationDateLabel(filtered)
    if (latestVerification?.is_ok === false) {
      return { hasApproved: false, status: 'failed', lastLabel }
    }
    if (!hasApproved) return { hasApproved: false, status: 'error', lastLabel }
    const todayMidnight = colombiaMidnightUTC()
    const minDiffDays = approvedWithin.reduce((min, v) => {
      if (!v?.verified_at) return min
      const d = new Date(v.verified_at)
      const vDateStr = toColombiaDateStr(d)
      const vMidnight = new Date(`${vDateStr}T00:00:00-05:00`)
      const diff = Math.floor((todayMidnight.getTime() - vMidnight.getTime()) / (24 * 60 * 60 * 1000))
      return diff < min ? diff : min
    }, Infinity)
    const warnThresholdDays = frequencyDays * 0.15
    const isInWarning = minDiffDays >= frequencyDays - warnThresholdDays
    return { hasApproved: true, status: isInWarning ? 'warning' : 'ok', lastLabel }
  }

  const getVerificationTypeTooltip = (equipment, typeItem) => {
    const last = getLastVerificationDateLabelByType(equipment, typeItem?.id)
    const days = Number(typeItem?.frequency_days ?? 0)
    const frequency =
      !days || days <= 0 ? 'No aplica' : `Cada ${days} ${days === 1 ? 'día' : 'días'}`
    const verifications = Array.isArray(equipment?.verifications) ? equipment.verifications : []
    const filtered = verifications.filter(
      (verification) => String(verification?.verification_type_id) === String(typeItem?.id),
    )
    const latestVerification = getLatestVerification(filtered)
    const result = getVerificationResultLabel(latestVerification)
    return (
      <Box sx={{ display: 'grid', gap: 0.25 }}>
        <Typography variant="caption">Ultima: {last}</Typography>
        <Typography variant="caption">Frecuencia: {frequency}</Typography>
        <Typography variant="caption">Resultado: {result}</Typography>
      </Box>
    )
  }

  const convertTemperatureToFDisplay = (value, unit) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return null
    const normalized = String(unit || 'c').toLowerCase()
    if (normalized === 'f') return numeric
    if (normalized === 'c') return (numeric * 9) / 5 + 32
    if (normalized === 'k') return ((numeric - 273.15) * 9) / 5 + 32
    if (normalized === 'r') return numeric - 459.67
    return numeric
  }
  const convertLengthToMmDisplay = (value, unit) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return null
    const normalized = String(unit || 'mm').toLowerCase()
    if (normalized === 'mm') return numeric
    if (normalized === 'cm') return numeric * 10
    if (normalized === 'm') return numeric * 1000
    if (normalized === 'in') return numeric * 25.4
    if (normalized === 'ft') return numeric * 304.8
    return null
  }

  const parseComparisonFromNotes = (notes) => {
    const text = String(notes || '')
    const marker = 'comparacion '
    const lowerText = text.toLowerCase()
    const markerIndex = lowerText.indexOf(marker)
    if (markerIndex < 0) {
      return { cleanNotes: text, parsed: null }
    }
    const comparisonText = text.slice(markerIndex)
    const cleanNotes = text.slice(0, markerIndex).trim()
    const parts = comparisonText.split('|').map((part) => part.trim())
    const lowerComparison = comparisonText.toLowerCase()
    const isMonthly =
      lowerComparison.startsWith('comparacion mensual') ||
      lowerComparison.includes('alto equipo:') ||
      lowerComparison.includes('medio equipo:') ||
      lowerComparison.includes('bajo equipo:')
    const patronPart = parts.find((part) => part.toLowerCase().startsWith('patron id:'))
    if (!patronPart) {
      return { cleanNotes: text, parsed: null }
    }
    const patronId = patronPart.split(':')[1]?.trim() || ''
    if (lowerComparison.startsWith('comparacion balanza')) {
      const comparison = parseBalanceComparisonFromNotes(comparisonText)
      const balanceValue = comparison.balance
      const match = balanceValue ? balanceValue.match(/[-+]?\d*\.?\d+/) : null
      return {
        cleanNotes,
        parsed: {
          reference_equipment_id: patronId,
          balance_reading_value: match ? match[0] : '',
        },
      }
    }
    if (lowerComparison.startsWith('comparacion cinta')) {
      const workMatch = comparisonText.match(/Lecturas equipo:\s*\[([^\]]+)\]\s*([a-zA-Z]+)/i)
      const refMatch = comparisonText.match(/Lecturas patron:\s*\[([^\]]+)\]\s*([a-zA-Z]+)/i)
      if (!workMatch || !refMatch) {
        return { cleanNotes: text, parsed: null }
      }
      const parseValues = (raw) =>
        String(raw || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      const workValues = parseValues(workMatch[1])
      const refValues = parseValues(refMatch[1])
      if (workValues.length < 2 || refValues.length < 2) {
        return { cleanNotes: text, parsed: null }
      }
      return {
        cleanNotes,
        parsed: {
          reference_equipment_id: patronId,
          reading_under_test_high_value: workValues[0] || '',
          reading_under_test_mid_value: workValues[1] || '',
          reading_under_test_low_value: workValues[2] || '',
          reference_reading_high_value: refValues[0] || '',
          reference_reading_mid_value: refValues[1] || '',
          reference_reading_low_value: refValues[2] || '',
          reading_unit_under_test: (workMatch[2] || 'mm').toLowerCase(),
          reading_unit_reference: (refMatch[2] || 'mm').toLowerCase(),
        },
      }
    }
    if (isMonthly) {
      const extract = (label) => {
        const match = comparisonText.match(
          new RegExp(`${label}\\s*:\\s*([-+]?\\d*[\\.,]?\\d+)\\s*([a-zA-Z])?`, 'i'),
        )
        if (!match) return { value: '', unit: '' }
        return { value: match[1], unit: match[2] || '' }
      }
      const altoEquipo = extract('Alto equipo')
      const altoPatron = extract('Alto patron')
      const medioEquipo = extract('Medio equipo')
      const medioPatron = extract('Medio patron')
      const bajoEquipo = extract('Bajo equipo')
      const bajoPatron = extract('Bajo patron')
      if (
        !altoEquipo.value ||
        !altoPatron.value ||
        !medioEquipo.value ||
        !medioPatron.value ||
        !bajoEquipo.value ||
        !bajoPatron.value
      ) {
        return { cleanNotes: text, parsed: null }
      }
      return {
        cleanNotes,
        parsed: {
          reference_equipment_id: patronId,
          reading_under_test_high_value: altoEquipo.value || '',
          reading_under_test_mid_value: medioEquipo.value || '',
          reading_under_test_low_value: bajoEquipo.value || '',
          reference_reading_high_value: altoPatron.value || '',
          reference_reading_mid_value: medioPatron.value || '',
          reference_reading_low_value: bajoPatron.value || '',
          reading_unit_under_test: (altoEquipo.unit || 'c').toLowerCase(),
          reading_unit_reference: (altoPatron.unit || 'c').toLowerCase(),
        },
      }
    }
    const lecturaEquipoPart = parts.find((part) => part.toLowerCase().startsWith('lectura equipo:'))
    const lecturaPatronPart = parts.find((part) => part.toLowerCase().startsWith('lectura patron:'))
    if (!lecturaEquipoPart || !lecturaPatronPart) {
      return { cleanNotes, parsed: null }
    }
    const lecturaEquipoRaw = lecturaEquipoPart.split(':')[1]?.trim() || ''
    const lecturaPatronRaw = lecturaPatronPart.split(':')[1]?.trim() || ''
    const [equipoValue, equipoUnit] = lecturaEquipoRaw.split(/\s+/)
    const [patronValue, patronUnit] = lecturaPatronRaw.split(/\s+/)
    return {
      cleanNotes,
      parsed: {
        reference_equipment_id: patronId,
        reading_under_test_f: equipoValue || '',
        reading_unit_under_test: (equipoUnit || 'c').toLowerCase(),
        reference_reading_f: patronValue || '',
        reading_unit_reference: (patronUnit || 'c').toLowerCase(),
      },
    }
  }

  const parseHydrometerMonthlyFromNotes = (notes) => {
    const text = String(notes || '')
    const lower = text.toLowerCase()
    if (!lower.includes('hidrometro mensual') && !lower.includes('[[hidrometro_data]]')) {
      return null
    }
    const payloadText = lower.includes('[[hidrometro_data]]')
      ? text.slice(text.toLowerCase().indexOf('[[hidrometro_data]]'))
      : text
    const extractNumber = (label) => {
      const match = payloadText.match(new RegExp(`${label}\\s*:\\s*(\\d+)`, 'i'))
      return match ? match[1] : ''
    }
    const extractText = (label) => {
      const match = payloadText.match(new RegExp(`${label}\\s*:\\s*([^|\\n]+)`, 'i'))
      return match ? match[1].trim() : ''
    }
    const extractValueUnit = (label) => {
      const match = text.match(
        new RegExp(`${label}\\s*:\\s*([-+]?\\d*[\\.,]?\\d+)\\s*([a-zA-Z°]+)?`, 'i'),
      )
      if (!match) return { value: '', unit: '' }
      return { value: match[1], unit: match[2] || '' }
    }
    const productName = extractText('Producto') || 'Crudo'
    const thermometerId = extractNumber('Termometro trabajo ID')
    const tempWork = extractValueUnit('Temp trabajo')
    const tempRef = extractValueUnit('Temp patron')
    const hydroWork = extractValueUnit('Hidrometro trabajo')
    const hydroRef = extractValueUnit('Hidrometro patron')
    const patronId = extractNumber('Patron ID')
    if (!hydroWork.value || !hydroRef.value) {
      return null
    }
    return {
      product_name: productName,
      thermometer_working_id: thermometerId,
      thermometer_working_value: tempWork.value,
      thermometer_reference_value: tempRef.value,
      thermometer_unit: (tempWork.unit || tempRef.unit || 'c').toLowerCase(),
      hydrometer_working_value: hydroWork.value,
      hydrometer_reference_value: hydroRef.value,
      reference_equipment_id: patronId,
    }
  }

  const stripHydrometerNotes = (notes = '') => {
    const text = String(notes || '')
    const markerIndex = text.toLowerCase().indexOf('[[hidrometro_data]]')
    if (markerIndex >= 0) {
      return text.slice(0, markerIndex).trim()
    }
    return text.replace(/\s*Hidrometro mensual[\s\S]*$/i, '').trim()
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
      case 'volume':
        return [
          { value: 'ml', label: 'mL' },
          { value: 'l', label: 'L' },
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

  const getBaseUnitLabel = (measure) => {
    switch (measure) {
      case 'temperature':
        return 'C'
      case 'weight':
        return 'g'
      case 'volume':
        return 'mL'
      case 'length':
        return 'mm'
      case 'pressure':
        return 'Pa'
      case 'api':
        return '°API'
      case 'percent_pv':
        return '% p/v'
      case 'relative_humidity':
        return '%'
      default:
        return ''
    }
  }

  const getMeasureLabel = (measure) => {
    switch (measure) {
      case 'temperature':
        return 'Temperatura'
      case 'weight':
        return 'Peso'
      case 'volume':
        return 'Volumen'
      case 'length':
        return 'Longitud'
      case 'pressure':
        return 'Presión'
      case 'api':
        return 'API'
      case 'percent_pv':
        return '% p/v'
      case 'relative_humidity':
        return 'Humedad relativa'
      default:
        return String(measure || '')
    }
  }

  const formatSpecValue = (value, resolution) => {
    return formatWithEquipmentResolution(value, resolution)
  }

  const getBaseUnitValue = (measure) => {
    switch (measure) {
      case 'temperature':
        return 'c'
      case 'relative_humidity':
        return '%'
      case 'weight':
        return 'g'
      case 'volume':
        return 'ml'
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

  const selectedEquipmentType = equipmentTypes.find(
    (type) => String(type.id) === String(formData.equipment_type_id),
  )
  const selectedMeasures = Array.isArray(selectedEquipmentType?.measures)
    ? selectedEquipmentType.measures
    : []
  const isWeightTypeSelected = isWeightEquipmentType(selectedEquipmentType)
  const selectedEquipmentTypeName = selectedEquipmentType?.name || ''
  const selectedEquipmentTypeRole = selectedEquipmentType?.role || ''
  const availableEditRoles = useMemo(() => {
    if (!selectedEquipmentTypeName) return []
    const roles = equipmentTypes
      .filter((type) => String(type?.name || '') === String(selectedEquipmentTypeName))
      .map((type) => String(type?.role || '').toLowerCase())
      .filter(Boolean)
    return Array.from(new Set(roles))
  }, [equipmentTypes, selectedEquipmentTypeName])

  const syncMeasureSpecs = (measures) => {
    setMeasureSpecs((prev) => {
      const next = {}
      measures.forEach((measure) => {
        next[measure] = prev[measure] || {
          min_unit: '',
          max_unit: '',
          resolution_unit: '',
          min_value: '',
          max_value: '',
          resolution: '',
        }
      })
      return next
    })
  }

  const openView = async (equipment) => {
    setViewEquipment(equipment)
    setIsViewOpen(true)
    setEquipmentHistoryItems([])
    setEquipmentHistoryError('')
    if (!equipment?.id) return
    setIsEquipmentHistoryLoading(true)
    try {
      if (Object.keys(userNameById).length === 0) {
        try {
          const usersData = await fetchUsers({ tokenType, accessToken })
          const usersList = Array.isArray(usersData?.items) ? usersData.items : []
          const nextMap = {}
          usersList.forEach((user) => {
            if (!user?.id) return
            const label =
              user?.full_name ||
              [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
              user?.email ||
              String(user.id)
            nextMap[String(user.id)] = label
          })
          setUserNameById(nextMap)
        } catch {
          setUserNameById({})
        }
      }
      const data = await fetchEquipmentHistory({
        tokenType,
        accessToken,
        equipmentId: equipment.id,
      })
      const items = Array.isArray(data?.items) ? data.items : []
      items.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
      setEquipmentHistoryItems(items)
    } catch (err) {
      setEquipmentHistoryError(err?.detail || 'No se pudo cargar el historial del equipo.')
    } finally {
      setIsEquipmentHistoryLoading(false)
    }
  }

  const closeView = () => {
    setIsViewOpen(false)
    setViewEquipment(null)
    setEquipmentHistoryItems([])
    setEquipmentHistoryError('')
    setIsEquipmentHistoryLoading(false)
  }

  const openInspectionHistory = async () => {
    if (!viewEquipment) return
    setInspectionHistoryItems([])
    setIsInspectionHistoryOpen(true)
    try {
      const data = await fetchEquipmentInspections({
        tokenType,
        accessToken,
        equipmentId: viewEquipment.id,
      })
      const items = Array.isArray(data?.items) ? data.items : []
      items.sort((a, b) => new Date(b.inspected_at) - new Date(a.inspected_at))
      setInspectionHistoryItems(items)
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudieron cargar las inspecciones.',
        severity: 'error',
      })
    }
  }

  const closeInspectionHistory = () => {
    setIsInspectionHistoryOpen(false)
    setInspectionHistoryItems([])
  }

  const openCalibrationHistory = (equipment = null) => {
    if (equipment) {
      setViewEquipment(equipment)
    }
    setIsCalibrationHistoryOpen(true)
  }

  const openCalibrationHistoryFromRow = (equipment) => {
    setViewEquipment(equipment)
    setIsCalibrationHistoryOpen(true)
  }

  const closeCalibrationHistory = () => {
    setIsCalibrationHistoryOpen(false)
  }

  const { openCalibrationHistoryEdit, openCalibration } = useEquipmentCalibrationOpenHandlers({
    canEditCalibrationDate,
    isHydrometerEquipment,
    isKarlFischerEquipment,
    isWeightEquipmentType,
    isThermoHygrometerEquipment,
    getEmptyCalibrationRow,
    splitThermoHygroRows,
    setCalibrationEquipment,
    setCalibrationEditMode,
    setCalibrationEditingId,
    setCalibrationForm,
    setCalibrationCertificateUrl,
    setCalibrationResults,
    setCalibrationResultsTemp,
    setCalibrationResultsHumidity,
    setCalibrationFile,
    setCalibrationOriginalDate,
    setIsCalibrationHistoryOpen,
    setIsCalibrationOpen,
  })

  const { closeCalibration, hideCalibrationDialog } = useEquipmentCalibrationDialogState({
    setIsCalibrationOpen,
    setCalibrationEquipment,
    setCalibrationForm,
    setCalibrationResults,
    setCalibrationResultsTemp,
    setCalibrationResultsHumidity,
    setCalibrationFile,
    setCalibrationCertificateUrl,
    setCalibrationEditMode,
    setCalibrationEditingId,
  })

  const openVerificationHistory = (typeId = '') => {
    const normalizedTypeId = typeId ? String(typeId) : ''
    setVerificationHistoryTypeId(normalizedTypeId)
    setVerificationRangeMode(normalizedTypeId ? 'last30' : 'all')
    setIsVerificationHistoryOpen(true)
  }

  const openInspectionHistoryEdit = async (inspection) => {
    if (!inspection || !viewEquipment) return
    const inspectedDate = inspection?.inspected_at
      ? utcToColombiaDateStr(inspection.inspected_at)
      : ''
    const responsesById = {}
    if (Array.isArray(inspection.responses)) {
      inspection.responses.forEach((resp) => {
        if (!resp?.inspection_item_id) return
        responsesById[resp.inspection_item_id] = {
          response_type: resp.response_type,
          value_bool: resp.value_bool,
          value_text: resp.value_text,
          value_number: resp.value_number,
        }
      })
    }
    setIsInspectionHistoryOpen(false)
    setInspectionEquipment(viewEquipment)
    setInspectionItems([])
    setInspectionEditMode(true)
    setInspectionEditingId(inspection.id || null)
    setInspectionOriginalDate(canEditInspectionDate ? inspectedDate : '')
    setInspectionForm({
      notes: inspection.notes || '',
      inspected_at: canEditInspectionDate ? inspectedDate : '',
      responses: responsesById,
    })
    setIsInspectionOpen(true)
    try {
      const data = await fetchEquipmentTypeInspectionItems({
        tokenType,
        accessToken,
        equipmentTypeId: viewEquipment.equipment_type_id,
      })
      const items = Array.isArray(data.items) ? data.items : []
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setInspectionItems(items)
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudieron cargar los ítems de inspección.',
        severity: 'error',
      })
    }
  }

  const closeVerificationHistory = () => {
    setIsVerificationHistoryOpen(false)
    setVerificationHistoryTypeId('')
  }

  const openVerificationHistoryEdit = async (verification) => {
    if (!verification || !viewEquipment) return
    const verifiedDate = verification?.verified_at
      ? utcToColombiaDateStr(verification.verified_at)
      : ''
    const responsesById = {}
    if (Array.isArray(verification.responses)) {
      verification.responses.forEach((resp) => {
        if (!resp?.verification_item_id) return
        responsesById[resp.verification_item_id] = {
          response_type: resp.response_type,
          value_bool: resp.value_bool,
          value_text: resp.value_text,
          value_number: resp.value_number,
        }
      })
    }
    const rawNotes = String(verification.notes || '').trim()
    const isHydrometer = isHydrometerEquipment(viewEquipment)
    const { cleanNotes, parsed } = isHydrometer
      ? { cleanNotes: stripHydrometerNotes(rawNotes), parsed: null }
      : parseComparisonFromNotes(verification.notes || '')
    const cleanedHydrometerNotes = stripHydrometerNotes(cleanNotes)
    const cleanedKfNotes = isKarlFischerEquipment(viewEquipment)
      ? stripKarlFischerNotes(rawNotes)
      : cleanedHydrometerNotes
    const kfParsed = parseKarlFischerNotes(verification.notes || '')
    const normalizedNotes = cleanedKfNotes || ''
    const shouldClearNotes = isHydrometer
    const hydrometerParsed = parseHydrometerMonthlyFromNotes(verification.notes || '')
    const monthlyFromApi = {
      reading_under_test_high_value: verification?.reading_under_test_high_value,
      reading_under_test_mid_value: verification?.reading_under_test_mid_value,
      reading_under_test_low_value: verification?.reading_under_test_low_value,
      reference_reading_high_value: verification?.reference_reading_high_value,
      reference_reading_mid_value: verification?.reference_reading_mid_value,
      reference_reading_low_value: verification?.reference_reading_low_value,
      reading_unit_under_test: verification?.reading_under_test_unit,
      reading_unit_reference: verification?.reference_reading_unit,
    }
    setIsVerificationHistoryOpen(false)
    setVerificationEquipment(viewEquipment)
    setVerificationTypes([])
    setVerificationItems([])
    setHydrometerProductOptions([])
    setIsHydrometerProductsLoading(false)
    setVerificationFieldErrors({})
    setVerificationFocusField('')
    setVerificationEditMode(true)
    setVerificationEditingId(verification.id || null)
    setVerificationOriginalDate(canEditVerificationDate ? verifiedDate : '')
    setVerificationForm({
      verification_type_id: String(verification?.verification_type_id || ''),
      notes: shouldClearNotes ? '' : normalizedNotes,
      verified_at: canEditVerificationDate ? verifiedDate : '',
      reference_equipment_id: parsed?.reference_equipment_id || kfParsed.balanceId || '',
      kf_weight_1: kfParsed.weight1 || '',
      kf_volume_1: kfParsed.volume1 || '',
      kf_weight_2: kfParsed.weight2 || '',
      kf_volume_2: kfParsed.volume2 || '',
      product_name: hydrometerParsed?.product_name || 'Crudo',
      thermometer_working_id: hydrometerParsed?.thermometer_working_id || '',
      hydrometer_working_value: hydrometerParsed?.hydrometer_working_value || '',
      hydrometer_reference_value: hydrometerParsed?.hydrometer_reference_value || '',
      thermometer_working_value: hydrometerParsed?.thermometer_working_value || '',
      thermometer_reference_value: hydrometerParsed?.thermometer_reference_value || '',
      thermometer_unit: hydrometerParsed?.thermometer_unit || 'c',
      reading_under_test_f: parsed?.reading_under_test_f || '',
      reference_reading_f: parsed?.reference_reading_f || '',
      balance_reading_value: parsed?.balance_reading_value || '',
      balance_unit: 'g',
      reading_under_test_high_value:
        parsed?.reading_under_test_high_value || monthlyFromApi.reading_under_test_high_value || '',
      reading_under_test_mid_value:
        parsed?.reading_under_test_mid_value || monthlyFromApi.reading_under_test_mid_value || '',
      reading_under_test_low_value:
        parsed?.reading_under_test_low_value || monthlyFromApi.reading_under_test_low_value || '',
      reference_reading_high_value:
        parsed?.reference_reading_high_value || monthlyFromApi.reference_reading_high_value || '',
      reference_reading_mid_value:
        parsed?.reference_reading_mid_value || monthlyFromApi.reference_reading_mid_value || '',
      reference_reading_low_value:
        parsed?.reference_reading_low_value || monthlyFromApi.reference_reading_low_value || '',
      reading_unit_under_test:
        parsed?.reading_unit_under_test || monthlyFromApi.reading_unit_under_test || 'c',
      reading_unit_reference:
        parsed?.reading_unit_reference || monthlyFromApi.reading_unit_reference || 'c',
      responses: responsesById,
    })
    setIsVerificationOpen(true)
    try {
      const verificationTypesData = await fetchEquipmentTypeVerifications({
        tokenType,
        accessToken,
        equipmentTypeId: viewEquipment.equipment_type_id,
      })
      const items = Array.isArray(verificationTypesData.items) ? verificationTypesData.items : []
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setVerificationTypes(items)
      const selectedId = String(verification?.verification_type_id || '')
      if (selectedId) {
        await loadVerificationItems({
          equipmentTypeId: viewEquipment.equipment_type_id,
          verificationTypeId: Number(selectedId),
        })
      }
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudieron cargar los ítems de verificación.',
        severity: 'error',
      })
    }
  }

  const openInspection = async (equipment) => {
    setInspectionEquipment(equipment)
    setIsInspectionNoAptaConfirmOpen(false)
    setInspectionNoAptaConfirmMessage('')
    const today = todayColombiaStr()
    setInspectionForm({
      notes: '',
      inspected_at: canEditInspectionDate ? today : '',
      responses: {},
    })
    setInspectionItems([])
    setInspectionEditMode(false)
    setInspectionEditingId(null)
    setInspectionOriginalDate('')
    setIsInspectionOpen(true)
    try {
      const data = await fetchEquipmentTypeInspectionItems({
        tokenType,
        accessToken,
        equipmentTypeId: equipment.equipment_type_id,
      })
      const items = Array.isArray(data.items) ? data.items : []
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setInspectionItems(items)
      const inspections = Array.isArray(equipment?.inspections) ? equipment.inspections : []
      const todayKey = todayColombiaStr()
      const todaysInspections = inspections
        .filter((inspection) => {
          const inspectedAt = inspection?.inspected_at
          if (!inspectedAt) return false
          const dateKey = utcToColombiaDateStr(inspectedAt)
          return dateKey === todayKey
        })
        .sort((a, b) => new Date(b.inspected_at) - new Date(a.inspected_at))
      if (todaysInspections.length > 0) {
        const latest = todaysInspections[0]
        const responsesById = {}
        if (Array.isArray(latest.responses)) {
          latest.responses.forEach((resp) => {
            if (!resp?.inspection_item_id) return
            responsesById[resp.inspection_item_id] = {
              response_type: resp.response_type,
              value_bool: resp.value_bool,
              value_text: resp.value_text,
              value_number: resp.value_number,
            }
          })
        }
        const latestDate = canEditInspectionDate
          ? utcToColombiaDateStr(latest.inspected_at)
          : ''
        setInspectionOriginalDate(latestDate)
        setInspectionEditingId(latest.id || null)
        setInspectionForm({
          notes: latest.notes || '',
          inspected_at: latestDate || latest.inspected_at || '',
          responses: responsesById,
        })
        setInspectionEditMode(true)
      }
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudieron cargar los ítems de inspección.',
        severity: 'error',
      })
    }
  }

  const closeInspection = () => {
    setIsInspectionOpen(false)
    setIsInspectionNoAptaConfirmOpen(false)
    setInspectionNoAptaConfirmMessage('')
    setInspectionEquipment(null)
    setInspectionItems([])
    setInspectionForm({ notes: '', inspected_at: '', responses: {} })
    setInspectionEditMode(false)
    setInspectionEditingId(null)
    setInspectionOriginalDate('')
  }

  const mergeInspectionIntoEquipmentsCache = (equipmentId, inspectionResult) => {
    if (!equipmentId || !inspectionResult?.id) return
    queryClient.setQueryData(['equipments'], (current) => {
      if (!Array.isArray(current)) return current
      return current.map((item) => {
        if (String(item?.id) !== String(equipmentId)) return item
        const existingInspections = Array.isArray(item?.inspections) ? item.inspections : []
        const nextInspections = [
          inspectionResult,
          ...existingInspections.filter(
            (inspection) => String(inspection?.id || '') !== String(inspectionResult.id),
          ),
        ]
        const nextStatus =
          inspectionResult?.is_ok === false
            ? 'needs_review'
            : inspectionResult?.is_ok === true
              ? 'in_use'
              : item?.status
        return {
          ...item,
          status: nextStatus,
          inspections: nextInspections,
        }
      })
    })
  }

  const notifyInspectionOutcome = ({ inspectionResult, successMessage, equipment }) => {
    if (inspectionResult?.is_ok === false) {
      const serial = String(equipment?.serial || '')
      const typeName = String(equipment?.equipment_type?.name || '')
      const roleKey = String(equipment?.equipment_type?.role || '').toLowerCase()
      const roleLabel = EQUIPMENT_ROLE_LABELS[roleKey] || roleKey || '-'
      setInspectionBlockedSerial(serial)
      setInspectionBlockedTypeName(typeName)
      setInspectionBlockedRoleLabel(roleLabel)
      setIsInspectionBlockedAlertOpen(true)
      const detailParts = [
        typeName ? `Tipo de equipo: ${typeName}` : null,
        roleLabel ? `Tipo: ${roleLabel}` : null,
        serial ? `Serial: ${serial}` : null,
      ].filter(Boolean)
      setToast({
        open: true,
        message: `Inspección NO APTA. ${detailParts.join(' | ')}. El equipo quedó en estado "Requiere revisión" y no puede seguir trabajando.`,
        severity: 'warning',
      })
      return
    }
    setToast({
      open: true,
      message: successMessage,
      severity: 'success',
    })
  }

  const handleDialogClose = (event, reason, onClose) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return
    }
    onClose()
  }

  const hideInspectionDialog = () => {
    setIsInspectionOpen(false)
    setIsInspectionNoAptaConfirmOpen(false)
    setInspectionNoAptaConfirmMessage('')
  }

  const loadVerificationItems = async ({ equipmentTypeId, verificationTypeId }) => {
    const data = await fetchEquipmentTypeVerificationItems({
      tokenType,
      accessToken,
      equipmentTypeId,
      verificationTypeId,
    })
    const items = Array.isArray(data.items) ? data.items : []
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    setVerificationItems(items)
  }

  const openVerification = async (equipment, verificationTypeId = null) => {
    const today = todayColombiaStr()
    const equipmentTypeName = String(equipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    const isTapeType =
      equipmentTypeName === 'cinta metrica plomada fondo' ||
      equipmentTypeName === 'cinta metrica plomada vacio'
    const defaultReadingUnit = isTapeType ? 'mm' : 'c'
    setVerificationEquipment(equipment)
    setVerificationTypes([])
    setHydrometerProductOptions([])
    setIsHydrometerProductsLoading(false)
    setVerificationFieldErrors({})
    setVerificationFocusField('')
    setVerificationEditingId(null)
    setVerificationOriginalDate('')
    setVerificationForm({
      verification_type_id: '',
      notes: '',
      verified_at: canEditVerificationDate ? today : '',
      reference_equipment_id: '',
      kf_weight_1: '',
      kf_volume_1: '',
      kf_weight_2: '',
      kf_volume_2: '',
      product_name: 'Crudo',
      thermometer_working_id: '',
      hydrometer_working_value: '',
      hydrometer_reference_value: '',
      thermometer_working_value: '',
      thermometer_reference_value: '',
      thermometer_unit: 'c',
      reading_under_test_f: '',
      reference_reading_f: '',
      balance_reading_value: '',
      balance_unit: 'g',
      reading_under_test_high_value: '',
      reading_under_test_mid_value: '',
      reading_under_test_low_value: '',
      reference_reading_high_value: '',
      reference_reading_mid_value: '',
      reference_reading_low_value: '',
      reading_unit_under_test: defaultReadingUnit,
      reading_unit_reference: defaultReadingUnit,
      responses: {},
    })
    setVerificationItems([])
    setVerificationEditMode(false)
    setIsVerificationOpen(true)
    try {
      const verificationTypesData = await fetchEquipmentTypeVerifications({
        tokenType,
        accessToken,
        equipmentTypeId: equipment.equipment_type_id,
      })
      const items = Array.isArray(verificationTypesData.items) ? verificationTypesData.items : []
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setVerificationTypes(items)
      if (items.length > 0) {
        const preferred =
          verificationTypeId &&
          items.find((entry) => String(entry.id) === String(verificationTypeId))
        const selected = preferred || items[0]
        const selectedId = String(selected.id)
        setVerificationForm((prev) => ({
          ...prev,
          verification_type_id: selectedId,
        }))
        await loadVerificationItems({
          equipmentTypeId: equipment.equipment_type_id,
          verificationTypeId: selected.id,
        })
        const verifications = Array.isArray(equipment?.verifications) ? equipment.verifications : []
        const todayKey = todayColombiaStr()
        const todaysVerification = verifications
          .filter((verification) => {
            if (!verification?.verified_at) return false
            if (String(verification?.verification_type_id) !== String(selected.id)) {
              return false
            }
            const dateKey = utcToColombiaDateStr(verification.verified_at)
            return dateKey === todayKey
          })
          .sort((a, b) => new Date(b.verified_at) - new Date(a.verified_at))
        if (todaysVerification.length > 0) {
          const latest = todaysVerification[0]
          const responsesById = {}
          if (Array.isArray(latest.responses)) {
            latest.responses.forEach((resp) => {
              if (!resp?.verification_item_id) return
              responsesById[resp.verification_item_id] = {
                response_type: resp.response_type,
                value_bool: resp.value_bool,
                value_text: resp.value_text,
                value_number: resp.value_number,
              }
            })
          }
          const rawNotes = String(latest.notes || '').trim()
          const isHydrometer = isHydrometerEquipment(equipment)
          const { cleanNotes, parsed } = isHydrometer
            ? { cleanNotes: stripHydrometerNotes(rawNotes), parsed: null }
            : parseComparisonFromNotes(latest.notes || '')
          const cleanedHydrometerNotes = stripHydrometerNotes(cleanNotes)
          const cleanedKfNotes = isKarlFischerEquipment(equipment)
            ? stripKarlFischerNotes(rawNotes)
            : cleanedHydrometerNotes
          const normalizedNotes = cleanedKfNotes || ''
          const shouldClearNotes = isHydrometer
          const hydrometerParsed = parseHydrometerMonthlyFromNotes(latest.notes || '')
          const kfParsed = parseKarlFischerNotes(latest.notes || '')
          const monthlyFromApi = {
            reading_under_test_high_value: latest?.reading_under_test_high_value,
            reading_under_test_mid_value: latest?.reading_under_test_mid_value,
            reading_under_test_low_value: latest?.reading_under_test_low_value,
            reference_reading_high_value: latest?.reference_reading_high_value,
            reference_reading_mid_value: latest?.reference_reading_mid_value,
            reference_reading_low_value: latest?.reference_reading_low_value,
            reading_unit_under_test: latest?.reading_under_test_unit,
            reading_unit_reference: latest?.reference_reading_unit,
          }
          setVerificationForm((prev) => ({
            ...prev,
            notes: shouldClearNotes ? '' : normalizedNotes,
            verified_at: canEditVerificationDate
              ? utcToColombiaDateStr(latest.verified_at)
              : prev.verified_at,
            responses: responsesById,
            reference_equipment_id:
              parsed?.reference_equipment_id ||
              hydrometerParsed?.reference_equipment_id ||
              kfParsed.balanceId ||
              prev.reference_equipment_id,
            kf_weight_1: kfParsed.weight1 || prev.kf_weight_1,
            kf_volume_1: kfParsed.volume1 || prev.kf_volume_1,
            kf_weight_2: kfParsed.weight2 || prev.kf_weight_2,
            kf_volume_2: kfParsed.volume2 || prev.kf_volume_2,
            product_name: hydrometerParsed?.product_name || prev.product_name,
            thermometer_working_id:
              hydrometerParsed?.thermometer_working_id || prev.thermometer_working_id,
            hydrometer_working_value:
              hydrometerParsed?.hydrometer_working_value || prev.hydrometer_working_value,
            hydrometer_reference_value:
              hydrometerParsed?.hydrometer_reference_value || prev.hydrometer_reference_value,
            thermometer_working_value:
              hydrometerParsed?.thermometer_working_value || prev.thermometer_working_value,
            thermometer_reference_value:
              hydrometerParsed?.thermometer_reference_value || prev.thermometer_reference_value,
            thermometer_unit: hydrometerParsed?.thermometer_unit || prev.thermometer_unit,
            reading_under_test_f: parsed?.reading_under_test_f || prev.reading_under_test_f,
            reading_unit_under_test:
              parsed?.reading_unit_under_test ||
              monthlyFromApi.reading_unit_under_test ||
              prev.reading_unit_under_test,
            reference_reading_f: parsed?.reference_reading_f || prev.reference_reading_f,
            balance_reading_value: parsed?.balance_reading_value || prev.balance_reading_value,
            reading_unit_reference:
              parsed?.reading_unit_reference ||
              monthlyFromApi.reading_unit_reference ||
              prev.reading_unit_reference,
            reading_under_test_high_value:
              parsed?.reading_under_test_high_value ||
              monthlyFromApi.reading_under_test_high_value ||
              prev.reading_under_test_high_value,
            reading_under_test_mid_value:
              parsed?.reading_under_test_mid_value ||
              monthlyFromApi.reading_under_test_mid_value ||
              prev.reading_under_test_mid_value,
            reading_under_test_low_value:
              parsed?.reading_under_test_low_value ||
              monthlyFromApi.reading_under_test_low_value ||
              prev.reading_under_test_low_value,
            reference_reading_high_value:
              parsed?.reference_reading_high_value ||
              monthlyFromApi.reference_reading_high_value ||
              prev.reference_reading_high_value,
            reference_reading_mid_value:
              parsed?.reference_reading_mid_value ||
              monthlyFromApi.reference_reading_mid_value ||
              prev.reference_reading_mid_value,
            reference_reading_low_value:
              parsed?.reference_reading_low_value ||
              monthlyFromApi.reference_reading_low_value ||
              prev.reference_reading_low_value,
          }))
          const latestVerifiedDate = canEditVerificationDate
            ? utcToColombiaDateStr(latest.verified_at)
            : ''
          setVerificationOriginalDate(latestVerifiedDate)
          setVerificationEditingId(latest.id || null)
          setVerificationEditMode(true)
        }
      }
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudieron cargar los tipos o ítems de verificación.',
        severity: 'error',
      })
    }
  }

  const closeVerification = () => {
    setIsVerificationOpen(false)
    setIsVerificationWaitOpen(false)
    setIsVerificationNoAptaConfirmOpen(false)
    setVerificationNoAptaConfirmMessage('')
    setVerificationEquipment(null)
    setVerificationTypes([])
    setVerificationItems([])
    setHydrometerWorkApi60f('')
    setHydrometerWorkApi60fError('')
    setHydrometerRefApi60f('')
    setHydrometerRefApi60fError('')
    setHydrometerProductOptions([])
    setIsHydrometerProductsLoading(false)
    setVerificationFieldErrors({})
    setVerificationFocusField('')
    setVerificationForm({
      verification_type_id: '',
      notes: '',
      verified_at: '',
      reference_equipment_id: '',
      kf_weight_1: '',
      kf_volume_1: '',
      kf_weight_2: '',
      kf_volume_2: '',
      product_name: 'Crudo',
      thermometer_working_id: '',
      hydrometer_working_value: '',
      hydrometer_reference_value: '',
      thermometer_working_value: '',
      thermometer_reference_value: '',
      thermometer_unit: 'c',
      reading_under_test_f: '',
      reference_reading_f: '',
      reading_under_test_high_value: '',
      reading_under_test_mid_value: '',
      reading_under_test_low_value: '',
      reference_reading_high_value: '',
      reference_reading_mid_value: '',
      reference_reading_low_value: '',
      reading_unit_under_test: 'c',
      reading_unit_reference: 'c',
      responses: {},
    })
    setVerificationEditMode(false)
    setVerificationEditingId(null)
    setVerificationOriginalDate('')
  }

  const hideVerificationDialog = () => {
    setIsVerificationOpen(false)
    setIsVerificationNoAptaConfirmOpen(false)
    setVerificationNoAptaConfirmMessage('')
  }

  const clearVerificationFieldError = (field) => {
    const key = String(field || '').trim()
    if (!key) return
    setVerificationFieldErrors((prev) => {
      if (!prev?.[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setVerificationFocusField('')
  }

  const clearCalibrationFieldError = (field) => {
    const key = String(field || '').trim()
    if (!key) return
    setCalibrationFieldErrors((prev) => {
      if (!prev?.[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setCalibrationFocusField('')
  }

  const handleInspectionReplace = async () => {
    if (!pendingInspectionPayload || !inspectionEquipment) return
    setIsInspectionReplaceOpen(false)
    setIsInspectionWaitOpen(true)
    setIsInspectionLoading(true)
    try {
      const replacedInspection = await createEquipmentInspection({
        tokenType,
        accessToken,
        equipmentId: inspectionEquipment.id,
        payload: pendingInspectionPayload,
        replaceExisting: true,
      })
      mergeInspectionIntoEquipmentsCache(inspectionEquipment.id, replacedInspection)
      await queryClient.invalidateQueries({ queryKey: ['equipments'] })
      notifyInspectionOutcome({
        inspectionResult: replacedInspection,
        successMessage: 'Inspección reemplazada correctamente.',
        equipment: inspectionEquipment,
      })
      closeInspection()
      setPendingInspectionPayload(null)
    } catch (errReplace) {
      setToast({
        open: true,
        message: errReplace?.detail || 'No se pudo reemplazar la inspección.',
        severity: 'error',
      })
      setIsInspectionOpen(true)
      setPendingInspectionPayload(null)
    } finally {
      setIsInspectionLoading(false)
      setIsInspectionWaitOpen(false)
    }
  }

  const handleVerificationReplace = async () => {
    if (!pendingVerificationPayload || !verificationEquipment) return
    setIsVerificationReplaceOpen(false)
    setIsVerificationWaitOpen(true)
    setIsVerificationLoading(true)
    try {
      await createEquipmentVerification({
        tokenType,
        accessToken,
        equipmentId: verificationEquipment.id,
        payload: pendingVerificationPayload,
        replaceExisting: true,
      })
      await queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setToast({
        open: true,
        message: 'Verificación reemplazada correctamente.',
        severity: 'success',
      })
      closeVerification()
      setPendingVerificationPayload(null)
    } catch (errReplace) {
      setToast({
        open: true,
        message: errReplace?.detail || 'No se pudo reemplazar la verificación.',
        severity: 'error',
      })
      setIsVerificationOpen(true)
      setPendingVerificationPayload(null)
    } finally {
      setIsVerificationLoading(false)
      setIsVerificationWaitOpen(false)
    }
  }

  const openDelete = (equipment) => {
    setDeletingEquipment(equipment)
    setIsDeleteOpen(true)
  }

  const closeDelete = () => {
    setIsDeleteOpen(false)
    setDeletingEquipment(null)
  }

  const handleDeleteSubmit = async () => {
    if (!deletingEquipment) return
    setIsDeleteLoading(true)
    try {
      const result = await deleteEquipmentMutation.mutateAsync({
        tokenType,
        accessToken,
        equipmentId: deletingEquipment.id,
      })
      await queryClient.invalidateQueries({ queryKey: ['equipments'] })
      const message =
        result?.action === 'deactivated'
          ? 'El equipo tiene operaciones. Se marco como inactivo.'
          : 'Equipo eliminado correctamente.'
      setToast({
        open: true,
        message,
        severity: 'success',
      })
      closeDelete()
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar el equipo.',
        severity: 'error',
      })
      closeDelete()
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const applyMeasureSpecs = (specs, measures) => {
    const next = {}
    measures.forEach((measure) => {
      const baseUnit = getBaseUnitValue(measure)
      const spec = specs.find((entry) => entry.measure === measure)
      next[measure] = {
        min_unit: baseUnit,
        max_unit: baseUnit,
        resolution_unit: baseUnit,
        min_value: spec?.min_value ?? '',
        max_value: spec?.max_value ?? '',
        resolution: spec?.resolution ?? '',
      }
    })
    setMeasureSpecs(next)
  }

  const openEdit = async (equipment) => {
    setEditingEquipmentId(equipment.id)
    setFormData({
      internal_code: equipment.internal_code || '',
      serial: equipment.serial || '',
      component_serials_text: serializeComponentSerials(equipment.component_serials),
      model: equipment.model || '',
      brand: equipment.brand || '',
      status: equipment.status || 'in_use',
      is_active: equipment.is_active ?? true,
      equipment_type_id: equipment.equipment_type_id || '',
      owner_company_id: equipment.owner_company_id || '',
      terminal_id: equipment.terminal_id || '',
      weight_class: equipment.weight_class || '',
      nominal_mass_value:
        equipment.nominal_mass_value === null || equipment.nominal_mass_value === undefined
          ? ''
          : String(equipment.nominal_mass_value),
      nominal_mass_unit: equipment.nominal_mass_unit || '',
    })
    setIsEditOpen(true)
    const baseType = equipmentTypes.find(
      (type) => String(type.id) === String(equipment.equipment_type_id),
    )
    const measures = Array.isArray(baseType?.measures) ? baseType.measures : []
    syncMeasureSpecs(measures)
    try {
      const data = await fetchEquipmentById({
        tokenType,
        accessToken,
        equipmentId: equipment.id,
      })
      const specList = Array.isArray(data?.measure_specs) ? data.measure_specs : []
      setFormData((prev) => ({
        ...prev,
        component_serials_text: serializeComponentSerials(data?.component_serials),
      }))
      applyMeasureSpecs(specList, measures)
    } catch {
      applyMeasureSpecs([], measures)
    }
  }

  const closeEdit = () => {
    setIsEditOpen(false)
    setEditingEquipmentId(null)
    setMeasureSpecs({})
  }

  const handleCreateSubmit = async () => {
    if (!formData.serial.trim() || !formData.model.trim() || !formData.brand.trim()) {
      setToast({
        open: true,
        message: 'Serial, modelo y marca son obligatorios.',
        severity: 'error',
      })
      return
    }
    if (!formData.equipment_type_id || !formData.owner_company_id || !formData.terminal_id) {
      setToast({
        open: true,
        message: 'Selecciona tipo, empresa duena y terminal.',
        severity: 'error',
      })
      return
    }
    if (selectedMeasures.length) {
      const missingMeasure = selectedMeasures.find((measure) => {
        const spec = measureSpecs[measure] || {}
        return (
          !String(spec.min_unit || '').trim() ||
          !String(spec.max_unit || '').trim() ||
          !String(spec.resolution_unit || '').trim() ||
          spec.min_value === '' ||
          spec.max_value === '' ||
          spec.resolution === '' ||
          Number.isNaN(Number(spec.min_value)) ||
          Number.isNaN(Number(spec.max_value)) ||
          Number.isNaN(Number(spec.resolution))
        )
      })
      if (missingMeasure) {
        setToast({
          open: true,
          message: 'Completa min, max, resolucion y sus unidades para cada medida.',
          severity: 'error',
        })
        return
      }
    }

    const componentSerials = parseComponentSerialsInput(formData.component_serials_text)
    if (
      componentSerials.some(
        (item) => !String(item.component_name || '').trim() || !String(item.serial || '').trim(),
      )
    ) {
      setToast({
        open: true,
        message: 'Cada componente debe tener nombre y serial en formato "Nombre: Serial".',
        severity: 'error',
      })
      return
    }

    let weightClass = null
    let nominalMassValue = null
    let nominalMassUnit = null

    if (isWeightTypeSelected) {
      weightClass = String(formData.weight_class || '').trim()
      nominalMassValue = String(formData.nominal_mass_value || '').trim()
      if (!weightClass || !nominalMassValue) {
        setToast({
          open: true,
          message: 'Selecciona clase y peso nominal para la pesa.',
          severity: 'error',
        })
        return
      }

      const empValue = getWeightEmp(nominalMassValue, weightClass)
      if (empValue === null) {
        setToast({
          open: true,
          message: 'La combinacion de clase y peso nominal no es valida.',
          severity: 'error',
        })
        return
      }

      nominalMassUnit = 'g'
      const normalizedSerial = normalizeWeightSerial(formData.serial, nominalMassValue)
      if (normalizedSerial.changed) {
        setFormData((prev) => ({
          ...prev,
          serial: normalizedSerial.serial,
        }))
        setToast({
          open: true,
          message: `El serial se ajusto para incluir el peso: ${normalizedSerial.serial}`,
          severity: 'warning',
        })
        return
      }
    }

    setIsCreateLoading(true)
    setIsCreateOpen(false)
    try {
      await createEquipmentMutation.mutateAsync({
        tokenType,
        accessToken,
        payload: {
          internal_code: formData.internal_code?.trim() || null,
          serial: formData.serial.trim(),
          model: formData.model.trim(),
          brand: formData.brand.trim(),
          status: formData.status,
          is_active: true,
          inspection_days_override: null,
          equipment_type_id: Number(formData.equipment_type_id),
          owner_company_id: Number(formData.owner_company_id),
          terminal_id: Number(formData.terminal_id),
          weight_class: weightClass || null,
          nominal_mass_value: nominalMassValue ? Number(nominalMassValue) : null,
          nominal_mass_unit: nominalMassUnit,
          component_serials: componentSerials,
          measure_specs: selectedMeasures.map((measure) => ({
            measure,
            min_unit: String(measureSpecs[measure]?.min_unit || '').trim(),
            max_unit: String(measureSpecs[measure]?.max_unit || '').trim(),
            resolution_unit: String(measureSpecs[measure]?.resolution_unit || '').trim(),
            min_value: Number(measureSpecs[measure]?.min_value),
            max_value: Number(measureSpecs[measure]?.max_value),
            resolution: Number(measureSpecs[measure]?.resolution),
          })),
        },
      })
      await queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setToast({
        open: true,
        message: 'Equipo creado correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo crear el equipo.',
        severity: 'error',
      })
    } finally {
      setIsCreateLoading(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!editingEquipmentId) return
    if (!formData.serial.trim() || !formData.model.trim() || !formData.brand.trim()) {
      setToast({
        open: true,
        message: 'Serial, modelo y marca son obligatorios.',
        severity: 'error',
      })
      return
    }
    if (!formData.equipment_type_id || !formData.owner_company_id || !formData.terminal_id) {
      setToast({
        open: true,
        message: 'Selecciona tipo, empresa duena y terminal.',
        severity: 'error',
      })
      return
    }
    if (selectedMeasures.length) {
      const missingMeasure = selectedMeasures.find((measure) => {
        const spec = measureSpecs[measure] || {}
        return (
          !String(spec.min_unit || '').trim() ||
          !String(spec.max_unit || '').trim() ||
          !String(spec.resolution_unit || '').trim() ||
          spec.min_value === '' ||
          spec.max_value === '' ||
          spec.resolution === '' ||
          Number.isNaN(Number(spec.min_value)) ||
          Number.isNaN(Number(spec.max_value)) ||
          Number.isNaN(Number(spec.resolution))
        )
      })
      if (missingMeasure) {
        setToast({
          open: true,
          message: 'Completa min, max, resolucion y sus unidades para cada medida.',
          severity: 'error',
        })
        return
      }
    }

    const componentSerials = parseComponentSerialsInput(formData.component_serials_text)
    if (
      componentSerials.some(
        (item) => !String(item.component_name || '').trim() || !String(item.serial || '').trim(),
      )
    ) {
      setToast({
        open: true,
        message: 'Cada componente debe tener nombre y serial en formato "Nombre: Serial".',
        severity: 'error',
      })
      return
    }

    let weightClass = null
    let nominalMassValue = null
    let nominalMassUnit = null

    if (isWeightTypeSelected) {
      weightClass = String(formData.weight_class || '').trim()
      nominalMassValue = String(formData.nominal_mass_value || '').trim()
      if (!weightClass || !nominalMassValue) {
        setToast({
          open: true,
          message: 'Selecciona clase y peso nominal para la pesa.',
          severity: 'error',
        })
        return
      }
      const empValue = getWeightEmp(nominalMassValue, weightClass)
      if (empValue === null) {
        setToast({
          open: true,
          message: 'La combinacion de clase y peso nominal no es valida.',
          severity: 'error',
        })
        return
      }

      nominalMassUnit = 'g'
      const normalizedSerial = normalizeWeightSerial(formData.serial, nominalMassValue)
      if (normalizedSerial.changed) {
        setFormData((prev) => ({
          ...prev,
          serial: normalizedSerial.serial,
        }))
        setToast({
          open: true,
          message: `El serial se ajusto para incluir el peso: ${normalizedSerial.serial}`,
          severity: 'warning',
        })
        return
      }
    }

    setIsUpdateLoading(true)
    closeEdit()
    try {
      await updateEquipmentMutation.mutateAsync({
        tokenType,
        accessToken,
        equipmentId: editingEquipmentId,
        payload: {
          internal_code: formData.internal_code?.trim() || null,
          serial: formData.serial.trim(),
          model: formData.model.trim(),
          brand: formData.brand.trim(),
          status: formData.status,
          is_active: formData.is_active,
          inspection_days_override: null,
          equipment_type_id: Number(formData.equipment_type_id),
          owner_company_id: Number(formData.owner_company_id),
          terminal_id: Number(formData.terminal_id),
          weight_class: weightClass || null,
          nominal_mass_value: nominalMassValue ? Number(nominalMassValue) : null,
          nominal_mass_unit: nominalMassUnit,
          component_serials: componentSerials,
          measure_specs: selectedMeasures.map((measure) => ({
            measure,
            min_unit: String(measureSpecs[measure]?.min_unit || '').trim(),
            max_unit: String(measureSpecs[measure]?.max_unit || '').trim(),
            resolution_unit: String(measureSpecs[measure]?.resolution_unit || '').trim(),
            min_value: Number(measureSpecs[measure]?.min_value),
            max_value: Number(measureSpecs[measure]?.max_value),
            resolution: Number(measureSpecs[measure]?.resolution),
          })),
        },
      })
      await queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setToast({
        open: true,
        message: 'Equipo actualizado correctamente.',
        severity: 'success',
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo actualizar el equipo.',
        severity: 'error',
      })
    } finally {
      setIsUpdateLoading(false)
    }
  }

  const handleInspectionSubmit = async (options = {}) => {
    const forceNoAptaSave = Boolean(options?.forceNoAptaSave)
    if (!inspectionEquipment) return
    const responses = []
    for (const item of inspectionItems) {
      const response = inspectionForm.responses[item.id] || {}
      if (item.is_required) {
        if (item.response_type === 'boolean' && response.value_bool === null) {
          setToast({
            open: true,
            message: 'Completa los items requeridos.',
            severity: 'error',
          })
          return
        }
        if (item.response_type === 'text' && !String(response.value_text || '').trim()) {
          setToast({
            open: true,
            message: 'Completa los items requeridos.',
            severity: 'error',
          })
          return
        }
        if (item.response_type === 'number' && response.value_number === '') {
          setToast({
            open: true,
            message: 'Completa los items requeridos.',
            severity: 'error',
          })
          return
        }
      }
      const hasValue =
        item.response_type === 'boolean'
          ? response.value_bool === true || response.value_bool === false
          : item.response_type === 'text'
            ? String(response.value_text || '').trim().length > 0
            : item.response_type === 'number'
              ? response.value_number !== '' && response.value_number !== null
              : false
      if (!item.is_required && !hasValue) {
        continue
      }
      responses.push({
        inspection_item_id: item.id,
        response_type: item.response_type,
        value_bool: item.response_type === 'boolean' ? response.value_bool : null,
        value_text: item.response_type === 'text' ? String(response.value_text || '').trim() : null,
        value_number: item.response_type === 'number' ? Number(response.value_number) : null,
      })
    }

    const normalizeText = (value) => String(value || '').trim().toLowerCase()
    const noAptaReasons = []
    for (const response of responses) {
      const item = inspectionItems.find(
        (inspectionItem) =>
          String(inspectionItem?.id || '') === String(response?.inspection_item_id || ''),
      )
      if (!item) continue
      const responseType = String(response?.response_type || item?.response_type || '').toLowerCase()
      if (responseType === 'boolean') {
        if (item.expected_bool === null || item.expected_bool === undefined) continue
        if (response.value_bool !== item.expected_bool) {
          noAptaReasons.push(`El ítem "${item.item}" no cumple el valor esperado.`)
          break
        }
        continue
      }
      if (responseType === 'text') {
        if (!Array.isArray(item.expected_text_options) || item.expected_text_options.length === 0) {
          continue
        }
        const allowed = new Set(item.expected_text_options.map((option) => normalizeText(option)))
        if (!allowed.has(normalizeText(response.value_text))) {
          noAptaReasons.push(`El ítem "${item.item}" no cumple las opciones esperadas.`)
          break
        }
        continue
      }
      if (responseType === 'number') {
        const valueNumber = Number(response.value_number)
        if (Number.isNaN(valueNumber)) continue
        if (item.expected_number !== null && item.expected_number !== undefined) {
          if (valueNumber !== Number(item.expected_number)) {
            noAptaReasons.push(`El ítem "${item.item}" no coincide con el valor esperado.`)
            break
          }
          continue
        }
        if (item.expected_number_min !== null && item.expected_number_min !== undefined) {
          if (valueNumber < Number(item.expected_number_min)) {
            noAptaReasons.push(`El ítem "${item.item}" está por debajo del mínimo permitido.`)
            break
          }
        }
        if (item.expected_number_max !== null && item.expected_number_max !== undefined) {
          if (valueNumber > Number(item.expected_number_max)) {
            noAptaReasons.push(`El ítem "${item.item}" está por encima del máximo permitido.`)
            break
          }
        }
      }
    }
    if (!forceNoAptaSave && noAptaReasons.length > 0) {
      setInspectionNoAptaConfirmMessage(noAptaReasons[0])
      setIsInspectionNoAptaConfirmOpen(true)
      return
    }
    setIsInspectionNoAptaConfirmOpen(false)
    setInspectionNoAptaConfirmMessage('')

    hideInspectionDialog()
    setIsInspectionWaitOpen(true)
    setIsInspectionLoading(true)
    const payload = {
      notes: inspectionForm.notes?.trim() || null,
      inspected_at: canEditInspectionDate && inspectionForm.inspected_at ? inspectionForm.inspected_at : null,
      responses,
    }
    try {
      let savedInspection = null
      if (inspectionEditingId) {
        savedInspection = await updateEquipmentInspection({
          tokenType,
          accessToken,
          inspectionId: inspectionEditingId,
          payload,
        })
      } else {
        savedInspection = await createEquipmentInspection({
          tokenType,
          accessToken,
          equipmentId: inspectionEquipment.id,
          payload,
          replaceExisting: inspectionEditMode,
        })
      }
      mergeInspectionIntoEquipmentsCache(inspectionEquipment.id, savedInspection)
      await queryClient.invalidateQueries({ queryKey: ['equipments'] })
      notifyInspectionOutcome({
        inspectionResult: savedInspection,
        successMessage: inspectionEditMode
          ? 'Inspeccion actualizada correctamente.'
          : 'Inspeccion registrada correctamente.',
        equipment: inspectionEquipment,
      })
      closeInspection()
    } catch (err) {
      if (inspectionEditingId) {
        setToast({
          open: true,
          message: err?.detail || 'No se pudo actualizar la inspeccion.',
          severity: 'error',
        })
        setIsInspectionOpen(true)
        return
      }
      if (err?.detail && String(err.detail).includes('reemplazar')) {
        setPendingInspectionPayload(payload)
        setIsInspectionReplaceOpen(true)
        return
      }
      setToast({
        open: true,
        message: err?.detail || 'No se pudo registrar la inspeccion.',
        severity: 'error',
      })
      setIsInspectionOpen(true)
    } finally {
      setIsInspectionLoading(false)
      setIsInspectionWaitOpen(false)
    }
  }

  const handleVerificationSubmit = useEquipmentVerificationSubmit({
    tokenType,
    accessToken,
    queryClient,
    verificationEquipment,
    verificationForm,
    verificationItems,
    verificationEditMode,
    verificationEditingId,
    selectedReferenceEquipment,
    requiresTemperatureComparison,
    isMonthlyVerification,
    isHydrometerMonthlyVerification,
    requiresComparisonReadings,
    requiresKarlFischerVerification,
    requiresBalanceComparison,
    requiresTapeComparison,
    canEditVerificationDate,
    hydrometerThermometerOptions,
    convertTemperatureToFDisplay,
    convertLengthToMmDisplay,
    normalizeWeightToGrams,
    getWeightEmp,
    hydrometerWorkApi60f,
    hydrometerRefApi60f,
    closeVerification,
    hideVerificationDialog,
    setToast,
    setIsVerificationLoading,
    setIsVerificationWaitOpen,
    setIsVerificationOpen,
    setPendingVerificationPayload,
    setIsVerificationReplaceOpen,
    setIsVerificationNoAptaConfirmOpen,
    setVerificationNoAptaConfirmMessage,
    setVerificationFieldErrors,
    setVerificationFocusField,
  })

  useEffect(() => {
    if (!verificationForm.verified_at || !verificationEquipment) return
    const newDate = verificationForm.verified_at
    const verifications = Array.isArray(verificationEquipment?.verifications)
      ? verificationEquipment.verifications
      : []
    const match = verifications.find((v) => {
      if (!v?.verified_at) return false
      if (String(v?.verification_type_id) !== String(verificationForm.verification_type_id)) return false
      return utcToColombiaDateStr(v.verified_at) === newDate
    })
    if (match) {
      const responsesById = {}
      if (Array.isArray(match.responses)) {
        match.responses.forEach((resp) => {
          if (!resp?.verification_item_id) return
          responsesById[resp.verification_item_id] = {
            response_type: resp.response_type,
            value_bool: resp.value_bool,
            value_text: resp.value_text,
            value_number: resp.value_number,
          }
        })
      }
      const rawNotes = String(match.notes || '').trim()
      const isHydrometer = isHydrometerEquipment(verificationEquipment)
      const { cleanNotes, parsed } = isHydrometer
        ? { cleanNotes: stripHydrometerNotes(rawNotes), parsed: null }
        : parseComparisonFromNotes(match.notes || '')
      const cleanedHydrometerNotes = stripHydrometerNotes(cleanNotes)
      const cleanedKfNotes = isKarlFischerEquipment(verificationEquipment)
        ? stripKarlFischerNotes(rawNotes)
        : cleanedHydrometerNotes
      const normalizedNotes = cleanedKfNotes || ''
      const shouldClearNotes = isHydrometer
      const hydrometerParsed = parseHydrometerMonthlyFromNotes(match.notes || '')
      const kfParsed = parseKarlFischerNotes(match.notes || '')
      const monthlyFromApi = {
        reading_under_test_high_value: match?.reading_under_test_high_value,
        reading_under_test_mid_value: match?.reading_under_test_mid_value,
        reading_under_test_low_value: match?.reading_under_test_low_value,
        reference_reading_high_value: match?.reference_reading_high_value,
        reference_reading_mid_value: match?.reference_reading_mid_value,
        reference_reading_low_value: match?.reference_reading_low_value,
        reading_unit_under_test: match?.reading_under_test_unit,
        reading_unit_reference: match?.reference_reading_unit,
      }
      setVerificationEditingId(match.id || null)
      setVerificationForm((prev) => ({
        ...prev,
        notes: shouldClearNotes ? '' : normalizedNotes,
        responses: responsesById,
        reference_equipment_id: parsed?.reference_equipment_id || hydrometerParsed?.reference_equipment_id || kfParsed.balanceId || prev.reference_equipment_id,
        kf_weight_1: kfParsed.weight1 || prev.kf_weight_1,
        kf_volume_1: kfParsed.volume1 || prev.kf_volume_1,
        kf_weight_2: kfParsed.weight2 || prev.kf_weight_2,
        kf_volume_2: kfParsed.volume2 || prev.kf_volume_2,
        product_name: hydrometerParsed?.product_name || prev.product_name,
        thermometer_working_id: hydrometerParsed?.thermometer_working_id || prev.thermometer_working_id,
        hydrometer_working_value: hydrometerParsed?.hydrometer_working_value || prev.hydrometer_working_value,
        hydrometer_reference_value: hydrometerParsed?.hydrometer_reference_value || prev.hydrometer_reference_value,
        thermometer_working_value: hydrometerParsed?.thermometer_working_value || prev.thermometer_working_value,
        thermometer_reference_value: hydrometerParsed?.thermometer_reference_value || prev.thermometer_reference_value,
        thermometer_unit: hydrometerParsed?.thermometer_unit || prev.thermometer_unit,
        reading_under_test_f: parsed?.reading_under_test_f || prev.reading_under_test_f,
        reference_reading_f: parsed?.reference_reading_f || prev.reference_reading_f,
        balance_reading_value: parsed?.balance_reading_value || prev.balance_reading_value,
        reading_unit_under_test: parsed?.reading_unit_under_test || monthlyFromApi.reading_unit_under_test || prev.reading_unit_under_test,
        reading_unit_reference: parsed?.reading_unit_reference || monthlyFromApi.reading_unit_reference || prev.reading_unit_reference,
        reading_under_test_high_value: parsed?.reading_under_test_high_value || monthlyFromApi.reading_under_test_high_value || prev.reading_under_test_high_value,
        reading_under_test_mid_value: parsed?.reading_under_test_mid_value || monthlyFromApi.reading_under_test_mid_value || prev.reading_under_test_mid_value,
        reading_under_test_low_value: parsed?.reading_under_test_low_value || monthlyFromApi.reading_under_test_low_value || prev.reading_under_test_low_value,
        reference_reading_high_value: parsed?.reference_reading_high_value || monthlyFromApi.reference_reading_high_value || prev.reference_reading_high_value,
        reference_reading_mid_value: parsed?.reference_reading_mid_value || monthlyFromApi.reference_reading_mid_value || prev.reference_reading_mid_value,
        reference_reading_low_value: parsed?.reference_reading_low_value || monthlyFromApi.reference_reading_low_value || prev.reference_reading_low_value,
      }))
    } else {
      setVerificationEditingId(null)
      setVerificationForm((prev) => ({
        ...prev,
        notes: '',
        responses: {},
        reference_equipment_id: '',
        kf_weight_1: '',
        kf_volume_1: '',
        kf_weight_2: '',
        kf_volume_2: '',
        product_name: 'Crudo',
        thermometer_working_id: '',
        hydrometer_working_value: '',
        hydrometer_reference_value: '',
        thermometer_working_value: '',
        thermometer_reference_value: '',
        thermometer_unit: 'c',
        reading_under_test_f: '',
        reference_reading_f: '',
        balance_reading_value: '',
        reading_under_test_high_value: '',
        reading_under_test_mid_value: '',
        reading_under_test_low_value: '',
        reference_reading_high_value: '',
        reference_reading_mid_value: '',
        reference_reading_low_value: '',
      }))
    }
  }, [verificationForm.verified_at]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!inspectionForm.inspected_at || !inspectionEquipment) return
    const newDate = inspectionForm.inspected_at
    const inspections = Array.isArray(inspectionEquipment?.inspections)
      ? inspectionEquipment.inspections
      : []
    const match = inspections.find((ins) => {
      if (!ins?.inspected_at) return false
      return utcToColombiaDateStr(ins.inspected_at) === newDate
    })
    if (match) {
      const responsesById = {}
      if (Array.isArray(match.responses)) {
        match.responses.forEach((resp) => {
          if (!resp?.inspection_item_id) return
          responsesById[resp.inspection_item_id] = {
            response_type: resp.response_type,
            value_bool: resp.value_bool,
            value_text: resp.value_text,
            value_number: resp.value_number,
          }
        })
      }
      setInspectionEditingId(match.id || null)
      setInspectionForm((prev) => ({
        inspected_at: prev.inspected_at,
        notes: match.notes || '',
        responses: responsesById,
      }))
    } else {
      setInspectionEditingId(null)
      setInspectionForm((prev) => ({
        inspected_at: prev.inspected_at,
        notes: '',
        responses: {},
      }))
    }
  }, [inspectionForm.inspected_at]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!calibrationForm.calibrated_at || !calibrationEquipment) return
    const isHydrometer = isHydrometerEquipment(calibrationEquipment)
    const isKarlFischer = isKarlFischerEquipment(calibrationEquipment)
    const isThermoHygro = isThermoHygrometerEquipment(calibrationEquipment)
    const defaultUnit = isHydrometer ? 'api' : isKarlFischer ? 'ml' : ''

    const newDate = calibrationForm.calibrated_at
    const calibrations = Array.isArray(calibrationEquipment?.calibrations)
      ? calibrationEquipment.calibrations
      : []
    const match = calibrations.find((c) => {
      if (!c?.calibrated_at) return false
      return utcToColombiaDateStr(c.calibrated_at) === newDate
    })

    if (match) {
      setCalibrationEditingId(match.id || null)
      setCalibrationForm((prev) => ({
        calibrated_at: prev.calibrated_at,
        calibration_company_id: match.calibration_company_id ? String(match.calibration_company_id) : '',
        certificate_number: match.certificate_number || '',
        notes: match.notes || '',
      }))
      setCalibrationCertificateUrl(match.certificate_pdf_url || '')
      const mapped = mapCalibrationResultsRows({ results: match.results, defaultUnit })
      const rowsWithFallback = mapped.length > 0 ? mapped : [getEmptyCalibrationRow(defaultUnit)]
      const split = splitThermoHygroRows(calibrationEquipment, rowsWithFallback)
      if (split) {
        setCalibrationResultsTemp(split.temp)
        setCalibrationResultsHumidity(split.humidity)
        setCalibrationResults([])
      } else {
        setCalibrationResults(rowsWithFallback)
        setCalibrationResultsTemp([])
        setCalibrationResultsHumidity([])
      }
    } else {
      setCalibrationEditingId(null)
      setCalibrationForm((prev) => ({
        calibrated_at: prev.calibrated_at,
        calibration_company_id: '',
        certificate_number: '',
        notes: '',
      }))
      setCalibrationCertificateUrl('')
      if (isThermoHygro) {
        setCalibrationResultsTemp([getEmptyCalibrationRow('c')])
        setCalibrationResultsHumidity([getEmptyCalibrationRow('%')])
        setCalibrationResults([])
      } else {
        setCalibrationResults([getEmptyCalibrationRow(defaultUnit)])
        setCalibrationResultsTemp([])
        setCalibrationResultsHumidity([])
      }
    }
  }, [calibrationForm.calibrated_at]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCalibrationSubmit = useEquipmentCalibrationSubmit({
    tokenType,
    accessToken,
    queryClient,
    calibrationEquipment,
    calibrationForm,
    calibrationResults,
    calibrationResultsTemp,
    calibrationResultsHumidity,
    calibrationEditingId,
    calibrationOriginalDate,
    calibrationFile,
    canEditCalibrationDate,
    isHydrometerEquipment,
    isThermoHygrometerEquipment,
    hideCalibrationDialog,
    closeCalibration,
    setToast,
    setCalibrationFieldErrors,
    setCalibrationFocusField,
    setIsCalibrationWaitOpen,
    setIsCalibrationLoading,
    setIsCalibrationOpen,
  })

  useEffect(() => {
    if (isCalibrationOpen) return
    setCalibrationFieldErrors({})
    setCalibrationFocusField('')
  }, [isCalibrationOpen])

  const handleInspectionDelete = async (inspectionId) => {
    try {
      await deleteEquipmentInspection({ tokenType, accessToken, inspectionId })
      await queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setToast({ open: true, message: 'Inspección eliminada correctamente.', severity: 'success' })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar la inspección.',
        severity: 'error',
      })
    }
  }

  const handleVerificationDelete = async (verificationId) => {
    try {
      await deleteEquipmentVerification({ tokenType, accessToken, verificationId })
      await queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setToast({ open: true, message: 'Verificación eliminada correctamente.', severity: 'success' })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar la verificación.',
        severity: 'error',
      })
    }
  }

  const handleCalibrationDelete = async (calibrationId) => {
    setIsCalibrationWaitOpen(true)
    try {
      await deleteEquipmentCalibration({ tokenType, accessToken, calibrationId })
      await queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setToast({ open: true, message: 'Calibración eliminada correctamente.', severity: 'success' })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar la calibración.',
        severity: 'error',
      })
    } finally {
      setIsCalibrationWaitOpen(false)
    }
  }

  const closeInspectionBlockedAlert = () => {
    setIsInspectionBlockedAlertOpen(false)
    setInspectionBlockedSerial('')
    setInspectionBlockedTypeName('')
    setInspectionBlockedRoleLabel('')
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
            Equipos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Gestiona los equipos del laboratorio
          </Typography>
        </Box>
        {!isReadOnly ? (
          <Button
            type="button"
            variant="contained"
            size="small"
            startIcon={<Add fontSize="small" />}
            onClick={() => {
              setFormData({
                internal_code: '',
                serial: '',
                component_serials_text: '',
                model: '',
                brand: '',
                status: 'in_use',
                equipment_type_id: '',
                owner_company_id: '',
                terminal_id: '',
                weight_class: '',
                nominal_mass_value: '',
                nominal_mass_unit: '',
              })
              setMeasureSpecs({})
              setIsCreateOpen(true)
            }}
            sx={{ height: 40 }}
          >
            Nuevo equipo
          </Button>
        ) : null}
      </Box>
      <EquipmentsListPanel
        query={query}
        statusFilter={statusFilter}
        activeFilter={activeFilter}
        terminalFilter={terminalFilter}
        terminalOptions={terminalFilterOptions}
        statusOptions={STATUS_OPTIONS}
        canFilterActive={canFilterActive}
        hasActiveFilters={hasActiveFilters}
        filteredCount={filteredEquipments.length}
        onQueryChange={(value) => {
          setQuery(value)
          setPage(1)
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setPage(1)
        }}
        onActiveFilterChange={(value) => {
          setActiveFilter(value)
          setPage(1)
        }}
        onTerminalFilterChange={(value) => {
          setTerminalFilter(value)
          setPage(1)
        }}
        onClearFilters={handleClearFilters}
        equipmentsError={equipmentsError}
        equipmentsErrorMessage={equipmentsErrorMessage}
        isEquipmentsLoading={isEquipmentsLoading}
        pagedEquipments={pagedEquipments}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        renderRoleBadge={renderRoleBadge}
        canSeeAdminStatus={canSeeAdminStatus}
        renderAdminStatusBadge={renderAdminStatusBadge}
        renderStatusBadge={renderStatusBadge}
        getCalibrationTooltip={getCalibrationTooltip}
        renderCalibrationBadge={renderCalibrationBadge}
        isReadOnly={isReadOnly}
        onOpenCalibration={openCalibration}
        shouldSkipInspection={shouldSkipInspection}
        getInspectionTooltip={getInspectionTooltip}
        renderInspectionBadge={renderInspectionBadge}
        isCalibrationVigente={isCalibrationVigente}
        onOpenInspection={openInspection}
        getVerificationTypesForEquipment={getVerificationTypesForEquipment}
        isVerificationTypesLoading={isVerificationTypesLoading}
        getVerificationStatusForType={getVerificationStatusForType}
        getVerificationTypeTooltip={getVerificationTypeTooltip}
        onOpenVerification={openVerification}
        onOpenView={openView}
        onOpenEdit={openEdit}
        onOpenDelete={openDelete}
        canDeleteEquipment={canDeleteEquipment}
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
      <EquipmentCreateDialog
        open={isCreateOpen}
        onClose={(event, reason) => handleDialogClose(event, reason, () => setIsCreateOpen(false))}
        onCancel={() => setIsCreateOpen(false)}
        onSave={handleCreateSubmit}
        formData={formData}
        setFormData={setFormData}
        equipmentTypes={equipmentTypes}
        isWeightEquipmentType={isWeightEquipmentType}
        syncMeasureSpecs={syncMeasureSpecs}
        formatEquipmentTypeOptionLabel={formatEquipmentTypeOptionLabel}
        companies={companies}
        terminals={terminals}
        statusOptions={STATUS_OPTIONS}
        isWeightTypeSelected={isWeightTypeSelected}
        weightClassOptions={WEIGHT_CLASS_OPTIONS}
        weightNominalOptions={WEIGHT_NOMINAL_G_OPTIONS}
        getWeightEmp={getWeightEmp}
        selectedMeasures={selectedMeasures}
        getMeasureLabel={getMeasureLabel}
        measureSpecs={measureSpecs}
        setMeasureSpecs={setMeasureSpecs}
        getUnitOptions={getUnitOptions}
      />
      <EquipmentEditDialog
        open={isEditOpen}
        onClose={(event, reason) => handleDialogClose(event, reason, closeEdit)}
        onCancel={closeEdit}
        onSave={handleEditSubmit}
        formData={formData}
        setFormData={setFormData}
        selectedEquipmentTypeName={selectedEquipmentTypeName}
        selectedEquipmentTypeRole={selectedEquipmentTypeRole}
        equipmentTypes={equipmentTypes}
        syncMeasureSpecs={syncMeasureSpecs}
        availableEditRoles={availableEditRoles}
        equipmentRoleLabels={EQUIPMENT_ROLE_LABELS}
        companies={companies}
        terminals={terminals}
        statusOptions={STATUS_OPTIONS}
        isWeightTypeSelected={isWeightTypeSelected}
        weightClassOptions={WEIGHT_CLASS_OPTIONS}
        weightNominalOptions={WEIGHT_NOMINAL_G_OPTIONS}
        getWeightEmp={getWeightEmp}
        selectedMeasures={selectedMeasures}
        getMeasureLabel={getMeasureLabel}
        measureSpecs={measureSpecs}
        setMeasureSpecs={setMeasureSpecs}
        getUnitOptions={getUnitOptions}
      />
      <EquipmentViewDialog
        open={isViewOpen}
        onClose={(event, reason) => handleDialogClose(event, reason, closeView)}
        onCancel={closeView}
        viewEquipment={viewEquipment}
        renderStatusBadge={renderStatusBadge}
        getMeasureLabel={getMeasureLabel}
        formatSpecValue={formatSpecValue}
        getBaseUnitLabel={getBaseUnitLabel}
        shouldSkipInspection={shouldSkipInspection}
        renderInspectionBadge={renderInspectionBadge}
        getLastInspectionDateLabel={getLastInspectionDateLabel}
        openInspectionHistory={openInspectionHistory}
        getVerificationTypesForEquipment={getVerificationTypesForEquipment}
        getLastVerificationDateLabelByType={getLastVerificationDateLabelByType}
        getVerificationStatusForType={getVerificationStatusForType}
        getVerificationTypeTooltip={getVerificationTypeTooltip}
        openVerificationHistory={openVerificationHistory}
        renderCalibrationBadge={renderCalibrationBadge}
        getLastCalibrationDateLabel={getLastCalibrationDateLabel}
        openCalibrationHistory={openCalibrationHistory}
        isEquipmentHistoryLoading={isEquipmentHistoryLoading}
        equipmentHistoryError={equipmentHistoryError}
        equipmentHistoryItems={equipmentHistoryItems}
        getEquipmentTypeNameById={getEquipmentTypeNameById}
        getEquipmentTypeRoleLabelById={getEquipmentTypeRoleLabelById}
        getTerminalNameById={getTerminalNameById}
        getStatusLabelByValue={getStatusLabelByValue}
        formatDateTime={formatDateTime}
        getUserNameById={getUserNameById}
      />
      <InspectionHistoryDialog
        open={isInspectionHistoryOpen}
        onClose={(event, reason) => handleDialogClose(event, reason, closeInspectionHistory)}
        onCancel={closeInspectionHistory}
        viewEquipment={viewEquipment}
        inspectionHistoryItems={inspectionHistoryItems}
        canEditInspectionDate={canEditInspectionDate}
        renderVerificationResultLabel={renderVerificationResultLabel}
        openInspectionHistoryEdit={openInspectionHistoryEdit}
        onDeleteInspection={handleInspectionDelete}
      />
      <CalibrationHistoryDialog
        open={isCalibrationHistoryOpen}
        onClose={(event, reason) => handleDialogClose(event, reason, closeCalibrationHistory)}
        onCancel={closeCalibrationHistory}
        viewEquipment={viewEquipment}
        canEditCalibrationDate={canEditCalibrationDate}
        getCompanyNameById={getCompanyNameById}
        openCalibrationHistoryEdit={openCalibrationHistoryEdit}
        onDeleteCalibration={handleCalibrationDelete}
      />
      <VerificationHistoryDialog
        open={isVerificationHistoryOpen}
        onClose={(event, reason) => handleDialogClose(event, reason, closeVerificationHistory)}
        onCancel={closeVerificationHistory}
        viewEquipment={viewEquipment}
        isMonthlyVerificationType={isMonthlyVerificationType}
        verificationHistoryTypeId={verificationHistoryTypeId}
        verificationRangeMode={verificationRangeMode}
        setVerificationRangeMode={setVerificationRangeMode}
        verificationRangeMonth={verificationRangeMonth}
        setVerificationRangeMonth={setVerificationRangeMonth}
        verificationRangeYear={verificationRangeYear}
        setVerificationRangeYear={setVerificationRangeYear}
        getFilteredVerifications={getFilteredVerifications}
        isKarlFischerEquipment={isKarlFischerEquipment}
        isBalanceEquipment={isBalanceEquipment}
        isTapeEquipment={isTapeEquipment}
        isHydrometerEquipment={isHydrometerEquipment}
        canEditVerificationDate={canEditVerificationDate}
        renderVerificationResultLabel={renderVerificationResultLabel}
        openVerificationHistoryEdit={openVerificationHistoryEdit}
        onDeleteVerification={handleVerificationDelete}
        parseVerificationComparison={parseVerificationComparison}
        getEquipmentSerialById={getEquipmentSerialById}
        parseBalanceComparisonFromNotes={parseBalanceComparisonFromNotes}
        equipments={equipments}
        parseTapeNotes={parseTapeNotes}
        formatTapeReadingsLabel={formatTapeReadingsLabel}
        getTapeAverage={getTapeAverage}
        getKarlFischerAverageFactor={getKarlFischerAverageFactor}
        buildControlChartPointsFromVerifications={buildControlChartPointsFromVerifications}
      />
      <InspectionDialog
        open={isInspectionOpen}
        onClose={(event, reason) => handleDialogClose(event, reason, closeInspection)}
        onCancel={closeInspection}
        onSave={handleInspectionSubmit}
        inspectionEditMode={
          inspectionEditMode &&
          (!inspectionOriginalDate ||
            !inspectionForm.inspected_at ||
            inspectionForm.inspected_at === inspectionOriginalDate)
        }
        inspectionEquipment={inspectionEquipment}
        canEditInspectionDate={canEditInspectionDate}
        inspectionForm={inspectionForm}
        setInspectionForm={setInspectionForm}
        inspectionItems={inspectionItems}
        isInspectionLoading={isInspectionLoading}
      />
      <InspectionWaitDialog
        open={isInspectionWaitOpen}
        onClose={() => {
          setIsInspectionWaitOpen(false)
          setIsInspectionLoading(false)
        }}
      />
      <InspectionReplaceDialog
        open={isInspectionReplaceOpen}
        onClose={() => {
          setIsInspectionReplaceOpen(false)
          setIsInspectionOpen(true)
          setPendingInspectionPayload(null)
        }}
        onCancel={() => {
          setIsInspectionReplaceOpen(false)
          setIsInspectionOpen(true)
          setPendingInspectionPayload(null)
        }}
        onReplace={handleInspectionReplace}
      />
      <InspectionNoAptaConfirmDialog
        open={isInspectionNoAptaConfirmOpen}
        onClose={() => {
          setIsInspectionNoAptaConfirmOpen(false)
          setInspectionNoAptaConfirmMessage('')
        }}
        onEdit={() => {
          setIsInspectionNoAptaConfirmOpen(false)
          setInspectionNoAptaConfirmMessage('')
        }}
        onContinue={() => {
          setIsInspectionNoAptaConfirmOpen(false)
          void handleInspectionSubmit({ forceNoAptaSave: true })
        }}
        message={inspectionNoAptaConfirmMessage}
      />
      <InspectionBlockedAlertDialog
        open={isInspectionBlockedAlertOpen}
        onClose={closeInspectionBlockedAlert}
        inspectionBlockedSerial={inspectionBlockedSerial}
        inspectionBlockedTypeName={inspectionBlockedTypeName}
        inspectionBlockedRoleLabel={inspectionBlockedRoleLabel}
      />
      <VerificationWaitDialog
        open={isVerificationWaitOpen}
        onClose={() => {
          setIsVerificationWaitOpen(false)
          setIsVerificationLoading(false)
        }}
      />
      <VerificationReplaceDialog
        open={isVerificationReplaceOpen}
        onClose={() => {
          setIsVerificationReplaceOpen(false)
          setIsVerificationOpen(true)
          setPendingVerificationPayload(null)
        }}
        onCancel={() => {
          setIsVerificationReplaceOpen(false)
          setIsVerificationOpen(true)
          setPendingVerificationPayload(null)
        }}
        onReplace={handleVerificationReplace}
      />
      <VerificationNoAptaConfirmDialog
        open={isVerificationNoAptaConfirmOpen}
        onClose={() => {
          setIsVerificationNoAptaConfirmOpen(false)
          setVerificationNoAptaConfirmMessage('')
        }}
        onEdit={() => {
          setIsVerificationNoAptaConfirmOpen(false)
          setVerificationNoAptaConfirmMessage('')
        }}
        onContinue={() => {
          setIsVerificationNoAptaConfirmOpen(false)
          void handleVerificationSubmit({ forceNoAptaSave: true })
        }}
        message={verificationNoAptaConfirmMessage}
      />
      <CalibrationWaitDialog
        open={isCalibrationWaitOpen}
        onClose={() => {
          setIsCalibrationWaitOpen(false)
          setIsCalibrationLoading(false)
        }}
      />
      <VerificationDialog
        open={isVerificationOpen}
        onClose={(event, reason) => handleDialogClose(event, reason, closeVerification)}
        onCancel={closeVerification}
        onSave={handleVerificationSubmit}
        verificationEditMode={
          verificationEditMode &&
          (!verificationOriginalDate ||
            !verificationForm.verified_at ||
            verificationForm.verified_at === verificationOriginalDate)
        }
        canEditVerificationDate={canEditVerificationDate}
        verificationEquipment={verificationEquipment}
        verificationForm={verificationForm}
        setVerificationForm={setVerificationForm}
        selectedVerificationType={selectedVerificationType}
        verificationTypes={verificationTypes}
        loadVerificationItems={loadVerificationItems}
        setVerificationItems={setVerificationItems}
        setToast={setToast}
        requiresComparisonReadings={requiresComparisonReadings}
        isHydrometerMonthlyVerification={isHydrometerMonthlyVerification}
        requiresKarlFischerVerification={requiresKarlFischerVerification}
        requiresBalanceComparison={requiresBalanceComparison}
        requiresTemperatureComparison={requiresTemperatureComparison}
        requiresTapeComparison={requiresTapeComparison}
        isMonthlyVerification={isMonthlyVerification}
        hydrometerThermometerOptions={hydrometerThermometerOptions}
        hydrometerReferenceOptions={hydrometerReferenceOptions}
        hydrometerProductOptions={hydrometerProductOptions}
        isHydrometerProductsLoading={isHydrometerProductsLoading}
        verificationFieldErrors={verificationFieldErrors}
        onClearVerificationFieldError={clearVerificationFieldError}
        verificationFocusField={verificationFocusField}
        onVerificationFocusHandled={() => setVerificationFocusField('')}
        hydrometerWorkApi60f={hydrometerWorkApi60f}
        hydrometerWorkApi60fError={hydrometerWorkApi60fError}
        hydrometerRefApi60f={hydrometerRefApi60f}
        hydrometerRefApi60fError={hydrometerRefApi60fError}
        referenceEquipmentOptions={referenceEquipmentOptions}
        selectedReferenceEquipment={selectedReferenceEquipment}
        kfBalanceOptions={kfBalanceOptions}
        convertLengthToMmDisplay={convertLengthToMmDisplay}
        convertTemperatureToFDisplay={convertTemperatureToFDisplay}
        normalizeWeightToGrams={normalizeWeightToGrams}
        getWeightEmp={getWeightEmp}
        verificationItems={verificationItems}
        isVerificationLoading={isVerificationLoading}
      />
      <CalibrationDialog
        open={isCalibrationOpen}
        onClose={(event, reason) => handleDialogClose(event, reason, closeCalibration)}
        onCancel={closeCalibration}
        onSave={handleCalibrationSubmit}
        calibrationEditMode={
          calibrationEditMode &&
          (!calibrationOriginalDate ||
            !calibrationForm.calibrated_at ||
            calibrationForm.calibrated_at === calibrationOriginalDate)
        }
        calibrationEquipment={calibrationEquipment}
        canEditCalibrationDate={canEditCalibrationDate}
        calibrationForm={calibrationForm}
        setCalibrationForm={setCalibrationForm}
        calibrationFieldErrors={calibrationFieldErrors}
        onClearCalibrationFieldError={clearCalibrationFieldError}
        calibrationFocusField={calibrationFocusField}
        onCalibrationFocusHandled={() => setCalibrationFocusField('')}
        companies={companies}
        terminals={terminals}
        isThermoHygrometerEquipment={isThermoHygrometerEquipment}
        calibrationResultsTemp={calibrationResultsTemp}
        setCalibrationResultsTemp={setCalibrationResultsTemp}
        getEmptyCalibrationRow={getEmptyCalibrationRow}
        calibrationResultsHumidity={calibrationResultsHumidity}
        setCalibrationResultsHumidity={setCalibrationResultsHumidity}
        isHydrometerEquipment={isHydrometerEquipment}
        isKarlFischerEquipment={isKarlFischerEquipment}
        isWeightEquipmentType={isWeightEquipmentType}
        calibrationResults={calibrationResults}
        setCalibrationResults={setCalibrationResults}
        isThermometerEquipment={isThermometerEquipment}
        setCalibrationFile={setCalibrationFile}
        getCertificateLabel={getCertificateLabel}
        isCalibrationLoading={isCalibrationLoading}
      />
      <EquipmentFeedbackDialogs
        isControlChartAlertOpen={isControlChartAlertOpen}
        onCloseControlChartAlert={() => setIsControlChartAlertOpen(false)}
        controlChartAlertCount={controlChartAlertCount}
        isDeleteOpen={isDeleteOpen}
        onCloseDelete={(event, reason) => handleDialogClose(event, reason, closeDelete)}
        deletingEquipment={deletingEquipment}
        isDeleteLoading={isDeleteLoading}
        onCancelDelete={closeDelete}
        onConfirmDelete={handleDeleteSubmit}
        isCreateLoading={isCreateLoading}
        isUpdateLoading={isUpdateLoading}
        toast={toast}
        onCloseToast={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </section>
  )
}

export default EquipmentsTable




