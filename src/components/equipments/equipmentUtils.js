const STATUS_OPTIONS = [
  { value: 'stored', label: 'Almacenado' },
  { value: 'in_use', label: 'En uso' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'needs_review', label: 'Requiere revisi\u00f3n' },
  { value: 'lost', label: 'Retirado' },
  { value: 'disposed', label: 'Desechado' },
  { value: 'unknown', label: 'Desconocido' },
]

const EQUIPMENT_ROLE_LABELS = {
  reference: 'Patr\u00f3n',
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

const EMPTY_EQUIPMENTS = []

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
  const value = Number.isInteger(numeric)
    ? String(numeric)
    : String(numeric).replace(/0+$/, '').replace(/\.$/, '')
  return `${value}G`
}

const normalizeWeightToGrams = (value, unit) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  const key = String(unit || '')
    .trim()
    .toLowerCase()
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

const getLatestApprovedInspectionDate = (inspections = []) => {
  if (!Array.isArray(inspections)) return null
  const validDates = inspections
    .filter((inspection) => inspection?.is_ok === true)
    .map((inspection) => new Date(inspection?.inspected_at))
    .filter((date) => !Number.isNaN(date.getTime()))
  if (!validDates.length) return null
  return validDates.reduce((max, current) => (current > max ? current : max))
}

const DAY_IN_MS = 1000 * 60 * 60 * 24

const getLocalDayStart = (value) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate())

const isInspectionVigente = (equipment) => {
  const days = equipment?.inspection_days_override ?? equipment?.equipment_type?.inspection_days
  const frequencyDays = Number(days ?? 0)
  if (frequencyDays <= 0) return true
  const lastApprovedDate = getLatestApprovedInspectionDate(equipment?.inspections)
  if (!lastApprovedDate) return false
  const todayStart = getLocalDayStart(new Date())
  const approvedDayStart = getLocalDayStart(lastApprovedDate)
  const diffMs = todayStart.getTime() - approvedDayStart.getTime()
  const diffDays = Math.floor(diffMs / DAY_IN_MS)
  if (diffDays < 0) return false
  if (frequencyDays === 1) {
    return diffDays === 0
  }
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

export {
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
}
