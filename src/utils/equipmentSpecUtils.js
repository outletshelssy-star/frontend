const DEFAULT_DECIMALS = 2
const MAX_DECIMALS = 6

const toFiniteNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const getResolutionDecimals = (resolution, fallback = DEFAULT_DECIMALS) => {
  const numericResolution = toFiniteNumber(resolution)
  if (numericResolution === null) return fallback
  if (numericResolution === 0) return 0
  const raw = Math.ceil(-Math.log10(Math.abs(numericResolution)))
  if (!Number.isFinite(raw)) return fallback
  return Math.min(MAX_DECIMALS, Math.max(0, raw))
}

const formatWithEquipmentResolution = (value, resolution, emptyValue = '-') => {
  const numericValue = toFiniteNumber(value)
  if (numericValue === null) return emptyValue
  return numericValue.toFixed(getResolutionDecimals(resolution))
}

const isOutsideEquipmentRange = (value, spec) => {
  const numericValue = toFiniteNumber(value)
  if (numericValue === null || !spec) return false
  if (
    spec.min_value !== null &&
    spec.min_value !== undefined &&
    numericValue < spec.min_value
  ) {
    return true
  }
  if (
    spec.max_value !== null &&
    spec.max_value !== undefined &&
    numericValue > spec.max_value
  ) {
    return true
  }
  return false
}

const matchesEquipmentResolution = (value, resolution) => {
  const numericValue = toFiniteNumber(value)
  const numericResolution = toFiniteNumber(resolution)
  if (numericValue === null) return false
  if (numericResolution === null || numericResolution <= 0) return true
  const quotient = numericValue / numericResolution
  return Math.abs(quotient - Math.round(quotient)) <= 1e-9
}

const validateWithEquipmentSpec = (value, spec, label = 'lectura') => {
  const numericValue = toFiniteNumber(value)
  if (numericValue === null) {
    return { isValid: false, message: `La ${label} debe ser numérica.` }
  }
  if (isOutsideEquipmentRange(numericValue, spec)) {
    const minLabel =
      spec?.min_value !== null && spec?.min_value !== undefined
        ? formatWithEquipmentResolution(spec.min_value, spec?.resolution, '')
        : null
    const maxLabel =
      spec?.max_value !== null && spec?.max_value !== undefined
        ? formatWithEquipmentResolution(spec.max_value, spec?.resolution, '')
        : null
    if (minLabel !== null && numericValue < Number(spec.min_value)) {
      return {
        isValid: false,
        message: `La ${label} está por debajo del mínimo permitido (${minLabel}).`,
      }
    }
    if (maxLabel !== null && numericValue > Number(spec.max_value)) {
      return {
        isValid: false,
        message: `La ${label} está por encima del máximo permitido (${maxLabel}).`,
      }
    }
  }
  if (!matchesEquipmentResolution(numericValue, spec?.resolution)) {
    const resolutionLabel = formatWithEquipmentResolution(
      spec?.resolution,
      spec?.resolution,
      '',
    )
    return {
      isValid: false,
      message: `La ${label} no respeta la resolución del equipo (${resolutionLabel}).`,
    }
  }
  return { isValid: true, message: '' }
}

export {
  getResolutionDecimals,
  formatWithEquipmentResolution,
  isOutsideEquipmentRange,
  matchesEquipmentResolution,
  validateWithEquipmentSpec,
}
