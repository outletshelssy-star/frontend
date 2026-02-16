import { useEffect, useMemo, useState } from 'react'
import {
  Add,
  Cancel,
  CheckCircle,
  DeleteOutline,
  EditOutlined,
  FactCheck,
  FilterAltOff,
  VerifiedOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TableSortLabel,
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
  createEquipmentVerification,
  createEquipmentCalibration,
  deleteEquipment,
  fetchEquipmentInspections,
  fetchEquipmentById,
  fetchEquipmentHistory,
  fetchEquipmentTypeInspectionItems,
  fetchUsers,
  fetchEquipmentTypeVerifications,
  fetchEquipmentTypeVerificationItems,
  uploadEquipmentCalibrationCertificate,
  calculateHydrometerApi60f,
  updateEquipmentInspection,
  updateEquipmentVerification,
  updateEquipmentCalibration,
  updateEquipment,
} from '../services/api'

const STATUS_OPTIONS = [
  { value: 'stored', label: 'Almacenado' },
  { value: 'in_use', label: 'En uso' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'needs_review', label: 'Requiere revision' },
  { value: 'lost', label: 'Perdido' },
  { value: 'disposed', label: 'Desechado' },
  { value: 'unknown', label: 'Desconocido' },
]
const EQUIPMENT_ROLE_LABELS = {
  reference: 'Patron',
  working: 'Trabajo',
}
const WEIGHT_CLASS_OPTIONS = ['E1', 'E2', 'F1', 'F2', 'M1', 'M2', 'M3']
const WEIGHT_NOMINAL_G_OPTIONS = [200, 100, 50, 20, 10, 5, 2, 1]
const WEIGHT_EMP_TABLE_MG = {
  200: { E1: 0.1, E2: 0.3, F1: 1.0, F2: 3.0, M1: 10.0, M2: 30.0, M3: 100.0 },
  100: { E1: 0.05, E2: 0.16, F1: 0.5, F2: 1.6, M1: 5.0, M2: 16.0, M3: 50.0 },
  50: { E1: 0.03, E2: 0.1, F1: 0.3, F2: 1.0, M1: 3.0, M2: 10.0, M3: 30.0 },
  20: { E1: 0.03, E2: 0.08, F1: 0.25, F2: 0.8, M1: 2.5, M2: 8.0, M3: 25.0 },
  10: { E1: 0.02, E2: 0.06, F1: 0.2, F2: 0.6, M1: 2.0, M2: 6.0, M3: 20.0 },
  5: { E1: 0.02, E2: 0.05, F1: 0.16, F2: 0.5, M1: 1.6, M2: 5.0, M3: 16.0 },
  2: { E1: 0.01, E2: 0.04, F1: 0.12, F2: 0.4, M1: 1.2, M2: 4.0, M3: 12.0 },
  1: { E1: 0.01, E2: 0.03, F1: 0.1, F2: 0.3, M1: 1.0, M2: 3.0, M3: 10.0 },
}

const parseComponentSerialsInput = (rawValue) => {
  return String(rawValue || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(':')
      if (separatorIndex === -1) {
        return {
          component_name: line,
          serial: '',
        }
      }
      return {
        component_name: line.slice(0, separatorIndex).trim(),
        serial: line.slice(separatorIndex + 1).trim(),
      }
    })
}

const serializeComponentSerials = (items = []) => {
  if (!Array.isArray(items)) return ''
  return items
    .map((item) => {
      const name = String(item?.component_name || '').trim()
      const serial = String(item?.serial || '').trim()
      if (!name && !serial) return ''
      return `${name}: ${serial}`.trim()
    })
    .filter(Boolean)
    .join('\n')
}

const EquipmentsTable = ({
  equipments,
  equipmentsError,
  isEquipmentsLoading,
  equipmentTypes,
  companies,
  terminals,
  currentUser,
  tokenType,
  accessToken,
  onEquipmentChanged,
}) => {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('active')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
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
  const [isInspectionHistoryOpen, setIsInspectionHistoryOpen] = useState(false)
  const [inspectionHistoryItems, setInspectionHistoryItems] = useState([])
  const [isCalibrationHistoryOpen, setIsCalibrationHistoryOpen] = useState(false)
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false)
  const [isCalibrationLoading, setIsCalibrationLoading] = useState(false)
  const [isCalibrationWaitOpen, setIsCalibrationWaitOpen] = useState(false)
  const [calibrationEquipment, setCalibrationEquipment] = useState(null)
  const [calibrationFile, setCalibrationFile] = useState(null)
  const [calibrationEditMode, setCalibrationEditMode] = useState(false)
  const [calibrationEditingId, setCalibrationEditingId] = useState(null)
  const [calibrationForm, setCalibrationForm] = useState({
    calibrated_at: '',
    calibration_company_id: '',
    calibration_company_name: '',
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
  const [inspectionForm, setInspectionForm] = useState({
    notes: '',
    inspected_at: '',
    responses: {},
  })
  const [verificationEquipment, setVerificationEquipment] = useState(null)
  const [verificationTypes, setVerificationTypes] = useState([])
  const [verificationTypesByEquipmentType, setVerificationTypesByEquipmentType] = useState({})
  const [verificationItems, setVerificationItems] = useState([])
  const [verificationEditMode, setVerificationEditMode] = useState(false)
  const [verificationEditingId, setVerificationEditingId] = useState(null)
  const [hydrometerWorkApi60f, setHydrometerWorkApi60f] = useState('')
  const [hydrometerWorkApi60fError, setHydrometerWorkApi60fError] = useState('')
  const [hydrometerRefApi60f, setHydrometerRefApi60f] = useState('')
  const [hydrometerRefApi60fError, setHydrometerRefApi60fError] = useState('')
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
    String(new Date().getMonth() + 1)
  )
  const [verificationRangeYear, setVerificationRangeYear] = useState(
    String(new Date().getFullYear())
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

  const role = String(currentUser?.user_type || '').toLowerCase()
  const isReadOnly = role === 'visitor'
  const canFilterActive = role === 'superadmin'
  const canSeeAdminStatus = role === 'admin' || role === 'superadmin'
  const canEditInspectionDate = role === 'admin' || role === 'superadmin'
  const canEditVerificationDate = role === 'admin' || role === 'superadmin'
  const canEditCalibrationDate = role === 'admin' || role === 'superadmin'
  const canDeleteEquipment = role === 'admin' || role === 'superadmin'
  const hasActiveFilters =
    query.trim().length > 0 ||
    statusFilter !== 'all' ||
    (canFilterActive && activeFilter !== 'active')

  useEffect(() => {
    const uniqueTypeIds = Array.from(
      new Set(
        (equipments || [])
          .map((item) => item?.equipment_type_id)
          .filter((id) => id !== null && id !== undefined)
      )
    )
    if (!uniqueTypeIds.length || !accessToken) {
      setVerificationTypesByEquipmentType({})
      return
    }
    let cancelled = false
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
          })
        )
        if (cancelled) return
        setVerificationTypesByEquipmentType(Object.fromEntries(results))
      } catch {
        if (!cancelled) {
          setVerificationTypesByEquipmentType({})
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
    const limit = isTape ? 2 : 0.5
    const isMonthlyHistory = isMonthlyVerificationType(
      viewEquipment,
      verificationHistoryTypeId
    )
    const points = buildControlChartPointsFromVerifications(
      getFilteredVerifications(viewEquipment),
      isMonthlyHistory,
      isTape,
      isBalance
    )
    const count = points.filter((p) => {
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
    const refreshed = equipments.find(
      (item) => String(item?.id) === String(viewEquipment?.id)
    )
    if (refreshed) {
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
      (typeName === 'cinta metrica plomada fondo' ||
        typeName === 'cinta metrica plomada vacio')
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
      (typeName === 'cinta metrica plomada fondo' ||
        typeName === 'cinta metrica plomada vacio')
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
      const unit = String(row.unit || '').trim().toLowerCase()
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
        ? (equipmentTypes || []).find(
            (type) => type.id === equipment.equipment_type_id
          )
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
    const avgRefMatch = text.match(/Promedio patron:\s*([-+]?\d*[.,]?\d+)\s*mm/i)
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
        (typeItem) =>
          String(typeItem.id) === String(verificationForm.verification_type_id)
      ),
    [verificationTypes, verificationForm.verification_type_id]
  )

  const isMonthlyVerification = Number(selectedVerificationType?.frequency_days) === 30
  const isHydrometerMonthlyVerification =
    isHydrometerEquipment(verificationEquipment) && isMonthlyVerification

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
          data?.api_60f !== undefined && data?.api_60f !== null
            ? String(data.api_60f)
            : ''
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
          data?.api_60f !== undefined && data?.api_60f !== null
            ? String(data.api_60f)
            : ''
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
        const specMeasures = (item?.measure_specs || []).map((spec) =>
          String(spec?.measure || '')
        )
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
    return referenceEquipmentOptions.find(
      (item) => String(item.id) === selectedId
    ) || null
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
    setPage(1)
  }

  const filteredEquipments = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return equipments.filter((item) => {
      const canSeeInactive = role === 'superadmin'
      if (!canSeeInactive && item.is_active === false) {
        return false
      }
      if (canSeeInactive) {
        if (activeFilter === 'active' && item.is_active === false) {
          return false
        }
        if (activeFilter === 'inactive' && item.is_active !== false) {
          return false
        }
      }
      const matchesStatus =
        statusFilter === 'all' ? true : item.status === statusFilter
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
      return matchesStatus && matchesQuery
    })
  }, [equipments, query, statusFilter, activeFilter, role])

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
        case 'company':
          return ''
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
    const label =
      STATUS_OPTIONS.find((option) => option.value === status)?.label || status || '-'
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
    String(type?.name || '').toLowerCase().includes('pesa')

const getWeightEmp = (nominalValue, weightClass) => {
    const nominalKey = Number(nominalValue)
    const classKey = String(weightClass || '').toUpperCase()
  if (!WEIGHT_EMP_TABLE_MG[nominalKey]) return null
  const empMg = WEIGHT_EMP_TABLE_MG[nominalKey]?.[classKey]
  if (empMg === null || empMg === undefined) return null
  return empMg / 1000
}

const formatWeightSuffix = (nominalValue) => {
  const numeric = Number(nominalValue)
  if (!Number.isFinite(numeric)) return ''
  const value =
    Number.isInteger(numeric) ? String(numeric) : String(numeric).replace(/0+$/, '').replace(/\.$/, '')
  return `${value}G`
}

const normalizeWeightToGrams = (value, unit) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  const key = String(unit || '').trim().toLowerCase()
  if (key === 'g') return numeric
  if (key === 'mg') return numeric / 1000
  if (key === 'kg') return numeric * 1000
  return null
}

const normalizeWeightSerial = (serial, nominalValue) => {
  const suffix = formatWeightSuffix(nominalValue)
  if (!suffix) return { serial, changed: false }
  const raw = String(serial || '').trim()
  const normalized = raw.replace(/\s+/g, ' ')
  const normalizedCompact = normalized.toUpperCase().replace(/\s+/g, '')
  const expectedCompact = suffix.toUpperCase()
  if (normalizedCompact.endsWith(expectedCompact)) {
    return { serial: normalized, changed: false }
  }
  const cleaned = normalized.replace(/\s*\d+(?:\.\d+)?\s*[gG]\s*$/, '').trim()
  const next = cleaned ? `${cleaned} ${suffix}` : suffix
  return { serial: next, changed: true, suffix }
}

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
    const match = (terminals || []).find(
      (terminal) => String(terminal?.id) === String(terminalId)
    )
    return match?.name || String(terminalId)
  }

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : '-'

  const getUserNameById = (userId) => {
    if (!userId) return '-'
    return userNameById[String(userId)] || String(userId)
  }
  const getLatestApprovedInspectionDate = (inspections = []) => {
    if (!Array.isArray(inspections)) return null
    const validDates = inspections
      .filter((inspection) => inspection?.is_ok === true)
      .map((inspection) => new Date(inspection?.inspected_at))
      .filter((date) => !Number.isNaN(date.getTime()))
    if (!validDates.length) return null
    return validDates.reduce((max, current) => (current > max ? current : max))
  }

  const isInspectionVigente = (equipment) => {
    const days =
      equipment?.inspection_days_override ?? equipment?.equipment_type?.inspection_days
    const frequencyDays = Number(days ?? 0)
    if (frequencyDays <= 0) return true
    const lastApprovedDate = getLatestApprovedInspectionDate(equipment?.inspections)
    if (!lastApprovedDate) return false
    const diffMs = Date.now() - lastApprovedDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays <= frequencyDays
  }

  const getLatestCalibrationDate = (calibrations = []) => {
    if (!Array.isArray(calibrations)) return null
    const validDates = calibrations
      .map((calibration) => new Date(calibration?.calibrated_at))
      .filter((date) => !Number.isNaN(date.getTime()))
    if (!validDates.length) return null
    return validDates.reduce((max, current) => (current > max ? current : max))
  }

  const isCalibrationVigente = (equipment) => {
    const days = equipment?.equipment_type?.calibration_days
    const frequencyDays = Number(days ?? 0)
    const lastCalibrationDate = getLatestCalibrationDate(equipment?.calibrations)
    if (!lastCalibrationDate) return false
    if (frequencyDays <= 0) return true
    const diffMs = Date.now() - lastCalibrationDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays <= frequencyDays
  }

  const renderInspectionBadge = (equipment) => {
    const isValid = isInspectionVigente(equipment)
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isValid ? '#16a34a' : '#dc2626',
        }}
      >
        {isValid ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
      </Box>
    )
  }

  const getLastInspectionDateLabel = (inspections = []) => {
    if (!Array.isArray(inspections) || inspections.length === 0) {
      return 'Sin inspecciones'
    }
    const validDates = inspections
      .map((inspection) => new Date(inspection?.inspected_at))
      .filter((date) => !Number.isNaN(date.getTime()))
    if (!validDates.length) {
      return 'Sin inspecciones'
    }
    const latest = validDates.reduce((max, current) => (current > max ? current : max))
    return latest.toLocaleDateString()
  }

  const getEquipmentTypeFor = (equipment) => {
    if (!equipment) return null
    if (equipment.equipment_type) return equipment.equipment_type
    if (!equipment.equipment_type_id) return null
    return (equipmentTypes || []).find((type) => type.id === equipment.equipment_type_id) || null
  }

  const getInspectionFrequencyLabel = (equipment) => {
    const equipmentType = getEquipmentTypeFor(equipment)
    const days =
      equipment?.inspection_days_override ?? equipmentType?.inspection_days
    if (!days || Number(days) === 0) {
      return 'No aplica'
    }
    return `Cada ${days} dias`
  }

  const getInspectionTooltip = (equipment) => {
    const last = getLastInspectionDateLabel(equipment?.inspections)
    const frequency = getInspectionFrequencyLabel(equipment)
    return (
      <Box sx={{ display: 'grid', gap: 0.25 }}>
        <Typography variant="caption">Ultima: {last}</Typography>
        <Typography variant="caption">Frecuencia: {frequency}</Typography>
      </Box>
    )
  }

  const renderVerificationBadge = (verifications = []) => {
    const hasApproved = Array.isArray(verifications)
      ? verifications.some((verification) => verification?.is_ok === true)
      : false
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: hasApproved ? '#16a34a' : '#dc2626',
        }}
      >
        {hasApproved ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
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

  const renderCalibrationBadge = (calibrations = []) => {
    const hasCalibration = Array.isArray(calibrations) && calibrations.length > 0
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: hasCalibration ? '#16a34a' : '#dc2626',
        }}
      >
        {hasCalibration ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
      </Box>
    )
  }

  const getLastCalibrationDateLabel = (calibrations = []) => {
    const latest = getLatestCalibration(calibrations)
    if (!latest) return 'Sin calibraciones'
    return latest.date.toLocaleDateString()
  }

  const getCalibrationFrequencyLabel = (equipment) => {
    const equipmentType = getEquipmentTypeFor(equipment)
    const days = equipmentType?.calibration_days
    if (!days || Number(days) === 0) {
      return 'No aplica'
    }
    return `Cada ${days} dias`
  }

  const getCalibrationTooltip = (equipment) => {
    const latest = getLatestCalibration(equipment?.calibrations || [])
    const frequency = getCalibrationFrequencyLabel(equipment)
    if (!latest) {
      return (
        <Box sx={{ display: 'grid', gap: 0.25 }}>
          <Typography variant="caption">Sin calibraciones</Typography>
          <Typography variant="caption">Frecuencia: {frequency}</Typography>
        </Box>
      )
    }
    return (
      <Box sx={{ display: 'grid', gap: 0.25 }}>
        <Typography variant="caption">
          Ultima: {latest.date.toLocaleDateString()}
        </Typography>
        <Typography variant="caption">Frecuencia: {frequency}</Typography>
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
    return latest.toLocaleDateString()
  }

  const getLatestVerifications = (equipment, limit = 10) => {
    const verifications = Array.isArray(equipment?.verifications)
      ? equipment.verifications
      : []
    return [...verifications]
      .filter((verification) => verification?.verified_at)
      .sort(
        (a, b) =>
          new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime()
      )
      .slice(0, limit)
  }

  const getVerificationTypeLabelById = (equipment, verificationTypeId) => {
    const equipmentTypeId = equipment?.equipment_type_id
    const items = verificationTypesByEquipmentType[String(equipmentTypeId)] || []
    const match = items.find(
      (item) => String(item.id) === String(verificationTypeId)
    )
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
      const formatTriplet = (a, b, c) =>
        [a, b, c].filter(Boolean).join(' | ')
      return {
        patronId: patronMatch ? patronMatch[1] : null,
        underTest: formatTriplet(
          altoEquipo ? `Alto: ${altoEquipo[1].trim()}` : null,
          medioEquipo ? `Medio: ${medioEquipo[1].trim()}` : null,
          bajoEquipo ? `Bajo: ${bajoEquipo[1].trim()}` : null
        ),
        reference: formatTriplet(
          altoPatron ? `Alto: ${altoPatron[1].trim()}` : null,
          medioPatron ? `Medio: ${medioPatron[1].trim()}` : null,
          bajoPatron ? `Bajo: ${bajoPatron[1].trim()}` : null
        ),
        diff: formatTriplet(
          diffAlto ? `Alto: ${diffAlto[1].trim()}` : null,
          diffMedio ? `Medio: ${diffMedio[1].trim()}` : null,
          diffBajo ? `Bajo: ${diffBajo[1].trim()}` : null
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
    const match = text.match(
      /Diferencia\s*\(Patron-Equipo\):\s*([-+]?\d*\.?\d+)\s*mm/i
    )
    if (!match) return null
    const raw = Number(match[1])
    if (Number.isNaN(raw)) return null
    return raw
  }

  const parseDifferenceToG = (notes = '') => {
    const text = String(notes || '')
    const match = text.match(
      /Diferencia\s*\(Pesa-Balanza\):\s*([-+]?\d*[\.,]?\d+)\s*g/i
    )
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
      const match = text.match(
        new RegExp(`${label}\\s*:\\s*([-+]?\\d*\\.?\\d+)\\s*([cCfF])?`, 'i')
      )
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
    const items =
      verificationTypesByEquipmentType[String(equipment?.equipment_type_id)] || []
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
          dateLabel: new Date(verification.verified_at).toLocaleDateString(),
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
    isBalance = false
  ) => {
    return (verifications || [])
      .map((verification) => {
        if (!verification?.verified_at) return null
        const ts = new Date(verification.verified_at).getTime()
        if (Number.isNaN(ts)) return null
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
              (item) => String(item?.id) === String(patronId)
            )
            if (referenceEquipment) {
              const storedEmp = Number(referenceEquipment.emp_value)
              if (storedEmp > 0) {
                emp = storedEmp
              } else if (
                referenceEquipment.nominal_mass_value &&
                referenceEquipment.weight_class
              ) {
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
            dateLabel: new Date(verification.verified_at).toLocaleDateString(),
            diffG,
            emp,
          }
        }
        if (isTape) {
          const diffMm = parseDifferenceToMm(verification?.notes)
          if (diffMm === null) return null
          return {
            ts,
            dateLabel: new Date(verification.verified_at).toLocaleDateString(),
            diffMm,
          }
        }
        if (isMonthly) {
          const diffs = parseMonthlyDifferencesToF(verification?.notes)
          if (!diffs) return null
          return {
            ts,
            dateLabel: new Date(verification.verified_at).toLocaleDateString(),
            diffHighF: diffs.high,
            diffMidF: diffs.mid,
            diffLowF: diffs.low,
          }
        }
        const diffF = parseDifferenceToF(verification?.notes)
        if (diffF === null) return null
        return {
          ts,
          dateLabel: new Date(verification.verified_at).toLocaleDateString(),
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
            String(verification?.verification_type_id) === verificationHistoryTypeId
        )
      : all
    if (!byType.length) return []
    const isMonthlyHistory = isMonthlyVerificationType(
      equipment,
      verificationHistoryTypeId
    )
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
      return date.getMonth() + 1 === month && date.getFullYear() === year
    })
  }

  const getEquipmentSerialById = (equipmentId) => {
    if (!equipmentId) return '-'
    const match = (equipments || []).find(
      (item) => String(item?.id) === String(equipmentId)
    )
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
    return `${typeItem?.name || ''} (${days} ${days === 1 ? 'dia' : 'dias'})`
  }

  const getLastVerificationDateLabelByType = (equipment, typeId) => {
    if (!equipment || !typeId) return 'Sin verificaciones'
    const verifications = Array.isArray(equipment?.verifications) ? equipment.verifications : []
    const filtered = verifications.filter(
      (verification) =>
        String(verification?.verification_type_id) === String(typeId),
    )
    return getLastVerificationDateLabel(filtered)
  }

  const isVerificationWithinFrequency = (verifiedAt, frequencyDays) => {
    if (!verifiedAt || !frequencyDays || frequencyDays <= 0) return false
    const verifiedDate = new Date(verifiedAt)
    if (Number.isNaN(verifiedDate.getTime())) return false
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const verifiedMidnight = new Date(
      verifiedDate.getFullYear(),
      verifiedDate.getMonth(),
      verifiedDate.getDate(),
    )
    const diffMs = todayMidnight.getTime() - verifiedMidnight.getTime()
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    if (diffDays < 0) return false
    return frequencyDays === 1 ? diffDays === 0 : diffDays < frequencyDays
  }

  const getVerificationStatusForType = (equipment, typeItem) => {
    if (!equipment || !typeItem?.id) {
      return { hasApproved: false, lastLabel: 'Sin verificaciones' }
    }
    const verifications = Array.isArray(equipment?.verifications) ? equipment.verifications : []
    const filtered = verifications.filter(
      (verification) =>
        String(verification?.verification_type_id) === String(typeItem.id),
    )
    const frequencyDays = Number(typeItem?.frequency_days ?? 0)
    const hasApproved = filtered.some(
      (verification) =>
        verification?.is_ok === true &&
        isVerificationWithinFrequency(verification?.verified_at, frequencyDays),
    )
    const lastLabel = getLastVerificationDateLabel(filtered)
    return { hasApproved, lastLabel }
  }

  const getVerificationTypeTooltip = (equipment, typeItem) => {
    const last = getLastVerificationDateLabelByType(equipment, typeItem?.id)
    const days = Number(typeItem?.frequency_days ?? 0)
    const frequency = !days || days <= 0 ? 'No aplica' : `Cada ${days} ${days === 1 ? 'dia' : 'dias'}`
    return (
      <Box sx={{ display: 'grid', gap: 0.25 }}>
        <Typography variant="caption">Ultima: {last}</Typography>
        <Typography variant="caption">Frecuencia: {frequency}</Typography>
      </Box>
    )
  }

  const convertTemperatureToFDisplay = (value, unit) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return null
    const normalized = String(unit || 'c').toLowerCase()
    if (normalized === 'f') return numeric
    if (normalized === 'c') return numeric * 9 / 5 + 32
    if (normalized === 'k') return (numeric - 273.15) * 9 / 5 + 32
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
    const marker = 'Comparacion '
    const markerIndex = text.indexOf(marker)
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
          new RegExp(`${label}\\s*:\\s*([-+]?\\d*[\\.,]?\\d+)\\s*([a-zA-Z])?`, 'i')
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
    const lecturaEquipoPart = parts.find((part) =>
      part.toLowerCase().startsWith('lectura equipo:'),
    )
    const lecturaPatronPart = parts.find((part) =>
      part.toLowerCase().startsWith('lectura patron:'),
    )
    if (!lecturaEquipoPart || !lecturaPatronPart) {
      return { cleanNotes: text, parsed: null }
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
        new RegExp(`${label}\\s*:\\s*([-+]?\\d*[\\.,]?\\d+)\\s*([a-zA-Z°]+)?`, 'i')
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
    return text
      .replace(/\s*Hidrometro mensual[\s\S]*$/i, '')
      .trim()
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
      case 'length':
        return 'Longitud'
      case 'pressure':
        return 'Presion'
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

  const getBaseUnitValue = (measure) => {
    switch (measure) {
      case 'temperature':
        return 'c'
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

  const selectedEquipmentType = equipmentTypes.find(
    (type) => String(type.id) === String(formData.equipment_type_id)
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
      items.sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
      setEquipmentHistoryItems(items)
    } catch (err) {
      setEquipmentHistoryError(
        err?.detail || 'No se pudo cargar el historial del equipo.'
      )
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

  const openCalibrationHistoryEdit = (equipment, calibration) => {
    if (!equipment || !calibration) return
    const isHydrometer = isHydrometerEquipment(equipment)
    const isKarlFischer = isKarlFischerEquipment(equipment)
    setCalibrationEquipment(equipment)
    setCalibrationEditMode(true)
    setCalibrationEditingId(calibration.id || null)
    setCalibrationForm({
      calibrated_at: canEditCalibrationDate && calibration.calibrated_at
        ? new Date(calibration.calibrated_at).toISOString().slice(0, 10)
        : '',
      calibration_company_id: calibration.calibration_company_id
        ? String(calibration.calibration_company_id)
        : '',
      calibration_company_name: calibration.calibration_company_name || '',
      certificate_number: calibration.certificate_number || '',
      notes: calibration.notes || '',
    })
    const results = Array.isArray(calibration.results) ? calibration.results : []
    const mappedResults = results.length
      ? results.map((row) => ({
          point_label: row.point_label || '',
          reference_value: row.reference_value ?? '',
          measured_value: row.measured_value ?? '',
          unit: row.unit || (isHydrometer ? 'api' : isKarlFischer ? 'ml' : ''),
          error_value: row.error_value ?? '',
          tolerance_value: row.tolerance_value ?? '',
          volume_value: row.volume_value ?? '',
          systematic_error: row.systematic_error ?? '',
          systematic_emp: row.systematic_emp ?? '',
          random_error: row.random_error ?? '',
          random_emp: row.random_emp ?? '',
          uncertainty_value: row.uncertainty_value ?? '',
          k_value: row.k_value ?? '',
          is_ok:
            row.is_ok === true ? 'true' : row.is_ok === false ? 'false' : '',
          notes: row.notes || '',
        }))
      : [getEmptyCalibrationRow(isHydrometer ? 'api' : isKarlFischer ? 'ml' : '')]
    const split = splitThermoHygroRows(equipment, mappedResults)
    if (split) {
      setCalibrationResultsTemp(split.temp)
      setCalibrationResultsHumidity(split.humidity)
      setCalibrationResults([])
    } else {
      setCalibrationResults(mappedResults)
      setCalibrationResultsTemp([])
      setCalibrationResultsHumidity([])
    }
    setCalibrationFile(null)
    setIsCalibrationHistoryOpen(false)
    setIsCalibrationOpen(true)
  }

  const openCalibration = (equipment) => {
    const today = new Date().toISOString().slice(0, 10)
    const isHydrometer = isHydrometerEquipment(equipment)
    const isWeight = isWeightEquipmentType(equipment?.equipment_type)
    const isKarlFischer = isKarlFischerEquipment(equipment)
    const isThermoHygro = isThermoHygrometerEquipment(equipment)
    const isScale = String(equipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase() === 'balanza analitica'
    const calibrations = Array.isArray(equipment?.calibrations)
      ? equipment.calibrations
      : []
    const latest = [...calibrations]
      .filter((item) => item?.calibrated_at)
      .sort((a, b) => new Date(b.calibrated_at) - new Date(a.calibrated_at))[0]
    setCalibrationEquipment(equipment)
    if (latest) {
      setCalibrationEditMode(true)
      setCalibrationEditingId(latest.id || null)
      setCalibrationForm({
        calibrated_at: canEditCalibrationDate
          ? new Date(latest.calibrated_at).toISOString().slice(0, 10)
          : '',
        calibration_company_id: latest.calibration_company_id
          ? String(latest.calibration_company_id)
          : '',
        calibration_company_name: latest.calibration_company_name || '',
        certificate_number: latest.certificate_number || '',
        notes: latest.notes || '',
      })
      const results = Array.isArray(latest.results) ? latest.results : []
      const mapped = results.length
        ? results.map((row) => ({
            point_label: row.point_label || '',
            reference_value: row.reference_value ?? '',
            measured_value: row.measured_value ?? '',
            unit: row.unit || (isHydrometer ? 'api' : isWeight ? 'g' : isKarlFischer ? 'ml' : ''),
            error_value: row.error_value ?? '',
            tolerance_value: row.tolerance_value ?? '',
            volume_value: row.volume_value ?? '',
            systematic_error: row.systematic_error ?? '',
            systematic_emp: row.systematic_emp ?? '',
            random_error: row.random_error ?? '',
            random_emp: row.random_emp ?? '',
            uncertainty_value: row.uncertainty_value ?? '',
            k_value: row.k_value ?? '',
            is_ok:
              row.is_ok === true ? 'true' : row.is_ok === false ? 'false' : '',
            notes: row.notes || '',
          }))
        : isScale
          ? []
          : [getEmptyCalibrationRow(isHydrometer ? 'api' : isWeight ? 'g' : isKarlFischer ? 'ml' : '')]
      if (isThermoHygro) {
        const split = splitThermoHygroRows(equipment, mapped)
        const temp = split?.temp || []
        const humidity = split?.humidity || []
        setCalibrationResultsTemp(temp)
        setCalibrationResultsHumidity(humidity)
        setCalibrationResults([])
      } else {
        setCalibrationResults(mapped)
        setCalibrationResultsTemp([])
        setCalibrationResultsHumidity([])
      }
    } else {
      setCalibrationEditMode(false)
      setCalibrationEditingId(null)
      setCalibrationForm({
        calibrated_at: canEditCalibrationDate ? today : '',
        calibration_company_id: '',
        calibration_company_name: '',
        certificate_number: '',
        notes: '',
      })
      const fresh = isScale
        ? []
        : [getEmptyCalibrationRow(isHydrometer ? 'api' : isWeight ? 'g' : isKarlFischer ? 'ml' : '')]
      if (isThermoHygro) {
        setCalibrationResultsTemp([getEmptyCalibrationRow('c')])
        setCalibrationResultsHumidity([getEmptyCalibrationRow('%')])
        setCalibrationResults([])
      } else {
        setCalibrationResults(fresh)
        setCalibrationResultsTemp([])
        setCalibrationResultsHumidity([])
      }
    }
    setCalibrationFile(null)
    setIsCalibrationOpen(true)
  }

  const closeCalibration = () => {
    setIsCalibrationOpen(false)
    setCalibrationEquipment(null)
    setCalibrationForm({
      calibrated_at: '',
      calibration_company_id: '',
      calibration_company_name: '',
      certificate_number: '',
      notes: '',
    })
    setCalibrationResults([])
    setCalibrationResultsTemp([])
    setCalibrationResultsHumidity([])
    setCalibrationFile(null)
    setCalibrationEditMode(false)
    setCalibrationEditingId(null)
  }

  const hideCalibrationDialog = () => {
    setIsCalibrationOpen(false)
  }

  const openVerificationHistory = (typeId = '') => {
    const normalizedTypeId = typeId ? String(typeId) : ''
    setVerificationHistoryTypeId(normalizedTypeId)
    setVerificationRangeMode(normalizedTypeId ? 'last30' : 'all')
    setIsVerificationHistoryOpen(true)
  }

  const openInspectionHistoryEdit = async (inspection) => {
    if (!inspection || !viewEquipment) return
    const inspectedDate = inspection?.inspected_at
      ? new Date(inspection.inspected_at).toISOString().slice(0, 10)
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
        message: err?.detail || 'No se pudieron cargar los items de inspeccion.',
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
      ? new Date(verification.verified_at).toISOString().slice(0, 10)
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
    const cleanedHydrometerNotes = stripHydrometerNotes(cleanNotes || rawNotes)
    const kfParsed = parseKarlFischerNotes(verification.notes || '')
    const normalizedNotes = cleanedHydrometerNotes || ''
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
    setVerificationEditMode(true)
    setVerificationEditingId(verification.id || null)
    setVerificationForm({
      verification_type_id: String(verification?.verification_type_id || ''),
      notes: shouldClearNotes ? '' : normalizedNotes,
      verified_at: canEditVerificationDate ? verifiedDate : '',
      reference_equipment_id:
        parsed?.reference_equipment_id || kfParsed.balanceId || '',
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
      balance_reading_value: '',
      balance_unit: 'g',
      reading_under_test_high_value:
        parsed?.reading_under_test_high_value ||
        monthlyFromApi.reading_under_test_high_value ||
        '',
      reading_under_test_mid_value:
        parsed?.reading_under_test_mid_value ||
        monthlyFromApi.reading_under_test_mid_value ||
        '',
      reading_under_test_low_value:
        parsed?.reading_under_test_low_value ||
        monthlyFromApi.reading_under_test_low_value ||
        '',
      reference_reading_high_value:
        parsed?.reference_reading_high_value ||
        monthlyFromApi.reference_reading_high_value ||
        '',
      reference_reading_mid_value:
        parsed?.reference_reading_mid_value ||
        monthlyFromApi.reference_reading_mid_value ||
        '',
      reference_reading_low_value:
        parsed?.reference_reading_low_value ||
        monthlyFromApi.reference_reading_low_value ||
        '',
      reading_unit_under_test:
        parsed?.reading_unit_under_test ||
        monthlyFromApi.reading_unit_under_test ||
        'c',
      reading_unit_reference:
        parsed?.reading_unit_reference ||
        monthlyFromApi.reading_unit_reference ||
        'c',
      responses: responsesById,
    })
    setIsVerificationOpen(true)
    try {
      const verificationTypesData = await fetchEquipmentTypeVerifications({
        tokenType,
        accessToken,
        equipmentTypeId: viewEquipment.equipment_type_id,
      })
      const items = Array.isArray(verificationTypesData.items)
        ? verificationTypesData.items
        : []
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
        message: err?.detail || 'No se pudieron cargar los items de verificacion.',
        severity: 'error',
      })
    }
  }

  const openInspection = async (equipment) => {
    setInspectionEquipment(equipment)
    const today = new Date().toISOString().slice(0, 10)
    setInspectionForm({
      notes: '',
      inspected_at: canEditInspectionDate ? today : '',
      responses: {},
    })
    setInspectionItems([])
    setInspectionEditMode(false)
    setInspectionEditingId(null)
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
      const now = new Date()
      const todayKey = now.toISOString().slice(0, 10)
      const todaysInspections = inspections
        .filter((inspection) => {
          const inspectedAt = inspection?.inspected_at
          if (!inspectedAt) return false
          const dateKey = new Date(inspectedAt).toISOString().slice(0, 10)
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
        setInspectionForm({
          notes: latest.notes || '',
          inspected_at: latest.inspected_at || '',
          responses: responsesById,
        })
        setInspectionEditMode(true)
      }
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudieron cargar los items de inspeccion.',
        severity: 'error',
      })
    }
  }

  const closeInspection = () => {
    setIsInspectionOpen(false)
    setInspectionEquipment(null)
    setInspectionItems([])
    setInspectionForm({ notes: '', inspected_at: '', responses: {} })
    setInspectionEditMode(false)
    setInspectionEditingId(null)
  }

  const handleDialogClose = (event, reason, onClose) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return
    }
    onClose()
  }

  const hideInspectionDialog = () => {
    setIsInspectionOpen(false)
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
    const today = new Date().toISOString().slice(0, 10)
    const equipmentTypeName = String(equipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    const isTapeType =
      equipmentTypeName === 'cinta metrica plomada fondo' ||
      equipmentTypeName === 'cinta metrica plomada vacio'
    const defaultReadingUnit = isTapeType ? 'mm' : 'c'
    setVerificationEquipment(equipment)
    setVerificationTypes([])
    setVerificationEditingId(null)
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
      const items = Array.isArray(verificationTypesData.items)
        ? verificationTypesData.items
        : []
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
        const verifications = Array.isArray(equipment?.verifications)
          ? equipment.verifications
          : []
        const today = new Date()
        const todayKey = today.toISOString().slice(0, 10)
        const todaysVerification = verifications
          .filter((verification) => {
            if (!verification?.verified_at) return false
            if (String(verification?.verification_type_id) !== String(selected.id)) {
              return false
            }
            const dateKey = new Date(verification.verified_at).toISOString().slice(0, 10)
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
          const cleanedHydrometerNotes = stripHydrometerNotes(cleanNotes || rawNotes)
          const normalizedNotes = cleanedHydrometerNotes || ''
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
              ? new Date(latest.verified_at).toISOString().slice(0, 10)
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
              hydrometerParsed?.thermometer_reference_value ||
              prev.thermometer_reference_value,
            thermometer_unit:
              hydrometerParsed?.thermometer_unit || prev.thermometer_unit,
            reading_under_test_f:
              parsed?.reading_under_test_f || prev.reading_under_test_f,
            reading_unit_under_test:
              parsed?.reading_unit_under_test ||
              monthlyFromApi.reading_unit_under_test ||
              prev.reading_unit_under_test,
            reference_reading_f:
              parsed?.reference_reading_f || prev.reference_reading_f,
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
          setVerificationEditingId(latest.id || null)
          setVerificationEditMode(true)
        }
      }
    } catch (err) {
      setToast({
        open: true,
        message:
          err?.detail || 'No se pudieron cargar los tipos o items de verificacion.',
        severity: 'error',
      })
    }
  }

  const closeVerification = () => {
    setIsVerificationOpen(false)
    setIsVerificationWaitOpen(false)
    setVerificationEquipment(null)
    setVerificationTypes([])
    setVerificationItems([])
    setHydrometerWorkApi60f('')
    setHydrometerWorkApi60fError('')
    setHydrometerRefApi60f('')
    setHydrometerRefApi60fError('')
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
  }

  const hideVerificationDialog = () => {
    setIsVerificationOpen(false)
  }

  const openDelete = (equipment) => {
    setDeletingEquipment(equipment)
    setIsDeleteOpen(true)
  }

  const closeDelete = () => {
    setIsDeleteOpen(false)
    setDeletingEquipment(null)
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
      (type) => String(type.id) === String(equipment.equipment_type_id)
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
          Equipos
        </Typography>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por serial, modelo, marca o terminal"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            sx={{ minWidth: 260, flex: '1 1 260px' }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {canFilterActive ? (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="equipment-active-filter">Activo</InputLabel>
              <Select
                labelId="equipment-active-filter"
                value={activeFilter}
                label="Activo"
                onChange={(event) => {
                  setActiveFilter(event.target.value)
                  setPage(1)
                }}
              >
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="inactive">Inactivos</MenuItem>
                <MenuItem value="all">Todos</MenuItem>
              </Select>
            </FormControl>
          ) : null}
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
          label={`${filteredEquipments.length} resultados`}
          size="small"
          sx={{ backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: 600 }}
        />
      </Box>
      {equipmentsError ? (
        <Typography className="error" component="p">
          {equipmentsError}
        </Typography>
      ) : null}
      {!equipmentsError && !isEquipmentsLoading && filteredEquipments.length === 0 ? (
        <Typography className="meta" component="p">
          No hay equipos para mostrar.
        </Typography>
      ) : null}
      {!equipmentsError && filteredEquipments.length > 0 ? (
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
                      active={sortBy === 'type'}
                      direction={sortBy === 'type' ? sortDir : 'asc'}
                      onClick={() => handleSort('type')}
                    >
                      Tipo de equipo
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="left">
                    <TableSortLabel
                      active={sortBy === 'serial'}
                      direction={sortBy === 'serial' ? sortDir : 'asc'}
                      onClick={() => handleSort('serial')}
                    >
                      Serial
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="left">
                    <TableSortLabel
                      active={sortBy === 'brand'}
                      direction={sortBy === 'brand' ? sortDir : 'asc'}
                      onClick={() => handleSort('brand')}
                    >
                      Marca
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="left">
                    <TableSortLabel
                      active={sortBy === 'model'}
                      direction={sortBy === 'model' ? sortDir : 'asc'}
                      onClick={() => handleSort('model')}
                    >
                      Modelo
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="left">
                    <TableSortLabel
                      active={sortBy === 'terminal'}
                    direction={sortBy === 'terminal' ? sortDir : 'asc'}
                    onClick={() => handleSort('terminal')}
                  >
                    Terminal
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
                            
                          <TableCell align="center">Calibracion</TableCell>
                          <TableCell align="center">Inspeccion</TableCell>
                          <TableCell align="center">Verificacion</TableCell>
                          <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
              {pagedEquipments.map((item, index) => (
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
                          {item.equipment_type?.name || '-'}
                        </Typography>
                        {renderRoleBadge(item.equipment_type?.role)}
                        {canSeeAdminStatus ? renderAdminStatusBadge(item.is_active) : null}
                      </Box>
                    </TableCell>
                    <TableCell>{item.serial}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>{item.terminal?.name || '-'}</TableCell>
                            <TableCell align="center">
                              {renderStatusBadge(item.status)}
                            </TableCell>
                            
                            <TableCell align="center">
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                <Tooltip title={getCalibrationTooltip(item)} arrow placement="top">
                                  <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {renderCalibrationBadge(item?.calibrations)}
                                  </Box>
                                </Tooltip>
                                {!isReadOnly ? (
                                  <Tooltip title="Registrar calibracion" arrow>
                                    <IconButton
                                      size="small"
                                      aria-label="Registrar calibracion"
                                      onClick={() => openCalibration(item)}
                                      disabled={item.status !== 'in_use'}
                                      sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                                    >
                                      <FactCheck fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                ) : null}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {isWeightEquipmentType(item?.equipment_type) ? (
                                <Typography variant="caption" color="text.secondary">
                                  No aplica
                                </Typography>
                              ) : (
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                  <Tooltip title={getInspectionTooltip(item)} arrow placement="top">
                                    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                      {renderInspectionBadge(item)}
                                    </Box>
                                  </Tooltip>
                                  {!isReadOnly ? (
                                    <Tooltip
                                      title={
                                        !isCalibrationVigente(item)
                                          ? 'Se requiere calibracion vigente'
                                          : 'Registrar inspeccion'
                                      }
                                      arrow
                                    >
                                      <span>
                                        <IconButton
                                          size="small"
                                          aria-label="Registrar inspeccion"
                                          onClick={() => openInspection(item)}
                                          disabled={item.status !== 'in_use' || !isCalibrationVigente(item)}
                                          sx={{ color: '#64748b', '&:hover': { color: '#2563eb' } }}
                                        >
                                          <FactCheck fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  ) : null}
                                </Box>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {(() => {
                                const equipmentRole = String(item?.equipment_type?.role || '').toLowerCase()
                                if (equipmentRole === 'reference') {
                                  return (
                                    <Typography variant="caption" color="text.secondary">
                                      No aplica
                                    </Typography>
                                  )
                                }
                                const verificationTypesForRow = getVerificationTypesForEquipment(item)
                                if (verificationTypesForRow.length === 0) {
                                  return (
                                    <Typography variant="caption" color="text.secondary">
                                      No aplica
                                    </Typography>
                                  )
                                }
                                return (
                                  <Box
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.75,
                                      flexWrap: 'nowrap',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {verificationTypesForRow.map((typeItem, index) => {
                                      const { hasApproved } = getVerificationStatusForType(
                                        item,
                                        typeItem,
                                      )
                                      return (
                                        <Box
                                          key={typeItem.id}
                                          sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            pr: index < verificationTypesForRow.length - 1 ? 0.75 : 0,
                                            mr: index < verificationTypesForRow.length - 1 ? 0.25 : 0,
                                            borderRight:
                                              index < verificationTypesForRow.length - 1
                                                ? '1px solid #e2e8f0'
                                                : 'none',
                                          }}
                                        >
                                        <Tooltip
                                          title={getVerificationTypeTooltip(item, typeItem)}
                                          arrow
                                          placement="top"
                                        >
                                          <Box
                                            component="span"
                                            sx={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              color: hasApproved ? '#16a34a' : '#dc2626',
                                            }}
                                          >
                                            {hasApproved ? (
                                              <CheckCircle fontSize="small" />
                                            ) : (
                                              <Cancel fontSize="small" />
                                            )}
                                          </Box>
                                        </Tooltip>
                                        {!isReadOnly ? (
                                          <Tooltip
                                            title={
                                              !isCalibrationVigente(item)
                                                ? 'Se requiere calibracion vigente'
                                                : 'Registrar verificacion'
                                            }
                                            arrow
                                          >
                                            <span>
                                              <IconButton
                                                size="small"
                                                aria-label="Registrar verificacion"
                                                onClick={() => openVerification(item, typeItem.id)}
                                                disabled={item.status !== 'in_use' || !isCalibrationVigente(item)}
                                                sx={{ color: '#64748b', '&:hover': { color: '#16a34a' } }}
                                              >
                                                <VerifiedOutlined fontSize="small" />
                                              </IconButton>
                                            </span>
                                          </Tooltip>
                                        ) : null}
                                      </Box>
                                    )
                                    })}
                                  </Box>
                                )
                              })()}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                aria-label="Ver equipo"
                                onClick={() => openView(item)}
                                sx={{ color: '#64748b', '&:hover': { color: '#4338ca' } }}
                              >
                                <VisibilityOutlined fontSize="small" />
                              </IconButton>
                              {!isReadOnly ? (
                                <IconButton
                                  size="small"
                                  aria-label="Editar equipo"
                                  onClick={() => openEdit(item)}
                                  sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              ) : null}
                              {canDeleteEquipment && !isReadOnly ? (
                                <IconButton
                                  size="small"
                                  aria-label="Eliminar equipo"
                                  onClick={() => openDelete(item)}
                                  sx={{ color: '#64748b', '&:hover': { color: '#b91c1c' } }}
                                >
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              ) : null}
                            </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      {!equipmentsError && filteredEquipments.length > 0 ? (
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
              <InputLabel id="equipments-rows-per-page">Filas</InputLabel>
              <Select
                labelId="equipments-rows-per-page"
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
        <Dialog
          open={isCreateOpen}
          onClose={(event, reason) =>
            handleDialogClose(event, reason, () => setIsCreateOpen(false))
          }
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Nuevo equipo</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2, overflow: 'visible' }}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                label="Serial"
                value={formData.serial}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, serial: event.target.value }))
                }
                required
              />
              <TextField
                label="Seriales de componentes"
                value={formData.component_serials_text}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    component_serials_text: event.target.value,
                  }))
                }
                placeholder={"Cinta: CINTA-001\\nPlomada: PLOM-002"}
                multiline
                minRows={3}
                sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
              />
              <TextField
                label="Codigo interno"
                value={formData.internal_code}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, internal_code: event.target.value }))
                }
              />
              <TextField
                label="Marca"
                value={formData.brand}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, brand: event.target.value }))
                }
                required
              />
              <TextField
                label="Modelo"
                value={formData.model}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, model: event.target.value }))
                }
                required
              />
            <FormControl required>
              <InputLabel id="equipment-owner-create">Empresa dueña</InputLabel>
              <Select
                labelId="equipment-owner-create"
                label="Empresa dueña"
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
            <FormControl required>
              <InputLabel id="equipment-terminal-create">Terminal</InputLabel>
              <Select
                labelId="equipment-terminal-create"
                label="Terminal"
                value={formData.terminal_id}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, terminal_id: event.target.value }))
                }
              >
                {terminals.map((terminal) => (
                  <MenuItem key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
              <FormControl>
                <InputLabel id="equipment-status-create">Estado</InputLabel>
                <Select
                  labelId="equipment-status-create"
                  label="Estado"
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl required>
                <InputLabel id="equipment-type-create">Tipo de equipo</InputLabel>
                <Select
                  labelId="equipment-type-create"
                  label="Tipo de equipo"
                  value={formData.equipment_type_id}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    const nextType = equipmentTypes.find(
                      (type) => String(type.id) === String(nextValue)
                    )
                    const isWeightType = isWeightEquipmentType(nextType)
                    setFormData((prev) => ({
                      ...prev,
                      equipment_type_id: nextValue,
                      weight_class: isWeightType ? prev.weight_class : '',
                      nominal_mass_value: isWeightType ? prev.nominal_mass_value : '',
                      nominal_mass_unit: isWeightType ? 'g' : '',
                    }))
                    const measures = Array.isArray(nextType?.measures)
                      ? nextType.measures
                      : []
                    syncMeasureSpecs(measures)
                  }}
                >
                  {equipmentTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {formatEquipmentTypeOptionLabel(type)}
                    </MenuItem>
                  ))}
                </Select>
                {!equipmentTypes.length ? (
                  <FormHelperText>No hay tipos de equipo disponibles.</FormHelperText>
                ) : null}
              </FormControl>
              {isWeightTypeSelected ? (
                <>
                  <FormControl required>
                    <InputLabel id="equipment-weight-class-create">Clase</InputLabel>
                    <Select
                      labelId="equipment-weight-class-create"
                      label="Clase"
                      value={formData.weight_class}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          weight_class: event.target.value,
                        }))
                      }
                    >
                      {WEIGHT_CLASS_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl required>
                    <InputLabel id="equipment-weight-nominal-create">Peso nominal (g)</InputLabel>
                    <Select
                      labelId="equipment-weight-nominal-create"
                      label="Peso nominal (g)"
                      value={formData.nominal_mass_value}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          nominal_mass_value: event.target.value,
                        }))
                      }
                    >
                      {WEIGHT_NOMINAL_G_OPTIONS.map((option) => (
                        <MenuItem key={option} value={String(option)}>
                          {option} g
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="EMP"
                    value={
                      getWeightEmp(formData.nominal_mass_value, formData.weight_class) ??
                      ''
                    }
                    InputProps={{ readOnly: true }}
                  />
                </>
              ) : null}
          </Box>
          {selectedMeasures.length > 0 ? (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Especificaciones por medida
              </Typography>
                {selectedMeasures.map((measure) => (
                  <Box key={measure} sx={{ display: 'grid', gap: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {equipmentTypes
                        .flatMap((type) => type.measures || [])
                        .includes(measure)
                        ? measure
                        : measure}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                        alignItems: 'center',
                      }}
                    >
                      <TextField
                        label="Min"
                        type="number"
                        value={measureSpecs[measure]?.min_value ?? ''}
                        onChange={(event) =>
                          setMeasureSpecs((prev) => ({
                            ...prev,
                            [measure]: {
                              ...prev[measure],
                              min_value: event.target.value,
                            },
                          }))
                        }
                      />
                      <FormControl>
                        <InputLabel id={`measure-min-unit-${measure}`}>Unidad</InputLabel>
                        <Select
                          labelId={`measure-min-unit-${measure}`}
                          label="Unidad"
                          value={measureSpecs[measure]?.min_unit || ''}
                          onChange={(event) =>
                            setMeasureSpecs((prev) => ({
                              ...prev,
                              [measure]: {
                                ...prev[measure],
                                min_unit: event.target.value,
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
                      <TextField
                        label="Max"
                        type="number"
                        value={measureSpecs[measure]?.max_value ?? ''}
                        onChange={(event) =>
                          setMeasureSpecs((prev) => ({
                            ...prev,
                            [measure]: {
                              ...prev[measure],
                              max_value: event.target.value,
                            },
                          }))
                        }
                      />
                      <FormControl>
                        <InputLabel id={`measure-max-unit-${measure}`}>Unidad</InputLabel>
                        <Select
                          labelId={`measure-max-unit-${measure}`}
                          label="Unidad"
                          value={measureSpecs[measure]?.max_unit || ''}
                          onChange={(event) =>
                            setMeasureSpecs((prev) => ({
                              ...prev,
                              [measure]: {
                                ...prev[measure],
                                max_unit: event.target.value,
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
                      <TextField
                        label="Resolucion"
                        type="number"
                        value={measureSpecs[measure]?.resolution ?? ''}
                        onChange={(event) =>
                          setMeasureSpecs((prev) => ({
                            ...prev,
                            [measure]: {
                              ...prev[measure],
                              resolution: event.target.value,
                            },
                          }))
                        }
                      />
                      <FormControl>
                        <InputLabel id={`measure-resolution-unit-${measure}`}>Unidad</InputLabel>
                        <Select
                          labelId={`measure-resolution-unit-${measure}`}
                          label="Unidad"
                          value={measureSpecs[measure]?.resolution_unit || ''}
                          onChange={(event) =>
                            setMeasureSpecs((prev) => ({
                              ...prev,
                              [measure]: {
                                ...prev[measure],
                                resolution_unit: event.target.value,
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
                  </Box>
                ))}
              </Box>
            ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
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
                  message: 'Selecciona tipo, empresa dueña y terminal.',
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
                      message:
                        'Completa min, max, resolucion y sus unidades para cada medida.',
                      severity: 'error',
                    })
                    return
                  }
              }
              const componentSerials = parseComponentSerialsInput(
                formData.component_serials_text
              )
              if (
                componentSerials.some(
                  (item) =>
                    !String(item.component_name || '').trim() ||
                    !String(item.serial || '').trim()
                )
              ) {
                setToast({
                  open: true,
                  message:
                    'Cada componente debe tener nombre y serial en formato "Nombre: Serial".',
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
                const normalizedSerial = normalizeWeightSerial(
                  formData.serial,
                  nominalMassValue
                )
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
                await createEquipment({
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
                    nominal_mass_value: nominalMassValue
                      ? Number(nominalMassValue)
                      : null,
                    nominal_mass_unit: nominalMassUnit,
                    component_serials: componentSerials,
                    measure_specs: selectedMeasures.map((measure) => ({
                        measure,
                        min_unit: String(measureSpecs[measure]?.min_unit || '').trim(),
                        max_unit: String(measureSpecs[measure]?.max_unit || '').trim(),
                        resolution_unit: String(
                          measureSpecs[measure]?.resolution_unit || ''
                        ).trim(),
                        min_value: Number(measureSpecs[measure]?.min_value),
                        max_value: Number(measureSpecs[measure]?.max_value),
                        resolution: Number(measureSpecs[measure]?.resolution),
                      })),
                  },
                })
                if (onEquipmentChanged) {
                  await onEquipmentChanged()
                }
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
            }}
          >
            Guardar
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={isEditOpen}
          onClose={(event, reason) => handleDialogClose(event, reason, closeEdit)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Editar equipo</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2, overflow: 'visible' }}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                label="Serial"
                value={formData.serial}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, serial: event.target.value }))
                }
                required
              />
              <TextField
                label="Seriales de componentes"
                value={formData.component_serials_text}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    component_serials_text: event.target.value,
                  }))
                }
                placeholder={"Cinta: CINTA-001\\nPlomada: PLOM-002"}
                multiline
                minRows={3}
                sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
              />
              <TextField
                label="Codigo interno"
                value={formData.internal_code}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, internal_code: event.target.value }))
                }
              />
              <TextField
                label="Marca"
                value={formData.brand}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, brand: event.target.value }))
                }
                required
              />
              <TextField
                label="Modelo"
                value={formData.model}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, model: event.target.value }))
                }
                required
              />
              <FormControl required>
                <InputLabel id="equipment-owner-edit">Empresa dueña</InputLabel>
                <Select
                  labelId="equipment-owner-edit"
                  label="Empresa dueña"
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
              <FormControl required>
                <InputLabel id="equipment-terminal-edit">Terminal</InputLabel>
                <Select
                  labelId="equipment-terminal-edit"
                  label="Terminal"
                  value={formData.terminal_id}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, terminal_id: event.target.value }))
                  }
                >
                  {terminals.map((terminal) => (
                    <MenuItem key={terminal.id} value={terminal.id}>
                      {terminal.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel id="equipment-status-edit">Estado</InputLabel>
                <Select
                  labelId="equipment-status-edit"
                  label="Estado"
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel id="equipment-active-edit">Activo</InputLabel>
                <Select
                  labelId="equipment-active-edit"
                  label="Activo"
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
              <TextField
                label="Tipo de equipo"
                value={selectedEquipmentTypeName || '-'}
                InputProps={{ readOnly: true }}
              />
              <FormControl required>
                <InputLabel id="equipment-role-edit">Rol</InputLabel>
                <Select
                  labelId="equipment-role-edit"
                  label="Rol"
                  value={String(selectedEquipmentTypeRole || '').toLowerCase()}
                  onChange={(event) => {
                    const nextRole = String(event.target.value || '').toLowerCase()
                    if (!selectedEquipmentTypeName || !nextRole) return
                    const nextType = equipmentTypes.find(
                      (type) =>
                        String(type?.name || '') === String(selectedEquipmentTypeName) &&
                        String(type?.role || '').toLowerCase() === nextRole
                    )
                    if (!nextType) return
                    setFormData((prev) => ({
                      ...prev,
                      equipment_type_id: nextType.id,
                    }))
                    const measures = Array.isArray(nextType?.measures)
                      ? nextType.measures
                      : []
                    syncMeasureSpecs(measures)
                  }}
                >
                  {availableEditRoles.map((roleKey) => (
                    <MenuItem key={roleKey} value={roleKey}>
                      {EQUIPMENT_ROLE_LABELS[roleKey] || roleKey}
                    </MenuItem>
                  ))}
                </Select>
                {availableEditRoles.length === 0 ? (
                  <FormHelperText>No hay roles disponibles para este tipo.</FormHelperText>
                ) : availableEditRoles.length === 1 ? (
                  <FormHelperText>Solo existe un rol para este tipo.</FormHelperText>
                ) : null}
              </FormControl>
              {isWeightTypeSelected ? (
                <>
                  <FormControl required>
                    <InputLabel id="equipment-weight-class-edit">Clase</InputLabel>
                    <Select
                      labelId="equipment-weight-class-edit"
                      label="Clase"
                      value={formData.weight_class}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          weight_class: event.target.value,
                        }))
                      }
                    >
                      {WEIGHT_CLASS_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl required>
                    <InputLabel id="equipment-weight-nominal-edit">Peso nominal (g)</InputLabel>
                    <Select
                      labelId="equipment-weight-nominal-edit"
                      label="Peso nominal (g)"
                      value={formData.nominal_mass_value}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          nominal_mass_value: event.target.value,
                        }))
                      }
                    >
                      {WEIGHT_NOMINAL_G_OPTIONS.map((option) => (
                        <MenuItem key={option} value={String(option)}>
                          {option} g
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="EMP"
                    value={
                      getWeightEmp(formData.nominal_mass_value, formData.weight_class) ??
                      ''
                    }
                    InputProps={{ readOnly: true }}
                  />
                </>
              ) : null}
            </Box>
            {selectedMeasures.length > 0 ? (
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Especificaciones por medida
                </Typography>
                {selectedMeasures.map((measure) => (
                  <Box key={measure} sx={{ display: 'grid', gap: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {equipmentTypes
                        .flatMap((type) => type.measures || [])
                        .includes(measure)
                        ? measure
                        : measure}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                        alignItems: 'center',
                      }}
                    >
                      <TextField
                        label="Min"
                        type="number"
                        value={measureSpecs[measure]?.min_value ?? ''}
                        onChange={(event) =>
                          setMeasureSpecs((prev) => ({
                            ...prev,
                            [measure]: {
                              ...prev[measure],
                              min_value: event.target.value,
                            },
                          }))
                        }
                      />
                      <FormControl>
                        <InputLabel id={`measure-min-unit-edit-${measure}`}>Unidad</InputLabel>
                        <Select
                          labelId={`measure-min-unit-edit-${measure}`}
                          label="Unidad"
                          value={measureSpecs[measure]?.min_unit || ''}
                          onChange={(event) =>
                            setMeasureSpecs((prev) => ({
                              ...prev,
                              [measure]: {
                                ...prev[measure],
                                min_unit: event.target.value,
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
                      <TextField
                        label="Max"
                        type="number"
                        value={measureSpecs[measure]?.max_value ?? ''}
                        onChange={(event) =>
                          setMeasureSpecs((prev) => ({
                            ...prev,
                            [measure]: {
                              ...prev[measure],
                              max_value: event.target.value,
                            },
                          }))
                        }
                      />
                      <FormControl>
                        <InputLabel id={`measure-max-unit-edit-${measure}`}>Unidad</InputLabel>
                        <Select
                          labelId={`measure-max-unit-edit-${measure}`}
                          label="Unidad"
                          value={measureSpecs[measure]?.max_unit || ''}
                          onChange={(event) =>
                            setMeasureSpecs((prev) => ({
                              ...prev,
                              [measure]: {
                                ...prev[measure],
                                max_unit: event.target.value,
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
                      <TextField
                        label="Resolucion"
                        type="number"
                        value={measureSpecs[measure]?.resolution ?? ''}
                        onChange={(event) =>
                          setMeasureSpecs((prev) => ({
                            ...prev,
                            [measure]: {
                              ...prev[measure],
                              resolution: event.target.value,
                            },
                          }))
                        }
                      />
                      <FormControl>
                        <InputLabel id={`measure-resolution-unit-edit-${measure}`}>
                          Unidad
                        </InputLabel>
                        <Select
                          labelId={`measure-resolution-unit-edit-${measure}`}
                          label="Unidad"
                          value={measureSpecs[measure]?.resolution_unit || ''}
                          onChange={(event) =>
                            setMeasureSpecs((prev) => ({
                              ...prev,
                              [measure]: {
                                ...prev[measure],
                                resolution_unit: event.target.value,
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
                  </Box>
                ))}
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEdit}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={async () => {
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
                    message: 'Selecciona tipo, empresa dueña y terminal.',
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
                      message:
                        'Completa min, max, resolucion y sus unidades para cada medida.',
                      severity: 'error',
                    })
                    return
                  }
                }
                const componentSerials = parseComponentSerialsInput(
                  formData.component_serials_text
                )
                if (
                  componentSerials.some(
                    (item) =>
                      !String(item.component_name || '').trim() ||
                      !String(item.serial || '').trim()
                  )
                ) {
                  setToast({
                    open: true,
                    message:
                      'Cada componente debe tener nombre y serial en formato "Nombre: Serial".',
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
                  const normalizedSerial = normalizeWeightSerial(
                    formData.serial,
                    nominalMassValue
                  )
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
                  await updateEquipment({
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
                      nominal_mass_value: nominalMassValue
                        ? Number(nominalMassValue)
                        : null,
                      nominal_mass_unit: nominalMassUnit,
                    component_serials: componentSerials,
                    measure_specs: selectedMeasures.map((measure) => ({
                        measure,
                        min_unit: String(measureSpecs[measure]?.min_unit || '').trim(),
                        max_unit: String(measureSpecs[measure]?.max_unit || '').trim(),
                        resolution_unit: String(
                          measureSpecs[measure]?.resolution_unit || ''
                        ).trim(),
                        min_value: Number(measureSpecs[measure]?.min_value),
                        max_value: Number(measureSpecs[measure]?.max_value),
                        resolution: Number(measureSpecs[measure]?.resolution),
                      })),
                    },
                  })
                  if (onEquipmentChanged) {
                    await onEquipmentChanged()
                  }
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
              }}
            >
              Guardar cambios
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={isViewOpen}
          onClose={(event, reason) => handleDialogClose(event, reason, closeView)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Detalle de equipo</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              }}
            >
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Identificacion
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo de equipo
                </Typography>
                <Typography>{viewEquipment?.equipment_type?.name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Marca
                </Typography>
                <Typography>{viewEquipment?.brand || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Modelo
                </Typography>
                <Typography>{viewEquipment?.model || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Serial
                </Typography>
                <Typography>{viewEquipment?.serial || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Componentes
                </Typography>
                {(viewEquipment?.component_serials || []).length === 0 ? (
                  <Typography>-</Typography>
                ) : (
                  <Box sx={{ display: 'grid', gap: 0.5 }}>
                    {(viewEquipment?.component_serials || []).map((item) => (
                      <Typography key={`${item.component_name}-${item.serial}`}>
                        {item.component_name}: {item.serial}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Codigo interno
                </Typography>
                <Typography>{viewEquipment?.internal_code || '-'}</Typography>
              </Box>
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Operacion
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Empresa dueña
                </Typography>
                <Typography>{viewEquipment?.owner_company?.name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Terminal
                </Typography>
                <Typography>{viewEquipment?.terminal?.name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Estado
                </Typography>
                {renderStatusBadge(viewEquipment?.status)}
              </Box>
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Especificaciones por medida
                </Typography>
                {(viewEquipment?.measure_specs || []).length === 0 ? (
                  <Typography>-</Typography>
                ) : (
                  <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
                    {(viewEquipment?.measure_specs || []).map((spec) => (
                      <Box
                        key={`${spec.measure}-${spec.id}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          flexWrap: 'nowrap',
                          border: '1px solid #e5e7eb',
                          borderRadius: 1,
                          padding: 1,
                          backgroundColor: '#f9fafb',
                          overflow: 'hidden',
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {getMeasureLabel(spec.measure)}
                        </Typography>
                        <Typography sx={{ whiteSpace: 'nowrap' }}>
                          Min: {spec.min_value ?? '-'} {getBaseUnitLabel(spec.measure)}
                        </Typography>
                        <Typography sx={{ whiteSpace: 'nowrap' }}>
                          Max: {spec.max_value ?? '-'} {getBaseUnitLabel(spec.measure)}
                        </Typography>
                        <Typography sx={{ whiteSpace: 'nowrap' }}>
                          Resolucion: {spec.resolution ?? '-'} {getBaseUnitLabel(spec.measure)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Control de calidad
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Inspecciones
                </Typography>
                {isWeightEquipmentType(viewEquipment?.equipment_type) ? (
                  <Typography variant="body2" color="text.secondary">
                    No aplica
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {renderInspectionBadge(viewEquipment)}
                    <Typography variant="body2">
                      Ultima: {getLastInspectionDateLabel(viewEquipment?.inspections)}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={openInspectionHistory}
                    >
                      Ver inspecciones
                    </Button>
                  </Box>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Verificaciones
                </Typography>
                <Box sx={{ display: 'grid', gap: 0.75 }}>
                  {(() => {
                    const types = getVerificationTypesForEquipment(viewEquipment) || []
                    const allVerifications = Array.isArray(viewEquipment?.verifications)
                      ? viewEquipment.verifications
                      : []
                    if (types.length === 0) {
                      if (allVerifications.length === 0) {
                        return (
                          <Typography variant="body2" color="text.secondary">
                            Sin verificaciones
                          </Typography>
                        )
                      }
                      return (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          {renderVerificationBadge(allVerifications)}
                          <Typography variant="body2">
                            Ultima: {getLastVerificationDateLabel(allVerifications)}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => openVerificationHistory('')}
                          >
                            Ver verificaciones
                          </Button>
                        </Box>
                      )
                    }
                    return types.map((typeItem) => (
                      <Box
                        key={typeItem.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        {renderVerificationBadge(
                          (viewEquipment?.verifications || []).filter(
                            (verification) =>
                              String(verification?.verification_type_id) ===
                              String(typeItem.id)
                          )
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {typeItem.name}
                        </Typography>
                        <Typography variant="body2">
                          Ultima: {getLastVerificationDateLabelByType(viewEquipment, typeItem.id)}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => openVerificationHistory(typeItem.id)}
                        >
                          Ver verificaciones
                        </Button>
                      </Box>
                    ))
                  })()}
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Calibraciones
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {renderCalibrationBadge(viewEquipment?.calibrations)}
                  <Typography variant="body2">
                    Ultima: {getLastCalibrationDateLabel(viewEquipment?.calibrations)}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => openCalibrationHistory(viewEquipment)}
                  >
                    Ver calibraciones
                  </Button>
                </Box>
              </Box>
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Historial del equipo
                </Typography>
                {isEquipmentHistoryLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={20} />
                    <Typography color="text.secondary">
                      Cargando historial...
                    </Typography>
                  </Box>
                ) : equipmentHistoryError ? (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {equipmentHistoryError}
                  </Typography>
                ) : equipmentHistoryItems.length === 0 ? (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Sin historial registrado.
                  </Typography>
                ) : (
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ maxHeight: 360, mt: 1 }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Valor</TableCell>
                          <TableCell>Desde</TableCell>
                          <TableCell>Hasta</TableCell>
                          <TableCell>Cambiado por</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {equipmentHistoryItems.map((entry) => {
                          const isType = entry.kind === 'type'
                          const label = isType ? 'Rol' : 'Estacion'
                          const value = isType
                            ? `${getEquipmentTypeNameById(entry.equipment_type_id)} (${getEquipmentTypeRoleLabelById(entry.equipment_type_id)})`
                            : getTerminalNameById(entry.terminal_id)
                          return (
                            <TableRow key={entry.id}>
                              <TableCell>{label}</TableCell>
                              <TableCell>{value}</TableCell>
                              <TableCell>{formatDateTime(entry.started_at)}</TableCell>
                              <TableCell>
                                {entry.ended_at ? formatDateTime(entry.ended_at) : 'Actual'}
                              </TableCell>
                              <TableCell>
                                {entry.changed_by_user_name ||
                                  getUserNameById(entry.changed_by_user_id)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeView}>Cerrar</Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={isInspectionHistoryOpen}
          onClose={(event, reason) =>
            handleDialogClose(event, reason, closeInspectionHistory)
          }
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Ultimas inspecciones - {viewEquipment?.equipment_type?.name || '-'} (
            {viewEquipment?.serial || '-'})
          </DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            {inspectionHistoryItems.length === 0 ? (
              <Typography color="text.secondary">Sin inspecciones.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Resultado</TableCell>
                      <TableCell>Observaciones</TableCell>
                      {canEditInspectionDate ? <TableCell>Acciones</TableCell> : null}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inspectionHistoryItems.map((inspection) => {
                      const result = renderVerificationResultLabel(inspection?.is_ok)
                      return (
                        <TableRow key={inspection.id}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {inspection?.inspected_at
                              ? new Date(inspection.inspected_at).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell sx={{ color: result.color, fontWeight: 600 }}>
                            {result.label}
                          </TableCell>
                          <TableCell>{inspection?.notes || '-'}</TableCell>
                          {canEditInspectionDate ? (
                            <TableCell>
                              <IconButton
                                size="small"
                                aria-label="Editar inspeccion"
                                onClick={() => openInspectionHistoryEdit(inspection)}
                                sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeInspectionHistory}>Cerrar</Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={isCalibrationHistoryOpen}
          onClose={(event, reason) =>
            handleDialogClose(event, reason, closeCalibrationHistory)
          }
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Ultimas calibraciones - {viewEquipment?.equipment_type?.name || '-'} (
            {viewEquipment?.serial || '-'} )
          </DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
            {(viewEquipment?.calibrations || []).length === 0 ? (
              <Typography color="text.secondary">Sin calibraciones.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
                <Table size="medium" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Empresa</TableCell>
                      <TableCell>No. certificado</TableCell>
                      <TableCell>Certificado</TableCell>
                      <TableCell>Observaciones</TableCell>
                      {canEditCalibrationDate ? <TableCell /> : null}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...(viewEquipment?.calibrations || [])]
                      .sort((a, b) => new Date(b.calibrated_at) - new Date(a.calibrated_at))
                      .map((calibration) => {
                        const companyLabel =
                          calibration?.calibration_company_name ||
                          (calibration?.calibration_company_id
                            ? `Empresa ${calibration.calibration_company_id}`
                            : '-')
                        return (
                          <TableRow key={calibration.id}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {calibration?.calibrated_at
                                ? new Date(calibration.calibrated_at).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell>{companyLabel}</TableCell>
                            <TableCell>{calibration?.certificate_number || '-'}</TableCell>
                            <TableCell>
                              {calibration?.certificate_pdf_url ? (
                                <Button
                                  size="small"
                                  component="a"
                                  href={calibration.certificate_pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Ver PDF
                                </Button>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>{calibration?.notes || '-'}</TableCell>
                            {canEditCalibrationDate ? (
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  aria-label="Editar calibracion"
                                  onClick={() =>
                                    openCalibrationHistoryEdit(viewEquipment, calibration)
                                  }
                                  sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCalibrationHistory}>Cerrar</Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={isVerificationHistoryOpen}
          onClose={(event, reason) =>
            handleDialogClose(event, reason, closeVerificationHistory)
          }
          fullWidth
          maxWidth="xl"
          PaperProps={{
            sx: { width: '95vw', maxWidth: '1600px' },
          }}
        >
          <DialogTitle>
            Ultimas verificaciones - {viewEquipment?.equipment_type?.name || '-'} (
            {viewEquipment?.serial || '-'})
          </DialogTitle>
          <DialogContent
            sx={{
              display: 'grid',
              gap: 2.5,
              pt: 2,
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              alignItems: 'start',
              minHeight: { xs: 'auto', lg: '70vh' },
            }}
          >
            <Box sx={{ display: 'grid', gap: 2 }}>
              {!isMonthlyVerificationType(viewEquipment, verificationHistoryTypeId) ? (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 220, mt: 1 }}>
                  <InputLabel id="verification-range-label">Rango</InputLabel>
                  <Select
                    labelId="verification-range-label"
                    label="Rango"
                    value={verificationRangeMode}
                    onChange={(event) => setVerificationRangeMode(event.target.value)}
                  >
                    <MenuItem value="all">Todo el historial</MenuItem>
                    <MenuItem value="last30">Ultimos 30 dias</MenuItem>
                    <MenuItem value="month">Mes y año</MenuItem>
                  </Select>
                </FormControl>
                {verificationRangeMode === 'month' ? (
                  <>
                    <FormControl size="small" sx={{ minWidth: 160, mt: 1 }}>
                      <InputLabel id="verification-range-month-label">Mes</InputLabel>
                      <Select
                        labelId="verification-range-month-label"
                        label="Mes"
                        value={verificationRangeMonth}
                        onChange={(event) =>
                          setVerificationRangeMonth(event.target.value)
                        }
                      >
                        <MenuItem value="1">Enero</MenuItem>
                        <MenuItem value="2">Febrero</MenuItem>
                        <MenuItem value="3">Marzo</MenuItem>
                        <MenuItem value="4">Abril</MenuItem>
                        <MenuItem value="5">Mayo</MenuItem>
                        <MenuItem value="6">Junio</MenuItem>
                        <MenuItem value="7">Julio</MenuItem>
                        <MenuItem value="8">Agosto</MenuItem>
                        <MenuItem value="9">Septiembre</MenuItem>
                        <MenuItem value="10">Octubre</MenuItem>
                        <MenuItem value="11">Noviembre</MenuItem>
                        <MenuItem value="12">Diciembre</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140, mt: 1 }}>
                      <InputLabel id="verification-range-year-label">Ano</InputLabel>
                      <Select
                        labelId="verification-range-year-label"
                        label="Ano"
                        value={verificationRangeYear}
                        onChange={(event) =>
                          setVerificationRangeYear(event.target.value)
                        }
                      >
                        {Array.from(
                          new Set(
                            (viewEquipment?.verifications || [])
                              .map((v) => {
                                const d = new Date(v?.verified_at)
                                return Number.isNaN(d.getTime())
                                  ? null
                                  : d.getFullYear()
                              })
                              .filter(Boolean)
                          )
                        )
                          .sort((a, b) => b - a)
                          .map((year) => (
                            <MenuItem key={year} value={String(year)}>
                              {year}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </>
                ) : null}
                </Box>
              ) : null}
              {getFilteredVerifications(viewEquipment).length === 0 ? (
                <Typography color="text.secondary">Sin verificaciones.</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
                  <Table size="medium" stickyHeader>
                    <TableHead>
                      {isBalanceEquipment(viewEquipment) ? (
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Serial pesa</TableCell>
                          <TableCell>Lectura pesa</TableCell>
                          <TableCell>Lectura balanza</TableCell>
                          <TableCell>Diferencia</TableCell>
                          <TableCell>Resultado</TableCell>
                          {canEditVerificationDate ? <TableCell>Acciones</TableCell> : null}
                        </TableRow>
                      ) : isTapeEquipment(viewEquipment) ? (
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Lecturas equipo</TableCell>
                          <TableCell>Lecturas patron</TableCell>
                          <TableCell>Promedio equipo</TableCell>
                          <TableCell>Promedio patron</TableCell>
                          <TableCell>Diferencia</TableCell>
                          <TableCell>Resultado</TableCell>
                          {canEditVerificationDate ? <TableCell>Acciones</TableCell> : null}
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Lectura equipo</TableCell>
                          <TableCell>Serial patron</TableCell>
                          <TableCell>Lectura patron</TableCell>
                          <TableCell>Diferencia</TableCell>
                          <TableCell>Resultado</TableCell>
                          {canEditVerificationDate ? <TableCell>Acciones</TableCell> : null}
                        </TableRow>
                      )}
                    </TableHead>
                    <TableBody>
                      {getFilteredVerifications(viewEquipment).map((verification) => {
                        const isTape = isTapeEquipment(viewEquipment)
                        const isBalance = isBalanceEquipment(viewEquipment)
                        const comparison = parseVerificationComparison(
                          verification?.notes
                        )
                        const serialPatron = comparison.patronId
                          ? getEquipmentSerialById(comparison.patronId)
                          : '-'
                        const result = renderVerificationResultLabel(verification?.is_ok)
                        if (isBalance) {
                          const balanceComparison = parseBalanceComparisonFromNotes(
                            verification?.notes
                          )
                          const patronId = balanceComparison.patronId
                          const referenceEquipment = patronId
                            ? (equipments || []).find(
                                (item) => String(item?.id) === String(patronId)
                              )
                            : null
                          const weightLabel =
                            balanceComparison.weight ||
                            (referenceEquipment
                              ? `${referenceEquipment.nominal_mass_value ?? '-'} ${
                                  referenceEquipment.nominal_mass_unit || 'g'
                                }`
                              : '-')
                          const balanceLabel = balanceComparison.balance || '-'
                          const diffLabel = balanceComparison.diff || '-'
                          return (
                            <TableRow key={verification.id}>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {verification?.verified_at
                                  ? new Date(verification.verified_at).toLocaleDateString()
                                  : '-'}
                              </TableCell>
                              <TableCell>{serialPatron}</TableCell>
                              <TableCell>{weightLabel}</TableCell>
                              <TableCell>{balanceLabel}</TableCell>
                              <TableCell>{diffLabel}</TableCell>
                              <TableCell sx={{ color: result.color, fontWeight: 600 }}>
                                {verification?.is_ok === false
                                  ? 'Fuera de control'
                                  : result.label}
                              </TableCell>
                              {canEditVerificationDate ? (
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    aria-label="Editar verificacion"
                                    onClick={() => openVerificationHistoryEdit(verification)}
                                    sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                                  >
                                    <EditOutlined fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              ) : null}
                            </TableRow>
                          )
                        }
                        if (isTape) {
                          const workValues = [
                            verification?.reading_under_test_high_value,
                            verification?.reading_under_test_mid_value,
                            verification?.reading_under_test_low_value,
                          ]
                          const refValues = [
                            verification?.reference_reading_high_value,
                            verification?.reference_reading_mid_value,
                            verification?.reference_reading_low_value,
                          ]
                          const unitWork = verification?.reading_under_test_unit || ''
                          const unitRef = verification?.reference_reading_unit || ''
                          const hasStructured =
                            workValues.some((value) => value !== null && value !== undefined) ||
                            refValues.some((value) => value !== null && value !== undefined)
                          const parsed = !hasStructured
                            ? parseTapeNotes(verification?.notes || '')
                            : null
                          const workDisplayValues = hasStructured ? workValues : parsed?.workValues || []
                          const refDisplayValues = hasStructured ? refValues : parsed?.refValues || []
                          const displayUnitWork = hasStructured ? unitWork : parsed?.workUnit || ''
                          const displayUnitRef = hasStructured ? unitRef : parsed?.refUnit || ''
                          const avgWork = getTapeAverage(workValues)
                          const avgRef = getTapeAverage(refValues)
                          const diff =
                            avgWork !== null && avgRef !== null ? avgRef - avgWork : null
                          const avgWorkDisplay = avgWork ?? parsed?.avgWork ?? null
                          const avgRefDisplay = avgRef ?? parsed?.avgRef ?? null
                          const diffDisplay = diff ?? parsed?.diff ?? null
                          return (
                            <TableRow key={verification.id}>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {verification?.verified_at
                                  ? new Date(verification.verified_at).toLocaleDateString()
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {formatTapeReadingsLabel(workDisplayValues, displayUnitWork)}
                              </TableCell>
                              <TableCell>
                                {formatTapeReadingsLabel(refDisplayValues, displayUnitRef)}
                              </TableCell>
                              <TableCell>
                                {avgWorkDisplay === null
                                  ? '-'
                                  : `${avgWorkDisplay.toFixed(3)} mm`}
                              </TableCell>
                              <TableCell>
                                {avgRefDisplay === null
                                  ? '-'
                                  : `${avgRefDisplay.toFixed(3)} mm`}
                              </TableCell>
                              <TableCell>
                                {diffDisplay === null
                                  ? '-'
                                  : `${diffDisplay.toFixed(3)} mm`}
                              </TableCell>
                              <TableCell sx={{ color: result.color, fontWeight: 600 }}>
                                {verification?.is_ok === false
                                  ? 'Fuera de control'
                                  : result.label}
                              </TableCell>
                              {canEditVerificationDate ? (
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    aria-label="Editar verificacion"
                                    onClick={() => openVerificationHistoryEdit(verification)}
                                    sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                                  >
                                    <EditOutlined fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              ) : null}
                            </TableRow>
                          )
                        }
                        return (
                          <TableRow key={verification.id}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {verification?.verified_at
                                ? new Date(verification.verified_at).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell>{comparison.underTest || '-'}</TableCell>
                            <TableCell>{serialPatron}</TableCell>
                            <TableCell>{comparison.reference || '-'}</TableCell>
                            <TableCell>{comparison.diff || '-'}</TableCell>
                            <TableCell sx={{ color: result.color, fontWeight: 600 }}>
                              {verification?.is_ok === false
                                ? 'Fuera de control'
                                : result.label}
                            </TableCell>
                            {canEditVerificationDate ? (
                              <TableCell>
                                <IconButton
                                  size="small"
                                  aria-label="Editar verificacion"
                                  onClick={() => openVerificationHistoryEdit(verification)}
                                  sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {isBalanceEquipment(viewEquipment)
                  ? 'Carta de control (Diferencia g)'
                  : isTapeEquipment(viewEquipment)
                    ? 'Carta de control (Diferencia mm)'
                    : 'Carta de control (Diferencia F)'}
              </Typography>
              {buildControlChartPointsFromVerifications(
                getFilteredVerifications(viewEquipment),
                isMonthlyVerificationType(viewEquipment, verificationHistoryTypeId),
                isTapeEquipment(viewEquipment),
                isBalanceEquipment(viewEquipment)
              ).length === 0 ? (
                <Typography color="text.secondary">
                  Sin datos para generar la carta de control.
                </Typography>
              ) : (
                <Box
                  sx={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 2,
                    padding: 1,
                    backgroundColor: 'transparent',
                  }}
                >
                  {(() => {
                    const isTape = isTapeEquipment(viewEquipment)
                    const isBalance = isBalanceEquipment(viewEquipment)
                    const isMonthlyHistory = isTape
                      ? false
                      : isMonthlyVerificationType(
                          viewEquipment,
                          verificationHistoryTypeId
                        )
                    const points = buildControlChartPointsFromVerifications(
                      getFilteredVerifications(viewEquipment),
                      isMonthlyHistory,
                      isTape,
                      isBalance
                    )
                    const limit = isTape ? 2 : 0.5
                    const maxEmp = isBalance
                      ? Math.max(
                          0,
                          ...points
                            .map((p) => p.emp)
                            .filter((value) => typeof value === 'number')
                        )
                      : null
                    const chartEmp = isBalance
                      ? maxEmp > 0
                        ? maxEmp
                        : Math.max(
                            0.000001,
                            ...points
                              .map((p) => Math.abs(p.diffG || 0))
                              .filter((value) => typeof value === 'number')
                          )
                      : null
                    const outOfControlCount = points.filter((p) => {
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
                    const allValues = isMonthlyHistory
                      ? points.flatMap((p) => [p.diffHighF, p.diffMidF, p.diffLowF])
                      : isBalance
                        ? points.map((p) => p.diffG)
                        : isTape
                          ? points.map((p) => p.diffMm)
                          : points.map((p) => p.diffF)
                    const numericValues = allValues.filter(
                      (value) => typeof value === 'number' && !Number.isNaN(value)
                    )
                    const maxDiffAbs = isBalance
                      ? Math.max(
                          0,
                          ...points
                            .map((p) => Math.abs(p.diffG || 0))
                            .filter((value) => typeof value === 'number')
                        )
                      : 0
                    const balanceRange = isBalance
                      ? Math.max(
                          (chartEmp || 0) * 5,
                          maxDiffAbs * 1.2,
                          0.001
                        )
                      : null
                    const allWithinLimits = isBalance
                      ? points.every(
                          (p) =>
                            p.diffG != null &&
                            p.emp != null &&
                            Math.abs(p.diffG) <= p.emp
                        )
                      : isMonthlyHistory
                        ? points.every(
                            (p) =>
                              Math.abs(p.diffHighF) <= limit &&
                              Math.abs(p.diffMidF) <= limit &&
                              Math.abs(p.diffLowF) <= limit
                          )
                        : points.every((p) => {
                            const value = isTape ? p.diffMm : p.diffF
                            return Math.abs(value) <= limit
                          })
                    const tightRange = isBalance
                      ? Math.max((chartEmp || 0) * 1.2, 0.000001)
                      : limit * 1.2
                    const rangeBase = allWithinLimits
                      ? tightRange
                      : isBalance
                        ? balanceRange || 0
                        : limit
                    let dataMin = numericValues.length
                      ? Math.min(...numericValues, -rangeBase)
                      : -rangeBase
                    let dataMax = numericValues.length
                      ? Math.max(...numericValues, rangeBase)
                      : rangeBase
                    if (dataMin === dataMax) {
                      const padding = isBalance
                        ? Math.max(Math.abs(dataMin) * 0.1, 0.000001)
                        : 0.1
                      dataMin -= padding
                      dataMax += padding
                    }
                    const tsValues = points.map((p) => p.ts).filter((ts) => !Number.isNaN(ts))
                    const minTs = tsValues.length ? Math.min(...tsValues) : undefined
                    const maxTs = tsValues.length ? Math.max(...tsValues) : undefined
                    const chartData = points.map((p) =>
                      isMonthlyHistory
                        ? {
                            time: p.ts,
                            highF:
                              typeof p.diffHighF === 'number'
                                ? Number(p.diffHighF.toFixed(4))
                                : undefined,
                            midF:
                              typeof p.diffMidF === 'number'
                                ? Number(p.diffMidF.toFixed(4))
                                : undefined,
                            lowF:
                              typeof p.diffLowF === 'number'
                                ? Number(p.diffLowF.toFixed(4))
                                : undefined,
                          }
                        : isBalance
                          ? {
                              time: p.ts,
                              diffG:
                                typeof p.diffG === 'number'
                                  ? Number(p.diffG.toFixed(6))
                                  : undefined,
                            }
                          : isTape
                            ? {
                                time: p.ts,
                                diffMm:
                                  typeof p.diffMm === 'number'
                                    ? Number(p.diffMm.toFixed(4))
                                    : undefined,
                              }
                            : {
                                time: p.ts,
                                diffF:
                                  typeof p.diffF === 'number'
                                    ? Number(p.diffF.toFixed(4))
                                    : undefined,
                              }
                    )
                    return (
                      <Box sx={{ width: '100%', height: 420, position: 'relative' }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            display: 'flex',
                            gap: 2,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.85)',
                            padding: '2px 6px',
                            borderRadius: 1,
                          }}
                        >
                          {isMonthlyHistory ? (
                            <>
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 2,
                                    backgroundColor: '#2563eb',
                                  }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  Alto
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 2,
                                    backgroundColor: '#16a34a',
                                  }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  Medio
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 2,
                                    backgroundColor: '#f59e0b',
                                  }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  Bajo
                                </Typography>
                              </Box>
                            </>
                          ) : null}
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: '#2563eb',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Dentro de control
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: '#dc2626',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Fuera de control
                            </Typography>
                          </Box>
                        </Box>
                        {outOfControlCount > 0 ? (
                          <Typography
                            variant="caption"
                            sx={{ color: '#dc2626', fontWeight: 700, mb: 0.5 }}
                          >
                            Fuera de control: {outOfControlCount}
                          </Typography>
                        ) : null}
                        <ResponsiveContainer>
                          <LineChart
                            data={chartData}
                            margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="time"
                              type="number"
                              domain={[minTs || 'dataMin', maxTs || 'dataMax']}
                              tickFormatter={(value) =>
                                new Date(value).toLocaleDateString()
                              }
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              label={{
                                value: 'Tiempo',
                                position: 'insideBottom',
                                offset: -12,
                                fill: '#64748b',
                                fontSize: 11,
                              }}
                            />
                            <YAxis
                              domain={[dataMin, dataMax]}
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              label={{
                                value: isBalance
                                  ? 'Diferencia (g)'
                                  : isTape
                                    ? 'Diferencia (mm)'
                                    : 'Diferencia (F)',
                                angle: -90,
                                position: 'insideLeft',
                                fill: '#64748b',
                                fontSize: 11,
                              }}
                            />
                            <RechartsTooltip
                              labelFormatter={(value) =>
                                new Date(value).toLocaleDateString()
                              }
                              formatter={(value, name) => {
                                const labelMap = {
                                  diffF: 'Diferencia',
                                  diffMm: 'Diferencia',
                                  diffG: 'Diferencia',
                                  highF: 'Alto',
                                  midF: 'Medio',
                                  lowF: 'Bajo',
                                }
                                if (isBalance) {
                                  return [`${value} g`, labelMap[name] || name]
                                }
                                if (isTape) {
                                  return [`${value} mm`, labelMap[name] || name]
                                }
                                return [`${value} F`, labelMap[name] || name]
                              }}
                            />
                            {isBalance ? (
                              <>
                                <ReferenceLine
                                  y={chartEmp || 0}
                                  stroke="#f97316"
                                  strokeWidth={2}
                                  strokeDasharray="4 3"
                                  label={{
                                    value: `+${(chartEmp || 0).toFixed(6)} g`,
                                    position: 'insideTopLeft',
                                    fill: '#f97316',
                                    fontSize: 10,
                                  }}
                                />
                                <ReferenceLine
                                  y={-(chartEmp || 0)}
                                  stroke="#f97316"
                                  strokeWidth={2}
                                  strokeDasharray="4 3"
                                  label={{
                                    value: `-${(chartEmp || 0).toFixed(6)} g`,
                                    position: 'insideBottomLeft',
                                    fill: '#f97316',
                                    fontSize: 10,
                                  }}
                                />
                              </>
                            ) : (
                              <>
                                <ReferenceLine
                                  y={limit}
                                  stroke="#f97316"
                                  strokeDasharray="4 3"
                                  label={{
                                    value: isTape ? '+2 mm' : '+0.5 F',
                                    position: 'insideTopLeft',
                                    fill: '#f97316',
                                    fontSize: 10,
                                  }}
                                />
                                <ReferenceLine
                                  y={-limit}
                                  stroke="#f97316"
                                  strokeDasharray="4 3"
                                  label={{
                                    value: isTape ? '-2 mm' : '-0.5 F',
                                    position: 'insideBottomLeft',
                                    fill: '#f97316',
                                    fontSize: 10,
                                  }}
                                />
                              </>
                            )}
                            <ReferenceLine
                              y={0}
                              stroke="#94a3b8"
                              strokeDasharray="2 3"
                            />
                            {isMonthlyHistory ? (
                              <>
                                <Line
                                  type="monotone"
                                  dataKey="highF"
                                  stroke="#2563eb"
                                  strokeWidth={2}
                                  dot={(props) => {
                                    const { cx, cy, payload } = props
                                    const value = payload?.highF
                                    const outOfControl =
                                      value > limit || value < -limit
                                    return (
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r={outOfControl ? 5 : 3}
                                        fill={outOfControl ? '#dc2626' : '#2563eb'}
                                      />
                                    )
                                  }}
                                  isAnimationActive={false}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="midF"
                                  stroke="#16a34a"
                                  strokeWidth={2}
                                  dot={(props) => {
                                    const { cx, cy, payload } = props
                                    const value = payload?.midF
                                    const outOfControl =
                                      value > limit || value < -limit
                                    return (
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r={outOfControl ? 5 : 3}
                                        fill={outOfControl ? '#dc2626' : '#16a34a'}
                                      />
                                    )
                                  }}
                                  isAnimationActive={false}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="lowF"
                                  stroke="#f59e0b"
                                  strokeWidth={2}
                                  dot={(props) => {
                                    const { cx, cy, payload } = props
                                    const value = payload?.lowF
                                    const outOfControl =
                                      value > limit || value < -limit
                                    return (
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r={outOfControl ? 5 : 3}
                                        fill={outOfControl ? '#dc2626' : '#f59e0b'}
                                      />
                                    )
                                  }}
                                  isAnimationActive={false}
                                />
                              </>
                            ) : (
                              <Line
                                type="monotone"
                                dataKey={isBalance ? 'diffG' : isTape ? 'diffMm' : 'diffF'}
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={(props) => {
                                  const { cx, cy, payload } = props
                                  const value = isBalance
                                    ? payload?.diffG
                                    : isTape
                                      ? payload?.diffMm
                                      : payload?.diffF
                                  const outOfControl = isBalance
                                    ? payload?.emp != null && (value > payload.emp || value < -payload.emp)
                                    : value > limit || value < -limit
                                  return (
                                    <circle
                                      cx={cx}
                                      cy={cy}
                                      r={isBalance ? (outOfControl ? 6 : 4) : outOfControl ? 5 : 3}
                                      fill={outOfControl ? '#dc2626' : '#2563eb'}
                                    />
                                  )
                                }}
                                isAnimationActive={false}
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    )
                  })()}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeVerificationHistory}>Cerrar</Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={isControlChartAlertOpen}
          autoHideDuration={4000}
          onClose={() => setIsControlChartAlertOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setIsControlChartAlertOpen(false)}
            severity="warning"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {`Fuera de control: ${controlChartAlertCount}`}
          </Alert>
        </Snackbar>
        <Dialog
          open={isInspectionOpen}
          onClose={(event, reason) => handleDialogClose(event, reason, closeInspection)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Registrar inspeccion</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2, overflow: 'visible' }}>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Equipo
                </Typography>
                <Typography>{inspectionEquipment?.serial || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo de equipo
                </Typography>
                <Typography>{inspectionEquipment?.equipment_type?.name || '-'}</Typography>
              </Box>
              {canEditInspectionDate ? (
                <TextField
                  label="Fecha de inspeccion"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={
                    inspectionForm.inspected_at
                      ? String(inspectionForm.inspected_at).slice(0, 10)
                      : ''
                  }
                  onChange={(event) =>
                    setInspectionForm((prev) => ({
                      ...prev,
                      inspected_at: event.target.value,
                    }))
                  }
                />
              ) : null}
            </Box>
            {inspectionItems.length === 0 ? (
              <Typography color="text.secondary">
                No hay items de inspeccion para este tipo de equipo.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                }}
              >
                {inspectionItems.map((item) => {
                  const response = inspectionForm.responses[item.id] || {}
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 1,
                        padding: 1.5,
                        display: 'grid',
                        gap: 1,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {item.item}
                        {item.is_required ? ' *' : ''}
                      </Typography>
                      {item.response_type === 'boolean' ? (
                        <FormControl>
                          <InputLabel id={`inspection-bool-${item.id}`}>
                            Respuesta
                          </InputLabel>
                          <Select
                            labelId={`inspection-bool-${item.id}`}
                            label="Respuesta"
                            value={
                              response.value_bool === true
                                ? 'true'
                                : response.value_bool === false
                                  ? 'false'
                                  : ''
                            }
                            onChange={(event) => {
                              const value =
                                event.target.value === ''
                                  ? null
                                  : event.target.value === 'true'
                              setInspectionForm((prev) => ({
                                ...prev,
                                responses: {
                                  ...prev.responses,
                                  [item.id]: {
                                    response_type: item.response_type,
                                    value_bool: value,
                                  },
                                },
                              }))
                            }}
                          >
                            <MenuItem value="">Selecciona</MenuItem>
                            <MenuItem value="true">Si</MenuItem>
                            <MenuItem value="false">No</MenuItem>
                          </Select>
                        </FormControl>
                      ) : null}
                      {item.response_type === 'text' ? (
                        <TextField
                          label="Respuesta"
                          value={response.value_text || ''}
                          onChange={(event) =>
                            setInspectionForm((prev) => ({
                              ...prev,
                              responses: {
                                ...prev.responses,
                                [item.id]: {
                                  response_type: item.response_type,
                                  value_text: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      ) : null}
                      {item.response_type === 'number' ? (
                        <TextField
                          label="Respuesta"
                          type="number"
                          value={response.value_number ?? ''}
                          onChange={(event) =>
                            setInspectionForm((prev) => ({
                              ...prev,
                              responses: {
                                ...prev.responses,
                                [item.id]: {
                                  response_type: item.response_type,
                                  value_number: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      ) : null}
                    </Box>
                  )
                })}
              </Box>
            )}
            <TextField
              label="Notas"
              value={inspectionForm.notes}
              onChange={(event) =>
                setInspectionForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              multiline
              minRows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeInspection}>Cancelar</Button>
            <Button
              variant="contained"
              disabled={isInspectionLoading || inspectionItems.length === 0}
              onClick={async () => {
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
                    value_bool:
                      item.response_type === 'boolean' ? response.value_bool : null,
                    value_text:
                      item.response_type === 'text'
                        ? String(response.value_text || '').trim()
                        : null,
                    value_number:
                      item.response_type === 'number'
                        ? Number(response.value_number)
                        : null,
                  })
                }
                hideInspectionDialog()
                setIsInspectionWaitOpen(true)
                setIsInspectionLoading(true)
                const payload = {
                  notes: inspectionForm.notes?.trim() || null,
                  inspected_at:
                    canEditInspectionDate && inspectionForm.inspected_at
                      ? inspectionForm.inspected_at
                      : null,
                  responses,
                }
                try {
                  if (inspectionEditingId) {
                    await updateEquipmentInspection({
                      tokenType,
                      accessToken,
                      inspectionId: inspectionEditingId,
                      payload,
                    })
                  } else {
                    await createEquipmentInspection({
                      tokenType,
                      accessToken,
                      equipmentId: inspectionEquipment.id,
                      payload,
                      replaceExisting: inspectionEditMode,
                    })
                  }
                  if (onEquipmentChanged) {
                    await onEquipmentChanged()
                  }
                  setToast({
                    open: true,
                    message: inspectionEditMode
                      ? 'Inspeccion actualizada correctamente.'
                      : 'Inspeccion registrada correctamente.',
                    severity: 'success',
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
                    const confirmReplace = window.confirm(
                      'Ya se realizo una inspeccion hoy. Deseas reemplazarla?'
                    )
                    if (confirmReplace) {
                      try {
                        await createEquipmentInspection({
                          tokenType,
                          accessToken,
                          equipmentId: inspectionEquipment.id,
                          payload,
                          replaceExisting: true,
                        })
                        if (onEquipmentChanged) {
                          await onEquipmentChanged()
                        }
                        setToast({
                          open: true,
                          message: 'Inspeccion reemplazada correctamente.',
                          severity: 'success',
                        })
                        closeInspection()
                      } catch (errReplace) {
                        setToast({
                          open: true,
                          message:
                            errReplace?.detail ||
                            'No se pudo reemplazar la inspeccion.',
                          severity: 'error',
                        })
                      } finally {
                        setIsInspectionLoading(false)
                        setIsInspectionWaitOpen(false)
                      }
                      return
                    }
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
              }}
            >
              {isInspectionLoading ? 'Guardando...' : 'Guardar inspeccion'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={isInspectionWaitOpen} fullWidth maxWidth="xs">
          <DialogTitle>Guardando inspeccion</DialogTitle>
          <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">Procesando...</Typography>
          </DialogContent>
        </Dialog>
        <Dialog open={isVerificationWaitOpen} fullWidth maxWidth="xs">
          <DialogTitle>Guardando verificacion</DialogTitle>
          <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">Procesando...</Typography>
          </DialogContent>
        </Dialog>
        <Dialog open={isCalibrationWaitOpen} fullWidth maxWidth="xs">
          <DialogTitle>Guardando calibracion</DialogTitle>
          <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
            <CircularProgress size={28} />
            <Typography color="text.secondary">Procesando...</Typography>
          </DialogContent>
        </Dialog>
        <Dialog
          open={isVerificationOpen}
          onClose={(event, reason) => handleDialogClose(event, reason, closeVerification)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Registrar verificacion</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2, overflow: 'visible' }}>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Equipo
                </Typography>
                <Typography>{verificationEquipment?.serial || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo de equipo
                </Typography>
                <Typography>{verificationEquipment?.equipment_type?.name || '-'}</Typography>
              </Box>
            </Box>
            {canEditVerificationDate ? (
              <TextField
                label="Fecha de verificacion"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={
                  verificationForm.verified_at
                    ? String(verificationForm.verified_at).slice(0, 10)
                    : ''
                }
                onChange={(event) =>
                  setVerificationForm((prev) => ({
                    ...prev,
                    verified_at: event.target.value,
                  }))
                }
              />
            ) : null}
            {(() => {
              const selectedType = selectedVerificationType
              if (
                selectedType &&
                [1, 30].includes(Number(selectedType.frequency_days))
              ) {
                return (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tipo de verificacion
                    </Typography>
                    <Typography>{selectedType.name}</Typography>
                  </Box>
                )
              }
              return (
                <FormControl size="small" fullWidth>
                  <InputLabel id="verification-type-label">Tipo de verificacion</InputLabel>
                  <Select
                    labelId="verification-type-label"
                    label="Tipo de verificacion"
                    value={verificationForm.verification_type_id}
                    onChange={async (event) => {
                      const selectedTypeId = String(event.target.value || '')
                      setVerificationForm((prev) => ({
                        ...prev,
                        verification_type_id: selectedTypeId,
                        responses: {},
                      }))
                      setVerificationItems([])
                      if (!selectedTypeId || !verificationEquipment) {
                        return
                      }
                      try {
                        await loadVerificationItems({
                          equipmentTypeId: verificationEquipment.equipment_type_id,
                          verificationTypeId: Number(selectedTypeId),
                        })
                      } catch (err) {
                        setToast({
                          open: true,
                          message: err?.detail || 'No se pudieron cargar los items de verificacion.',
                          severity: 'error',
                        })
                      }
                    }}
                  >
                    {verificationTypes.map((typeItem) => (
                      <MenuItem key={typeItem.id} value={String(typeItem.id)}>
                        {typeItem.name} ({typeItem.frequency_days} dias)
                      </MenuItem>
                    ))}
                  </Select>
                  {verificationTypes.length === 0 ? (
                    <FormHelperText>
                      No hay tipos de verificacion para este tipo de equipo.
                    </FormHelperText>
                  ) : null}
                </FormControl>
              )
            })()}
            {(requiresComparisonReadings ||
              isHydrometerMonthlyVerification ||
              requiresKarlFischerVerification) ? (
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  p: 1.5,
                  display: 'grid',
                  gap: 1.25,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  {requiresKarlFischerVerification
                    ? 'Estandarizacion del reactivo'
                    : 'Comparacion contra patron'}
                </Typography>
                {isHydrometerMonthlyVerification ? (
                  <>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
                      }}
                    >
                      <FormControl size="small" fullWidth>
                        <InputLabel id="thermometer-working-label">
                          Termometro de trabajo
                        </InputLabel>
                        <Select
                          labelId="thermometer-working-label"
                          label="Termometro de trabajo"
                          value={verificationForm.thermometer_working_id}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              thermometer_working_id: String(event.target.value || ''),
                            }))
                          }
                        >
                          {hydrometerThermometerOptions.map((candidate) => (
                            <MenuItem key={candidate.id} value={String(candidate.id)}>
                              {candidate.serial} - {candidate.brand} {candidate.model}
                            </MenuItem>
                          ))}
                        </Select>
                        {hydrometerThermometerOptions.length === 0 ? (
                          <FormHelperText>
                            No hay termometros de trabajo disponibles en este terminal.
                          </FormHelperText>
                        ) : null}
                      </FormControl>
                      <FormControl size="small" fullWidth>
                        <InputLabel id="thermometer-unit-label">Unidad termometro</InputLabel>
                        <Select
                          labelId="thermometer-unit-label"
                          label="Unidad termometro"
                          value={verificationForm.thermometer_unit}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              thermometer_unit: String(event.target.value || 'c'),
                            }))
                          }
                        >
                          <MenuItem value="c">C</MenuItem>
                          <MenuItem value="f">F</MenuItem>
                          <MenuItem value="k">K</MenuItem>
                          <MenuItem value="r">R</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="hydrometer-product-label">Producto</InputLabel>
                      <Select
                        labelId="hydrometer-product-label"
                        label="Producto"
                        value={verificationForm.product_name}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            product_name: String(event.target.value || 'Crudo'),
                          }))
                        }
                      >
                        <MenuItem value="Crudo">Crudo</MenuItem>
                      </Select>
                    </FormControl>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                      }}
                    >
                      <TextField
                        label="Lectura hidrometro trabajo (API)"
                        type="number"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={verificationForm.hydrometer_working_value}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            hydrometer_working_value: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="Lectura termometro trabajo"
                        type="number"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={verificationForm.thermometer_working_value}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            thermometer_working_value: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="API a 60F"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={hydrometerWorkApi60f}
                        InputProps={{ readOnly: true }}
                        helperText={hydrometerWorkApi60fError || ' '}
                        error={Boolean(hydrometerWorkApi60fError)}
                      />
                    </Box>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="hydrometer-reference-label">
                        Hidrometro patron
                      </InputLabel>
                      <Select
                        labelId="hydrometer-reference-label"
                        label="Hidrometro patron"
                        value={verificationForm.reference_equipment_id}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            reference_equipment_id: String(event.target.value || ''),
                          }))
                        }
                      >
                        {hydrometerReferenceOptions.map((candidate) => (
                          <MenuItem key={candidate.id} value={String(candidate.id)}>
                            {candidate.serial} - {candidate.brand} {candidate.model}
                          </MenuItem>
                        ))}
                      </Select>
                      {hydrometerReferenceOptions.length === 0 ? (
                        <FormHelperText>
                          No hay hidrometros patron disponibles en este terminal.
                        </FormHelperText>
                      ) : null}
                    </FormControl>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                      }}
                    >
                      <TextField
                        label="Lectura hidrometro patron (API)"
                        type="number"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={verificationForm.hydrometer_reference_value}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            hydrometer_reference_value: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="Lectura termometro para patron"
                        type="number"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={verificationForm.thermometer_reference_value}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            thermometer_reference_value: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="API a 60F"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={hydrometerRefApi60f}
                        InputProps={{ readOnly: true }}
                        helperText={hydrometerRefApi60fError || ' '}
                        error={Boolean(hydrometerRefApi60fError)}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {(() => {
                        const work = Number(hydrometerWorkApi60f)
                        const ref = Number(hydrometerRefApi60f)
                        if (Number.isNaN(work) || Number.isNaN(ref)) {
                          return (
                            <Typography variant="caption" color="text.secondary">
                              Diferencia API60F: -
                            </Typography>
                          )
                        }
                        const diff = work - ref
                        const ok = diff >= -0.5 && diff <= 0.5
                        return (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              Diferencia API60F: {diff.toFixed(1)} API
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: ok ? '#16a34a' : '#dc2626', fontWeight: 600 }}
                            >
                              {ok ? 'Cumple' : 'No cumple'}
                            </Typography>
                          </>
                        )
                      })()}
                    </Box>
                  </>
                ) : (
                  !requiresKarlFischerVerification ? (
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                        alignItems: 'center',
                        mt: 0.75,
                      }}
                    >
                      <FormControl size="small" fullWidth>
                        <InputLabel id="reference-equipment-label">
                          {requiresBalanceComparison ? 'Pesa patron' : 'Equipo patron'}
                        </InputLabel>
                        <Select
                          labelId="reference-equipment-label"
                          label={requiresBalanceComparison ? 'Pesa patron' : 'Equipo patron'}
                          value={verificationForm.reference_equipment_id}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              reference_equipment_id: String(event.target.value || ''),
                            }))
                          }
                        >
                          {referenceEquipmentOptions.map((candidate) => (
                            <MenuItem key={candidate.id} value={String(candidate.id)}>
                              {candidate.serial} - {candidate.brand} {candidate.model}
                            </MenuItem>
                          ))}
                        </Select>
                        {referenceEquipmentOptions.length === 0 ? (
                          <FormHelperText>
                            No hay equipos patron disponibles en este terminal.
                          </FormHelperText>
                        ) : null}
                      </FormControl>
                      {requiresBalanceComparison ? (
                        <TextField
                          label="Peso nominal"
                          size="small"
                          sx={{ '& .MuiInputBase-root': { height: 40 } }}
                          value={
                            selectedReferenceEquipment
                              ? `${selectedReferenceEquipment.nominal_mass_value ?? '-'} ${
                                  selectedReferenceEquipment.nominal_mass_unit || 'g'
                                }`
                              : '-'
                          }
                          InputProps={{ readOnly: true }}
                        />
                      ) : (
                        <Box />
                      )}
                    </Box>
                  ) : null
                )}
                {requiresBalanceComparison ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      alignItems: 'center',
                    }}
                  >
                    <TextField
                      label="Lectura balanza"
                      type="number"
                      size="small"
                      sx={{ '& .MuiInputBase-root': { height: 40 } }}
                      value={verificationForm.balance_reading_value}
                      onChange={(event) =>
                        setVerificationForm((prev) => ({
                          ...prev,
                          balance_reading_value: event.target.value,
                        }))
                      }
                    />
                    <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { height: 40 } }}>
                      <InputLabel id="balance-unit-label">Unidad balanza</InputLabel>
                      <Select
                        labelId="balance-unit-label"
                        label="Unidad balanza"
                        value={verificationForm.balance_unit || 'g'}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            balance_unit: String(event.target.value || 'g'),
                          }))
                        }
                      >
                        <MenuItem value="g">g</MenuItem>
                        <MenuItem value="mg">mg</MenuItem>
                      </Select>
                    </FormControl>
                    {(() => {
                      if (!selectedReferenceEquipment) return null
                      const underG = normalizeWeightToGrams(
                        verificationForm.balance_reading_value,
                        verificationForm.balance_unit || 'g'
                      )
                      const refG = normalizeWeightToGrams(
                        selectedReferenceEquipment.nominal_mass_value,
                        selectedReferenceEquipment.nominal_mass_unit || 'g'
                      )
                      if (underG === null || refG === null) {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            Diferencia: -
                          </Typography>
                        )
                      }
                      const emp =
                        Number(selectedReferenceEquipment.emp_value) > 0
                          ? Number(selectedReferenceEquipment.emp_value)
                          : getWeightEmp(
                              selectedReferenceEquipment.nominal_mass_value,
                              selectedReferenceEquipment.weight_class
                            )
                      if (emp === null || emp === undefined) {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            EMP: -
                          </Typography>
                        )
                      }
                      const diff = refG - underG
                      const ok = Math.abs(diff) <= emp
                      return (
                        <Typography
                          variant="caption"
                          sx={{
                            color: ok ? '#16a34a' : '#dc2626',
                            fontWeight: 600,
                            gridColumn: { sm: '1 / span 2' },
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Diferencia: {diff.toFixed(6)} g (EMP {emp.toFixed(6)} g) —{' '}
                          {ok ? 'Cumple' : 'No cumple'}
                        </Typography>
                      )
                    })()}
                  </Box>
                ) : null}
                {requiresKarlFischerVerification ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                    }}
                  >
                    <FormControl size="small" fullWidth>
                      <InputLabel id="kf-balance-label">Balanza analitica (trabajo)</InputLabel>
                      <Select
                        labelId="kf-balance-label"
                        label="Balanza analitica (trabajo)"
                        value={verificationForm.reference_equipment_id}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            reference_equipment_id: String(event.target.value || ''),
                          }))
                        }
                      >
                        {kfBalanceOptions.map((candidate) => (
                          <MenuItem key={candidate.id} value={String(candidate.id)}>
                            {candidate.serial} - {candidate.brand} {candidate.model}
                          </MenuItem>
                        ))}
                      </Select>
                      {kfBalanceOptions.length === 0 ? (
                        <FormHelperText>
                          No hay balanzas analiticas disponibles en este terminal.
                        </FormHelperText>
                      ) : null}
                    </FormControl>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                        alignItems: 'center',
                        mt: 0.75,
                      }}
                    >
                      <TextField
                        label="Peso 1 (mg)"
                        type="number"
                        size="small"
                        value={verificationForm.kf_weight_1}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            kf_weight_1: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="Volumen 1 (mL)"
                        type="number"
                        size="small"
                        value={verificationForm.kf_volume_1}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            kf_volume_1: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="Factor 1 (mg/mL)"
                        size="small"
                        value={(() => {
                          const w = Number(verificationForm.kf_weight_1)
                          const v = Number(verificationForm.kf_volume_1)
                          if (!v || Number.isNaN(w) || Number.isNaN(v)) return ''
                          return (w / v).toFixed(6)
                        })()}
                        InputProps={{ readOnly: true }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                        alignItems: 'center',
                        mt: 1,
                      }}
                    >
                      <TextField
                        label="Peso 2 (mg)"
                        type="number"
                        size="small"
                        value={verificationForm.kf_weight_2}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            kf_weight_2: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="Volumen 2 (mL)"
                        type="number"
                        size="small"
                        value={verificationForm.kf_volume_2}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            kf_volume_2: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        label="Factor 2 (mg/mL)"
                        size="small"
                        value={(() => {
                          const w = Number(verificationForm.kf_weight_2)
                          const v = Number(verificationForm.kf_volume_2)
                          if (!v || Number.isNaN(w) || Number.isNaN(v)) return ''
                          return (w / v).toFixed(6)
                        })()}
                        InputProps={{ readOnly: true }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {(() => {
                        const w1 = Number(verificationForm.kf_weight_1)
                        const v1 = Number(verificationForm.kf_volume_1)
                        const w2 = Number(verificationForm.kf_weight_2)
                        const v2 = Number(verificationForm.kf_volume_2)
                        if ([w1, v1, w2, v2].some((val) => Number.isNaN(val) || !val)) {
                          return (
                            <Typography variant="caption" color="text.secondary">
                              Factor promedio: - | Error relativo: -
                            </Typography>
                          )
                        }
                        const f1 = w1 / v1
                        const f2 = w2 / v2
                        const avg = (f1 + f2) / 2
                        const err = avg ? (Math.abs(f1 - f2) / avg) * 100 : 0
                        const factorsOk = f1 >= 4.5 && f1 <= 5.5 && f2 >= 4.5 && f2 <= 5.5
                        const relOk = err < 2
                        const ok = factorsOk && relOk
                        return (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              Factor promedio: {avg.toFixed(6)} mg/mL | Error relativo: {err.toFixed(3)}%
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: ok ? '#16a34a' : '#dc2626', fontWeight: 600 }}
                            >
                              {ok ? 'Cumple' : 'No cumple'}
                            </Typography>
                          </>
                        )
                      })()}
                    </Box>
                  </Box>
                ) : null}
                {!isHydrometerMonthlyVerification && requiresTapeComparison ? (
                  <>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      }}
                    >
                      <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { height: 40 } }}>
                        <InputLabel id="reading-unit-under-test-label">Unidad equipo</InputLabel>
                        <Select
                          labelId="reading-unit-under-test-label"
                          label="Unidad equipo"
                          value={verificationForm.reading_unit_under_test || 'mm'}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              reading_unit_under_test: String(event.target.value || 'mm'),
                            }))
                          }
                        >
                          <MenuItem value="mm">mm</MenuItem>
                          <MenuItem value="cm">cm</MenuItem>
                          <MenuItem value="m">m</MenuItem>
                          <MenuItem value="in">in</MenuItem>
                          <MenuItem value="ft">ft</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { height: 40 } }}>
                        <InputLabel id="reading-unit-reference-label">Unidad patron</InputLabel>
                        <Select
                          labelId="reading-unit-reference-label"
                          label="Unidad patron"
                          value={verificationForm.reading_unit_reference || 'mm'}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              reading_unit_reference: String(event.target.value || 'mm'),
                            }))
                          }
                        >
                          <MenuItem value="mm">mm</MenuItem>
                          <MenuItem value="cm">cm</MenuItem>
                          <MenuItem value="m">m</MenuItem>
                          <MenuItem value="in">in</MenuItem>
                          <MenuItem value="ft">ft</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    {[
                      {
                        label: 'Lectura 1',
                        underKey: 'reading_under_test_high_value',
                        refKey: 'reference_reading_high_value',
                      },
                      {
                        label: 'Lectura 2',
                        underKey: 'reading_under_test_mid_value',
                        refKey: 'reference_reading_mid_value',
                      },
                      {
                        label: 'Lectura 3 (opcional)',
                        underKey: 'reading_under_test_low_value',
                        refKey: 'reference_reading_low_value',
                      },
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        }}
                      >
                        <TextField
                          label={`${item.label} equipo`}
                          type="number"
                          size="small"
                          sx={{ '& .MuiInputBase-root': { height: 40 } }}
                          value={verificationForm[item.underKey]}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              [item.underKey]: event.target.value,
                            }))
                          }
                        />
                        <TextField
                          label={`${item.label} patron`}
                          type="number"
                          size="small"
                          sx={{ '& .MuiInputBase-root': { height: 40 } }}
                          value={verificationForm[item.refKey]}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              [item.refKey]: event.target.value,
                            }))
                          }
                        />
                      </Box>
                    ))}
                    <Box sx={{ display: 'grid', gap: 0.5 }}>
                      {(() => {
                        const workValues = [
                          verificationForm.reading_under_test_high_value,
                          verificationForm.reading_under_test_mid_value,
                          verificationForm.reading_under_test_low_value,
                        ].filter((value) => String(value).trim() !== '')
                        const refValues = [
                          verificationForm.reference_reading_high_value,
                          verificationForm.reference_reading_mid_value,
                          verificationForm.reference_reading_low_value,
                        ].filter((value) => String(value).trim() !== '')
                        if (workValues.length < 2 || refValues.length < 2) {
                          return (
                            <Typography variant="caption" color="text.secondary">
                              Promedios y diferencia: -
                            </Typography>
                          )
                        }
                        const workMm = workValues
                          .map((value) => convertLengthToMmDisplay(value, verificationForm.reading_unit_under_test))
                          .filter((value) => value !== null)
                        const refMm = refValues
                          .map((value) => convertLengthToMmDisplay(value, verificationForm.reading_unit_reference))
                          .filter((value) => value !== null)
                        if (workMm.length !== workValues.length || refMm.length !== refValues.length) {
                          return (
                            <Typography variant="caption" color="text.secondary">
                              Promedios y diferencia: -
                            </Typography>
                          )
                        }
                        const avgWork = workMm.reduce((acc, curr) => acc + curr, 0) / workMm.length
                        const avgRef = refMm.reduce((acc, curr) => acc + curr, 0) / refMm.length
                        const diff = avgRef - avgWork
                        const ok = Math.abs(diff) < 2
                        return (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              Promedio equipo: {avgWork.toFixed(3)} mm
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Promedio patron: {avgRef.toFixed(3)} mm
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Diferencia (Patron-Equipo): {diff.toFixed(3)} mm
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: ok ? '#16a34a' : '#dc2626', fontWeight: 600 }}
                            >
                              {ok
                                ? 'Cumple (diferencia absoluta menor a 2 mm)'
                                : 'No cumple (la diferencia absoluta debe ser menor a 2 mm)'}
                            </Typography>
                          </>
                        )
                      })()}
                    </Box>
                  </>
                ) : !isHydrometerMonthlyVerification && isMonthlyVerification ? (
                  <>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      }}
                    >
                      <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { height: 40 } }}>
                        <InputLabel id="reading-unit-under-test-label">Unidad equipo</InputLabel>
                        <Select
                          labelId="reading-unit-under-test-label"
                          label="Unidad equipo"
                          value={verificationForm.reading_unit_under_test}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              reading_unit_under_test: String(event.target.value || 'c'),
                            }))
                          }
                        >
                          <MenuItem value="c">C</MenuItem>
                          <MenuItem value="f">F</MenuItem>
                          <MenuItem value="k">K</MenuItem>
                          <MenuItem value="r">R</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { height: 40 } }}>
                        <InputLabel id="reading-unit-reference-label">Unidad patron</InputLabel>
                        <Select
                          labelId="reading-unit-reference-label"
                          label="Unidad patron"
                          value={verificationForm.reading_unit_reference}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              reading_unit_reference: String(event.target.value || 'c'),
                            }))
                          }
                        >
                          <MenuItem value="c">C</MenuItem>
                          <MenuItem value="f">F</MenuItem>
                          <MenuItem value="k">K</MenuItem>
                          <MenuItem value="r">R</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    {[
                      {
                        label: 'Lectura alta',
                        underKey: 'reading_under_test_high_value',
                        refKey: 'reference_reading_high_value',
                      },
                      {
                        label: 'Lectura media',
                        underKey: 'reading_under_test_mid_value',
                        refKey: 'reference_reading_mid_value',
                      },
                      {
                        label: 'Lectura baja',
                        underKey: 'reading_under_test_low_value',
                        refKey: 'reference_reading_low_value',
                      },
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        }}
                      >
                        <TextField
                          label={`${item.label} equipo`}
                          type="number"
                          size="small"
                          sx={{ '& .MuiInputBase-root': { height: 40 } }}
                          value={verificationForm[item.underKey]}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              [item.underKey]: event.target.value,
                            }))
                          }
                        />
                        <TextField
                          label={`${item.label} patron`}
                          type="number"
                          size="small"
                          sx={{ '& .MuiInputBase-root': { height: 40 } }}
                          value={verificationForm[item.refKey]}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              [item.refKey]: event.target.value,
                            }))
                          }
                        />
                      </Box>
                    ))}
                    <Box sx={{ display: 'grid', gap: 0.5 }}>
                      {[
                        { label: 'Alta', underKey: 'reading_under_test_high_value', refKey: 'reference_reading_high_value' },
                        { label: 'Media', underKey: 'reading_under_test_mid_value', refKey: 'reference_reading_mid_value' },
                        { label: 'Baja', underKey: 'reading_under_test_low_value', refKey: 'reference_reading_low_value' },
                      ].map((item) => {
                        const rawUnderTest = Number(verificationForm[item.underKey])
                        const rawReference = Number(verificationForm[item.refKey])
                        const unitUnderTest = verificationForm.reading_unit_under_test || 'c'
                        const unitReference = verificationForm.reading_unit_reference || 'c'
                        if (Number.isNaN(rawUnderTest) || Number.isNaN(rawReference)) {
                          return (
                            <Typography key={item.label} variant="caption" color="text.secondary">
                              Diferencia {item.label}: -
                            </Typography>
                          )
                        }
                        const underTestF = convertTemperatureToFDisplay(rawUnderTest, unitUnderTest)
                        const referenceF = convertTemperatureToFDisplay(rawReference, unitReference)
                        if (underTestF === null || referenceF === null) {
                          return (
                            <Typography key={item.label} variant="caption" color="text.secondary">
                              Diferencia {item.label}: -
                            </Typography>
                          )
                        }
                        const delta = Math.abs(underTestF - referenceF)
                        const ok = delta <= 0.5
                        return (
                          <Box key={item.label} sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Diferencia {item.label}: {delta.toFixed(3)} F
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: ok ? '#16a34a' : '#dc2626', fontWeight: 600 }}
                            >
                              {ok ? 'Cumple' : 'No cumple'}
                            </Typography>
                          </Box>
                        )
                      })}
                    </Box>
                  </>
                ) : !isHydrometerMonthlyVerification && requiresTemperatureComparison ? (
                  <>
                    <Box sx={{ display: 'grid', gap: 1 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
                        }}
                      >
                        <TextField
                          label="Lectura equipo"
                          type="number"
                          size="small"
                          sx={{ '& .MuiInputBase-root': { height: 40 } }}
                          value={verificationForm.reading_under_test_f}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              reading_under_test_f: event.target.value,
                            }))
                          }
                        />
                        <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { height: 40 } }}>
                          <InputLabel id="reading-unit-under-test-label">Unidad equipo</InputLabel>
                          <Select
                            labelId="reading-unit-under-test-label"
                            label="Unidad equipo"
                            value={verificationForm.reading_unit_under_test}
                            onChange={(event) =>
                              setVerificationForm((prev) => ({
                                ...prev,
                                reading_unit_under_test: String(event.target.value || 'c'),
                              }))
                            }
                          >
                            <MenuItem value="c">C</MenuItem>
                            <MenuItem value="f">F</MenuItem>
                            <MenuItem value="k">K</MenuItem>
                            <MenuItem value="r">R</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' },
                      }}
                    >
                      <TextField
                        label="Lectura patron"
                        type="number"
                        size="small"
                        sx={{ '& .MuiInputBase-root': { height: 40 } }}
                        value={verificationForm.reference_reading_f}
                        onChange={(event) =>
                          setVerificationForm((prev) => ({
                            ...prev,
                            reference_reading_f: event.target.value,
                          }))
                        }
                      />
                      <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { height: 40 } }}>
                        <InputLabel id="reading-unit-reference-label">Unidad patron</InputLabel>
                        <Select
                          labelId="reading-unit-reference-label"
                          label="Unidad patron"
                          value={verificationForm.reading_unit_reference}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              reading_unit_reference: String(event.target.value || 'c'),
                            }))
                          }
                        >
                          <MenuItem value="c">C</MenuItem>
                          <MenuItem value="f">F</MenuItem>
                          <MenuItem value="k">K</MenuItem>
                          <MenuItem value="r">R</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      {(() => {
                        const rawUnderTest = Number(verificationForm.reading_under_test_f)
                        const rawReference = Number(verificationForm.reference_reading_f)
                        const unitUnderTest = verificationForm.reading_unit_under_test || 'c'
                        const unitReference = verificationForm.reading_unit_reference || 'c'
                        if (Number.isNaN(rawUnderTest) || Number.isNaN(rawReference)) {
                          return (
                            <Typography variant="caption" color="text.secondary">
                              Diferencia: -
                            </Typography>
                          )
                        }
                        const underTestF = convertTemperatureToFDisplay(rawUnderTest, unitUnderTest)
                        const referenceF = convertTemperatureToFDisplay(rawReference, unitReference)
                        if (underTestF === null || referenceF === null) {
                          return (
                            <Typography variant="caption" color="text.secondary">
                              Diferencia: -
                            </Typography>
                          )
                        }
                        const delta = Math.abs(underTestF - referenceF)
                        const ok = delta <= 0.5
                        return (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              Diferencia: {delta.toFixed(3)} F
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: ok ? '#16a34a' : '#dc2626', fontWeight: 600 }}
                            >
                              {ok ? 'Cumple' : 'No cumple'}
                            </Typography>
                          </>
                        )
                      })()}
                    </Box>
                  </>
                ) : null}
                <Typography variant="caption" color="text.secondary">
                  {isHydrometerMonthlyVerification
                    ? 'Se requiere inspeccion diaria aprobada en ambos equipos.'
                    : requiresTapeComparison
                      ? 'Se requieren inspecciones diarias aprobadas en ambos equipos. Criterio: |Diferencia| < 2 mm.'
                      : requiresBalanceComparison
                        ? 'Se requiere inspeccion diaria aprobada en ambos equipos y diferencia dentro del error maximo permitido.'
                        : requiresKarlFischerVerification
                          ? 'Criterio: factores entre 4.5 y 5.5 y error relativo < 2%.'
                        : 'Se requiere inspeccion diaria aprobada en ambos equipos y diferencia maxima de 0.5 F.'}
                </Typography>
              </Box>
            ) : null}
            {verificationItems.length === 0 ? null : (
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                }}
              >
                {verificationItems.map((item) => {
                  const response = verificationForm.responses[item.id] || {}
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 1,
                        padding: 1.5,
                        display: 'grid',
                        gap: 1,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>{item.item}</Typography>
                      {item.response_type === 'boolean' ? (
                        <FormControl>
                          <InputLabel id={`verification-bool-${item.id}`}>
                            Respuesta
                          </InputLabel>
                          <Select
                            labelId={`verification-bool-${item.id}`}
                            label="Respuesta"
                            value={
                              response.value_bool === true
                                ? 'true'
                                : response.value_bool === false
                                  ? 'false'
                                  : ''
                            }
                            onChange={(event) => {
                              const value =
                                event.target.value === ''
                                  ? null
                                  : event.target.value === 'true'
                              setVerificationForm((prev) => ({
                                ...prev,
                                responses: {
                                  ...prev.responses,
                                  [item.id]: {
                                    response_type: item.response_type,
                                    value_bool: value,
                                  },
                                },
                              }))
                            }}
                          >
                            <MenuItem value="">Selecciona</MenuItem>
                            <MenuItem value="true">Si</MenuItem>
                            <MenuItem value="false">No</MenuItem>
                          </Select>
                        </FormControl>
                      ) : null}
                      {item.response_type === 'text' ? (
                        <TextField
                          label="Respuesta"
                          value={response.value_text || ''}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              responses: {
                                ...prev.responses,
                                [item.id]: {
                                  response_type: item.response_type,
                                  value_text: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      ) : null}
                      {item.response_type === 'number' ? (
                        <TextField
                          label="Valor"
                          type="number"
                          value={response.value_number ?? ''}
                          onChange={(event) =>
                            setVerificationForm((prev) => ({
                              ...prev,
                              responses: {
                                ...prev.responses,
                                [item.id]: {
                                  response_type: item.response_type,
                                  value_number: event.target.value,
                                },
                              },
                            }))
                          }
                        />
                      ) : null}
                    </Box>
                  )
                })}
              </Box>
            )}
            <TextField
              label="Observaciones"
              value={verificationForm.notes}
              onChange={(event) =>
                setVerificationForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              multiline
              minRows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeVerification}>Cancelar</Button>
            <Button
              variant="contained"
              disabled={
                isVerificationLoading ||
                !verificationForm.verification_type_id ||
                (verificationItems.length === 0 &&
                  !requiresComparisonReadings &&
                  !isHydrometerMonthlyVerification &&
                  !requiresKarlFischerVerification)
              }
              onClick={async () => {
                if (!verificationEquipment) return
                if (!verificationForm.verification_type_id) {
                  setToast({
                    open: true,
                    message: 'Selecciona un tipo de verificacion.',
                    severity: 'error',
                  })
                  return
                }
                let hydrometerTempFWork = null
                let hydrometerTempFRef = null
                if (isHydrometerMonthlyVerification) {
                  const productName = String(verificationForm.product_name || '').trim()
                  if (!productName) {
                    setToast({
                      open: true,
                      message: 'Selecciona el producto.',
                      severity: 'error',
                    })
                    return
                  }
                  if (!verificationForm.thermometer_working_id) {
                    setToast({
                      open: true,
                      message: 'Selecciona el termometro de trabajo.',
                      severity: 'error',
                    })
                    return
                  }
                  if (!verificationForm.reference_equipment_id) {
                    setToast({
                      open: true,
                      message: 'Selecciona el hidrometro patron.',
                      severity: 'error',
                    })
                    return
                  }
                  const requiredFields = [
                    verificationForm.hydrometer_working_value,
                    verificationForm.hydrometer_reference_value,
                    verificationForm.thermometer_working_value,
                    verificationForm.thermometer_reference_value,
                  ]
                  if (requiredFields.some((value) => value === '')) {
                    setToast({
                      open: true,
                      message: 'Completa todas las lecturas del hidrometro y termometro.',
                      severity: 'error',
                    })
                    return
                  }
                  if (requiredFields.some((value) => Number.isNaN(Number(value)))) {
                    setToast({
                      open: true,
                      message: 'Las lecturas deben ser valores numericos validos.',
                      severity: 'error',
                    })
                    return
                  }
                  const unit = verificationForm.thermometer_unit || 'c'
                  hydrometerTempFWork = convertTemperatureToFDisplay(
                    Number(verificationForm.thermometer_working_value),
                    unit
                  )
                  hydrometerTempFRef = convertTemperatureToFDisplay(
                    Number(verificationForm.thermometer_reference_value),
                    unit
                  )
                  if (hydrometerTempFWork === null || hydrometerTempFRef === null) {
                    setToast({
                      open: true,
                      message: 'No se pudo convertir la temperatura a Fahrenheit.',
                      severity: 'error',
                    })
                    return
                  }
                } else if (requiresTemperatureComparison) {
                  if (!verificationForm.reference_equipment_id) {
                    setToast({
                      open: true,
                      message: 'Selecciona un equipo patron.',
                      severity: 'error',
                    })
                    return
                  }
                  if (isMonthlyVerification) {
                    const requiredFields = [
                      verificationForm.reading_under_test_high_value,
                      verificationForm.reading_under_test_mid_value,
                      verificationForm.reading_under_test_low_value,
                      verificationForm.reference_reading_high_value,
                      verificationForm.reference_reading_mid_value,
                      verificationForm.reference_reading_low_value,
                    ]
                    if (requiredFields.some((value) => value === '')) {
                      setToast({
                        open: true,
                        message: 'Ingresa lecturas alta, media y baja en ambos equipos.',
                        severity: 'error',
                      })
                      return
                    }
                    if (
                      requiredFields.some((value) => Number.isNaN(Number(value)))
                    ) {
                      setToast({
                        open: true,
                        message: 'Las lecturas deben ser valores numericos validos.',
                        severity: 'error',
                      })
                      return
                    }
                  } else {
                    if (
                      verificationForm.reading_under_test_f === '' ||
                      verificationForm.reference_reading_f === ''
                    ) {
                      setToast({
                        open: true,
                        message: 'Ingresa la lectura del equipo y la lectura del patron.',
                        severity: 'error',
                      })
                      return
                    }
                    if (
                      Number.isNaN(Number(verificationForm.reading_under_test_f)) ||
                      Number.isNaN(Number(verificationForm.reference_reading_f))
                    ) {
                      setToast({
                        open: true,
                        message: 'Las lecturas deben ser valores numericos validos.',
                        severity: 'error',
                      })
                      return
                    }
                  }
                } else if (requiresBalanceComparison) {
                  if (!verificationForm.reference_equipment_id) {
                    setToast({
                      open: true,
                      message: 'Selecciona la pesa patron.',
                      severity: 'error',
                    })
                    return
                  }
                  if (verificationForm.balance_reading_value === '') {
                    setToast({
                      open: true,
                      message: 'Ingresa la lectura de la balanza.',
                      severity: 'error',
                    })
                    return
                  }
                  if (Number.isNaN(Number(verificationForm.balance_reading_value))) {
                    setToast({
                      open: true,
                      message: 'La lectura de la balanza debe ser numerica.',
                      severity: 'error',
                    })
                    return
                  }
                  if (
                    !selectedReferenceEquipment ||
                    selectedReferenceEquipment.nominal_mass_value === null ||
                    selectedReferenceEquipment.nominal_mass_value === undefined
                  ) {
                    setToast({
                      open: true,
                      message: 'La pesa patron no tiene peso nominal definido.',
                      severity: 'error',
                    })
                    return
                  }
                } else if (requiresKarlFischerVerification) {
                  if (!verificationForm.reference_equipment_id) {
                    setToast({
                      open: true,
                      message: 'Selecciona la balanza analitica.',
                      severity: 'error',
                    })
                    return
                  }
                  const requiredFields = [
                    verificationForm.kf_weight_1,
                    verificationForm.kf_volume_1,
                    verificationForm.kf_weight_2,
                    verificationForm.kf_volume_2,
                  ]
                  if (requiredFields.some((value) => String(value).trim() === '')) {
                    setToast({
                      open: true,
                      message: 'Completa peso y volumen para ambos ensayos.',
                      severity: 'error',
                    })
                    return
                  }
                  if (requiredFields.some((value) => Number.isNaN(Number(value)))) {
                    setToast({
                      open: true,
                      message: 'Los valores deben ser numericos validos.',
                      severity: 'error',
                    })
                    return
                  }
                  if (
                    Number(verificationForm.kf_volume_1) <= 0 ||
                    Number(verificationForm.kf_volume_2) <= 0
                  ) {
                    setToast({
                      open: true,
                      message: 'El volumen debe ser mayor que cero.',
                      severity: 'error',
                    })
                    return
                  }
                } else if (requiresTapeComparison) {
                  if (!verificationForm.reference_equipment_id) {
                    setToast({
                      open: true,
                      message: 'Selecciona un equipo patron.',
                      severity: 'error',
                    })
                    return
                  }
                  const work1 = verificationForm.reading_under_test_high_value
                  const work2 = verificationForm.reading_under_test_mid_value
                  const work3 = verificationForm.reading_under_test_low_value
                  const ref1 = verificationForm.reference_reading_high_value
                  const ref2 = verificationForm.reference_reading_mid_value
                  const ref3 = verificationForm.reference_reading_low_value
                  if (
                    work1 === '' ||
                    work2 === '' ||
                    ref1 === '' ||
                    ref2 === ''
                  ) {
                    setToast({
                      open: true,
                      message: 'Ingresa al menos dos lecturas para equipo y patron.',
                      severity: 'error',
                    })
                    return
                  }
                  const numericChecks = [work1, work2, work3, ref1, ref2, ref3]
                    .filter((value) => String(value).trim() !== '')
                    .some((value) => Number.isNaN(Number(value)))
                  if (numericChecks) {
                    setToast({
                      open: true,
                      message: 'Las lecturas deben ser valores numericos validos.',
                      severity: 'error',
                    })
                    return
                  }
                  const hasThirdWork = String(work3).trim() !== ''
                  const hasThirdRef = String(ref3).trim() !== ''
                  if (!hasThirdWork && Number(work1) !== Number(work2)) {
                    setToast({
                      open: true,
                      message: 'Si el equipo de trabajo tiene solo dos lecturas, deben ser iguales.',
                      severity: 'error',
                    })
                    return
                  }
                  if (!hasThirdRef && Number(ref1) !== Number(ref2)) {
                    setToast({
                      open: true,
                      message: 'Si el equipo patron tiene solo dos lecturas, deben ser iguales.',
                      severity: 'error',
                    })
                    return
                  }
                }
                const responses = []
                for (const item of verificationItems) {
                  const response = verificationForm.responses[item.id] || {}
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
                    if (item.response_type === 'number' && response.value_number === undefined) {
                      setToast({
                        open: true,
                        message: 'Completa los items requeridos.',
                        severity: 'error',
                      })
                      return
                    }
                  }
                  responses.push({
                    verification_item_id: item.id,
                    response_type: item.response_type,
                    value_bool:
                      item.response_type === 'boolean' ? response.value_bool : null,
                    value_text:
                      item.response_type === 'text'
                        ? String(response.value_text || '').trim()
                        : null,
                    value_number:
                      item.response_type === 'number'
                        ? Number(response.value_number)
                        : null,
                  })
                }
                setIsVerificationLoading(true)
                let notes = verificationForm.notes?.trim() || null
                if (isHydrometerMonthlyVerification) {
                  const unit = verificationForm.thermometer_unit || 'c'
                  const productLabel = verificationForm.product_name || 'Crudo'
                  const thermoId = verificationForm.thermometer_working_id
                    ? `Termometro trabajo ID: ${verificationForm.thermometer_working_id}`
                    : 'Termometro trabajo ID: -'
                  const hydroNote =
                    `[[HIDROMETRO_DATA]] Hidrometro mensual | Producto: ${productLabel} | ${thermoId} | ` +
                    `Temp trabajo: ${verificationForm.thermometer_working_value} ${unit} | ` +
                    `Hidrometro trabajo: ${verificationForm.hydrometer_working_value} API | ` +
                    `Patron ID: ${verificationForm.reference_equipment_id} | ` +
                    `Hidrometro patron: ${verificationForm.hydrometer_reference_value} API | ` +
                    `Temp patron: ${verificationForm.thermometer_reference_value} ${unit}`
                  notes = notes ? `${notes}\n${hydroNote}` : hydroNote
                }
                const payload = {
                  verification_type_id: Number(verificationForm.verification_type_id),
                  notes,
                  verified_at:
                    canEditVerificationDate && verificationForm.verified_at
                      ? verificationForm.verified_at
                      : null,
                  reference_equipment_id:
                    requiresComparisonReadings ||
                    isHydrometerMonthlyVerification ||
                    requiresKarlFischerVerification
                    ? Number(verificationForm.reference_equipment_id)
                    : null,
                  kf_weight_1: requiresKarlFischerVerification
                    ? Number(verificationForm.kf_weight_1)
                    : null,
                  kf_volume_1: requiresKarlFischerVerification
                    ? Number(verificationForm.kf_volume_1)
                    : null,
                  kf_weight_2: requiresKarlFischerVerification
                    ? Number(verificationForm.kf_weight_2)
                    : null,
                  kf_volume_2: requiresKarlFischerVerification
                    ? Number(verificationForm.kf_volume_2)
                    : null,
                  reading_under_test_value:
                    requiresBalanceComparison
                      ? Number(verificationForm.balance_reading_value)
                      : requiresTemperatureComparison && !isMonthlyVerification
                        ? Number(verificationForm.reading_under_test_f)
                        : isHydrometerMonthlyVerification
                          ? Number(verificationForm.hydrometer_working_value)
                          : null,
                  reading_under_test_unit: requiresBalanceComparison
                    ? verificationForm.balance_unit
                    : requiresComparisonReadings
                      ? verificationForm.reading_unit_under_test
                      : isHydrometerMonthlyVerification
                        ? 'api'
                      : null,
                  reference_reading_value:
                    requiresBalanceComparison
                      ? Number(selectedReferenceEquipment?.nominal_mass_value)
                      : requiresTemperatureComparison && !isMonthlyVerification
                        ? Number(verificationForm.reference_reading_f)
                        : isHydrometerMonthlyVerification
                          ? Number(verificationForm.hydrometer_reference_value)
                          : null,
                  reference_reading_unit: requiresBalanceComparison
                    ? selectedReferenceEquipment?.nominal_mass_unit || 'g'
                    : requiresComparisonReadings
                      ? verificationForm.reading_unit_reference
                      : isHydrometerMonthlyVerification
                        ? 'api'
                      : null,
                  reading_under_test_high_value:
                    (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
                      ? Number(verificationForm.reading_under_test_high_value)
                      : null,
                  reading_under_test_mid_value:
                    (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
                      ? Number(verificationForm.reading_under_test_mid_value)
                      : null,
                  reading_under_test_low_value:
                    (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
                      ? String(verificationForm.reading_under_test_low_value).trim() === ''
                        ? null
                        : Number(verificationForm.reading_under_test_low_value)
                      : null,
                  reference_reading_high_value:
                    (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
                      ? Number(verificationForm.reference_reading_high_value)
                      : null,
                  reference_reading_mid_value:
                    (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
                      ? Number(verificationForm.reference_reading_mid_value)
                      : null,
                  reference_reading_low_value:
                    (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
                      ? String(verificationForm.reference_reading_low_value).trim() === ''
                        ? null
                        : Number(verificationForm.reference_reading_low_value)
                      : null,
                  reading_under_test_f: isHydrometerMonthlyVerification
                    ? Number(hydrometerTempFWork)
                    : null,
                  reference_reading_f: isHydrometerMonthlyVerification
                    ? Number(hydrometerTempFRef)
                    : null,
                  responses,
                }
                hideVerificationDialog()
                setIsVerificationWaitOpen(true)
                try {
                  if (verificationEditingId) {
                    await updateEquipmentVerification({
                      tokenType,
                      accessToken,
                      verificationId: verificationEditingId,
                      payload,
                    })
                  } else {
                    if (verificationEditMode) {
                      const confirmReplace = window.confirm(
                        'Ya existe una verificacion hoy. Deseas reemplazarla?'
                      )
                      if (!confirmReplace) {
                        setIsVerificationWaitOpen(false)
                        setIsVerificationOpen(true)
                        return
                      }
                    }
                    await createEquipmentVerification({
                      tokenType,
                      accessToken,
                      equipmentId: verificationEquipment.id,
                      payload,
                      replaceExisting: verificationEditMode,
                    })
                  }
                  if (onEquipmentChanged) {
                    await onEquipmentChanged()
                  }
                  setToast({
                    open: true,
                    message: verificationEditingId || verificationEditMode
                      ? 'Verificacion actualizada correctamente.'
                      : 'Verificacion registrada correctamente.',
                    severity: 'success',
                  })
                  closeVerification()
                } catch (err) {
                  if (verificationEditingId) {
                    setToast({
                      open: true,
                      message: err?.detail || 'No se pudo actualizar la verificacion.',
                      severity: 'error',
                    })
                    setIsVerificationLoading(false)
                    setIsVerificationWaitOpen(false)
                    setIsVerificationOpen(true)
                    return
                  }
                  const conflict409 =
                    err?.status === 409 ||
                    err?.status_code === 409 ||
                    String(err?.detail || '').toLowerCase().includes('reemplazar')
                  if (conflict409) {
                    const confirmReplace = window.confirm(
                      'Ya se realizo una verificacion hoy. Deseas reemplazarla?'
                    )
                    if (confirmReplace) {
                      try {
                        await createEquipmentVerification({
                          tokenType,
                          accessToken,
                          equipmentId: verificationEquipment.id,
                          payload,
                          replaceExisting: true,
                        })
                        if (onEquipmentChanged) {
                          await onEquipmentChanged()
                        }
                        setToast({
                          open: true,
                          message: 'Verificacion reemplazada correctamente.',
                          severity: 'success',
                        })
                        closeVerification()
                        return
                      } catch (errReplace) {
                        setToast({
                          open: true,
                          message:
                            errReplace?.detail || 'No se pudo reemplazar la verificacion.',
                          severity: 'error',
                        })
                        setIsVerificationOpen(true)
                        return
                      }
                    }
                  }
                  setToast({
                    open: true,
                    message:
                      err?.detail ||
                      (verificationEditMode
                        ? 'No se pudo actualizar la verificacion.'
                        : 'No se pudo registrar la verificacion.'),
                    severity: 'error',
                  })
                  setIsVerificationOpen(true)
                } finally {
                  setIsVerificationLoading(false)
                  setIsVerificationWaitOpen(false)
                }
              }}
            >
              {isVerificationLoading ? 'Guardando...' : 'Guardar verificacion'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={isCalibrationOpen}
          onClose={(event, reason) => handleDialogClose(event, reason, closeCalibration)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            {calibrationEditMode ? 'Editar calibracion' : 'Registrar calibracion'}
          </DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: 2, overflow: 'visible' }}>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Equipo
                </Typography>
                <Typography>{calibrationEquipment?.serial || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo de equipo
                </Typography>
                <Typography>{calibrationEquipment?.equipment_type?.name || '-'}</Typography>
              </Box>
              {canEditCalibrationDate ? (
                <TextField
                  label="Fecha de calibracion"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={
                    calibrationForm.calibrated_at
                      ? String(calibrationForm.calibrated_at).slice(0, 10)
                      : ''
                  }
                  onChange={(event) =>
                    setCalibrationForm((prev) => ({
                      ...prev,
                      calibrated_at: event.target.value,
                    }))
                  }
                />
              ) : null}
            </Box>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              }}
            >
              <FormControl size="small" fullWidth>
                <InputLabel id="calibration-company-id-label">Empresa</InputLabel>
                <Select
                  labelId="calibration-company-id-label"
                  label="Empresa"
                  value={calibrationForm.calibration_company_id}
                  onChange={(event) =>
                    setCalibrationForm((prev) => ({
                      ...prev,
                      calibration_company_id: String(event.target.value || ''),
                    }))
                  }
                >
                  <MenuItem value="">Selecciona</MenuItem>
                  {(companies || []).map((company) => (
                    <MenuItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Selecciona una empresa registrada o escribe una nueva abajo.
                </FormHelperText>
              </FormControl>
              <TextField
                label="Empresa (otra)"
                value={calibrationForm.calibration_company_name}
                onChange={(event) =>
                  setCalibrationForm((prev) => ({
                    ...prev,
                    calibration_company_name: event.target.value,
                  }))
                }
              />
              <TextField
                label="No. certificado"
                value={calibrationForm.certificate_number}
                onChange={(event) =>
                  setCalibrationForm((prev) => ({
                    ...prev,
                    certificate_number: event.target.value,
                  }))
                }
              />
            </Box>
              {String(calibrationEquipment?.equipment_type?.name || '')
                .trim()
                .toLowerCase() !== 'balanza analitica' ? (
                <Box
                  sx={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 1,
                    p: 1.5,
                    display: 'grid',
                    gap: 1,
                  }}
                >
                  {isThermoHygrometerEquipment(calibrationEquipment) ? (
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography sx={{ fontWeight: 600 }}>
                            Resultados de medicion - Temperatura
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              setCalibrationResultsTemp((prev) => [
                                ...prev,
                                getEmptyCalibrationRow('c'),
                              ])
                            }
                          >
                            Agregar fila
                          </Button>
                        </Box>
                        {calibrationResultsTemp.length === 0 ? (
                          <Typography color="text.secondary">Sin resultados.</Typography>
                        ) : (
                          <Box sx={{ display: 'grid', gap: 1 }}>
                            {calibrationResultsTemp.map((row, index) => {
                              const refValue = Number(row.reference_value)
                              const ebcValue = Number(row.measured_value)
                              const hasRef = !Number.isNaN(refValue)
                              const hasEbc = !Number.isNaN(ebcValue)
                              const correction =
                                hasRef && hasEbc ? refValue - ebcValue : null
                              return (
                                <Box
                                  key={`cal-temp-${index}`}
                                  sx={{
                                    display: 'grid',
                                    gap: 1.5,
                                    columnGap: 1.5,
                                    gridTemplateColumns: {
                                      xs: '1fr',
                                      md: '0.9fr 1.4fr 1fr 1fr 1fr 1fr 0.6fr auto',
                                    },
                                    alignItems: 'center',
                                    mt: 0.5,
                                  }}
                                >
                                  <FormControl size="small">
                                    <InputLabel id={`cal-temp-unit-${index}`}>
                                      Unidad
                                    </InputLabel>
                                    <Select
                                      labelId={`cal-temp-unit-${index}`}
                                      label="Unidad"
                                      value={row.unit || 'c'}
                                      onChange={(event) =>
                                        setCalibrationResultsTemp((prev) =>
                                          prev.map((item, idx) =>
                                            idx === index
                                              ? { ...item, unit: event.target.value }
                                              : item
                                          )
                                        )
                                      }
                                    >
                                      <MenuItem value="c">C</MenuItem>
                                      <MenuItem value="f">F</MenuItem>
                                      <MenuItem value="k">K</MenuItem>
                                      <MenuItem value="r">R</MenuItem>
                                    </Select>
                                  </FormControl>
                                  <TextField
                                    label="Punto"
                                    size="small"
                                    value={row.point_label}
                                    onChange={(event) =>
                                      setCalibrationResultsTemp((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index
                                            ? { ...item, point_label: event.target.value }
                                            : item
                                        )
                                      )
                                    }
                                  />
                                  <TextField
                                    label="Lectura patron"
                                    size="small"
                                    type="number"
                                    value={row.reference_value}
                                    onChange={(event) =>
                                      setCalibrationResultsTemp((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index
                                            ? { ...item, reference_value: event.target.value }
                                            : item
                                        )
                                      )
                                    }
                                  />
                                  <TextField
                                    label="EBC"
                                    size="small"
                                    type="number"
                                    value={row.measured_value}
                                    onChange={(event) =>
                                      setCalibrationResultsTemp((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index
                                            ? { ...item, measured_value: event.target.value }
                                            : item
                                        )
                                      )
                                    }
                                  />
                                  <TextField
                                    label="Correccion"
                                    size="small"
                                    value={
                                      correction === null ? '' : correction.toFixed(3)
                                    }
                                    InputProps={{ readOnly: true }}
                                  />
                                  <TextField
                                    label="Incertidumbre"
                                    size="small"
                                    type="number"
                                    value={row.error_value}
                                    onChange={(event) =>
                                      setCalibrationResultsTemp((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index
                                            ? { ...item, error_value: event.target.value }
                                            : item
                                        )
                                      )
                                    }
                                  />
                                  <TextField
                                    label="k"
                                    size="small"
                                    type="number"
                                    value={row.tolerance_value}
                                    onChange={(event) =>
                                      setCalibrationResultsTemp((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index
                                            ? { ...item, tolerance_value: event.target.value }
                                            : item
                                        )
                                      )
                                    }
                                  />
                                  <IconButton
                                    size="small"
                                    aria-label="Eliminar fila"
                                    onClick={() =>
                                      setCalibrationResultsTemp((prev) =>
                                        prev.filter((_, idx) => idx !== index)
                                      )
                                    }
                                    sx={{ color: '#b91c1c' }}
                                  >
                                    <DeleteOutline fontSize="small" />
                                  </IconButton>
                                </Box>
                              )
                            })}
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography sx={{ fontWeight: 600 }}>
                            Resultados de medicion - % Humedad
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              setCalibrationResultsHumidity((prev) => [
                                ...prev,
                                getEmptyCalibrationRow('%'),
                              ])
                            }
                          >
                            Agregar fila
                          </Button>
                        </Box>
                        {calibrationResultsHumidity.length === 0 ? (
                          <Typography color="text.secondary">Sin resultados.</Typography>
                        ) : (
                          <Box sx={{ display: 'grid', gap: 1 }}>
                            {calibrationResultsHumidity.map((row, index) => {
                              const refValue = Number(row.reference_value)
                              const ebcValue = Number(row.measured_value)
                              const hasRef = !Number.isNaN(refValue)
                              const hasEbc = !Number.isNaN(ebcValue)
                              const correction =
                                hasRef && hasEbc ? refValue - ebcValue : null
                              return (
                                <Box
                                  key={`cal-hum-${index}`}
                                  sx={{
                                    display: 'grid',
                                    gap: 1.5,
                                    columnGap: 1.5,
                                    gridTemplateColumns: {
                                      xs: '1fr',
                                      md: '0.9fr 1.4fr 1fr 1fr 1fr 1fr 0.6fr auto',
                                    },
                                    alignItems: 'center',
                                    mt: 0.5,
                                  }}
                                >
                                  <FormControl size="small">
                                    <InputLabel id={`cal-hum-unit-${index}`}>
                                      Unidad
                                    </InputLabel>
                                    <Select
                                      labelId={`cal-hum-unit-${index}`}
                                      label="Unidad"
                                      value={row.unit || '%'}
                                      onChange={(event) =>
                                        setCalibrationResultsHumidity((prev) =>
                                          prev.map((item, idx) =>
                                            idx === index
                                              ? { ...item, unit: event.target.value }
                                              : item
                                          )
                                        )
                                      }
                                    >
                                      <MenuItem value="%">%</MenuItem>
                                      <MenuItem value="%rh">%RH</MenuItem>
                                      <MenuItem value="rh">RH</MenuItem>
                                    </Select>
                                  </FormControl>
                                  <TextField
                                    label="Punto"
                                    size="small"
                                    value={row.point_label}
                                    onChange={(event) =>
                                      setCalibrationResultsHumidity((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index
                                            ? { ...item, point_label: event.target.value }
                                            : item
                                        )
                                      )
                                    }
                                  />
                                  <TextField
                                    label="Lectura patron"
                                    size="small"
                                    type="number"
                                    value={row.reference_value}
                                    onChange={(event) =>
                                      setCalibrationResultsHumidity((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index
                                            ? { ...item, reference_value: event.target.value }
                                            : item
                                        )
                                      )
                                    }
                                  />
                                  <TextField
                                    label="EBC"
                                    size="small"
                                    type="number"
                                    value={row.measured_value}
                                    onChange={(event) =>
                                      setCalibrationResultsHumidity((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index
                                            ? { ...item, measured_value: event.target.value }
                                            : item
                                        )
                                      )
                                    }
                                  />
                                  <TextField
                                    label="Correccion"
                                    size="small"
                                    value={
                                      correction === null ? '' : correction.toFixed(3)
                                    }
                                    InputProps={{ readOnly: true }}
                                  />
                                  <TextField
                                    label="Incertidumbre"
                                    size="small"
                                    type="number"
                                    value={row.error_value}
                                    onChange={(event) =>
                                      setCalibrationResultsHumidity((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index
                                            ? { ...item, error_value: event.target.value }
                                            : item
                                        )
                                      )
                                    }
                                  />
                                  <TextField
                                    label="k"
                                    size="small"
                                    type="number"
                                    value={row.tolerance_value}
                                    onChange={(event) =>
                                      setCalibrationResultsHumidity((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index
                                            ? { ...item, tolerance_value: event.target.value }
                                            : item
                                        )
                                      )
                                    }
                                  />
                                  <IconButton
                                    size="small"
                                    aria-label="Eliminar fila"
                                    onClick={() =>
                                      setCalibrationResultsHumidity((prev) =>
                                        prev.filter((_, idx) => idx !== index)
                                      )
                                    }
                                    sx={{ color: '#b91c1c' }}
                                  >
                                    <DeleteOutline fontSize="small" />
                                  </IconButton>
                                </Box>
                              )
                            })}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'grid', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontWeight: 600 }}>Resultados de medicion</Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            setCalibrationResults((prev) => [
                              ...prev,
                              getEmptyCalibrationRow(
                                isHydrometerEquipment(calibrationEquipment)
                                  ? 'api'
                                  : isKarlFischerEquipment(calibrationEquipment)
                                    ? 'ml'
                                    : isWeightEquipmentType(calibrationEquipment?.equipment_type)
                                      ? 'g'
                                      : ''
                              ),
                            ])
                          }
                        >
                          Agregar fila
                        </Button>
                      </Box>
                      {calibrationResults.length === 0 ? (
                        <Typography color="text.secondary">Sin resultados.</Typography>
                      ) : (
                      <Box sx={{ display: 'grid', gap: 1 }}>
                  {isWeightEquipmentType(calibrationEquipment?.equipment_type) ? (
                    calibrationResults.map((row, index) => (
                      <Box
                        key={`cal-row-${index}`}
                        sx={{
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns: { xs: '1fr', md: '0.8fr 1.2fr 1fr 1fr auto' },
                          alignItems: 'center',
                        }}
                      >
                        <FormControl size="small">
                          <InputLabel id={`cal-weight-unit-${index}`}>Unidad</InputLabel>
                          <Select
                            labelId={`cal-weight-unit-${index}`}
                            label="Unidad"
                            value={row.unit || 'g'}
                            onChange={(event) =>
                              setCalibrationResults((prev) =>
                                prev.map((item, idx) =>
                                  idx === index ? { ...item, unit: event.target.value } : item
                                )
                              )
                            }
                          >
                            <MenuItem value="g">g</MenuItem>
                            <MenuItem value="mg">mg</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          label="Punto"
                          size="small"
                          value={row.point_label}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, point_label: event.target.value } : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Incertidumbre"
                          size="small"
                          type="number"
                          value={row.error_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, error_value: event.target.value } : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="k"
                          size="small"
                          type="number"
                          value={row.tolerance_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, tolerance_value: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <IconButton
                          size="small"
                          aria-label="Eliminar fila"
                          onClick={() =>
                            setCalibrationResults((prev) =>
                              prev.filter((_, idx) => idx !== index)
                            )
                          }
                          sx={{ color: '#b91c1c' }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  ) : isThermometerEquipment(calibrationEquipment) ? (
                    calibrationResults.map((row, index) => {
                      const refValue = Number(row.reference_value)
                      const ebcValue = Number(row.measured_value)
                      const hasRef = !Number.isNaN(refValue)
                      const hasEbc = !Number.isNaN(ebcValue)
                      const correction =
                        hasRef && hasEbc ? refValue - ebcValue : null
                      return (
                        <Box
                          key={`cal-row-${index}`}
                          sx={{
                            display: 'grid',
                            gap: 1.5,
                            columnGap: 1.5,
                            gridTemplateColumns: {
                              xs: '1fr',
                              md: '0.9fr 1.4fr 1fr 1fr 1fr 1fr 0.6fr auto',
                            },
                            alignItems: 'center',
                            mt: 0.5,
                          }}
                        >
                          <FormControl size="small">
                            <InputLabel id={`cal-unit-${index}`}>Unidad</InputLabel>
                            <Select
                              labelId={`cal-unit-${index}`}
                              label="Unidad"
                              value={row.unit || ''}
                              onChange={(event) =>
                                setCalibrationResults((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index
                                      ? { ...item, unit: event.target.value }
                                      : item
                                  )
                                )
                              }
                            >
                              <MenuItem value="">-</MenuItem>
                              <MenuItem value="c">C</MenuItem>
                              <MenuItem value="f">F</MenuItem>
                              <MenuItem value="k">K</MenuItem>
                              <MenuItem value="r">R</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                            label="Punto"
                            size="small"
                            value={row.point_label}
                            onChange={(event) =>
                              setCalibrationResults((prev) =>
                                prev.map((item, idx) =>
                                  idx === index
                                    ? { ...item, point_label: event.target.value }
                                    : item
                                )
                              )
                            }
                          />
                          <TextField
                            label="Lectura patron"
                            size="small"
                            type="number"
                            value={row.reference_value}
                            onChange={(event) =>
                              setCalibrationResults((prev) =>
                                prev.map((item, idx) =>
                                  idx === index
                                    ? { ...item, reference_value: event.target.value }
                                    : item
                                )
                              )
                            }
                          />
                          <TextField
                            label="EBC"
                            size="small"
                            type="number"
                            value={row.measured_value}
                            onChange={(event) =>
                              setCalibrationResults((prev) =>
                                prev.map((item, idx) =>
                                  idx === index
                                    ? { ...item, measured_value: event.target.value }
                                    : item
                                )
                              )
                            }
                          />
                          <TextField
                            label="Correccion"
                            size="small"
                            value={
                              correction === null ? '' : correction.toFixed(3)
                            }
                            InputProps={{ readOnly: true }}
                          />
                          <TextField
                            label="Incertidumbre"
                            size="small"
                            type="number"
                            value={row.error_value}
                            onChange={(event) =>
                              setCalibrationResults((prev) =>
                                prev.map((item, idx) =>
                                  idx === index
                                    ? { ...item, error_value: event.target.value }
                                    : item
                                )
                              )
                            }
                          />
                          <TextField
                            label="k"
                            size="small"
                            type="number"
                            value={row.tolerance_value}
                            onChange={(event) =>
                              setCalibrationResults((prev) =>
                                prev.map((item, idx) =>
                                  idx === index
                                    ? { ...item, tolerance_value: event.target.value }
                                    : item
                                )
                              )
                            }
                          />
                          <IconButton
                            size="small"
                            aria-label="Eliminar fila"
                            onClick={() =>
                              setCalibrationResults((prev) =>
                                prev.filter((_, idx) => idx !== index)
                              )
                            }
                            sx={{ color: '#b91c1c' }}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Box>
                      )
                    })
                  ) : isHydrometerEquipment(calibrationEquipment) ? (
                    calibrationResults.map((row, index) => (
                      <Box
                        key={`cal-row-${index}`}
                        sx={{
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: '1fr 1fr 1fr 1fr 0.7fr 0.6fr auto',
                          },
                          alignItems: 'center',
                        }}
                      >
                        <TextField
                          label="Punto"
                          size="small"
                          value={row.point_label}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, point_label: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Lectura patron"
                          size="small"
                          type="number"
                          value={row.reference_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, reference_value: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Lectura instrumento"
                          size="small"
                          type="number"
                          value={row.measured_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, measured_value: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Incertidumbre"
                          size="small"
                          type="number"
                          value={row.error_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, error_value: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="k"
                          size="small"
                          type="number"
                          value={row.tolerance_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, tolerance_value: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Unidad"
                          size="small"
                          value="API"
                          InputProps={{ readOnly: true }}
                        />
                        <IconButton
                          size="small"
                          aria-label="Eliminar fila"
                          onClick={() =>
                            setCalibrationResults((prev) =>
                              prev.filter((_, idx) => idx !== index)
                            )
                          }
                          sx={{ color: '#b91c1c' }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  ) : isKarlFischerEquipment(calibrationEquipment) ? (
                    calibrationResults.map((row, index) => (
                      <Box
                        key={`cal-row-${index}`}
                        sx={{
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: '0.8fr 0.9fr 1fr 1fr 1fr 1fr 1fr 1fr 0.8fr auto',
                          },
                          alignItems: 'center',
                        }}
                      >
                        <FormControl size="small">
                          <InputLabel id={`kf-unit-${index}`}>Unidad</InputLabel>
                          <Select
                            labelId={`kf-unit-${index}`}
                            label="Unidad"
                            value={row.unit || 'ml'}
                            onChange={(event) =>
                              setCalibrationResults((prev) =>
                                prev.map((item, idx) =>
                                  idx === index ? { ...item, unit: event.target.value } : item
                                )
                              )
                            }
                          >
                            <MenuItem value="ml">mL</MenuItem>
                            <MenuItem value="l">L</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          label="Punto"
                          size="small"
                          value={row.point_label}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, point_label: event.target.value } : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Volumen calculado"
                          size="small"
                          type="number"
                          value={row.volume_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, volume_value: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Error sistematico"
                          size="small"
                          type="number"
                          value={row.systematic_error}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, systematic_error: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="EMP sistematico"
                          size="small"
                          type="number"
                          value={row.systematic_emp}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, systematic_emp: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Error aleatorio"
                          size="small"
                          type="number"
                          value={row.random_error}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, random_error: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="EMP aleatorio"
                          size="small"
                          type="number"
                          value={row.random_emp}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, random_emp: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Incertidumbre"
                          size="small"
                          type="number"
                          value={row.uncertainty_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index
                                  ? { ...item, uncertainty_value: event.target.value }
                                  : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="k"
                          size="small"
                          type="number"
                          value={row.k_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, k_value: event.target.value } : item
                              )
                            )
                          }
                        />
                        <IconButton
                          size="small"
                          aria-label="Eliminar fila"
                          onClick={() =>
                            setCalibrationResults((prev) =>
                              prev.filter((_, idx) => idx !== index)
                            )
                          }
                          sx={{ color: '#b91c1c' }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  ) : (
                    calibrationResults.map((row, index) => (
                      <Box
                        key={`cal-row-${index}`}
                        sx={{
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr 1fr 1fr 1fr auto' },
                          alignItems: 'center',
                        }}
                      >
                        <TextField
                          label="Punto"
                          size="small"
                          value={row.point_label}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, point_label: event.target.value } : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Ref"
                          size="small"
                          type="number"
                          value={row.reference_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, reference_value: event.target.value } : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Medido"
                          size="small"
                          type="number"
                          value={row.measured_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, measured_value: event.target.value } : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Unidad"
                          size="small"
                          value={row.unit}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, unit: event.target.value } : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Error"
                          size="small"
                          type="number"
                          value={row.error_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, error_value: event.target.value } : item
                              )
                            )
                          }
                        />
                        <TextField
                          label="Tol"
                          size="small"
                          type="number"
                          value={row.tolerance_value}
                          onChange={(event) =>
                            setCalibrationResults((prev) =>
                              prev.map((item, idx) =>
                                idx === index ? { ...item, tolerance_value: event.target.value } : item
                              )
                            )
                          }
                        />
                        <FormControl size="small">
                          <InputLabel id={`cal-ok-${index}`}>OK</InputLabel>
                          <Select
                            labelId={`cal-ok-${index}`}
                            label="OK"
                            value={row.is_ok}
                            onChange={(event) =>
                              setCalibrationResults((prev) =>
                                prev.map((item, idx) =>
                                  idx === index ? { ...item, is_ok: event.target.value } : item
                                )
                              )
                            }
                          >
                            <MenuItem value="">-</MenuItem>
                            <MenuItem value="true">Si</MenuItem>
                            <MenuItem value="false">No</MenuItem>
                          </Select>
                        </FormControl>
                        <IconButton
                          size="small"
                          aria-label="Eliminar fila"
                          onClick={() =>
                            setCalibrationResults((prev) =>
                              prev.filter((_, idx) => idx !== index)
                            )
                          }
                          sx={{ color: '#b91c1c' }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  )}
                  </Box>
                )}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    border: '1px dashed #e5e7eb',
                    borderRadius: 1,
                    p: 1.5,
                    display: 'grid',
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>
                    Resultados de medicion (no requeridos por ahora)
                  </Typography>
                </Box>
              )}
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' },
                alignItems: 'center',
              }}
            >
              <Button variant="outlined" component="label">
                Subir certificado (PDF)
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null
                    setCalibrationFile(file)
                  }}
                />
              </Button>
              <Typography color="text.secondary">
                {calibrationFile ? calibrationFile.name : 'Sin archivo seleccionado'}
              </Typography>
            </Box>
            <TextField
              label="Observaciones"
              value={calibrationForm.notes}
              onChange={(event) =>
                setCalibrationForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              multiline
              minRows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCalibration}>Cancelar</Button>
            <Button
              variant="contained"
              disabled={isCalibrationLoading}
              onClick={async () => {
                if (!calibrationEquipment) return
                const companyId = String(calibrationForm.calibration_company_id || '').trim()
                const companyName = String(calibrationForm.calibration_company_name || '').trim()
                const certificateNumber = String(
                  calibrationForm.certificate_number || ''
                ).trim()
                if (!companyId && !companyName) {
                  setToast({
                    open: true,
                    message: 'Selecciona una empresa o escribe un nombre.',
                    severity: 'error',
                  })
                  return
                }
                if (!certificateNumber) {
                  setToast({
                    open: true,
                    message: 'El numero de certificado es obligatorio.',
                    severity: 'error',
                  })
                  return
                }
                const isHydrometer = isHydrometerEquipment(calibrationEquipment)
                const isThermoHygro = isThermoHygrometerEquipment(calibrationEquipment)
                const isRowFilled = (row) => {
                  const hasValue =
                    String(row.point_label || '').trim() ||
                    String(row.reference_value || '').trim() ||
                    String(row.measured_value || '').trim() ||
                    String(row.unit || '').trim() ||
                    String(row.error_value || '').trim() ||
                    String(row.tolerance_value || '').trim() ||
                    String(row.volume_value || '').trim() ||
                    String(row.systematic_error || '').trim() ||
                    String(row.systematic_emp || '').trim() ||
                    String(row.random_error || '').trim() ||
                    String(row.random_emp || '').trim() ||
                    String(row.uncertainty_value || '').trim() ||
                    String(row.k_value || '').trim() ||
                    String(row.notes || '').trim() ||
                    row.is_ok === 'true' ||
                    row.is_ok === 'false'
                  return Boolean(hasValue)
                }
                const mapRow = (row, overrides = {}) => ({
                  point_label: row.point_label?.trim() || null,
                  reference_value:
                    String(row.reference_value).trim() === ''
                      ? null
                      : Number(row.reference_value),
                  measured_value:
                    String(row.measured_value).trim() === ''
                      ? null
                      : Number(row.measured_value),
                  unit: isHydrometer ? 'api' : row.unit?.trim() || null,
                  error_value:
                    String(row.error_value).trim() === ''
                      ? null
                      : Number(row.error_value),
                  tolerance_value:
                    String(row.tolerance_value).trim() === ''
                      ? null
                      : Number(row.tolerance_value),
                  volume_value:
                    String(row.volume_value).trim() === ''
                      ? null
                      : Number(row.volume_value),
                  systematic_error:
                    String(row.systematic_error).trim() === ''
                      ? null
                      : Number(row.systematic_error),
                  systematic_emp:
                    String(row.systematic_emp).trim() === ''
                      ? null
                      : Number(row.systematic_emp),
                  random_error:
                    String(row.random_error).trim() === ''
                      ? null
                      : Number(row.random_error),
                  random_emp:
                    String(row.random_emp).trim() === ''
                      ? null
                      : Number(row.random_emp),
                  uncertainty_value:
                    String(row.uncertainty_value).trim() === ''
                      ? null
                      : Number(row.uncertainty_value),
                  k_value:
                    String(row.k_value).trim() === ''
                      ? null
                      : Number(row.k_value),
                  is_ok:
                    row.is_ok === 'true'
                      ? true
                      : row.is_ok === 'false'
                        ? false
                        : null,
                  notes: row.notes?.trim() || null,
                  ...overrides,
                })
                let results = []
                if (isThermoHygro) {
                  const tempRows = calibrationResultsTemp.filter(isRowFilled)
                  const humidityRows = calibrationResultsHumidity.filter(isRowFilled)
                  if (tempRows.length === 0 || humidityRows.length === 0) {
                    setToast({
                      open: true,
                      message:
                        'El Termohigrometro requiere resultados en Temperatura y Humedad.',
                      severity: 'error',
                    })
                    return
                  }
                  results = [
                    ...tempRows.map((row) =>
                      mapRow(row, { unit: row.unit?.trim() || 'c' })
                    ),
                    ...humidityRows.map((row) =>
                      mapRow(row, { unit: row.unit?.trim() || '%' })
                    ),
                  ]
                } else {
                  results = calibrationResults
                    .filter(isRowFilled)
                    .map((row) => mapRow(row))
                }
                const payload = {
                  calibrated_at:
                    canEditCalibrationDate && calibrationForm.calibrated_at
                      ? calibrationForm.calibrated_at
                      : null,
                  calibration_company_id: companyId ? Number(companyId) : null,
                  calibration_company_name: companyName || null,
                  certificate_number: certificateNumber,
                  notes: calibrationForm.notes?.trim() || null,
                  results,
                }
                hideCalibrationDialog()
                setIsCalibrationWaitOpen(true)
                setIsCalibrationLoading(true)
                try {
                  let calibrationId = calibrationEditingId
                  if (calibrationEditingId) {
                    await updateEquipmentCalibration({
                      tokenType,
                      accessToken,
                      calibrationId: calibrationEditingId,
                      payload,
                    })
                  } else {
                    const created = await createEquipmentCalibration({
                      tokenType,
                      accessToken,
                      equipmentId: calibrationEquipment.id,
                      payload,
                    })
                    calibrationId = created?.id || null
                  }
                  if (calibrationFile && calibrationId) {
                    await uploadEquipmentCalibrationCertificate({
                      tokenType,
                      accessToken,
                      calibrationId,
                      file: calibrationFile,
                    })
                  }
                  if (onEquipmentChanged) {
                    await onEquipmentChanged()
                  }
                  setToast({
                    open: true,
                    message: calibrationEditingId
                      ? 'Calibracion actualizada correctamente.'
                      : 'Calibracion registrada correctamente.',
                    severity: 'success',
                  })
                  closeCalibration()
                } catch (err) {
                  setToast({
                    open: true,
                    message:
                      err?.detail ||
                      (calibrationEditingId
                        ? 'No se pudo actualizar la calibracion.'
                        : 'No se pudo registrar la calibracion.'),
                    severity: 'error',
                  })
                  setIsCalibrationOpen(true)
                } finally {
                  setIsCalibrationLoading(false)
                  setIsCalibrationWaitOpen(false)
                }
              }}
            >
              {isCalibrationLoading ? 'Guardando...' : 'Guardar calibracion'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={isDeleteOpen}
          onClose={(event, reason) => handleDialogClose(event, reason, closeDelete)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirmar eliminacion</DialogTitle>
          <DialogContent>
            <Typography>
              {deletingEquipment
                ? `Vas a eliminar el equipo ${deletingEquipment.serial}.`
                : 'Vas a eliminar este equipo.'}
            </Typography>
            <Typography sx={{ mt: 1 }} color="text.secondary">
              Si el equipo tiene operaciones, se marcara como inactivo.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDelete}>Cancelar</Button>
            <Button
              variant="contained"
              color="error"
              onClick={async () => {
                if (!deletingEquipment) return
                setIsDeleteLoading(true)
                try {
                  const result = await deleteEquipment({
                    tokenType,
                    accessToken,
                    equipmentId: deletingEquipment.id,
                  })
                  if (onEquipmentChanged) {
                    await onEquipmentChanged()
                  }
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
              }}
              disabled={isDeleteLoading}
            >
              {isDeleteLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={isCreateLoading} maxWidth="xs" fullWidth>
          <DialogTitle>Guardando equipo...</DialogTitle>
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
          <DialogTitle>Actualizando equipo...</DialogTitle>
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

export default EquipmentsTable















